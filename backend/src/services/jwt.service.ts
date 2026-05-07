import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

// Token expiry times (in seconds)
export const ACCESS_TOKEN_EXPIRY = 3600; // 1 hour
export const REFRESH_TOKEN_EXPIRY = 1209600; // 14 days

// HS256 algorithm
const ALGORITHM = 'HS256';

interface TokenClaims {
  sub: string;
  user_id: string;
  role?: string;
  provider_id?: string;
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
 * Generate a refresh token (single-use, 14-day expiry)
 * @param user_id - UUID of the user
 * @returns JWT refresh token as string
 */
export function generateRefreshToken(user_id: string): string {
  const secret = process.env.JWT_SECRET;
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
