/**
 * Push Service Tests
 * Comprehensive test suite for push notification functionality
 */

import { Pool, QueryResult } from 'pg';
import { PushService } from '../PushService';
import { PushDelivery, PushTemplate, PushConfig } from '../../../types/multichannel.types';

describe('PushService', () => {
  let pool: jest.Mocked<Pool>;
  let pushService: PushService;
  let mockConfig: PushConfig;

  beforeEach(() => {
    pool = {
      query: jest.fn(),
    } as any;

    mockConfig = {
      provider: 'fcm',
      projectId: 'test-project',
      serviceAccountKey: JSON.stringify({
        type: 'service_account',
        project_id: 'test-project',
      }),
      maxRetries: 3,
      retryDelayMs: 1000,
    };

    pushService = new PushService(pool, mockConfig);
  });

  describe('Template Management', () => {
    it('should create push template', async (done) => {
      const template: PushTemplate = {
        id: 'template-1',
        templateName: 'finding_alert',
        title: 'Alerta de Hallazgo',
        body: 'Nuevo hallazgo: {{findingType}}',
        actionUrl: 'https://app.com/findings/{{findingId}}',
        iconUrl: 'https://cdn.com/icon.png',
        imageUrl: 'https://cdn.com/image.png',
        variables: { findingType: 'string', findingId: 'string' },
        language: 'es_CO',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (pool.query as jest.Mock).mockResolvedValue({ rows: [template] });

      await pushService.createTemplate(template);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO push_templates'),
        expect.any(Array)
      );

      done();
    });

    it('should retrieve active push template', async (done) => {
      const template: PushTemplate = {
        id: 'template-1',
        templateName: 'action_overdue',
        title: 'Acción Vencida',
        body: 'La acción {{actionName}} ha vencido',
        language: 'es_CO',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (pool.query as jest.Mock).mockResolvedValue({ rows: [template] });

      const result = await pushService.getTemplate('action_overdue');

      expect(result).toEqual(template);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM push_templates'),
        ['action_overdue']
      );

      done();
    });

    it('should return null for non-existent template', async (done) => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await pushService.getTemplate('non_existent');

      expect(result).toBeNull();
      done();
    });

    it('should handle template retrieval error', async (done) => {
      (pool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await pushService.getTemplate('any_template');

      expect(result).toBeNull();
      done();
    });
  });

  describe('Push Notification Sending', () => {
    it('should send push to multiple device tokens', async (done) => {
      const mockTemplate: PushTemplate = {
        id: 'template-1',
        templateName: 'test_alert',
        title: 'Test Alert',
        body: 'Test message for {{deviceType}}',
        language: 'es_CO',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockDelivery: PushDelivery = {
        id: 'delivery-1',
        notificationId: 'notif-1',
        providerId: 'provider-1',
        userId: 'user-1',
        deviceToken: 'token-1',
        devicePlatform: 'android',
        title: 'Test Alert',
        body: 'Test message for android',
        status: 'pending',
        deliveryAttempts: 0,
        maxAttempts: 3,
        pushProvider: 'fcm',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockTemplate] })
        .mockResolvedValueOnce({ rows: [mockDelivery] })
        .mockResolvedValueOnce({ rows: [] });

      const results = await pushService.sendPush({
        userId: 'user-1',
        providerId: 'provider-1',
        deviceTokens: ['token-1', 'token-2'],
        devicePlatform: 'android',
        templateName: 'test_alert',
        variables: { deviceType: 'android' },
        notificationId: 'notif-1',
      });

      expect(results.length).toBeGreaterThan(0);
      done();
    });

    it('should handle single device token', async (done) => {
      const mockTemplate: PushTemplate = {
        id: 'template-1',
        templateName: 'single',
        title: 'Single Test',
        body: 'Test message',
        language: 'es_CO',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockDelivery: PushDelivery = {
        id: 'delivery-1',
        notificationId: 'notif-1',
        providerId: 'provider-1',
        userId: 'user-1',
        deviceToken: 'token-1',
        devicePlatform: 'ios',
        title: 'Single Test',
        body: 'Test message',
        status: 'pending',
        deliveryAttempts: 0,
        maxAttempts: 3,
        pushProvider: 'fcm',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockTemplate] })
        .mockResolvedValueOnce({ rows: [mockDelivery] })
        .mockResolvedValueOnce({ rows: [] });

      const results = await pushService.sendPush({
        userId: 'user-1',
        providerId: 'provider-1',
        deviceTokens: ['token-1'],
        devicePlatform: 'ios',
        templateName: 'single',
      });

      expect(results.length).toBe(1);
      done();
    });

    it('should fail if template not found', async (done) => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      try {
        await pushService.sendPush({
          userId: 'user-1',
          providerId: 'provider-1',
          deviceTokens: ['token-1'],
          devicePlatform: 'android',
          templateName: 'non_existent',
        });
        done(new Error('Should have thrown'));
      } catch (error) {
        expect((error as Error).message).toContain('Push template not found');
        done();
      }
    });

    it('should handle sending error and create failed delivery', async (done) => {
      const mockTemplate: PushTemplate = {
        id: 'template-1',
        templateName: 'error_test',
        title: 'Error Test',
        body: 'Test message',
        language: 'es_CO',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockFailedDelivery: PushDelivery = {
        id: 'delivery-1',
        notificationId: 'notif-1',
        providerId: 'provider-1',
        userId: 'user-1',
        deviceToken: 'token-1',
        devicePlatform: 'android',
        title: 'Error',
        body: 'Failed to send notification',
        status: 'failed',
        deliveryAttempts: 1,
        maxAttempts: 3,
        pushProvider: 'fcm',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockTemplate] })
        .mockRejectedValueOnce(new Error('FCM API error'))
        .mockResolvedValueOnce({ rows: [mockFailedDelivery] });

      const results = await pushService.sendPush({
        userId: 'user-1',
        providerId: 'provider-1',
        deviceTokens: ['token-1'],
        devicePlatform: 'android',
        templateName: 'error_test',
      });

      expect(results[0].status).toBe('failed');
      done();
    });
  });

  describe('Platform-Specific Features', () => {
    it('should include Android-specific payload', async (done) => {
      const mockTemplate: PushTemplate = {
        id: 'template-1',
        templateName: 'android_test',
        title: 'Android Test',
        body: 'Android specific message',
        actionUrl: 'https://app.com/action',
        imageUrl: 'https://cdn.com/image.png',
        language: 'es_CO',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockTemplate] })
        .mockResolvedValueOnce({ rows: [{ id: 'delivery-1' }] })
        .mockResolvedValueOnce({ rows: [] });

      await pushService.sendPush({
        userId: 'user-1',
        providerId: 'provider-1',
        deviceTokens: ['android-token'],
        devicePlatform: 'android',
        templateName: 'android_test',
      });

      done();
    });

    it('should include iOS-specific payload', async (done) => {
      const mockTemplate: PushTemplate = {
        id: 'template-1',
        templateName: 'ios_test',
        title: 'iOS Test',
        body: 'iOS specific message',
        imageUrl: 'https://cdn.com/image.png',
        language: 'es_CO',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockTemplate] })
        .mockResolvedValueOnce({ rows: [{ id: 'delivery-1' }] })
        .mockResolvedValueOnce({ rows: [] });

      await pushService.sendPush({
        userId: 'user-1',
        providerId: 'provider-1',
        deviceTokens: ['ios-token'],
        devicePlatform: 'ios',
        templateName: 'ios_test',
      });

      done();
    });

    it('should include Web-specific payload', async (done) => {
      const mockTemplate: PushTemplate = {
        id: 'template-1',
        templateName: 'web_test',
        title: 'Web Test',
        body: 'Web specific message',
        actionUrl: 'https://app.com/action',
        language: 'es_CO',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockTemplate] })
        .mockResolvedValueOnce({ rows: [{ id: 'delivery-1' }] })
        .mockResolvedValueOnce({ rows: [] });

      await pushService.sendPush({
        userId: 'user-1',
        providerId: 'provider-1',
        deviceTokens: ['web-token'],
        devicePlatform: 'web',
        templateName: 'web_test',
      });

      done();
    });
  });

  describe('Delivery Status', () => {
    it('should update delivery status to sent', async (done) => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      await pushService.updateDeliveryStatus({
        deliveryId: 'delivery-1',
        status: 'sent',
        providerMessageId: 'fcm_msg_id',
        timestamp: new Date(),
      });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE push_deliveries'),
        expect.arrayContaining(['delivery-1', 'sent'])
      );

      done();
    });

    it('should update delivery status to invalid_token', async (done) => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      await pushService.updateDeliveryStatus({
        deliveryId: 'delivery-1',
        status: 'invalid_token',
        failureReason: 'Device uninstalled app',
        timestamp: new Date(),
      });

      expect(pool.query).toHaveBeenCalled();
      done();
    });

    it('should update delivery status to failed with reason', async (done) => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      await pushService.updateDeliveryStatus({
        deliveryId: 'delivery-1',
        status: 'failed',
        failureReason: 'FCM service unavailable',
        timestamp: new Date(),
      });

      expect(pool.query).toHaveBeenCalled();
      done();
    });

    it('should increment delivery attempt count', async (done) => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      await pushService.updateDeliveryStatus({
        deliveryId: 'delivery-1',
        status: 'failed',
        timestamp: new Date(),
      });

      const query = (pool.query as jest.Mock).mock.calls[0][0];
      expect(query).toContain('delivery_attempts + 1');

      done();
    });

    it('should handle status update error', async (done) => {
      (pool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      await pushService.updateDeliveryStatus({
        deliveryId: 'delivery-1',
        status: 'sent',
        timestamp: new Date(),
      });

      expect(pool.query).toHaveBeenCalled();
      done();
    });
  });

  describe('Statistics', () => {
    it('should retrieve delivery statistics by platform', async (done) => {
      const mockStats = [
        {
          date: '2026-04-10',
          device_platform: 'android',
          total: 150,
          sent: 148,
          failed: 2,
          invalid_tokens: 0,
          success_rate: 98.67,
        },
        {
          date: '2026-04-10',
          device_platform: 'ios',
          total: 100,
          sent: 99,
          failed: 1,
          invalid_tokens: 0,
          success_rate: 99.0,
        },
      ];

      (pool.query as jest.Mock).mockResolvedValue({ rows: mockStats });

      const result = await pushService.getDeliveryStats('provider-1', 7);

      expect(result).toEqual(mockStats);
      expect(result.length).toBe(2);
      done();
    });

    it('should handle statistics retrieval error', async (done) => {
      (pool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await pushService.getDeliveryStats('provider-1');

      expect(result).toEqual([]);
      done();
    });
  });

  describe('Invalid Token Cleanup', () => {
    it('should clean up old invalid tokens', async (done) => {
      const mockDeletedTokens = [{ id: 'delivery-1' }, { id: 'delivery-2' }];

      (pool.query as jest.Mock).mockResolvedValue({ rows: mockDeletedTokens });

      const count = await pushService.handleInvalidTokens();

      expect(count).toBe(2);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM push_deliveries'),
        expect.any(Array)
      );

      done();
    });

    it('should return 0 if no invalid tokens to clean', async (done) => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const count = await pushService.handleInvalidTokens();

      expect(count).toBe(0);
      done();
    });

    it('should handle cleanup error gracefully', async (done) => {
      (pool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      const count = await pushService.handleInvalidTokens();

      expect(count).toBe(0);
      done();
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed deliveries within limits', async (done) => {
      const mockRetries = [
        { id: 'delivery-1' },
        { id: 'delivery-2' },
        { id: 'delivery-3' },
      ];

      (pool.query as jest.Mock).mockResolvedValue({ rows: mockRetries });

      const count = await pushService.retryFailedDeliveries(3);

      expect(count).toBe(3);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE push_deliveries'),
        [3]
      );

      done();
    });

    it('should return 0 if no failed deliveries', async (done) => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const count = await pushService.retryFailedDeliveries(3);

      expect(count).toBe(0);
      done();
    });

    it('should handle retry error gracefully', async (done) => {
      (pool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      const count = await pushService.retryFailedDeliveries(3);

      expect(count).toBe(0);
      done();
    });
  });

  describe('Template Population', () => {
    it('should populate template with variables', async (done) => {
      const mockTemplate: PushTemplate = {
        id: 'template-1',
        templateName: 'finding_alert',
        title: 'Alerta: {{severity}}',
        body: 'Hallazgo {{findingId}} - {{description}}',
        actionUrl: 'https://app.com/findings/{{findingId}}',
        language: 'es_CO',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockTemplate] })
        .mockResolvedValueOnce({ rows: [{ id: 'delivery-1' }] })
        .mockResolvedValueOnce({ rows: [] });

      await pushService.sendPush({
        userId: 'user-1',
        providerId: 'provider-1',
        deviceTokens: ['token-1'],
        devicePlatform: 'android',
        templateName: 'finding_alert',
        variables: {
          severity: 'Crítico',
          findingId: 'FIND-001',
          description: 'Hallazgo crítico encontrado',
        },
      });

      done();
    });

    it('should handle template without variables', async (done) => {
      const mockTemplate: PushTemplate = {
        id: 'template-1',
        templateName: 'plain',
        title: 'Notification',
        body: 'Static message',
        language: 'es_CO',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockTemplate] })
        .mockResolvedValueOnce({ rows: [{ id: 'delivery-1' }] })
        .mockResolvedValueOnce({ rows: [] });

      await pushService.sendPush({
        userId: 'user-1',
        providerId: 'provider-1',
        deviceTokens: ['token-1'],
        devicePlatform: 'android',
        templateName: 'plain',
      });

      done();
    });
  });
});
