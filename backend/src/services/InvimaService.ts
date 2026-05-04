/**
 * InvimaService — Consulta y gestión de Registros Sanitarios INVIMA
 * Resolución 3100 / Estándar TSMD
 *
 * Flujo:
 * 1. Usuario ingresa número de registro INVIMA
 * 2. Se consulta cache local → si no existe, consulta fuente externa
 * 3. Se extrae y almacena datos del producto
 * 4. Se vincula al inventario del proveedor
 */

import { Pool } from 'pg';
import { logger } from '../utils/logger.js';

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────

export interface InvimaRegistro {
  id: string;
  numero_registro: string;
  tipo_registro: string | null;
  estado: string;
  nombre_producto: string | null;
  descripcion: string | null;
  marca: string | null;
  serie: string | null;
  categoria: string | null;
  principios_activos: string | null;
  presentaciones_autorizadas: string | null;
  clasificacion_riesgo: string | null;
  titular_registro: string | null;
  titular_fabricante: string | null;
  titular_importador: string | null;
  pais_origen: string | null;
  fecha_emision: string | null;
  fecha_vencimiento: string | null;
  fuente_datos: string;
  ultima_consulta: string;
  datos_crudos?: Record<string, string> | null;
  verificado_por: string | null;
  verificado_en: string | null;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProviderInvimaItem {
  id: string;
  provider_id: string;
  invima_registro_id: string;
  nombre_comercial: string | null;
  lote_actual: string | null;
  cantidad_disponible: number | null;
  ubicacion_almacenamiento: string | null;
  condiciones_almacenamiento: string | null;
  fecha_vencimiento_lote: string | null;
  semaforo: string;
  activo: boolean;
  // Joined from invima_registros
  numero_registro?: string;
  nombre_producto?: string;
  estado_registro?: string;
  categoria?: string;
}

export interface InvimaAlerta {
  id: string;
  numero_registro: string | null;
  tipo_alerta: string;
  titulo: string;
  descripcion: string | null;
  severidad: string;
  fecha_alerta: string;
  fuente: string | null;
  revisada_por: string | null;
  fecha_revision: string | null;
  accion_tomada: string | null;
}

export interface InvimaLookupResult {
  found: boolean;
  source: string;
  cached: boolean;
  data: Partial<InvimaRegistro> | null;
  error?: string;
}

interface InvimaProviderSummary {
  totalItems: number;
  itemsVerde: number;
  itemsNaranja: number;
  itemsAmarillo: number;
  itemsRojo: number;
  registrosVigentes: number;
  registrosNoVigentes: number;
  proximoVencimiento: string | null;
  porcentajeCumplimientoTsmd: number;
}

// ─────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────

// Dataset IDs en datos.gov.co por tipo de producto
// Actualizado 2026-04-27 con datasets verificados y correcciones de cosméticos/fitoterapéuticos/suplementos
const DATASETS_POR_TIPO: Record<string, Array<{ id: string; campo: string }>> = {
  medicamento: [
    { id: 'qj5z-zabx', campo: 'expediente' }, // Medicamentos — buscar por expediente
    { id: 'qj5z-zabx', campo: 'registrosanitario' }, // Intenta registrosanitario completo (INVIMA 2011M-XXX)
  ],
  dispositivo_medico: [
    { id: 'y4qt-w6tk', campo: 'registro_sanitario' }, // Dispositivos Médicos — campo real validado
    { id: 'y4qt-w6tk', campo: 'expediente' },
  ],
  cosmetico: [], // Sin dataset dedicado en datos.gov.co — registrar manualmente
  fitoterapeutico: [
    { id: 'k3he-53cu', campo: 'registro_sanitario' }, // Fitoterapéuticos — campo real validado
    { id: 'k3he-53cu', campo: 'expediente' },
  ],
  suplemento_dietario: [
    { id: 'uqkt-7tia', campo: 'registro_sanitario' }, // Suplementos — campo real validado
    { id: 'uqkt-7tia', campo: 'expediente' },
  ],
  reactivo_diagnostico: [
    { id: 'y4qt-w6tk', campo: 'registro_sanitario' }, // Incluidos en dataset de Dispositivos Médicos
    { id: 'y4qt-w6tk', campo: 'expediente' },
  ],
  aditivo: [
    { id: 'nrmr-kbqq', campo: 'expediente' }, // Aditivos
  ],
  alimento: [
    { id: 'uhs6-qp53', campo: 'expediente' }, // Establecimientos alimentos
  ],
  desconocido: [
    { id: 'qj5z-zabx', campo: 'expediente' }, // Fallback a medicamentos
  ],
};

const DATOS_GOV_ENDPOINT = 'https://www.datos.gov.co/resource';

// ─────────────────────────────────────────────
// SERVICIO
// ─────────────────────────────────────────────

export class InvimaService {
  constructor(private pool: Pool) {}

