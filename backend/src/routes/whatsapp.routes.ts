/**
 * WhatsApp Routes — Envío automático vía Evolution API (Baileys)
 * Requiere Evolution API corriendo en el mismo docker-compose
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { rbacMiddleware } from '../middleware/role.middleware.js';
import { WhatsAppService } from '../services/WhatsAppService.js';
import { logger } from '../utils/logger.js';

export function createWhatsAppRouter(): Router {
  const router = Router();
  const waService = new WhatsAppService();

  /**
   * GET /api/whatsapp/status
   * Estado de conexión de la instancia WhatsApp
   * Roles: auditor, super_admin
   */
  router.get(
    '/whatsapp/status',
    authMiddleware,
    rbacMiddleware(['auditor', 'super_admin']),
    async (_req: Request, res: Response) => {
      try {
        const status = await waService.getConnectionState();
        res.json({ data: status });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error fetching WhatsApp status', error: msg });
        res.status(500).json({ error: msg });
      }
    }
  );

  /**
   * GET /api/whatsapp/qr
   * Obtiene el QR para parear la instancia WhatsApp (setup inicial)
   * Roles: auditor, super_admin
   */
  router.get(
    '/whatsapp/qr',
    authMiddleware,
    rbacMiddleware(['auditor', 'super_admin']),
    async (_req: Request, res: Response) => {
      try {
        const qr = await waService.getQR();
        res.json({ data: qr });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error fetching WhatsApp QR', error: msg });
        res.status(500).json({ error: msg });
      }
    }
  );

  /**
   * POST /api/whatsapp/send
   * Envía un mensaje de texto a un número de WhatsApp
   * Roles: auditor, super_admin
   * Body: { phone: string, message: string }
   */
  router.post(
    '/whatsapp/send',
    authMiddleware,
    rbacMiddleware(['auditor', 'super_admin']),
    async (req: Request, res: Response) => {
      try {
        const { phone, message } = req.body as { phone?: string; message?: string };

        if (!phone || typeof phone !== 'string' || !phone.trim()) {
          return res.status(400).json({ error: 'phone es requerido' });
        }
        if (!message || typeof message !== 'string' || !message.trim()) {
          return res.status(400).json({ error: 'message es requerido' });
        }

        const result = await waService.sendText(phone.trim(), message.trim());

        logger.info({
          msg: 'WhatsApp message sent',
          phone: phone.trim().slice(0, 6) + '***',
          messageId: result.messageId,
          sentBy: req.user?.user_id,
        });

        res.json({ data: result, message: 'Mensaje enviado correctamente' });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error sending WhatsApp message', error: msg });
        res.status(500).json({ error: msg });
      }
    }
  );

  return router;
}
