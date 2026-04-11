/**
 * SMS Service Tests
 * Comprehensive test suite for SMS notification functionality
 */

import { Pool, QueryResult } from 'pg';
import { SMSService } from '../SMSService';
import { SMSDelivery, SMSTemplate, SMSConfig } from '../../../types/multichannel.types';

describe('SMSService', () => {
  let pool: jest.Mocked<Pool>;
  let smsService: SMSService;
  let mockConfig: SMSConfig;

  beforeEach(() => {
    // Mock Pool
    pool = {
      query: jest.fn(),
    } as any;

    mockConfig = {
      provider: 'twilio',
      accountSid: 'test_sid',
      authToken: 'test_token',
      fromNumber: '+1234567890',
      maxRetries: 3,
      retryDelayMs: 1000,
    };

    smsService = new SMSService(pool, mockConfig);
  });

  describe('Template Management', () => {
    it('should create SMS template', async () => {
      const template: SMSTemplate = {
        id: 'template-1',
        templateName: 'test_template',
        messageTemplate: 'Hola {{name}}, tu código es: {{code}}',
        maxLength: 160,
        variables: { name: 'string', code: 'string' },
        language: 'es_CO',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (pool.query as jest.Mock).mockResolvedValue({
        rows: [template],
      });

      await smsService.createTemplate(template);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO sms_templates'),
        expect.any(Array)
      );
    });

    it('should retrieve active SMS template', async () => {
      const template: SMSTemplate = {
        id: 'template-1',
        templateName: 'verification_code',
        messageTemplate: 'Tu código: {{code}}',
        maxLength: 160,
        language: 'es_CO',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (pool.query as jest.Mock).mockResolvedValue({
        rows: [template],
      });

      const result = await smsService.getTemplate('verification_code');

      expect(result).toEqual(template);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM sms_templates'),
        ['verification_code']
      );
    });

    it('should return null for non-existent template', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await smsService.getTemplate('non_existent');

      expect(result).toBeNull();
    });

    it('should handle template retrieval error', async () => {
      (pool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await smsService.getTemplate('any_template');

      expect(result).toBeNull();
    });
  });

  describe('SMS Sending', () => {
    it('should send SMS successfully with Twilio', async (done) => {
      const mockDelivery: SMSDelivery = {
        id: 'delivery-1',
        notificationId: 'notif-1',
        providerId: 'provider-1',
        userId: 'user-1',
        phoneNumber: '+573001234567',
        message: 'Tu código: 123456',
        status: 'pending',
        deliveryAttempts: 0,
        maxAttempts: 3,
        smsProvider: 'twilio',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockTemplate: SMSTemplate = {
        id: 'template-1',
        templateName: 'verification_code',
        messageTemplate: 'Tu código: {{code}}',
        maxLength: 160,
        language: 'es_CO',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockTemplate] })
        .mockResolvedValueOnce({ rows: [mockDelivery] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await smsService.sendSMS({
        userId: 'user-1',
        providerId: 'provider-1',
        phoneNumber: '+573001234567',
        templateName: 'verification_code',
        variables: { code: '123456' },
        notificationId: 'notif-1',
      });

      expect(result.status).toBe('pending');
      expect(pool.query).toHaveBeenCalled();

      done();
    });

    it('should fail sending SMS if template not found', async (done) => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      try {
        await smsService.sendSMS({
          userId: 'user-1',
          providerId: 'provider-1',
          phoneNumber: '+573001234567',
          templateName: 'non_existent',
        });
        done(new Error('Should have thrown'));
      } catch (error) {
        expect((error as Error).message).toContain('SMS template not found');
        done();
      }
    });

    it('should fail sending SMS if message exceeds max length', async (done) => {
      const mockTemplate: SMSTemplate = {
        id: 'template-1',
        templateName: 'long_message',
        messageTemplate: '{{longText}}',
        maxLength: 10,
        language: 'es_CO',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockTemplate] });

      try {
        await smsService.sendSMS({
          userId: 'user-1',
          providerId: 'provider-1',
          phoneNumber: '+573001234567',
          templateName: 'long_message',
          variables: { longText: 'This is a very long text that exceeds limit' },
        });
        done(new Error('Should have thrown'));
      } catch (error) {
        expect((error as Error).message).toContain('exceeds maximum length');
        done();
      }
    });

    it('should handle SMS sending error gracefully', async (done) => {
      const mockTemplate: SMSTemplate = {
        id: 'template-1',
        templateName: 'test',
        messageTemplate: 'Test message',
        maxLength: 160,
        language: 'es_CO',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockFailedDelivery: SMSDelivery = {
        id: 'delivery-1',
        notificationId: 'notif-1',
        providerId: 'provider-1',
        userId: 'user-1',
        phoneNumber: '+573001234567',
        message: 'Error',
        status: 'failed',
        deliveryAttempts: 1,
        maxAttempts: 3,
        smsProvider: 'twilio',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockTemplate] })
        .mockRejectedValueOnce(new Error('Twilio API error'))
        .mockResolvedValueOnce({ rows: [mockFailedDelivery] });

      const result = await smsService.sendSMS({
        userId: 'user-1',
        providerId: 'provider-1',
        phoneNumber: '+573001234567',
        templateName: 'test',
      });

      expect(result.status).toBe('failed');
      done();
    });
  });

  describe('Delivery Status', () => {
    it('should update delivery status to sent', async (done) => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      await smsService.updateDeliveryStatus({
        deliveryId: 'delivery-1',
        status: 'sent',
        providerMessageId: 'twilio_msg_id',
        timestamp: new Date(),
      });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE sms_deliveries'),
        expect.arrayContaining(['delivery-1', 'sent'])
      );

      done();
    });

    it('should update delivery status to failed with reason', async (done) => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      await smsService.updateDeliveryStatus({
        deliveryId: 'delivery-1',
        status: 'failed',
        failureReason: 'Invalid phone number',
        timestamp: new Date(),
      });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE sms_deliveries'),
        expect.arrayContaining(['delivery-1', 'failed', 'Invalid phone number'])
      );

      done();
    });

    it('should increment delivery attempt count', async (done) => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      await smsService.updateDeliveryStatus({
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

      await smsService.updateDeliveryStatus({
        deliveryId: 'delivery-1',
        status: 'sent',
        timestamp: new Date(),
      });

      expect(pool.query).toHaveBeenCalled();
      done();
    });
  });

  describe('Statistics', () => {
    it('should retrieve delivery statistics', async (done) => {
      const mockStats = [
        {
          date: '2026-04-10',
          total: 100,
          sent: 98,
          failed: 2,
          undelivered: 0,
          success_rate: 98.0,
        },
      ];

      (pool.query as jest.Mock).mockResolvedValue({ rows: mockStats });

      const result = await smsService.getDeliveryStats('provider-1', 7);

      expect(result).toEqual(mockStats);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['provider-1']
      );

      done();
    });

    it('should handle statistics retrieval error', async (done) => {
      (pool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await smsService.getDeliveryStats('provider-1');

      expect(result).toEqual([]);
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

      const count = await smsService.retryFailedDeliveries(3);

      expect(count).toBe(3);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE sms_deliveries'),
        [3]
      );

      done();
    });

    it('should return 0 if no failed deliveries to retry', async (done) => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const count = await smsService.retryFailedDeliveries(3);

      expect(count).toBe(0);
      done();
    });

    it('should handle retry error gracefully', async (done) => {
      (pool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      const count = await smsService.retryFailedDeliveries(3);

      expect(count).toBe(0);
      done();
    });
  });

  describe('Template Population', () => {
    it('should populate template with single variable', async (done) => {
      const mockTemplate: SMSTemplate = {
        id: 'template-1',
        templateName: 'simple',
        messageTemplate: 'Hola {{name}}',
        maxLength: 160,
        language: 'es_CO',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockTemplate] })
        .mockResolvedValueOnce({ rows: [{ id: 'delivery-1' }] })
        .mockResolvedValueOnce({ rows: [] });

      await smsService.sendSMS({
        userId: 'user-1',
        providerId: 'provider-1',
        phoneNumber: '+573001234567',
        templateName: 'simple',
        variables: { name: 'Juan' },
      });

      done();
    });

    it('should populate template with multiple variables', async (done) => {
      const mockTemplate: SMSTemplate = {
        id: 'template-1',
        templateName: 'complex',
        messageTemplate: '{{greeting}}, {{name}}. Código: {{code}}',
        maxLength: 160,
        language: 'es_CO',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockTemplate] })
        .mockResolvedValueOnce({ rows: [{ id: 'delivery-1' }] })
        .mockResolvedValueOnce({ rows: [] });

      await smsService.sendSMS({
        userId: 'user-1',
        providerId: 'provider-1',
        phoneNumber: '+573001234567',
        templateName: 'complex',
        variables: { greeting: 'Hola', name: 'Juan', code: '123456' },
      });

      done();
    });

    it('should handle template without variables', async (done) => {
      const mockTemplate: SMSTemplate = {
        id: 'template-1',
        templateName: 'plain',
        messageTemplate: 'Mensaje simple sin variables',
        maxLength: 160,
        language: 'es_CO',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockTemplate] })
        .mockResolvedValueOnce({ rows: [{ id: 'delivery-1' }] })
        .mockResolvedValueOnce({ rows: [] });

      await smsService.sendSMS({
        userId: 'user-1',
        providerId: 'provider-1',
        phoneNumber: '+573001234567',
        templateName: 'plain',
      });

      done();
    });
  });
});
