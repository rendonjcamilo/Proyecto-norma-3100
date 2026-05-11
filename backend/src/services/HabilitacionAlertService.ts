/**
 * Habilitación Alert Service
 * Verifica diariamente los prestadores con habilitación próxima a vencer (≤30 días)
 * y crea notificaciones in-app para provider_admin y auditores.
 */

import { Pool } from 'pg';
import { NotificationService } from './NotificationService.js';
import { logger } from '../utils/logger.js';

export class HabilitacionAlertService {
  constructor(
    private pool: Pool,
    private notificationService: NotificationService
  ) {}

  /**
   * Busca prestadores con habilitación venciendo en los próximos 30 días
   * y crea notificaciones. Evita duplicados (máx. 1 alerta por prestador por día).
   */
  async checkAndNotify(): Promise<void> {
    logger.info('HabilitacionAlertService: iniciando verificación de vencimientos');

    try {
      // Prestadores con vencimiento entre hoy y 30 días adelante
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
          AND p.habilitacion_fecha_vencimiento::date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
          AND p.status = 'active'
        ORDER BY p.habilitacion_fecha_vencimiento ASC
      `);

      if (providers.length === 0) {
        logger.info('HabilitacionAlertService: ningún prestador próximo a vencer');
        return;
      }

      logger.info(`HabilitacionAlertService: ${providers.length} prestadores próximos a vencer`);

      for (const provider of providers) {
        const days = Number(provider.days_remaining);
        const alreadyNotified = await this.wasNotifiedToday(provider.id);
        if (alreadyNotified) continue;

        const severity = days <= 7 ? 'critical' : days <= 15 ? 'high' : 'medium';
        const title = days === 0
          ? `¡Habilitación vence HOY! — ${provider.legal_name}`
          : `Habilitación vence en ${days} día${days === 1 ? '' : 's'} — ${provider.legal_name}`;
        const message = days === 0
          ? `La habilitación del prestador ${provider.legal_name} vence el día de hoy. Renuévela inmediatamente.`
          : `La habilitación del prestador ${provider.legal_name} vence el ${new Date(provider.habilitacion_fecha_vencimiento).toLocaleDateString('es-CO')}. Quedan ${days} día${days === 1 ? '' : 's'} para renovarla.`;

        const data = {
          provider_id: provider.id,
          provider_name: provider.legal_name,
          fecha_vencimiento: provider.habilitacion_fecha_vencimiento,
          days_remaining: days,
          alert_type: 'habilitacion_vencimiento',
        };

        // Notificar a los usuarios del prestador (provider_admin)
        await this.notifyProviderUsers(provider.id, severity as any, title, message, data);

        // Notificar a todos los auditores
        await this.notificationService.broadcastToAuditors(
          'habilitacion.vencimiento',
          severity as any,
          title,
          message,
          data
        );
      }

      logger.info('HabilitacionAlertService: verificación completada');
    } catch (error) {
      logger.error('HabilitacionAlertService: error en verificación', {
        error: (error as Error).message,
      });
    }
  }

  private async notifyProviderUsers(
    providerId: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
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
        user.id,
        'habilitacion.vencimiento',
        severity,
        title,
        message,
        providerId,
        undefined,
        undefined,
        data
      );
    }
  }

  /**
   * Verifica si ya se envió una alerta de habilitación para este prestador hoy.
   */
  private async wasNotifiedToday(providerId: string): Promise<boolean> {
    const { rows } = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM notifications
       WHERE provider_id = $1
         AND type = 'habilitacion.vencimiento'
         AND created_at::date = CURRENT_DATE`,
      [providerId]
    );
    return parseInt(rows[0].count, 10) > 0;
  }

  /**
   * Inicia el cron diario. Corre a las 8am la primera vez (espera hasta las 8am)
   * y luego cada 24 horas.
   */
  startDailyCheck(): void {
    const runAt8am = () => {
      const now = new Date();
      const next8am = new Date(now);
      next8am.setHours(8, 0, 0, 0);
      if (next8am <= now) {
        next8am.setDate(next8am.getDate() + 1);
      }
      const msUntil8am = next8am.getTime() - now.getTime();

      logger.info(`HabilitacionAlertService: próxima verificación en ${Math.round(msUntil8am / 60000)} minutos`);

      setTimeout(() => {
        this.checkAndNotify();
        setInterval(() => this.checkAndNotify(), 24 * 60 * 60 * 1000);
      }, msUntil8am);
    };

    // También ejecutar una vez al arrancar (con 5s de delay para que la BD esté lista)
    setTimeout(() => this.checkAndNotify(), 5000);
    runAt8am();
  }
}
