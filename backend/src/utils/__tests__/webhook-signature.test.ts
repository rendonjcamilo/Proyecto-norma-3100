/**
 * Pruebas de los helpers de verificación de firmas de webhooks.
 * TDD RED: estas pruebas deben fallar hasta que se implemente
 * backend/src/utils/webhook-signature.ts
 */
import crypto from 'crypto';
import {
  verifyMailgunSignature,
  verifyTwilioSignature,
  verifySharedSecret,
} from '../webhook-signature.js';

describe('verifyMailgunSignature', () => {
  const signingKey = 'mailgun-signing-key-test';

  function sign(timestamp: string, token: string, key = signingKey): string {
    return crypto.createHmac('sha256', key).update(timestamp + token).digest('hex');
  }

  it('acepta una firma válida', () => {
    const timestamp = '1234567890';
    const token = 'abc123token';
    const signature = sign(timestamp, token);

    expect(
      verifyMailgunSignature({ timestamp, token, signature }, signingKey)
    ).toBe(true);
  });

  it('rechaza una firma inválida', () => {
    const timestamp = '1234567890';
    const token = 'abc123token';

    expect(
      verifyMailgunSignature(
        { timestamp, token, signature: 'firma-incorrecta' },
        signingKey
      )
    ).toBe(false);
  });

  it('rechaza cuando falta el campo timestamp', () => {
    expect(
      verifyMailgunSignature(
        { token: 'abc123token', signature: 'x' },
        signingKey
      )
    ).toBe(false);
  });

  it('rechaza cuando falta el campo token', () => {
    expect(
      verifyMailgunSignature(
        { timestamp: '1234567890', signature: 'x' },
        signingKey
      )
    ).toBe(false);
  });

  it('rechaza cuando falta la firma', () => {
    expect(
      verifyMailgunSignature(
        { timestamp: '1234567890', token: 'abc123token' },
        signingKey
      )
    ).toBe(false);
  });

  it('rechaza cuando la signingKey está vacía', () => {
    expect(
      verifyMailgunSignature(
        { timestamp: '1234567890', token: 'abc123token', signature: 'x' },
        ''
      )
    ).toBe(false);
  });

  it('nunca lanza excepción con firmas de longitud distinta', () => {
    expect(() =>
      verifyMailgunSignature(
        { timestamp: '1234567890', token: 'abc123token', signature: 'short' },
        signingKey
      )
    ).not.toThrow();
  });
});

describe('verifyTwilioSignature', () => {
  const authToken = 'twilio-auth-token-test';
  const fullUrl = 'https://example.com/api/webhooks/sms/twilio';

  function sign(
    url: string,
    params: Record<string, unknown>,
    token = authToken
  ): string {
    const data =
      url +
      Object.keys(params)
        .sort()
        .reduce((acc, k) => acc + k + String(params[k]), '');
    return crypto.createHmac('sha1', token).update(Buffer.from(data, 'utf8')).digest('base64');
  }

  it('acepta una firma válida', () => {
    const params = { MessageSid: 'SM123', MessageStatus: 'delivered' };
    const signature = sign(fullUrl, params);

    expect(
      verifyTwilioSignature(authToken, fullUrl, params, signature)
    ).toBe(true);
  });

  it('rechaza una firma inválida', () => {
    const params = { MessageSid: 'SM123', MessageStatus: 'delivered' };

    expect(
      verifyTwilioSignature(authToken, fullUrl, params, 'firma-incorrecta')
    ).toBe(false);
  });

  it('rechaza cuando falta el authToken', () => {
    const params = { MessageSid: 'SM123' };
    expect(verifyTwilioSignature('', fullUrl, params, 'x')).toBe(false);
  });

  it('rechaza cuando falta la URL', () => {
    const params = { MessageSid: 'SM123' };
    expect(verifyTwilioSignature(authToken, '', params, 'x')).toBe(false);
  });

  it('rechaza cuando falta la firma del header', () => {
    const params = { MessageSid: 'SM123' };
    expect(verifyTwilioSignature(authToken, fullUrl, params, '')).toBe(false);
  });

  it('nunca lanza excepción con firmas de longitud distinta', () => {
    expect(() =>
      verifyTwilioSignature(authToken, fullUrl, { a: 1 }, 'short')
    ).not.toThrow();
  });
});

describe('verifySharedSecret', () => {
  it('acepta cuando el secreto coincide', () => {
    expect(verifySharedSecret('secreto-123', 'secreto-123')).toBe(true);
  });

  it('rechaza cuando el secreto no coincide', () => {
    expect(verifySharedSecret('secreto-123', 'otro-secreto')).toBe(false);
  });

  it('rechaza cuando falta el valor provisto', () => {
    expect(verifySharedSecret(undefined, 'secreto-123')).toBe(false);
  });

  it('rechaza cuando falta el valor esperado', () => {
    expect(verifySharedSecret('secreto-123', undefined)).toBe(false);
  });

  it('nunca lanza excepción con longitudes distintas', () => {
    expect(() => verifySharedSecret('a', 'ab')).not.toThrow();
  });
});
