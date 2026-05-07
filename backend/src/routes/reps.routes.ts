/**
 * REPS Registry Routes — Registro Especial de Prestadores de Servicios de Salud
 * Endpoints para consulta de habilitación, servicios habilitados y verificaciones
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { RepsService } from '../services/RepsService.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { rbacMiddleware } from '../middleware/role.middleware.js';
import { logger } from '../utils/logger.js';

export function createRepsRouter(pool: Pool): Router {
  const router = Router();
  const repsService = new RepsService(pool);

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

        logger.info({
          msg: 'REPS consulta',
          codigo: codigoHabilitacion,
          found: result.found,
          source: result.source,
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
          userId,
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
        const limit = Math.min(Math.max(parseInt(String(req.query.limit || '100'), 10) || 100, 1), 200);
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
          campo_vencimiento: null,
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error consultando prospectos REPS', error: msg });
        res.status(500).json({ error: msg });
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

  return router;
}
