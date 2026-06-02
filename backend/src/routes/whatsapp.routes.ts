/**
 * WhatsApp Routes — Envío automático vía Evolution API (Baileys)
 * Cada auditor tiene su propia instancia identificada por su user_id
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
   * Estado de conexión de la instancia WhatsApp del auditor autenticado
   */
  router.get(
    '/whatsapp/status',
    authMiddleware,
    rbacMiddleware(['auditor', 'super_admin']),
    async (req: Request, res: Response) => {
      const userId = req.user?.user_id;
      if (!userId) {return res.status(401).json({ error: 'Usuario no autenticado' });}
      try {
        const status = await waService.getConnectionState(userId);
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
   * Obtiene el QR para parear la instancia WhatsApp del auditor autenticado
   */
  router.get(
    '/whatsapp/qr',
    authMiddleware,
    rbacMiddleware(['auditor', 'super_admin']),
    async (req: Request, res: Response) => {
      const userId = req.user?.user_id;
      if (!userId) {return res.status(401).json({ error: 'Usuario no autenticado' });}
      try {
        const qr = await waService.getQR(userId);
        res.json({ data: qr });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error fetching WhatsApp QR', error: msg });
        res.status(500).json({ error: msg });
      }
    }
  );

  /**
   * POST /api/whatsapp/pairing-code
   * Genera código de emparejamiento para vincular WhatsApp por número de teléfono
   * Body: { phone: string } — número en formato colombiano (ej: 3001234567 o 573001234567)
   */
  router.post(
    '/whatsapp/pairing-code',
    authMiddleware,
    rbacMiddleware(['auditor', 'super_admin']),
    async (req: Request, res: Response) => {
      const userId = req.user?.user_id;
      if (!userId) { return res.status(401).json({ error: 'Usuario no autenticado' }); }
      try {
        const { phone } = req.body as { phone?: string };
        if (!phone || typeof phone !== 'string' || !phone.trim()) {
          return res.status(400).json({ error: 'phone es requerido' });
        }
        // Normalizar a formato internacional Colombia: 57XXXXXXXXXX
        const digits = phone.trim().replace(/\D/g, '');
        const normalized = digits.startsWith('57') ? digits : `57${digits}`;
        if (normalized.length < 12) {
          return res.status(400).json({ error: 'Número de teléfono inválido. Usa formato 3XXXXXXXXX o 573XXXXXXXXX' });
        }
        const result = await waService.getPairingCode(userId, normalized);
        res.json({ data: result });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error generating WhatsApp pairing code', error: msg });
        res.status(500).json({ error: msg });
      }
    }
  );

  /**
   * DELETE /api/whatsapp/disconnect
   * Cierra la sesión de WhatsApp del auditor autenticado (logout sin borrar instancia)
   */
  router.delete(
    '/whatsapp/disconnect',
    authMiddleware,
    rbacMiddleware(['auditor', 'super_admin']),
    async (req: Request, res: Response) => {
      const userId = req.user?.user_id;
      if (!userId) { return res.status(401).json({ error: 'Usuario no autenticado' }); }
      try {
        await waService.disconnect(userId);
        res.json({ message: 'WhatsApp desvinculado correctamente' });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error disconnecting WhatsApp', error: msg });
        res.status(500).json({ error: msg });
      }
    }
  );

  /**
   * POST /api/whatsapp/send
   * Envía un mensaje usando la instancia WhatsApp del auditor autenticado
   * Body: { phone: string, message: string }
   */
  router.post(
    '/whatsapp/send',
    authMiddleware,
    rbacMiddleware(['auditor', 'super_admin']),
    async (req: Request, res: Response) => {
      const userId = req.user?.user_id;
      if (!userId) {return res.status(401).json({ error: 'Usuario no autenticado' });}
      try {
        const { phone, message } = req.body as { phone?: string; message?: string };

        if (!phone || typeof phone !== 'string' || !phone.trim()) {
          return res.status(400).json({ error: 'phone es requerido' });
        }
        if (!message || typeof message !== 'string' || !message.trim()) {
          return res.status(400).json({ error: 'message es requerido' });
        }

        const result = await waService.sendText(userId, phone.trim(), message.trim());

        logger.info({
          msg: 'WhatsApp message sent',
          phone: phone.trim().slice(0, 6) + '***',
          messageId: result.messageId,
          sentBy: userId,
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
