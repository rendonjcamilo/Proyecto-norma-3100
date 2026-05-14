/**
 * WhatsAppService — Wrapper sobre Evolution API (Baileys) para envío automático de mensajes
 * Soporta múltiples instancias: una por auditor (instanceName = "norma3100-{userId}")
 */

import { logger } from '../utils/logger.js';

const EVO_URL = (process.env.EVOLUTION_API_URL || 'http://evolution:8080').replace(/\/$/, '');
const EVO_KEY = process.env.EVOLUTION_API_KEY || '';
const EVO_PREFIX = process.env.EVOLUTION_INSTANCE_NAME || 'norma3100';

async function evoFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${EVO_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      apikey: EVO_KEY,
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Evolution API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

// Genera nombre de instancia único por auditor, compatible con Evolution API (sin guiones)
function instanceName(userId: string): string {
  const clean = userId.replace(/-/g, '').slice(0, 20);
  return `${EVO_PREFIX}-${clean}`;
}

export interface WaConnectionState {
  state: 'open' | 'connecting' | 'close' | 'qr' | 'unknown';
  connected: boolean;
  instanceName?: string;
}

export interface WaQRResult {
  qrcode?: string;
  pairingCode?: string;
  state: string;
}

export interface WaSendResult {
  messageId?: string;
  status: 'sent' | 'error';
}

export class WhatsAppService {

  async getConnectionState(userId: string): Promise<WaConnectionState> {
    const instance = instanceName(userId);
    try {
      const data = await evoFetch<Record<string, unknown>>(`/instance/connectionState/${instance}`);
      const state = (data?.instance as Record<string, unknown>)?.state ?? data?.state ?? 'unknown';
      return { state: state as WaConnectionState['state'], connected: state === 'open', instanceName: instance };
    } catch {
      return { state: 'unknown', connected: false, instanceName: instance };
    }
  }

  async getQR(userId: string): Promise<WaQRResult> {
    const instance = instanceName(userId);

    // Verificar si la instancia existe; crearla si no
    try {
      const instances = await evoFetch<unknown[]>('/instance/fetchInstances');
      const exists = Array.isArray(instances) && instances.some(
        (i) => (i as Record<string, unknown>).name === instance
      );
      if (!exists) {
        await evoFetch('/instance/create', {
          method: 'POST',
          body: JSON.stringify({
            instanceName: instance,
            qrcode: true,
            integration: 'WHATSAPP-BAILEYS',
          }),
        });
        logger.info({ msg: 'Evolution instance created', instance, userId });
      }
    } catch (err) {
      logger.warn({ msg: 'Could not verify/create Evolution instance', instance, error: String(err) });
    }

    const data = await evoFetch<Record<string, unknown>>(`/instance/connect/${instance}`);
    const base64 = (data?.base64 as string | undefined)
      ?? ((data?.qrcode as Record<string, string> | undefined)?.base64);

    return {
      qrcode: base64,
      pairingCode: data?.pairingCode as string | undefined,
      state: (data?.state as string | undefined) ?? 'qr',
    };
  }

  async sendText(userId: string, phone: string, message: string): Promise<WaSendResult> {
    const instance = instanceName(userId);
    const state = await this.getConnectionState(userId);
    if (!state.connected) {
      throw new Error('WhatsApp no está conectado. Escanea el código QR en el panel de configuración.');
    }

    const data = await evoFetch<Record<string, unknown>>(`/message/sendText/${instance}`, {
      method: 'POST',
      body: JSON.stringify({ number: phone, text: message }),
    });

    const key = data?.key as Record<string, unknown> | undefined;
    return {
      messageId: (key?.id as string | undefined) ?? (data?.messageId as string | undefined),
      status: 'sent',
    };
  }
}
