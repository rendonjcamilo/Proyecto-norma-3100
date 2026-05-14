/**
 * REPS Registry Routes — Registro Especial de Prestadores de Servicios de Salud
 * Endpoints para consulta de habilitación, servicios habilitados y verificaciones
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { RepsService } from '../services/RepsService.js';
import { RepsEnrichmentService } from '../services/RepsEnrichmentService.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { rbacMiddleware } from '../middleware/role.middleware.js';
import { logger } from '../utils/logger.js';

export function createRepsRouter(pool: Pool): Router {
  const router = Router();
  const repsService = new RepsService(pool);
  const enrichmentService = new RepsEnrichmentService(pool);

  // ─── CONSULTA: Buscar en datos.gov.co SODA API ───

  /**
   * GET /api/reps/consultar/:codigoHabilitacion
   * Consulta datos.gov.co SODA API por código de habilitación
   * Roles: auditor
   * NOTE: Norma 3100 - only auditor verifies REPS registrations
   */
  router.get(
    '/reps/consultar/:codigoHabilitacion',
    authMiddleware,
    rbacMiddleware(['auditor']),
    async (req: Request, res: Response) => {
      try {
        const { codigoHabilitacion } = req.params;

        if (!codigoHabilitacion || codigoHabilitacion.trim().length < 3) {
          return res.status(400).json({ error: 'Código de habilitación debe tener al menos 3 caracteres' });
        }

        const result = await repsService.consultarEnReps(codigoHabilitacion);

        // Si datos.gov.co no trajo fecha_vencimiento, buscar en caché del scraping MINSALUD
        if (result.found && result.data && !result.data.fecha_vencimiento) {
          const enriched = await pool.query<{ fecha_vencimiento: string }>(
            `SELECT fecha_vencimiento FROM reps_enriched
             WHERE nit = $1 AND fecha_vencimiento IS NOT NULL
             ORDER BY updated_at DESC LIMIT 1`,
            [result.data.nit]
          ).catch(() => ({ rows: [] as { fecha_vencimiento: string }[] }));
          if (enriched.rows.length > 0) {
            result.data.fecha_vencimiento = enriched.rows[0].fecha_vencimiento;
          }
        }

        logger.info({
          msg: 'REPS consulta',
          codigo: codigoHabilitacion,
          found: result.found,
          source: result.source,
          tiene_fecha_vencimiento: !!(result.data?.fecha_vencimiento),
        });

        res.json({ data: result });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error in REPS consulta', error: msg });
        res.status(500).json({ error: msg });
      }
    }
  );

  // ─── VERIFICACIONES: CRUD ───

  /**
   * GET /api/providers/:providerId/reps/ultima
   * Obtener última verificación del prestador
   * Roles: auditor, provider_admin
   */
  router.get(
    '/providers/:providerId/reps/ultima',
    authMiddleware,
    rbacMiddleware(['auditor', 'provider_admin']),
    async (req: Request, res: Response) => {
      try {
        const { providerId } = req.params;
        const verificacion = await repsService.getUltimaVerificacion(providerId);

        if (!verificacion) {
          return res.json({ data: null });
        }

        res.json({ data: verificacion });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error getting ultima REPS verificacion', error: msg });
        res.status(500).json({ error: msg });
      }
    }
  );

  /**
   * GET /api/providers/:providerId/reps/historial
   * Obtener historial de verificaciones del prestador
   * Roles: auditor, provider_admin
   */
  router.get(
    '/providers/:providerId/reps/historial',
    authMiddleware,
    rbacMiddleware(['auditor', 'provider_admin']),
    async (req: Request, res: Response) => {
      try {
        const { providerId } = req.params;
        const historial = await repsService.getHistorialVerificaciones(providerId);

        res.json({ data: historial, total: historial.length });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error getting REPS historial', error: msg });
        res.status(500).json({ error: msg });
      }
    }
  );

  /**
   * POST /api/providers/:providerId/reps/verificaciones
   * Registrar nueva verificación REPS
   * Roles: auditor
   * NOTE: Norma 3100 - only auditor records REPS verifications
   */
  router.post(
    '/providers/:providerId/reps/verificaciones',
    authMiddleware,
    rbacMiddleware(['auditor']),
    async (req: Request, res: Response) => {
      try {
        const { providerId } = req.params;
        const userId = req.user?.user_id;
        const { datosReps } = req.body as { datosReps: unknown };

        if (!datosReps) {
          return res.status(400).json({ error: 'datosReps es requerido' });
        }

        const verificacion = await repsService.registrarVerificacion(
          providerId,
          userId ?? '',
          datosReps as Parameters<typeof repsService.registrarVerificacion>[2]
        );

        res.status(201).json({ data: verificacion, message: 'Verificación REPS registrada' });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error registrando REPS verificacion', error: msg });
        res.status(500).json({ error: msg });
      }
    }
  );

  // ─── MERCADO POTENCIAL: consulta directa a datos.gov.co ───

  /**
   * GET /api/reps/mercado-potencial?departamento=CUNDINAMARCA&municipio=BOGOTÁ&clase=...&soloConCelular=true
   * Consulta datos.gov.co en tiempo real — prospectos comerciales del REPS nacional.
   * No requiere que el prestador esté en la BD interna.
   * Roles: auditor, super_admin
   */
  router.get(
    '/reps/mercado-potencial',
    authMiddleware,
    rbacMiddleware(['auditor', 'super_admin']),
    async (req: Request, res: Response) => {
      try {
        const departamento = req.query.departamento ? String(req.query.departamento).trim() : undefined;
        const municipio = req.query.municipio ? String(req.query.municipio).trim() : undefined;
        const clasePrestador = req.query.clase ? String(req.query.clase).trim() : undefined;
        const soloConCelular = req.query.soloConCelular === 'true';
        const limitRaw = parseInt(String(req.query.limit ?? '100'), 10);
        const limit = isNaN(limitRaw) ? 100 : Math.min(Math.max(limitRaw, 1), 3000);
        const diasHastaVencer = req.query.diasHastaVencer
          ? Math.min(Math.max(parseInt(String(req.query.diasHastaVencer), 10) || 0, 0), 365)
          : undefined;

        if (!departamento && !municipio) {
          return res.status(400).json({ error: 'Selecciona al menos departamento o municipio para buscar' });
        }

        const resultado = await repsService.buscarProspectosReps({
          departamento,
          municipio,
          clasePrestador,
          soloConCelular,
          diasHastaVencer,
          limit,
        });

        // Merge automático con caché de fechas de vencimiento
        if (resultado.data.length > 0) {
          const nits = resultado.data.map((p) => p.nit).filter(Boolean);
          const enrichedMap = await enrichmentService.getBatchCached(nits);

          const today = Date.now();
          resultado.data = resultado.data.map((p) => {
            const cached = enrichedMap.get(p.nit);
            if (cached?.fecha_vencimiento) {
              const dias = Math.floor(
                (new Date(cached.fecha_vencimiento).getTime() - today) / 86_400_000
              );
              return { ...p, fecha_vencimiento: cached.fecha_vencimiento, dias_hasta_vencer: dias };
            }
            return p;
          });
        }

        logger.info({
          msg: 'REPS prospectos consultados',
          departamento,
          municipio,
          clasePrestador,
          soloConCelular,
          total: resultado.total,
        });

        res.json({
          data: resultado.data,
          total: resultado.total,
          departamento_filtrado: departamento || null,
          municipio_filtrado: municipio || null,
          clase_filtrada: clasePrestador || null,
          campo_vencimiento: 'reps_enriched_cache',
        });
      } catch (error) {
        const isAbort = (error as Error)?.name === 'AbortError' || String((error as Error)?.message).includes('abort');
        const msg = isAbort
          ? 'Tiempo de espera agotado al consultar datos.gov.co. Reduce el número de resultados o afina los filtros.'
          : (error instanceof Error ? error.message : String(error));
        logger.error({ msg: 'Error consultando prospectos REPS', error: msg });
        res.status(isAbort ? 504 : 500).json({ error: msg });
      }
    }
  );

  // ─── ALERTA DE VENCIMIENTO desde BD interna ───

  /**
   * GET /api/reps/proximos-a-vencer?dias=30
   * Prestadores en BD interna con fecha_vencimiento REPS dentro de los próximos N días
   * Roles: auditor, super_admin
   */
  router.get(
    '/reps/proximos-a-vencer',
    authMiddleware,
    rbacMiddleware(['auditor', 'super_admin']),
    async (req: Request, res: Response) => {
      try {
        const dias = Math.min(Math.max(parseInt(String(req.query.dias || '30'), 10) || 30, 1), 365);
        const proximos = await repsService.getProximosAVencer(dias);

        logger.info({ msg: 'REPS proximos a vencer (BD) consultados', dias, total: proximos.length });

        res.json({ data: proximos, total: proximos.length, dias_consultados: dias });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error obteniendo proximos a vencer', error: msg });
        res.status(500).json({ error: msg });
      }
    }
  );

  // ─── RESUMEN ───

  /**
   * GET /api/providers/:providerId/reps/resumen
   * Resumen de estado REPS del prestador (última verificación, diferencias, sanciones)
   * Roles: auditor, provider_admin
   */
  router.get(
    '/providers/:providerId/reps/resumen',
    authMiddleware,
    rbacMiddleware(['auditor', 'provider_admin']),
    async (req: Request, res: Response) => {
      try {
        const { providerId } = req.params;
        const resumen = await repsService.getResumen(providerId);

        res.json({ data: resumen });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error getting REPS resumen', error: msg });
        res.status(500).json({ error: msg });
      }
    }
  );

  // ─── ENRIQUECIMIENTO: Scraping MINSALUD por lote de NITs ───

  /**
   * POST /api/reps/enriquecer-lote
   * Obtiene fecha_vencimiento para un lote de NITs vía scraping del portal MINSALUD.
   * Máximo 20 NITs por llamada. Resultados se cachean 30 días en reps_enriched.
   * Roles: auditor, super_admin
   */
  router.post(
    '/reps/enriquecer-lote',
    authMiddleware,
    rbacMiddleware(['auditor', 'super_admin']),
    async (req: Request, res: Response) => {
      try {
        const { nits } = req.body as { nits?: unknown };

        if (!Array.isArray(nits) || nits.length === 0) {
          return res.status(400).json({ error: 'Se requiere un array "nits" no vacío' });
        }

        const cleanNits = (nits as unknown[])
          .filter((n) => typeof n === 'string')
          .map((n) => String(n).trim())
          .filter(Boolean)
          .slice(0, 20);

        if (cleanNits.length === 0) {
          return res.status(400).json({ error: 'NITs inválidos' });
        }

        logger.info({ msg: 'REPS enriquecer-lote iniciado', total: cleanNits.length });

        const results = await enrichmentService.enrichLote(cleanNits);

        const exitosos = results.filter((r) => r.ok && r.fecha_vencimiento).length;
        logger.info({
          msg: 'REPS enriquecer-lote completado',
          total: results.length,
          exitosos,
          fallidos: results.length - exitosos,
        });

        res.json({ data: results, total: results.length, exitosos });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error en enriquecer-lote REPS', error: msg });
        res.status(500).json({ error: msg });
      }
    }
  );

  /**
   * POST /api/reps/enriquecer-manual
   * Ingreso manual de fecha_vencimiento para un NIT específico.
   * Útil cuando el scraping automático falla — el auditor consulta el portal manualmente.
   * Roles: auditor, super_admin
   */
  router.post(
    '/reps/enriquecer-manual',
    authMiddleware,
    rbacMiddleware(['auditor', 'super_admin']),
    async (req: Request, res: Response) => {
      try {
        const { nit, fecha_vencimiento, nombre_prestador } = req.body as {
          nit?: string;
          fecha_vencimiento?: string;
          nombre_prestador?: string;
        };

        if (!nit || typeof nit !== 'string' || !nit.trim()) {
          return res.status(400).json({ error: 'NIT es requerido' });
        }

        if (!fecha_vencimiento || typeof fecha_vencimiento !== 'string') {
          return res.status(400).json({ error: 'fecha_vencimiento es requerida (formato YYYY-MM-DD)' });
        }

        await enrichmentService.setManual(nit.trim(), fecha_vencimiento, nombre_prestador);

        logger.info({ msg: 'REPS fecha manual ingresada', nit, fecha_vencimiento });
        res.json({ ok: true, nit: nit.trim(), fecha_vencimiento });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error en enriquecer-manual REPS', error: msg });
        res.status(400).json({ error: msg });
      }
    }
  );

  return router;
}
