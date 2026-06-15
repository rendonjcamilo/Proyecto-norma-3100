/**
 * RethusService — Consulta el Registro Especial del Talento Humano en Salud (RETHUS)
 *
 * Estrategia:
 * 1. Intenta endpoints REST JSON (si MINSALUD expone API)
 * 2. Fallback: scraping del portal ASP.NET de RETHUS
 * 3. Caché en memoria con TTL 30 min para no sobrecargar el portal
 */

import { logger } from '../utils/logger.js';

// Portal público SISPRO — requiere CAPTCHA, solo sirve como referencia de URL base
const RETHUS_BASE = process.env.RETHUS_BASE_URL ?? 'http://web.sispro.gov.co';
const HTTP_TIMEOUT_MS = 12000;
const CACHE_TTL_MS = 30 * 60 * 1000;
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const memCache = new Map<string, { result: RethusResult; expiresAt: number }>();

export type TipoDocumento = 'CC' | 'CE' | 'PA' | 'SC' | 'TI' | 'RC' | 'MS';

export interface RethusRegistro {
  tipoRegistro: string;
  numRegistro: string;
  profesion: string;
  departamento?: string;
  fechaInscripcion?: string;
}

export interface RethusPersona {
  tipoDoc: string;
  numDoc: string;
  nombre: string;
  estado: string;
  registros: RethusRegistro[];
}

export interface RethusResult {
  found: boolean;
  persona?: RethusPersona;
  fuente?: string;
  error?: string;
}

export class RethusService {
  async consultar(tipoDoc: TipoDocumento, numDoc: string): Promise<RethusResult> {
    const key = `${tipoDoc}:${numDoc}`;
    const hit = memCache.get(key);
    if (hit && hit.expiresAt > Date.now()) {
      return { ...hit.result, fuente: 'cache' };
    }

    let result: RethusResult;
    try {
      result = await this.tryRestApi(tipoDoc, numDoc);
      if (!result.found) {
        result = await this.tryPortalHtml(tipoDoc, numDoc);
      }
    } catch (err) {
      logger.error({ msg: 'RETHUS consulta error', tipoDoc, error: String(err) });
      result = { found: false, error: 'No se pudo conectar con el portal RETHUS' };
    }

    if (result.found) {
      memCache.set(key, { result, expiresAt: Date.now() + CACHE_TTL_MS });
    }
    return result;
  }

  // ── Intento 1: API REST JSON ──────────────────────────────────────────────

  private async tryRestApi(tipoDoc: string, numDoc: string): Promise<RethusResult> {
    const candidates = [
      `${RETHUS_BASE}/rethus/rs/persona/consultar?tipoDoc=${tipoDoc}&numDoc=${encodeURIComponent(numDoc)}`,
      `${RETHUS_BASE}/Api/Persona/ConsultarPorDocumento?tipoDoc=${tipoDoc}&numDoc=${encodeURIComponent(numDoc)}`,
      `${RETHUS_BASE}/rethusapi/api/persona?tipoDoc=${tipoDoc}&numDoc=${encodeURIComponent(numDoc)}`,
    ];

    for (const url of candidates) {
      try {
        const res = await fetch(url, {
          headers: { Accept: 'application/json', 'User-Agent': UA },
          signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
        });
        if (!res.ok) {continue;}
        const ct = res.headers.get('content-type') ?? '';
        if (!ct.includes('json')) {continue;}
        const data = await res.json() as unknown;
        const persona = this.parseJson(tipoDoc, numDoc, data);
        if (persona) {return { found: true, persona, fuente: 'rethus_api' };}
      } catch {
        // Siguiente candidato
      }
    }
    return { found: false };
  }

  // ── Intento 2: Portal HTML ASP.NET ───────────────────────────────────────

  private async tryPortalHtml(tipoDoc: string, numDoc: string): Promise<RethusResult> {
    const portalUrl = `${RETHUS_BASE}/Consultas/ConsultarPersona.aspx`;
    try {
      // Paso 1: obtener página inicial para campos ocultos ASP.NET
      const homeRes = await fetch(portalUrl, {
        headers: { 'User-Agent': UA, Accept: 'text/html' },
        signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
      });
      if (!homeRes.ok) {return { found: false };}

      const homeHtml = await homeRes.text();
      const cookie = homeRes.headers.get('set-cookie') ?? '';

      const viewState = this.extractHidden(homeHtml, '__VIEWSTATE') ?? '';
      const eventValidation = this.extractHidden(homeHtml, '__EVENTVALIDATION') ?? '';

      // Paso 2: POST del formulario de búsqueda
      const body = new URLSearchParams({
        __VIEWSTATE: viewState,
        __EVENTVALIDATION: eventValidation,
        ddlTipoDoc: tipoDoc,
        txtNumDoc: numDoc,
        'btnConsultar.x': '10',
        'btnConsultar.y': '10',
      });

      const searchRes = await fetch(portalUrl, {
        method: 'POST',
        headers: {
          'User-Agent': UA,
          'Content-Type': 'application/x-www-form-urlencoded',
          Cookie: cookie,
          Referer: portalUrl,
          Accept: 'text/html',
        },
        body: body.toString(),
        signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
      });

      if (!searchRes.ok) {return { found: false };}
      const html = await searchRes.text();

      const persona = this.parseHtml(tipoDoc, numDoc, html);
      if (persona) {return { found: true, persona, fuente: 'rethus_portal' };}
    } catch (err) {
      logger.warn({ msg: 'RETHUS portal scraping fallido', error: String(err) });
    }
    return { found: false };
  }

