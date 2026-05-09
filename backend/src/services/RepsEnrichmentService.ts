/**
 * RepsEnrichmentService — Enriquece prospectos REPS con fecha de vencimiento
 *
 * El dataset público datos.gov.co (c36g-9fc2) no incluye fecha_vencimiento.
 * Este servicio la obtiene del portal oficial MINSALUD (prestadores.minsalud.gov.co)
 * mediante HTTP directo (sin Puppeteer/Chromium), con CONCURRENCY workers paralelos.
 *
 * Flujo:
 * 1. enrichLote([nits])  → consulta caché, luego HTTP paralelo para los pendientes
 * 2. setManual(nit, fecha) → ingreso manual cuando el scraping falla
 * 3. getBatchCached([nits]) → sólo caché, sin scraping (para merge rápido en API)
 */

import { Pool } from 'pg';
import { logger } from '../utils/logger.js';

const MINSALUD_BASE = 'https://prestadores.minsalud.gov.co/habilitacion';
const REPS_PATH = '/consultas/habilitados_reps.aspx?pageTitle=Registro%20Actual&pageHlp=';
const CACHE_TTL_DAYS = 30;
const RETRY_COOLDOWN_HOURS = 24;
const CONCURRENCY = 5;
const HTTP_TIMEOUT_MS = 12000;
const SESSION_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutos
const SLOT_DELAY_MS = 500; // pausa entre requests del mismo slot

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export interface EnrichResult {
  nit: string;
  fecha_vencimiento: string | null;
  fuente: 'minsalud_scrape' | 'manual' | 'cache';
  ok: boolean;
  error?: string;
}

interface SlotSession {
  cookie: string;
  createdAt: number;
}

export class RepsEnrichmentService {
  private slots: (SlotSession | null)[];

  constructor(private pool: Pool) {
    this.slots = new Array(CONCURRENCY).fill(null);
  }

  // ── API pública ─────────────────────────────────────────────────────────────

  /**
   * Enriquece un lote de NITs con fecha_vencimiento.
   * Retorna primero los cacheados, luego HTTP paralelo para los pendientes.
   * Máximo 20 NITs por llamada.
   */
  async enrichLote(nits: string[]): Promise<EnrichResult[]> {
    const unique = [...new Set(nits.map((n) => n.trim()).filter(Boolean))].slice(0, 20);
    if (unique.length === 0) return [];

    const cached = await this.getCached(unique);
    const cachedNits = new Set(cached.map((r) => r.nit));
    const pendientes = unique.filter((n) => !cachedNits.has(n));

    if (pendientes.length === 0) return cached;

    const scraped = await this.processWithConcurrency(pendientes);
    return [...cached, ...scraped];
  }

  /**
   * Ingreso manual de fecha_vencimiento para un NIT específico.
   */
  async setManual(nit: string, fechaVencimiento: string, nombrePrestador?: string): Promise<void> {
    const d = new Date(fechaVencimiento);
    if (isNaN(d.getTime())) throw new Error('Fecha inválida');

    await this.pool.query(
      `INSERT INTO reps_enriched
         (nit, fecha_vencimiento, nombre_prestador, fuente, enriquecido_at, expira_at, intentos_fallidos, ultimo_error)
       VALUES ($1, $2, $3, 'manual', NOW(), NOW() + INTERVAL '${CACHE_TTL_DAYS} days', 0, NULL)
       ON CONFLICT (nit) DO UPDATE SET
         fecha_vencimiento = EXCLUDED.fecha_vencimiento,
         nombre_prestador  = COALESCE(EXCLUDED.nombre_prestador, reps_enriched.nombre_prestador),
         fuente            = 'manual',
         enriquecido_at    = NOW(),
         expira_at         = NOW() + INTERVAL '${CACHE_TTL_DAYS} days',
         intentos_fallidos = 0,
         ultimo_error      = NULL`,
      [nit, d.toISOString().split('T')[0], nombrePrestador || null]
    );
  }

