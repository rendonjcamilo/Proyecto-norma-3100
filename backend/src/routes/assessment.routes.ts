/**
 * Assessment & Questionnaire API Routes
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { rbacMiddleware } from '../middleware/role.middleware.js';
import { AssessmentModel } from '../models/assessment.model.js';
import { EventStore } from '../modules/events/EventStore.js';
import { logger } from '../utils/logger.js';

export function createAssessmentRouter(pool: Pool, eventStore: EventStore): Router {
  const router = Router();
  const assessmentModel = new AssessmentModel(pool);

  // ===== QUESTIONNAIRES =====

  /**
   * POST /api/questionnaires
   * Create questionnaire
   */
  router.post(
    '/questionnaires',
    authMiddleware,
    rbacMiddleware(['super_admin', 'auditor']),
    async (req: Request, res: Response) => {
      try {
        const { name, description, status } = req.body;

        if (!name) {
          return res.status(400).json({ error: 'Name is required' });
        }

        const questionnaire = await assessmentModel.createQuestionnaire({
          name,
          description,
          status: status || 'draft',
          created_by: (req as any).user?.id,
        });

        // Emit event
        await eventStore.append({
          aggregateId: questionnaire.id,
          aggregateType: 'questionnaire',
          eventType: 'questionnaire.created',
          payload: questionnaire as any,
          userId: (req as any).user?.id,
        });

        logger.info({
          msg: 'Questionnaire created',
          questionnaire_id: questionnaire.id,
        });

        res.status(201).json(questionnaire);
      } catch (err) {
        logger.error({
          msg: 'Error creating questionnaire',
          error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'Failed to create questionnaire' });
      }
    }
  );

  /**
   * GET /api/questionnaires
   * List questionnaires
   */
  router.get(
    '/questionnaires',
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const filters = {
          status: req.query.status as string,
          search: req.query.search as string,
        };

        const questionnaires = await assessmentModel.getQuestionnaires(filters);

        res.json({
          count: questionnaires.length,
          questionnaires,
        });
      } catch (err) {
        logger.error({
          msg: 'Error fetching questionnaires',
          error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'Failed to fetch questionnaires' });
      }
    }
  );

  /**
   * GET /api/questionnaires/:id
   * Get questionnaire with all sections and questions
   */
  router.get(
    '/questionnaires/:id',
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const questionnaire = await assessmentModel.getQuestionnaireById(req.params.id);

        if (!questionnaire) {
          return res.status(404).json({ error: 'Questionnaire not found' });
        }

        // Get sections
        const sections = await assessmentModel.getSectionsByQuestionnaire(req.params.id);

        // Get questions for each section
        const fullSections = await Promise.all(
          sections.map(async (section) => {
            const questions = await assessmentModel.getQuestionsBySection(section.id);
            const fullQuestions = await Promise.all(
              questions.map(async (question) => {
                const options = await assessmentModel.getOptionsByQuestion(question.id);
                return { ...question, options };
              })
            );
            return { ...section, questions: fullQuestions };
          })
        );

        res.json({
          ...questionnaire,
          sections: fullSections,
        });
      } catch (err) {
        logger.error({
          msg: 'Error fetching questionnaire',
          error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'Failed to fetch questionnaire' });
      }
    }
  );

  /**
   * POST /api/questionnaires/:id/publish
   * Publish questionnaire (create new version)
   */
  router.post(
    '/questionnaires/:id/publish',
    authMiddleware,
    rbacMiddleware(['super_admin']),
    async (req: Request, res: Response) => {
      try {
        const questionnaire = await assessmentModel.getQuestionnaireById(req.params.id);

        if (!questionnaire) {
          return res.status(404).json({ error: 'Questionnaire not found' });
        }

        const published = await assessmentModel.publishQuestionnaire(req.params.id);

        // Emit event
        await eventStore.append({
          aggregateId: published.id,
          aggregateType: 'questionnaire',
          eventType: 'questionnaire.published',
          payload: published as any,
          userId: (req as any).user?.id,
        });

        logger.info({
          msg: 'Questionnaire published',
          questionnaire_id: published.id,
          version: published.version,
        });

        res.json(published);
      } catch (err) {
        logger.error({
          msg: 'Error publishing questionnaire',
          error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'Failed to publish questionnaire' });
      }
    }
  );

  // ===== ASSESSMENTS =====

  /**
   * POST /api/assessments
   * Create assessment (assign to provider)
   */
  router.post(
    '/assessments',
    authMiddleware,
    rbacMiddleware(['super_admin', 'auditor']),
    async (req: Request, res: Response) => {
      try {
        const { questionnaire_id, provider_id, location_id, service_id, deadline } = req.body;

        if (!questionnaire_id || !provider_id) {
          return res.status(400).json({ error: 'questionnaire_id and provider_id are required' });
        }

        const assessment = await assessmentModel.createAssessment({
          questionnaire_id,
          provider_id,
          location_id: location_id || undefined,
          service_id: service_id || undefined,
          status: 'draft',
          assigned_date: new Date(),
          deadline: deadline ? new Date(deadline) : undefined,
          created_by: (req as any).user?.id,
        });

        // Emit event
        await eventStore.append({
          aggregateId: assessment.id,
          aggregateType: 'assessment',
          eventType: 'assessment.created',
          payload: assessment as any,
          userId: (req as any).user?.id,
        });

        logger.info({
          msg: 'Assessment created',
          assessment_id: assessment.id,
          provider_id,
        });

        res.status(201).json(assessment);
      } catch (err) {
        logger.error({
          msg: 'Error creating assessment',
          error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'Failed to create assessment' });
      }
    }
  );

  /**
   * GET /api/assessments
   * List assessments
   */
  router.get(
    '/assessments',
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const filters = {
          provider_id: req.query.provider_id as string,
          location_id: req.query.location_id as string,
          status: req.query.status as string,
        };

        const assessments = await assessmentModel.getAssessments(filters);

        res.json({
          count: assessments.length,
          assessments,
        });
      } catch (err) {
        logger.error({
          msg: 'Error fetching assessments',
          error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'Failed to fetch assessments' });
      }
    }
  );

  /**
   * GET /api/assessments/:id
   * Get assessment with responses
   */
  router.get(
    '/assessments/:id',
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const assessment = await assessmentModel.getAssessmentById(req.params.id);

        if (!assessment) {
          return res.status(404).json({ error: 'Assessment not found' });
        }

        const responses = await assessmentModel.getResponsesByAssessment(req.params.id);

        res.json({
          ...assessment,
          responses,
        });
      } catch (err) {
        logger.error({
          msg: 'Error fetching assessment',
          error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'Failed to fetch assessment' });
      }
    }
  );

  /**
   * POST /api/assessments/:id/responses
   * Save assessment responses (auto-save)
   */
  router.post(
    '/assessments/:id/responses',
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const assessment = await assessmentModel.getAssessmentById(req.params.id);

        if (!assessment) {
          return res.status(404).json({ error: 'Assessment not found' });
        }

        // Check deadline
        if (assessment.deadline && new Date() > assessment.deadline && assessment.status !== 'submitted') {
          return res.status(403).json({ error: 'Assessment deadline has passed' });
        }

        const { responses } = req.body; // Array of { question_id, response_value }

        if (!Array.isArray(responses)) {
          return res.status(400).json({ error: 'responses must be an array' });
        }

        // Save all responses
        const saved = await Promise.all(
          responses.map((r) =>
            assessmentModel.saveResponse({
              assessment_id: req.params.id,
              question_id: r.question_id,
              response_value: r.response_value,
              response_type: r.response_type,
              answered_at: new Date(),
              answered_by: (req as any).user?.id,
            })
          )
        );

        // Update assessment updated_at
        await assessmentModel.updateAssessment(req.params.id, {
          updated_at: new Date(),
        });

        logger.info({
          msg: 'Assessment responses saved',
          assessment_id: req.params.id,
          count: saved.length,
        });

        res.json({
          success: true,
          saved_count: saved.length,
          saved,
        });
      } catch (err) {
        logger.error({
          msg: 'Error saving responses',
          error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'Failed to save responses' });
      }
    }
  );

  /**
   * PUT /api/assessments/:id/submit
   * Submit assessment
   */
  router.put(
    '/assessments/:id/submit',
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const assessment = await assessmentModel.getAssessmentById(req.params.id);

        if (!assessment) {
          return res.status(404).json({ error: 'Assessment not found' });
        }

        // Check deadline
        if (assessment.deadline && new Date() > assessment.deadline) {
          return res.status(403).json({ error: 'Assessment deadline has passed' });
        }

        // Calculate compliance %
        const compliance_pct = await assessmentModel.calculateCompliancePercentage(req.params.id);
        const risk_score = await assessmentModel.calculateRiskScore(req.params.id);

        const submitted = await assessmentModel.submitAssessment(req.params.id, risk_score, compliance_pct);

        // Emit event
        await eventStore.append({
          aggregateId: submitted.id,
          aggregateType: 'assessment',
          eventType: 'assessment.submitted',
          payload: {
            compliance_pct,
            risk_score,
          },
          userId: (req as any).user?.id,
        });

        logger.info({
          msg: 'Assessment submitted',
          assessment_id: submitted.id,
          compliance_pct,
          risk_score,
        });

        res.json(submitted);
      } catch (err) {
        logger.error({
          msg: 'Error submitting assessment',
          error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'Failed to submit assessment' });
      }
    }
  );

  return router;
}
