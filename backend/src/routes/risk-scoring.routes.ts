/**
 * Risk Scoring API Routes
 * Endpoints for calculating and retrieving risk scores for findings
 */

import { Router, Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { rbacMiddleware } from '../middleware/role.middleware.js';
import { RiskScoringService } from '../services/RiskScoringService.js';
import { EventStore } from '../modules/events/EventStore.js';
import { logger } from '../utils/logger.js';

export function createRiskScoringRouter(pool: Pool): Router {
  const router = Router();
  const riskScoringService = new RiskScoringService(pool);
  const eventStore = new EventStore(pool);

  // Require authentication for all routes
  router.use(authMiddleware);

  /**
   * GET /api/findings/:findingId/risk
   * Get current risk score for a finding
   */
  router.get(
    '/findings/:findingId/risk',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { findingId } = req.params;

        const findingResult = await pool.query(
          `SELECT id, provider_id FROM findings WHERE id = $1`,
          [findingId]
        );

        if (findingResult.rows.length === 0) {
          return res.status(404).json({ error: 'Hallazgo no encontrado' });
        }

        const finding = findingResult.rows[0];
        const userId = req.user?.user_id;
        const userRole = req.user?.role;

        if (userRole !== 'super_admin' && userRole !== 'auditor') {
          const accessResult = await pool.query(
            `SELECT id FROM users WHERE id = $1 AND provider_id = $2`,
            [userId, finding.provider_id]
          );
          if (accessResult.rows.length === 0) {
            return res.status(403).json({ error: 'No autorizado' });
          }
        }

        const riskScore = await riskScoringService.calculateRisk(findingId);
        res.json(riskScore);
      } catch (error) {
        logger.error('Error getting risk score:', error);
        next(error);
      }
    }
  );

  /**
   * GET /api/findings/:findingId/risk/trend
   * Get risk score trend and historical data
   */
  router.get(
    '/findings/:findingId/risk/trend',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { findingId } = req.params;
        const { months = '3' } = req.query;
        const monthsBack = Math.min(12, Math.max(1, parseInt(months as string) || 3));

        const findingResult = await pool.query(
          `SELECT id, provider_id FROM findings WHERE id = $1`,
          [findingId]
        );

        if (findingResult.rows.length === 0) {
          return res.status(404).json({ error: 'Hallazgo no encontrado' });
        }

        const finding = findingResult.rows[0];
        const userId = req.user?.user_id;
        const userRole = req.user?.role;

        if (userRole !== 'super_admin' && userRole !== 'auditor') {
          const accessResult = await pool.query(
            `SELECT id FROM users WHERE id = $1 AND provider_id = $2`,
            [userId, finding.provider_id]
          );
          if (accessResult.rows.length === 0) {
            return res.status(403).json({ error: 'No autorizado' });
          }
        }

        const riskTrend = await riskScoringService.getRiskTrend(findingId, monthsBack);
        res.json(riskTrend);
      } catch (error) {
        logger.error('Error getting risk trend:', error);
        next(error);
      }
    }
  );

  /**
   * GET /api/risk-alerts
   * Get all high-risk findings (score > 70 or overdue)
   */
  router.get(
    '/risk-alerts',
    rbacMiddleware(['auditor', 'super_admin']),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { providerId, limit = '50' } = req.query;
        const alertLimit = Math.min(200, Math.max(10, parseInt(limit as string) || 50));

        const alerts = await riskScoringService.getRiskAlerts(
          providerId as string,
          alertLimit
        );
        res.json(alerts);
      } catch (error) {
        logger.error('Error getting risk alerts:', error);
        next(error);
      }
    }
  );

  /**
   * GET /api/providers/:providerId/risk-summary
   * Get risk scoring summary for a provider
   */
  router.get(
    '/providers/:providerId/risk-summary',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { providerId } = req.params;

        const providerResult = await pool.query(
          `SELECT id FROM providers WHERE id = $1`,
          [providerId]
        );
        if (providerResult.rows.length === 0) {
          return res.status(404).json({ error: 'Proveedor no encontrado' });
        }

        const userRole = req.user?.role;
        if (userRole === 'provider_admin') {
          const userResult = await pool.query(
            `SELECT provider_id FROM users WHERE id = $1`,
            [req.user?.user_id]
          );
          if (userResult.rows.length === 0 || userResult.rows[0].provider_id !== providerId) {
            return res.status(403).json({ error: 'No autorizado' });
          }
        }

        const summary = await riskScoringService.getRiskSummary(providerId);
        res.json(summary);
      } catch (error) {
        logger.error('Error getting risk summary:', error);
        next(error);
      }
    }
  );

  /**
   * POST /api/findings/:findingId/risk/recalculate
   * Manually recalculate risk score
   */
  router.post(
    '/findings/:findingId/risk/recalculate',
    rbacMiddleware(['auditor', 'super_admin']),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { findingId } = req.params;
        const userId = req.user?.user_id;

        const findingResult = await pool.query(
          `SELECT id FROM findings WHERE id = $1`,
          [findingId]
        );
        if (findingResult.rows.length === 0) {
          return res.status(404).json({ error: 'Hallazgo no encontrado' });
        }

        const updatedRiskScore = await riskScoringService.updateRiskScore(findingId);

        await eventStore.append({
          aggregateId: findingId,
          aggregateType: 'finding',
          eventType: 'finding.risk_recalculated',
          payload: { risk_score: updatedRiskScore.currentScore },
          userId,
        });

        res.json(updatedRiskScore);
      } catch (error) {
        logger.error('Error recalculating risk score:', error);
        next(error);
      }
    }
  );

  /**
   * POST /api/findings/bulk-risk-update
   * Recalculate risk scores for multiple findings
   */
  router.post(
    '/findings/bulk-risk-update',
    rbacMiddleware(['auditor', 'super_admin']),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { findingIds } = req.body;

        if (!Array.isArray(findingIds) || findingIds.length === 0) {
          return res.status(400).json({ error: 'findingIds array required' });
        }

        const userId = req.user?.user_id;
        const results: { updated: number; errors: { findingId: string; error: string }[] } = {
          updated: 0,
          errors: [],
        };

        for (const findingId of findingIds) {
          try {
            await riskScoringService.updateRiskScore(findingId);
            results.updated++;
          } catch (error) {
            results.errors.push({
              findingId,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        await eventStore.append({
          aggregateId: 'batch-' + uuidv4(),
          aggregateType: 'findings',
          eventType: 'findings.bulk_risk_update',
          payload: {
            count: findingIds.length,
            updated: results.updated,
            errors: results.errors.length,
          },
          userId,
        });

        res.json(results);
      } catch (error) {
        logger.error('Error bulk updating risk scores:', error);
        next(error);
      }
    }
  );

  return router;
}