  // ─── LOOKUP: Buscar registro por número ───

  async lookupRegistro(
    numeroRegistro: string,
    userId?: string
  ): Promise<InvimaLookupResult> {
    const cleanNumber = numeroRegistro.trim().toUpperCase();
    const startTime = Date.now();

    // 1. Buscar en cache local
    const cached = await this.pool.query(
      `SELECT *, datos_completos AS datos_crudos FROM invima_registros WHERE numero_registro = $1`,
      [cleanNumber]
    );

    if (cached.rows.length > 0) {
      const registro = cached.rows[0];

      // Si fue consultado hace menos de 24h, devolver cache
      const lastQuery = new Date(registro.ultima_consulta);
      const hoursAgo = (Date.now() - lastQuery.getTime()) / (1000 * 60 * 60);

      if (hoursAgo < 24) {
        await this.logConsulta(cleanNumber, userId, 'cache_local', 'encontrado', Date.now() - startTime);
        return {
          found: true,
          source: 'cache_local',
          cached: true,
          data: registro,
        };
      }
    }

    // 2. Detectar tipo de producto del número de registro
    const { tipo } = this.parseNumeroRegistro(cleanNumber);

    // 3. Intentar consulta externa (datos.gov.co API abierta)
    try {
      const externalResult = await this.consultarFuenteExterna(cleanNumber, tipo);

      if (externalResult.found && externalResult.data) {
        // Upsert en cache local
        const upserted = await this.upsertRegistro({
          ...externalResult.data,
          numero_registro: cleanNumber,
          fuente_datos: externalResult.source as any,
          categoria: externalResult.data.categoria || tipo, // usar tipo como default
        });

        await this.logConsulta(cleanNumber, userId, externalResult.source, 'encontrado', Date.now() - startTime);

        return {
          found: true,
          source: externalResult.source,
          cached: false,
          data: upserted,
        };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.warn({ msg: 'INVIMA external lookup failed', numero: cleanNumber, error: errorMsg });
      await this.logConsulta(cleanNumber, userId, 'externo', 'error', Date.now() - startTime, errorMsg);
    }

    // 4. Si hay cache viejo, devolverlo con advertencia
    if (cached.rows.length > 0) {
      return {
        found: true,
        source: 'cache_local',
        cached: true,
        data: cached.rows[0],
        error: 'Datos del cache — no se pudo verificar con fuente externa',
      };
    }

    // 5. No encontrado en ningún lado
    await this.logConsulta(cleanNumber, userId, 'ninguna', 'no_encontrado', Date.now() - startTime);
    return {
      found: false,
      source: 'ninguna',
      cached: false,
      data: null,
    };
  }

  // ─── Consulta fuente externa ───

  private async consultarFuenteExterna(
    numeroRegistro: string,
    tipo: string
  ): Promise<{ found: boolean; source: string; data: Partial<InvimaRegistro> | null; rawData?: Record<string, string> }> {
    // Obtener lista de datasets para este tipo de producto
    const datasets = DATASETS_POR_TIPO[tipo] || DATASETS_POR_TIPO.desconocido;

    // Intentar cada dataset
    for (const dataset of datasets) {
      try {
        const result = await this.consultarDataset(numeroRegistro, dataset.id, dataset.campo);
        if (result) {
          return {
            found: true,
            source: 'datos_gov',
            data: result.mapped,
            rawData: result.raw,
          };
        }
      } catch (err) {
        logger.debug({
          msg: 'Dataset lookup failed',
          datasetId: dataset.id,
          numero: numeroRegistro,
          error: String(err),
        });
      }
    }

    // Intento futuro: Portal INVIMA (cuando haya API oficial)
    // TODO: Implementar cuando INVIMA publique API REST oficial

    return { found: false, source: 'ninguna', data: null };
  }

  // ─── Consulta un dataset específico ───

  private async consultarDataset(
    numeroRegistro: string,
    datasetId: string,
    campo: string
  ): Promise<{ mapped: Partial<InvimaRegistro>; raw: Record<string, string> } | null> {
    // Generar variaciones del número (ej: "2022M-0014024-R1" → también intenta "2022M-0014024")
    const variations = [numeroRegistro];
    const withoutRevision = numeroRegistro.replace(/-R\d+$/i, '');
    if (withoutRevision !== numeroRegistro) {
      variations.push(withoutRevision);
    }

    // Estrategias de búsqueda en orden de especificidad
    const attempts = [
      {
        name: 'where_equality',
        params: (num: string) => new URLSearchParams({
          $where: `${campo} = '${num}'`,
          $limit: '5',
        }),
      },
      // LIKE con prefijo: encuentra "INVIMA 2011M-0000632-R1" buscando "INVIMA 2011M-0000632"
      {
        name: 'where_like_prefix',
        params: (num: string) => new URLSearchParams({
          $where: `${campo} like '${num}%'`,
          $limit: '5',
        }),
      },
      {
        name: 'simple_field',
        params: (num: string) => new URLSearchParams({
          [campo]: num,
          $limit: '5',
        }),
      },
      {
        name: 'fulltext_search',
        params: (num: string) => new URLSearchParams({
          $q: num,
          $limit: '5',
        }),
      },
    ];

    // Intentar con cada variación del número
    for (const variation of variations) {
      for (const attempt of attempts) {
        try {
          const params = attempt.params(variation);
          const url = `${DATOS_GOV_ENDPOINT}/${datasetId}.json?${params.toString()}`;
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000);

          const response = await fetch(url, {
            signal: controller.signal,
            headers: {
              Accept: 'application/json',
              'User-Agent': 'Norma3100-ComplianceSystem/1.0',
            },
          });

          clearTimeout(timeout);

          if (!response.ok) {
            logger.debug({
              msg: 'Dataset API returned non-200',
              datasetId,
              attempt: attempt.name,
              variation,
              status: response.status,
            });
            continue;
          }

          const results = (await response.json()) as Record<string, string>[];

          if (results.length === 0) {
            logger.debug({
              msg: 'Dataset returned empty result',
              datasetId,
              attempt: attempt.name,
              variation,
            });
            continue;
          }

          const record = results[0];
          const mapped = this.mapDatosGovToRegistro(record);
          logger.debug({
            msg: 'Dataset query successful',
            datasetId,
            attempt: attempt.name,
            variation,
          });
          return { mapped, raw: record };
        } catch (err) {
          logger.debug({
            msg: 'Dataset query failed',
            datasetId,
            attempt: attempt.name,
            variation,
            error: String(err),
          });
        }
      }
    }

    return null;
  }