  // ── Parsers ──────────────────────────────────────────────────────────────

  private parseJson(tipoDoc: string, numDoc: string, data: unknown): RethusPersona | null {
    if (!data || typeof data !== 'object') {return null;}
    const d = data as Record<string, unknown>;

    // Formato A: { nombre, estado, registros: [...] }
    const nombre = String(d['nombre'] ?? d['NOMBRE'] ?? d['nombreCompleto'] ?? '').trim();
    if (nombre.length < 4) {
      // Formato B: array de registros
      if (Array.isArray(data) && data.length > 0) {
        const first = data[0] as Record<string, unknown>;
        const n = String(first['nombre'] ?? first['NOMBRE'] ?? '').trim();
        if (n.length < 4) {return null;}
        return {
          tipoDoc, numDoc, nombre: n,
          estado: String(first['estado'] ?? first['ESTADO'] ?? 'ACTIVO'),
          registros: (data as Record<string, unknown>[]).map((r) => ({
            tipoRegistro: String(r['tipoRegistro'] ?? r['tipo'] ?? 'Registro RETHUS'),
            numRegistro: String(r['numRegistro'] ?? r['numeroRegistro'] ?? r['numero'] ?? ''),
            profesion: String(r['profesion'] ?? r['nombreProfesion'] ?? ''),
            departamento: r['departamento'] ? String(r['departamento']) : undefined,
            fechaInscripcion: r['fechaInscripcion'] ? String(r['fechaInscripcion']) : undefined,
          })),
        };
      }
      return null;
    }

    const regsRaw = (d['registros'] ?? d['REGISTROS'] ?? d['profesiones'] ?? []) as Record<string, unknown>[];
    const registros: RethusRegistro[] = Array.isArray(regsRaw)
      ? regsRaw.map((r) => ({
          tipoRegistro: String(r['tipoRegistro'] ?? r['tipo'] ?? 'Registro RETHUS'),
          numRegistro: String(r['numRegistro'] ?? r['numero'] ?? r['NUM_REGISTRO'] ?? ''),
          profesion: String(r['profesion'] ?? r['PROFESION'] ?? r['nombreProfesion'] ?? ''),
          departamento: r['departamento'] ? String(r['departamento']) : undefined,
          fechaInscripcion: r['fechaInscripcion'] ? String(r['fechaInscripcion']) : undefined,
        }))
      : [];

    return {
      tipoDoc, numDoc, nombre,
      estado: String(d['estado'] ?? d['ESTADO'] ?? 'ACTIVO'),
      registros,
    };
  }

  private parseHtml(tipoDoc: string, numDoc: string, html: string): RethusPersona | null {
    // Buscar nombre en etiquetas de resultado típicas de ASP.NET
    const nombreRe = [
      /id="[^"]*lblNombre[^"]*"[^>]*>([^<]{6,80})</i,
      /(?:Nombre Completo|Nombre)[^:]*:?\s*<\/?\w+[^>]*>([A-ZÁÉÍÓÚÑ][A-Za-záéíóúñÁÉÍÓÚÑ\s]{5,70})</i,
      /<td[^>]*>([A-ZÁÉÍÓÚÑ]{2,}(?:\s[A-ZÁÉÍÓÚÑ]{2,}){1,5})<\/td>/,
    ];
    let nombre = '';
    for (const re of nombreRe) {
      const m = html.match(re);
      if (m?.[1]?.trim().length > 4) { nombre = m[1].trim(); break; }
    }
    if (!nombre) {return null;}

    const estadoM = html.match(/(?:Estado|ESTADO)[^<]*<[^>]+>(ACTIVO|INACTIVO|SUSPENDIDO)/i);
    const estado = estadoM?.[1] ?? 'ACTIVO';

    const profM = html.match(/(?:Profesi[oó]n|Ocupaci[oó]n)[^<]*<[^>]+>([^<]{4,80})/i);
    const profesion = profM?.[1]?.trim() ?? '';

    const regM = html.match(/(?:Registro|Tarjeta|N[uú]mero\s+de\s+registro)[^<]*<[^>]+>([A-Z0-9-]{4,20})/i);
    const numRegistro = regM?.[1]?.trim() ?? '';

    const deptM = html.match(/(?:Departamento)[^<]*<[^>]+>([^<]{4,40})/i);
    const departamento = deptM?.[1]?.trim() ?? undefined;

    return {
      tipoDoc, numDoc, nombre, estado,
      registros: [{ tipoRegistro: 'Registro RETHUS', numRegistro, profesion, departamento }],
    };
  }

  private extractHidden(html: string, name: string): string | null {
    const re = new RegExp(`id="${name}"[^>]*value="([^"]*)"`, 'i');
    return html.match(re)?.[1] ?? null;
  }
}
