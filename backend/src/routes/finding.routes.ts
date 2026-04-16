/**
 * Finding & Corrective Action API Routes
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { rbacMiddleware, providerAccessMiddleware } from '../middleware/role.middleware.js';
import { FindingModel } from '../models/finding.model.js';
import { EventStore } from '../modules/events/EventStore.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

export function createFindingRouter(pool: Pool, eventStore: EventStore): Router {
  const router = Router();
  const findingModel = new FindingModel(pool);

  // ===== FINDINGS =====

  /**
   * POST /api/findings
   * Create finding
   * RBAC: auditor can only create for assigned providers, super_admin can create for any
   */
  router.post(
    '/findings',
    authMiddleware,
    rbacMiddleware(['super_admin', 'auditor']),
    providerAccessMiddleware(pool, ['provider_id']),
    async (req: Request, res: Response) => {
      try {
        const { provider_id, location_id, title, description, severity, category_id, service_id, source, found_date } =
          req.body;

        if (!provider_id || !title || !severity || !source) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const finding_number = `HALL-${Date.now()}`;
        const criterion_id = uuidv4(); // TODO: Link to actual criterion

        const finding = await findingModel.createFinding({
          provider_id,
          location_id: location_id || undefined,
          finding_number,
          criterion_id,
          title,
          description,
          severity: severity as 'critical' | 'major' | 'minor',
          category_id,
          service_id,
          status: 'open',
          source: source as 'audit' | 'assessment' | 'external_report' | 'internal',
          found_date: found_date ? new Date(found_date) : new Date(),
          created_by: (req as any).user?.id,
        });

        // Emit event
        await eventStore.append({
          aggregateId: finding.id,
          aggregateType: 'finding',
          eventType: 'finding.created',
          payload: finding as any,
          userId: (req as any).user?.id,
        });

        logger.info({
          msg: 'Finding created',
          finding_id: finding.id,
          provider_id,
        });

        res.status(201).json(finding);
      } catch (err) {
        logger.error({
          msg: 'Error creating finding',
          error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'Failed to create finding' });
      }
    }
  );

  /**
   * GET /api/findings
   * List findings
   */
  router.get(
    '/findings',
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const filters = {
          provider_id: req.query.provider_id as string,
          severity: req.query.severity as string,
          status: req.query.status as string,
          category_id: req.query.category_id as string,
          search: req.query.search as string,
        };

        const findings = await findingModel.getFindings(filters);

        res.json({
          count: findings.length,
          findings,
        });
      } catch (err) {
        logger.error({
          msg: 'Error fetching findings',
          error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'Failed to fetch findings' });
      }
    }
  );

  /**
   * GET /api/findings/:id
   * Get finding with actions and history
   */
  router.get(
    '/findings/:id',
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const finding = await findingModel.getFindingById(req.params.id);

        if (!finding) {
          return res.status(404).json({ error: 'Finding not found' });
        }

        // Get related actions
        const actions = await findingModel.getCorrectiveActions({ finding_id: req.params.id });

        res.json({
          ...finding,
          actions,
        });
      } catch (err) {
        logger.error({
          msg: 'Error fetching finding',
          error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'Failed to fetch finding' });
      }
    }
  );

  /**
   * PUT /api/findings/:id
   * Update finding
   */
  router.put(
    '/findings/:id',
    authMiddleware,
    rbacMiddleware(['super_admin', 'auditor']),
    async (req: Request, res: Response) => {
      try {
        const finding = await findingModel.getFindingById(req.params.id);

        if (!finding) {
          return res.status(404).json({ error: 'Finding not found' });
        }

        const updated = await findingModel.updateFinding(req.params.id, {
          ...req.body,
          updated_by: (req as any).user?.id,
        });

        // Emit event
        await eventStore.append({
          aggregateId: updated.id,
          aggregateType: 'finding',
          eventType: 'finding.updated',
          payload: updated as any,
          userId: (req as any).user?.id,
        });

        res.json(updated);
      } catch (err) {
        logger.error({
          msg: 'Error updating finding',
          error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'Failed to update finding' });
      }
    }
  );

  // ===== CORRECTIVE ACTIONS =====

  /**
   * POST /api/findings/:id/actions
   * Create corrective action for finding
   */
  router.post(
    '/findings/:id/actions',
    authMiddleware,
    rbacMiddleware(['super_admin', 'auditor']),
    async (req: Request, res: Response) => {
      try {
        const { title, description, assigned_to, due_date, priority } = req.body;

        const finding = await findingModel.getFindingById(req.params.id);

        if (!finding) {
          return res.status(404).json({ error: 'Finding not found' });
        }

        if (!title || !description) {
          return res.status(400).json({ error: 'title and description are required' });
        }

        const action_number = `ACC-${Date.now()}`;

        // Calculate default due date based on severity
        let calculatedDueDate = new Date();
        if (finding.severity === 'critical') {
          calculatedDueDate.setDate(calculatedDueDate.getDate() + 14);
        } else if (finding.severity === 'major') {
          calculatedDueDate.setDate(calculatedDueDate.getDate() + 30);
        } else {
          calculatedDueDate.setDate(calculatedDueDate.getDate() + 60);
        }

        const action = await findingModel.createCorrectiveAction({
          finding_id: req.params.id,
          action_number,
          title,
          description,
          assigned_to: assigned_to || undefined,
          assigned_date: new Date(),
          due_date: due_date ? new Date(due_date) : calculatedDueDate,
          status: 'open',
          priority: priority || 'medium',
          created_by: (req as any).user?.id,
        });

        // Emit event
        await eventStore.append({
          aggregateId: action.id,
          aggregateType: 'corrective_action',
          eventType: 'action.created',
          payload: action as any,
          userId: (req as any).user?.id,
        });

        logger.info({
          msg: 'Corrective action created',
          action_id: action.id,
          finding_id: req.params.id,
        });

        res.status(201).json(action);
      } catch (err) {
        logger.error({
          msg: 'Error creating corrective action',
          error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'Failed to create corrective action' });
      }
    }
  );

  /**
   * GET /api/actions
   * List corrective actions
   */
  router.get(
    '/actions',
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const filters = {
          finding_id: req.query.finding_id as string,
          status: req.query.status as string,
          assigned_to: req.query.assigned_to as string,
          search: req.query.search as string,
        };

        const actions = await findingModel.getCorrectiveActions(filters);

        res.json({
          count: actions.length,
          actions,
        });
      } catch (err) {
        logger.error({
          msg: 'Error fetching actions',
          error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'Failed to fetch actions' });
      }
    }
  );

  /**
   * GET /api/actions/:id
   * Get action with evidence and comments
   */
  router.get(
    '/actions/:id',
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const action = await findingModel.getCorrectiveActionById(req.params.id);

        if (!action) {
          return res.status(404).json({ error: 'Action not found' });
        }

        const evidence = await findingModel.getEvidenceByAction(req.params.id);
        const comments = await findingModel.getCommentsByAction(req.params.id);

        res.json({
          ...action,
          evidence,
          comments,
        });
      } catch (err) {
        logger.error({
          msg: 'Error fetching action',
          error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'Failed to fetch action' });
      }
    }
  );

  /**
   * PUT /api/actions/:id/status
   * Update action status
   */
  router.put(
    '/actions/:id/status',
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const { status, reason } = req.body;

        if (!status || !['open', 'in_progress', 'completed', 'closed', 'overdue'].includes(status)) {
          return res.status(400).json({ error: 'Invalid status' });
        }

        const action = await findingModel.getCorrectiveActionById(req.params.id);

        if (!action) {
          return res.status(404).json({ error: 'Action not found' });
        }

        const updated = await findingModel.updateCorrectiveActionStatus(
          req.params.id,
          status,
          (req as any).user?.id,
          reason
        );

        // Emit event
        await eventStore.append({
          aggregateId: updated.id,
          aggregateType: 'corrective_action',
          eventType: 'action.status_changed',
          payload: {
            old_status: action.status,
            new_status: status,
          },
          userId: (req as any).user?.id,
        });

        logger.info({
          msg: 'Action status updated',
          action_id: updated.id,
          new_status: status,
        });

        res.json(updated);
      } catch (err) {
        logger.error({
          msg: 'Error updating action status',
          error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'Failed to update action status' });
      }
    }
  );

  /**
   * POST /api/actions/:id/comments
   * Add comment to action
   */
  router.post(
    '/actions/:id/comments',
    authMiddleware,
    rbacMiddleware(['super_admin', 'auditor']),
    async (req: Request, res: Response) => {
      try {
        const { content, mentions } = req.body;

        if (!content) {
          return res.status(400).json({ error: 'content is required' });
        }

        const action = await findingModel.getCorrectiveActionById(req.params.id);

        if (!action) {
          return res.status(404).json({ error: 'Action not found' });
        }

        const comment = await findingModel.addComment({
          action_id: req.params.id,
          user_id: (req as any).user?.id,
          content,
          mentions: mentions || [],
        });

        // Emit event
        await eventStore.append({
          aggregateId: comment.id,
          aggregateType: 'action_comment',
          eventType: 'comment.added',
          payload: comment as any,
          userId: (req as any).user?.id,
        });

        logger.info({
          msg: 'Comment added',
          comment_id: comment.id,
          action_id: req.params.id,
        });

        res.status(201).json(comment);
      } catch (err) {
        logger.error({
          msg: 'Error adding comment',
          error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'Failed to add comment' });
      }
    }
  );

  return router;
}
