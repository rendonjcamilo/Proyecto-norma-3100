/**
 * Email Service
 * Handles email notification delivery via multiple providers
 */

import { Pool, QueryResult } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger.js';
import {
  EmailDelivery,
  EmailTemplate,
  EmailConfig,
  SendEmailRequest,
  DeliveryStatusUpdate,
} from '../../types/multichannel.types.js';

export class EmailService {
  private pool: Pool;
  private config: EmailConfig;
  private mailgunClient?: any;
  private sendgridClient?: any;

  constructor(pool: Pool, config: EmailConfig) {
    this.pool = pool;
    this.config = config;
    this.initializeProvider();
  }

  private initializeProvider(): void {
    if (this.config.provider === 'mailgun') {
      try {
        const mailgun = require('mailgun.js');
        this.mailgunClient = new mailgun.default({ key: this.config.apiKey });
      } catch (err) {
        logger.warn('Mailgun not installed, email delivery will be queued');
      }
    } else if (this.config.provider === 'sendgrid') {
      try {
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(this.config.apiKey);
        this.sendgridClient = sgMail;
      } catch (err) {
        logger.warn('SendGrid not installed, email delivery will be queued');
      }
    }
  }

  /**
   * Send email notification
   */
  public async sendEmail(request: SendEmailRequest): Promise<EmailDelivery> {
    const id = uuidv4();
    const now = new Date().toISOString();

    try {
      // Get email template
      const template = await this.getTemplate(request.templateName);
      if (!template) {
        throw new Error(`Email template not found: ${request.templateName}`);
      }

      // Populate template variables
      const subject = this.populateTemplate(template.subject, request.variables);
      const htmlBody = this.populateTemplate(template.htmlBody, request.variables);

      // Create delivery record
      const delivery = await this.createDelivery({
        id,
        notificationId: request.notificationId || '',
        providerId: request.providerId,
        userId: request.userId,
        email: request.email,
        subject,
        templateName: request.templateName,
        status: 'pending',
        deliveryAttempts: 0,
        maxAttempts: this.config.maxRetries,
        emailProvider: this.config.provider as any,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      });

      // Send email
      await this.sendEmailDirect(request.email, subject, htmlBody, id);

      logger.info('Email sent', {
        id,
        userId: request.userId,
        email: request.email,
        template: request.templateName,
      });

      return delivery;
    } catch (error) {
      logger.error('Failed to send email', {
        userId: request.userId,
        email: request.email,
        error: (error as Error).message,
      });

      // Create failed delivery record
      return this.createDelivery({
        id,
        notificationId: request.notificationId || '',
        providerId: request.providerId,
        userId: request.userId,
        email: request.email,
        subject: 'Error',
        templateName: request.templateName,
        status: 'failed',
        deliveryAttempts: 1,
        maxAttempts: this.config.maxRetries,
        emailProvider: this.config.provider as any,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      });
    }
  }

  /**
   * Send email directly to provider
   */
  private async sendEmailDirect(
    to: string,
    subject: string,
    html: string,
    deliveryId: string
  ): Promise<void> {
    if (this.config.provider === 'mailgun' && this.mailgunClient) {
      const messageData = {
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to,
        subject,
        html,
      };

      const result = await this.mailgunClient.messages.create(
        'norma3100.healthcare.local',
        messageData
      );

      await this.updateDeliveryStatus({
        deliveryId,
        status: 'sent',
        providerMessageId: result.id,
        timestamp: new Date(),
      });
    } else if (this.config.provider === 'sendgrid' && this.sendgridClient) {
      const msg = {
        to,
        from: this.config.fromEmail,
        subject,
        html,
      };

      const result = await this.sendgridClient.send(msg);

      await this.updateDeliveryStatus({
        deliveryId,
        status: 'sent',
        providerMessageId: result[0].headers['x-message-id'],
        timestamp: new Date(),
      });
    } else {
      // Queue for later delivery
      logger.warn('Email queued for delivery', { deliveryId, to });
    }
  }

