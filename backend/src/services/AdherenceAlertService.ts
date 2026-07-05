/**
 * Adherence Alert Service
 * Envía recordatorio mensual (día 1 de cada mes, 8 AM Bogotá) para diligenciar formatos de adherencia.
 * Canales: in-app (NotificationService), email (Resend), WhatsApp (Evolution API vía auditor conectado).
 * Deduplicación: tipo de notificación incluye año-mes (ej: "adherence.monthly.2025-07")
 * para evitar doble envío en el mismo mes.
 */

import { Pool } from 'pg';
import { Resend } from 'resend';
import cron from 'node-cron';
import { NotificationService } from './NotificationService.js';
import { WhatsAppService } from './WhatsAppService.js';
import { logger } from '../utils/logger.js';

const FROM_EMAIL = process.env.EMAIL_FROM_ADDRESS || 'noreply@habilitapro.com';
const FROM_NAME  = process.env.EMAIL_FROM_NAME  || 'HabilitaPro';

export class AdherenceAlertService {
  private resend?: Resend;
  private whatsAppService: WhatsAppService;

  constructor(
    private pool: Pool,
    private notificationService: NotificationService
  ) {
    this.whatsAppService = new WhatsAppService();
    if (process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
    }
  }

  async checkAndNotify(): Promise<void> {
    const now = new Date();
    const monthKey  = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const notifType = `adherence.monthly.${monthKey}`;
    const monthName = now.toLocaleString('es-CO', { month: 'long', year: 'numeric' });

    logger.info(`AdherenceAlertService: procesando alertas para ${monthKey}`);

    try {
      const { rows: providers } = await this.pool.query<{
        id: string;
        legal_name: string;
        phone: string | null;
      }>(`SELECT id, legal_name, phone FROM providers WHERE status = 'active'`);

      const connectedAuditorId = await this.getConnectedAuditorId();

      for (const provider of providers) {
        const alreadyNotified = await this.wasAlreadyNotifiedThisMonth(provider.id, notifType);
        if (alreadyNotified) { continue; }

        const title   = `📋 Formatos de adherencia — ${monthName}`;
        const message = `Es momento de diligenciar y cargar los formatos de adherencia de ${provider.legal_name} correspondientes al mes de ${monthName}.`;
        const data    = { provider_id: provider.id, provider_name: provider.legal_name, month: monthKey };

        // 1. In-app + email → usuarios provider_admin
        const users = await this.notifyProviderUsers(provider.id, notifType, title, message, data, monthName);

        // 2. In-app → auditores
        await this.notificationService.broadcastToAuditors(notifType, 'medium', title, message, data);

        // 3. Email → usuarios provider_admin
        for (const user of users) {
          if (user.email) {
            await this.sendEmail(user.email, `${user.first_name} ${user.last_name}`, provider.legal_name, monthName)
              .catch((err) => logger.warn(`AdherenceAlertService: email fallido (${user.email}): ${String(err)}`));
          }
        }

        // 4. WhatsApp → teléfono del prestador (si hay auditor conectado y teléfono registrado)
        if (connectedAuditorId && provider.phone) {
          const waMsg = [
            `📋 *Recordatorio HabilitaPro*`,
            ``,
            `Estimados *${provider.legal_name}*,`,
            ``,
            `Recordatorio mensual: es momento de diligenciar y cargar los *formatos de adherencia* correspondientes al mes de ${monthName}.`,
            ``,
            `Documentos requeridos:`,
            `• Adherencia a bioseguridad`,
            `• Adherencia a seguridad del paciente`,
            `• Adherencia a lavado de manos`,
            `• Adherencia a protocolo de antibiótico`,
            ``,
            `Ingrese a HabilitaPro → Gestión Documental para adjuntarlos.`,
            ``,
            `_HabilitaPro — Sistema de Gestión de Calidad en Salud_`,
          ].join('\n');

          await this.whatsAppService.sendText(connectedAuditorId, provider.phone, waMsg)
            .catch((err) => logger.warn(`AdherenceAlertService: WhatsApp fallido (${provider.legal_name}): ${String(err)}`));
        }

        logger.info(`AdherenceAlertService: alerta ${monthKey} enviada → ${provider.legal_name}`);
      }

      logger.info(`AdherenceAlertService: ciclo ${monthKey} completado (${providers.length} prestadores procesados)`);
    } catch (error) {
      logger.error('AdherenceAlertService: error en checkAndNotify', { error: (error as Error).message });
    }
  }

  // Crea notificación in-app para cada provider_admin y retorna la lista de usuarios para email
  private async notifyProviderUsers(
    providerId: string,
    type: string,
    title: string,
    message: string,
    data: Record<string, unknown>,
    _monthName: string
  ): Promise<Array<{ id: string; email: string; first_name: string; last_name: string }>> {
    const { rows: users } = await this.pool.query<{
      id: string;
      email: string;
      first_name: string;
      last_name: string;
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
    monthName: string
  ): Promise<void> {
    if (!this.resend) { return; }

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
        <div style="background:#2563eb;padding:24px 32px;border-radius:8px 8px 0 0">
          <h1 style="color:#fff;margin:0;font-size:20px">📋 Formatos de Adherencia</h1>
          <p style="color:#bfdbfe;margin:4px 0 0">${monthName}</p>
        </div>
        <div style="background:#f9fafb;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
          <p>Estimado/a <strong>${toName}</strong>,</p>
          <p>Este es el recordatorio mensual para <strong>${providerName}</strong>.</p>
          <p>Es momento de diligenciar y cargar los <strong>formatos de adherencia</strong> del mes de <strong>${monthName}</strong>:</p>
          <ul style="line-height:1.8">
            <li>Adherencia a bioseguridad</li>
            <li>Adherencia a seguridad del paciente</li>
            <li>Adherencia a lavado de manos</li>
            <li>Adherencia a protocolo de antibiótico</li>
          </ul>
          <p>Ingrese a <strong>HabilitaPro → Gestión Documental</strong> para adjuntar los documentos.</p>
          <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb">
          <p style="color:#6b7280;font-size:12px;margin:0">HabilitaPro — Sistema de Gestión de Calidad en Salud</p>
        </div>
      </div>
    `;

    await this.resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to:   [toEmail],
      subject: `📋 Formatos de adherencia — ${monthName} | ${providerName}`,
      html,
    });
  }

  // Busca el primer auditor con instancia WhatsApp conectada
  private async getConnectedAuditorId(): Promise<string | null> {
    try {
      const { rows: auditors } = await this.pool.query<{ id: string }>(
        `SELECT id FROM users WHERE role = 'auditor' AND status = 'active' LIMIT 10`
      );
      for (const auditor of auditors) {
        const state = await this.whatsAppService.getConnectionState(auditor.id);
        if (state.connected) { return auditor.id; }
      }
    } catch (err) {
      logger.warn('AdherenceAlertService: no se pudo verificar instancias WhatsApp', { error: String(err) });
    }
    return null;
  }

  private async wasAlreadyNotifiedThisMonth(providerId: string, type: string): Promise<boolean> {
    const { rows } = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM notifications WHERE provider_id = $1 AND type = $2`,
      [providerId, type]
    );
    return parseInt(rows[0].count, 10) > 0;
  }

  // Cron: día 1 de cada mes a las 8 AM hora Colombia
  startMonthlyCheck(): void {
    cron.schedule('0 8 1 * *', () => { void this.checkAndNotify(); }, { timezone: 'America/Bogota' });
    logger.info('AdherenceAlertService: cron mensual programado — día 1 de cada mes a las 8 AM (Bogotá)');
  }
}
