/**
 * RepsService — Consulta y gestión de Registro Especial de Prestadores (REPS)
 * Datos.gov.co SODA API: dataset c36g-9fc2
 *
 * Flujo:
 * 1. Usuario ingresa código de habilitación REPS
 * 2. Se consulta datos.gov.co SODA API
 * 3. Se extrae y almacena estado de habilitación
 * 4. Se comparan servicios/datos declarados vs REPS
 */

import { Pool } from 'pg';
import { logger } from '../utils/logger.js';

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────

export interface RepsConsultaResult {
  found: boolean;
  source: string;
  data: RepsRegistroData | null;
  error?: string;
}

export interface RepsRegistroData {
  codigo_habilitacion: string;
  nombre_prestador: string;
  nit: string;
  telefono?: string;
  nombre_sede?: string;
  email?: string;
  direccion?: string;
  municipio: string;
  departamento: string;
  tipo_prestador: string;
  nivel_atencion: string;
  estado_habilitacion: string;
  fecha_habilitacion?: string;
  fecha_vencimiento?: string;
  servicios_habilitados: Array<{ codigo: string; nombre: string; desde?: string; hasta?: string }>;
  capacidad_instalada?: Record<string, number>;
  sanciones?: Array<{ tipo: string; fecha: string; descripcion: string }>;
  novedades?: Array<{ tipo: string; fecha: string; descripcion: string }>;
}

export interface RepsVerificacion {
  id: string;
  provider_id: string;
  fecha_consulta: string;
  consultado_por?: string;
  reps_codigo_habilitacion: string;
  reps_nombre_prestador: string;
  reps_nit: string;
  reps_municipio: string;
  reps_departamento: string;
  reps_tipo_prestador: string;
  reps_nivel_atencion: string;
  estado_habilitacion: string;
  fecha_habilitacion?: string;
  fecha_vencimiento?: string;
  servicios_habilitados: Array<{ codigo: string; nombre: string; desde?: string; hasta?: string }>;
  capacidad_instalada?: Record<string, number>;
  diferencias_encontradas: Array<{ campo: string; valor_reps: string; valor_declarado: string }>;
  tiene_diferencias: boolean;
  sanciones?: Array<{ tipo: string; fecha: string; descripcion: string }>;
  novedades?: Array<{ tipo: string; fecha: string; descripcion: string }>;
  observaciones?: string;
  created_at: string;
}

export interface RepsResumen {
  estado_habilitacion: string;
  ultima_verificacion: string | null;
  dias_desde_verificacion: number | null;
  tiene_diferencias: boolean;
  tiene_sanciones: boolean;
  servicios_habilitados_count: number;
}

export interface DiferenciaReps {
  campo: string;
  valor_reps: string;
  valor_declarado: string;
}

export interface ProviderProximoAVencer {
  provider_id: string;
  legal_name: string;
  rut: string;
  phone: string | null;
  codigo_habilitacion: string | null;
  fecha_vencimiento: string;
  dias_restantes: number;
  estado_habilitacion: string;
}

// Resultado de búsqueda directa en REPS (sin BD interna — prospección comercial)
export interface RepsProspecto {
  codigo_habilitacion: string;
  nombre_prestador: string;
  nit: string;
  municipio: string;
  departamento: string;
  clase_prestador: string;
  telefono_raw: string | null;
  celular: string | null;
  email: string | null;
  direccion: string | null;
  fecha_vencimiento: string | null;
  dias_hasta_vencer: number | null;
}

// ─────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────

const DATOS_GOV_REPS_ENDPOINT = 'https://www.datos.gov.co/resource/c36g-9fc2.json';

