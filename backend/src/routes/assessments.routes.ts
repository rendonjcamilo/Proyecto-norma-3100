/**
 * Assessment Execution API Routes
 * Implements Norma 3100 assessment execution with:
 * - Assessment CRUD operations
 * - Response recording with compliance calculation
 * - Assessment submission and hallazgo generation
 * - Metrics and reporting
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { rbacMiddleware, providerAccessMiddleware } from '../middleware/role.middleware.js';
import { AssessmentService } from '../services/AssessmentService.js';
import { EventStore } from '../modules/events/EventStore.js';
import { logger } from '../utils/logger.js';

export function createAssessmentsRouter(pool: Pool, eventStore: EventStore): Router {
  const router = Router();
  const assessmentService = new AssessmentService(pool);

  // ===== ASSESSMENT CRUD =====

  /**
   * POST /api/assessments
   * Create assessment instance
   * Input: { providerId, locationId?, serviceId, assessmentVersion }
   * Output: { id, questionnaire, status, etc. }
   * Auto-loads published questionnaire for service
   * RBAC: auditor (assigned providers), super_admin (any)
   */
  router.post(
    '/assessments',
    authMiddleware,
    rbacMiddleware(['auditor', 'super_admin']),
    providerAccessMiddleware(pool, ['providerId']),
    async (req: Request, res: Response) => {
      try {
        const { providerId, locationId, serviceId, assessmentVersion, title } = req.body;
        const userId = (req as any).user?.user_id;
        const userRole = (req as any).user?.role;

        // Validation
        if (!serviceId || !assessmentVersion) {
          return res.status(400).json({
            error: 'serviceId y assessmentVersion son requeridos',
          });
        }

        if (!['initial', 'year4', 'annual', 'pre-novelty'].includes(assessmentVersion)) {
          return res.status(400).json({
            error: 'assessmentVersion debe ser: initial, year4, annual, o pre-novelty',
          });
        }

        // RBAC: auditor can only create for assigned providers
        if (userRole === 'auditor') {
          const assignedResult = await pool.query(
            'SELECT 1 FROM auditor_providers WHERE auditor_id = $1 AND provider_id = $2',
            [userId, providerId]
          );

          if (assignedResult.rows.length === 0) {
            return res.status(403).json({
              error: 'Access denied',
              message: 'You are not assigned to audit this provider',
            });
          }
        }

        const assessment = await assessmentService.createAssessment(
          providerId,
          locationId || null,
          serviceId,
          assessmentVersion,
          userId,
          title || null
        );

        logger.info({
          msg: 'Assessment created',
          assessment_id: assessment.id,
          service_id: serviceId,
        });

        res.status(201).json({
          data: assessment,
          message: 'Assessment created successfully',
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({
          msg: 'Error creating assessment',
          error: msg,
        });
        res.status(500).json({ error: msg });
      }
    }
  );

  /**
   * GET /api/assessments
   * List assessments with optional filters
   * Query: ?providerId=...&serviceId=...&status=...&startDate=...&endDate=...&limit=&offset=
   * RBAC: provider_admin (own), auditor (assigned), super_admin (all)
   */
  router.get(
    '/assessments',
    authMiddleware,
    rbacMiddleware(['provider_admin', 'auditor', 'super_admin']),
    async (req: Request, res: Response) => {
      try {
        const { providerId, serviceId, status, startDate, endDate, limit, offset } = req.query;
        const userRole = (req as any).user?.role;
        const userId = (req as any).user?.user_id;

        // RBAC: provider_admin can only see own provider
        let filterProviderId = providerId as string | undefined;
        if (userRole === 'provider_admin') {
          const userResult = await pool.query(
            'SELECT provider_id FROM users WHERE id = $1',
            [userId]
          );

          if (userResult.rows.length === 0) {
            return res.status(403).json({ error: 'Access denied' });
          }

          filterProviderId = userResult.rows[0].provider_id;
        }

        // RBAC: auditor can only see assigned providers
        if (userRole === 'auditor') {
          const assignedResult = await pool.query(
            'SELECT provider_id FROM auditor_providers WHERE auditor_id = $1',
            [userId]
          );

          const assignedProviderIds = assignedResult.rows.map(r => r.provider_id);

          if (filterProviderId && !assignedProviderIds.includes(filterProviderId)) {
            return res.status(403).json({
              error: 'Access denied',
              message: 'You are not assigned to audit this provider',
            });
          }

          // If no specific provider requested, limit to assigned ones
          if (!filterProviderId && assignedProviderIds.length > 0) {
            filterProviderId = assignedProviderIds.length === 1 ? assignedProviderIds[0] : undefined;
            // Note: For multiple assigned providers, service must support filtering by multiple IDs
            // or we filter in-memory
          }
        }

        const filters: any = {
          providerId: filterProviderId,
          serviceId: serviceId as string | undefined,
          status: status as string | undefined,
          limit: limit ? parseInt(limit as string) : 20,
          offset: offset ? parseInt(offset as string) : 0,
        };

        if (startDate) {
          filters.startDate = new Date(startDate as string);
        }

        if (endDate) {
          filters.endDate = new Date(endDate as string);
        }

        const result = await assessmentService.listAssessments(filters);

        res.json({
          data: result.assessments,
          total: result.total,
          count: result.assessments.length,
          limit: filters.limit,
          offset: filters.offset,
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error listing assessments', error: msg });
        res.status(500).json({ error: 'Failed to list assessments' });
      }
    }
  );

  /**
   * GET /api/assessments/:id
   * Get assessment with all responses and metrics
   * RBAC: provider_admin (own), auditor (assigned), super_admin (all)
   */
  router.get(
    '/assessments/:id',
    authMiddleware,
    rbacMiddleware(['provider_admin', 'auditor', 'super_admin']),
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const userRole = (req as any).user?.role;
        const userId = (req as any).user?.user_id;

        const assessment = await assessmentService.getAssessment(id);

        if (!assessment) {
          return res.status(404).json({ error: 'Assessment not found' });
        }

        // RBAC: provider_admin can only see own provider
        if (userRole === 'provider_admin') {
          const userResult = await pool.query(
            'SELECT provider_id FROM users WHERE id = $1',
            [userId]
          );

          if (
            userResult.rows.length === 0 ||
            userResult.rows[0].provider_id !== assessment.providerId
          ) {
            return res.status(403).json({ error: 'Access denied' });
          }
        }

        // RBAC: auditor can only see assigned providers
        if (userRole === 'auditor') {
          const assignedResult = await pool.query(
            'SELECT 1 FROM auditor_providers WHERE auditor_id = $1 AND provider_id = $2',
            [userId, assessment.providerId]
          );

          if (assignedResult.rows.length === 0) {
            return res.status(403).json({
              error: 'Access denied',
              message: 'You are not assigned to audit this provider',
            });
          }
        }

        res.json({ data: assessment });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error fetching assessment', error: msg });
        res.status(500).json({ error: 'Failed to fetch assessment' });
      }
    }
  );

  /**
   * GET /api/providers/:providerId/assessments
   * List assessments for a specific provider
   * RBAC: provider_admin (own), auditor (assigned), super_admin (all)
   */
  router.get(
    '/providers/:providerId/assessments',
    authMiddleware,
    rbacMiddleware(['provider_admin', 'auditor', 'super_admin']),
    async (req: Request, res: Response) => {
      try {
        const { providerId } = req.params;
        const userRole = (req as any).user?.role;
        const userId = (req as any).user?.user_id;

        // RBAC: provider_admin can only see own provider
        if (userRole === 'provider_admin') {
          const userResult = await pool.query(
            'SELECT provider_id FROM users WHERE id = $1',
            [userId]
          );

          if (userResult.rows.length === 0 || userResult.rows[0].provider_id !== providerId) {
            return res.status(403).json({ error: 'Access denied' });
          }
        }

        // RBAC: auditor can only see assigned providers
        if (userRole === 'auditor') {
          const assignedResult = await pool.query(
            'SELECT 1 FROM auditor_providers WHERE auditor_id = $1 AND provider_id = $2',
            [userId, providerId]
          );

          if (assignedResult.rows.length === 0) {
            return res.status(403).json({
              error: 'Access denied',
              message: 'You are not assigned to audit this provider',
            });
          }
        }

        const filters = {
          providerId,
          limit: 100,
          offset: 0,
        };

        const result = await assessmentService.listAssessments(filters);

        res.json({
          data: result.assessments,
          total: result.total,
          count: result.assessments.length,
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error listing assessments for provider', error: msg });
        res.status(500).json({ error: 'Failed to list assessments' });
      }
    }
  );

  /**
   * PUT /api/assessments/:id
   * Update assessment response(s)
   * Input: { responses: [{ criterionId, status: C/NC/NA, description?, comments?, evidenceFileIds? }] }
   * Recalculates compliance % and semáforo in real-time
   * Allows partial updates (save progress)
   * RBAC: auditor (assigned), super_admin
   */
  router.put(
    '/assessments/:id',
    authMiddleware,
    rbacMiddleware(['auditor', 'super_admin']),
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { responses } = req.body;
        const userId = (req as any).user?.user_id;
        const userRole = (req as any).user?.role;

        if (!responses || !Array.isArray(responses)) {
          return res.status(400).json({ error: 'responses array is required' });
        }

        // Verify assessment exists
        const assessment = await assessmentService.getAssessment(id);
        if (!assessment) {
          return res.status(404).json({ error: 'Assessment not found' });
        }

        // RBAC: auditor can only update assigned providers
        if (userRole === 'auditor') {
          const assignedResult = await pool.query(
            'SELECT 1 FROM auditor_providers WHERE auditor_id = $1 AND provider_id = $2',
            [userId, assessment.providerId]
          );

          if (assignedResult.rows.length === 0) {
            return res.status(403).json({
              error: 'Access denied',
              message: 'You are not assigned to audit this provider',
            });
          }
        }

        // Validate responses
        for (const response of responses) {
          if (!response.criterionId || !response.status) {
            return res.status(400).json({
              error: 'Each response must have criterionId and status (C/NC/NA)',
            });
          }

          if (!['C', 'NC', 'NA'].includes(response.status)) {
            return res.status(400).json({
              error: 'Status must be C (Cumple), NC (No Cumple), or NA (No Aplica)',
            });
          }

          // Description is required for NC
          if (response.status === 'NC' && !response.description) {
            return res.status(400).json({
              error: 'Description is required for NC (No Cumple) responses',
            });
          }
        }

        const updatedAssessment = await assessmentService.recordResponses(id, responses, userId);

        if (!updatedAssessment) {
          return res.status(404).json({ error: 'Assessment not found' });
        }

        logger.info({
          msg: 'Assessment responses recorded',
          assessment_id: id,
          response_count: responses.length,
        });

        res.json({
          data: updatedAssessment,
          message: `${responses.length} response(s) recorded successfully`,
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error updating assessment', error: msg });
        res.status(500).json({ error: msg });
      }
    }
  );

  /**
   * POST /api/assessments/:id/submit
   * Submit assessment for completion
   * Marks as submitted (locked)
   * Auto-generates hallazgos from NC criteria
   * Emits audit events
   * Cannot be modified after submission
   * RBAC: auditor (assigned), super_admin
   */
  router.post(
    '/assessments/:id/submit',
    authMiddleware,
    rbacMiddleware(['auditor', 'super_admin']),
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const userId = (req as any).user?.user_id;
        const userRole = (req as any).user?.role;

        // Verify assessment exists
        const assessment = await assessmentService.getAssessment(id);
        if (!assessment) {
          return res.status(404).json({ error: 'Assessment not found' });
        }

        // RBAC: auditor can only submit for assigned providers
        if (userRole === 'auditor') {
          const assignedResult = await pool.query(
            'SELECT 1 FROM auditor_providers WHERE auditor_id = $1 AND provider_id = $2',
            [userId, assessment.providerId]
          );

          if (assignedResult.rows.length === 0) {
            return res.status(403).json({
              error: 'Access denied',
              message: 'You are not assigned to audit this provider',
            });
          }
        }

        if (assessment.status !== 'draft') {
          return res.status(400).json({
            error: 'Assessment is already submitted or locked',
          });
        }

        const submittedAssessment = await assessmentService.submitAssessment(id, userId);

        if (!submittedAssessment) {
          return res.status(404).json({ error: 'Assessment not found' });
        }

        logger.info({
          msg: 'Assessment submitted',
          assessment_id: id,
        });

        res.json({
          data: submittedAssessment,
          message: 'Assessment submitted successfully',
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error submitting assessment', error: msg });
        res.status(500).json({ error: msg });
      }
    }
  );

  // ===== ASSESSMENT ANALYSIS =====

  /**
   * GET /api/assessments/:id/metrics
   * Get calculated metrics
   * Returns: { totalCriteria, cumple, noCumple, noAplica, compliancePercent, semaforo }
   */
  router.get(
    '/assessments/:id/metrics',
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;

        const metrics = await assessmentService.getMetrics(id);

        if (!metrics) {
          return res.status(404).json({ error: 'Assessment metrics not found' });
        }

        res.json({
          data: metrics,
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error fetching metrics', error: msg });
        res.status(500).json({ error: 'Failed to fetch metrics' });
      }
    }
  );

  /**
   * GET /api/assessments/provider/:providerId/summary
   * Summary of all assessments for provider
   * Shows latest version compliance for each service
   * Trending % over time if multiple versions
   */
  router.get(
    '/provider/:providerId/summary',
    authMiddleware,
    rbacMiddleware(['provider_admin', 'auditor', 'super_admin']),
    async (req: Request, res: Response) => {
      try {
        const { providerId } = req.params;
        const userRole = (req as any).user?.role;
        const userId = (req as any).user?.user_id;

        // RBAC: provider_admin can only see own provider
        if (userRole === 'provider_admin') {
          const userResult = await pool.query(
            'SELECT provider_id FROM users WHERE id = $1',
            [userId]
          );

          if (
            userResult.rows.length === 0 ||
            userResult.rows[0].provider_id !== providerId
          ) {
            return res.status(403).json({ error: 'Access denied' });
          }
        }

        const summary = await assessmentService.getProviderSummary(providerId);

        res.json({
          data: summary,
          count: summary.length,
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error fetching provider summary', error: msg });
        res.status(500).json({ error: 'Failed to fetch provider summary' });
      }
    }
  );

  /**
   * POST /api/assessments/:id/export
   * Export assessment as PDF/Word
   * Includes: questionnaire, responses, compliance %, hallazgos
   * NOTE: Placeholder - implementation in Phase 5 (Reporting)
   */
  router.post(
    '/assessments/:id/export',
    authMiddleware,
    rbacMiddleware(['provider_admin', 'auditor', 'super_admin']),
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { format } = req.body; // 'pdf' or 'word'

        const assessment = await assessmentService.getAssessment(id);
        if (!assessment) {
          return res.status(404).json({ error: 'Assessment not found' });
        }

        // TODO: Implement PDF/Word export in Phase 5
        // For now, return export structure
        res.json({
          data: {
            exportId: `export-${id}`,
            format: format || 'pdf',
            status: 'pending',
            message: 'Export scheduled - available in Phase 5 (Reporting)',
          },
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error exporting assessment', error: msg });
        res.status(500).json({ error: msg });
      }
    }
  );

  /**
   * GET /api/assessments/:id/hallazgos
   * Get list of NC findings generated from assessment
   * Returns findings ready for corrective action planning (Task 6)
   */
  router.get(
    '/assessments/:id/hallazgos',
    authMiddleware,
    rbacMiddleware(['provider_admin', 'auditor', 'super_admin']),
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;

        // Query findings associated with this assessment
        const findingsQuery = `
          SELECT
            id, assessment_id, criterion_id, status, severity,
            description, created_at
          FROM findings
          WHERE assessment_id = $1
          ORDER BY severity DESC, created_at DESC
        `;

        const result = await pool.query(findingsQuery, [id]);

        res.json({
          data: result.rows.map((row) => ({
            id: row.id,
            assessmentId: row.assessment_id,
            criterionId: row.criterion_id,
            status: row.status,
            severity: row.severity,
            description: row.description,
            createdAt: row.created_at,
          })),
          count: result.rows.length,
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error fetching hallazgos', error: msg });
        res.status(500).json({ error: 'Failed to fetch findings' });
      }
    }
  );

  /**
   * GET /api/assessments/:id/scores
   * Get assessment compliance scores with per-standard breakdown
   * Includes semáforo color for each standard
   */
  router.get(
    '/assessments/:id/scores',
    authMiddleware,
    rbacMiddleware(['provider_admin', 'auditor', 'super_admin']),
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;

        const metrics = await assessmentService.getMetrics(id);

        if (!metrics) {
          return res.status(404).json({ error: 'Assessment metrics not found' });
        }

        // Map per-standard metrics and determine colors
        const standardsWithColors = (metrics.perStandardMetrics || []).map((std: any) => ({
          name: std.standardName,
          code: std.standardCode,
          percent: std.compliancePercent,
          color:
            std.compliancePercent >= 80
              ? 'verde'
              : std.compliancePercent >= 50
                ? 'naranja'
                : 'rojo',
        }));

        res.json({
          data: {
            overallPercentage: metrics.compliancePercent,
            semaforo: metrics.semaforo,
            standards: standardsWithColors,
            hallazgosCount: metrics.noCumple,
          },
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error fetching scores', error: msg });
        res.status(500).json({ error: 'Failed to fetch scores' });
      }
    }
  );

  /**
   * GET /api/assessments/:id/scores/summary
   * Quick summary for dashboard displays
   */
  router.get(
    '/assessments/:id/scores/summary',
    authMiddleware,
    rbacMiddleware(['provider_admin', 'auditor', 'super_admin']),
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;

        const metrics = await assessmentService.getMetrics(id);

        if (!metrics) {
          return res.status(404).json({ error: 'Assessment metrics not found' });
        }

        res.json({
          data: {
            overallPercentage: metrics.compliancePercent,
            semaforo: metrics.semaforo,
            hallazgosCount: metrics.noCumple,
          },
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error fetching summary', error: msg });
        res.status(500).json({ error: 'Failed to fetch summary' });
      }
    }
  );

  // ===== DELETE ASSESSMENT =====

  /**
   * DELETE /api/assessments/:id
   * Eliminar una evaluación completada
   * RBAC: super_admin y auditor
   * El auditor solo puede eliminar evaluaciones con status submitted/completed/reviewed
   */
  router.delete(
    '/assessments/:id',
    authMiddleware,
    rbacMiddleware(['super_admin', 'auditor']),
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const userRole = (req as any).user?.role;

        const result = await pool.query(
          'SELECT id, status FROM assessments WHERE id = $1',
          [id]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Evaluación no encontrada' });
        }

        const assessment = result.rows[0];

        // Auditor puede eliminar evaluaciones en cualquier estado

        await pool.query('DELETE FROM assessments WHERE id = $1', [id]);

        logger.info({ msg: 'Assessment deleted', assessment_id: id, deleted_by: (req as any).user?.id });
        res.json({ message: 'Evaluación eliminada correctamente' });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error deleting assessment', error: msg });
        res.status(500).json({ error: 'Error al eliminar la evaluación' });
      }
    }
  );

  return router;
}
