import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { ImprovementPlanService } from '../services/ImprovementPlanService.js';

export function createImprovementPlanRouter(pool: Pool): Router {
  const router = Router();
  const service = new ImprovementPlanService(pool);

  // GET /api/assessments/:assessmentId/improvement-plan
  // Retorna los ítems del plan de mejora. Si la evaluación ya fue enviada y
  // no hay ítems aún, los genera automáticamente desde los hallazgos.
  router.get('/assessments/:assessmentId/improvement-plan', authMiddleware, async (req: Request, res: Response) => {
    const { assessmentId } = req.params;
    try {
      let items = await service.getByAssessment(assessmentId);
      if (items.length === 0) {
        items = await service.generateFromFindings(assessmentId, pool);
      }
      res.json({ data: items });
    } catch (err) {
      res.status(500).json({ error: 'Error al obtener el plan de mejora' });
    }
  });

  // POST /api/assessments/:assessmentId/improvement-plan/generate
  // Fuerza la regeneración del plan desde los hallazgos (solo auditor/super_admin)
  router.post('/assessments/:assessmentId/improvement-plan/generate', authMiddleware, async (req: Request, res: Response) => {
    const { assessmentId } = req.params;
    const role = (req as unknown as { user?: { role?: string } }).user?.role;
    if (role !== 'auditor' && role !== 'super_admin') {
      res.status(403).json({ error: 'Solo auditores pueden regenerar el plan' });
      return;
    }
    try {
      const items = await service.generateFromFindings(assessmentId, pool);
      res.json({ data: items });
    } catch (err) {
      res.status(500).json({ error: 'Error al generar el plan de mejora' });
    }
  });

  // PATCH /api/improvement-plan/:id
  // Actualiza un ítem del plan (actividad de mejora, responsable, fechas, seguimientos)
  router.patch('/improvement-plan/:id', authMiddleware, async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      actividad_mejora,
      responsable,
      fecha_inicio,
      fecha_terminacion,
      fecha_ejecucion,
      observaciones,
      seguimiento_1,
      seguimiento_2,
      seguimiento_3,
    } = req.body;

    try {
      const updated = await service.updateItem(id, {
        actividad_mejora,
        responsable,
        fecha_inicio,
        fecha_terminacion,
        fecha_ejecucion,
        observaciones,
        seguimiento_1,
        seguimiento_2,
        seguimiento_3,
      });
      if (!updated) {
        res.status(404).json({ error: 'Ítem no encontrado' });
        return;
      }
      res.json({ data: updated });
    } catch (err) {
      res.status(500).json({ error: 'Error al actualizar el ítem' });
    }
  });

  return router;
}
