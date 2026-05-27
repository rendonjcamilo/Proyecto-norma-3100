/**
 * Notification Queue Service
 * Async processing of multi-channel notifications with retry logic
 */

import { Pool, QueryResult } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { NotificationQueueItem } from '../types/multichannel.types.js';
import { EmailService } from '../services/email/EmailService.js';
import { SMSService } from '../services/sms/SMSService.js';
import { PushService } from '../services/push/PushService.js';

export class NotificationQueueService {
  private pool: Pool;
  private emailService?: EmailService;
  private smsService?: SMSService;
  private pushService?: PushService;
  private processingInterval?: NodeJS.Timeout;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Set up service dependencies
   */
  public setServiceDependencies(
    emailService?: EmailService,
    smsService?: SMSService,
    pushService?: PushService
  ): void {
    this.emailService = emailService;
    this.smsService = smsService;
    this.pushService = pushService;
  }

  /**
   * Add notification to queue
   */
  public async enqueue(
    notificationId: string,
    channel: 'email' | 'sms' | 'push',
    providerId: string,
    userId: string,
    payload: Record<string, any>,
    maxRetries: number = 5
  ): Promise<string> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const query = `
      INSERT INTO notification_queue (
        id, notification_id, channel, provider_id, user_id, payload,
        status, retry_count, max_retries, next_retry_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `;