  // ─── Parser de número de registro ───

  private parseNumeroRegistro(numero: string): { tipo: string; formato: string } {
    // Patrones validados contra datos reales de datos.gov.co (mayo 2026)
    // Con o sin prefijo "INVIMA "
    if (/^(?:INVIMA\s+)?\d{4}DM-\d+/i.test(numero)) {
      return { tipo: 'dispositivo_medico', formato: 'INVIMA_DM' };
    }
    // RIV{año}-{num} — formato real en dataset y4qt-w6tk
    if (/^(?:INVIMA\s+)?RIV\d{4}-\d+/i.test(numero) || /^RIV\d/i.test(numero)) {
      return { tipo: 'reactivo_diagnostico', formato: 'INVIMA_RIV' };
    }
    // INVIMA {año}RD-{num} — formato real en dataset y4qt-w6tk
    if (/^(?:INVIMA\s+)?\d{4}RD-\d+/i.test(numero)) {
      return { tipo: 'reactivo_diagnostico', formato: 'INVIMA_RD' };
    }
    // SD{año}-{num} — formato real en dataset uqkt-7tia (SD va al inicio)
    if (/^SD\d{4}-\d+/i.test(numero)) {
      return { tipo: 'suplemento_dietario', formato: 'INVIMA_SD' };
    }
    // N{año}-{num} — formato real en dataset k3he-53cu (fitoterapéuticos)
    if (/^N\d{4}-\d+/i.test(numero) || /^N[-\s]*\d{3,}/i.test(numero)) {
      return { tipo: 'fitoterapeutico', formato: 'INVIMA_N_FITO' };
    }
    // INVIMA {año}M-{num} — medicamentos
    if (/^(?:INVIMA\s+)?\d{4}\s*M-\d+/i.test(numero)) {
      return { tipo: 'medicamento', formato: 'INVIMA_M' };
    }
    if (/^(?:INVIMA\s+)?\d{4}C-\d+/i.test(numero)) {
      return { tipo: 'cosmetico', formato: 'INVIMA_C' };
    }
    // INVIMA M-{num} (sin año) — medicamentos antiguos
    if (/^(?:INVIMA\s+)?M-\d+/i.test(numero)) {
      return { tipo: 'medicamento', formato: 'INVIMA_M_NOYEAR' };
    }
    if (/^MSA-\d+/i.test(numero)) {
      return { tipo: 'medicamento', formato: 'MSA' };
    }
    if (/^RSA-\d+/i.test(numero)) {
      return { tipo: 'alimento', formato: 'RSA' };
    }
    if (/^CCG-\d+/i.test(numero)) {
      return { tipo: 'cosmetico', formato: 'CCG' };
    }
    return { tipo: 'desconocido', formato: 'OTRO' };
  }

