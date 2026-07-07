/**
 * JWT Service Tests — separación de secretos access/refresh
 * Cubre FR-110.3: los refresh tokens deben firmarse/validarse con
 * JWT_REFRESH_SECRET, distinto de JWT_SECRET (access tokens).
 */

import jwt from 'jsonwebtoken';
import {
  generateAccessToken,
  generateRefreshToken,
  generateTempToken,
  validateToken,
} from '../jwt.service.js';

const ORIGINAL_ENV = process.env;

describe('jwt.service - separación de secretos access/refresh', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    process.env.JWT_SECRET = 'a'.repeat(32);
    process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('firma refresh tokens con JWT_REFRESH_SECRET, no con JWT_SECRET', () => {
    const token = generateRefreshToken('user-1');

    // Debe verificar correctamente con JWT_REFRESH_SECRET
    expect(() => jwt.verify(token, process.env.JWT_REFRESH_SECRET as string)).not.toThrow();

    // Un secreto de access token filtrado NO debe poder validar el refresh token
    expect(() => jwt.verify(token, process.env.JWT_SECRET as string)).toThrow();
  });

  it('validateToken acepta refresh tokens firmados con JWT_REFRESH_SECRET', () => {
    const token = generateRefreshToken('user-1');
    const result = validateToken(token);

    expect(result.valid).toBe(true);
    expect(result.claims?.user_id).toBe('user-1');
  });

  it('validateToken usa fallback a JWT_SECRET para refresh tokens preexistentes (grace period)', () => {
    // Simula un refresh token emitido ANTES de este cambio (firmado con JWT_SECRET)
    const legacyToken = jwt.sign(
      {
        sub: 'user-2',
        user_id: 'user-2',
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 1209600,
        jti: 'legacy-jti',
      },
      process.env.JWT_SECRET as string,
      { algorithm: 'HS256' },
    );

    const result = validateToken(legacyToken);
    expect(result.valid).toBe(true);
    expect(result.claims?.user_id).toBe('user-2');
  });

  it('validateToken rechaza un refresh token que no fue firmado con ninguno de los dos secretos', () => {
    const forgedToken = jwt.sign(
      {
        sub: 'user-3',
        user_id: 'user-3',
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 1209600,
        jti: 'forged-jti',
      },
      'c'.repeat(32),
      { algorithm: 'HS256' },
    );

    const result = validateToken(forgedToken);
    expect(result.valid).toBe(false);
  });

  it('access tokens siguen validando SOLO contra JWT_SECRET (sin cambios)', () => {
    const token = generateAccessToken('user-4', 'auditor', 'provider-1');

    expect(() => jwt.verify(token, process.env.JWT_SECRET as string)).not.toThrow();

    const result = validateToken(token);
    expect(result.valid).toBe(true);
    expect(result.claims?.user_id).toBe('user-4');
  });

  it('temp tokens siguen firmando con JWT_SECRET (sin cambios)', () => {
    const token = generateTempToken('user-6');
    expect(() => jwt.verify(token, process.env.JWT_SECRET as string)).not.toThrow();
  });

  it('cae de nuevo a JWT_SECRET cuando JWT_REFRESH_SECRET no está definido (sin regresión)', () => {
    delete process.env.JWT_REFRESH_SECRET;

    const token = generateRefreshToken('user-5');
    expect(() => jwt.verify(token, process.env.JWT_SECRET as string)).not.toThrow();

    const result = validateToken(token);
    expect(result.valid).toBe(true);
  });
});
