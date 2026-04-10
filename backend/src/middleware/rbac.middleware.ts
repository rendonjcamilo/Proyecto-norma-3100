import { Request, Response, NextFunction } from 'express';
import { RBACService, Role, Action, Resource } from '../services/rbac.service.js';
import { logger } from '../utils/logger.js';

let rbacService: RBACService;

/**
 * Initialize RBAC service (must be called on app startup)
 */
export function setRBACService(service: RBACService) {
  rbacService = service;
}

/**
 * Middleware factory for permission checks
 * Usage: app.get('/resource', authMiddleware, checkPermission(Action.READ, Resource.PROVIDER), handler)
 */
export function checkPermission(action: Action, resource: Resource) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
        return;
      }

      const userRole = req.user.role as Role;
      const hasPermission = rbacService.hasPermission(userRole, action, resource);

      if (!hasPermission) {
        logger.warn(
          { user_id: req.user.user_id, action, resource, role: userRole },
          'Permission denied'
        );

        res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to access this resource',
        });
        return;
      }

      // Log successful permission check
      logger.debug(
        { user_id: req.user.user_id, action, resource, role: userRole },
        'Permission granted'
      );

      next();
    } catch (err) {
      logger.error({ error: err instanceof Error ? err.message : err }, 'RBAC check error');
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Permission check failed',
      });
    }
  };
}

/**
 * Middleware to check resource-specific permissions (ownership, assignment, etc.)
 */
export function checkResourcePermission(resource: Resource) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
        return;
      }

      const resourceId = req.params.id || req.params.resourceId;
      if (!resourceId) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Resource ID required',
        });
        return;
      }

      const userRole = req.user.role as Role;
      const canAccess = await rbacService.canAccessResource(
        req.user.user_id,
        userRole,
        req.user.provider_id,
        resourceId,
        resource
      );

      if (!canAccess) {
        logger.warn(
          { user_id: req.user.user_id, resourceId, resource, role: userRole },
          'Resource access denied'
        );

        res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to access this resource',
        });
        return;
      }

      logger.debug(
        { user_id: req.user.user_id, resourceId, resource, role: userRole },
        'Resource access granted'
      );

      next();
    } catch (err) {
      logger.error({ error: err instanceof Error ? err.message : err }, 'Resource permission check error');
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Permission check failed',
      });
    }
  };
}

/**
 * Middleware to require specific role
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    const userRole = req.user.role as Role;
    if (!roles.includes(userRole)) {
      logger.warn(
        { user_id: req.user.user_id, userRole, requiredRoles: roles },
        'Insufficient role'
      );

      res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient role for this operation',
      });
      return;
    }

    next();
  };
}
