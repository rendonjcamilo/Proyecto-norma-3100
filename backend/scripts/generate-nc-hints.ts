/**
 * Genera sugerencias de descripción de hallazgo (nc_hint) para todos los
 * criterios de la tabla evaluation_criteria usando la API de Anthropic.
 *
 * Uso:
 *   ANTHROPIC_API_KEY=sk-ant-... npx tsx scripts/generate-nc-hints.ts
 *
 * Opciones:
 *   --batch-size N   Criterios por llamada a la API (default: 20)
 *   --dry-run        Imprime los hints generados sin actualizar la BD
 *   --from CODE      Reanuda desde un código de criterio (ej: TSDOT-010)
 */

import Anthropic from '@anthropic-ai/sdk';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// ── Configuración ─────────────────────────────────────────────────────────────

const BATCH_SIZE = parseInt(
  process.argv.find((a) => a.startsWith('--batch-size='))?.split('=')[1] ?? '20'
);
const DRY_RUN = process.argv.includes('--dry-run');
const FROM_CODE = process.argv.find((a) => a.startsWith('--from='))?.split('=')[1];
const ALL_CRITERIA = process.argv.includes('--all'); // por defecto solo transversales (TS*)

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'norma3100',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres_dev_password',
};

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY no está definido en las variables de entorno.');
  console.error('Uso: ANTHROPIC_API_KEY=sk-ant-... npx tsx scripts/generate-nc-hints.ts');
  process.exit(1);
}

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface CriterionRow {
  id: string;
  code: string;
  name: string;
  description: string;
}

interface NcHintResult {
  id: string;
  nc_hint: string;
}

// ── Prompt ────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Eres un auditor experto en habilitación de servicios de salud en Colombia, especializado en la Resolución 3100 de 2019 del Ministerio de Salud. Tu tarea es generar descripciones precisas de hallazgos de incumplimiento (no conformidades) para criterios de autoevaluación.

INSTRUCCIONES:
1. Para cada criterio, redacta UNA descripción de hallazgo que describe la situación cuando ese criterio NO se cumple.
2. La descripción debe ser en español colombiano, en tercera persona, tono formal de auditoría.
3. Debe describir la AUSENCIA o DEFICIENCIA concreta, no simplemente negar el criterio.
4. Evita frases como "No se cumple que:", "El criterio no se cumple", "El prestador no cumple con".
5. En cambio, describe la condición de no cumplimiento de forma directa y específica:
   - "El prestador carece de política documentada de selección de personal."
   - "No se evidencia un mecanismo formal de verificación de títulos del personal."
   - "Los registros de dotación se encuentran incompletos o desactualizados."
