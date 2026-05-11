/**
 * Notifications Routes
 * GET  /api/notifications              — listar notificaciones del usuario autenticado
 * GET  /api/notifications/unread-count — conteo de no leídas
 * PUT  /api/notifications/:id/read     — marcar una como leída
 * PUT  /api/notifications/mark-all-read — marcar todas como leídas
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { NotificationService } from '../services/NotificationService.js';

export function createNotificationsRouter(pool: Pool): Router {
  const router = Router();
  const notificationService = new NotificationService(pool);

  // Todas las rutas requieren autenticación
  router.use(authMiddleware);

  const getUserId = (req: Request): string | null =>
    (req as any).user?.user_id ?? null;

  // GET /api/notifications
  router.get('/', async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'No autenticado' });

    const limit = Math.min(parseInt(String(req.query.limit || '30')), 100);
    const offset = parseInt(String(req.query.offset || '0'));
    const isRead = req.query.unread === 'true' ? false : undefined;

    try {
      const result = await notificationService.getNotifications(userId, limit, offset, { isRead });
      return res.json(result);
    } catch {
      return res.status(500).json({ error: 'Error al obtener notificaciones' });
    }
  });

  // GET /api/notifications/unread-count
  router.get('/unread-count', async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'No autenticado' });

    try {
      const count = await notificationService.getUnreadCount(userId);
      return res.json({ count });
    } catch {
      return res.status(500).json({ error: 'Error al obtener conteo' });
    }
  });

  // PUT /api/notifications/mark-all-read  (debe ir ANTES de /:id/read)
  router.put('/mark-all-read', async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'No autenticado' });

    try {
      await pool.query(
        `UPDATE notifications SET is_read = true, read_at = NOW() WHERE user_id = $1 AND is_read = false`,
        [userId]
      );
      return res.json({ success: true });
    } catch {
      return res.status(500).json({ error: 'Error al marcar notificaciones' });
    }
  });

  // PUT /api/notifications/:id/read
  router.put('/:id/read', async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'No autenticado' });

    try {
      await notificationService.markAsRead(req.params.id, userId);
      return res.json({ success: true });
    } catch {
      return res.status(500).json({ error: 'Error al marcar notificación' });
    }
  });

  return router;
}