    try {
      const _result: QueryResult<NotificationQueueItem> = await this.pool.query(query, [
        id,
        notificationId,
        channel,
        providerId,
        userId,
        JSON.stringify(payload),
        'pending',
        0,
        maxRetries,
        now,
        now,
        now,
      ]);

      logger.info('Notification enqueued', {
        id,
        notificationId,
        channel,
        userId,
      });

      return id;
    } catch (error) {
      logger.error('Failed to enqueue notification', {
        notificationId,
        channel,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Start processing queue (should run on a worker/cron job)
   */
  public startProcessing(intervalMs: number = 5000): void {
    if (this.processingInterval) {
      logger.warn('Queue processing already running');
      return;
    }

    logger.info('Starting notification queue processing', { intervalMs });

    this.processingInterval = setInterval(async () => {
      await this.processPendingMessages();
    }, intervalMs);
  }

  /**
   * Stop processing queue
   */
  public stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
      logger.info('Stopped notification queue processing');
    }
  }

  /**
   * Process all pending messages in queue
   */
  private async processPendingMessages(): Promise<void> {
    try {
      const query = `
        SELECT * FROM notification_queue
        WHERE status = 'pending'
          AND next_retry_at <= CURRENT_TIMESTAMP
        ORDER BY created_at ASC
        LIMIT 100;
      `;

      const result: QueryResult<NotificationQueueItem> = await this.pool.query(query);

      for (const item of result.rows) {
        await this.processQueueItem(item);
      }
    } catch (error) {
      logger.error('Error processing queue items', {
        error: (error as Error).message,
      });
    }
  }

  /**
   * Process a single queue item
   */
  private async processQueueItem(item: NotificationQueueItem): Promise<void> {
    try {
      await this.updateQueueItemStatus(item.id, 'processing');

      let success = false;

      switch (item.channel) {
        case 'email':
          success = await this.processEmailNotification(item);
          break;
        case 'sms':
          success = await this.processSMSNotification(item);
          break;
        case 'push':
          success = await this.processPushNotification(item);
          break;
      }

      if (success) {
        await this.updateQueueItemStatus(item.id, 'completed', undefined, new Date());
      } else {
        await this.retryQueueItem(item);
      }
    } catch (error) {
      logger.error('Error processing queue item', {
        queueItemId: item.id,
        channel: item.channel,
        error: (error as Error).message,
      });

      await this.retryQueueItem(item);
    }
  }

  /**
   * Process email notification
   */
  private async processEmailNotification(item: NotificationQueueItem): Promise<boolean> {
    if (!this.emailService) {
      logger.warn('Email service not configured');
      return false;
    }

    try {
      const payload = item.payload;
      await this.emailService.sendEmail({
        userId: item.userId,
        providerId: item.providerId,
        email: payload.email,
        templateName: payload.templateName,
        variables: payload.variables,
        notificationId: item.notificationId,
      });

      return true;
    } catch (error) {
      logger.error('Failed to process email notification', {
        queueItemId: item.id,
        error: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * Process SMS notification
   */
  private async processSMSNotification(item: NotificationQueueItem): Promise<boolean> {
    if (!this.smsService) {
      logger.warn('SMS service not configured');
      return false;
    }

    try {
      const payload = item.payload;
      await this.smsService.sendSMS({
        userId: item.userId,
        providerId: item.providerId,
        phoneNumber: payload.phoneNumber,
        templateName: payload.templateName,
        variables: payload.variables,
        notificationId: item.notificationId,
      });

      return true;
    } catch (error) {
      logger.error('Failed to process SMS notification', {
        queueItemId: item.id,
        error: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * Process push notification
   */
  private async processPushNotification(item: NotificationQueueItem): Promise<boolean> {
    if (!this.pushService) {
      logger.warn('Push service not configured');
      return false;
    }

    try {
      const payload = item.payload;
      await this.pushService.sendPush({
        userId: item.userId,
        providerId: item.providerId,
        deviceTokens: payload.deviceTokens,
        devicePlatform: payload.devicePlatform,
        templateName: payload.templateName,
        variables: payload.variables,
        notificationId: item.notificationId,
      });

      return true;
    } catch (error) {
      logger.error('Failed to process push notification', {
        queueItemId: item.id,
        error: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * Retry a queue item with exponential backoff
   */
  private async retryQueueItem(item: NotificationQueueItem): Promise<void> {
    const newRetryCount = item.retryCount + 1;

    if (newRetryCount >= item.maxRetries) {
      await this.updateQueueItemStatus(
        item.id,
        'failed',
        `Max retries (${item.maxRetries}) exceeded`
      );
      return;
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s
    const backoffMs = Math.min(1000 * Math.pow(2, newRetryCount), 32000);
    const nextRetryAt = new Date(Date.now() + backoffMs);

    const query = `
      UPDATE notification_queue
      SET
        status = 'pending',
        retry_count = $2,
        next_retry_at = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1;
    `;

    try {
      await this.pool.query(query, [item.id, newRetryCount, nextRetryAt]);

      logger.info('Queue item scheduled for retry', {
        queueItemId: item.id,
        retryCount: newRetryCount,
        nextRetryAt,
        backoffMs,
      });
    } catch (error) {
      logger.error('Failed to schedule queue item retry', {
        queueItemId: item.id,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Update queue item status
   */
  private async updateQueueItemStatus(
    queueItemId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    errorMessage?: string,
    completedAt?: Date
  ): Promise<void> {
    const query = `
      UPDATE notification_queue
      SET
        status = $2,
        error_message = $3,
        completed_at = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1;
    `;

    try {
      await this.pool.query(query, [
        queueItemId,
        status,
        errorMessage || null,
        completedAt || null,
      ]);
    } catch (error) {
      logger.error('Failed to update queue item status', {
        queueItemId,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Get queue statistics
   */
  public async getQueueStats(): Promise<any> {
    const query = `
      SELECT
        channel,
        status,
        COUNT(*) as count,
        ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at))), 2) as avg_processing_time_seconds
      FROM notification_queue
      GROUP BY channel, status
      ORDER BY channel, status;
    `;

    try {
      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get queue statistics', {
        error: (error as Error).message,
      });
      return [];
    }
  }

  /**
   * Get queue health status
   */
  public async getQueueHealth(): Promise<{
    totalPending: number;
    totalProcessing: number;
    totalFailed: number;
    oldestPendingAge: number | null;
    avgProcessingTime: number;
  }> {
    const query = `
      SELECT
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as total_pending,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as total_processing,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as total_failed,
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - MIN(CASE WHEN status = 'pending' THEN created_at END))) as oldest_pending_age_seconds,
        ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - created_at))), 2) as avg_processing_time_seconds
      FROM notification_queue
      WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours';
    `;

    try {
      const result: QueryResult<any> = await this.pool.query(query);
      const row = result.rows[0];

      return {
        totalPending: parseInt(row.total_pending) || 0,
        totalProcessing: parseInt(row.total_processing) || 0,
        totalFailed: parseInt(row.total_failed) || 0,
        oldestPendingAge: row.oldest_pending_age_seconds
          ? Math.round(row.oldest_pending_age_seconds)
          : null,
        avgProcessingTime: parseFloat(row.avg_processing_time_seconds) || 0,
      };
    } catch (error) {
      logger.error('Failed to get queue health', {
        error: (error as Error).message,
      });

      return {
        totalPending: 0,
        totalProcessing: 0,
        totalFailed: 0,
        oldestPendingAge: null,
        avgProcessingTime: 0,
      };
    }
  }

  /**
   * Clean up old completed/failed items
   */
  public async cleanup(daysToKeep: number = 30): Promise<number> {
    const query = `
      DELETE FROM notification_queue
      WHERE (status = 'completed' OR status = 'failed')
        AND updated_at < CURRENT_TIMESTAMP - INTERVAL '${daysToKeep} days'
      RETURNING id;
    `;

    try {
      const result = await this.pool.query(query);
      logger.info('Queue cleanup completed', {
        deletedCount: result.rows.length,
        daysToKeep,
      });
      return result.rows.length;
    } catch (error) {
      logger.error('Failed to clean up queue', {
        error: (error as Error).message,
      });
      return 0;
    }
  }
}
