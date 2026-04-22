/**
 * Questionnaire API Routes
 * Implements 10 REST endpoints for questionnaire CRUD and criterion management
 * - 5 questionnaire CRUD endpoints
 * - 3 criterion management endpoints
 * - 2 versioning endpoints
 * - All with RBAC, JWT auth, and event sourcing
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { rbacMiddleware } from '../middleware/role.middleware.js';
import { QuestionnaireService } from '../services/QuestionnaireService.js';
import { EventStore } from '../modules/events/EventStore.js';
import { logger } from '../utils/logger.js';

export function createQuestionsRouter(pool: Pool, eventStore: EventStore): Router {
  const router = Router();
  const questionnaireService = new QuestionnaireService(pool);

  // ===== QUESTIONNAIRE CRUD =====

  /**
   * POST /api/questions
   * Create new questionnaire for a service
   * Body: { serviceId, versionType: 'initial|year4|annual|pre-novelty', name? }
   * RBAC: super_admin only
   */
  router.post(
    '/',
    authMiddleware,
    rbacMiddleware(['super_admin']),
    async (req: Request, res: Response) => {
      try {
        const { serviceId, versionType, name } = req.body;
        const userId = (req as any).user?.id || (req as any).userId;

        if (!serviceId || !versionType) {
          return res.status(400).json({
            error: 'serviceId y versionType son requeridos',
            required: ['serviceId', 'versionType'],
          });
        }

        if (!['initial', 'year4', 'annual', 'pre-novelty'].includes(versionType)) {
          return res.status(400).json({
            error: 'versionType debe ser: initial, year4, annual, o pre-novelty',
          });
        }

        // Create questionnaire
        const questionnaire = await questionnaireService.createQuestionnaire(
          serviceId,
          versionType,
          userId,
          name
        );

        // Emit event
        await eventStore.append({
          aggregateId: questionnaire.id,
          aggregateType: 'Questionnaire',
          eventType: 'questionnaire.created',
          payload: {
            questionnaire_id: questionnaire.id,
            service_id: serviceId,
            version_type: versionType,
            total_criteria: questionnaire.total_criteria,
          } as Record<string, unknown>,
          metadata: {
            userId,
            timestamp: new Date(),
          },
          userId,
        });

        logger.info({
          msg: 'Questionnaire created',
          questionnaire_id: questionnaire.id,
          service_id: serviceId,
          version_type: versionType,
          total_criteria: questionnaire.total_criteria,
        });

        res.status(201).json({
          data: questionnaire,
          message: `Questionnaire created with ${questionnaire.total_criteria} criteria`,
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error creating questionnaire', error: msg });
        res.status(500).json({ error: msg });
      }
    }
  );

  /**
   * GET /api/questions
   * List all questionnaires (optionally filtered)
   * Query params: serviceId?, status?, versionType?
   */
  router.get(
    '/',
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const { serviceId, status, versionType } = req.query;

        const filters = {
          ...(serviceId && { serviceId: String(serviceId) }),
          ...(status && { status: String(status) }),
          ...(versionType && { versionType: String(versionType) }),
        };

        const questionnaires = await questionnaireService.listQuestionnaires(filters);

        res.json({
          data: questionnaires,
          count: questionnaires.length,
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error fetching questionnaires', error: msg });
        res.status(500).json({ error: 'Failed to fetch questionnaires' });
      }
    }
  );

  /**
   * GET /api/questions/:id
   * Get questionnaire with all criteria
   */
  router.get(
    '/:id',
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;

        const questionnaire = await questionnaireService.getQuestionnaire(id);

        if (!questionnaire) {
          return res.status(404).json({
            error: 'Questionnaire not found',
            id,
          });
        }

        res.json({
          data: questionnaire,
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error fetching questionnaire', error: msg });
        res.status(500).json({ error: 'Failed to fetch questionnaire' });
      }
    }
  );

  /**
   * PUT /api/questions/:id
   * Update questionnaire metadata (name, status)
   * RBAC: super_admin only
   */
  router.put(
    '/:id',
    authMiddleware,
    rbacMiddleware(['super_admin']),
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { name, status } = req.body;
        const userId = (req as any).user?.id || (req as any).userId;

        if (!name && !status) {
          return res.status(400).json({
            error: 'At least one field (name or status) is required',
          });
        }

        const updates: any = {};
        if (name) {updates.name = name;}
        if (status) {updates.status = status;}

        const updated = await questionnaireService.updateQuestionnaire(id, updates, userId);

        // Emit event
        await eventStore.append({
          aggregateId: id,
          aggregateType: 'Questionnaire',
          eventType: 'questionnaire.updated',
          payload: {
            questionnaire_id: id,
            updates,
          } as Record<string, unknown>,
          metadata: {
            userId,
            timestamp: new Date(),
          },
          userId,
        });

        res.json({
          data: updated,
          message: 'Questionnaire updated',
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error updating questionnaire', error: msg });
        res.status(500).json({ error: msg });
      }
    }
  );

  /**
   * DELETE /api/questions/:id
   * Soft delete questionnaire (archive)
   * RBAC: super_admin only
   */
  router.delete(
    '/:id',
    authMiddleware,
    rbacMiddleware(['super_admin']),
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const userId = (req as any).user?.id || (req as any).userId;

        await questionnaireService.deleteQuestionnaire(id);

        // Emit event
        await eventStore.append({
          aggregateId: id,
          aggregateType: 'Questionnaire',
          eventType: 'questionnaire.archived',
          payload: {
            questionnaire_id: id,
          } as Record<string, unknown>,
          metadata: {
            userId,
            timestamp: new Date(),
          },
          userId,
        });

        res.json({
          message: 'Questionnaire archived',
          id,
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error deleting questionnaire', error: msg });
        res.status(500).json({ error: msg });
      }
    }
  );

  // ===== CRITERION MANAGEMENT =====

  /**
   * POST /api/questions/:id/criteria
   * Add criterion to questionnaire
   * Body: { criterionId }
   * RBAC: super_admin only
   */
  router.post(
    '/:id/criteria',
    authMiddleware,
    rbacMiddleware(['super_admin']),
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { criterionId } = req.body;
        const userId = (req as any).user?.id || (req as any).userId;

        if (!criterionId) {
          return res.status(400).json({
            error: 'criterionId is required',
          });
        }

        await questionnaireService.addCriterionToQuestionnaire(id, criterionId);

        // Emit event
        await eventStore.append({
          aggregateId: id,
          aggregateType: 'Questionnaire',
          eventType: 'questionnaire.criterion_added',
          payload: {
            questionnaire_id: id,
            criterion_id: criterionId,
          } as Record<string, unknown>,
          metadata: {
            userId,
            timestamp: new Date(),
          },
          userId,
        });

        res.status(201).json({
          message: 'Criterion added to questionnaire',
          questionnaire_id: id,
          criterion_id: criterionId,
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error adding criterion', error: msg });
        res.status(500).json({ error: msg });
      }
    }
  );

  /**
   * DELETE /api/questions/:id/criteria/:criterionId
   * Remove criterion from questionnaire
   * RBAC: super_admin only
   */
  router.delete(
    '/:id/criteria/:criterionId',
    authMiddleware,
    rbacMiddleware(['super_admin']),
    async (req: Request, res: Response) => {
      try {
        const { id, criterionId } = req.params;
        const userId = (req as any).user?.id || (req as any).userId;

        await questionnaireService.removeCriterionFromQuestionnaire(id, criterionId);

        // Emit event
        await eventStore.append({
          aggregateId: id,
          aggregateType: 'Questionnaire',
          eventType: 'questionnaire.criterion_removed',
          payload: {
            questionnaire_id: id,
            criterion_id: criterionId,
          } as Record<string, unknown>,
          metadata: {
            userId,
            timestamp: new Date(),
          },
          userId,
        });

        res.json({
          message: 'Criterion removed from questionnaire',
          questionnaire_id: id,
          criterion_id: criterionId,
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error removing criterion', error: msg });
        res.status(500).json({ error: msg });
      }
    }
  );

  // ===== TEMPLATE & VERSIONING =====

  /**
   * GET /api/questions/service/:serviceId/template
   * Get template for service (7 transversales + service-specific criteria)
   * Returns 40-80 criteria grouped by standard
   */
  router.get(
    '/service/:serviceId/template',
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const { serviceId } = req.params;

        const template = await questionnaireService.getServiceTemplate(serviceId);

        res.json({
          data: template,
          total_criteria: template.total_criteria,
          standards_count: template.standards.length,
          transversal_count: template.standards.filter((s) => s.is_transversal).length,
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error fetching template', error: msg });
        res.status(500).json({ error: msg });
      }
    }
  );

  /**
   * GET /api/questions/:id/versions
   * Get all versions of a questionnaire for a service
   */
  router.get(
    '/versions/service/:serviceId',
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const { serviceId } = req.params;

        const versions = await questionnaireService.getQuestionnaireVersions(serviceId);

        res.json({
          data: versions,
          count: versions.length,
          service_id: serviceId,
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error fetching versions', error: msg });
        res.status(500).json({ error: 'Failed to fetch versions' });
      }
    }
  );

  /**
   * POST /api/questions/:id/versions
   * Create new version from existing questionnaire
   * Body: { newVersionType: 'initial|year4|annual|pre-novelty' }
   * RBAC: super_admin only
   */
  router.post(
    '/:id/versions',
    authMiddleware,
    rbacMiddleware(['super_admin']),
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { newVersionType } = req.body;
        const userId = (req as any).user?.id || (req as any).userId;

        if (!newVersionType) {
          return res.status(400).json({
            error: 'newVersionType is required',
          });
        }

        if (!['initial', 'year4', 'annual', 'pre-novelty'].includes(newVersionType)) {
          return res.status(400).json({
            error: 'newVersionType must be: initial, year4, annual, or pre-novelty',
          });
        }

        const newVersion = await questionnaireService.createVersionFromExisting(
          id,
          newVersionType,
          userId
        );

        // Emit event
        await eventStore.append({
          aggregateId: newVersion.id,
          aggregateType: 'Questionnaire',
          eventType: 'questionnaire.version_created',
          payload: {
            source_questionnaire_id: id,
            new_questionnaire_id: newVersion.id,
            version_type: newVersionType,
          } as Record<string, unknown>,
          metadata: {
            userId,
            timestamp: new Date(),
          },
          userId,
        });

        res.status(201).json({
          data: newVersion,
          message: `New version created: ${newVersionType}`,
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error creating version', error: msg });
        res.status(500).json({ error: msg });
      }
    }
  );

  /**
   * POST /api/questions/:id/publish
   * Publish questionnaire (mark as ready for assessments)
   * RBAC: super_admin only
   */
  router.post(
    '/:id/publish',
    authMiddleware,
    rbacMiddleware(['super_admin']),
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const userId = (req as any).user?.id || (req as any).userId;

        const published = await questionnaireService.publishQuestionnaire(id, userId);

        // Emit event
        await eventStore.append({
          aggregateId: id,
          aggregateType: 'Questionnaire',
          eventType: 'questionnaire.published',
          payload: {
            questionnaire_id: id,
            version_type: published.version_type,
          } as Record<string, unknown>,
          metadata: {
            userId,
            timestamp: new Date(),
          },
          userId,
        });

        res.json({
          data: published,
          message: 'Questionnaire published',
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error publishing questionnaire', error: msg });
        res.status(500).json({ error: msg });
      }
    }
  );

  return router;
}
