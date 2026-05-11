/**
 * REPS Alert Routes — Cron de prospección semi-automática por vencimiento de habilitación
 * Permite configurar, activar y ejecutar manualmente el trigger diario.
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { RepsAlertService } from '../services/RepsAlertService.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { rbacMiddleware } from '../middleware/role.middleware.js';
import { logger } from '../utils/logger.js';

export function createRepsAlertsRouter(pool: Pool, alertService: RepsAlertService): Router {
  const router = Router();

  /**
   * GET /api/reps/alertas/config
   * Retorna la configuración actual del trigger + el último resultado de ejecución.
   */
  router.get(
    '/reps/alertas/config',
    authMiddleware,
    rbacMiddleware(['auditor', 'super_admin']),
    async (_req: Request, res: Response) => {
      try {
        const trigger = await alertService.getOrCreateDefaultTrigger();
        const lastResult = await alertService.getLastResult(trigger.id);
        res.json({ data: { trigger, lastResult } });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error obteniendo config de alerta REPS', error: msg });
        res.status(500).json({ error: msg });
      }
    }
  );

  /**
   * PUT /api/reps/alertas/config
   * Actualiza la configuración del trigger (departamento, municipio, límites, hora, etc.)
   * Si el trigger ya está activo, re-agenda con la nueva configuración.
   */
  router.put(
    '/reps/alertas/config',
    authMiddleware,
    rbacMiddleware(['auditor', 'super_admin']),
    async (req: Request, res: Response) => {
      try {
        const trigger = await alertService.getOrCreateDefaultTrigger();
        const { departamento, municipio, clase_prestador, max_providers, dias_antes_vencer, solo_con_celular, hora_local } = req.body as Record<string, unknown>;

        const updated = await alertService.updateTrigger(trigger.id, {
          departamento: typeof departamento === 'string' ? (departamento || null) : undefined,
          municipio: typeof municipio === 'string' ? (municipio || null) : undefined,
          clase_prestador: typeof clase_prestador === 'string' ? (clase_prestador || null) : undefined,
          max_providers: max_providers !== undefined ? Math.min(Math.max(parseInt(String(max_providers)), 1), 3000) : undefined,
          dias_antes_vencer: dias_antes_vencer !== undefined ? Math.min(Math.max(parseInt(String(dias_antes_vencer)), 1), 365) : undefined,
          solo_con_celular: solo_con_celular !== undefined ? Boolean(solo_con_celular) : undefined,
          hora_local: hora_local !== undefined ? Math.min(Math.max(parseInt(String(hora_local)), 0), 23) : undefined,
        });

        // Re-agendar si ya estaba activo
        if (updated.is_active) {
          alertService.scheduleNext(updated);
        }

        res.json({ data: updated });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error actualizando config de alerta REPS', error: msg });
        res.status(500).json({ error: msg });
      }
    }
  );

  /**
   * POST /api/reps/alertas/activar
   * Activa el trigger y agenda la primera ejecución a la hora configurada.
   */
  router.post(
    '/reps/alertas/activar',
    authMiddleware,
    rbacMiddleware(['auditor', 'super_admin']),
    async (_req: Request, res: Response) => {
      try {
        const trigger = await alertService.getOrCreateDefaultTrigger();

        if (!trigger.departamento && !trigger.municipio) {
          return res.status(400).json({
            error: 'Configura al menos departamento o municipio antes de activar la alerta',
          });
        }

        const updated = await alertService.updateTrigger(trigger.id, { is_active: true });
        alertService.scheduleNext(updated);

        logger.info({ msg: 'REPS Alert activada', triggerId: trigger.id });
        res.json({ data: updated, message: 'Alerta activada — se ejecutará a las ' + updated.hora_local + ':00 hrs' });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error activando alerta REPS', error: msg });
        res.status(500).json({ error: msg });
      }
    }
  );

  /**
   * POST /api/reps/alertas/desactivar
   * Desactiva el trigger y cancela el scheduler.
   */
  router.post(
    '/reps/alertas/desactivar',
    authMiddleware,
    rbacMiddleware(['auditor', 'super_admin']),
    async (_req: Request, res: Response) => {
      try {
        const trigger = await alertService.getOrCreateDefaultTrigger();
        const updated = await alertService.updateTrigger(trigger.id, { is_active: false });
        alertService.cancelScheduler(trigger.id);

        logger.info({ msg: 'REPS Alert desactivada', triggerId: trigger.id });
        res.json({ data: updated, message: 'Alerta desactivada' });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error desactivando alerta REPS', error: msg });
        res.status(500).json({ error: msg });
      }
    }
  );

  /**
   * POST /api/reps/alertas/ejecutar
   * Dispara la consulta manualmente (sin esperar al cron).
   * Útil para probar o para actualizar la lista en cualquier momento.
   */
  router.post(
    '/reps/alertas/ejecutar',
    authMiddleware,
    rbacMiddleware(['auditor', 'super_admin']),
    async (_req: Request, res: Response) => {
      try {
        const trigger = await alertService.getOrCreateDefaultTrigger();

        if (!trigger.departamento && !trigger.municipio) {
          return res.status(400).json({
            error: 'Configura al menos departamento o municipio antes de ejecutar',
          });
        }

        const result = await alertService.runTrigger(trigger.id);
        res.json({ data: result, message: 'Ejecución completada' });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error ejecutando alerta REPS', error: msg });
        res.status(500).json({ error: msg });
      }
    }
  );

  /**
   * GET /api/reps/alertas/resultado
   * Retorna el último resultado con la lista completa de prestadores por vencer.
   */
  router.get(
    '/reps/alertas/resultado',
    authMiddleware,
    rbacMiddleware(['auditor', 'super_admin']),
    async (_req: Request, res: Response) => {
      try {
        const trigger = await alertService.getOrCreateDefaultTrigger();
        const result = await alertService.getLastResult(trigger.id);
        res.json({ data: result });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error obteniendo resultado de alerta REPS', error: msg });
        res.status(500).json({ error: msg });
      }
    }
  );

  return router;
}