  /**
   * Retorna Map<nit, {fecha_vencimiento, fuente}> para NITs con caché vigente.
   */
  async getBatchCached(
    nits: string[]
  ): Promise<Map<string, { fecha_vencimiento: string | null; fuente: string }>> {
    if (nits.length === 0) return new Map();

    const result = await this.pool.query(
      `SELECT nit, fecha_vencimiento, fuente
         FROM reps_enriched
        WHERE nit = ANY($1) AND expira_at > NOW()`,
      [nits]
    );

    const map = new Map<string, { fecha_vencimiento: string | null; fuente: string }>();
    for (const row of result.rows) {
      map.set(row.nit, {
        fecha_vencimiento: row.fecha_vencimiento
          ? row.fecha_vencimiento instanceof Date
            ? row.fecha_vencimiento.toISOString().split('T')[0]
            : String(row.fecha_vencimiento).split('T')[0]
          : null,
        fuente: row.fuente,
      });
    }
    return map;
  }

  // ── Procesamiento concurrente ────────────────────────────────────────────────

  private async processWithConcurrency(nits: string[]): Promise<EnrichResult[]> {
    const results: EnrichResult[] = new Array(nits.length);
    let ptr = 0;

    const worker = async (slot: number) => {
      while (true) {
        // ptr++ es atómico en JS (single-threaded) — sin race condition
        const i = ptr++;
        if (i >= nits.length) break;
        results[i] = await this.scrapeNit(nits[i], slot);
        if (ptr < nits.length) await this.sleep(SLOT_DELAY_MS);
      }
    };

    const workerCount = Math.min(CONCURRENCY, nits.length);
    await Promise.all(Array.from({ length: workerCount }, (_, slot) => worker(slot)));
    return results;
  }

  private async scrapeNit(nit: string, slot: number): Promise<EnrichResult> {
    if (await this.isInCooldown(nit)) {
      return { nit, fecha_vencimiento: null, fuente: 'minsalud_scrape', ok: false, error: 'Cooldown activo' };
    }

    try {
      // Establecer o refrescar sesión del slot
      if (!this.slots[slot] || Date.now() - this.slots[slot]!.createdAt > SESSION_MAX_AGE_MS) {
        this.slots[slot] = { cookie: await this.establishSession(), createdAt: Date.now() };
      }

      const fecha = await Promise.race([
        this.fetchNitHttp(nit, slot),
        this.timeoutValue<string | null>(null, HTTP_TIMEOUT_MS * 2),
      ]);

      if (fecha) {
        await this.saveCacheSuccess(nit, fecha);
        logger.info({ msg: 'REPS enriquecido (HTTP)', nit, fecha_vencimiento: fecha });
        return { nit, fecha_vencimiento: fecha, fuente: 'minsalud_scrape', ok: true };
      }

      await this.recordFailure(nit, 'Fecha no encontrada');
      return { nit, fecha_vencimiento: null, fuente: 'minsalud_scrape', ok: false, error: 'Fecha no encontrada' };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this.slots[slot] = null; // invalida sesión del slot en error
      await this.recordFailure(nit, error);
      logger.warn({ msg: 'REPS HTTP scraping fallido', nit, slot, error });
      return { nit, fecha_vencimiento: null, fuente: 'minsalud_scrape', ok: false, error };
    }
  }

  // ── HTTP scraping MINSALUD ───────────────────────────────────────────────────