  // ─── Mapeo de datos desde datos.gov.co ───

  private mapDatosGovToRegistro(record: Record<string, string>): Partial<InvimaRegistro> {
    return {
      // registro_sanitario (con guión bajo) es el campo en dm/fito/suplementos; registrosanitario (sin) en medicamentos
      numero_registro: this.pick(record, 'registro_sanitario', 'registrosanitario', 'numero_registro', 'expediente') || '',
      // 'prodcuto' es un typo confirmado en el dataset de dispositivos médicos (y4qt-w6tk)
      nombre_producto: this.pick(record, 'prodcuto', 'producto', 'nombre_producto', 'nombre_generico', 'denominacion_comun', 'nombre') || null,
      // Descripción detallada del producto (común en dispositivos médicos)
      descripcion: this.pick(record, 'descripcion', 'descripcion_producto', 'description', 'indicaciones', 'uso_indicado', 'forma_farmaceutica') || null,
      // Marca comercial separada del nombre genérico
      marca: this.pick(record, 'marca', 'nombre_comercial', 'marca_comercial', 'trade_name') || null,
      // Serie o modelo del dispositivo médico
      serie: this.pick(record, 'modelo', 'serie', 'referencia', 'numero_modelo', 'model', 'referencia_producto') || null,
      categoria: this.inferCategoria(record),
      // 'estado_registro' (con guión bajo) es el campo correcto en dispositivos médicos
      estado: this.mapEstado(this.pick(record, 'estado_registro', 'estadoregistro', 'estado') || ''),
      titular_registro: this.pick(record, 'titular', 'interesado', 'nombre_empresa', 'razon_social', 'nombrerol', 'titular_registro') || null,
      titular_fabricante: this.pick(record, 'fabricante') || null,
      titular_importador: this.pick(record, 'importador') || null,
      pais_origen: this.pick(record, 'pais_fabricante', 'pais') || null,
      principios_activos: this.pick(record, 'principio_activo', 'composicion', 'ingrediente_activo', 'sustancia_activa', 'principioactivo') || null,
      presentaciones_autorizadas: this.pick(record, 'presentacion', 'presentaciones', 'unidadreferencia') || null,
      // 'nivel_riesgo' → clasificacion_riesgo (dispositivos médicos)
      clasificacion_riesgo: this.pick(record, 'nivel_riesgo', 'clasificacion_riesgo', 'clase_riesgo') || null,
      fecha_emision: this.pick(record, 'fecha_expedicion', 'fecha_emision', 'fecha_otorgamiento', 'fechaexpedicion') || null,
      fecha_vencimiento: this.pick(record, 'fecha_vencimiento', 'vigencia_hasta', 'vence', 'fecha_expiracion', 'fechavencimiento') || null,
      datos_crudos: record,
    };
  }

