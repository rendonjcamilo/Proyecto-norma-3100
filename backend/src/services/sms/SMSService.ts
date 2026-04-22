/**
 * SMS Service
 * Handles SMS notification delivery via multiple providers
 */

import { Pool, QueryResult } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger.js';
import {
  SMSDelivery,
  SMSTemplate,
  SMSConfig,
  SendSMSRequest,
  DeliveryStatusUpdate,
} from '../../types/multichannel.types.js';

export class SMSService {
  private pool: Pool;
  private config: SMSConfig;
  private twilioClient?: any;
  private snsClient?: any;

  constructor(pool: Pool, config: SMSConfig) {
    this.pool = pool;
    this.config = config;
    this.initializeProvider();
  }

  private initializeProvider(): void {
    if (this.config.provider === 'twilio') {
      try {
        const twilio = require('twilio');
        this.twilioClient = twilio(this.config.accountSid, this.config.authToken);
      } catch (err) {
        logger.warn('Twilio not installed, SMS delivery will be queued');
      }
    } else if (this.config.provider === 'aws_sns') {
      try {
        const AWS = require('aws-sdk');
        this.snsClient = new AWS.SNS({
          region: this.config.region || 'us-east-1',
        });
      } catch (err) {
        logger.warn('AWS SDK not installed, SMS delivery will be queued');
      }
    }
  }

  /**
   * Send SMS notification
   */
  public async sendSMS(request: SendSMSRequest): Promise<SMSDelivery> {
    const id = uuidv4();
    const now = new Date().toISOString();

    try {
      // Get SMS template
      const template = await this.getTemplate(request.templateName);
      if (!template) {
        throw new Error(`SMS template not found: ${request.templateName}`);
      }

      // Populate template variables
      const message = this.populateTemplate(template.messageTemplate, request.variables);

      // Validate message length
      if (message.length > template.maxLength) {
        throw new Error(
          `SMS message exceeds maximum length of ${template.maxLength} characters`
        );
      }

      // Create delivery record
      const delivery = await this.createDelivery({
        id,
        notificationId: request.notificationId || '',
        providerId: request.providerId,
        userId: request.userId,
        phoneNumber: request.phoneNumber,
        message,
        status: 'pending',
        deliveryAttempts: 0,
        maxAttempts: this.config.maxRetries,
        smsProvider: this.config.provider as any,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      });

      // Send SMS
      await this.sendSMSDirect(request.phoneNumber, message, id);

      logger.info('SMS sent', {
        id,
        userId: request.userId,
        phoneNumber: request.phoneNumber,
        template: request.templateName,
      });

      return delivery;
    } catch (error) {
      logger.error('Failed to send SMS', {
        userId: request.userId,
        phoneNumber: request.phoneNumber,
        error: (error as Error).message,
      });

      // Create failed delivery record
      return this.createDelivery({
        id,
        notificationId: request.notificationId || '',
        providerId: request.providerId,
        userId: request.userId,
        phoneNumber: request.phoneNumber,
        message: 'Error',
        status: 'failed',
        deliveryAttempts: 1,
        maxAttempts: this.config.maxRetries,
        smsProvider: this.config.provider as any,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      });
    }
  }

  /**
   * Send SMS directly to provider
   */
  private async sendSMSDirect(
    phoneNumber: string,
    message: string,
    deliveryId: string
  ): Promise<void> {
    if (this.config.provider === 'twilio' && this.twilioClient) {
      const result = await this.twilioClient.messages.create({
        body: message,
        from: this.config.fromNumber,
        to: phoneNumber,
      });

      await this.updateDeliveryStatus({
        deliveryId,
        status: 'sent',
        providerMessageId: result.sid,
        timestamp: new Date(),
      });
    } else if (this.config.provider === 'aws_sns' && this.snsClient) {
      const result = await this.snsClient
        .publish({
          Message: message,
          PhoneNumber: phoneNumber,
        })
        .promise();

      await this.updateDeliveryStatus({
        deliveryId,
        status: 'sent',
        providerMessageId: result.MessageId,
        timestamp: new Date(),
      });
    } else if (this.config.provider === 'local_provider') {
      // Local provider for testing/development
      logger.info('SMS would be sent via local provider', {
        deliveryId,
        phoneNumber,
        message,
      });

      await this.updateDeliveryStatus({
        deliveryId,
        status: 'sent',
        providerMessageId: `local_${deliveryId}`,
        timestamp: new Date(),
      });
    } else {
      // Queue for later delivery
      logger.warn('SMS queued for delivery', { deliveryId, phoneNumber });
    }
  }

  /**
   * Create SMS template
   */
  public async createTemplate(template: SMSTemplate): Promise<void> {
    const query = `
      INSERT INTO sms_templates (
        id, template_name, message_template, max_length, variables, language, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (template_name) DO UPDATE SET
        message_template = $3, max_length = $4, updated_at = $9;
    `;

    try {
      await this.pool.query(query, [
        template.id,
        template.templateName,
        template.messageTemplate,
        template.maxLength,
        JSON.stringify(template.variables || {}),
        template.language,
        template.isActive,
        template.createdAt,
        template.updatedAt,
      ]);

      logger.info('SMS template created', { templateName: template.templateName });
    } catch (error) {
      logger.error('Failed to create SMS template', {
        templateName: template.templateName,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get SMS template
   */
  public async getTemplate(templateName: string): Promise<SMSTemplate | null> {
    const query = `
      SELECT * FROM sms_templates
      WHERE template_name = $1 AND is_active = true;
    `;

    try {
      const result = await this.pool.query<SMSTemplate>(query, [templateName]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to get SMS template', {
        templateName,
        error: (error as Error).message,
      });
      return null;
    }
  }

  /**
   * Create delivery record
   */
  private async createDelivery(delivery: SMSDelivery): Promise<SMSDelivery> {
    const query = `
      INSERT INTO sms_deliveries (
        id, notification_id, provider_id, user_id, phone_number, message,
        status, delivery_attempts, max_attempts, sms_provider, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `;

    try {
      const result: QueryResult<SMSDelivery> = await this.pool.query(query, [
        delivery.id,
        delivery.notificationId,
        delivery.providerId,
        delivery.userId,
        delivery.phoneNumber,
        delivery.message,
        delivery.status,
        delivery.deliveryAttempts,
        delivery.maxAttempts,
        delivery.smsProvider,
        delivery.createdAt,
        delivery.updatedAt,
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to create SMS delivery', {
        phoneNumber: delivery.phoneNumber,
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
      UPDATE sms_deliveries
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

      logger.debug('SMS delivery status updated', {
        deliveryId: update.deliveryId,
        status: update.status,
      });
    } catch (error) {
      logger.error('Failed to update SMS delivery status', {
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
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        COUNT(CASE WHEN status = 'undelivered' THEN 1 END) as undelivered,
        ROUND(100.0 * COUNT(CASE WHEN status = 'sent' THEN 1 END) / COUNT(*), 2) as success_rate
      FROM sms_deliveries
      WHERE provider_id = $1
        AND created_at > CURRENT_TIMESTAMP - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC;
    `;

    try {
      const result = await this.pool.query(query, [providerId]);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get SMS delivery stats', {
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
   * Retry failed deliveries
   */
  public async retryFailedDeliveries(maxRetries: number = 3): Promise<number> {
    const query = `
      UPDATE sms_deliveries
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
      logger.info('SMS delivery retries scheduled', { count: result.rows.length });
      return result.rows.length;
    } catch (error) {
      logger.error('Failed to retry SMS deliveries', {
        error: (error as Error).message,
      });
      return 0;
    }
  }
}