// Reintentos automáticos para llamadas a datos.gov.co
// No reintenta en AbortError (timeout controlado por el usuario).
async function fetchConReintentos(
  url: string,
  options: RequestInit,
  maxReintentos = 2,
  esperaMs = 2000
): Promise<Response> {
  let ultimoError: unknown;
  for (let intento = 0; intento <= maxReintentos; intento++) {
    try {
      const res = await fetch(url, options);
      if (res.ok || res.status < 500) {return res;} // 4xx no se reintenta
      ultimoError = new Error(`HTTP ${res.status}`);
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {throw err;} // timeout: no reintentar
      ultimoError = err;
    }
    if (intento < maxReintentos) {
      logger.warn({ msg: `datos.gov.co falló, reintentando (${intento + 1}/${maxReintentos})...` });
      await new Promise((r) => setTimeout(r, esperaMs));
    }
  }
  throw ultimoError;
}

// Mapeo de estados REPS a estándares
const ESTADO_HABILITACION_MAP: Record<string, string> = {
  habilitado: 'habilitado',
  no_habilitado: 'deshabilitado',
  deshabilitado: 'deshabilitado',
  en_tramite: 'en_tramite',
  trámite: 'en_tramite',
  suspendido: 'suspendido',
  suspension: 'suspendido',
  unknown: 'sin_verificar',
};

// ─────────────────────────────────────────────
// SERVICIO
// ─────────────────────────────────────────────

export class RepsService {
  constructor(private pool: Pool) {}

  // ─── CONSULTA EXTERNA: datos.gov.co SODA API ───

