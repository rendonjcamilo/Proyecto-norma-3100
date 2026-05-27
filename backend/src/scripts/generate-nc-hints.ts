/**
 * Script: generate-nc-hints.ts
 * Genera observaciones de no cumplimiento (nc_hint) para cada criterio de la Norma 3100
 * usando Claude API y las almacena en la columna nc_hint de evaluation_criteria.
 *
 * Ejecutar una sola vez (o cuando se agreguen nuevos criterios):
 *   cd backend
 *   npx tsx src/scripts/generate-nc-hints.ts
 *
 * Requiere:
 *   - ANTHROPIC_API_KEY en backend/.env
 *   - DB accesible (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD en .env)
 */

import Anthropic from '@anthropic-ai/sdk';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../.env') });

// ─── Clientes ──────────────────────────────────────────────────────────────────

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'norma3100',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres_dev_password',
});

// ─── Prompt ────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Eres un auditor experto en habilitación de servicios de salud en Colombia, con amplio conocimiento en la Resolución 3100 de 2019 del Ministerio de Salud y Protección Social.

Tu tarea es redactar observaciones de no cumplimiento (hallazgos de auditoría) en español formal colombiano, a partir del texto de un criterio de habilitación.

Reglas estrictas:
1. El criterio está redactado como una AFIRMACIÓN de lo que el prestador DEBE tener o hacer.
2. Tu hallazgo debe ser gramaticalmente correcto y NO contradictorio internamente.
3. USA el modo SUBJUNTIVO correctamente cuando corresponda (ej: "cuente con", "disponga de", "garantice").
4. NO copies el criterio verbatim con solo "No se evidencia que:" adelante — eso produce contradicciones.
5. Sé específico: menciona QUÉ no se encontró o no fue demostrado durante la evaluación.
6. Máximo 2 oraciones. Lenguaje formal, conciso y directo.
7. Si el criterio es un título de sección (sin verbo de acción), responde: "No aplica como criterio evaluable de forma independiente."
8. Responde ÚNICAMENTE con el texto del hallazgo, sin explicaciones ni comillas.

Ejemplos correctos:
- Criterio: "El talento humano en salud cuentan con los títulos de educación superior expedidos por la entidad educativa competente."
  Hallazgo: "No se evidencia que el talento humano en salud cuente con los títulos de educación superior o certificados de aptitud ocupacional expedidos por la entidad educativa competente."

- Criterio: "Las edificaciones cuentan con tanque de almacenamiento de agua para garantizar 24 horas de servicio continuo."
  Hallazgo: "No se acredita que la edificación cuente con tanque de almacenamiento de agua que garantice una reserva mínima de 24 horas de servicio continuo."

- Criterio: "El prestador tiene disponibilidad de coordinador operativo de trasplantes."
  Hallazgo: "No se evidencia disponibilidad de coordinador operativo de trasplantes para los servicios de cuidado intensivo que lo requieren."`;

// ─── Función principal ─────────────────────────────────────────────────────────

async function generateHint(criterionName: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Criterio: "${criterionName}"`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') {throw new Error('Respuesta inesperada del modelo');}
  return content.text.trim();
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('🔍 Cargando criterios desde la base de datos...');

  const result = await pool.query<{ id: string; code: string; name: string; nc_hint: string | null }>(
    `SELECT id, code, name, nc_hint
     FROM evaluation_criteria
     WHERE status = 'active'
     ORDER BY code`
  );

  const criteria = result.rows;
  const total = criteria.length;
  const sinHint = criteria.filter((c) => !c.nc_hint);

  console.log(`📋 Total criterios activos: ${total}`);
  console.log(`⚠️  Sin nc_hint: ${sinHint.length}`);

  if (sinHint.length === 0) {
    console.log('✅ Todos los criterios ya tienen nc_hint. Nada que hacer.');
    await pool.end();
    return;
  }

  console.log('\n🚀 Generando observaciones de no cumplimiento...\n');

  let procesados = 0;
  let errores = 0;

  for (const criterion of sinHint) {
    try {
      const hint = await generateHint(criterion.name);

      await pool.query(
        'UPDATE evaluation_criteria SET nc_hint = $1 WHERE id = $2',
        [hint, criterion.id]
      );

      procesados++;
      const pct = Math.round((procesados / sinHint.length) * 100);
      process.stdout.write(
        `\r[${pct}%] ${procesados}/${sinHint.length} — ${criterion.code}: ${hint.substring(0, 60)}...`
      );

      // Pausa entre llamadas para respetar rate limits (Haiku: 1000 req/min)
      await sleep(80);
    } catch (err) {
      errores++;
      console.error(`\n❌ Error en ${criterion.code}: ${(err as Error).message}`);
      await sleep(2000); // Espera más larga si hay error
    }
  }

  console.log(`\n\n✅ Completado: ${procesados} criterios actualizados, ${errores} errores.`);
  await pool.end();
}

main().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