  // ─── Helper para intentar múltiples nombres de campo ───

  private pick(record: Record<string, string>, ...keys: string[]): string | null {
    for (const k of keys) {
      const val = record[k]?.trim();
      // Filtrar string literal "null" que retorna el dataset de dispositivos médicos
      if (val && val.toLowerCase() !== 'null') {
        return val;
      }
    }
    return null;
  }

  private inferCategoria(record: Record<string, string>): string {
    const tipo = (this.pick(record, 'tipo_registro', 'modalidad') || '').toLowerCase();
    if (tipo.includes('medicamento') || tipo.includes('msa') || tipo.includes('rsa')) {
      return 'medicamento';
    }
    if (tipo.includes('dispositivo') || tipo.includes('dme')) {
      return 'dispositivo_medico';
    }
    if (tipo.includes('cosmet')) {
      return 'cosmetico';
    }
    if (tipo.includes('aliment')) {
      return 'alimento';
    }
    if (tipo.includes('reactivo')) {
      return 'reactivo';
    }
    return 'otro';
  }

  private mapEstado(estado: string): string {
    const lower = estado.toLowerCase();
    if (lower.includes('vigente') || lower.includes('activo')) {
      return 'vigente';
    }
    if (lower.includes('vencido') || lower.includes('expirado')) {
      return 'vencido';
    }
    if (lower.includes('suspend')) {
      return 'suspendido';
    }
    if (lower.includes('cancel')) {
      return 'cancelado';
    }
    if (lower.includes('tramite') || lower.includes('trámite')) {
      return 'en_tramite';
    }
    return 'desconocido';
  }

  // ─── CRUD Registros ───

