/**
 * Medicamentos Alert Service
 * Estándar 4 — Medicamentos, Dispositivos Médicos y Tecnovigilancia
 *
 * Envía recordatorios programados para diligenciar formatos del estándar 4:
 *   - Mensual (día 1 de cada mes, 8 AM Bogotá): 5 formatos de seguimiento periódico
 *   - Trimestral (1 ene/abr/jul/oct, 8 AM Bogotá): 2 formatos de revisión de programas
 *
 * Canales: in-app (NotificationService) + email (Resend)
 * Deduplicación: el tipo incluye año-mes o año-trimestre para evitar doble envío.
 */

import { Pool } from 'pg';
import { Resend } from 'resend';
import cron from 'node-cron';
import { NotificationService } from './NotificationService.js';
import { logger } from '../utils/logger.js';

const FROM_EMAIL = process.env.EMAIL_FROM_ADDRESS || 'noreply@habilitapro.com';
const FROM_NAME  = process.env.EMAIL_FROM_NAME  || 'HabilitaPro';

const MONTHLY_FORMATS = [
  'Reporte de Farmacovigilancia',
  'Reporte de Tecnovigilancia',
  'Control de fechas de vencimiento de medicamentos',
  'Revisión de cadena de frío / temperatura',
  'Inventario de medicamentos controlados',
];

const QUARTERLY_FORMATS = [
  'Revisión del programa de Farmacovigilancia',
  'Revisión del programa de Tecnovigilancia',
];

export class MedicamentosAlertService {
  private resend?: Resend;

  constructor(
    private pool: Pool,
    private notificationService: NotificationService
  ) {
    if (process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
    }
  }

  // ── Recordatorio mensual ────────────────────────────────────────────────────
  async checkMonthly(): Promise<void> {
    const now      = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const notifType = `medicamentos.monthly.${monthKey}`;
    const monthName = now.toLocaleString('es-CO', { month: 'long', year: 'numeric' });

    logger.info(`MedicamentosAlertService: recordatorio mensual ${monthKey}`);

    try {
      const { rows: providers } = await this.pool.query<{ id: string; legal_name: string }>(
        `SELECT id, legal_name FROM providers WHERE status = 'active'`
      );

      for (const provider of providers) {
        if (await this.wasAlreadyNotified(provider.id, notifType)) { continue; }

        const title   = `💊 Formatos de Medicamentos y Dispositivos — ${monthName}`;
        const message = `Es momento de diligenciar los formatos mensuales del Estándar 4 para ${provider.legal_name}: ${MONTHLY_FORMATS.join(', ')}.`;
        const data    = { provider_id: provider.id, provider_name: provider.legal_name, period: monthKey, formats: MONTHLY_FORMATS };

        const users = await this.notifyProviderAdmins(provider.id, notifType, title, message, data);
        await this.notificationService.broadcastToAuditors(notifType, 'medium', title, message, data);

        for (const user of users) {
          if (user.email) {
            await this.sendEmail(
              user.email,
              `${user.first_name} ${user.last_name}`,
              provider.legal_name,
              monthName,
              'mensual',
              MONTHLY_FORMATS
            ).catch((err) => logger.warn(`MedicamentosAlertService: email fallido (${user.email}): ${String(err)}`));
          }
        }

        logger.info(`MedicamentosAlertService: alerta mensual ${monthKey} → ${provider.legal_name}`);
      }

      logger.info(`MedicamentosAlertService: ciclo mensual ${monthKey} completado (${providers.length} prestadores)`);
    } catch (error) {
      logger.error('MedicamentosAlertService: error en checkMonthly', { error: (error as Error).message });
    }
  }

  // ── Recordatorio trimestral ─────────────────────────────────────────────────
  async checkQuarterly(): Promise<void> {
    const now     = new Date();
    const quarter = Math.ceil((now.getMonth() + 1) / 3);
    const periodKey  = `${now.getFullYear()}-Q${quarter}`;
    const notifType  = `medicamentos.quarterly.${periodKey}`;
    const periodName = `${now.getFullYear()} — Trimestre ${quarter}`;

    logger.info(`MedicamentosAlertService: recordatorio trimestral ${periodKey}`);

    try {
      const { rows: providers } = await this.pool.query<{ id: string; legal_name: string }>(
        `SELECT id, legal_name FROM providers WHERE status = 'active'`
      );

      for (const provider of providers) {
        if (await this.wasAlreadyNotified(provider.id, notifType)) { continue; }

        const title   = `📊 Revisión de Programas — Farmaco/Tecnovigilancia ${periodKey}`;
        const message = `Es momento de realizar la revisión trimestral del Estándar 4 para ${provider.legal_name}: ${QUARTERLY_FORMATS.join(', ')}.`;
        const data    = { provider_id: provider.id, provider_name: provider.legal_name, period: periodKey, formats: QUARTERLY_FORMATS };

        const users = await this.notifyProviderAdmins(provider.id, notifType, title, message, data);
        await this.notificationService.broadcastToAuditors(notifType, 'medium', title, message, data);

        for (const user of users) {
          if (user.email) {
            await this.sendEmail(
              user.email,
              `${user.first_name} ${user.last_name}`,
              provider.legal_name,
              periodName,
              'trimestral',
              QUARTERLY_FORMATS
            ).catch((err) => logger.warn(`MedicamentosAlertService: email fallido (${user.email}): ${String(err)}`));
          }
        }

        logger.info(`MedicamentosAlertService: alerta trimestral ${periodKey} → ${provider.legal_name}`);
      }

      logger.info(`MedicamentosAlertService: ciclo trimestral ${periodKey} completado (${providers.length} prestadores)`);
    } catch (error) {
      logger.error('MedicamentosAlertService: error en checkQuarterly', { error: (error as Error).message });
    }
  }