6. Longitud objetivo: 1–2 oraciones concisas (máximo 150 caracteres).
7. Devuelve ÚNICAMENTE un array JSON con objetos {id, nc_hint}. Sin texto adicional, sin markdown.`;

function buildUserMessage(criteria: CriterionRow[]): string {
  const items = criteria.map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    description: c.description?.substring(0, 200) || '',
  }));
  return `Genera un nc_hint para cada uno de estos criterios:\n\n${JSON.stringify(items, null, 2)}`;
}

// ── Llamada a la API con reintento ────────────────────────────────────────────

async function generateHintsForBatch(
  client: Anthropic,
  criteria: CriterionRow[],
  attempt = 1
): Promise<NcHintResult[]> {
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserMessage(criteria) }],
    });

    const text = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('');

    // Extraer JSON del texto (podría tener markdown)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error(`Respuesta no contiene array JSON válido:\n${text.substring(0, 300)}`);
    }

    const results: NcHintResult[] = JSON.parse(jsonMatch[0]);

    // Validar que cada resultado tenga los campos esperados
    for (const r of results) {
      if (!r.id || typeof r.nc_hint !== 'string') {
        throw new Error(`Resultado inválido: ${JSON.stringify(r)}`);
      }
      // Truncar si excede 255 chars
      if (r.nc_hint.length > 255) {
        r.nc_hint = r.nc_hint.substring(0, 252) + '...';
      }
    }

    return results;
  } catch (err) {
    if (attempt < 3) {
      const delay = attempt * 5000;
      console.warn(`  ⚠️  Error en intento ${attempt}, reintentando en ${delay / 1000}s...`);
      await sleep(delay);
      return generateHintsForBatch(client, criteria, attempt + 1);
    }
    throw err;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function chunks<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const pool = new Pool(DB_CONFIG);
  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  try {
    // Conectar y verificar
    await pool.query('SELECT 1');
    console.log('✅ Conectado a PostgreSQL');

    // Por defecto procesa solo los 512 criterios transversales (code ~ '^TS').
    // Usa --all para procesar todos los criterios (incluye los 3,190 específicos de servicio).
    const transversalFilter = ALL_CRITERIA ? '' : "AND code ~ '^TS'";

    let query: string;
    let queryParams: string[] = [];

    if (FROM_CODE) {
      query = `
        SELECT DISTINCT ON (code) id, code, name, COALESCE(description, name) AS description
        FROM evaluation_criteria
        WHERE nc_hint IS NULL AND code >= $1 ${transversalFilter}
        ORDER BY code, id
      `;
      queryParams = [FROM_CODE];
    } else {
      query = `
        SELECT DISTINCT ON (code) id, code, name, COALESCE(description, name) AS description
        FROM evaluation_criteria
        WHERE nc_hint IS NULL ${transversalFilter}
        ORDER BY code, id
      `;
    }

    const { rows: allCriteria } = await pool.query<CriterionRow>(query, queryParams);

    if (allCriteria.length === 0) {
      console.log('✅ Todos los criterios ya tienen nc_hint. Nada que hacer.');
      return;
    }

    console.log(`📋 Códigos únicos a procesar: ${allCriteria.length} ${ALL_CRITERIA ? '(todos)' : '(solo transversales TS*)'}`);
    console.log(`📦 Tamaño de batch: ${BATCH_SIZE}`);
    if (DRY_RUN) console.log('🔍 Modo dry-run — no se actualizará la BD');
    console.log('');

    const batches = chunks(allCriteria, BATCH_SIZE);
    let totalProcessed = 0;
    let totalErrors = 0;

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const firstCode = batch[0].code;
      const lastCode = batch[batch.length - 1].code;
      process.stdout.write(
        `[${i + 1}/${batches.length}] ${firstCode} → ${lastCode} (${batch.length} criterios)... `
      );

      try {
        const results = await generateHintsForBatch(client, batch);

        if (DRY_RUN) {
          console.log('');
          for (const r of results) {
            const crit = batch.find((c) => c.id === r.id);
            console.log(`  ${crit?.code}: ${r.nc_hint}`);
          }
        } else {
          // Construir mapa id → code para lookups seguros
          const idToCode = new Map(batch.map((c) => [c.id, c.code]));

          // Actualizar BD: propagar el hint a TODAS las filas con ese código
          const pgClient = await pool.connect();
          try {
            await pgClient.query('BEGIN');
            let totalRows = 0;
            for (const r of results) {
              const code = idToCode.get(r.id);
              if (!code) {
                console.warn(`  ⚠️  ID desconocido en respuesta: ${r.id} — saltando`);
                continue;
              }
              const res = await pgClient.query(
                'UPDATE evaluation_criteria SET nc_hint = $1 WHERE code = $2 RETURNING id',
                [r.nc_hint, code]
              );
              totalRows += res.rowCount ?? 0;
            }
            await pgClient.query('COMMIT');
            console.log(`✓ (${results.length} códigos → ${totalRows} filas actualizadas)`);
          } catch (updateErr) {
            await pgClient.query('ROLLBACK');
            throw updateErr;
          } finally {
            pgClient.release();
          }
        }

        totalProcessed += batch.length;
      } catch (err) {
        console.error(`✗ Error en batch: ${err instanceof Error ? err.message : err}`);
        totalErrors += batch.length;
      }

      // Pausa entre batches para respetar rate limits
      if (i < batches.length - 1) {
        await sleep(1000);
      }
    }

    console.log('');
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✅ Completado: ${totalProcessed} criterios procesados`);
    if (totalErrors > 0) {
      console.log(`❌ Con errores: ${totalErrors} criterios fallaron`);
    }
    if (DRY_RUN) {
      console.log('ℹ️  Modo dry-run: no se realizaron cambios en la BD');
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