  async upsertRegistro(data: Partial<InvimaRegistro> & { numero_registro: string }): Promise<InvimaRegistro> {
    const result = await this.pool.query(
      `INSERT INTO invima_registros (
        numero_registro, nombre_producto, descripcion, marca, serie,
        estado, categoria,
        principios_activos, clasificacion_riesgo, titular_registro,
        titular_fabricante, titular_importador, pais_origen,
        fecha_emision, fecha_vencimiento, presentaciones_autorizadas,
        fuente_datos, datos_completos
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      ON CONFLICT (numero_registro) DO UPDATE SET
        nombre_producto           = COALESCE(EXCLUDED.nombre_producto, invima_registros.nombre_producto),
        descripcion               = COALESCE(EXCLUDED.descripcion, invima_registros.descripcion),
        marca                     = COALESCE(EXCLUDED.marca, invima_registros.marca),
        serie                     = COALESCE(EXCLUDED.serie, invima_registros.serie),
        estado                    = COALESCE(EXCLUDED.estado, invima_registros.estado),
        categoria                 = COALESCE(EXCLUDED.categoria, invima_registros.categoria),
        principios_activos        = COALESCE(EXCLUDED.principios_activos, invima_registros.principios_activos),
        clasificacion_riesgo      = COALESCE(EXCLUDED.clasificacion_riesgo, invima_registros.clasificacion_riesgo),
        titular_registro          = COALESCE(EXCLUDED.titular_registro, invima_registros.titular_registro),
        titular_fabricante        = COALESCE(EXCLUDED.titular_fabricante, invima_registros.titular_fabricante),
        titular_importador        = COALESCE(EXCLUDED.titular_importador, invima_registros.titular_importador),
        pais_origen               = COALESCE(EXCLUDED.pais_origen, invima_registros.pais_origen),
        fecha_emision             = COALESCE(EXCLUDED.fecha_emision, invima_registros.fecha_emision),
        fecha_vencimiento         = COALESCE(EXCLUDED.fecha_vencimiento, invima_registros.fecha_vencimiento),
        presentaciones_autorizadas= COALESCE(EXCLUDED.presentaciones_autorizadas, invima_registros.presentaciones_autorizadas),
        fuente_datos              = COALESCE(EXCLUDED.fuente_datos, invima_registros.fuente_datos),
        datos_completos           = EXCLUDED.datos_completos,
        consultado_en             = NOW()
      RETURNING *, datos_completos AS datos_crudos`,
      [
        data.numero_registro,
        data.nombre_producto || null,
        data.descripcion || null,
        data.marca || null,
        data.serie || null,
        data.estado || 'desconocido',
        data.categoria || null,
        data.principios_activos || null,
        data.clasificacion_riesgo || null,
        data.titular_registro || null,
        data.titular_fabricante || null,
        data.titular_importador || null,
        data.pais_origen || null,
        data.fecha_emision || null,
        data.fecha_vencimiento || null,
        data.presentaciones_autorizadas || null,
        data.fuente_datos || 'datos_gov',
        data.datos_crudos ? JSON.stringify(data.datos_crudos) : null,
      ]
    );

    return result.rows[0];
  }

  async getRegistroByNumero(numero: string): Promise<InvimaRegistro | null> {
    const result = await this.pool.query(
      `SELECT *, datos_completos AS datos_crudos FROM invima_registros WHERE numero_registro = $1`,
      [numero.trim().toUpperCase()]
    );
    return result.rows[0] || null;
  }

  async searchRegistros(query: string, limit = 20): Promise<InvimaRegistro[]> {
    const result = await this.pool.query(
      `SELECT *, datos_completos AS datos_crudos
       FROM invima_registros
       WHERE numero_registro ILIKE $1
          OR nombre_producto ILIKE $1
          OR titular_registro ILIKE $1
          OR principios_activos ILIKE $1
       ORDER BY consultado_en DESC
       LIMIT $2`,
      [`%${query}%`, limit]
    );
    return result.rows;
  }

  // ─── Provider Items (inventario por proveedor) ───

