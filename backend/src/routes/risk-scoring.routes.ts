/**
 * Risk Scoring API Routes
 * Endpoints for calculating and retrieving risk scores for findings
 */

import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken, authorize } from '../middleware/auth.middleware.js';
import { RiskScoringService } from '../services/RiskScoringService.js';
import { getPool } from '../config/database.js';
import { logger } from '../utils/logger.js';

const router = Router();
const pool = getPool();
const riskScoringService = new RiskScoringService(pool);

// ============================================================
// MIDDLEWARE
// ============================================================

// Require authentication for all routes
router.use(authenticateToken);

// ============================================================
// GET ENDPOINTS
// ============================================================

/**
 * GET /api/findings/:findingId/risk
 * Get current risk score for a finding
 *
 * Response: {
 *   findingId: string,
 *   currentScore: number (0-100),
 *   severity: string,
 *   ageInDays: number,
 *   daysOverdue: number,
 *   actionStatus: string,
 *   components: {
 *     severityPoints: number,
 *     agePoints: number,
 *     overduePoints: number,
 *     actionStatusPoints: number
 *   },
 *   riskLevel: 'crítica' | 'alta' | 'media' | 'baja',
 *   escalationRequired: boolean,
 *   lastCalculated: ISO date string
 * }
 */
router.get(
  '/findings/:findingId/risk',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { findingId } = req.params;

      // Validate finding exists and user has access
      const findingResult = await pool.query(
        `SELECT id, provider_id FROM findings WHERE id = $1`,
        [findingId]
      );

      if (findingResult.rows.length === 0) {
        return res.status(404).json({ error: 'Hallazgo no encontrado' });
      }

      const finding = findingResult.rows[0];

      // Check authorization
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;

      if (userRole !== 'super_admin') {
        // Verify user has access to this provider
        const accessResult = await pool.query(
          `SELECT id FROM users WHERE id = $1 AND (provider_id = $2 OR role = $3)`,
          [userId, finding.provider_id, 'super_admin']
        );

        if (accessResult.rows.length === 0 && userRole !== 'auditor') {
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
 * Get risk score trend and historical data for a finding
 *
 * Query params:
 *   months: number (default: 3, max: 12)
 *
 * Response: {
 *   findingId: string,
 *   trends: [{ date: ISO date, score: number, riskLevel: string }],
 *   averageScore: number,
 *   trend: 'improving' | 'stable' | 'worsening'
 * }
 */
router.get(
  '/findings/:findingId/risk/trend',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { findingId } = req.params;
      const { months = '3' } = req.query;
      const monthsBack = Math.min(12, Math.max(1, parseInt(months as string) || 3));

      const riskTrend = await riskScoringService.getRiskTrend(
        findingId,
        monthsBack
      );

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
 *
 * Query params:
 *   providerId: string (optional)
 *   limit: number (default: 50, max: 200)
 *
 * Response: [{
 *   findingId: string,
 *   findingTitle: string,
 *   currentScore: number,
 *   riskLevel: string,
 *   severity: string,
 *   daysOverdue: number,
 *   actionDescription: string,
 *   assignedTo: string,
 *   priority: number
 * }]
 */
router.get(
  '/risk-alerts',
  authorize(['auditor', 'super_admin']),
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
 * Get risk scoring summary for a provider's findings
 *
 * Response: {
 *   total_findings: number,
 *   closed_findings: number,
 *   high_risk_findings: number,
 *   avg_risk_score: number,
 *   max_risk_score: number
 * }
 */
router.get(
  '/providers/:providerId/risk-summary',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { providerId } = req.params;

      // Verify provider exists and user has access
      const providerResult = await pool.query(
        `SELECT id FROM providers WHERE id = $1`,
        [providerId]
      );

      if (providerResult.rows.length === 0) {
        return res.status(404).json({ error: 'Proveedor no encontrado' });
      }

      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;

      if (userRole === 'provider_admin') {
        // Verify user's provider
        const userResult = await pool.query(
          `SELECT provider_id FROM users WHERE id = $1`,
          [userId]
        );

        if (
          userResult.rows.length === 0 ||
          userResult.rows[0].provider_id !== providerId
        ) {
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
 * GET /api/locations/:locationId/risk-summary
 * Get risk scoring summary for a location's findings
 *
 * Response: Same as provider risk summary
 */
router.get(
  '/locations/:locationId/risk-summary',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { locationId } = req.params;

      // Get provider ID from location
      const locationResult = await pool.query(
        `SELECT provider_id FROM locations WHERE id = $1`,
        [locationId]
      );

      if (locationResult.rows.length === 0) {
        return res.status(404).json({ error: 'Ubicación no encontrada' });
      }

      const providerId = locationResult.rows[0].provider_id;

      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;

      if (userRole === 'provider_admin') {
        // Verify user's provider
        const userResult = await pool.query(
          `SELECT provider_id FROM users WHERE id = $1`,
          [userId]
        );

        if (
          userResult.rows.length === 0 ||
          userResult.rows[0].provider_id !== providerId
        ) {
          return res.status(403).json({ error: 'No autorizado' });
        }
      }

      // Query for location-specific findings
      const summary = await pool.query(
        `SELECT
          COUNT(*) as total_findings,
          SUM(CASE WHEN status = 'cerrada' THEN 1 ELSE 0 END) as closed_findings,
          SUM(CASE WHEN rsh.risk_score > 70 THEN 1 ELSE 0 END) as high_risk_findings,
          ROUND(AVG(CASE WHEN status != 'cerrada' THEN rsh.risk_score ELSE NULL END), 2) as avg_risk_score,
          MAX(CASE WHEN status != 'cerrada' THEN rsh.risk_score ELSE 0 END) as max_risk_score
        FROM findings f
        LEFT JOIN LATERAL (
          SELECT risk_score FROM risk_score_history
          WHERE finding_id = f.id
          ORDER BY created_at DESC LIMIT 1
        ) rsh ON true
        WHERE f.location_id = $1`,
        [locationId]
      );

      res.json(summary.rows[0]);
    } catch (error) {
      logger.error('Error getting location risk summary:', error);
      next(error);
    }
  }
);

// ============================================================
// POST ENDPOINTS
// ============================================================

/**
 * POST /api/findings/:findingId/risk/recalculate
 * Manually recalculate and update risk score for a finding
 *
 * Request body: (empty)
 *
 * Response: Updated RiskScore object
 */
router.post(
  '/findings/:findingId/risk/recalculate',
  authorize(['auditor', 'super_admin']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { findingId } = req.params;
      const userId = (req as any).user.id;

      // Verify finding exists
      const findingResult = await pool.query(
        `SELECT id FROM findings WHERE id = $1`,
        [findingId]
      );

      if (findingResult.rows.length === 0) {
        return res.status(404).json({ error: 'Hallazgo no encontrado' });
      }

      const updatedRiskScore = await riskScoringService.updateRiskScore(
        findingId
      );

      // Log event for audit trail
      await pool.query(
        `INSERT INTO events (id, event_type, aggregate_id, aggregate_type, data, user_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          uuidv4(),
          'finding.risk_recalculated',
          findingId,
          'finding',
          JSON.stringify({ risk_score: updatedRiskScore.currentScore }),
          userId,
        ]
      );

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
 *
 * Request body: {
 *   findingIds: string[]
 * }
 *
 * Response: {
 *   updated: number,
 *   errors: { findingId: string, error: string }[]
 * }
 */
router.post(
  '/findings/bulk-risk-update',
  authorize(['auditor', 'super_admin']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { findingIds } = req.body;

      if (!Array.isArray(findingIds) || findingIds.length === 0) {
        return res.status(400).json({ error: 'findingIds array required' });
      }

      const userId = (req as any).user.id;
      const results: { updated: number; errors: any[] } = {
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

      // Log bulk operation
      await pool.query(
        `INSERT INTO events (id, event_type, aggregate_id, aggregate_type, data, user_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          uuidv4(),
          'findings.bulk_risk_update',
          'batch-' + uuidv4(),
          'findings',
          JSON.stringify({
            count: findingIds.length,
            updated: results.updated,
            errors: results.errors.length,
          }),
          userId,
        ]
      );

      res.json(results);
    } catch (error) {
      logger.error('Error bulk updating risk scores:', error);
      next(error);
    }
  }
);

// ============================================================
// ERROR HANDLER
// ============================================================

router.use(
  (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    logger.error('Risk scoring route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
);

export default router;
