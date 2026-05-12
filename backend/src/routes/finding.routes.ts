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
          severity: severity as 'critical' | 'high' | 'medium' | 'low',
          category_id,
          service_id,
          status: 'open',
          source: source as 'audit' | 'assessment' | 'external_report' | 'internal',
          found_date: found_date ? new Date(found_date) : new Date(),
          created_by: req.user?.user_id,
        });

        // Emit event
        await eventStore.append({
          aggregateId: finding.id,
          aggregateType: 'finding',
          eventType: 'finding.created',
          payload: finding as any,
          userId: req.user?.user_id,
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
   * RBAC: provider_admin (own), auditor (assigned), super_admin (all)
   */
  router.get(
    '/findings',
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const userRole = req.user?.role;
        const userId = req.user?.user_id;
        let { provider_id } = req.query;

        // RBAC: provider_admin can only see own provider
        if (userRole === 'provider_admin') {
          const userResult = await pool.query(
            'SELECT provider_id FROM users WHERE id = $1',
            [userId]
          );

          if (userResult.rows.length === 0) {
            return res.status(403).json({ error: 'Access denied' });
          }

          provider_id = userResult.rows[0].provider_id;
        }

        // RBAC: auditor can only see assigned providers (excluye prestadores revocados)
        if (userRole === 'auditor') {
          const assignedResult = await pool.query(
            `SELECT ap.provider_id FROM auditor_providers ap
             JOIN providers p ON p.id = ap.provider_id
             WHERE ap.auditor_id = $1 AND p.status != 'revoked'`,
            [userId]
          );

          const assignedProviderIds = assignedResult.rows.map(r => r.provider_id);

          if (provider_id && !assignedProviderIds.includes(provider_id as string)) {
            return res.status(403).json({
              error: 'Access denied',
              message: 'You are not assigned to audit this provider',
            });
          }

          // If no specific provider requested, limit to assigned ones
          // (filtering logic in findingModel.getFindings must support array of provider IDs)
          if (!provider_id && assignedProviderIds.length > 0) {
            provider_id = assignedProviderIds.length === 1 ? assignedProviderIds[0] : undefined;
          }
        }

        const filters = {
          provider_id: provider_id as string,
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
   * RBAC: provider_admin (own), auditor (assigned), super_admin (all)
   */
  router.get(
    '/findings/:id',
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const userRole = req.user?.role;
        const userId = req.user?.user_id;
        const finding = await findingModel.getFindingById(req.params.id);

        if (!finding) {
          return res.status(404).json({ error: 'Finding not found' });
        }

        // RBAC: provider_admin can only see own provider
        if (userRole === 'provider_admin') {
          const userResult = await pool.query(
            'SELECT provider_id FROM users WHERE id = $1',
            [userId]
          );

          if (userResult.rows.length === 0 || userResult.rows[0].provider_id !== finding.provider_id) {
            return res.status(403).json({ error: 'Access denied' });
          }
        }

        // RBAC: auditor can only see assigned providers
        if (userRole === 'auditor') {
          const assignedResult = await pool.query(
            'SELECT 1 FROM auditor_providers WHERE auditor_id = $1 AND provider_id = $2',
            [userId, finding.provider_id]
          );

          if (assignedResult.rows.length === 0) {
            return res.status(403).json({
              error: 'Access denied',
              message: 'You are not assigned to audit this provider',
            });
          }
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
          updated_by: req.user?.user_id,
        });

        // Emit event
        await eventStore.append({
          aggregateId: updated.id,
          aggregateType: 'finding',
          eventType: 'finding.updated',
          payload: updated as any,
          userId: req.user?.user_id,
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
        const calculatedDueDate = new Date();
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
          created_by: req.user?.user_id,
        });

        // Emit event
        await eventStore.append({
          aggregateId: action.id,
          aggregateType: 'corrective_action',
          eventType: 'action.created',
          payload: action as any,
          userId: req.user?.user_id,
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
   * Lista acciones correctivas con scope de provider según el rol del usuario.
   */
  router.get(
    '/actions',
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const userRole = req.user?.role;
        const userId = req.user?.user_id;

        // RBAC: provider_admin solo ve acciones de su prestador
        let providerIdFilter: string | undefined = req.query.provider_id as string | undefined;
        if (userRole === 'provider_admin') {
          const userResult = await pool.query(
            'SELECT provider_id FROM users WHERE id = $1',
            [userId],
          );
          if (userResult.rows.length === 0) {
            return res.status(403).json({ error: 'Access denied' });
          }
          providerIdFilter = userResult.rows[0].provider_id;
        }

        // RBAC: auditor solo ve acciones de prestadores asignados
        if (userRole === 'auditor') {
          const assignedResult = await pool.query(
            'SELECT provider_id FROM auditor_providers WHERE auditor_id = $1',
            [userId],
          );
          const assignedIds = assignedResult.rows.map((r: { provider_id: string }) => r.provider_id);
          if (providerIdFilter && !assignedIds.includes(providerIdFilter)) {
            return res.status(403).json({ error: 'Access denied' });
          }
        }

        // Filtrar acciones con scope de provider + filtros adicionales de query
        const findingId = req.query.finding_id as string | undefined;
        const statusFilter = req.query.status as string | undefined;
        const assignedTo = req.query.assigned_to as string | undefined;
        const search = req.query.search as string | undefined;

        let actions;
        if (providerIdFilter) {
          // JOIN con findings para aplicar el scope de provider Y los filtros de query
          let q = `SELECT ca.* FROM corrective_actions ca
                   JOIN findings f ON ca.finding_id = f.id
                   WHERE f.provider_id = $1`;
          const params: unknown[] = [providerIdFilter];

          if (findingId)  { q += ` AND ca.finding_id = $${params.push(findingId)}`; }
          if (statusFilter) { q += ` AND ca.status = $${params.push(statusFilter)}`; }
          if (assignedTo) { q += ` AND ca.assigned_to = $${params.push(assignedTo)}`; }
          if (search)     { q += ` AND (ca.title ILIKE $${params.push(`%${search}%`)} OR ca.description ILIKE $${params.length})`; }

          q += ' ORDER BY ca.created_at DESC';
          const result = await pool.query(q, params);
          actions = result.rows;
        } else {
          actions = await findingModel.getCorrectiveActions({
            finding_id: findingId,
            status: statusFilter,
            assigned_to: assignedTo,
            search,
          });
        }

        res.json({ count: actions.length, actions });
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
          req.user?.user_id,
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
          userId: req.user?.user_id,
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
          user_id: req.user?.user_id,
          content,
          mentions: mentions || [],
        });

        // Emit event
        await eventStore.append({
          aggregateId: comment.id,
          aggregateType: 'action_comment',
          eventType: 'comment.added',
          payload: comment as any,
          userId: req.user?.user_id,
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
