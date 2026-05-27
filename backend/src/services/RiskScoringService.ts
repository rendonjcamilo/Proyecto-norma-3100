/**
 * Risk Scoring Service
 * Calculates and tracks risk scores for findings with trend analysis
 *
 * Risk Algorithm:
 * - Base risk: 20-80 points based on finding severity
 * - Age factor: 0-15 points (increases with finding age)
 * - Resolution time: 0-20 points (increases if overdue)
 * - Action status: 0-15 points (escalates with action delays)
 * - Total: 0-130 points → normalized to 0-100 scale
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface RiskScore {
  findingId: string;
  currentScore: number;
  severity: 'crítica' | 'alta' | 'media' | 'baja';
  ageInDays: number;
  daysOverdue: number;
  actionStatus: 'open' | 'in_progress' | 'overdue' | 'resolved';
  components: {
    severityPoints: number;
    agePoints: number;
    overduePoints: number;
    actionStatusPoints: number;
  };
  riskLevel: 'crítica' | 'alta' | 'media' | 'baja';
  escalationRequired: boolean;
  lastCalculated: Date;
}

export interface RiskTrend {
  findingId: string;
  trends: Array<{
    date: Date;
    score: number;
    riskLevel: string;
  }>;
  averageScore: number;
  trend: 'improving' | 'stable' | 'worsening';
}

export interface RiskAlert {
  findingId: string;
  findingTitle: string;
  currentScore: number;
  riskLevel: 'crítica' | 'alta' | 'media' | 'baja';
  severity: string;
  daysOverdue: number;
  actionDescription?: string;
  assignedTo?: string;
  priority: number; // 1=highest priority
}

export interface FindingData {
  id: string;
  severity: 'crítica' | 'alta' | 'media' | 'baja';
  title: string;
  status: string;
  created_date: Date;
  closed_date?: Date;
}

export interface ActionData {
  id: string;
  finding_id: string;
  status: string;
  deadline: Date;
  completion_percentage: number;
  assigned_to?: string;
}

// ============================================================
// RISK SCORING SERVICE
// ============================================================

export class RiskScoringService {
  constructor(private pool: Pool) {}

  /**
   * Calculate current risk score for a finding
   * Returns comprehensive risk assessment with component breakdown
   */
  async calculateRisk(findingId: string): Promise<RiskScore> {
    try {
      // Fetch finding data
      const findingResult = await this.pool.query(
        `SELECT id, severity, title, status, created_date, closed_date
         FROM findings WHERE id = $1`,
        [findingId]
      );

      if (findingResult.rows.length === 0) {
        throw new Error(`Finding not found: ${findingId}`);
      }

      const finding: FindingData = findingResult.rows[0];

      // If finding is closed, risk is 0
      if (finding.status === 'cerrada' || finding.closed_date) {
        return {
          findingId,
          currentScore: 0,
          severity: finding.severity,
          ageInDays: 0,
          daysOverdue: 0,
          actionStatus: 'resolved',
          components: {
            severityPoints: 0,
            agePoints: 0,
            overduePoints: 0,
            actionStatusPoints: 0,
          },
          riskLevel: 'baja',
          escalationRequired: false,
          lastCalculated: new Date(),
        };
      }

      // Fetch associated corrective actions
      const actionsResult = await this.pool.query(
        `SELECT id, status, deadline, completion_percentage, assigned_to
         FROM corrective_actions WHERE finding_id = $1 ORDER BY created_date DESC LIMIT 5`,
        [findingId]
      );

      const actions: ActionData[] = actionsResult.rows;

      // Calculate components
      const severityPoints = this.calculateSeverityPoints(finding.severity);
      const agePoints = this.calculateAgePoints(finding.created_date);
      const { overduePoints, daysOverdue } = this.calculateOverduePoints(actions);
      const { actionStatusPoints, actionStatus } = this.calculateActionStatusPoints(actions);

      // Calculate total raw score (0-130)
      const rawScore =
        severityPoints + agePoints + overduePoints + actionStatusPoints;

      // Normalize to 0-100 scale
      const normalizedScore = Math.min(100, Math.round((rawScore / 130) * 100));

      // Determine risk level
      const riskLevel = this.determinRiskLevel(normalizedScore);

      // Escalation required if score > 70 or overdue
      const escalationRequired = normalizedScore > 70 || daysOverdue > 0;

      const riskScore: RiskScore = {
        findingId,
        currentScore: normalizedScore,
        severity: finding.severity,
        ageInDays: Math.floor(
          (new Date().getTime() - new Date(finding.created_date).getTime()) /
            (1000 * 60 * 60 * 24)
        ),
        daysOverdue,
        actionStatus,
        components: {
          severityPoints,
          agePoints,
          overduePoints,
          actionStatusPoints,
        },
        riskLevel,
        escalationRequired,
        lastCalculated: new Date(),
      };

      // Log risk score for audit trail
      await this.logRiskScore(findingId, normalizedScore, riskLevel);

      return riskScore;
    } catch (error) {
      logger.error(`Error calculating risk for finding ${findingId}:`, error);
      throw error;
    }
  }

  /**
   * Get risk score history and trend for a finding
   */
  async getRiskTrend(findingId: string, monthsBack: number = 3): Promise<RiskTrend> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - monthsBack);

      const result = await this.pool.query(
        `SELECT DATE(created_at) as date, risk_score
         FROM risk_score_history
         WHERE finding_id = $1 AND created_at >= $2
         ORDER BY created_at ASC`,
        [findingId, cutoffDate]
      );

      const trends = result.rows.map(row => ({
        date: new Date(row.date),
        score: row.risk_score,
        riskLevel: this.determinRiskLevel(row.risk_score),
      }));

      const averageScore =
        trends.length > 0
          ? Math.round(
              trends.reduce((sum, t) => sum + t.score, 0) / trends.length
            )
          : 0;

      // Determine trend direction
      let trend: 'improving' | 'stable' | 'worsening' = 'stable';
      if (trends.length >= 2) {
        const firstHalf = trends
          .slice(0, Math.floor(trends.length / 2))
          .reduce((sum, t) => sum + t.score, 0) / Math.floor(trends.length / 2);
        const secondHalf = trends
          .slice(Math.floor(trends.length / 2))
          .reduce((sum, t) => sum + t.score, 0) / (trends.length - Math.floor(trends.length / 2));

        if (secondHalf < firstHalf - 5) {trend = 'improving';}
        else if (secondHalf > firstHalf + 5) {trend = 'worsening';}
      }

      return {
        findingId,
        trends,
        averageScore,
        trend,
      };
    } catch (error) {
      logger.error(`Error getting risk trend for finding ${findingId}:`, error);
      throw error;
    }
  }

  /**
   * Get all high-risk alerts (score > 70 or overdue)
   */
  async getRiskAlerts(
    providerId?: string,
    limit: number = 50
  ): Promise<RiskAlert[]> {
    try {
      let query = `
        SELECT
          f.id as finding_id,
          f.title as finding_title,
          f.severity,
          rsh.risk_score,
          ca.deadline,
          ca.description as action_description,
          ca.assigned_to
        FROM findings f
        LEFT JOIN LATERAL (
          SELECT risk_score FROM risk_score_history
          WHERE finding_id = f.id
          ORDER BY created_at DESC LIMIT 1
        ) rsh ON true
        LEFT JOIN corrective_actions ca ON f.id = ca.finding_id
        WHERE f.status != 'cerrada'
        AND rsh.risk_score > 70
      `;

      const params: any[] = [];

      if (providerId) {
        query += ` AND f.provider_id = $${params.length + 1}`;
        params.push(providerId);
      }

      query += ` ORDER BY rsh.risk_score DESC LIMIT $${params.length + 1}`;
      params.push(limit);

      const result = await this.pool.query(query, params);

      const alerts: RiskAlert[] = result.rows.map((row, index) => {
        const daysOverdue = row.deadline
          ? Math.max(
              0,
              Math.floor(
                (new Date().getTime() - new Date(row.deadline).getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            )
          : 0;

        return {
          findingId: row.finding_id,
          findingTitle: row.finding_title,
          currentScore: row.risk_score || 0,
          riskLevel: this.determinRiskLevel(row.risk_score || 0),
          severity: row.severity,
          daysOverdue,
          actionDescription: row.action_description,
          assignedTo: row.assigned_to,
          priority: index + 1,
        };
      });

      return alerts;
    } catch (error) {
      logger.error('Error getting risk alerts:', error);
      throw error;
    }
  }

  /**
   * Update risk score for a finding (called when status changes)
   */
  async updateRiskScore(findingId: string): Promise<RiskScore> {
    const riskScore = await this.calculateRisk(findingId);

    // Update finding with current risk score
    await this.pool.query(
      `UPDATE findings SET risk_score = $1, updated_at = NOW() WHERE id = $2`,
      [riskScore.currentScore, findingId]
    );

    return riskScore;
  }

  /**
   * Get risk scoring summary for dashboard
   */
  async getRiskSummary(providerId?: string) {
    try {
      let query = `
        SELECT
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
      `;

      const params: any[] = [];

      if (providerId) {
        query += ` WHERE f.provider_id = $${params.length + 1}`;
        params.push(providerId);
      }

      const result = await this.pool.query(query, params);
      return result.rows[0];
    } catch (error) {
      logger.error('Error getting risk summary:', error);
      throw error;
    }
  }

  // ============================================================
  // PRIVATE HELPER METHODS
  // ============================================================

  /**
   * Calculate severity-based risk points (0-80)
   * crítica=80, alta=60, media=40, baja=20
   */
  private calculateSeverityPoints(severity: string): number {
    const severityMap: Record<string, number> = {
      crítica: 80,
      alta: 60,
      media: 40,
      baja: 20,
    };
    return severityMap[severity] || 20;
  }

  /**
   * Calculate age-based risk points (0-15)
   * Increases with finding age: 0d=0pts, 30d=7.5pts, 60d=15pts
   */
  private calculateAgePoints(createdDate: Date): number {
    const ageInDays = Math.floor(
      (new Date().getTime() - new Date(createdDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    // Linear increase: 15 points per 60 days
    const agePoints = Math.min(15, (ageInDays / 60) * 15);
    return Math.round(agePoints * 10) / 10;
  }

  /**
   * Calculate overdue risk points (0-20)
   * If action deadline passed, increase risk
   */
  private calculateOverduePoints(
    actions: ActionData[]
  ): { overduePoints: number; daysOverdue: number } {
    if (actions.length === 0) {return { overduePoints: 0, daysOverdue: 0 };}

    // Use most recent action
    const action = actions[0];

    if (!action.deadline || action.status === 'cerrada') {
      return { overduePoints: 0, daysOverdue: 0 };
    }

    const now = new Date();
    const deadline = new Date(action.deadline);
    const daysOverdue = Math.max(
      0,
      Math.floor((now.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24))
    );

    // 0d overdue = 0pts, 7d overdue = 10pts, 14d+ overdue = 20pts
    const overduePoints = Math.min(20, (daysOverdue / 14) * 20);

    return {
      overduePoints: Math.round(overduePoints * 10) / 10,
      daysOverdue,
    };
  }

  /**
   * Calculate action status risk points (0-15)
   * open=3pts, in_progress=8pts, overdue=15pts
   */
  private calculateActionStatusPoints(
    actions: ActionData[]
  ): { actionStatusPoints: number; actionStatus: RiskScore['actionStatus'] } {
    if (actions.length === 0) {
      return { actionStatusPoints: 0, actionStatus: 'open' };
    }

    const action = actions[0];

    if (action.status === 'cerrada') {
      return { actionStatusPoints: 0, actionStatus: 'resolved' };
    }

    const now = new Date();
    const deadline = new Date(action.deadline);
    const daysUntilDeadline = Math.floor(
      (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    let points = 0;
    let statusLabel: RiskScore['actionStatus'] = 'open';

    if (daysUntilDeadline < 0) {
      // Overdue
      points = 15;
      statusLabel = 'overdue';
    } else if (action.status === 'en_progreso') {
      // In progress, close to deadline
      if (daysUntilDeadline < 7) {
        points = 12;
      } else if (daysUntilDeadline < 14) {
        points = 8;
      } else {
        points = 5;
      }
      statusLabel = 'in_progress';
    } else if (action.status === 'abierta') {
      // Open
      if (daysUntilDeadline < 7) {
        points = 10;
      } else {
        points = 3;
      }
      statusLabel = 'open';
    }

    return { actionStatusPoints: points, actionStatus: statusLabel };
  }

  /**
   * Determine risk level based on score
   */
  private determinRiskLevel(
    score: number
  ): 'crítica' | 'alta' | 'media' | 'baja' {
    if (score >= 80) {return 'crítica';}
    if (score >= 60) {return 'alta';}
    if (score >= 40) {return 'media';}
    return 'baja';
  }

  /**
   * Log risk score to history table for trend analysis
   */
  private async logRiskScore(
    findingId: string,
    score: number,
    riskLevel: string
  ): Promise<void> {
    try {
      const id = uuidv4();
      await this.pool.query(
        `INSERT INTO risk_score_history (id, finding_id, risk_score, risk_level, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT DO NOTHING`,
        [id, findingId, score, riskLevel]
      );
    } catch (error) {
      // Log but don't throw - non-critical operation
      logger.warn(`Failed to log risk score: ${error}`);
    }
  }
}

export default RiskScoringService;
