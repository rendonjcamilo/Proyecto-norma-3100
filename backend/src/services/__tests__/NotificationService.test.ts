/**
 * NotificationService Tests
 * Unit tests for notification business logic
 */

import { Pool } from 'pg';
import { NotificationService, Notification, NotificationPreference } from '../NotificationService';
import { WebSocketManager } from '../../socket/websocket-manager';

// Mock the dependencies
jest.mock('pg');
jest.mock('../../socket/websocket-manager');

describe('NotificationService', () => {
  let service: NotificationService;
  let mockPool: any;
  let mockWSManager: any;

  beforeEach(() => {
    mockPool = {
      query: jest.fn(),
    };

    mockWSManager = {
      sendToUser: jest.fn(),
      sendToProvider: jest.fn(),
      sendToAuditors: jest.fn(),
      broadcast: jest.fn(),
    };

    service = new NotificationService(mockPool, mockWSManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create a notification successfully', async () => {
      const mockNotification: Notification = {
        id: 'notif-1',
        type: 'finding.overdue',
        severity: 'high',
        finding_id: 'find-1',
        action_id: undefined,
        provider_id: 'prov-001',
        user_id: 'user-1',
        title: 'Finding Overdue',
        message: 'Finding has exceeded deadline',
        data: { days_overdue: 5 },
        is_read: false,
        is_acknowledged: false,
        created_at: new Date().toISOString(),
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockNotification],
      });

      const result = await service.createNotification(
        'user-1',
        'finding.overdue',
        'high',
        'Finding Overdue',
        'Finding has exceeded deadline',
        'prov-001',
        'find-1',
        undefined,
        { days_overdue: 5 }
      );

      expect(result).toEqual(mockNotification);
      expect(mockPool.query).toHaveBeenCalled();
    });

    it('should handle database errors during creation', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(
        service.createNotification(
          'user-1',
          'finding.overdue',
          'high',
          'Finding Overdue',
          'Finding has exceeded deadline',
          'prov-001'
        )
      ).rejects.toThrow('Database error');
    });

    it('should create notification without optional fields', async () => {
      const mockNotification: Notification = {
        id: 'notif-2',
        type: 'test',
        severity: 'low',
        provider_id: 'prov-001',
        user_id: 'user-1',
        title: 'Test',
        message: 'Test message',
        data: {},
        is_read: false,
        is_acknowledged: false,
        created_at: new Date().toISOString(),
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockNotification],
      });

      const result = await service.createNotification(
        'user-1',
        'test',
        'low',
        'Test',
        'Test message',
        'prov-001'
      );

      expect(result.finding_id).toBeUndefined();
      expect(result.action_id).toBeUndefined();
    });
  });

  describe('sendNotification', () => {
    it('should send notification via WebSocket', async () => {
      const mockNotification: Notification = {
        id: 'notif-1',
        type: 'finding.overdue',
        severity: 'high',
        finding_id: 'find-1',
        provider_id: 'prov-001',
        user_id: 'user-1',
        title: 'Finding Overdue',
        message: 'Finding has exceeded deadline',
        data: {},
        is_read: false,
        is_acknowledged: false,
        created_at: '2026-04-10T10:00:00Z',
      };

      await service.sendNotification('user-1', mockNotification, 'prov-001');

      expect(mockWSManager.sendToUser).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          id: 'notif-1',
          type: 'finding.overdue',
          severity: 'high',
          providerId: 'prov-001',
        })
      );
    });

    it('should handle missing WebSocket manager gracefully', async () => {
      const serviceWithoutWS = new NotificationService(mockPool);

      const mockNotification: Notification = {
        id: 'notif-1',
        type: 'finding.overdue',
        severity: 'high',
        provider_id: 'prov-001',
        user_id: 'user-1',
        title: 'Finding Overdue',
        message: 'Test',
        data: {},
        is_read: false,
        is_acknowledged: false,
        created_at: '2026-04-10T10:00:00Z',
      };

      await expect(
        serviceWithoutWS.sendNotification('user-1', mockNotification, 'prov-001')
      ).resolves.not.toThrow();
    });
  });

  describe('getNotifications', () => {
    it('should retrieve paginated notifications', async () => {
      const mockNotifications: Notification[] = [
        {
          id: 'notif-1',
          type: 'finding.overdue',
          severity: 'high',
          provider_id: 'prov-001',
          user_id: 'user-1',
          title: 'Finding 1',
          message: 'Test 1',
          data: {},
          is_read: false,
          is_acknowledged: false,
          created_at: '2026-04-10T10:00:00Z',
        },
        {
          id: 'notif-2',
          type: 'action.overdue',
          severity: 'medium',
          provider_id: 'prov-001',
          user_id: 'user-1',
          title: 'Finding 2',
          message: 'Test 2',
          data: {},
          is_read: true,
          is_acknowledged: false,
          created_at: '2026-04-10T09:00:00Z',
        },
      ];

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '2' }] })
        .mockResolvedValueOnce({ rows: mockNotifications });

      const result = await service.getNotifications('user-1', 20, 0);

      expect(result.notifications).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('should filter notifications by severity', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'notif-1',
              severity: 'high',
              type: 'finding.overdue',
              provider_id: 'prov-001',
              user_id: 'user-1',
              title: 'Test',
              message: 'Test',
              data: {},
              is_read: false,
              is_acknowledged: false,
              created_at: '2026-04-10T10:00:00Z',
            },
          ],
        });

      const result = await service.getNotifications('user-1', 20, 0, {
        severity: 'high',
      });

      expect(result.notifications).toHaveLength(1);
      expect(result.notifications[0].severity).toBe('high');
    });

    it('should filter notifications by read status', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'notif-2',
              type: 'action.overdue',
              severity: 'medium',
              provider_id: 'prov-001',
              user_id: 'user-1',
              title: 'Test',
              message: 'Test',
              data: {},
              is_read: true,
              is_acknowledged: false,
              created_at: '2026-04-10T09:00:00Z',
            },
          ],
        });

      const result = await service.getNotifications('user-1', 20, 0, {
        isRead: true,
      });

      expect(result.notifications[0].is_read).toBe(true);
    });

    it('should handle database errors', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockRejectedValueOnce(new Error('Query failed'));

      await expect(
        service.getNotifications('user-1', 20, 0)
      ).rejects.toThrow('Query failed');
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await service.markAsRead('notif-1', 'user-1');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE notifications'),
        ['notif-1', 'user-1']
      );
    });

    it('should handle errors when marking as read', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Update failed'));

      await expect(service.markAsRead('notif-1', 'user-1')).rejects.toThrow(
        'Update failed'
      );
    });
  });

  describe('acknowledgeNotification', () => {
    it('should acknowledge notification with user ID', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await service.acknowledgeNotification('notif-1', 'user-1');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE notifications'),
        expect.arrayContaining(['user-1', 'notif-1', 'user-1'])
      );
    });

    it('should acknowledge notification with custom acknowledger', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await service.acknowledgeNotification('notif-1', 'user-1', 'auditor-1');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE notifications'),
        expect.arrayContaining(['auditor-1', 'notif-1', 'user-1'])
      );
    });

    it('should handle errors when acknowledging', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Acknowledge failed'));

      await expect(
        service.acknowledgeNotification('notif-1', 'user-1')
      ).rejects.toThrow('Acknowledge failed');
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread notification count', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ count: '5' }],
      });

      const count = await service.getUnreadCount('user-1');

      expect(count).toBe(5);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('COUNT(*)'),
        ['user-1']
      );
    });

    it('should return 0 on database error', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Count failed'));

      const count = await service.getUnreadCount('user-1');

      expect(count).toBe(0);
    });
  });

  describe('getPreferences', () => {
    it('should retrieve user preferences', async () => {
      const mockPreference: NotificationPreference = {
        id: 'pref-1',
        user_id: 'user-1',
        enable_overdue: true,
        enable_high_risk: true,
        enable_verification: false,
        min_severity: 'medium',
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockPreference],
      });

      const result = await service.getPreferences('user-1');

      expect(result).toEqual(mockPreference);
    });

    it('should return null if preferences not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await service.getPreferences('user-1');

      expect(result).toBeNull();
    });

    it('should return null on database error', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Query failed'));

      const result = await service.getPreferences('user-1');

      expect(result).toBeNull();
    });
  });

  describe('updatePreferences', () => {
    it('should update existing preferences', async () => {
      const mockUpdatedPref: NotificationPreference = {
        id: 'pref-1',
        user_id: 'user-1',
        enable_overdue: true,
        enable_high_risk: false,
        enable_verification: true,
        min_severity: 'high',
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockUpdatedPref],
      });

      const result = await service.updatePreferences('user-1', {
        enable_high_risk: false,
        min_severity: 'high',
      });

      expect(result).toEqual(mockUpdatedPref);
      expect(mockPool.query).toHaveBeenCalledTimes(1);
    });

    it('should create new preferences if not exist', async () => {
      const mockNewPref: NotificationPreference = {
        id: 'pref-new',
        user_id: 'user-2',
        enable_overdue: true,
        enable_high_risk: true,
        enable_verification: true,
        min_severity: 'medium',
      };

      mockPool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [mockNewPref],
        });

      const result = await service.updatePreferences('user-2', {
        min_severity: 'medium',
      });

      expect(result).toEqual(mockNewPref);
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('should handle update errors', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Update failed'));

      await expect(
        service.updatePreferences('user-1', { enable_overdue: false })
      ).rejects.toThrow('Update failed');
    });
  });
});
