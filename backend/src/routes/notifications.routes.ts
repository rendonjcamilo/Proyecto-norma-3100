/**
 * Notifications API Routes
 * Handles notification queries, preferences, and acknowledgements
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { NotificationService } from '../services/NotificationService.js';
import { WebSocketManager } from '../socket/websocket-manager.js';
import { logger } from '../utils/logger.js';

// Extend Express Request with auth info
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      role?: string;
      providerId?: string;
    }
  }
}

export function createNotificationsRouter(
  pool: Pool,
  wsManager?: WebSocketManager
): Router {
  const router = Router();
  const notificationService = new NotificationService(pool, wsManager);

  // Middleware: Check authentication (basic example)
  const checkAuth = (req: Request, res: Response, next: Function) => {
    // In production, validate JWT token
    const userId = req.headers['x-user-id'] as string;
    const role = req.headers['x-user-role'] as string;
    const providerId = req.headers['x-provider-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    req.userId = userId;
    req.role = role;
    req.providerId = providerId;
    next();
  };

  router.use(checkAuth);

  /**
   * GET /api/notifications
   * Get user's notifications with pagination and filters
   */
  router.get('/notifications', async (req: Request, res: Response) => {
    try {
      const userId = req.userId!;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = parseInt(req.query.offset as string) || 0;
      const type = req.query.type as string;
      const severity = req.query.severity as string;
      const isRead = req.query.isRead as string;

      const filters: any = {};
      if (type) filters.type = type;
      if (severity) filters.severity = severity;
      if (isRead !== undefined) filters.isRead = isRead === 'true';

      const { notifications, total } = await notificationService.getNotifications(
        userId,
        limit,
        offset,
        filters
      );

      res.json({
        notifications,
        pagination: {
          limit,
          offset,
          total,
          hasMore: offset + limit < total,
        },
      });
    } catch (error) {
      logger.error(`Failed to get notifications`, { error: (error as Error).message });
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  });

  /**
   * GET /api/notifications/:id
   * Get a specific notification
   */
  router.get('/notifications/:id', async (req: Request, res: Response) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const query = `
        SELECT * FROM notifications
        WHERE id = $1 AND user_id = $2;
      `;

      const result = await pool.query(query, [id, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      logger.error(`Failed to get notification`, { error: (error as Error).message });
      res.status(500).json({ error: 'Failed to fetch notification' });
    }
  });

  /**
   * PUT /api/notifications/:id/read
   * Mark notification as read
   */
  router.put('/notifications/:id/read', async (req: Request, res: Response) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      await notificationService.markAsRead(id, userId);

      res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
      logger.error(`Failed to mark notification as read`, {
        error: (error as Error).message,
      });
      res.status(500).json({ error: 'Failed to update notification' });
    }
  });

  /**
   * PUT /api/notifications/:id/acknowledge
   * Mark notification as acknowledged
   */
  router.put('/notifications/:id/acknowledge', async (req: Request, res: Response) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      await notificationService.acknowledgeNotification(id, userId, userId);

      res.json({ success: true, message: 'Notification acknowledged' });
    } catch (error) {
      logger.error(`Failed to acknowledge notification`, {
        error: (error as Error).message,
      });
      res.status(500).json({ error: 'Failed to update notification' });
    }
  });

  /**
   * GET /api/notifications/unread/count
   * Get unread notification count
   */
  router.get('/notifications/unread/count', async (req: Request, res: Response) => {
    try {
      const userId = req.userId!;

      const count = await notificationService.getUnreadCount(userId);

      res.json({ unreadCount: count });
    } catch (error) {
      logger.error(`Failed to get unread count`, { error: (error as Error).message });
      res.status(500).json({ error: 'Failed to fetch unread count' });
    }
  });

  /**
   * GET /api/notifications/preferences
   * Get user's notification preferences
   */
  router.get('/notifications/preferences', async (req: Request, res: Response) => {
    try {
      const userId = req.userId!;

      const preferences = await notificationService.getPreferences(userId);

      if (!preferences) {
        return res.json({
          enable_overdue: true,
          enable_high_risk: true,
          enable_verification: true,
          min_severity: 'medium',
        });
      }

      res.json(preferences);
    } catch (error) {
      logger.error(`Failed to get preferences`, { error: (error as Error).message });
      res.status(500).json({ error: 'Failed to fetch preferences' });
    }
  });

  /**
   * PUT /api/notifications/preferences
   * Update user's notification preferences
   */
  router.put('/notifications/preferences', async (req: Request, res: Response) => {
    try {
      const userId = req.userId!;
      const {
        enable_overdue,
        enable_high_risk,
        enable_verification,
        min_severity,
        quiet_hours_start,
        quiet_hours_end,
      } = req.body;

      const preferences = await notificationService.updatePreferences(userId, {
        enable_overdue,
        enable_high_risk,
        enable_verification,
        min_severity,
        quiet_hours_start,
        quiet_hours_end,
      });

      res.json({
        success: true,
        message: 'Preferences updated',
        preferences,
      });
    } catch (error) {
      logger.error(`Failed to update preferences`, { error: (error as Error).message });
      res.status(500).json({ error: 'Failed to update preferences' });
    }
  });

  /**
   * DELETE /api/notifications/:id
   * Delete a notification
   */
  router.delete('/notifications/:id', async (req: Request, res: Response) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const query = `
        DELETE FROM notifications
        WHERE id = $1 AND user_id = $2;
      `;

      await pool.query(query, [id, userId]);

      res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
      logger.error(`Failed to delete notification`, { error: (error as Error).message });
      res.status(500).json({ error: 'Failed to delete notification' });
    }
  });

  /**
   * POST /api/notifications/test
   * Send test notification (for development)
   */
  router.post('/notifications/test', async (req: Request, res: Response) => {
    try {
      const userId = req.userId!;
      const providerId = req.providerId!;

      const notification = await notificationService.createNotification(
        userId,
        'test',
        'medium',
        'Notificación de Prueba',
        'Esta es una notificación de prueba del sistema.',
        providerId,
        undefined,
        undefined,
        { test: true }
      );

      await notificationService.sendNotification(userId, notification, providerId);

      res.json({
        success: true,
        message: 'Test notification sent',
        notification,
      });
    } catch (error) {
      logger.error(`Failed to send test notification`, {
        error: (error as Error).message,
      });
      res.status(500).json({ error: 'Failed to send test notification' });
    }
  });

  /**
   * GET /api/notifications/stats/dashboard
   * Get notification stats for dashboard
   */
  router.get('/notifications/stats/dashboard', async (req: Request, res: Response) => {
    try {
      const query = `
        SELECT * FROM notification_stats_dashboard;
      `;

      const result = await pool.query(query);
      const stats = result.rows[0] || {};

      res.json(stats);
    } catch (error) {
      logger.error(`Failed to get notification stats`, {
        error: (error as Error).message,
      });
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  });

  /**
   * GET /api/notifications/stats/performance
   * Get notification performance metrics
   */
  router.get('/notifications/stats/performance', async (req: Request, res: Response) => {
    try {
      const query = `
        SELECT * FROM notification_performance;
      `;

      const result = await pool.query(query);

      res.json({
        metrics: result.rows,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(`Failed to get performance stats`, {
        error: (error as Error).message,
      });
      res.status(500).json({ error: 'Failed to fetch performance metrics' });
    }
  });

  return router;
}
