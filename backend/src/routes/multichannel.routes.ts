/**
 * Multi-Channel Notification Routes
 * Email, SMS, and Push notification management endpoints
 */

import express, { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { logger } from '../utils/logger.js';
import { EmailService } from '../services/email/EmailService.js';
import { SMSService } from '../services/sms/SMSService.js';
import { PushService } from '../services/push/PushService.js';
import { NotificationQueueService } from '../queues/NotificationQueueService.js';
import {
  SendEmailRequest,
  SendSMSRequest,
  SendPushRequest,
  EmailConfig,
  SMSConfig,
  PushConfig,
} from '../types/multichannel.types.js';

export function createMultiChannelRouter(pool: Pool): Router {
  const router = express.Router();

  // Initialize services
  const emailConfig: EmailConfig = {
    provider: (process.env.EMAIL_PROVIDER || 'mailgun') as any,
    apiKey: process.env.EMAIL_API_KEY || '',
    apiSecret: process.env.EMAIL_API_SECRET,
    fromEmail: process.env.EMAIL_FROM_ADDRESS || 'noreply@norma3100.com',
    fromName: process.env.EMAIL_FROM_NAME || 'Norma 3100',
    maxRetries: parseInt(process.env.EMAIL_MAX_RETRIES || '3'),
    retryDelayMs: parseInt(process.env.EMAIL_RETRY_DELAY || '1000'),
  };

  const smsConfig: SMSConfig = {
    provider: (process.env.SMS_PROVIDER || 'twilio') as any,
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromNumber: process.env.SMS_FROM_NUMBER || '',
    maxRetries: parseInt(process.env.SMS_MAX_RETRIES || '3'),
    retryDelayMs: parseInt(process.env.SMS_RETRY_DELAY || '1000'),
    region: process.env.AWS_REGION,
  };

  const pushConfig: PushConfig = {
    provider: (process.env.PUSH_PROVIDER || 'fcm') as any,
    projectId: process.env.FIREBASE_PROJECT_ID,
    serviceAccountKey: process.env.FIREBASE_SERVICE_ACCOUNT,
    teamId: process.env.APNS_TEAM_ID,
    keyId: process.env.APNS_KEY_ID,
    bundleId: process.env.APNS_BUNDLE_ID,
    maxRetries: parseInt(process.env.PUSH_MAX_RETRIES || '3'),
    retryDelayMs: parseInt(process.env.PUSH_RETRY_DELAY || '1000'),
  };

  const emailService = new EmailService(pool, emailConfig);
  const smsService = new SMSService(pool, smsConfig);
  const pushService = new PushService(pool, pushConfig);
  const queueService = new NotificationQueueService(pool);

  // Set service dependencies
  queueService.setServiceDependencies(emailService, smsService, pushService);

  // Start queue processing
  queueService.startProcessing(5000);

  /**
   * POST /api/multichannel/email
   * Send email notification
   */
  router.post('/email', async (req: Request, res: Response) => {
    try {
      const request: SendEmailRequest = req.body;

      // Validate required fields
      if (!request.email || !request.templateName || !request.userId) {
        return res.status(400).json({
          error: 'Missing required fields: email, templateName, userId',
        });
      }

      const delivery = await emailService.sendEmail(request);

      logger.info('Email sent', {
        deliveryId: delivery.id,
        email: request.email,
        template: request.templateName,
      });

      res.json(delivery);
    } catch (error) {
      logger.error('Failed to send email', {
        error: (error as Error).message,
      });
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * POST /api/multichannel/sms
   * Send SMS notification
   */
  router.post('/sms', async (req: Request, res: Response) => {
    try {
      const request: SendSMSRequest = req.body;

      // Validate required fields
      if (!request.phoneNumber || !request.templateName || !request.userId) {
        return res.status(400).json({
          error: 'Missing required fields: phoneNumber, templateName, userId',
        });
      }

      const delivery = await smsService.sendSMS(request);

      logger.info('SMS sent', {
        deliveryId: delivery.id,
        phoneNumber: request.phoneNumber,
        template: request.templateName,
      });

      res.json(delivery);
    } catch (error) {
      logger.error('Failed to send SMS', {
        error: (error as Error).message,
      });
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * POST /api/multichannel/push
   * Send push notification
   */
  router.post('/push', async (req: Request, res: Response) => {
    try {
      const request: SendPushRequest = req.body;

      // Validate required fields
      if (!request.deviceTokens?.length || !request.templateName || !request.userId) {
        return res.status(400).json({
          error:
            'Missing required fields: deviceTokens (array), templateName, userId',
        });
      }

      const deliveries = await pushService.sendPush(request);

      logger.info('Push notifications sent', {
        count: deliveries.length,
        template: request.templateName,
      });

      res.json({ deliveries, count: deliveries.length });
    } catch (error) {
      logger.error('Failed to send push notification', {
        error: (error as Error).message,
      });
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * POST /api/multichannel/queue/enqueue
   * Enqueue notification for async processing
   */
  router.post('/queue/enqueue', async (req: Request, res: Response) => {
    try {
      const {
        notificationId,
        channel,
        providerId,
        userId,
        payload,
        maxRetries,
      } = req.body;

      if (!notificationId || !channel || !userId || !payload) {
        return res.status(400).json({
          error: 'Missing required fields: notificationId, channel, userId, payload',
        });
      }

      const queueId = await queueService.enqueue(
        notificationId,
        channel,
        providerId,
        userId,
        payload,
        maxRetries || 5
      );

      logger.info('Notification enqueued', { queueId, channel, userId });

      res.json({ queueId, status: 'pending' });
    } catch (error) {
      logger.error('Failed to enqueue notification', {
        error: (error as Error).message,
      });
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * GET /api/multichannel/queue/stats
   * Get queue statistics
   */
  router.get('/queue/stats', async (req: Request, res: Response) => {
    try {
      const stats = await queueService.getQueueStats();
      res.json(stats);
    } catch (error) {
      logger.error('Failed to get queue stats', {
        error: (error as Error).message,
      });
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * GET /api/multichannel/queue/health
   * Get queue health status
   */
  router.get('/queue/health', async (req: Request, res: Response) => {
    try {
      const health = await queueService.getQueueHealth();
      res.json(health);
    } catch (error) {
      logger.error('Failed to get queue health', {
        error: (error as Error).message,
      });
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * GET /api/multichannel/email/stats/:providerId
   * Get email delivery statistics
   */
  router.get('/email/stats/:providerId', async (req: Request, res: Response) => {
    try {
      const { providerId } = req.params;
      const days = parseInt(req.query.days as string) || 7;

      const stats = await emailService.getDeliveryStats(providerId, days);
      res.json(stats);
    } catch (error) {
      logger.error('Failed to get email stats', {
        error: (error as Error).message,
      });
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * GET /api/multichannel/sms/stats/:providerId
   * Get SMS delivery statistics
   */
  router.get('/sms/stats/:providerId', async (req: Request, res: Response) => {
    try {
      const { providerId } = req.params;
      const days = parseInt(req.query.days as string) || 7;

      const stats = await smsService.getDeliveryStats(providerId, days);
      res.json(stats);
    } catch (error) {
      logger.error('Failed to get SMS stats', {
        error: (error as Error).message,
      });
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * GET /api/multichannel/push/stats/:providerId
   * Get push delivery statistics
   */
  router.get('/push/stats/:providerId', async (req: Request, res: Response) => {
    try {
      const { providerId } = req.params;
      const days = parseInt(req.query.days as string) || 7;

      const stats = await pushService.getDeliveryStats(providerId, days);
      res.json(stats);
    } catch (error) {
      logger.error('Failed to get push stats', {
        error: (error as Error).message,
      });
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * POST /api/multichannel/email/template
   * Create email template
   */
  router.post('/email/template', async (req: Request, res: Response) => {
    try {
      const template = req.body;

      if (
        !template.id ||
        !template.templateName ||
        !template.subject ||
        !template.htmlBody
      ) {
        return res.status(400).json({
          error:
            'Missing required fields: id, templateName, subject, htmlBody',
        });
      }

      await emailService.createTemplate(template);

      logger.info('Email template created', {
        templateName: template.templateName,
      });

      res.json({ success: true, templateName: template.templateName });
    } catch (error) {
      logger.error('Failed to create email template', {
        error: (error as Error).message,
      });
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * POST /api/multichannel/sms/template
   * Create SMS template
   */
  router.post('/sms/template', async (req: Request, res: Response) => {
    try {
      const template = req.body;

      if (
        !template.id ||
        !template.templateName ||
        !template.messageTemplate
      ) {
        return res.status(400).json({
          error: 'Missing required fields: id, templateName, messageTemplate',
        });
      }

      await smsService.createTemplate(template);

      logger.info('SMS template created', {
        templateName: template.templateName,
      });

      res.json({ success: true, templateName: template.templateName });
    } catch (error) {
      logger.error('Failed to create SMS template', {
        error: (error as Error).message,
      });
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * POST /api/multichannel/push/template
   * Create push template
   */
  router.post('/push/template', async (req: Request, res: Response) => {
    try {
      const template = req.body;

      if (!template.id || !template.templateName || !template.title || !template.body) {
        return res.status(400).json({
          error: 'Missing required fields: id, templateName, title, body',
        });
      }

      await pushService.createTemplate(template);

      logger.info('Push template created', {
        templateName: template.templateName,
      });

      res.json({ success: true, templateName: template.templateName });
    } catch (error) {
      logger.error('Failed to create push template', {
        error: (error as Error).message,
      });
      res.status(500).json({ error: (error as Error).message });
    }
  });

  return router;
}
