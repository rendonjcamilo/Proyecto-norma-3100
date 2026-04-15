/**
 * Norma 3100 Assessment Routes (JSON-based, no database required)
 * Provides assessment generation from the Norma 3100 JSON model
 *
 * Used when database is not available or for rapid prototyping
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { Norma3100Service } from '../services/Norma3100Service.js';
import { logger } from '../utils/logger.js';

export function createNorma3100Router(): Router {
  const router = Router();
  const norma3100Service = new Norma3100Service();

  // ===== SERVICE ENDPOINTS =====

  /**
   * GET /api/norma3100/services
   * Get all available health services
   * Output: Array of { code, name, groupName, totalCriteria }
   */
  router.get('/norma3100/services', async (req: Request, res: Response) => {
    try {
      const services = await norma3100Service.getServices();

      res.json({
        success: true,
        count: services.length,
        services,
      });
    } catch (error: any) {
      logger.error({
        msg: 'Error getting services',
        error: error.message,
      });
      res.status(500).json({
        error: error.message,
      });
    }
  });

  /**
   * GET /api/norma3100/standards
   * Get all transversal standards
   */
  router.get('/norma3100/standards', async (req: Request, res: Response) => {
    try {
      const standards = await norma3100Service.getTransversalStandards();

      res.json({
        success: true,
        count: standards.length,
        standards: standards.map((s) => ({
          code: s.code,
          name: s.name,
          criteriaCount: s.criteria_count,
        })),
      });
    } catch (error: any) {
      logger.error({
        msg: 'Error getting standards',
        error: error.message,
      });
      res.status(500).json({
        error: error.message,
      });
    }
  });

  // ===== QUESTIONNAIRE ENDPOINTS =====

  /**
   * GET /api/norma3100/questionnaires/:serviceCode/:version
   * Get questionnaire for a service
   * Params: serviceCode (e.g., CEG), version (initial|year4|annual|pre-novelty)
   * Output: Questionnaire with all criteria (transversal + service-specific)
   */
  router.get(
    '/norma3100/questionnaires/:serviceCode/:version',
    async (req: Request, res: Response) => {
      try {
        const { serviceCode, version } = req.params;

        if (
          !['initial', 'year4', 'annual', 'pre-novelty'].includes(version)
        ) {
          return res.status(400).json({
            error: 'version debe ser: initial, year4, annual, o pre-novelty',
          });
        }

        const questionnaire =
          await norma3100Service.createQuestionnaire(
            serviceCode,
            version as 'initial' | 'year4' | 'annual' | 'pre-novelty'
          );

        res.json({
          success: true,
          questionnaire,
        });
      } catch (error: any) {
        logger.error({
          msg: 'Error creating questionnaire',
          error: error.message,
        });
        res.status(400).json({
          error: error.message,
        });
      }
    }
  );

  /**
   * GET /api/norma3100/criteria/:serviceCode/:standardCode
   * Get criteria for a specific standard and service
   */
  router.get(
    '/norma3100/criteria/:serviceCode/:standardCode',
    async (req: Request, res: Response) => {
      try {
        const { serviceCode, standardCode } = req.params;

        const criteria =
          await norma3100Service.getCriteriaForStandardAndService(
            serviceCode,
            standardCode
          );

        res.json({
          success: true,
          count: criteria.length,
          criteria,
        });
      } catch (error: any) {
        logger.error({
          msg: 'Error getting criteria',
          error: error.message,
        });
        res.status(500).json({
          error: error.message,
        });
      }
    }
  );

  // ===== ASSESSMENT ENDPOINTS =====

  /**
   * POST /api/norma3100/assessments
   * Create assessment instance from JSON model
   * Input: { serviceCode, version?, providerId?, locationId? }
   * Output: { id, questionnaire, status, ... }
   */
  router.post(
    '/norma3100/assessments',
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const {
          serviceCode,
          version = 'initial',
          providerId,
          locationId,
        } = req.body;
        const userId = (req as any).user?.id || (req as any).userId;

        if (!serviceCode) {
          return res.status(400).json({
            error: 'serviceCode es requerido',
          });
        }

        // Create questionnaire
        const questionnaire =
          await norma3100Service.createQuestionnaire(
            serviceCode,
            version
          );

        // Create assessment object
        const assessment = {
          id: uuidv4(),
          providerId:
            providerId ||
            (req as any).user?.providerId ||
            'mock-provider-1',
          locationId: locationId || null,
          serviceCode,
          questionnaire,
          version,
          status: 'in_progress',
          startedDate: new Date(),
          startedBy: userId || 'mock-user',
          compliancePercent: 0,
          semaforo: 'rojo',
          hallazgosGenerated: false,
          responses: {},
        };

        logger.info({
          msg: 'Assessment created',
          assessment_id: assessment.id,
          service_code: serviceCode,
          total_criteria: questionnaire.totalCriteria,
        });

        res.status(201).json({
          success: true,
          assessment,
        });
      } catch (error: any) {
        logger.error({
          msg: 'Error creating assessment',
          error: error.message,
        });
        res.status(400).json({
          error: error.message,
        });
      }
    }
  );

  /**
   * PUT /api/norma3100/assessments/:id/responses
   * Record assessment responses and calculate metrics
   * Input: { responses: { criterionId: 'C'|'NC'|'NA', ... } }
   * Output: { assessment with updated metrics }
   */
  router.put(
    '/norma3100/assessments/:id/responses',
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { serviceCode, responses, criteria } = req.body;

        if (!responses || !criteria) {
          return res.status(400).json({
            error: 'responses y criteria son requeridos',
          });
        }

        // Calculate metrics
        const metrics = norma3100Service.calculateMetrics(
          responses,
          criteria
        );

        // Generate hallazgos if any NC found
        const hallazgos = norma3100Service.generateHallazgos(
          id,
          responses,
          criteria
        );

        const assessment = {
          id,
          status: 'in_progress',
          responses,
          metrics,
          compliancePercent: metrics.compliancePercent,
          semaforo: metrics.semaforo,
          hallazgosCount: hallazgos.length,
          hallazgos,
          updatedDate: new Date(),
        };

        logger.info({
          msg: 'Assessment responses recorded',
          assessment_id: id,
          compliance_percent: metrics.compliancePercent,
          semaforo: metrics.semaforo,
          hallazgos_count: hallazgos.length,
        });

        res.json({
          success: true,
          assessment,
        });
      } catch (error: any) {
        logger.error({
          msg: 'Error recording responses',
          error: error.message,
        });
        res.status(400).json({
          error: error.message,
        });
      }
    }
  );

  /**
   * POST /api/norma3100/assessments/:id/submit
   * Submit assessment (mark as completed)
   * Input: { observations? }
   * Output: { assessment with locked status, hallazgos }
   */
  router.post(
    '/norma3100/assessments/:id/submit',
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { observations } = req.body;
        const userId = (req as any).user?.id || (req as any).userId;

        const assessment = {
          id,
          status: 'submitted',
          submittedDate: new Date(),
          submittedBy: userId || 'mock-user',
          observations,
        };

        logger.info({
          msg: 'Assessment submitted',
          assessment_id: id,
          submitted_by: userId,
        });

        res.json({
          success: true,
          assessment,
        });
      } catch (error: any) {
        logger.error({
          msg: 'Error submitting assessment',
          error: error.message,
        });
        res.status(400).json({
          error: error.message,
        });
      }
    }
  );

  /**
   * GET /api/norma3100/model
   * Get the complete Norma 3100 JSON model
   * Useful for frontend to build dynamic UIs
   */
  router.get('/norma3100/model', async (req: Request, res: Response) => {
    try {
      const service = new Norma3100Service();
      const model = await service.loadModel();

      res.json({
        success: true,
        model,
      });
    } catch (error: any) {
      logger.error({
        msg: 'Error getting model',
        error: error.message,
      });
      res.status(500).json({
        error: error.message,
      });
    }
  });

  return router;
}
