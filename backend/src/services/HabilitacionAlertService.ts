/**
 * Habilitación Alert Service
 * Verifica diariamente los prestadores con habilitación próxima a vencer.
 *
 * Alertas por HITOS (cada una se dispara una sola vez por prestador):
 *   - 30 días restantes → severity: medium
 *   - 15 días restantes → severity: high
 *   -  7 días restantes → severity: critical
 *   -  0 días (hoy)    → severity: critical
 *
 * Después del vencimiento ya no se envían más alertas.
 */

import { Pool } from 'pg';
import { NotificationService } from './NotificationService.js';
import { logger } from '../utils/logger.js';

// Hitos en días y su configuración
const MILESTONES: Array<{
  days: number;
  tolerance: number; // margen de días para capturar el hito aunque el cron corra tarde
  severity: 'medium' | 'high' | 'critical';
  type: string;
}> = [
  { days: 30, tolerance: 2, severity: 'medium',   type: 'habilitacion.vencimiento.30d' },
  { days: 15, tolerance: 2, severity: 'high',     type: 'habilitacion.vencimiento.15d' },
  { days: 7,  tolerance: 1, severity: 'critical', type: 'habilitacion.vencimiento.7d'  },
  { days: 0,  tolerance: 0, severity: 'critical', type: 'habilitacion.vencimiento.0d'  },
];

export class HabilitacionAlertService {
  constructor(
    private pool: Pool,
    private notificationService: NotificationService
  ) {}

  /**
   * Recorre todos los hitos y emite las alertas que aún no se hayan enviado.
   */
  async checkAndNotify(): Promise<void> {
    logger.info('HabilitacionAlertService: iniciando verificación por hitos');

    try {
      for (const milestone of MILESTONES) {
        await this.checkMilestone(milestone);
      }
      logger.info('HabilitacionAlertService: verificación completada');
    } catch (error) {
      logger.error('HabilitacionAlertService: error en verificación', {
        error: (error as Error).message,
      });
    }
  }

  private async checkMilestone(milestone: typeof MILESTONES[0]): Promise<void> {
    // Rango: exactamente en el hito ± tolerancia de días
    const { rows: providers } = await this.pool.query<{
      id: string;
      legal_name: string;
      habilitacion_fecha_vencimiento: Date;
      days_remaining: number;
    }>(`
      SELECT
        p.id,
        p.legal_name,
        p.habilitacion_fecha_vencimiento,
        (p.habilitacion_fecha_vencimiento::date - CURRENT_DATE) AS days_remaining
      FROM providers p
      WHERE p.habilitacion_fecha_vencimiento IS NOT NULL
        AND p.status = 'active'
        AND (p.habilitacion_fecha_vencimiento::date - CURRENT_DATE)
            BETWEEN $1 AND $2
    `, [milestone.days, milestone.days + milestone.tolerance]);

    for (const provider of providers) {
      const alreadyNotified = await this.wasAlreadyNotifiedForMilestone(provider.id, milestone.type);
      if (alreadyNotified) continue;

      const days = Number(provider.days_remaining);
      const { title, message } = this.buildMessages(provider.legal_name, provider.habilitacion_fecha_vencimiento, days, milestone.days);

      const data = {
        provider_id: provider.id,
        provider_name: provider.legal_name,
        fecha_vencimiento: provider.habilitacion_fecha_vencimiento,
        days_remaining: days,
        milestone_days: milestone.days,
      };

      await this.notifyProviderUsers(provider.id, milestone.severity, milestone.type, title, message, data);

      await this.notificationService.broadcastToAuditors(
        milestone.type,
        milestone.severity,
        title,
        message,
        data
      );

      logger.info(`HabilitacionAlertService: hito ${milestone.type} enviado para ${provider.legal_name}`);
    }
  }

  private buildMessages(
    name: string,
    fechaVenc: Date,
    daysRemaining: number,
    milestoneDays: number
  ): { title: string; message: string } {
    const fecha = new Date(fechaVenc).toLocaleDateString('es-CO', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    if (milestoneDays === 0) {
      return {
        title: `⚠️ Habilitación vence HOY — ${name}`,
        message: `La habilitación de ${name} vence hoy (${fecha}). Renuévela de inmediato para evitar suspensión.`,
      };
    }

    const tag = milestoneDays === 30 ? '🔔' : milestoneDays === 15 ? '⚠️' : '🚨';
    return {
      title: `${tag} Habilitación vence en ${daysRemaining} días — ${name}`,
      message: `La habilitación de ${name} vence el ${fecha}. Quedan ${daysRemaining} día${daysRemaining === 1 ? '' : 's'} para renovarla.`,
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

  /**
   * Verifica si ya se envió la alerta de este hito específico para este prestador.
   * Usa el `type` como identificador del hito — cada hito tiene su propio type.
   */
  private async wasAlreadyNotifiedForMilestone(providerId: string, type: string): Promise<boolean> {
    const { rows } = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM notifications
       WHERE provider_id = $1 AND type = $2`,
      [providerId, type]
    );
    return parseInt(rows[0].count, 10) > 0;
  }

  /**
   * Inicia el cron diario a las 8am.
   * También ejecuta una verificación inicial 5 segundos después de arrancar.
   */
  startDailyCheck(): void {
    const now = new Date();
    const next8am = new Date(now);
    next8am.setHours(8, 0, 0, 0);
    if (next8am <= now) next8am.setDate(next8am.getDate() + 1);

    const msUntil8am = next8am.getTime() - now.getTime();
    logger.info(`HabilitacionAlertService: próxima verificación en ${Math.round(msUntil8am / 60000)} minutos`);

    setTimeout(() => {
      this.checkAndNotify();
      setInterval(() => this.checkAndNotify(), 24 * 60 * 60 * 1000);
    }, msUntil8am);

    // Verificación inicial al arrancar
    setTimeout(() => this.checkAndNotify(), 5000);
  }
}
