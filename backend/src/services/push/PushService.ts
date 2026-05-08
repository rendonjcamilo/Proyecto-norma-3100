/**
 * Push Service
 * Handles push notification delivery via FCM and APNS providers
 */

import { Pool, QueryResult } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger.js';
import {
  PushDelivery,
  PushTemplate,
  PushConfig,
  SendPushRequest,
  DeliveryStatusUpdate,
} from '../../types/multichannel.types.js';

export class PushService {
  private pool: Pool;
  private config: PushConfig;
  private fcmClient?: any;
  private apnsClient?: any;

  constructor(pool: Pool, config: PushConfig) {
    this.pool = pool;
    this.config = config;
    this.initializeProvider();
  }

  private initializeProvider(): void {
    if (this.config.provider === 'fcm') {
      try {
        const admin = require('firebase-admin');
        const serviceAccount = JSON.parse(this.config.serviceAccountKey || '{}');
        if (!admin.apps.length) {
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: this.config.projectId,
          });
        }
        this.fcmClient = admin.messaging();
      } catch (err) {
        logger.warn('Firebase Admin SDK not initialized, push delivery will be queued');
      }
    } else if (this.config.provider === 'apns') {
      try {
        const apn = require('apn');
        this.apnsClient = new apn.Provider({
          token: {
            key: this.config.keyId,
            id: this.config.keyId,
            teamId: this.config.teamId,
          },
          production: true,
        });
      } catch (err) {
        logger.warn('APNS not configured, push delivery will be queued');
      }
    }
  }

  /**
   * Send push notification
   */
  public async sendPush(request: SendPushRequest): Promise<PushDelivery[]> {
    const template = await this.getTemplate(request.templateName);
    if (!template) {
      throw new Error(`Push template not found: ${request.templateName}`);
    }

    // Populate template variables
    const title = this.populateTemplate(template.title, request.variables);
    const body = this.populateTemplate(template.body, request.variables);
    const actionUrl = template.actionUrl
      ? this.populateTemplate(template.actionUrl, request.variables)
      : undefined;

    const now = new Date().toISOString();
    const deliveries: PushDelivery[] = [];

    // Send to each device token
    for (const deviceToken of request.deviceTokens) {
      try {
        const id = uuidv4();

        // Create delivery record
        const delivery = await this.createDelivery({
          id,
          notificationId: request.notificationId || '',
          providerId: request.providerId,
          userId: request.userId,
          deviceToken,
          devicePlatform: request.devicePlatform,
          title,
          body,
          status: 'pending',
          deliveryAttempts: 0,
          maxAttempts: this.config.maxRetries,
          pushProvider: this.config.provider as any,
          createdAt: new Date(now),
          updatedAt: new Date(now),
        });

        // Send push notification
        await this.sendPushDirect(
          deviceToken,
          request.devicePlatform,
          title,
          body,
          actionUrl,
          template.imageUrl,
          id
        );

        deliveries.push(delivery);

        logger.info('Push notification sent', {
          id,
          userId: request.userId,
          platform: request.devicePlatform,
          template: request.templateName,
        });
      } catch (error) {
        const id = uuidv4();
        logger.error('Failed to send push notification', {
          userId: request.userId,
          platform: request.devicePlatform,
          error: (error as Error).message,
        });

        // Create failed delivery record
        const failedDelivery = await this.createDelivery({
          id,
          notificationId: request.notificationId || '',
          providerId: request.providerId,
          userId: request.userId,
          deviceToken,
          devicePlatform: request.devicePlatform,
          title: 'Error',
          body: 'Failed to send notification',
          status: 'failed',
          deliveryAttempts: 1,
          maxAttempts: this.config.maxRetries,
          pushProvider: this.config.provider as any,
          createdAt: new Date(now),
          updatedAt: new Date(now),
        });

        deliveries.push(failedDelivery);
      }
    }

    return deliveries;
  }

  /**
   * Send push directly to provider
   */
  private async sendPushDirect(
    deviceToken: string,
    platform: 'ios' | 'android' | 'web',
    title: string,
    body: string,
    actionUrl?: string,
    imageUrl?: string,
    deliveryId?: string
  ): Promise<void> {
    if (this.config.provider === 'fcm' && this.fcmClient) {
      const message = {
        notification: {
          title,
          body,
        },
        ...(platform === 'android' && {
          android: {
            priority: 'high',
            notification: {
              clickAction: actionUrl,
              imageUrl,
            },
          },
        }),
        ...(platform === 'ios' && {
          apns: {
            payload: {
              aps: {
                alert: { title, body },
                sound: 'default',
                'mutable-content': 1,
              },
            },
            fcmOptions: {
              image: imageUrl,
            },
          },
        }),
        webpush: actionUrl
          ? {
              fcmOptions: {
                link: actionUrl,
              },
            }
          : undefined,
        token: deviceToken,
      };

      const result = await this.fcmClient.send(message);

      if (deliveryId) {
        await this.updateDeliveryStatus({
          deliveryId,
          status: 'sent',
          providerMessageId: result,
          timestamp: new Date(),
        });
      }
    } else if (this.config.provider === 'apns' && this.apnsClient && platform === 'ios') {
      const notification = new (require('apn')).Notification({
        token: deviceToken,
        alert: {
          title,
          body,
        },
        sound: 'default',
        contentAvailable: true,
        mutableContent: true,
        ...(actionUrl && { customProperties: { actionUrl } }),
        ...(imageUrl && { customProperties: { imageUrl } }),
      });

      const result = await this.apnsClient.send(notification);

      if (deliveryId && result.sent && result.sent.length > 0) {
        await this.updateDeliveryStatus({
          deliveryId,
          status: 'sent',
          providerMessageId: result.sent[0],
          timestamp: new Date(),
        });
      } else if (deliveryId && result.failed && result.failed.length > 0) {
        const failure = result.failed[0];
        await this.updateDeliveryStatus({
          deliveryId,
          status: failure.response?.reason === 'InvalidToken' ? 'invalid_token' : 'failed',
          failureReason: failure.response?.reason || 'Unknown error',
          timestamp: new Date(),
        });
      }
    } else {
      // Queue for later delivery
      logger.warn('Push notification queued for delivery', { deviceToken, platform });
    }
  }

  /**
   * Create push template
   */
  public async createTemplate(template: PushTemplate): Promise<void> {
    const query = `
      INSERT INTO push_templates (
        id, template_name, title, body, action_url, icon_url, image_url, variables, language, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (template_name) DO UPDATE SET
        title = $3, body = $4, updated_at = $12;
    `;

    try {
      await this.pool.query(query, [
        template.id,
        template.templateName,
        template.title,
        template.body,
        template.actionUrl || null,
        template.iconUrl || null,
        template.imageUrl || null,
        JSON.stringify(template.variables || {}),
        template.language,
        template.isActive,
        template.createdAt,
        template.updatedAt,
      ]);

      logger.info('Push template created', { templateName: template.templateName });
    } catch (error) {
      logger.error('Failed to create push template', {
        templateName: template.templateName,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get push template
   */
  public async getTemplate(templateName: string): Promise<PushTemplate | null> {
    const query = `
      SELECT * FROM push_templates
      WHERE template_name = $1 AND is_active = true;
    `;

    try {
      const result = await this.pool.query<PushTemplate>(query, [templateName]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to get push template', {
        templateName,
        error: (error as Error).message,
      });
      return null;
    }
  }

  /**
   * Create delivery record
   */
  private async createDelivery(delivery: PushDelivery): Promise<PushDelivery> {
    const query = `
      INSERT INTO push_deliveries (
        id, notification_id, provider_id, user_id, device_token, device_platform,
        title, body, status, delivery_attempts, max_attempts, push_provider, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *;
    `;

    try {
      const result: QueryResult<PushDelivery> = await this.pool.query(query, [
        delivery.id,
        delivery.notificationId,
        delivery.providerId,
        delivery.userId,
        delivery.deviceToken,
        delivery.devicePlatform,
        delivery.title,
        delivery.body,
        delivery.status,
        delivery.deliveryAttempts,
        delivery.maxAttempts,
        delivery.pushProvider,
        delivery.createdAt,
        delivery.updatedAt,
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to create push delivery', {
        deviceToken: delivery.deviceToken,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Update delivery status
   */
  public async updateDeliveryStatus(update: DeliveryStatusUpdate): Promise<void> {
    const query = `
      UPDATE push_deliveries
      SET
        status = $2,
        provider_message_id = $3,
        sent_at = CASE WHEN $2 = 'sent' THEN $5 ELSE sent_at END,
        failure_reason = $4,
        delivery_attempts = delivery_attempts + 1,
        last_attempt_at = $5,
        updated_at = $5
      WHERE id = $1;
    `;

    try {
      await this.pool.query(query, [
        update.deliveryId,
        update.status,
        update.providerMessageId,
        update.failureReason,
        update.timestamp,
      ]);

      logger.debug('Push delivery status updated', {
        deliveryId: update.deliveryId,
        status: update.status,
      });
    } catch (error) {
      logger.error('Failed to update push delivery status', {
        deliveryId: update.deliveryId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get delivery statistics
   */
  public async getDeliveryStats(
    providerId: string,
    days: number = 7
  ): Promise<any> {
    const query = `
      SELECT
        DATE(created_at) as date,
        device_platform,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        COUNT(CASE WHEN status = 'invalid_token' THEN 1 END) as invalid_tokens,
        ROUND(100.0 * COUNT(CASE WHEN status = 'sent' THEN 1 END) / COUNT(*), 2) as success_rate
      FROM push_deliveries
      WHERE provider_id = $1
        AND created_at > CURRENT_TIMESTAMP - (INTERVAL '1 day' * $2)
      GROUP BY DATE(created_at), device_platform
      ORDER BY date DESC;
    `;

    try {
      const result = await this.pool.query(query, [providerId, days]);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get push delivery stats', {
        providerId,
        error: (error as Error).message,
      });
      return [];
    }
  }

  /**
   * Populate template with variables
   */
  private populateTemplate(template: string, variables?: Record<string, any>): string {
    if (!variables) {return template;}

    let result = template;
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(placeholder, String(value));
    });

    return result;
  }

  /**
   * Handle invalid tokens (device uninstalled app, etc.)
   */
  public async handleInvalidTokens(): Promise<number> {
    const query = `
      DELETE FROM push_deliveries
      WHERE status = 'invalid_token'
        AND created_at < CURRENT_TIMESTAMP - INTERVAL '30 days'
      RETURNING id;
    `;

    try {
      const result = await this.pool.query(query);
      logger.info('Invalid push tokens cleaned up', { count: result.rows.length });
      return result.rows.length;
    } catch (error) {
      logger.error('Failed to clean up invalid tokens', {
        error: (error as Error).message,
      });
      return 0;
    }
  }

  /**
   * Retry failed deliveries
   */
  public async retryFailedDeliveries(maxRetries: number = 3): Promise<number> {
    const query = `
      UPDATE push_deliveries
      SET
        status = 'pending',
        last_attempt_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE
        status = 'failed'
        AND delivery_attempts < $1
        AND created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
      RETURNING id;
    `;

    try {
      const result = await this.pool.query(query, [maxRetries]);
      logger.info('Push delivery retries scheduled', { count: result.rows.length });
      return result.rows.length;
    } catch (error) {
      logger.error('Failed to retry push deliveries', {
        error: (error as Error).message,
      });
      return 0;
    }
  }
}
