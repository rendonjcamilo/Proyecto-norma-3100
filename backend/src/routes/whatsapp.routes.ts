/**
 * WhatsApp Routes — Envío automático vía Evolution API (Baileys)
 * Cada auditor tiene su propia instancia identificada por su user_id
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { rbacMiddleware } from '../middleware/role.middleware.js';
import { WhatsAppService } from '../services/WhatsAppService.js';
import { logger } from '../utils/logger.js';

export function createWhatsAppRouter(pool: Pool): Router {
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
   * Envía un mensaje usando la instancia WhatsApp del auditor autenticado.
   * Body: { phone, message, provider_nit?, provider_name? }
   * Registra el envío en whatsapp_message_log para control de duplicados.
   */
  router.post(
    '/whatsapp/send',
    authMiddleware,
    rbacMiddleware(['auditor', 'super_admin']),
    async (req: Request, res: Response) => {
      const userId = req.user?.user_id;
      if (!userId) {return res.status(401).json({ error: 'Usuario no autenticado' });}
      try {
        const { phone, message, provider_nit, provider_name } = req.body as {
          phone?: string;
          message?: string;
          provider_nit?: string;
          provider_name?: string;
        };

        if (!phone || typeof phone !== 'string' || !phone.trim()) {
          return res.status(400).json({ error: 'phone es requerido' });
        }
        if (!message || typeof message !== 'string' || !message.trim()) {
          return res.status(400).json({ error: 'message es requerido' });
        }

        const result = await waService.sendText(userId, phone.trim(), message.trim());

        // Registrar el envío para control de duplicados (sin bloquear la respuesta si falla)
        const preview = message.trim().slice(0, 120);
        pool.query(
          `INSERT INTO whatsapp_message_log
             (auditor_user_id, phone_number, provider_nit, provider_name, message_preview)
           VALUES ($1, $2, $3, $4, $5)`,
          [userId, phone.trim(), provider_nit ?? null, provider_name ?? null, preview]
        ).catch((err: Error) =>
          logger.warn({ msg: 'No se pudo registrar en whatsapp_message_log', error: err.message })
        );

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

  /**
   * GET /api/whatsapp/recent-sends
   * Devuelve los envíos de los últimos 30 días para una lista de teléfonos.
   * Query: phones=573001234567,573009876543 (separados por coma)
   * Respuesta: { data: { "57300...": { sent_at, days_ago, provider_name } } }
   */
  router.get(
    '/whatsapp/recent-sends',
    authMiddleware,
    rbacMiddleware(['auditor', 'super_admin']),
    async (req: Request, res: Response) => {
      const userId = req.user?.user_id;
      if (!userId) { return res.status(401).json({ error: 'Usuario no autenticado' }); }
      try {
        const phonesRaw = req.query.phones as string | undefined;
        if (!phonesRaw || !phonesRaw.trim()) {
          return res.json({ data: {} });
        }

        const phones = phonesRaw.split(',').map(p => p.trim()).filter(Boolean).slice(0, 500);
        if (!phones.length) { return res.json({ data: {} }); }

        // Por cada teléfono devuelve solo el envío más reciente dentro de 30 días
        const result = await pool.query<{
          phone_number: string;
          sent_at: string;
          provider_name: string | null;
          days_ago: number;
        }>(
          `SELECT DISTINCT ON (phone_number)
             phone_number,
             sent_at,
             provider_name,
             EXTRACT(EPOCH FROM (NOW() - sent_at))::int / 86400 AS days_ago
           FROM whatsapp_message_log
           WHERE auditor_user_id = $1
             AND phone_number = ANY($2)
             AND sent_at >= NOW() - INTERVAL '30 days'
           ORDER BY phone_number, sent_at DESC`,
          [userId, phones]
        );

        const map: Record<string, { sent_at: string; days_ago: number; provider_name: string | null }> = {};
        for (const row of result.rows) {
          map[row.phone_number] = {
            sent_at: row.sent_at,
            days_ago: Number(row.days_ago),
            provider_name: row.provider_name,
          };
        }

        res.json({ data: map });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error fetching recent WhatsApp sends', error: msg });
        res.status(500).json({ error: msg });
      }
    }
  );

  return router;
}