  // ── Helpers privados ────────────────────────────────────────────────────────

  private async notifyProviderAdmins(
    providerId: string,
    type: string,
    title: string,
    message: string,
    data: Record<string, unknown>
  ): Promise<Array<{ id: string; email: string; first_name: string; last_name: string }>> {
    const { rows: users } = await this.pool.query<{
      id: string; email: string; first_name: string; last_name: string;
    }>(
      `SELECT id, email, first_name, last_name
       FROM users
       WHERE provider_id = $1 AND role = 'provider_admin' AND status = 'active'`,
      [providerId]
    );

    for (const user of users) {
      await this.notificationService.createNotification(
        user.id, type, 'medium', title, message, providerId,
        undefined, undefined, data
      );
    }

    return users;
  }

  private async sendEmail(
    toEmail: string,
    toName: string,
    providerName: string,
    periodLabel: string,
    periodType: 'mensual' | 'trimestral',
    formats: string[]
  ): Promise<void> {
    if (!this.resend) { return; }

    const formatList = formats.map((f) => `<li>${f}</li>`).join('');
    const icon       = periodType === 'mensual' ? '💊' : '📊';
    const heading    = periodType === 'mensual'
      ? 'Formatos Mensuales de Medicamentos y Dispositivos Médicos'
      : 'Revisión Trimestral de Programas — Farmacovigilancia y Tecnovigilancia';
    const subject    = `${icon} ${heading} — ${periodLabel} | ${providerName}`;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
        <div style="background:#7c3aed;padding:24px 32px;border-radius:8px 8px 0 0">
          <h1 style="color:#fff;margin:0;font-size:20px">${icon} ${heading}</h1>
          <p style="color:#ddd6fe;margin:4px 0 0">${periodLabel}</p>
        </div>
        <div style="background:#f9fafb;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
          <p>Estimado/a <strong>${toName}</strong>,</p>
          <p>Este es el recordatorio ${periodType} para <strong>${providerName}</strong>.</p>
          <p>Es momento de diligenciar y cargar los siguientes formatos del <strong>Estándar 4 — Medicamentos, Dispositivos Médicos y Tecnovigilancia</strong>:</p>
          <ul style="line-height:1.9">
            ${formatList}
          </ul>
          <p>Ingrese a <strong>HabilitaPro → Gestión Documental</strong> para adjuntar los documentos correspondientes.</p>
          <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb">
          <p style="color:#6b7280;font-size:12px;margin:0">HabilitaPro — Sistema de Gestión de Calidad en Salud · Resolución 3100 de 2019</p>
        </div>
      </div>
    `;

    await this.resend.emails.send({
      from:    `${FROM_NAME} <${FROM_EMAIL}>`,
      to:      [toEmail],
      subject,
      html,
    });
  }

  private async wasAlreadyNotified(providerId: string, type: string): Promise<boolean> {
    const { rows } = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM notifications WHERE provider_id = $1 AND type = $2`,
      [providerId, type]
    );
    return parseInt(rows[0].count, 10) > 0;
  }

  // ── Registro de crons ───────────────────────────────────────────────────────

  startSchedules(): void {
    // Mensual: día 1 de cada mes a las 8 AM hora Colombia
    cron.schedule('0 8 1 * *', () => { void this.checkMonthly(); }, { timezone: 'America/Bogota' });
    logger.info('MedicamentosAlertService: cron mensual programado — día 1 de cada mes a las 8 AM (Bogotá)');

    // Trimestral: 1 de enero, abril, julio y octubre a las 8 AM hora Colombia
    cron.schedule('0 8 1 1,4,7,10 *', () => { void this.checkQuarterly(); }, { timezone: 'America/Bogota' });
    logger.info('MedicamentosAlertService: cron trimestral programado — 1 ene/abr/jul/oct a las 8 AM (Bogotá)');
  }
}
