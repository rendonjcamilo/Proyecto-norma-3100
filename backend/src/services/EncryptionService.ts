/**
 * Servicio de cifrado AES-256-GCM para datos sensibles en reposo
 * Implementa cifrado autenticado con IV aleatorio por operación
 * Compatible con Phase 6.1.2 — Norma 3100 Compliance
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_BYTES = 32;   // 256 bits
const IV_BYTES = 16;    // 128 bits
const TAG_BYTES = 16;   // 128-bit auth tag (GCM default)

/**
 * Singleton de cifrado — inicializado una vez al arrancar el servidor.
 * La clave se lee de ENCRYPTION_KEY (64 hex chars = 32 bytes = 256 bits).
 * En desarrollo sin clave configurada, usa una clave derivada de dev para
 * que el servidor arranque, pero lanza error en producción.
 */
export class EncryptionService {
  private readonly key: Buffer;
  readonly keyVersion: number;

  constructor() {
    const rawKey = process.env.ENCRYPTION_KEY;

    if (!rawKey) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'ENCRYPTION_KEY es requerida en producción. ' +
          'Genera una con: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
        );
      }
      // Dev: clave derivada determinista — nunca llega a producción
      this.key = crypto.scryptSync('dev-norma3100-encryption', 'norma3100-dev-salt', KEY_BYTES);
    } else {
      this.key = Buffer.from(rawKey, 'hex');
      if (this.key.length !== KEY_BYTES) {
        throw new Error(
          `ENCRYPTION_KEY debe tener exactamente 64 caracteres hex (32 bytes / 256 bits). ` +
          `Longitud actual: ${rawKey.length} chars.`
        );
      }
    }

    this.keyVersion = parseInt(process.env.ENCRYPTION_KEY_VERSION || '1', 10);
  }

  /**
   * Cifra texto plano con AES-256-GCM.
   * Formato de salida (base64): IV(16) + AuthTag(16) + Ciphertext
   */
  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(IV_BYTES);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);

    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return Buffer.concat([iv, authTag, encrypted]).toString('base64');
  }

  /**
   * Descifra texto cifrado con AES-256-GCM.
   * Lanza error si la autenticación falla (datos alterados).
   */
  decrypt(ciphertext: string): string {
    const buffer = Buffer.from(ciphertext, 'base64');

    if (buffer.length < IV_BYTES + TAG_BYTES + 1) {
      throw new Error('Ciphertext demasiado corto — datos corruptos o no cifrados');
    }

    const iv      = buffer.subarray(0, IV_BYTES);
    const authTag = buffer.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
    const payload = buffer.subarray(IV_BYTES + TAG_BYTES);

    const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(authTag);

    return decipher.update(payload).toString('utf8') + decipher.final('utf8');
  }

  /**
   * Cifra un objeto JSON y lo envuelve en un sobre reconocible.
   * El JSONB resultante tiene la forma: { _enc: true, v: 1, d: "<base64>" }
   * Esto permite coexistencia de registros cifrados y no cifrados en la misma columna.
   */
  encryptJson(data: Record<string, unknown>): Record<string, unknown> {
    return {
      _enc: true,
      v: this.keyVersion,
      d: this.encrypt(JSON.stringify(data)),
    };
  }

  /**
   * Descifra un sobre JSON.
   * Si el objeto no tiene el marcador _enc, lo retorna sin modificar
   * (compatibilidad con registros anteriores no cifrados).
   */
  decryptJson(envelope: Record<string, unknown>): Record<string, unknown> {
    if (!this.isEncryptedEnvelope(envelope)) {
      return envelope;
    }
    return JSON.parse(this.decrypt(envelope.d as string)) as Record<string, unknown>;
  }

  /**
   * Determina si un objeto es un sobre cifrado por este servicio.
   */
  isEncryptedEnvelope(data: Record<string, unknown>): boolean {
    return data._enc === true && typeof data.d === 'string';
  }

  /**
   * Genera una nueva clave aleatoria lista para ENCRYPTION_KEY.
   * Uso: node -e "require('./dist/services/EncryptionService').EncryptionService.generateKey()"
   */
  static generateKey(): string {
    return crypto.randomBytes(KEY_BYTES).toString('hex');
  }
}

// Singleton — una sola instancia durante toda la vida del proceso
let _instance: EncryptionService | null = null;

export function getEncryptionService(): EncryptionService {
  if (!_instance) {
    _instance = new EncryptionService();
  }
  return _instance;
}
