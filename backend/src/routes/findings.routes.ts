/**
 * Findings & Corrective Actions REST API Routes
 * Implements complete findings lifecycle and action planning workflow
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { rbacMiddleware } from '../middleware/role.middleware.js';
import { FindingService } from '../services/FindingService.js';
import { logger } from '../utils/logger.js';

export function createFindingsRouter(pool: Pool): Router {
  const router = Router();
  const findingService = new FindingService(pool);

  // ===== FINDINGS ENDPOINTS =====

  /**
   * GET /api/findings
   * List findings with filtering
   */
  router.get(
    '/findings',
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const { status, severity, service_id, provider_id, standard_id, assigned_to, limit, offset } = req.query;
        const user = (req as any).user;

        // Apply RBAC: provider_admin sees only own provider's findings
        let providerId = provider_id as string | undefined;
        if (user.role === 'provider_admin' && !providerId) {
          providerId = user.provider_id;
        } else if (user.role === 'provider_admin' && provider_id !== user.provider_id) {
          return res.status(403).json({ error: 'No autorizado para ver hallazgos de otros proveedores' });
        }

        const { findings, total } = await findingService.listFindings({
          status: status as string | undefined,
          severity: severity as string | undefined,
          service_id: service_id as string | undefined,
          provider_id: providerId,
          standard_id: standard_id as string | undefined,
          assigned_to: assigned_to as string | undefined,
          limit: limit ? parseInt(limit as string, 10) : 50,
          offset: offset ? parseInt(offset as string, 10) : 0,
        });

        res.json({
          findings,
          total,
          limit: limit ? parseInt(limit as string, 10) : 50,
          offset: offset ? parseInt(offset as string, 10) : 0,
        });
      } catch (err) {
        logger.error({
          msg: 'Error listing findings',
          error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'Error al obtener hallazgos' });
      }
    }
  );

  /**
   * GET /api/findings/:id
   * Get finding details with actions and history
   */
  router.get(
    '/findings/:id',
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const user = (req as any).user;
        const finding = await findingService.getFindingById(req.params.id);

        if (!finding) {
          return res.status(404).json({ error: 'Hallazgo no encontrado' });
        }

        // RBAC check
        if (user.role === 'provider_admin' && finding.provider_id !== user.provider_id) {
          return res.status(403).json({ error: 'No autorizado' });
        }

        // Get related actions
        const actions = await findingService.getActionsForFinding(req.params.id);

        // Get event history
        const events = await findingService.getFindingEvents(req.params.id);

        res.json({
          finding,
          actions,
          events,
        });
      } catch (err) {
        logger.error({
          msg: 'Error fetching finding',
          error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'Error al obtener hallazgo' });
      }
    }
  );

  /**
   * PUT /api/findings/:id
   * Update finding status, severity, or assignment
   */
  router.put(
    '/findings/:id',
    authMiddleware,
    rbacMiddleware(['auditor', 'super_admin']),
    async (req: Request, res: Response) => {
      try {
        const { status, severity, risk_score, assigned_to } = req.body;
        const user = (req as any).user;

        const finding = await findingService.getFindingById(req.params.id);
        if (!finding) {
          return res.status(404).json({ error: 'Hallazgo no encontrado' });
        }

        // Validate status transition
        if (status && !['abierta', 'en_revision', 'asignada', 'en_progreso', 'cerrada'].includes(status)) {
          return res.status(400).json({ error: 'Estado inválido' });
        }

        const updated = await findingService.updateFinding(req.params.id, {
          status,
          severity,
          risk_score,
          assigned_to,
          updated_by: user.id,
        });

        // Emit status change event
        if (status && status !== finding.status) {
          await findingService.createFindingEvent(
            req.params.id,
            'finding.status_changed',
            { old_status: finding.status, new_status: status },
            user.id
          );
        }

        // Emit severity event if changed
        if (severity && severity !== finding.severity) {
          await findingService.createFindingEvent(
            req.params.id,
            'finding.severity_set',
            { severity, risk_score },
            user.id
          );
        }

        res.json(updated);
      } catch (err) {
        logger.error({
          msg: 'Error updating finding',
          error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'Error al actualizar hallazgo' });
      }
    }
  );

  /**
   * POST /api/findings/:id/assign
   * Assign finding to responsible person
   */
  router.post(
    '/findings/:id/assign',
    authMiddleware,
    rbacMiddleware(['auditor', 'super_admin']),
    async (req: Request, res: Response) => {
      try {
        const { assigned_to } = req.body;
        const user = (req as any).user;

        if (!assigned_to) {
          return res.status(400).json({ error: 'assigned_to es requerido' });
        }

        const finding = await findingService.getFindingById(req.params.id);
        if (!finding) {
          return res.status(404).json({ error: 'Hallazgo no encontrado' });
        }

        const updated = await findingService.assignFinding(req.params.id, assigned_to, user.id);
        res.json(updated);
      } catch (err) {
        logger.error({
          msg: 'Error assigning finding',
          error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'Error al asignar hallazgo' });
      }
    }
  );

  /**
   * GET /api/findings/:id/actions
   * Get all corrective actions for finding
   */
  router.get(
    '/findings/:id/actions',
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const user = (req as any).user;
        const finding = await findingService.getFindingById(req.params.id);

        if (!finding) {
          return res.status(404).json({ error: 'Hallazgo no encontrado' });
        }

        // RBAC check
        if (user.role === 'provider_admin' && finding.provider_id !== user.provider_id) {
          return res.status(403).json({ error: 'No autorizado' });
        }

        const actions = await findingService.getActionsForFinding(req.params.id);
        res.json({
          actions,
          count: actions.length,
        });
      } catch (err) {
        logger.error({
          msg: 'Error fetching actions',
          error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'Error al obtener acciones' });
      }
    }
  );

  /**
   * POST /api/findings/:id/actions
   * Create corrective action for finding
   */
  router.post(
    '/findings/:id/actions',
    authMiddleware,
    rbacMiddleware(['provider_admin', 'super_admin']),
    async (req: Request, res: Response) => {
      try {
        const { title, description, responsible_user_id, deadline, priority } = req.body;
        const user = (req as any).user;

        if (!title || !description || !deadline) {
          return res.status(400).json({
            error: 'title, description y deadline son requeridos',
          });
        }

        const finding = await findingService.getFindingById(req.params.id);
        if (!finding) {
          return res.status(404).json({ error: 'Hallazgo no encontrado' });
        }

        // RBAC: provider_admin can only create for own provider
        if (user.role === 'provider_admin' && finding.provider_id !== user.provider_id) {
          return res.status(403).json({ error: 'No autorizado' });
        }

        const action = await findingService.createCorrectiveAction({
          finding_id: req.params.id,
          title,
          description,
          responsible_user_id,
          deadline: new Date(deadline),
          priority: priority || 'media',
          created_by: user.id,
        });

        // Emit event
        await findingService.createFindingEvent(
          req.params.id,
          'action.created',
          { action_id: action.id },
          user.id
        );

        res.status(201).json(action);
      } catch (err) {
        logger.error({
          msg: 'Error creating action',
          error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'Error al crear acción correctiva' });
      }
    }
  );

  /**
   * PUT /api/actions/:id
   * Update corrective action
   */
  router.put(
    '/actions/:id',
    authMiddleware,
    rbacMiddleware(['provider_admin', 'auditor', 'super_admin']),
    async (req: Request, res: Response) => {
      try {
        const { title, description, responsible_user_id, deadline, priority, status, completion_percentage } = req.body;
        const user = (req as any).user;

        const action = await findingService.getCorrectiveActionById(req.params.id);
        if (!action) {
          return res.status(404).json({ error: 'Acción no encontrada' });
        }

        const finding = await findingService.getFindingById(action.finding_id);
        if (!finding) {
          return res.status(404).json({ error: 'Hallazgo no encontrado' });
        }

        // RBAC check
        if (user.role === 'provider_admin' && finding.provider_id !== user.provider_id) {
          return res.status(403).json({ error: 'No autorizado' });
        }

        const updated = await findingService.updateCorrectiveAction(req.params.id, {
          title,
          description,
          responsible_user_id,
          deadline: deadline ? new Date(deadline) : undefined,
          priority,
          status,
          completion_percentage,
          updated_by: user.id,
        });

        // Emit event
        if (status && status !== action.status) {
          await findingService.createFindingEvent(
            action.finding_id,
            'action.status_changed',
            { action_id: req.params.id, old_status: action.status, new_status: status },
            user.id
          );

          // Try to auto-close finding if action is now closed
          if (status === 'cerrada') {
            await findingService.tryCloseFinding(action.finding_id, user.id);
          }
        }

        res.json(updated);
      } catch (err) {
        logger.error({
          msg: 'Error updating action',
          error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'Error al actualizar acción' });
      }
    }
  );

  /**
   * POST /api/actions/:id/followups
   * Create/update action follow-up step
   */
  router.post(
    '/actions/:id/followups',
    authMiddleware,
    rbacMiddleware(['provider_admin', 'auditor', 'super_admin']),
    async (req: Request, res: Response) => {
      try {
        const { step_number, step_name, description, due_date, completion_percentage, evidence_attachment, comments, status } =
          req.body;
        const user = (req as any).user;

        if (!step_number || !step_name) {
          return res.status(400).json({
            error: 'step_number y step_name son requeridos',
          });
        }

        const action = await findingService.getCorrectiveActionById(req.params.id);
        if (!action) {
          return res.status(404).json({ error: 'Acción no encontrada' });
        }

        const followup = await findingService.upsertFollowup({
          action_id: req.params.id,
          step_number,
          step_name,
          description,
          due_date: due_date ? new Date(due_date) : undefined,
          completion_percentage,
          evidence_attachment,
          comments,
          status,
          completed_by: status === 'completado' ? user.id : undefined,
        });

        res.status(201).json(followup);
      } catch (err) {
        logger.error({
          msg: 'Error creating follow-up',
          error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'Error al crear seguimiento' });
      }
    }
  );

  /**
   * GET /api/actions/:id/followups
   * Get all follow-ups for action
   */
  router.get(
    '/actions/:id/followups',
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const followups = await findingService.getFollowupsForAction(req.params.id);
        res.json({
          followups,
          count: followups.length,
        });
      } catch (err) {
        logger.error({
          msg: 'Error fetching follow-ups',
          error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'Error al obtener seguimientos' });
      }
    }
  );

  /**
   * GET /api/findings/stats/summary
   * Get findings statistics
   */
  router.get(
    '/findings/stats/summary',
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const stats = await findingService.getFindingsSummary();
        res.json(stats);
      } catch (err) {
        logger.error({
          msg: 'Error getting findings summary',
          error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'Error al obtener estadísticas' });
      }
    }
  );

  /**
   * GET /api/actions/dashboard
   * Get actions dashboard data
   */
  router.get(
    '/actions/dashboard',
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const dashboard = await findingService.getActionsDashboard();
        res.json(dashboard);
      } catch (err) {
        logger.error({
          msg: 'Error getting actions dashboard',
          error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'Error al obtener dashboard' });
      }
    }
  );

  return router;
}
