/**
 * Simple role-based access control middleware
 */

import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { logger } from '../utils/logger.js';

/**
 * Middleware to check if user has required roles
 */
export function rbacMiddleware(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;

      if (!user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
        return;
      }

      if (!allowedRoles.includes(user.role)) {
        logger.warn({
          msg: 'Access denied - insufficient role',
          user_id: user.user_id,
          required_roles: allowedRoles,
          user_role: user.role,
        });

        res.status(403).json({
          error: 'Forbidden',
          message: 'Insufficient permissions for this action',
        });
        return;
      }

      next();
    } catch (err) {
      logger.error({
        msg: 'Error in role middleware',
        error: err instanceof Error ? err.message : String(err),
      });

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Authentication check failed',
      });
    }
  };
}

/**
 * Middleware to enforce provider access control:
 * - provider_admin: can only access own provider
 * - auditor: can only access assigned providers
 * - super_admin: can access any provider
 *
 * Usage: app.use(providerAccessMiddleware(pool, ['provider_id', 'providerId']))
 * Extracts provider ID from body.provider_id, params.id, or query.provider_id
 */
export function providerAccessMiddleware(pool: Pool, providerIdKeys: string[] = ['provider_id', 'providerId']) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      const userRole = user?.role;
      const userId = user?.user_id;

      // super_admin bypasses all checks
      if (userRole === 'super_admin') {
        return next();
      }

      // Extract provider ID from various sources
      let providerId: string | null = null;
      for (const key of providerIdKeys) {
        providerId = req.body[key] || req.params[key] || req.query[key];
        if (providerId) {break;}
      }

      // If no provider ID in request, let handler decide (some endpoints might not need it)
      if (!providerId) {
        return next();
      }

      // provider_admin: can only access own provider
      if (userRole === 'provider_admin') {
        const result = await pool.query(
          'SELECT provider_id FROM users WHERE id = $1',
          [userId]
        );

        if (result.rows.length === 0) {
          logger.warn({
            msg: 'Provider access denied - user not found',
            user_id: userId,
            provider_id: providerId,
          });
          res.status(403).json({ error: 'Access denied' });
          return;
        }

        if (result.rows[0].provider_id !== providerId) {
          logger.warn({
            msg: 'Provider access denied - provider mismatch',
            user_id: userId,
            user_provider: result.rows[0].provider_id,
            requested_provider: providerId,
          });
          res.status(403).json({ error: 'Can only access your own provider' });
          return;
        }
      }

      // auditor: can only access assigned providers
      if (userRole === 'auditor') {
        const result = await pool.query(
          'SELECT 1 FROM auditor_providers WHERE auditor_id = $1 AND provider_id = $2',
          [userId, providerId]
        );

        if (result.rows.length === 0) {
          logger.warn({
            msg: 'Provider access denied - not assigned',
            user_id: userId,
            provider_id: providerId,
          });
          res.status(403).json({
            error: 'Access denied',
            message: 'You are not assigned to audit this provider',
          });
          return;
        }
      }

      next();
    } catch (err) {
      logger.error({
        msg: 'Error in provider access middleware',
        error: err instanceof Error ? err.message : String(err),
      });

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Access control check failed',
      });
    }
  };
}
