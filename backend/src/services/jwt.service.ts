import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

// Token expiry times (in seconds)
export const ACCESS_TOKEN_EXPIRY = 1800; // 30 minutos — el frontend renueva silenciosamente via refresh token
export const REFRESH_TOKEN_EXPIRY = 1209600; // 14 días

// HS256 algorithm
const ALGORITHM = 'HS256';

interface TokenClaims {
  sub: string;
  user_id: string;
  role?: string;
  provider_id?: string;
  purpose?: string;
  iat: number;
  exp: number;
  jti: string;
}

interface RefreshTokenClaims extends TokenClaims {
  type: 'refresh';
}

interface ValidateTokenResult {
  valid: boolean;
  claims?: TokenClaims | RefreshTokenClaims;
  error?: string;
}

/**
 * Generate an access token
 * @param user_id - UUID of the user
 * @param role - User's role (provider_admin, auditor, super_admin)
 * @param provider_id - Provider UUID associated with the user
 * @returns JWT access token as string
 */
export function generateAccessToken(
  user_id: string,
  role: string,
  provider_id: string,
): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET not configured or too short (min 32 chars)');
  }

  const now = Math.floor(Date.now() / 1000);
  const jti = uuidv4();

  const claims: TokenClaims = {
    sub: user_id,
    user_id,
    role,
    provider_id,
    iat: now,
    exp: now + ACCESS_TOKEN_EXPIRY,
    jti,
  };

  const token = jwt.sign(claims, secret, {
    algorithm: ALGORITHM,
  });

  logger.debug({ user_id, role, provider_id, expiry: claims.exp }, 'Access token generated');
  return token;
}

/**
 * Secreto dedicado para refresh tokens. Usa JWT_REFRESH_SECRET si está
 * configurado; si no, cae de nuevo a JWT_SECRET (evita romper entornos
 * que solo definen JWT_SECRET).
 */
function refreshSecret(): string {
  return process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || '';
}

/**
 * Generate a refresh token (single-use, 14-day expiry)
 * @param user_id - UUID of the user
 * @returns JWT refresh token as string
 */
export function generateRefreshToken(user_id: string): string {
  const secret = refreshSecret();
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET not configured or too short (min 32 chars)');
  }

  const now = Math.floor(Date.now() / 1000);
  const jti = uuidv4();

  const claims: RefreshTokenClaims = {
    sub: user_id,
    user_id,
    type: 'refresh',
    iat: now,
    exp: now + REFRESH_TOKEN_EXPIRY,
    jti,
  };

  const token = jwt.sign(claims, secret, {
    algorithm: ALGORITHM,
  });

  logger.debug({ user_id, expiry: claims.exp, jti }, 'Refresh token generated');
  return token;
}

/**
 * Validate a JWT token (access or refresh)
 * @param token - JWT token string
 * @returns { valid, claims, error }
 */
export function validateToken(token: string): ValidateTokenResult {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return { valid: false, error: 'JWT_SECRET not configured' };
  }

  // Decodifica sin verificar para saber si es un refresh token — determina
  // qué secreto usar antes de validar la firma.
  const unverified = jwt.decode(token) as TokenClaims | RefreshTokenClaims | null;
  const isRefresh = !!unverified && 'type' in unverified && unverified.type === 'refresh';

  if (isRefresh) {
    const startTime = Date.now();
    try {
      const decoded = jwt.verify(token, refreshSecret(), {
        algorithms: [ALGORITHM],
      }) as TokenClaims | RefreshTokenClaims;
      const duration = Date.now() - startTime;

      if (!('type' in decoded) || decoded.type !== 'refresh') {
        logger.debug({ user_id: decoded.user_id }, 'Rejected: token verified but claims.type is not refresh');
        return { valid: false, error: 'Invalid token type' };
      }

      logger.debug({ user_id: decoded.user_id, duration: `${duration}ms` }, 'Refresh token validated');
      return { valid: true, claims: decoded };
    } catch (_refreshErr) {
      // Grace fallback: refresh tokens emitidos ANTES de separar los secretos
      // se firmaron con JWT_SECRET — se validan una vez más contra ese secreto
      // para no forzar un logout masivo. Ventana de migración con expiración
      // explícita (JWT_REFRESH_GRACE_UNTIL): sin este flag, o ya vencido, el
      // fallback NO se intenta — evita que un JWT_SECRET filtrado siga
      // sirviendo para forjar refresh tokens indefinidamente.
      const graceUntil = process.env.JWT_REFRESH_GRACE_UNTIL;
      const graceActive = !!graceUntil && Date.now() < new Date(graceUntil).getTime();

      if (!graceActive) {
        logger.debug('Refresh token validation failed (grace fallback disabled or expired)');
        return { valid: false, error: 'Invalid refresh token' };
      }

      try {
        const decoded = jwt.verify(token, secret, {
          algorithms: [ALGORITHM],
        }) as TokenClaims | RefreshTokenClaims;

        if (!('type' in decoded) || decoded.type !== 'refresh') {
          logger.debug({ user_id: decoded.user_id }, 'Rejected: grace-fallback token verified but claims.type is not refresh');
          return { valid: false, error: 'Invalid token type' };
        }

        logger.debug({ user_id: decoded.user_id }, 'Refresh token validated via grace fallback (JWT_SECRET)');
        return { valid: true, claims: decoded };
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error';
        logger.debug({ error }, 'Refresh token validation failed (both secrets)');
        return { valid: false, error };
      }
    }
  }

  try {
    const startTime = Date.now();
    const decoded = jwt.verify(token, secret, {
      algorithms: [ALGORITHM],
    }) as TokenClaims | RefreshTokenClaims;
    const duration = Date.now() - startTime;

    logger.debug({ user_id: decoded.user_id, duration: `${duration}ms` }, 'Token validated');

    return { valid: true, claims: decoded };
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    logger.debug({ error }, 'Token validation failed');
    return { valid: false, error };
  }
}

/**
 * Decode token without verification (for debugging)
 * @param token - JWT token string
 * @returns Decoded claims or null
 */
export function decodeToken(token: string): TokenClaims | RefreshTokenClaims | null {
  try {
    const decoded = jwt.decode(token) as TokenClaims | RefreshTokenClaims | null;
    return decoded;
  } catch (_err) {
    return null;
  }
}

/**
 * Extract JWT ID (jti) from token for revocation tracking
 * @param token - JWT token string
 * @returns JWT ID or null
 */
export function getTokenJti(token: string): string | null {
  const decoded = decodeToken(token);
  return decoded?.jti || null;
}

/**
 * Generate a temporary token valid only for password change (15 min)
 */
export function generateTempToken(user_id: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET not configured or too short (min 32 chars)');
  }

  const now = Math.floor(Date.now() / 1000);
  const jti = uuidv4();

  const claims: TokenClaims = {
    sub: user_id,
    user_id,
    purpose: 'password_change',
    iat: now,
    exp: now + 900, // 15 minutos
    jti,
  };

  return jwt.sign(claims, secret, { algorithm: ALGORITHM });
}

/**
 * Check if token is expired
 * @param token - JWT token string
 * @returns true if expired, false otherwise
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded) {return true;}

  const now = Math.floor(Date.now() / 1000);
  return decoded.exp < now;
}
