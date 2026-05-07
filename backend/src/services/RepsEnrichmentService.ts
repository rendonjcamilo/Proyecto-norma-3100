/**
 * RepsEnrichmentService — Enriquece prospectos REPS con fecha de vencimiento
 *
 * El dataset público datos.gov.co (c36g-9fc2) no incluye fecha_vencimiento.
 * Este servicio la obtiene del portal oficial MINSALUD (prestadores.minsalud.gov.co)
 * mediante Puppeteer (Chromium headless) y la almacena en caché (reps_enriched, TTL 30 días).
 *
 * Flujo:
 * 1. enrichLote([nits])  → consulta caché, luego scraping con Puppeteer para los pendientes
 * 2. setManual(nit, fecha) → ingreso manual cuando el scraping falla
 * 3. getBatchCached([nits]) → sólo caché, sin scraping (para merge rápido en API)
 */

import puppeteer, { Browser } from 'puppeteer';
import { Pool } from 'pg';
import { logger } from '../utils/logger.js';

const MINSALUD_BASE_URL = 'https://prestadores.minsalud.gov.co/habilitacion/';
const MINSALUD_REPS_URL = 'https://prestadores.minsalud.gov.co/habilitacion/consultas/habilitados_reps.aspx?pageTitle=Registro%20Actual&pageHlp=';
const CACHE_TTL_DAYS = 30;
const RETRY_COOLDOWN_HOURS = 24;
const SCRAPE_DELAY_MS = 4000;

// Ruta de Chromium del sistema (Alpine Linux en Docker) o bundled como fallback
const CHROMIUM_PATH = process.env.CHROMIUM_PATH || '/usr/bin/chromium';

export interface EnrichResult {
  nit: string;
  fecha_vencimiento: string | null;
  fuente: 'minsalud_scrape' | 'manual' | 'cache';
  ok: boolean;
  error?: string;
}

export class RepsEnrichmentService {
  private browser: Browser | null = null;
  private browserBirthMs = 0;
  private readonly BROWSER_MAX_AGE_MS = 8 * 60 * 1000; // 8 minutos
  // Página de búsqueda con sesión activa — reutilizada entre NITs del mismo lote
  private repsPage: import('puppeteer').Page | null = null;
  private repsPageReadyAt = 0;
  private readonly REPS_PAGE_MAX_AGE_MS = 6 * 60 * 1000; // 6 minutos

  constructor(private pool: Pool) {}

  // ── API pública ─────────────────────────────────────────────────────────────

