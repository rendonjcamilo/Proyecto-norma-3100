/**
 * Document Expiry Alert Service
 * Verifica diariamente los documentos con fecha de vencimiento próxima.
 *
 * Alertas por HITOS (cada una se dispara una sola vez por documento):
 *   - 30 días restantes → severity: medium
 *   - 15 días restantes → severity: high
 *   -  7 días restantes → severity: critical
 *   - vence hoy (0 días) → severity: critical
 */

import { Pool } from 'pg';
import { NotificationService } from './NotificationService.js';
import { logger } from '../utils/logger.js';

const MILESTONES: Array<{
  days: number;
  tolerance: number;
  severity: 'medium' | 'high' | 'critical';
  type: string;
}> = [
  { days: 30, tolerance: 2, severity: 'medium',   type: 'document.expiry.30d' },
  { days: 15, tolerance: 2, severity: 'high',     type: 'document.expiry.15d' },
  { days: 7,  tolerance: 1, severity: 'critical', type: 'document.expiry.7d'  },
  { days: 0,  tolerance: 0, severity: 'critical', type: 'document.expiry.0d'  },
];

export class DocumentExpiryAlertService {
  constructor(
    private pool: Pool,
    private notificationService: NotificationService
  ) {}

  async checkAndNotify(): Promise<void> {
    logger.info('DocumentExpiryAlertService: iniciando verificación por hitos');
    try {
      for (const milestone of MILESTONES) {
        await this.checkMilestone(milestone);
      }
      logger.info('DocumentExpiryAlertService: verificación completada');
    } catch (error) {
      logger.error('DocumentExpiryAlertService: error en verificación', {
        error: (error as Error).message,
      });
    }
  }

  private async checkMilestone(milestone: typeof MILESTONES[0]): Promise<void> {
    const { rows: docs } = await this.pool.query<{
      document_id: string;
      document_name: string;
      provider_id: string;
      provider_name: string;
      expiry_date: Date;
      days_remaining: number;
    }>(`
      SELECT
        pd.id                               AS document_id,
        dc.name                             AS document_name,
        pd.provider_id,
        p.legal_name                        AS provider_name,
        pd.expiry_date,
        (pd.expiry_date::date - CURRENT_DATE) AS days_remaining
      FROM provider_documents pd
      JOIN document_catalog dc ON dc.id = pd.document_catalog_id
      JOIN providers p          ON p.id  = pd.provider_id
      WHERE pd.expiry_date IS NOT NULL
        AND pd.status NOT IN ('expired', 'not_applicable')
        AND (pd.expiry_date::date - CURRENT_DATE) BETWEEN $1 AND $2
    `, [milestone.days, milestone.days + milestone.tolerance]);

    for (const doc of docs) {
      // El tipo de notificación incluye el ID del documento para que sea único por hito+documento
      const notifType = `${milestone.type}:${doc.document_id}`;
      const alreadyNotified = await this.wasAlreadyNotified(doc.provider_id, notifType);
      if (alreadyNotified) { continue; }

      const days = Number(doc.days_remaining);
      const fecha = new Date(doc.expiry_date).toLocaleDateString('es-CO', {
        year: 'numeric', month: 'long', day: 'numeric',
      });

      const { title, message } = this.buildMessages(doc.document_name, doc.provider_name, fecha, days, milestone.days);
      const data = {
        document_id:    doc.document_id,
        document_name:  doc.document_name,
        provider_id:    doc.provider_id,
        provider_name:  doc.provider_name,
        expiry_date:    doc.expiry_date,
        days_remaining: days,
        milestone_days: milestone.days,
      };

      await this.notifyProviderUsers(doc.provider_id, milestone.severity, notifType, title, message, data);
      await this.notificationService.broadcastToAuditors(notifType, milestone.severity, title, message, data);

      logger.info(`DocumentExpiryAlertService: alerta ${notifType} enviada para "${doc.document_name}" (${doc.provider_name})`);
    }
  }

  private buildMessages(
    docName: string,
    providerName: string,
    fecha: string,
    daysRemaining: number,
    milestoneDays: number
  ): { title: string; message: string } {
    if (milestoneDays === 0) {
      return {
        title:   `⚠️ Documento vence HOY — ${docName}`,
        message: `El documento "${docName}" del prestador ${providerName} vence hoy (${fecha}). Actualícelo de inmediato.`,
      };
    }
    const tag = milestoneDays === 30 ? '🔔' : milestoneDays === 15 ? '⚠️' : '🚨';
    return {
      title:   `${tag} Documento vence en ${daysRemaining} días — ${docName}`,
      message: `El documento "${docName}" del prestador ${providerName} vence el ${fecha}. Quedan ${daysRemaining} día${daysRemaining === 1 ? '' : 's'} para renovarlo.`,
    };
  }

  private async notifyProviderUsers(
    providerId: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    type: string,
    title: string,
    message: string,
    data: Record<string, any>
  ): Promise<void> {
    const { rows: users } = await this.pool.query<{ id: string }>(
      `SELECT id FROM users WHERE provider_id = $1 AND role = 'provider_admin' AND status = 'active'`,
      [providerId]
    );
    for (const user of users) {
      await this.notificationService.createNotification(
        user.id, type, severity, title, message, providerId,
        undefined, undefined, data
      );
    }
  }

  private async wasAlreadyNotified(providerId: string, type: string): Promise<boolean> {
    const { rows } = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM notifications WHERE provider_id = $1 AND type = $2`,
      [providerId, type]
    );
    return parseInt(rows[0].count, 10) > 0;
  }

  /**
   * Inicia el cron diario a las 8am (hora servidor).
   * También ejecuta una verificación inicial 10 segundos después de arrancar.
   */
  startDailyCheck(): void {
    const now = new Date();
    const next8am = new Date(now);
    next8am.setHours(8, 0, 0, 0);
    if (next8am <= now) { next8am.setDate(next8am.getDate() + 1); }

    const msUntil8am = next8am.getTime() - now.getTime();
    logger.info(`DocumentExpiryAlertService: próxima verificación en ${Math.round(msUntil8am / 60000)} minutos`);

    setTimeout(() => {
      void this.checkAndNotify();
      setInterval(() => { void this.checkAndNotify(); }, 24 * 60 * 60 * 1000);
    }, msUntil8am);

    // Verificación inicial al arrancar (10s de margen para que el pool esté listo)
    setTimeout(() => { void this.checkAndNotify(); }, 10_000);
  }
}
