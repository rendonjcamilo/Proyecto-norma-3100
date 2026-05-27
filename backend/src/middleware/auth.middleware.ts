import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { validateToken } from '../services/jwt.service.js';
import { logger } from '../utils/logger.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        user_id: string;
        role: string;
        provider_id: string;
        jti: string;
      };
    }
  }
}

let authPool: Pool | null = null;

export function setAuthPool(pool: Pool): void {
  authPool = pool;
}

/**
 * Verifica si un JTI ha sido revocado (logout explícito o rotación de refresh).
 * Si la BD no está disponible, permite el paso para evitar bloqueo total del servicio.
 */
async function isTokenRevoked(jti: string): Promise<boolean> {
  if (!authPool) {return false;}
  try {
    const result = await authPool.query(
      'SELECT 1 FROM revoked_tokens WHERE jti = $1 AND expires_at > NOW()',
      [jti],
    );
    return result.rows.length > 0;
  } catch (err) {
    logger.error({ error: err instanceof Error ? err.message : err }, 'Error checking token revocation — allowing request');
    return false;
  }
}

/**
 * Middleware to verify JWT token from Authorization header.
 * Expects: Authorization: Bearer <token>
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid Authorization header',
    });
    return;
  }

  const token = authHeader.substring(7);
  const result = validateToken(token);

  if (!result.valid) {
    res.status(401).json({
      error: 'Unauthorized',
      message: result.error || 'Invalid token',
    });
    return;
  }

  if ('type' in result.claims! && result.claims.type === 'refresh') {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid token type' });
    return;
  }

  const claims = result.claims!;

  // Verificación asíncrona de revocación — continúa el pipeline Express
  isTokenRevoked(claims.jti).then((revoked) => {
    if (revoked) {
      res.status(401).json({ error: 'Unauthorized', message: 'Token has been revoked' });
      return;
    }

    req.user = {
      user_id: claims.user_id,
      role: claims.role || 'unknown',
      provider_id: claims.provider_id || '',
      jti: claims.jti,
    };

    logger.debug({ user_id: req.user.user_id, path: req.path }, 'Auth middleware: token verified');
    next();
  }).catch((err) => {
    logger.error({ error: err instanceof Error ? err.message : err }, 'Auth middleware error');
    res.status(500).json({ error: 'Internal Server Error', message: 'Authentication check failed' });
  });
}

/**
 * Middleware para token opcional — no rechaza si falta.
 * Útil para endpoints con comportamiento diferenciado para usuarios autenticados.
 */
export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    const result = validateToken(token);

    if (result.valid && (!('type' in result.claims!) || result.claims.type !== 'refresh')) {
      req.user = {
        user_id: result.claims!.user_id,
        role: result.claims!.role || 'unknown',
        provider_id: result.claims!.provider_id || '',
        jti: result.claims!.jti,
      };
    }

    next();
  } catch (err) {
    logger.error({ error: err instanceof Error ? err.message : err }, 'Optional auth middleware error');
    next();
  }
}

/**
 * Revoca un JTI insertándolo en la tabla revoked_tokens.
 * Exportado para uso en auth.routes.ts (logout y refresh rotation).
 */
export async function revokeToken(jti: string, userId: string, expiresAt: Date): Promise<void> {
  if (!authPool) {return;}
  try {
    await authPool.query(
      `INSERT INTO revoked_tokens (jti, user_id, expires_at)
       VALUES ($1::uuid, $2::uuid, $3)
       ON CONFLICT (jti) DO NOTHING`,
      [jti, userId, expiresAt],
    );
  } catch (err) {
    logger.error({ error: err instanceof Error ? err.message : err }, 'Error revoking token');
  }
}
