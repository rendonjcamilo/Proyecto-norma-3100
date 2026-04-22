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
        const userId = (req as any).user?.id || (req as any).userId;
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
