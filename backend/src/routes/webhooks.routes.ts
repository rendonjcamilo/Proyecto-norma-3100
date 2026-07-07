/**
 * Webhook Routes for Multi-Channel Notifications
 * Handlers for Mailgun, Twilio, Firebase delivery status updates
 */

import express, { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { logger } from '../utils/logger.js';
import {
  EmailWebhookPayload,
  SMSWebhookPayload,
  PushWebhookPayload,
} from '../types/multichannel.types.js';
import {
  verifyMailgunSignature,
  verifyTwilioSignature,
  verifySharedSecret,
} from '../utils/webhook-signature.js';

export function createWebhooksRouter(pool: Pool): Router {
  const router = express.Router();
  // En dev, si el secreto no está configurado, se permite el paso con warning
  // (no rompe pruebas locales). En producción SIEMPRE se exige verificación.
  const failOpen = process.env.NODE_ENV !== 'production';

  /**
   * POST /api/webhooks/email/mailgun
   * Mailgun webhook for email delivery status
   */
  router.post('/email/mailgun', async (req: Request, res: Response) => {
    try {
      const key = process.env.MAILGUN_WEBHOOK_SIGNING_KEY || '';
      const ok = verifyMailgunSignature(req.body?.signature || {}, key);
      if (!ok && !(failOpen && !key)) {
        logger.warn('Firma Mailgun inválida');
        return res.status(401).json({ error: 'Invalid signature' });
      }
      if (!ok) {
        logger.warn('Webhook Mailgun sin verificar (dev)');
      }

      const payload: EmailWebhookPayload = req.body;

      if (!payload.messageId) {
        return res.status(400).json({ error: 'Missing messageId' });
      }

      const status =
        payload.event === 'delivered'
          ? 'sent'
          : payload.event === 'failed'
            ? 'failed'
            : payload.event === 'bounced'
              ? 'bounced'
              : null;

      if (!status) {
        logger.debug('Skipping non-delivery event', {
          event: payload.event,
          messageId: payload.messageId,
        });
        return res.json({ success: true, skipped: true });
      }

      // Find delivery record by provider message ID
      const result = await pool.query(
        `SELECT id FROM email_deliveries WHERE provider_message_id = $1`,
        [payload.messageId]
      );

      if (result.rows.length === 0) {
        logger.warn('Delivery record not found for Mailgun webhook', {
          messageId: payload.messageId,
        });
        return res.json({ success: true, recorded: false });
      }

      const deliveryId = result.rows[0].id;

      // Update delivery status
      await pool.query(
        `UPDATE email_deliveries
         SET status = $2,
             bounce_reason = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [deliveryId, status, payload.failureDescription || null]
      );

      logger.info('Email delivery status updated via Mailgun webhook', {
        deliveryId,
        messageId: payload.messageId,
        status,
        event: payload.event,
      });

      res.json({ success: true, deliveryId, status });
    } catch (error) {
      logger.error('Failed to process Mailgun webhook', {
        error: (error as Error).message,
      });
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * POST /api/webhooks/email/sendgrid
   * SendGrid webhook for email delivery status
   */
  router.post('/email/sendgrid', async (req: Request, res: Response) => {
    try {
      const key = process.env.SENDGRID_WEBHOOK_SECRET || '';
      const ok = verifySharedSecret(req.get('X-Webhook-Token') || '', key);
      if (!ok && !(failOpen && !key)) {
        logger.warn('Token de webhook SendGrid inválido');
        return res.status(401).json({ error: 'Invalid signature' });
      }
      if (!ok) {
        logger.warn('Webhook SendGrid sin verificar (dev)');
      }

      const events = Array.isArray(req.body) ? req.body : [req.body];

      for (const event of events) {
        const payload: EmailWebhookPayload = event;

        if (!payload.messageId) {continue;}

        const status =
          payload.event === 'delivered'
            ? 'sent'
            : payload.event === 'failed'
              ? 'failed'
              : payload.event === 'bounced'
                ? 'bounced'
                : null;

        if (!status) {continue;}

        const result = await pool.query(
          `SELECT id FROM email_deliveries WHERE provider_message_id = $1`,
          [payload.messageId]
        );

        if (result.rows.length === 0) {continue;}

        const deliveryId = result.rows[0].id;

        await pool.query(
          `UPDATE email_deliveries
           SET status = $2,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [deliveryId, status]
        );

        logger.info('Email delivery updated via SendGrid webhook', {
          deliveryId,
          messageId: payload.messageId,
          status,
        });
      }

      res.json({ success: true, processed: events.length });
    } catch (error) {
      logger.error('Failed to process SendGrid webhook', {
        error: (error as Error).message,
      });
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * POST /api/webhooks/sms/twilio
   * Twilio webhook for SMS delivery status
   */
  router.post('/sms/twilio', async (req: Request, res: Response) => {
    try {
      const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      const key = process.env.TWILIO_AUTH_TOKEN || '';
      const ok = verifyTwilioSignature(key, fullUrl, req.body, req.get('X-Twilio-Signature') || '');
      if (!ok && !(failOpen && !key)) {
        logger.warn('Firma Twilio inválida');
        return res.status(401).json({ error: 'Invalid signature' });
      }
      if (!ok) {
        logger.warn('Webhook Twilio sin verificar (dev)');
      }

      const payload: SMSWebhookPayload = req.body;

      if (!payload.messageId) {
        return res.status(400).json({ error: 'Missing messageId' });
      }

      const status =
        payload.event === 'delivered'
          ? 'sent'
          : payload.event === 'failed'
            ? 'failed'
            : payload.event === 'undelivered'
              ? 'undelivered'
              : null;

      if (!status) {
        return res.json({ success: true, skipped: true });
      }

      const result = await pool.query(
        `SELECT id FROM sms_deliveries WHERE provider_message_id = $1`,
        [payload.messageId]
      );

      if (result.rows.length === 0) {
        logger.warn('SMS delivery record not found for Twilio webhook', {
          messageId: payload.messageId,
        });
        return res.json({ success: true, recorded: false });
      }

      const deliveryId = result.rows[0].id;

      await pool.query(
        `UPDATE sms_deliveries
         SET status = $2,
             failure_reason = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [deliveryId, status, payload.errorCode || null]
      );

      logger.info('SMS delivery status updated via Twilio webhook', {
        deliveryId,
        messageId: payload.messageId,
        status,
      });

      res.json({ success: true, deliveryId, status });
    } catch (error) {
      logger.error('Failed to process Twilio webhook', {
        error: (error as Error).message,
      });
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * POST /api/webhooks/sms/aws-sns
   * AWS SNS webhook for SMS delivery status
   */
  router.post('/sms/aws-sns', async (req: Request, res: Response) => {
    try {
      const key = process.env.AWS_SNS_WEBHOOK_SECRET || '';
      const ok = verifySharedSecret(req.get('X-Webhook-Token') || '', key);
      if (!ok && !(failOpen && !key)) {
        logger.warn('Token de webhook AWS SNS inválido');
        return res.status(401).json({ error: 'Invalid signature' });
      }
      if (!ok) {
        logger.warn('Webhook AWS SNS sin verificar (dev)');
      }

      const payload: any = req.body;

      // AWS SNS sends delivery status in Message field (JSON string)
      let message = payload.Message;
      if (typeof message === 'string') {
        message = JSON.parse(message);
      }

      const status = message.delivery?.status || message.status;
      const messageId = message.messageId || message.delivery?.messageId;

      if (!messageId || !status) {
        return res.json({ success: true, skipped: true });
      }

      const result = await pool.query(
        `SELECT id FROM sms_deliveries WHERE provider_message_id = $1`,
        [messageId]
      );

      if (result.rows.length === 0) {
        return res.json({ success: true, recorded: false });
      }

      const deliveryId = result.rows[0].id;

      await pool.query(
        `UPDATE sms_deliveries
         SET status = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [deliveryId, status]
      );

      logger.info('SMS delivery updated via AWS SNS webhook', {
        deliveryId,
        messageId,
        status,
      });

      res.json({ success: true, deliveryId, status });
    } catch (error) {
      logger.error('Failed to process AWS SNS webhook', {
        error: (error as Error).message,
      });
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * POST /api/webhooks/push/fcm
   * Firebase Cloud Messaging webhook for push status
   */
  router.post('/push/fcm', async (req: Request, res: Response) => {
    try {
      const key = process.env.FCM_WEBHOOK_SECRET || '';
      const ok = verifySharedSecret(req.get('X-Webhook-Token') || '', key);
      if (!ok && !(failOpen && !key)) {
        logger.warn('Token de webhook FCM inválido');
        return res.status(401).json({ error: 'Invalid signature' });
      }
      if (!ok) {
        logger.warn('Webhook FCM sin verificar (dev)');
      }

      const payload: PushWebhookPayload = req.body;

      if (!payload.messageId) {
        return res.status(400).json({ error: 'Missing messageId' });
      }

      const status =
        payload.event === 'delivered'
          ? 'sent'
          : payload.event === 'failed'
            ? 'failed'
            : payload.event === 'invalid_token'
              ? 'invalid_token'
              : null;

      if (!status) {
        return res.json({ success: true, skipped: true });
      }

      const result = await pool.query(
        `SELECT id FROM push_deliveries WHERE provider_message_id = $1`,
        [payload.messageId]
      );

      if (result.rows.length === 0) {
        return res.json({ success: true, recorded: false });
      }

      const deliveryId = result.rows[0].id;

      await pool.query(
        `UPDATE push_deliveries
         SET status = $2,
             failure_reason = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [deliveryId, status, payload.errorCode || null]
      );

      logger.info('Push delivery updated via FCM webhook', {
        deliveryId,
        messageId: payload.messageId,
        status,
      });

      res.json({ success: true, deliveryId, status });
    } catch (error) {
      logger.error('Failed to process FCM webhook', {
        error: (error as Error).message,
      });
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * POST /api/webhooks/push/apns
   * Apple Push Notification Service webhook
   */
  router.post('/push/apns', async (req: Request, res: Response) => {
    try {
      const key = process.env.APNS_WEBHOOK_SECRET || '';
      const ok = verifySharedSecret(req.get('X-Webhook-Token') || '', key);
      if (!ok && !(failOpen && !key)) {
        logger.warn('Token de webhook APNS inválido');
        return res.status(401).json({ error: 'Invalid signature' });
      }
      if (!ok) {
        logger.warn('Webhook APNS sin verificar (dev)');
      }

      const payload: PushWebhookPayload = req.body;

      if (!payload.messageId) {
        return res.status(400).json({ error: 'Missing messageId' });
      }

      const status =
        payload.event === 'delivered'
          ? 'sent'
          : payload.event === 'failed'
            ? 'failed'
            : payload.event === 'invalid_token'
              ? 'invalid_token'
              : null;

      if (!status) {
        return res.json({ success: true, skipped: true });
      }

      const result = await pool.query(
        `SELECT id FROM push_deliveries WHERE provider_message_id = $1`,
        [payload.messageId]
      );

      if (result.rows.length === 0) {
        return res.json({ success: true, recorded: false });
      }

      const deliveryId = result.rows[0].id;

      await pool.query(
        `UPDATE push_deliveries
         SET status = $2,
             failure_reason = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [deliveryId, status, payload.errorCode || null]
      );

      logger.info('Push delivery updated via APNS webhook', {
        deliveryId,
        messageId: payload.messageId,
        status,
      });

      res.json({ success: true, deliveryId, status });
    } catch (error) {
      logger.error('Failed to process APNS webhook', {
        error: (error as Error).message,
      });
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * GET /api/webhooks/health
   * Webhook service health check
   */
  router.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      webhooks: ['mailgun', 'sendgrid', 'twilio', 'aws-sns', 'fcm', 'apns'],
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