  /**
   * Create email template
   */
  public async createTemplate(template: EmailTemplate): Promise<void> {
    const query = `
      INSERT INTO email_templates (
        id, template_name, subject, html_body, text_body, variables, language, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (template_name) DO UPDATE SET
        subject = $3, html_body = $4, updated_at = $10;
    `;

    try {
      await this.pool.query(query, [
        template.id,
        template.templateName,
        template.subject,
        template.htmlBody,
        template.textBody || null,
        JSON.stringify(template.variables || {}),
        template.language,
        template.isActive,
        template.createdAt,
        template.updatedAt,
      ]);

      logger.info('Email template created', { templateName: template.templateName });
    } catch (error) {
      logger.error('Failed to create email template', {
        templateName: template.templateName,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get email template
   */
  public async getTemplate(templateName: string): Promise<EmailTemplate | null> {
    const query = `
      SELECT * FROM email_templates
      WHERE template_name = $1 AND is_active = true;
    `;

    try {
      const result = await this.pool.query<EmailTemplate>(query, [templateName]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to get email template', {
        templateName,
        error: (error as Error).message,
      });
      return null;
    }
  }

  /**
   * Create delivery record
   */
  private async createDelivery(delivery: EmailDelivery): Promise<EmailDelivery> {
    const query = `
      INSERT INTO email_deliveries (
        id, notification_id, provider_id, user_id, email, subject, template_name,
        status, delivery_attempts, max_attempts, email_provider, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *;
    `;

    try {
      const result: QueryResult<EmailDelivery> = await this.pool.query(query, [
        delivery.id,
        delivery.notificationId,
        delivery.providerId,
        delivery.userId,
        delivery.email,
        delivery.subject,
        delivery.templateName,
        delivery.status,
        delivery.deliveryAttempts,
        delivery.maxAttempts,
        delivery.emailProvider,
        delivery.createdAt,
        delivery.updatedAt,
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to create email delivery', {
        email: delivery.email,
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
      UPDATE email_deliveries
      SET
        status = $2,
        provider_message_id = $3,
        sent_at = CASE WHEN $2 = 'sent' THEN $6 ELSE sent_at END,
        bounce_reason = $4,
        delivery_attempts = delivery_attempts + 1,
        last_attempt_at = $6,
        updated_at = $6
      WHERE id = $1;
    `;

    try {
      await this.pool.query(query, [
        update.deliveryId,
        update.status,
        update.providerMessageId,
        update.failureReason,
        null,
        update.timestamp,
      ]);

      logger.debug('Email delivery status updated', {
        deliveryId: update.deliveryId,
        status: update.status,
      });
    } catch (error) {
      logger.error('Failed to update email delivery status', {
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
        COUNT(CASE WHEN status = 'bounced' THEN 1 END) as bounced,
        ROUND(100.0 * COUNT(CASE WHEN status = 'sent' THEN 1 END) / COUNT(*), 2) as success_rate
      FROM email_deliveries
      WHERE provider_id = $1
        AND created_at > CURRENT_TIMESTAMP - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC;
    `;

    try {
      const result = await this.pool.query(query, [providerId]);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get email delivery stats', {
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
   * Get all active email templates
   */
  public async getActiveTemplates(): Promise<EmailTemplate[]> {
    const query = `
      SELECT id, template_name, subject, html_body, text_body, variables, language, is_active, created_at, updated_at
      FROM email_templates
      WHERE is_active = true
      ORDER BY created_at DESC;
    `;

    try {
      const result = await this.pool.query<any>(query);
      return result.rows.map((row) => ({
        id: row.id,
        template_name: row.template_name,
        templateName: row.template_name,
        subject: row.subject,
        html_body: row.html_body,
        htmlBody: row.html_body,
        text_body: row.text_body,
        textBody: row.text_body,
        variables: row.variables ? (typeof row.variables === 'string' ? JSON.parse(row.variables) : row.variables) : [],
        language: row.language,
        is_active: row.is_active,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })) as EmailTemplate[];
    } catch (error) {
      logger.error('Failed to get active email templates', {
        error: (error as Error).message,
      });
      return [];
    }
  }

  /**
   * Retry failed deliveries
   */
  public async retryFailedDeliveries(maxRetries: number = 3): Promise<number> {
    const query = `
      UPDATE email_deliveries
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
      logger.info('Email delivery retries scheduled', { count: result.rows.length });
      return result.rows.length;
    } catch (error) {
      logger.error('Failed to retry email deliveries', {
        error: (error as Error).message,
      });
      return 0;
    }
  }
}
