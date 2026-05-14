/**
 * Anexo 4 Routes — Verificación Estándar de Historia Clínica y Registros Asistenciales
 * Formulario independiente (no ligado a un prestador específico).
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { rbacMiddleware } from '../middleware/role.middleware.js';
import { Anexo4Service } from '../services/Anexo4Service.js';
import { logger } from '../utils/logger.js';

export function createAnexo4Router(pool: Pool): Router {
  const router = Router();
  const service = new Anexo4Service(pool);

  /**
   * GET /api/anexo4
   * Lista verificaciones, ordenadas por fecha DESC.
   */
  router.get(
    '/anexo4',
    authMiddleware,
    rbacMiddleware(['auditor', 'super_admin']),
    async (_req: Request, res: Response) => {
      try {
        const data = await service.list(100);
        res.json({ data });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error({ msg: 'Error listando anexo4', error: msg });
        res.status(500).json({ error: msg });
      }
    },
  );

  /**
   * POST /api/anexo4
   * Crea una nueva verificación.
   */
  router.post(
    '/anexo4',
    authMiddleware,
    rbacMiddleware(['auditor', 'super_admin']),
    async (req: Request, res: Response) => {
      try {
        const { servicio, fecha, registros, observaciones, assessment_id } = req.body as Record<string, unknown>;

        if (!servicio || typeof servicio !== 'string') {
          return res.status(400).json({ error: 'servicio es requerido' });
        }
        if (!fecha || typeof fecha !== 'string') {
          return res.status(400).json({ error: 'fecha es requerida (YYYY-MM-DD)' });
        }
        if (!Array.isArray(registros) || registros.length === 0) {
          return res.status(400).json({ error: 'Se requiere al menos 1 registro de H.C.' });
        }
        if (registros.length > 10) {
          return res.status(400).json({ error: 'Máximo 10 registros de H.C. por verificación' });
        }

        const data = await service.create({
          servicio,
          fecha,
          auditor_id: req.user!.user_id,
          registros,
          observaciones: typeof observaciones === 'string' ? observaciones : null,
          assessment_id: typeof assessment_id === 'string' ? assessment_id : null,
        });

        res.status(201).json({ data });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error({ msg: 'Error creando anexo4', error: msg });
        res.status(500).json({ error: msg });
      }
    },
  );

  /**
   * GET /api/anexo4/by-assessment/:assessmentId
   * Obtiene la verificación H.C. vinculada a una auditoría específica.
   * Debe ir ANTES de /anexo4/:id para que Express no trate "by-assessment" como un :id.
   */
  router.get(
    '/anexo4/by-assessment/:assessmentId',
    authMiddleware,
    rbacMiddleware(['auditor', 'super_admin']),
    async (req: Request, res: Response) => {
      try {
        const data = await service.getByAssessmentId(req.params.assessmentId);
        res.json({ data: data ?? null });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error({ msg: 'Error obteniendo anexo4 by-assessment', error: msg });
        res.status(500).json({ error: msg });
      }
    },
  );

  /**
   * GET /api/anexo4/:id
   * Obtiene una verificación por ID.
   */
  router.get(
    '/anexo4/:id',
    authMiddleware,
    rbacMiddleware(['auditor', 'super_admin']),
    async (req: Request, res: Response) => {
      try {
        const data = await service.getById(req.params.id);
        if (!data) return res.status(404).json({ error: 'Verificación no encontrada' });
        res.json({ data });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error({ msg: 'Error obteniendo anexo4', error: msg });
        res.status(500).json({ error: msg });
      }
    },
  );

  /**
   * PUT /api/anexo4/:id
   * Actualiza una verificación existente.
   */
  router.put(
    '/anexo4/:id',
    authMiddleware,
    rbacMiddleware(['auditor', 'super_admin']),
    async (req: Request, res: Response) => {
      try {
        const { servicio, fecha, registros, observaciones } = req.body as Record<string, unknown>;

        if (Array.isArray(registros) && registros.length > 10) {
          return res.status(400).json({ error: 'Máximo 10 registros de H.C. por verificación' });
        }

        const data = await service.update(req.params.id, {
          servicio: typeof servicio === 'string' ? servicio : undefined,
          fecha:    typeof fecha    === 'string' ? fecha    : undefined,
          registros: Array.isArray(registros) ? registros : undefined,
          observaciones: typeof observaciones === 'string' ? observaciones : undefined,
        });

        if (!data) return res.status(404).json({ error: 'Verificación no encontrada' });
        res.json({ data });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error({ msg: 'Error actualizando anexo4', error: msg });
        res.status(500).json({ error: msg });
      }
    },
  );

  /**
   * DELETE /api/anexo4/:id
   * Elimina una verificación.
   */
  router.delete(
    '/anexo4/:id',
    authMiddleware,
    rbacMiddleware(['auditor', 'super_admin']),
    async (req: Request, res: Response) => {
      try {
        const ok = await service.delete(req.params.id);
        if (!ok) return res.status(404).json({ error: 'Verificación no encontrada' });
        res.status(204).send();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error({ msg: 'Error eliminando anexo4', error: msg });
        res.status(500).json({ error: msg });
      }
    },
  );

  /**
   * GET /api/anexo4/:id/pdf
   * Genera y descarga el PDF del Anexo 4.
   */
  router.get(
    '/anexo4/:id/pdf',
    authMiddleware,
    rbacMiddleware(['auditor', 'super_admin']),
    async (req: Request, res: Response) => {
      try {
        const v = await service.getById(req.params.id);
        if (!v) return res.status(404).json({ error: 'Verificación no encontrada' });

        const pdfBuffer = await service.generatePdf(v);
        const filename  = `Anexo4-HC-${v.fecha}-${v.servicio.replace(/\s+/g, '_').substring(0, 30)}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.send(pdfBuffer);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error({ msg: 'Error generando PDF anexo4', error: msg });
        res.status(500).json({ error: msg });
      }
    },
  );

  return router;
}
