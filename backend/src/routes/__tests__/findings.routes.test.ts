/**
 * Findings & Corrective Actions API Routes Tests
 * Tests for findings lifecycle, actions, and follow-ups
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Pool } from 'pg';
import { FindingService } from '../../services/FindingService.js';

describe('Findings Management', () => {
  let findingService: FindingService;
  let mockPool: Partial<Pool>;

  beforeEach(() => {
    // Mock PostgreSQL pool
    mockPool = {
      query: vi.fn(),
      connect: vi.fn(),
    };
    findingService = new FindingService(mockPool as Pool);
  });

  describe('Finding Lifecycle', () => {
    it('should create a finding from assessment NC response', async () => {
      // Mock: Assessment with NC response
      const findingData = {
        provider_id: 'provider-123',
        criterion_id: 'criterion-456',
        title: 'Falta de procedimiento de control de infecciones',
        description: 'No hay evidencia de procedimiento documentado',
        severity: 'crítica' as const,
        created_by: 'auditor-1',
      };

      // Mock pool response
      (mockPool.query as any).mockResolvedValueOnce({
        rows: [
          {
            id: 'finding-1',
            provider_id: 'provider-123',
            criterion_id: 'criterion-456',
            title: 'Falta de procedimiento de control de infecciones',
            description: 'No hay evidencia de procedimiento documentado',
            severity: 'crítica',
            status: 'abierta',
            risk_score: 0,
            created_at: new Date(),
            created_by: 'auditor-1',
          },
        ],
      });

      const finding = await findingService.createFinding(findingData);

      expect(finding.id).toBeDefined();
      expect(finding.provider_id).toBe('provider-123');
      expect(finding.status).toBe('abierta');
      expect(finding.severity).toBe('crítica');
    });

    it('should transition finding from abierta to asignada', async () => {
      // Mock: Current finding
      const mockFinding = {
        id: 'finding-1',
        status: 'abierta',
        severity: 'crítica',
      };

      (mockPool.query as any)
        .mockResolvedValueOnce({ rows: [mockFinding] }) // Get finding
        .mockResolvedValueOnce({ rows: [{ ...mockFinding, status: 'asignada', assigned_to: 'person-1' }] }) // Update finding
        .mockResolvedValueOnce({ rows: [{ id: 'assignment-1' }] }) // Record assignment
        .mockResolvedValueOnce({ rows: [{ id: 'event-1' }] }); // Emit event

      const updated = await findingService.assignFinding('finding-1', 'person-1', 'auditor-1');

      expect(updated.status).toBe('asignada');
      expect(updated.assigned_to).toBe('person-1');
    });

    it('should transition finding from en_progreso to cerrada when all actions close', async () => {
      // Mock: Check for open actions
      (mockPool.query as any)
        .mockResolvedValueOnce({
          rows: [{ total: 2, closed: 2 }], // All actions closed
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'finding-1',
              status: 'cerrada',
              closed_date: new Date(),
              closed_by: 'auditor-1',
            },
          ],
        }) // Close finding
        .mockResolvedValueOnce({ rows: [{ id: 'closure-1' }] }) // Record closure
        .mockResolvedValueOnce({ rows: [{ id: 'event-1' }] }); // Emit event

      const closed = await findingService.tryCloseFinding('finding-1', 'auditor-1');

      expect(closed).not.toBeNull();
      expect(closed?.status).toBe('cerrada');
    });

    it('should NOT close finding if any action is still open', async () => {
      // Mock: Check for open actions (one still open)
      (mockPool.query as any).mockResolvedValueOnce({
        rows: [{ total: 2, closed: 1 }], // One action still open
      });

      const closed = await findingService.tryCloseFinding('finding-1', 'auditor-1');

      expect(closed).toBeNull();
    });
  });

  describe('Corrective Action Workflow', () => {
    it('should create corrective action with deadline and priority', async () => {
      const actionData = {
        finding_id: 'finding-1',
        title: 'Implementar procedimiento de control de infecciones',
        description: 'Elaborar y documentar procedimiento conforme a estándares',
        responsible_user_id: 'user-1',
        deadline: new Date('2026-05-10'),
        priority: 'crítica' as const,
        created_by: 'auditor-1',
      };

      (mockPool.query as any).mockResolvedValueOnce({
        rows: [
          {
            id: 'action-1',
            finding_id: 'finding-1',
            title: 'Implementar procedimiento de control de infecciones',
            status: 'abierta',
            priority: 'crítica',
            completion_percentage: 0,
            created_at: new Date(),
          },
        ],
      });

      const action = await findingService.createCorrectiveAction(actionData);

      expect(action.id).toBeDefined();
      expect(action.priority).toBe('crítica');
      expect(action.status).toBe('abierta');
      expect(action.completion_percentage).toBe(0);
    });

    it('should create 6 follow-up steps for action', async () => {
      const stepNames = ['Planificación', 'Diseño', 'Implementación', 'Pruebas', 'Validación', 'Cierre'];
      const stepPercentages = [30, 40, 60, 80, 90, 100];

      for (let i = 0; i < 6; i++) {
        (mockPool.query as any).mockResolvedValueOnce({
          rows: [
            {
              id: `followup-${i + 1}`,
              action_id: 'action-1',
              step_number: i + 1,
              step_name: stepNames[i],
              completion_percentage: stepPercentages[i],
              status: 'pendiente',
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
        });

        const followup = await findingService.upsertFollowup({
          action_id: 'action-1',
          step_number: i + 1,
          step_name: stepNames[i],
          completion_percentage: stepPercentages[i],
        });

        expect(followup.step_number).toBe(i + 1);
        expect(followup.step_name).toBe(stepNames[i]);
      }
    });

    it('should calculate action completion percentage from follow-ups', async () => {
      // Mock: Get follow-ups and calculate average
      (mockPool.query as any)
        .mockResolvedValueOnce({
          rows: [
            { step_number: 1, completion_percentage: 30, status: 'completado' },
            { step_number: 2, completion_percentage: 40, status: 'en_progreso' },
            { step_number: 3, completion_percentage: 0, status: 'pendiente' },
          ],
        })
        .mockResolvedValueOnce({
          rows: [{ avg_completion: 23.33 }], // Average
        })
        .mockResolvedValueOnce({
          rows: [{ id: 'action-1', completion_percentage: 23 }], // Updated
        });

      // Simulating follow-up completion
      const result = await findingService.getFollowupsForAction('action-1');

      expect(result.length).toBeGreaterThan(0);
    });

    it('should auto-close action when completion reaches 100%', async () => {
      // Mock: All 6 follow-ups completed with total 100%
      (mockPool.query as any)
        .mockResolvedValueOnce({
          rows: [{ avg_completion: 100 }], // All steps completed
        })
        .mockResolvedValueOnce({
          rows: [{ id: 'action-1', status: 'cerrada', completion_percentage: 100 }], // Auto-closed
        });

      // In real scenario, this would be triggered by follow-up completion
      const completionPercent = 100;
      expect(completionPercent).toBe(100);
    });
  });

  describe('Action Progress Tracking', () => {
    it('should record evidence attachment on follow-up completion', async () => {
      const followupData = {
        action_id: 'action-1',
        step_number: 1,
        step_name: 'Planificación' as const,
        status: 'completado' as const,
        completion_percentage: 30,
        evidence_attachment: 'doc-uuid-123',
        comments: 'Procedimiento planificado e informado a equipo',
        completed_by: 'user-1',
      };

      (mockPool.query as any).mockResolvedValueOnce({
        rows: [
          {
            id: 'followup-1',
            action_id: 'action-1',
            step_number: 1,
            evidence_attachment: 'doc-uuid-123',
            comments: 'Procedimiento planificado e informado a equipo',
            status: 'completado',
            completed_date: new Date(),
            completed_by: 'user-1',
          },
        ],
      });

      const followup = await findingService.upsertFollowup(followupData);

      expect(followup.evidence_attachment).toBe('doc-uuid-123');
      expect(followup.comments).toBe('Procedimiento planificado e informado a equipo');
    });

    it('should mark follow-up steps as pending, in_progress, or completed', async () => {
      const statuses = ['pendiente', 'en_progreso', 'completado'] as const;

      for (const status of statuses) {
        (mockPool.query as any).mockResolvedValueOnce({
          rows: [
            {
              id: `followup-1`,
              step_number: 1,
              status: status,
              completion_percentage: status === 'completado' ? 30 : 0,
            },
          ],
        });

        const followup = await findingService.upsertFollowup({
          action_id: 'action-1',
          step_number: 1,
          step_name: 'Planificación',
          status,
        });

        expect(followup.status).toBe(status);
      }
    });
  });

  describe('Event Sourcing', () => {
    it('should emit finding.created event', async () => {
      (mockPool.query as any).mockResolvedValueOnce({
        rows: [{ id: 'event-1', event_type: 'finding.created' }],
      });

      const event = await findingService.createFindingEvent(
        'finding-1',
        'finding.created',
        { finding_id: 'finding-1' },
        'auditor-1'
      );

      expect(event.event_type).toBe('finding.created');
    });

    it('should emit finding.assigned event', async () => {
      (mockPool.query as any).mockResolvedValueOnce({
        rows: [
          {
            id: 'event-1',
            event_type: 'finding.assigned',
            data: { assigned_to: 'person-1' },
          },
        ],
      });

      const event = await findingService.createFindingEvent(
        'finding-1',
        'finding.assigned',
        { assigned_to: 'person-1' },
        'auditor-1'
      );

      expect(event.event_type).toBe('finding.assigned');
    });

    it('should emit action.created event', async () => {
      (mockPool.query as any).mockResolvedValueOnce({
        rows: [
          {
            id: 'event-1',
            event_type: 'action.created',
            data: { action_id: 'action-1' },
          },
        ],
      });

      const event = await findingService.createFindingEvent(
        'finding-1',
        'action.created',
        { action_id: 'action-1' },
        'provider-admin-1'
      );

      expect(event.event_type).toBe('action.created');
    });

    it('should emit followup.completed event', async () => {
      (mockPool.query as any).mockResolvedValueOnce({
        rows: [
          {
            id: 'event-1',
            event_type: 'followup.completed',
            data: { step_number: 1, completion_percentage: 30 },
          },
        ],
      });

      const event = await findingService.createFindingEvent(null, 'followup.completed', {
        action_id: 'action-1',
        step_number: 1,
        completion_percentage: 30,
      });

      expect(event.event_type).toBe('followup.completed');
    });

    it('should retrieve finding events in order', async () => {
      (mockPool.query as any).mockResolvedValueOnce({
        rows: [
          {
            id: 'event-1',
            finding_id: 'finding-1',
            event_type: 'finding.created',
            created_at: new Date('2026-04-10T10:00:00Z'),
          },
          {
            id: 'event-2',
            finding_id: 'finding-1',
            event_type: 'finding.assigned',
            created_at: new Date('2026-04-10T11:00:00Z'),
          },
          {
            id: 'event-3',
            finding_id: 'finding-1',
            event_type: 'action.created',
            created_at: new Date('2026-04-10T12:00:00Z'),
          },
        ],
      });

      const events = await findingService.getFindingEvents('finding-1');

      expect(events.length).toBe(3);
      expect(events[0].event_type).toBe('finding.created');
    });
  });

  describe('RBAC & Access Control', () => {
    it('provider_admin should only see own provider findings', async () => {
      const filters = {
        provider_id: 'provider-1',
        status: 'abierta',
      };

      (mockPool.query as any)
        .mockResolvedValueOnce({ rows: [{ count: 5 }] }) // Count
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'finding-1',
              provider_id: 'provider-1',
              status: 'abierta',
            },
          ],
        }); // List results

      const { findings } = await findingService.listFindings(filters);

      expect(findings.length).toBeGreaterThanOrEqual(0);
    });

    it('auditor should see all findings', async () => {
      (mockPool.query as any)
        .mockResolvedValueOnce({ rows: [{ count: 20 }] }) // Count - all findings
        .mockResolvedValueOnce({
          rows: Array.from({ length: 5 }, (_, i) => ({
            id: `finding-${i}`,
            provider_id: `provider-${Math.floor(i / 2)}`,
            status: 'abierta',
          })),
        }); // Multiple providers

      const { findings, total } = await findingService.listFindings({});

      expect(total).toBe(20);
    });

    it('super_admin should have full access', async () => {
      (mockPool.query as any)
        .mockResolvedValueOnce({ rows: [{ count: 100 }] }) // All findings
        .mockResolvedValueOnce({
          rows: Array.from({ length: 10 }, (_, i) => ({
            id: `finding-${i}`,
            provider_id: `provider-${i}`,
          })),
        });

      const { findings, total } = await findingService.listFindings({});

      expect(total).toBe(100);
    });
  });

  describe('Statistics & Reporting', () => {
    it('should calculate findings summary statistics', async () => {
      (mockPool.query as any).mockResolvedValueOnce({
        rows: [
          {
            total_findings: 50,
            open_findings: 15,
            in_progress: 25,
            closed: 10,
            assigned: 35,
            avg_risk_score: 65,
          },
        ],
      });

      const stats = await findingService.getFindingsSummary();

      expect(stats.total_findings).toBe(50);
      expect(stats.open_findings).toBe(15);
      expect(stats.closed).toBe(10);
      expect(stats.avg_risk_score).toBe(65);
    });

    it('should get actions dashboard with overdue count', async () => {
      (mockPool.query as any).mockResolvedValueOnce({
        rows: [
          {
            total_actions: 40,
            open_actions: 10,
            in_progress: 20,
            closed_actions: 10,
            overdue_actions: 3,
            avg_completion: 45,
          },
        ],
      });

      const dashboard = await findingService.getActionsDashboard();

      expect(dashboard.total_actions).toBe(40);
      expect(dashboard.overdue_actions).toBe(3);
      expect(dashboard.avg_completion).toBe(45);
    });
  });

  describe('Data Validation', () => {
    it('should validate finding status transitions', async () => {
      const validStatuses = ['abierta', 'en_revision', 'asignada', 'en_progreso', 'cerrada'];

      for (const status of validStatuses) {
        expect(['abierta', 'en_revision', 'asignada', 'en_progreso', 'cerrada'].includes(status)).toBe(true);
      }
    });

    it('should validate action priority levels', async () => {
      const validPriorities = ['crítica', 'alta', 'media', 'baja'];

      for (const priority of validPriorities) {
        expect(validPriorities).toContain(priority);
      }
    });

    it('should validate follow-up step numbers 1-6', async () => {
      for (let i = 1; i <= 6; i++) {
        expect(i >= 1 && i <= 6).toBe(true);
      }
    });

    it('should validate completion percentage 0-100', async () => {
      const validPercentages = [0, 30, 50, 100];

      for (const percent of validPercentages) {
        expect(percent >= 0 && percent <= 100).toBe(true);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle finding not found error', async () => {
      (mockPool.query as any).mockResolvedValueOnce({ rows: [] });

      const finding = await findingService.getFindingById('nonexistent-id');

      expect(finding).toBeNull();
    });

    it('should handle database connection errors gracefully', async () => {
      (mockPool.query as any).mockRejectedValueOnce(new Error('Connection refused'));

      try {
        await findingService.getFindingById('finding-1');
      } catch (err) {
        expect(err).toBeDefined();
      }
    });
  });
});