  /**
   * Enriquece un lote de NITs con fecha_vencimiento.
   * Retorna primero los cacheados, luego intenta scraping para los pendientes.
   * Máximo 20 NITs por llamada.
   */
  async enrichLote(nits: string[]): Promise<EnrichResult[]> {
    const unique = [...new Set(nits.map((n) => n.trim()).filter(Boolean))].slice(0, 20);
    if (unique.length === 0) return [];

    const cached = await this.getCached(unique);
    const cachedNits = new Set(cached.map((r) => r.nit));

    const pendientes = unique.filter((n) => !cachedNits.has(n));
    const scraped: EnrichResult[] = [];

    for (let i = 0; i < pendientes.length; i++) {
      const result = await this.scrapeNit(pendientes[i]);
      scraped.push(result);
      if (i < pendientes.length - 1) await this.sleep(SCRAPE_DELAY_MS);
    }

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
          ? (row.fecha_vencimiento instanceof Date
              ? row.fecha_vencimiento.toISOString().split('T')[0]
              : String(row.fecha_vencimiento).split('T')[0])
          : null,
        fuente: row.fuente,
      });
    }
    return map;
  }

  // ── Gestión del browser Puppeteer ────────────────────────────────────────────

  private async getBrowser(): Promise<Browser> {
    const now = Date.now();

    // Reutilizar si está vivo y no es muy viejo
    if (this.browser) {
      try {
        await this.browser.version();
        if (now - this.browserBirthMs < this.BROWSER_MAX_AGE_MS) {
          return this.browser;
        }
      } catch {
        // browser crasheó — limpiar
      }
      try { await this.browser.close(); } catch { /* ignorar */ }
      this.browser = null;
    }

    this.browser = await puppeteer.launch({
      executablePath: CHROMIUM_PATH,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-default-apps',
        '--mute-audio',
      ],
    });
    this.browserBirthMs = now;
    logger.info({ msg: 'REPS Puppeteer browser iniciado' });
    return this.browser;
  }

  // ── Scraping MINSALUD con Puppeteer ─────────────────────────────────────────

  private async scrapeNit(nit: string): Promise<EnrichResult> {
    try {
      if (await this.isInCooldown(nit)) {
        return { nit, fecha_vencimiento: null, fuente: 'minsalud_scrape', ok: false, error: 'Cooldown activo' };
      }

      const fecha = await this.fetchFromMinsalud(nit);

      if (fecha) {
        await this.saveCacheSuccess(nit, fecha);
        logger.info({ msg: 'REPS enriquecido', nit, fecha_vencimiento: fecha });
        return { nit, fecha_vencimiento: fecha, fuente: 'minsalud_scrape', ok: true };
      }

      await this.recordFailure(nit, 'Fecha no encontrada en el portal');
      return { nit, fecha_vencimiento: null, fuente: 'minsalud_scrape', ok: false, error: 'Fecha no encontrada' };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      await this.recordFailure(nit, error);
      logger.warn({ msg: 'REPS scraping fallido', nit, error });
      return { nit, fecha_vencimiento: null, fuente: 'minsalud_scrape', ok: false, error };
    }
  }

  /**
   * Obtiene (o crea) una página de búsqueda REPS con sesión activa.
   * La sesión se reutiliza entre NITs del mismo lote para no repetir el login.
   */
  private async getRepsPage(): Promise<import('puppeteer').Page> {
    const now = Date.now();

    // Verificar si la página existente sigue viva y joven
    if (this.repsPage && now - this.repsPageReadyAt < this.REPS_PAGE_MAX_AGE_MS) {
      try {
        await this.repsPage.evaluate(() => document.title);
        return this.repsPage;
      } catch {
        this.repsPage = null;
      }
    }

    // Crear una nueva sesión completa
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(35000);
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    );

    // PASO 1: cargar el frameset para establecer sesión ASP.NET
    await page.goto(MINSALUD_BASE_URL, { waitUntil: 'load' });
    await this.sleep(1500);

    // PASO 2: cerrar modal de aviso si aparece
    const workFrame = page.frames().find((f) => f.name() === 'areawork');
    if (workFrame) {
      await workFrame.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        for (const b of btns) {
          if ((b.textContent ?? '').includes('Cerrar')) { b.click(); break; }
        }
      }).catch(() => { /* modal puede no existir */ });
      await this.sleep(1000);

      // PASO 3: login con invitado/invitado
      await workFrame.click('#Button1').catch(() => { /* ignorar */ });
      await this.sleep(4000);
    }

    // PASO 4: navegar a la búsqueda REPS con Referer correcto
    await page.setExtraHTTPHeaders({ Referer: MINSALUD_BASE_URL + 'work.aspx' });
    await page.goto(MINSALUD_REPS_URL, { waitUntil: 'networkidle2' });

    this.repsPage = page;
    this.repsPageReadyAt = Date.now();
    logger.info({ msg: 'REPS sesión Puppeteer establecida' });
    return page;
  }

  private async fetchFromMinsalud(nit: string): Promise<string | null> {
    const page = await this.getRepsPage();

    try {
      // Navegar a la URL de búsqueda antes de cada NIT para evitar resultados obsoletos
      await page.goto(MINSALUD_REPS_URL, { waitUntil: 'networkidle2', timeout: 30000 });
      await this.sleep(1000);

      // Escribir NIT en campo de búsqueda
      await page.click('#_ctl0_ContentPlaceHolder1_tbnits_nit', { clickCount: 3 });
      await page.type('#_ctl0_ContentPlaceHolder1_tbnits_nit', nit, { delay: 50 });

      // Buscar y esperar respuesta
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 25000 }).catch(() => null),
        page.click('#_ctl0_ibBuscarHdr'),
      ]);
      await this.sleep(2000);

      // Leer fecha_vencimiento del campo (formato YYYYMMDD)
      const fechaRaw = await page.$eval(
        '#_ctl0_ContentPlaceHolder1_tbfecha_vencimiento',
        (el) => (el as HTMLInputElement).value ?? ''
      ).catch(() => '');

      logger.info({ msg: 'REPS scrape Puppeteer', nit, fechaRaw });

      if (fechaRaw && fechaRaw.length === 8) {
        const iso = `${fechaRaw.slice(0, 4)}-${fechaRaw.slice(4, 6)}-${fechaRaw.slice(6, 8)}`;
        const d = new Date(iso);
        if (!isNaN(d.getTime())) return iso;
      }

      // Fallback: parsear fechas DD/MM/YYYY del HTML
      const html = await page.content();
      return this.parseFechaVencimiento(html);
    } catch (err) {
      // Si la página se corrompió, invalidar para la próxima llamada
      this.repsPage = null;
      throw err;
    }
  }

  // ── Parseo HTML ─────────────────────────────────────────────────────────────

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

    // Fallback: mayor fecha futura en el HTML
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

  // ── Helpers de caché ────────────────────────────────────────────────────────

  private async getCached(nits: string[]): Promise<EnrichResult[]> {
    const res = await this.pool.query(
      `SELECT nit, fecha_vencimiento, fuente
         FROM reps_enriched
        WHERE nit = ANY($1) AND expira_at > NOW() AND fecha_vencimiento IS NOT NULL`,
      [nits]
    );
    return res.rows.map((row) => ({
      nit: row.nit,
      fecha_vencimiento: row.fecha_vencimiento
        ? String(row.fecha_vencimiento).split('T')[0]
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
