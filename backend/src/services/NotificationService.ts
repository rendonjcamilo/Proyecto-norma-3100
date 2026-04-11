/**
 * Notification Service
 * Handles notification generation, storage, and delivery
 */

import { Pool, QueryResult } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { WebSocketManager, WebSocketEvent } from '../socket/websocket-manager.js';

export interface Notification {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  finding_id?: string;
  action_id?: string;
  provider_id: string;
  user_id: string;
  title: string;
  message: string;
  data: Record<string, any>;
  is_read: boolean;
  is_acknowledged: boolean;
  created_at: string;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  enable_overdue: boolean;
  enable_high_risk: boolean;
  enable_verification: boolean;
  min_severity: 'low' | 'medium' | 'high' | 'critical';
  quiet_hours_start?: string;
  quiet_hours_end?: string;
}

/**
 * Notification Service
 */
export class NotificationService {
  constructor(
    private pool: Pool,
    private wsManager?: WebSocketManager
  ) {}

  /**
   * Create a new notification
   */
  public async createNotification(
    userId: string,
    type: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    title: string,
    message: string,
    providerId: string,
    findingId?: string,
    actionId?: string,
    data?: Record<string, any>
  ): Promise<Notification> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const query = `
      INSERT INTO notifications (
        id, type, severity, finding_id, action_id, provider_id, user_id,
        title, message, data, is_read, is_acknowledged, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *;
    `;

    const values = [
      id,
      type,
      severity,
      findingId || null,
      actionId || null,
      providerId,
      userId,
      title,
      message,
      JSON.stringify(data || {}),
      false,
      false,
      now,
    ];

