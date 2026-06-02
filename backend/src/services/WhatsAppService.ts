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
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    // Verificar si la instancia existe; si está en close borrarla y recrear para sesión limpia
    // Compatibilidad con Evolution v1.x ({instance:{instanceName,status}}) y v2.x ({name,connectionStatus})
    try {
      const instances = await evoFetch<unknown[]>('/instance/fetchInstances');
      const found = Array.isArray(instances)
        ? (instances as Record<string, unknown>[]).find((i) => {
            const name = (i.name as string | undefined)
              ?? ((i.instance as Record<string, unknown>)?.instanceName as string | undefined);
            return name === instance;
          })
        : null;

      const foundStatus = found
        ? ((found.connectionStatus as string | undefined)
            ?? ((found.instance as Record<string, unknown>)?.status as string | undefined))
        : undefined;

      if (foundStatus === 'open') {
        // Ya conectado — no hay QR que mostrar
        return { state: 'open' };
      } else if (!found) {
        await evoFetch('/instance/create', {
          method: 'POST',
          body: JSON.stringify({ instanceName: instance, qrcode: true, integration: 'WHATSAPP-BAILEYS' }),
        });
        logger.info({ msg: 'Evolution instance created', instance, userId });
        // Baileys necesita ~2s para inicializar la sesión y generar el primer QR
        await sleep(2500);
      } else if (foundStatus === 'close') {
        // Instancia existe pero desconectada — borrar y recrear para forzar nuevo QR
        await evoFetch(`/instance/delete/${instance}`, { method: 'DELETE' }).catch(() => null);
        await evoFetch('/instance/create', {
          method: 'POST',
          body: JSON.stringify({ instanceName: instance, qrcode: true, integration: 'WHATSAPP-BAILEYS' }),
        });
        logger.info({ msg: 'Evolution instance recreated (was close)', instance, userId });
        await sleep(2500);
      }
    } catch (err) {
      logger.warn({ msg: 'Could not verify/create Evolution instance', instance, error: String(err) });
    }

    // Reintentar hasta 4 veces — Baileys puede tardar en generar el QR
    for (let attempt = 0; attempt < 4; attempt++) {
      if (attempt > 0) {await sleep(2000);}
      try {
        const data = await evoFetch<Record<string, unknown>>(`/instance/connect/${instance}`);
        const base64 = (data?.base64 as string | undefined)
          ?? ((data?.qrcode as Record<string, string> | undefined)?.base64);
        if (base64) {
          return { qrcode: base64, pairingCode: data?.pairingCode as string | undefined, state: 'qr' };
        }
        logger.warn({ msg: 'No QR yet, retrying', instance, attempt, keys: Object.keys(data ?? {}) });
      } catch (err) {
        logger.warn({ msg: 'connect attempt failed', instance, attempt, error: String(err) });
      }
    }

    throw new Error('Evolution API no generó el código QR. Espera 30 segundos e intenta de nuevo.');
  }

  async getPairingCode(userId: string, phone: string): Promise<{ pairingCode: string }> {
    const instance = instanceName(userId);
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    // Crear instancia si no existe, o recrear si está cerrada
    try {
      const instances = await evoFetch<unknown[]>('/instance/fetchInstances');
      const found = Array.isArray(instances)
        ? (instances as Record<string, unknown>[]).find((i) => {
            const name = (i.name as string | undefined)
              ?? ((i.instance as Record<string, unknown>)?.instanceName as string | undefined);
            return name === instance;
          })
        : null;

      const foundStatus = found
        ? ((found.connectionStatus as string | undefined)
            ?? ((found.instance as Record<string, unknown>)?.status as string | undefined))
        : undefined;

      if (foundStatus === 'open') {
        return { pairingCode: '' }; // ya conectado, no necesita código
      } else if (!found) {
        await evoFetch('/instance/create', {
          method: 'POST',
          body: JSON.stringify({ instanceName: instance, qrcode: false, integration: 'WHATSAPP-BAILEYS' }),
        });
        await sleep(2500);
      } else if (foundStatus === 'close') {
        await evoFetch(`/instance/delete/${instance}`, { method: 'DELETE' }).catch(() => null);
        await evoFetch('/instance/create', {
          method: 'POST',
          body: JSON.stringify({ instanceName: instance, qrcode: false, integration: 'WHATSAPP-BAILEYS' }),
        });
        await sleep(2500);
      }
    } catch (err) {
      logger.warn({ msg: 'Could not verify/create Evolution instance for pairing', instance, error: String(err) });
    }

    // Solicitar pairing code con número de teléfono
    const cleanPhone = phone.replace(/\D/g, '');
    const data = await evoFetch<Record<string, unknown>>(
      `/instance/connect/${instance}?number=${cleanPhone}`
    );
    const code = (data?.pairingCode as string | undefined) ?? (data?.code as string | undefined);
    if (!code) {
      logger.warn({ msg: 'No pairing code returned', instance, keys: Object.keys(data ?? {}) });
      throw new Error('Evolution API no retornó el código de vinculación. Intenta con el método QR.');
    }
    logger.info({ msg: 'Pairing code generated', instance, userId });
    return { pairingCode: code };
  }

  async sendText(userId: string, phone: string, message: string): Promise<WaSendResult> {
    const instance = instanceName(userId);
    const state = await this.getConnectionState(userId);
    if (!state.connected) {
      throw new Error('WhatsApp no está conectado. Escanea el código QR en el panel de configuración.');
    }

    const data = await evoFetch<Record<string, unknown>>(`/message/sendText/${instance}`, {
      method: 'POST',
      body: JSON.stringify({ number: phone, textMessage: { text: message } }),
    });

    const key = data?.key as Record<string, unknown> | undefined;
    return {
      messageId: (key?.id as string | undefined) ?? (data?.messageId as string | undefined),
      status: 'sent',
    };
  }
}