  async addItemToProvider(
    providerId: string,
    registroId: string,
    data: {
      nombreComercial?: string;
      loteActual?: string;
      cantidadDisponible?: number;
      ubicacionAlmacenamiento?: string;
      condicionesAlmacenamiento?: string;
      fechaVencimientoLote?: string;
    }
  ): Promise<ProviderInvimaItem> {
    const result = await this.pool.query(
      `INSERT INTO provider_invima_items (
        provider_id, invima_registro_id, nombre_comercial, lote_actual,
        cantidad_disponible, ubicacion_almacenamiento, condiciones_almacenamiento,
        fecha_vencimiento_lote
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (provider_id, invima_registro_id, lote_actual) DO UPDATE SET
        nombre_comercial = COALESCE(EXCLUDED.nombre_comercial, provider_invima_items.nombre_comercial),
        cantidad_disponible = COALESCE(EXCLUDED.cantidad_disponible, provider_invima_items.cantidad_disponible),
        ubicacion_almacenamiento = COALESCE(EXCLUDED.ubicacion_almacenamiento, provider_invima_items.ubicacion_almacenamiento),
        condiciones_almacenamiento = COALESCE(EXCLUDED.condiciones_almacenamiento, provider_invima_items.condiciones_almacenamiento),
        fecha_vencimiento_lote = COALESCE(EXCLUDED.fecha_vencimiento_lote, provider_invima_items.fecha_vencimiento_lote),
        updated_at = NOW()
      RETURNING *`,
      [
        providerId,
        registroId,
        data.nombreComercial || null,
        data.loteActual || null,
        data.cantidadDisponible || null,
        data.ubicacionAlmacenamiento || null,
        data.condicionesAlmacenamiento || null,
        data.fechaVencimientoLote || null,
      ]
    );

    return result.rows[0];
  }

  async listProviderItems(
    providerId: string,
    filters?: { semaforo?: string; categoria?: string; activo?: boolean }
  ): Promise<ProviderInvimaItem[]> {
    // Por defecto solo muestra items activos; pasar activo=false explícitamente para ver inactivos
    const activoFilter = filters?.activo !== undefined ? filters.activo : true;
    let whereClause = `pi.provider_id = $1 AND pi.activo = $2`;
    const params: (string | boolean)[] = [providerId, activoFilter];
    let idx = 3;

    if (filters?.semaforo) {
      whereClause += ` AND pi.semaforo = $${idx++}`;
      params.push(filters.semaforo);
    }
    if (filters?.categoria) {
      whereClause += ` AND ir.categoria = $${idx++}`;
      params.push(filters.categoria);
    }

    const result = await this.pool.query(
      `SELECT pi.*, ir.numero_registro, ir.nombre_producto, ir.estado AS estado_registro,
              ir.categoria, ir.titular_registro, ir.principios_activos,
              ir.clasificacion_riesgo, ir.fecha_vencimiento AS vencimiento_registro
       FROM provider_invima_items pi
       JOIN invima_registros ir ON ir.numero_registro = pi.invima_registro_id
       WHERE ${whereClause}
       ORDER BY
         CASE pi.semaforo
           WHEN 'rojo' THEN 1
           WHEN 'amarillo' THEN 2
           WHEN 'naranja' THEN 3
           WHEN 'verde' THEN 4
           ELSE 5
         END,
         pi.fecha_vencimiento_lote ASC`,
      params
    );

    return result.rows;
  }

  async deactivateItem(itemId: string, motivo: string): Promise<void> {
    await this.pool.query(
      `UPDATE provider_invima_items SET activo = FALSE, motivo_inactivacion = $2, updated_at = NOW() WHERE id = $1`,
      [itemId, motivo]
    );
  }

  // ─── Resumen TSMD por proveedor ───

  async getProviderSummary(providerId: string): Promise<InvimaProviderSummary> {
    const result = await this.pool.query(
      `SELECT * FROM v_provider_invima_summary WHERE provider_id = $1`,
      [providerId]
    );

    if (result.rows.length === 0) {
      return {
        totalItems: 0,
        itemsVerde: 0,
        itemsNaranja: 0,
        itemsAmarillo: 0,
        itemsRojo: 0,
        registrosVigentes: 0,
        registrosNoVigentes: 0,
        proximoVencimiento: null,
        porcentajeCumplimientoTsmd: 0,
      };
    }

    const row = result.rows[0];
    return {
      totalItems: parseInt(row.total_items, 10),
      itemsVerde: parseInt(row.items_verde, 10),
      itemsNaranja: parseInt(row.items_naranja, 10),
      itemsAmarillo: parseInt(row.items_amarillo, 10),
      itemsRojo: parseInt(row.items_rojo, 10),
      registrosVigentes: parseInt(row.registros_vigentes, 10),
      registrosNoVigentes: parseInt(row.registros_no_vigentes, 10),
      proximoVencimiento: row.proximo_vencimiento,
      porcentajeCumplimientoTsmd: parseFloat(row.porcentaje_cumplimiento_tsmd || '0'),
    };
  }