    try {
      const result: QueryResult<Notification> = await this.pool.query(query, values);
      const notification = result.rows[0];

      logger.info(`Notification created`, {
        id,
        userId,
        type,
        severity,
      });

      return notification;
    } catch (error) {
      logger.error(`Failed to create notification`, {
        userId,
        type,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Send notification via WebSocket
   */
  public async sendNotification(
    userId: string,
    notification: Notification,
    providerId: string
  ): Promise<void> {
    if (!this.wsManager) {
      logger.warn(`WebSocket manager not available`);
      return;
    }

    const event: WebSocketEvent = {
      id: notification.id,
      type: notification.type as any,
      severity: notification.severity,
      findingId: notification.finding_id,
      actionId: notification.action_id,
      providerId,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      timestamp: notification.created_at,
    };

    this.wsManager.sendToUser(userId, event);
  }

  /**
   * Get user notifications with pagination
   */
  public async getNotifications(
    userId: string,
    limit: number = 20,
    offset: number = 0,
    filters?: {
      type?: string;
      severity?: string;
      isRead?: boolean;
    }
  ): Promise<{ notifications: Notification[]; total: number }> {
    let query = `
      SELECT * FROM notifications
      WHERE user_id = $1
    `;
    const values: any[] = [userId];
    let paramIndex = 2;

    // Add filters
    if (filters?.type) {
      query += ` AND type = $${paramIndex}`;
      values.push(filters.type);
      paramIndex++;
    }

    if (filters?.severity) {
      query += ` AND severity = $${paramIndex}`;
      values.push(filters.severity);
      paramIndex++;
    }

    if (filters?.isRead !== undefined) {
      query += ` AND is_read = $${paramIndex}`;
      values.push(filters.isRead);
      paramIndex++;
    }

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
    const countResult = await this.pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated results
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    try {
      const result = await this.pool.query<Notification>(query, values);
      return {
        notifications: result.rows,
        total,
      };
    } catch (error) {
      logger.error(`Failed to fetch notifications`, {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  public async markAsRead(notificationId: string, userId: string): Promise<void> {
    const query = `
      UPDATE notifications
      SET is_read = true, read_at = NOW()
      WHERE id = $1 AND user_id = $2;
    `;

    try {
      await this.pool.query(query, [notificationId, userId]);
      logger.debug(`Notification marked as read`, { notificationId, userId });
    } catch (error) {
      logger.error(`Failed to mark notification as read`, {
        notificationId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Mark notification as acknowledged
   */
  public async acknowledgeNotification(
    notificationId: string,
    userId: string,
    acknowledgedBy?: string
  ): Promise<void> {
    const query = `
      UPDATE notifications
      SET is_acknowledged = true, acknowledged_at = NOW(), acknowledged_by = $1
      WHERE id = $2 AND user_id = $3;
    `;

    try {
      await this.pool.query(query, [acknowledgedBy || userId, notificationId, userId]);
      logger.debug(`Notification acknowledged`, { notificationId, userId });
    } catch (error) {
      logger.error(`Failed to acknowledge notification`, {
        notificationId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  public async getUnreadCount(userId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = $1 AND is_read = false;
    `;

    try {
      const result = await this.pool.query(query, [userId]);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error(`Failed to get unread count`, {
        userId,
        error: (error as Error).message,
      });
      return 0;
    }
  }

  /**
   * Get notification preferences
   */
  public async getPreferences(userId: string): Promise<NotificationPreference | null> {
    const query = `
      SELECT * FROM notification_preferences
      WHERE user_id = $1;
    `;

    try {
      const result = await this.pool.query<NotificationPreference>(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Failed to get preferences`, {
        userId,
        error: (error as Error).message,
      });
      return null;
    }
  }

  /**
   * Update notification preferences
   */
  public async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreference>
  ): Promise<NotificationPreference> {
    const id = uuidv4();
    const now = new Date().toISOString();

    // Try to update existing preferences
    let query = `
      UPDATE notification_preferences
      SET enable_overdue = COALESCE($2, enable_overdue),
          enable_high_risk = COALESCE($3, enable_high_risk),
          enable_verification = COALESCE($4, enable_verification),
          min_severity = COALESCE($5, min_severity),
          quiet_hours_start = COALESCE($6, quiet_hours_start),
          quiet_hours_end = COALESCE($7, quiet_hours_end)
      WHERE user_id = $1
      RETURNING *;
    `;

    try {
      let result = await this.pool.query<NotificationPreference>(query, [
        userId,
        preferences.enable_overdue,
        preferences.enable_high_risk,
        preferences.enable_verification,
        preferences.min_severity,
        preferences.quiet_hours_start || null,
        preferences.quiet_hours_end || null,
      ]);

      // If no rows updated, insert new preferences
      if (result.rows.length === 0) {
        query = `
          INSERT INTO notification_preferences (
            id, user_id, enable_overdue, enable_high_risk, enable_verification,
            min_severity, quiet_hours_start, quiet_hours_end, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *;
        `;

        result = await this.pool.query<NotificationPreference>(query, [
          id,
          userId,
          preferences.enable_overdue !== undefined ? preferences.enable_overdue : true,
          preferences.enable_high_risk !== undefined ? preferences.enable_high_risk : true,
          preferences.enable_verification !== undefined ? preferences.enable_verification : true,
          preferences.min_severity || 'medium',
          preferences.quiet_hours_start || null,
          preferences.quiet_hours_end || null,
          now,
          now,
        ]);
      }

      logger.info(`Preferences updated`, { userId });
      return result.rows[0];
    } catch (error) {
      logger.error(`Failed to update preferences`, {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Check if notification should be sent based on preferences and current time
   */
  public async shouldSendNotification(
    userId: string,
    type: string,
    severity: string
  ): Promise<boolean> {
    const preferences = await this.getPreferences(userId);

    if (!preferences) {
      return true; // Default: send if no preferences
    }

    // Check severity filter
    const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
    const minLevels = { low: 1, medium: 2, high: 3, critical: 4 };

    if (
      severityLevels[severity as keyof typeof severityLevels] <
      minLevels[preferences.min_severity as keyof typeof minLevels]
    ) {
      return false;
    }

    // Check notification type enabled
    switch (type) {
      case 'action.overdue':
      case 'finding.overdue':
        if (!preferences.enable_overdue) return false;
        break;
      case 'risk.alert':
        if (!preferences.enable_high_risk) return false;
        break;
      case 'verification.required':
        if (!preferences.enable_verification) return false;
        break;
    }

    // Check quiet hours
    if (preferences.quiet_hours_start && preferences.quiet_hours_end) {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      if (
        currentTime >= preferences.quiet_hours_start &&
        currentTime <= preferences.quiet_hours_end
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Broadcast notification to provider
   */
  public async broadcastToProvider(
    providerId: string,
    type: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    title: string,
    message: string,
    data?: Record<string, any>,
    findingId?: string,
    actionId?: string
  ): Promise<void> {
    if (!this.wsManager) {
      logger.warn(`WebSocket manager not available`);
      return;
    }

    // Get all provider users
    const query = `
      SELECT DISTINCT user_id FROM notifications
      WHERE provider_id = $1
      UNION
      SELECT id FROM users WHERE provider_id = $1;
    `;

    try {
      const result = await this.pool.query(query, [providerId]);

      for (const row of result.rows) {
        const shouldSend = await this.shouldSendNotification(row.user_id || row.id, type, severity);

        if (shouldSend) {
          const notification = await this.createNotification(
            row.user_id || row.id,
            type,
            severity,
            title,
            message,
            providerId,
            findingId,
            actionId,
            data
          );

          await this.sendNotification(row.user_id || row.id, notification, providerId);
        }
      }

      logger.info(`Broadcast sent to provider`, {
        providerId,
        type,
        severity,
      });
    } catch (error) {
      logger.error(`Failed to broadcast notification`, {
        providerId,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Broadcast to all auditors
   */
  public async broadcastToAuditors(
    type: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    title: string,
    message: string,
    data?: Record<string, any>,
    findingId?: string
  ): Promise<void> {
    if (!this.wsManager) {
      logger.warn(`WebSocket manager not available`);
      return;
    }

    const query = `
      SELECT id, provider_id FROM users WHERE role = 'auditor';
    `;

    try {
      const result = await this.pool.query(query);

      for (const row of result.rows) {
        const shouldSend = await this.shouldSendNotification(row.id, type, severity);

        if (shouldSend) {
          const notification = await this.createNotification(
            row.id,
            type,
            severity,
            title,
            message,
            row.provider_id || 'system',
            findingId,
            undefined,
            data
          );

          await this.sendNotification(row.id, notification, row.provider_id || 'system');
        }
      }

      logger.info(`Broadcast sent to auditors`, { type, severity });
    } catch (error) {
      logger.error(`Failed to broadcast to auditors`, {
        error: (error as Error).message,
      });
    }
  }
}

/**
 * Create and export notification service factory
 */
export function createNotificationService(
  pool: Pool,
  wsManager?: WebSocketManager
): NotificationService {
  return new NotificationService(pool, wsManager);
}