  async consultarEnReps(codigoHabilitacion: string): Promise<RepsConsultaResult> {
    const cleanCode = codigoHabilitacion.trim().toUpperCase();
    const startTime = Date.now();

    try {
      const result = await this.consultarDatosGov(cleanCode);

      if (result.found && result.data) {
        logger.info({
          msg: 'REPS consulta exitosa',
          codigo: cleanCode,
          nombre: result.data.nombre_prestador,
          estado: result.data.estado_habilitacion,
        });

        return {
          found: true,
          source: 'datos_gov',
          data: result.data,
        };
      }

      logger.warn({
        msg: 'REPS no encontrado en datos.gov.co',
        codigo: cleanCode,
      });

      return {
        found: false,
        source: 'datos_gov',
        data: null,
        error: 'Código de habilitación no encontrado en REPS',
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.error({
        msg: 'Error al consultar REPS',
        codigo: cleanCode,
        error: errorMsg,
        tiempoMs: Date.now() - startTime,
      });

      return {
        found: false,
        source: 'datos_gov',
        data: null,
        error: `Error al consultar REPS: ${errorMsg}`,
      };
    }
  }

  private async consultarDatosGov(termino: string): Promise<RepsConsultaResult> {
    // Intentar por código de habilitación de sede y también por número de identificación (NIT/CC)
    const whereClause = `codigohabilitacionsede = '${termino}' OR numeroidentificacion = '${termino}'`;
    const params = new URLSearchParams({
      $where: whereClause,
      $limit: '5',
    });

    const url = `${DATOS_GOV_REPS_ENDPOINT}?${params.toString()}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetchConReintentos(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Norma3100-ComplianceSystem/1.0',
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        logger.debug({
          msg: 'REPS API returned non-200',
          status: response.status,
          termino,
        });
        return { found: false, source: 'datos_gov', data: null };
      }

      const results = (await response.json()) as Record<string, string>[];

      if (!Array.isArray(results) || results.length === 0) {
        return { found: false, source: 'datos_gov', data: null };
      }

      const registro = results[0];
      const mapped = this.mapDatosGovToReps(registro);

      logger.debug({ msg: 'REPS query successful', termino });

      return { found: true, source: 'datos_gov', data: mapped };
    } catch (err) {
      logger.debug({
        msg: 'REPS dataset query failed',
        termino,
        error: String(err),
      });
      return { found: false, source: 'datos_gov', data: null };
    }
  }

  // ─── Mapeo de datos desde datos.gov.co ───

  private mapDatosGovToReps(record: Record<string, string>): RepsRegistroData {
    // Parsear servicios habilitados si existen
    let servicios: Array<{ codigo: string; nombre: string; desde?: string; hasta?: string }> = [];
    try {
      const serviciosRaw = this.pick(record, 'servicios', 'servicios_habilitados');
      if (serviciosRaw) {
        servicios = JSON.parse(serviciosRaw);
      }
    } catch (_) {
      // Si no es JSON válido, dejar vacío
    }

    // Parsear capacidad instalada si existe
    let capacidad: Record<string, number> = {};
    try {
      const capacidadRaw = this.pick(record, 'capacidad_instalada', 'capacidad');
      if (capacidadRaw) {
        capacidad = JSON.parse(capacidadRaw);
      }
    } catch (_) {
      // Si no es JSON válido, dejar vacío
    }

    // Parsear sanciones y novedades
    let sanciones: Array<{ tipo: string; fecha: string; descripcion: string }> = [];
    let novedades: Array<{ tipo: string; fecha: string; descripcion: string }> = [];
    try {
      const sancionesRaw = this.pick(record, 'sanciones');
      if (sancionesRaw) {sanciones = JSON.parse(sancionesRaw);}
      const novedadesRaw = this.pick(record, 'novedades', 'novedades_recientes');
      if (novedadesRaw) {novedades = JSON.parse(novedadesRaw);}
    } catch (_) {
      // Si no es JSON válido, dejar vacío
    }

    const estadoRaw = this.pick(record, 'estado', 'estado_habilitacion') || 'unknown';
    const estado = ESTADO_HABILITACION_MAP[estadoRaw.toLowerCase()] || 'sin_verificar';

    // Fecha de vencimiento: múltiples nombres posibles en el dataset de datos.gov.co
    const fechaVencimientoRaw = this.pick(
      record,
      'fechavigenciaresolucion',
      'fecha_vencimiento',
      'fecha_vigencia',
      'vigenciaresolucion',
      'vigencia_hasta',
      'fechaexpiracion',
      'fecha_expiracion',
      'vigencia'
    );

    return {
      codigo_habilitacion: this.pick(record, 'codigohabilitacionsede', 'codigoprestador') || '',
      nombre_prestador: this.pick(record, 'nombreprestador', 'nombresede') || '',
      nit: this.pick(record, 'numeroidentificacion') || '',
      telefono: this.pick(record, 'telefonoprestador', 't_lefonosede', 'telefono', 'telefono_prestador') || undefined,
      nombre_sede: this.pick(record, 'nombresede', 'nombre_sede') || undefined,
      email: this.pick(record, 'email_prestador', 'email_sede') || undefined,
      direccion: this.pick(record, 'direccionprestador', 'direcci_nsede') || undefined,
      municipio: this.pick(record, 'municipioprestadordesc', 'municipiosededesc') || '',
      departamento: this.pick(record, 'departamentoprestadordesc', 'departamentodededesc') || '',
      tipo_prestador: this.pick(record, 'claseprestador') || '',
      nivel_atencion: this.pick(record, 'nivel_atencion', 'nivel') || '',
      estado_habilitacion: estado,
      fecha_habilitacion: this.pick(record, 'fecha_habilitacion', 'fecha_otorgamiento') || undefined,
      fecha_vencimiento: fechaVencimientoRaw || undefined,
      servicios_habilitados: servicios,
      capacidad_instalada: Object.keys(capacidad).length > 0 ? capacidad : undefined,
      sanciones: sanciones.length > 0 ? sanciones : undefined,
      novedades: novedades.length > 0 ? novedades : undefined,
    };
  }

  // ─── Helper: pick — intenta múltiples nombres de campo ───

  private pick(record: Record<string, string>, ...keys: string[]): string | null {
    for (const k of keys) {
      if (record[k]?.trim()) {
        return record[k].trim();
      }
    }
    return null;
  }

  // ─── REGISTRAR VERIFICACIÓN ───

  async registrarVerificacion(
    providerId: string,
    consultadoPor: string,
    datos: RepsRegistroData
  ): Promise<RepsVerificacion> {
    const result = await this.pool.query(
      `INSERT INTO reps_verificaciones (
        provider_id, consultado_por, fecha_consulta,
        reps_codigo_habilitacion, reps_nombre_prestador, reps_nit,
        reps_municipio, reps_departamento, reps_tipo_prestador,
        reps_nivel_atencion, estado_habilitacion, fecha_habilitacion,
        fecha_vencimiento,
        servicios_habilitados, capacidad_instalada, sanciones, novedades_recientes
      ) VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        providerId,
        consultadoPor || null,
        datos.codigo_habilitacion,
        datos.nombre_prestador,
        datos.nit,
        datos.municipio,
        datos.departamento,
        datos.tipo_prestador,
        datos.nivel_atencion,
        datos.estado_habilitacion,
        datos.fecha_habilitacion || null,
        datos.fecha_vencimiento || null,
        JSON.stringify(datos.servicios_habilitados || []),
        datos.capacidad_instalada ? JSON.stringify(datos.capacidad_instalada) : JSON.stringify({}),
        datos.sanciones ? JSON.stringify(datos.sanciones) : JSON.stringify([]),
        datos.novedades ? JSON.stringify(datos.novedades) : JSON.stringify([]),
      ]
    );