  private async fetchNitHttp(nit: string, slot: number, isRetry = false): Promise<string | null> {
    const session = this.slots[slot]!;
    const repsUrl = `${MINSALUD_BASE}${REPS_PATH}`;

    // GET para obtener VIEWSTATE actual de la página de búsqueda
    const getResp = await this.timedFetch(repsUrl, {
      headers: {
        'User-Agent': UA,
        'Cookie': session.cookie,
        'Referer': `${MINSALUD_BASE}/work.aspx`,
      },
    });
    session.cookie = this.mergeCookies(session.cookie, getResp.headers);
    const pageHtml = await getResp.text();

    // Detectar sesión expirada: la página de búsqueda debe tener el campo NIT
    const sessionExpired = !pageHtml.includes('tbnits_nit') || pageHtml.includes('id="Button1"');
    if (sessionExpired) {
      if (isRetry) throw new Error('Sesión MINSALUD inválida tras reestablecimiento');
      logger.info({ msg: 'REPS HTTP: sesión expirada, reestableciendo', slot });
      this.slots[slot] = { cookie: await this.establishSession(), createdAt: Date.now() };
      return this.fetchNitHttp(nit, slot, true);
    }

    const viewState = this.extractHidden(pageHtml, '__VIEWSTATE') ?? '';
    const viewStateGen = this.extractHidden(pageHtml, '__VIEWSTATEGENERATOR') ?? '';
    const eventValidation = this.extractHidden(pageHtml, '__EVENTVALIDATION') ?? '';

    // Extraer nombres de campo reales del HTML (ASP.NET puede usar ':' o '_')
    const nitName =
      this.extractFieldNameById(pageHtml, '_ctl0_ContentPlaceHolder1_tbnits_nit') ??
      '_ctl0:ContentPlaceHolder1:tbnits_nit';
    const btnName =
      this.extractFieldNameById(pageHtml, '_ctl0_ibBuscarHdr') ?? '_ctl0:ibBuscarHdr';

    const body = new URLSearchParams();
    body.set('__VIEWSTATE', viewState);
    if (viewStateGen) body.set('__VIEWSTATEGENERATOR', viewStateGen);
    if (eventValidation) body.set('__EVENTVALIDATION', eventValidation);
    body.set(nitName, nit);
    body.set(`${btnName}.x`, '10');
    body.set(`${btnName}.y`, '10');

    const postResp = await this.timedFetch(repsUrl, {
      method: 'POST',
      headers: {
        'User-Agent': UA,
        'Cookie': session.cookie,
        'Referer': repsUrl,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
    session.cookie = this.mergeCookies(session.cookie, postResp.headers);
    const resultHtml = await postResp.text();

    return this.parseFechaFromInput(resultHtml) ?? this.parseFechaVencimiento(resultHtml);
  }

  /**
   * Establece una sesión HTTP con el portal MINSALUD.
   * Obtiene cookie de sesión ASP.NET y hace el login como invitado.
   */
  private async establishSession(): Promise<string> {
    // Paso 1: GET base para obtener ASP.NET_SessionId
    const r1 = await this.timedFetch(`${MINSALUD_BASE}/`, {
      headers: { 'User-Agent': UA },
      redirect: 'follow',
    } as RequestInit);
    let cookie = this.mergeCookies('', r1.headers);
    const frameset = await r1.text();

    // Paso 2: Localizar frame "areawork" en el frameset
    const frameMatch =
      frameset.match(/name=["']areawork["'][^>]*src=["']([^"'?\s]+)/i) ??
      frameset.match(/src=["']([^"'?\s]+)["'][^>]*name=["']areawork["']/i);

    if (!frameMatch) {
      return cookie; // Sin frameset — usar sesión básica
    }

    const frameRelUrl = frameMatch[1];
    const frameUrl = frameRelUrl.startsWith('http')
      ? frameRelUrl
      : `${MINSALUD_BASE}/${frameRelUrl.replace(/^\//, '')}`;

    // Paso 3: GET del frame para obtener formulario de bienvenida/login
    const r2 = await this.timedFetch(frameUrl, {
      headers: { 'User-Agent': UA, 'Cookie': cookie, 'Referer': `${MINSALUD_BASE}/` },
    });
    cookie = this.mergeCookies(cookie, r2.headers);
    const frameHtml = await r2.text();

    // Paso 4: POST Button1 (acceso como invitado) si existe
    if (!frameHtml.includes('Button1')) {
      return cookie;
    }

    const vs = this.extractHidden(frameHtml, '__VIEWSTATE') ?? '';
    const vsGen = this.extractHidden(frameHtml, '__VIEWSTATEGENERATOR') ?? '';
    const btn1Name = this.extractFieldNameById(frameHtml, 'Button1') ?? 'Button1';

    const loginBody = new URLSearchParams({ '__VIEWSTATE': vs });
    if (vsGen) loginBody.set('__VIEWSTATEGENERATOR', vsGen);
    loginBody.set(btn1Name, 'Continuar');

    const r3 = await this.timedFetch(frameUrl, {
      method: 'POST',
      headers: {
        'User-Agent': UA,
        'Cookie': cookie,
        'Referer': frameUrl,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: loginBody.toString(),
      redirect: 'follow',
    } as RequestInit);
    cookie = this.mergeCookies(cookie, r3.headers);

    logger.info({ msg: 'REPS HTTP: sesión establecida' });
    return cookie;
  }

  // ── Parseo HTML ──────────────────────────────────────────────────────────────

  private parseFechaFromInput(html: string): string | null {
    const patterns = [
      /id="_ctl0_ContentPlaceHolder1_tbfecha_vencimiento"[^>]*value="(\d{8})"/i,
      /value="(\d{8})"[^>]*id="_ctl0_ContentPlaceHolder1_tbfecha_vencimiento"/i,
    ];
    for (const re of patterns) {
      const m = html.match(re);
      if (m) {
        const raw = m[1];
        const iso = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
        const d = new Date(iso);
        if (!isNaN(d.getTime())) return iso;
      }
    }
    return null;
  }

  private parseFechaVencimiento(html: string): string | null {
    const contextPatterns = [
      /[Vv]encimiento[^<]{0,80}?(\d{1,2}\/\d{1,2}\/\d{4})/s,
      /[Vv]igencia[^<]{0,80}?(\d{1,2}\/\d{1,2}\/\d{4})/s,
      /[Ff]echa\s+[Vv]enc[^<]{0,60}?(\d{1,2}\/\d{1,2}\/\d{4})/is,
      /[Ff]echa\s+[Vv]ig[^<]{0,60}?(\d{1,2}\/\d{1,2}\/\d{4})/is,
      /[Hh]asta\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{4})/,
    ];

    for (const re of contextPatterns) {
      const m = html.match(re);
      if (m) {
        const parsed = this.parseDdMmYyyy(m[1]);
        if (parsed) return parsed;
      }
    }

    const allDates: { iso: string; ts: number }[] = [];
    const dateRe = /\b(\d{1,2}\/\d{1,2}\/\d{4})\b/g;
    let m;
    while ((m = dateRe.exec(html)) !== null) {
      const iso = this.parseDdMmYyyy(m[1]);
      if (iso) {
        const ts = new Date(iso).getTime();
        if (ts > Date.now()) allDates.push({ iso, ts });
      }
    }

    if (allDates.length > 0) {
      allDates.sort((a, b) => b.ts - a.ts);
      return allDates[0].iso;
    }

    return null;
  }

  private parseDdMmYyyy(fecha: string): string | null {
    const m = fecha.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return null;
    const [, dd, mm, yyyy] = m;
    const d = new Date(`${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`);
    return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
  }

  // ── Cookie helpers ───────────────────────────────────────────────────────────

  private mergeCookies(existing: string, headers: Headers): string {
    // getSetCookie() disponible en Node.js 20+ / WHATWG Headers
    const newCookies: string[] =
      typeof (headers as { getSetCookie?: () => string[] }).getSetCookie === 'function'
        ? (headers as { getSetCookie: () => string[] }).getSetCookie()
        : (headers.get('set-cookie') ?? '').split(/,(?=[^ ])/).filter(Boolean);

    if (newCookies.length === 0) return existing;

    const jar: Record<string, string> = {};
    for (const pair of existing.split(';')) {
      const [k, ...v] = pair.trim().split('=');
      if (k?.trim()) jar[k.trim()] = v.join('=').trim();
    }
    for (const sc of newCookies) {
      const [pair] = sc.split(';');
      const [k, ...v] = pair.split('=');
      if (k?.trim()) jar[k.trim()] = v.join('=').trim();
    }
    return Object.entries(jar)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

  // ── HTML helpers ─────────────────────────────────────────────────────────────

  private extractHidden(html: string, name: string): string | null {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const m =
      html.match(new RegExp(`<input[^>]+name="${escaped}"[^>]*value="([^"]*)"`, 'i')) ??
      html.match(new RegExp(`<input[^>]+value="([^"]*)"[^>]*name="${escaped}"`, 'i'));
    return m ? m[1] : null;
  }

  private extractFieldNameById(html: string, id: string): string | null {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const m =
      html.match(new RegExp(`<input[^>]+id="${escaped}"[^>]*name="([^"]+)"`, 'i')) ??
      html.match(new RegExp(`<input[^>]+name="([^"]+)"[^>]*id="${escaped}"`, 'i'));
    return m ? m[1] : null;
  }

  // ── Fetch con timeout ────────────────────────────────────────────────────────

  private async timedFetch(url: string, init: RequestInit, ms = HTTP_TIMEOUT_MS): Promise<Response> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);
    try {
      return await fetch(url, { ...init, signal: ctrl.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  private timeoutValue<T>(value: T, ms: number): Promise<T> {
    return new Promise((resolve) => setTimeout(() => resolve(value), ms));
  }

  // ── Helpers de caché DB ──────────────────────────────────────────────────────

  private async getCached(nits: string[]): Promise<EnrichResult[]> {
    const res = await this.pool.query(
      `SELECT nit, fecha_vencimiento, fuente
         FROM reps_enriched
        WHERE nit = ANY($1) AND expira_at > NOW() AND fecha_vencimiento IS NOT NULL`,
      [nits]
    );
    return res.rows.map((row: { nit: string; fecha_vencimiento: Date | string | null; fuente: string }) => ({
      nit: row.nit,
      fecha_vencimiento: row.fecha_vencimiento
        ? row.fecha_vencimiento instanceof Date
          ? row.fecha_vencimiento.toISOString().split('T')[0]
          : String(row.fecha_vencimiento).split('T')[0]
        : null,
      fuente: 'cache' as const,
      ok: true,
    }));
  }

  private async isInCooldown(nit: string): Promise<boolean> {
    const res = await this.pool.query(
      `SELECT 1 FROM reps_enriched
        WHERE nit = $1
          AND intentos_fallidos > 0
          AND enriquecido_at > NOW() - INTERVAL '${RETRY_COOLDOWN_HOURS} hours'`,
      [nit]
    );
    return res.rows.length > 0;
  }

  private async saveCacheSuccess(nit: string, fecha: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO reps_enriched
         (nit, fecha_vencimiento, fuente, enriquecido_at, expira_at, intentos_fallidos, ultimo_error)
       VALUES ($1, $2, 'minsalud_scrape', NOW(), NOW() + INTERVAL '${CACHE_TTL_DAYS} days', 0, NULL)
       ON CONFLICT (nit) DO UPDATE SET
         fecha_vencimiento = EXCLUDED.fecha_vencimiento,
         fuente            = 'minsalud_scrape',
         enriquecido_at    = NOW(),
         expira_at         = NOW() + INTERVAL '${CACHE_TTL_DAYS} days',
         intentos_fallidos = 0,
         ultimo_error      = NULL`,
      [nit, fecha]
    );
  }

  private async recordFailure(nit: string, error: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO reps_enriched
         (nit, fecha_vencimiento, fuente, enriquecido_at, expira_at, intentos_fallidos, ultimo_error)
       VALUES ($1, NULL, 'minsalud_scrape', NOW(), NOW() + INTERVAL '1 day', 1, $2)
       ON CONFLICT (nit) DO UPDATE SET
         intentos_fallidos = reps_enriched.intentos_fallidos + 1,
         enriquecido_at    = NOW(),
         expira_at         = NOW() + INTERVAL '1 day',
         ultimo_error      = $2`,
      [nit, error.substring(0, 500)]
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
