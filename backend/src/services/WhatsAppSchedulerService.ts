/**
 * WhatsApp Scheduler Service
 * Envía los mensajes de whatsapp_scheduled_messages que quedaron en cola por haberse creado
 * fuera de horario laboral (ver backend/src/utils/businessHours.ts y whatsapp.routes.ts).
 * Corre cada 15 minutos; solo procesa la cola cuando el momento actual ya está en horario laboral.
 */

import { Pool } from 'pg';
import cron from 'node-cron';
import { WhatsAppService } from './WhatsAppService.js';
import { isBusinessHours } from '../utils/businessHours.js';
import { logger } from '../utils/logger.js';

export class WhatsAppSchedulerService {
  private whatsAppService: WhatsAppService;

  constructor(private pool: Pool) {
    this.whatsAppService = new WhatsAppService();
  }

  async flushPending(): Promise<void> {
    if (!isBusinessHours()) return;

    const { rows: pending } = await this.pool.query<{
      id: string;
      auditor_user_id: string;
      phone: string;
      message: string;
    }>(
      `SELECT id, auditor_user_id, phone, message
       FROM whatsapp_scheduled_messages
       WHERE status = 'pending' AND scheduled_for <= NOW()
       ORDER BY scheduled_for ASC
       LIMIT 50`
    );

    if (pending.length === 0) return;

    logger.info({ msg: 'WhatsAppSchedulerService: enviando mensajes en cola', count: pending.length });

    for (const item of pending) {
      try {
        await this.whatsAppService.sendText(item.auditor_user_id, item.phone, item.message);
        await this.pool.query(
          `UPDATE whatsapp_scheduled_messages SET status = 'sent', sent_at = NOW() WHERE id = $1`,
          [item.id]
        );
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'WhatsAppSchedulerService: fallo al enviar mensaje en cola', id: item.id, error: msg });
        await this.pool.query(
          `UPDATE whatsapp_scheduled_messages SET status = 'failed', error = $2 WHERE id = $1`,
          [item.id, msg]
        );
      }
    }
  }

  startScheduler(): void {
    cron.schedule('*/15 * * * *', () => {
      void this.flushPending();
    });
  }
}
