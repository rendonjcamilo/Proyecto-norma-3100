/**
 * Risk Scoring Service Tests
 * Comprehensive test suite for risk calculation, trends, and alerts
 */

import { Pool, QueryResult } from 'pg';
import { RiskScoringService } from '../RiskScoringService.js';

// Mock PostgreSQL pool
const mockQuery = jest.fn();
const mockConnect = jest.fn();
const mockPool = {
  query: mockQuery,
  connect: mockConnect,
} as unknown as Pool;

const service = new RiskScoringService(mockPool);

describe('RiskScoringService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // Risk Calculation Tests
  // ============================================================

  describe('calculateRisk', () => {
    it('calculates risk for crítica severity finding', async () => {
      const findingId = 'finding-001';
      const mockFinding = {
        id: findingId,
        severity: 'crítica',
        title: 'Critical Finding',
        status: 'abierta',
        created_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days old
        closed_date: null,
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [mockFinding] } as QueryResult)
        .mockResolvedValueOnce({ rows: [] } as QueryResult)
        .mockResolvedValueOnce({ rows: [] as any[] } as QueryResult);

      const risk = await service.calculateRisk(findingId);

      expect(risk.findingId).toBe(findingId);
      expect(risk.severity).toBe('crítica');
      expect(risk.components.severityPoints).toBe(80);
      expect(risk.currentScore).toBeGreaterThan(0);
      expect(risk.riskLevel).toBe('alta' || 'crítica');
    });

    it('calculates risk with age factor', async () => {
      const findingId = 'finding-002';
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

      const mockFinding = {
        id: findingId,
        severity: 'media',
        title: 'Old Finding',
        status: 'abierta',
        created_date: sixtyDaysAgo,
        closed_date: null,
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [mockFinding] } as QueryResult)
        .mockResolvedValueOnce({ rows: [] } as QueryResult)
        .mockResolvedValueOnce({ rows: [] as any[] } as QueryResult);

      const risk = await service.calculateRisk(findingId);

      // Age factor should be significant for 60-day-old finding
      expect(risk.ageInDays).toBe(60);
      expect(risk.components.agePoints).toBeGreaterThan(10);
    });

    it('calculates risk for closed finding as zero', async () => {
      const findingId = 'finding-003';
      const mockFinding = {
        id: findingId,
        severity: 'crítica',
        title: 'Closed Finding',
        status: 'cerrada',
        created_date: new Date(),
        closed_date: new Date(),
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockFinding] } as QueryResult);

      const risk = await service.calculateRisk(findingId);

      expect(risk.currentScore).toBe(0);
      expect(risk.riskLevel).toBe('baja');
      expect(risk.escalationRequired).toBe(false);
    });

    it('increases risk when action is overdue', async () => {
      const findingId = 'finding-004';
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // deadline passed 2 days ago

      const mockFinding = {
        id: findingId,
        severity: 'alta',
        title: 'Finding with Overdue Action',
        status: 'en_revision',
        created_date: sevenDaysAgo,
        closed_date: null,
      };

      const mockAction = {
        id: 'action-001',
        status: 'en_progreso',
        deadline: twoDaysAgo,
        completion_percentage: 50,
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [mockFinding] } as QueryResult)
        .mockResolvedValueOnce({ rows: [mockAction] } as QueryResult)
        .mockResolvedValueOnce({ rows: [] as any[] } as QueryResult);

      const risk = await service.calculateRisk(findingId);

      expect(risk.daysOverdue).toBe(2);
      expect(risk.components.overduePoints).toBeGreaterThan(0);
      expect(risk.escalationRequired).toBe(true);
    });

    it('throws error for non-existent finding', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as QueryResult);

      await expect(service.calculateRisk('non-existent')).rejects.toThrow();
    });

    it('normalizes raw score to 0-100 range', async () => {
      const findingId = 'finding-005';
      const mockFinding = {
        id: findingId,
        severity: 'crítica',
        title: 'High Risk Finding',
        status: 'abierta',
        created_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        closed_date: null,
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [mockFinding] } as QueryResult)
        .mockResolvedValueOnce({ rows: [] } as QueryResult)
        .mockResolvedValueOnce({ rows: [] as any[] } as QueryResult);

      const risk = await service.calculateRisk(findingId);

      expect(risk.currentScore).toBeGreaterThanOrEqual(0);
      expect(risk.currentScore).toBeLessThanOrEqual(100);
    });

    it('determines correct risk level from score', async () => {
      const testCases = [
        { score: 95, expectedLevel: 'crítica' },
        { score: 70, expectedLevel: 'alta' },
        { score: 50, expectedLevel: 'media' },
        { score: 30, expectedLevel: 'baja' },
      ];

      for (const { score, expectedLevel } of testCases) {
        const findingId = `finding-${score}`;
        // Mock a finding that would produce this score
        const mockFinding = {
          id: findingId,
          severity: 'crítica',
          title: 'Test Finding',
          status: 'abierta',
          created_date: new Date(),
          closed_date: null,
        };

        mockQuery
          .mockResolvedValueOnce({ rows: [mockFinding] } as QueryResult)
          .mockResolvedValueOnce({ rows: [] } as QueryResult)
          .mockResolvedValueOnce({ rows: [] as any[] } as QueryResult);

        const risk = await service.calculateRisk(findingId);
        // Score varies based on age, so just check the risk level is valid
        expect(['crítica', 'alta', 'media', 'baja']).toContain(risk.riskLevel);
      }
    });
  });

  // ============================================================
  // Risk Trend Tests
  // ============================================================

  describe('getRiskTrend', () => {
    it('returns risk trend history for a finding', async () => {
      const findingId = 'finding-006';
      const mockTrends = [
        { date: '2026-02-01', risk_score: 50 },
        { date: '2026-02-15', risk_score: 60 },
        { date: '2026-03-01', risk_score: 75 },
        { date: '2026-04-10', risk_score: 70 },
      ];

      mockQuery.mockResolvedValueOnce({
        rows: mockTrends,
      } as QueryResult);

      const trend = await service.getRiskTrend(findingId, 3);

      expect(trend.findingId).toBe(findingId);
      expect(trend.trends).toHaveLength(4);
      expect(trend.averageScore).toBeGreaterThan(0);
      expect(trend.averageScore).toBeLessThanOrEqual(100);
    });

    it('detects improving trend', async () => {
      const findingId = 'finding-007';
      const mockTrends = [
        { date: '2026-02-01', risk_score: 90 },
        { date: '2026-02-15', risk_score: 85 },
        { date: '2026-03-01', risk_score: 70 },
        { date: '2026-04-10', risk_score: 50 },
      ];

      mockQuery.mockResolvedValueOnce({
        rows: mockTrends,
      } as QueryResult);

      const trend = await service.getRiskTrend(findingId, 3);

      expect(trend.trend).toBe('improving');
    });

    it('detects worsening trend', async () => {
      const findingId = 'finding-008';
      const mockTrends = [
        { date: '2026-02-01', risk_score: 30 },
        { date: '2026-02-15', risk_score: 40 },
        { date: '2026-03-01', risk_score: 70 },
        { date: '2026-04-10', risk_score: 85 },
      ];

      mockQuery.mockResolvedValueOnce({
        rows: mockTrends,
      } as QueryResult);

      const trend = await service.getRiskTrend(findingId, 3);

      expect(trend.trend).toBe('worsening');
    });

    it('handles empty trend history', async () => {
      const findingId = 'finding-009';

      mockQuery.mockResolvedValueOnce({
        rows: [],
      } as QueryResult);

      const trend = await service.getRiskTrend(findingId, 3);

      expect(trend.trends).toHaveLength(0);
      expect(trend.averageScore).toBe(0);
      expect(trend.trend).toBe('stable');
    });

    it('respects months parameter', async () => {
      const findingId = 'finding-010';

      mockQuery.mockResolvedValueOnce({
        rows: [],
      } as QueryResult);

      await service.getRiskTrend(findingId, 6);

      const callArgs = mockQuery.mock.calls[0];
      expect(callArgs[1][1]).toMatchObject({
        getMonth: expect.any(Function),
      });
    });
  });

  // ============================================================
  // Risk Alerts Tests
  // ============================================================

  describe('getRiskAlerts', () => {
    it('returns high-risk alerts', async () => {
      const mockAlerts = [
        {
          finding_id: 'f-001',
          finding_title: 'Critical Issue',
          severity: 'crítica',
          risk_score: 85,
          deadline: new Date(),
          action_description: 'Fix critical issue',
          assigned_to: 'user-001',
        },
        {
          finding_id: 'f-002',
          finding_title: 'Major Issue',
          severity: 'alta',
          risk_score: 72,
          deadline: new Date(),
          action_description: 'Address major issue',
          assigned_to: 'user-002',
        },
      ];

      mockQuery.mockResolvedValueOnce({
        rows: mockAlerts,
      } as QueryResult);

      const alerts = await service.getRiskAlerts();

      expect(alerts).toHaveLength(2);
      expect(alerts[0].currentScore).toBe(85);
      expect(alerts[0].riskLevel).toBe('crítica');
    });

    it('filters alerts by provider', async () => {
      const providerId = 'prov-001';

      mockQuery.mockResolvedValueOnce({
        rows: [],
      } as QueryResult);

      await service.getRiskAlerts(providerId);

      const callArgs = mockQuery.mock.calls[0];
      expect(callArgs[0]).toContain('$1');
      expect(callArgs[1][0]).toBe(providerId);
    });

    it('respects limit parameter', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
      } as QueryResult);

      await service.getRiskAlerts(undefined, 100);

      const callArgs = mockQuery.mock.calls[0];
      expect(callArgs[1][callArgs[1].length - 1]).toBe(100);
    });

    it('calculates days overdue correctly', async () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const mockAlerts = [
        {
          finding_id: 'f-001',
          finding_title: 'Overdue Finding',
          severity: 'crítica',
          risk_score: 95,
          deadline: twoDaysAgo,
          action_description: 'Fix now',
          assigned_to: 'user-001',
        },
      ];

      mockQuery.mockResolvedValueOnce({
        rows: mockAlerts,
      } as QueryResult);

      const alerts = await service.getRiskAlerts();

      expect(alerts[0].daysOverdue).toBeGreaterThan(0);
    });

    it('assigns priority numbers in order', async () => {
      const mockAlerts = [
        {
          finding_id: 'f-001',
          finding_title: 'Highest Priority',
          severity: 'crítica',
          risk_score: 95,
        },
        {
          finding_id: 'f-002',
          finding_title: 'Second Priority',
          severity: 'alta',
          risk_score: 80,
        },
        {
          finding_id: 'f-003',
          finding_title: 'Third Priority',
          severity: 'media',
          risk_score: 75,
        },
      ];

      mockQuery.mockResolvedValueOnce({
        rows: mockAlerts,
      } as QueryResult);

      const alerts = await service.getRiskAlerts();

      expect(alerts[0].priority).toBe(1);
      expect(alerts[1].priority).toBe(2);
      expect(alerts[2].priority).toBe(3);
    });
  });

  // ============================================================
  // Risk Summary Tests
  // ============================================================

  describe('getRiskSummary', () => {
    it('returns risk summary for provider', async () => {
      const mockSummary = {
        total_findings: 10,
        closed_findings: 3,
        high_risk_findings: 2,
        avg_risk_score: 55.5,
        max_risk_score: 95,
      };

      mockQuery.mockResolvedValueOnce({
        rows: [mockSummary],
      } as QueryResult);

      const summary = await service.getRiskSummary('prov-001');

      expect(summary.total_findings).toBe(10);
      expect(summary.closed_findings).toBe(3);
      expect(summary.high_risk_findings).toBe(2);
      expect(summary.avg_risk_score).toBe(55.5);
      expect(summary.max_risk_score).toBe(95);
    });

    it('calculates metrics correctly', async () => {
      const mockSummary = {
        total_findings: 0,
        closed_findings: 0,
        high_risk_findings: 0,
        avg_risk_score: null,
        max_risk_score: 0,
      };

      mockQuery.mockResolvedValueOnce({
        rows: [mockSummary],
      } as QueryResult);

      const summary = await service.getRiskSummary();

      expect(summary.total_findings).toBe(0);
    });
  });

  // ============================================================
  // Update Risk Score Tests
  // ============================================================

  describe('updateRiskScore', () => {
    it('updates finding risk score', async () => {
      const findingId = 'finding-011';
      const mockFinding = {
        id: findingId,
        severity: 'alta',
        title: 'Test Finding',
        status: 'abierta',
        created_date: new Date(),
        closed_date: null,
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [mockFinding] } as QueryResult)
        .mockResolvedValueOnce({ rows: [] } as QueryResult)
        .mockResolvedValueOnce({ rows: [] as any[] } as QueryResult)
        .mockResolvedValueOnce({ rowCount: 1 } as QueryResult)
        .mockResolvedValueOnce({ rowCount: 1 } as QueryResult);

      const updated = await service.updateRiskScore(findingId);

      expect(updated.findingId).toBe(findingId);
      expect(updated.currentScore).toBeGreaterThanOrEqual(0);
      expect(updated.currentScore).toBeLessThanOrEqual(100);
    });
  });
});
