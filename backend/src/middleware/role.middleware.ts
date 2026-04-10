/**
 * Simple role-based access control middleware
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

/**
 * Middleware to check if user has required roles
 */
export function rbacMiddleware(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = (req as any).user;

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
          user_id: user.id,
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