    return this.mapRowToVerificacion(result.rows[0]);
  }

  // ─── OBTENER ÚLTIMA VERIFICACIÓN ───

  async getUltimaVerificacion(providerId: string): Promise<RepsVerificacion | null> {
    const result = await this.pool.query(
      `SELECT * FROM reps_verificaciones WHERE provider_id = $1 ORDER BY fecha_consulta DESC LIMIT 1`,
      [providerId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToVerificacion(result.rows[0]);
  }

  // ─── OBTENER HISTORIAL ───

  async getHistorialVerificaciones(providerId: string): Promise<RepsVerificacion[]> {
    const result = await this.pool.query(
      `SELECT * FROM reps_verificaciones WHERE provider_id = $1 ORDER BY fecha_consulta DESC LIMIT 50`,
      [providerId]
    );

    return result.rows.map((row) => this.mapRowToVerificacion(row));
  }

  // ─── PROSPECTOS REPS: Consulta directa a datos.gov.co ───
  // No usa BD interna — retorna prestadores del REPS nacional para prospección comercial.
  // Filtra por departamento, municipio y/o clase de prestador.

  async buscarProspectosReps(opts: {
    departamento?: string;
    municipio?: string;
    clasePrestador?: string;
    soloConCelular?: boolean;
    diasHastaVencer?: number;
    limit?: number;
  }): Promise<{ data: RepsProspecto[]; total: number }> {
    const { departamento, municipio, clasePrestador, soloConCelular, diasHastaVencer, limit = 100 } = opts;

    const conditions: string[] = [];

    if (departamento) {
      const dep = this.stripAccents(departamento).replace(/'/g, "''");
      conditions.push(`${this.sodaNoAccent('departamentoprestadordesc')} = '${dep}'`);
    }

    if (municipio) {
      const mun = this.stripAccents(municipio).replace(/'/g, "''");
      conditions.push(`${this.sodaNoAccent('municipioprestadordesc')} = '${mun}'`);
    }

    if (clasePrestador) {
      conditions.push(this.clasePrestadorToSodaWhere(clasePrestador));
    }

    if (soloConCelular) {
      conditions.push(`(telefonoprestador LIKE '3%' OR t_lefonosede LIKE '3%')`);
    }

    const SODA_PAGE_SIZE = 200;
    const whereClause = conditions.length > 0 ? conditions.join(' AND ') : null;

    logger.debug({ msg: 'REPS SODA query', where: whereClause, limit });

    const controller = new AbortController();
    const timeoutMs = limit <= 200 ? 25000 : limit <= 1000 ? 90000 : limit <= 3000 ? 300000 : 480000;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const fetchHeaders = { Accept: 'application/json', 'User-Agent': 'Norma3100-ComplianceSystem/1.0' };

    const fetchPage = async (pageLimit: number, offset: number): Promise<Record<string, string>[] | null> => {
      const params = new URLSearchParams({
        $limit: String(pageLimit),
        $offset: String(offset),
      });
      if (whereClause) {params.set('$where', whereClause);}
      const url = `${DATOS_GOV_REPS_ENDPOINT}?${params.toString()}`;
      const response = await fetchConReintentos(url, { signal: controller.signal, headers: fetchHeaders });
      if (!response.ok) {
        logger.warn({ msg: 'REPS API page error (datos.gov.co)', status: response.status, offset, pageLimit });
        return null;
      }
      const json = await response.json();
      return Array.isArray(json) ? json : [];
    };

    try {
      let rawResults: Record<string, string>[] = [];

      if (limit <= SODA_PAGE_SIZE) {
        const page = await fetchPage(limit, 0);
        if (page === null) {throw new Error('REPS API error: datos.gov.co no respondió correctamente');}
        rawResults = page;
      } else {
        let offset = 0;
        while (rawResults.length < limit) {
          const batchSize = Math.min(SODA_PAGE_SIZE, limit - rawResults.length);
          const batch = await fetchPage(batchSize, offset);
          if (batch === null) {break;} // datos.gov.co error en offset alto — devolver lo que tenemos
          rawResults.push(...batch);
          if (batch.length < batchSize) {break;}
          offset += batchSize;
        }
      }

      clearTimeout(timeout);

      if (!Array.isArray(rawResults)) {return { data: [], total: 0 };}

      // Nota: el dataset c36g-9fc2 de datos.gov.co NO incluye fecha de vencimiento
      // de habilitación. El campo fecha_vencimiento siempre vendrá null desde esta fuente.
      const allMapped: RepsProspecto[] = rawResults.map((r) => {
        const telefonoRaw = this.pick(r, 'telefonoprestador', 't_lefonosede') || null;
        return {
          codigo_habilitacion: this.pick(r, 'codigohabilitacionsede') || '',
          nombre_prestador: this.pick(r, 'nombreprestador') || '',
          nit: this.pick(r, 'numeroidentificacion') || '',
          municipio: this.pick(r, 'municipioprestadordesc') || '',
          departamento: this.pick(r, 'departamentoprestadordesc') || '',
          clase_prestador: this.pick(r, 'claseprestador') || '',
          telefono_raw: telefonoRaw,
          celular: telefonoRaw ? this.extractMobile(telefonoRaw) : null,
          email: this.pick(r, 'email_prestador', 'email_sede') || null,
          direccion: this.pick(r, 'direccionprestador') || null,
          fecha_vencimiento: null,
          dias_hasta_vencer: null,
        };
      });

      // Deduplicar por NIT: un prestador puede tener múltiples sedes/habilitaciones en REPS.
      // Para prospección comercial se necesita contactar a la entidad (no a cada sede),
      // así que consolidamos en un solo registro priorizando el que tenga celular.
      const byNit = new Map<string, RepsProspecto>();
      for (const item of allMapped) {
        const existing = byNit.get(item.nit);
        if (!existing || (!existing.celular && item.celular)) {
          byNit.set(item.nit, item);
        }
      }
      const data = [...byNit.values()].slice(0, limit);

      logger.info({
        msg: 'REPS prospectos consultados',
        departamento,
        municipio,
        clasePrestador,
        diasHastaVencer,
        total_registros_reps: allMapped.length,
        total_entidades_unicas: data.length,
      });

      return { data, total: data.length };
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  }

  // Alias mantenido para compatibilidad con la ruta existente
  async buscarMercadoPotencial(
    _diasHastaVencer: number = 30,
    departamento?: string
  ): Promise<{ data: RepsProspecto[]; campo_vencimiento_encontrado: string | null }> {
    const resultado = await this.buscarProspectosReps({ departamento, limit: 100 });
    return { data: resultado.data, campo_vencimiento_encontrado: null };
  }

  // Convierte el label del dropdown a una condición SODA robusta.
  // Usa upper() + LIKE con prefijo para tolerar variantes con/sin acento y capitalización
  // distinta en el dataset de datos.gov.co.
  private clasePrestadorToSodaWhere(clase: string): string {
    const n = this.stripAccents(clase);
    if (n.includes('INSTITUCI'))     {return `upper(claseprestador) like 'INSTITUCI%'`;}
    if (n.includes('EMPRESA SOCIAL')) {return `upper(claseprestador) like 'EMPRESA SOCIAL%'`;}
    if (n.includes('TRANSPORTE'))    {return `upper(claseprestador) like 'TRANSPORTE%'`;}
    if (n.includes('PROFESIONAL'))   {return `upper(claseprestador) like 'PROFESIONAL%'`;}
    if (n.includes('OBJETO SOCIAL')) {return `upper(claseprestador) like 'OBJETO SOCIAL%'`;}
    // Fallback para valores no mapeados: exact match normalizado
    const safe = n.replace(/'/g, "''");
    return `${this.sodaNoAccent('claseprestador')} = '${safe}'`;
  }

  // Normaliza texto eliminando tildes y pasando a mayúsculas
  private stripAccents(text: string): string {
    return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  }

  // Genera expresión SODA que normaliza tildes en un campo del dataset
  private sodaNoAccent(field: string): string {
    return `replace(replace(replace(replace(replace(upper(${field}),'Á','A'),'É','E'),'Í','I'),'Ó','O'),'Ú','U')`;
  }

  // Extrae el primer número móvil colombiano (10 dígitos, empieza en 3) del campo de teléfono
  private extractMobile(raw: string): string | null {
    const partes = raw.split(/[/\-,;|\s]+/);
    for (const parte of partes) {
      const digits = parte.replace(/\D/g, '');
      if (digits.length === 10 && digits.startsWith('3')) {return digits;}
      if (digits.length === 12 && digits.startsWith('573')) {return digits.slice(2);}
    }
    return null;
  }

  // ─── PRESTADORES PRÓXIMOS A VENCER (desde BD interna) ───

  async getProximosAVencer(diasHastaVencer: number = 30): Promise<ProviderProximoAVencer[]> {
    // Toma la verificación más reciente de cada prestador y filtra
    // los que tienen fecha_vencimiento dentro del rango [hoy, hoy + N días]
    const result = await this.pool.query(
      `SELECT DISTINCT ON (p.id)
        p.id            AS provider_id,
        p.legal_name,
        p.rut,
        p.phone,
        p.codigo_habilitacion,
        rv.fecha_vencimiento,
        rv.estado_habilitacion,
        (rv.fecha_vencimiento - CURRENT_DATE)::int AS dias_restantes
      FROM providers p
      JOIN reps_verificaciones rv ON rv.provider_id = p.id
      WHERE rv.fecha_vencimiento IS NOT NULL
        AND rv.fecha_vencimiento >= CURRENT_DATE
        AND rv.fecha_vencimiento <= CURRENT_DATE + ($1 || ' days')::INTERVAL
      ORDER BY p.id, rv.fecha_consulta DESC, rv.fecha_vencimiento ASC`,
      [diasHastaVencer]
    );

    return result.rows.map((row) => ({
      provider_id: String(row.provider_id),
      legal_name: String(row.legal_name),
      rut: String(row.rut),
      phone: row.phone ? String(row.phone) : null,
      codigo_habilitacion: row.codigo_habilitacion ? String(row.codigo_habilitacion) : null,
      fecha_vencimiento: String(row.fecha_vencimiento),
      dias_restantes: Number(row.dias_restantes),
      estado_habilitacion: String(row.estado_habilitacion),
    }));
  }

  // ─── OBTENER RESUMEN ───

  async getResumen(providerId: string): Promise<RepsResumen> {
    const ultima = await this.getUltimaVerificacion(providerId);

    if (!ultima) {
      return {
        estado_habilitacion: 'sin_verificar',
        ultima_verificacion: null,
        dias_desde_verificacion: null,
        tiene_diferencias: false,
        tiene_sanciones: false,
        servicios_habilitados_count: 0,
      };
    }

    const diasDesde = Math.floor((Date.now() - new Date(ultima.fecha_consulta).getTime()) / (1000 * 60 * 60 * 24));
    const tieneSanciones = (ultima.sanciones && ultima.sanciones.length > 0) || false;

    return {
      estado_habilitacion: ultima.estado_habilitacion,
      ultima_verificacion: ultima.fecha_consulta,
      dias_desde_verificacion: diasDesde,
      tiene_diferencias: ultima.tiene_diferencias,
      tiene_sanciones: tieneSanciones,
      servicios_habilitados_count: (ultima.servicios_habilitados && ultima.servicios_habilitados.length) || 0,
    };
  }

  // ─── COMPARAR CON SISTEMA ───

  async compararConSistema(providerId: string, serviciosReps: Array<{ codigo: string; nombre: string }>): Promise<DiferenciaReps[]> {
    // Obtener servicios declarados en el sistema para este prestador
    const result = await this.pool.query(
      `SELECT id, code, name FROM services WHERE id IN (
        SELECT service_id FROM provider_services WHERE provider_id = $1
      )`,
      [providerId]
    );

    const serviciosDelSistema = result.rows.map((r) => ({ codigo: r.code, nombre: r.name }));
    const diferencias: DiferenciaReps[] = [];

    // Detectar servicios en REPS que no están en el sistema
    for (const sReps of serviciosReps) {
      const encontrado = serviciosDelSistema.some((sSystem) => sSystem.codigo === sReps.codigo);
      if (!encontrado) {
        diferencias.push({
          campo: 'servicios_habilitados',
          valor_reps: `${sReps.codigo} - ${sReps.nombre}`,
          valor_declarado: 'No declarado en el sistema',
        });
      }
    }

    // Detectar servicios en el sistema que no están habilitados en REPS
    for (const sSystem of serviciosDelSistema) {
      const encontrado = serviciosReps.some((sReps) => sReps.codigo === sSystem.codigo);
      if (!encontrado) {
        diferencias.push({
          campo: 'servicios_no_habilitados',
          valor_reps: 'No habilitado',
          valor_declarado: `${sSystem.codigo} - ${sSystem.nombre}`,
        });
      }
    }

    return diferencias;
  }

  // ─── MAPEO DE ROW A VERIFICACIÓN ───

  private mapRowToVerificacion(row: Record<string, unknown>): RepsVerificacion {
    return {
      id: String(row.id),
      provider_id: String(row.provider_id),
      fecha_consulta: String(row.fecha_consulta),
      consultado_por: row.consultado_por ? String(row.consultado_por) : undefined,
      reps_codigo_habilitacion: String(row.reps_codigo_habilitacion),
      reps_nombre_prestador: String(row.reps_nombre_prestador),
      reps_nit: String(row.reps_nit),
      reps_municipio: String(row.reps_municipio),
      reps_departamento: String(row.reps_departamento),
      reps_tipo_prestador: String(row.reps_tipo_prestador),
      reps_nivel_atencion: String(row.reps_nivel_atencion),
      estado_habilitacion: String(row.estado_habilitacion),
      fecha_habilitacion: row.fecha_habilitacion ? String(row.fecha_habilitacion) : undefined,
      fecha_vencimiento: row.fecha_vencimiento ? String(row.fecha_vencimiento) : undefined,
      servicios_habilitados: (row.servicios_habilitados as Array<{ codigo: string; nombre: string; desde?: string; hasta?: string }>) || [],
      capacidad_instalada: row.capacidad_instalada as Record<string, number> | undefined,
      diferencias_encontradas: (row.diferencias_encontradas as Array<{ campo: string; valor_reps: string; valor_declarado: string }>) || [],
      tiene_diferencias: Boolean(row.tiene_diferencias),
      sanciones: row.sanciones as Array<{ tipo: string; fecha: string; descripcion: string }> | undefined,
      novedades: row.novedades_recientes as Array<{ tipo: string; fecha: string; descripcion: string }> | undefined,
      observaciones: row.observaciones ? String(row.observaciones) : undefined,
      created_at: String(row.created_at),
    };
  }
}
