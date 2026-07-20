/**
 * Helpers de verificación de firmas/tokens de webhooks (tiempo constante).
 * Cierra CONCERNS.md §1 "Webhook Endpoints Have No Signature Verification (HIGH)".
 */
import crypto from 'crypto';

// Comparación en tiempo constante; evita el throw de timingSafeEqual con longitudes distintas
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) {
    return false;
  }
  return crypto.timingSafeEqual(ab, bb);
}

export function verifyMailgunSignature(
  sig: { timestamp?: string; token?: string; signature?: string },
  signingKey: string,
): boolean {
  if (!sig?.timestamp || !sig?.token || !sig?.signature || !signingKey) {
    return false;
  }
  const digest = crypto.createHmac('sha256', signingKey)
    .update(sig.timestamp + sig.token).digest('hex');
  return safeEqual(digest, sig.signature);
}

export function verifyTwilioSignature(
  authToken: string, fullUrl: string, params: Record<string, unknown>, headerSignature: string,
): boolean {
  if (!authToken || !fullUrl || !headerSignature) {
    return false;
  }
  const data = fullUrl + Object.keys(params || {}).sort()
    .reduce((acc, k) => acc + k + String(params[k]), '');
  const digest = crypto.createHmac('sha1', authToken).update(Buffer.from(data, 'utf8')).digest('base64');
  return safeEqual(digest, headerSignature);
}

export function verifySharedSecret(provided: string | undefined, expected: string | undefined): boolean {
  if (!provided || !expected) {
    return false;
  }
  return safeEqual(provided, expected);
}