  // ─── Alertas INVIMA ───

  async createAlerta(data: {
    numeroRegistro?: string;
    tipoAlerta: string;
    titulo: string;
    descripcion?: string;
    severidad?: string;
    fechaAlerta: string;
    fuente?: string;
  }): Promise<InvimaAlerta> {
    // Buscar registro vinculado si existe
    let registroId: string | null = null;
    if (data.numeroRegistro) {
      const reg = await this.getRegistroByNumero(data.numeroRegistro);
      registroId = reg?.id || null;
    }

    const result = await this.pool.query(
      `INSERT INTO invima_alertas (
        numero_registro, invima_registro_id, tipo_alerta, titulo,
        descripcion, severidad, fecha_alerta, fuente
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        data.numeroRegistro || null,
        registroId,
        data.tipoAlerta,
        data.titulo,
        data.descripcion || null,
        data.severidad || 'media',
        data.fechaAlerta,
        data.fuente || null,
      ]
    );

    return result.rows[0];
  }

  async listAlertas(
    filters?: { tipo?: string; numeroRegistro?: string; sinRevisar?: boolean },
    limit = 50
  ): Promise<InvimaAlerta[]> {
    let whereClause = '1=1';
    const params: string[] = [];
    let idx = 1;

    if (filters?.tipo) {
      whereClause += ` AND tipo_alerta = $${idx++}`;
      params.push(filters.tipo);
    }
    if (filters?.numeroRegistro) {
      whereClause += ` AND numero_registro = $${idx++}`;
      params.push(filters.numeroRegistro);
    }
    if (filters?.sinRevisar) {
      whereClause += ` AND revisada_por IS NULL`;
    }

    const result = await this.pool.query(
      `SELECT * FROM invima_alertas WHERE ${whereClause}
       ORDER BY fecha_alerta DESC LIMIT $${idx}`,
      [...params, String(limit)]
    );

    return result.rows;
  }

  async marcarAlertaRevisada(alertaId: string, userId: string, accionTomada: string): Promise<void> {
    await this.pool.query(
      `UPDATE invima_alertas SET revisada_por = $2, fecha_revision = NOW(), accion_tomada = $3 WHERE id = $1`,
      [alertaId, userId, accionTomada]
    );
  }

  // ─── Utilidad: Log consulta ───

  private async logConsulta(
    numero: string,
    userId: string | undefined,
    fuente: string,
    resultado: string,
    tiempoMs: number,
    errorDetalle?: string
  ): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO invima_consultas_log (numero_registro, usuario_id, fuente, resultado, tiempo_respuesta_ms, error_detalle)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [numero, userId || null, fuente, resultado, tiempoMs, errorDetalle || null]
      );
    } catch (err) {
      logger.error({ msg: 'Error logging INVIMA query', error: String(err) });
    }
  }

  // ─── Verificar vencimientos próximos (para alertas automáticas) ───

  async getItemsPorVencer(providerId: string, diasAnticipacion = 90): Promise<ProviderInvimaItem[]> {
    const result = await this.pool.query(
      `SELECT pi.*, ir.numero_registro, ir.nombre_producto, ir.estado AS estado_registro, ir.categoria
       FROM provider_invima_items pi
       JOIN invima_registros ir ON ir.numero_registro = pi.invima_registro_id
       WHERE pi.provider_id = $1
         AND pi.activo = TRUE
         AND pi.fecha_vencimiento_lote IS NOT NULL
         AND pi.fecha_vencimiento_lote <= CURRENT_DATE + ($2 || ' days')::INTERVAL
       ORDER BY pi.fecha_vencimiento_lote ASC`,
      [providerId, diasAnticipacion]
    );

    return result.rows;
  }
}
