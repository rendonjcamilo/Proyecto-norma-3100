import { Pool } from 'pg';
import { logger } from '../utils/logger.js';

export enum Role {
  PROVIDER_ADMIN = 'provider_admin',
  AUDITOR = 'auditor',
  SUPER_ADMIN = 'super_admin',
}

export enum Action {
  READ = 'read',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

export enum Resource {
  PROVIDER = 'provider',
  USER = 'user',
  FINDING = 'finding',
  AUDIT_LOG = 'audit_log',
  SETTINGS = 'settings',
}

interface Permission {
  role: Role;
  action: Action;
  resource: Resource;
  constraint?: 'own_only' | 'assigned_only' | 'none';
}

// Permission matrix
const PERMISSION_MATRIX: Permission[] = [
  // Super admin: full access
  { role: Role.SUPER_ADMIN, action: Action.READ, resource: Resource.PROVIDER },
  { role: Role.SUPER_ADMIN, action: Action.CREATE, resource: Resource.PROVIDER },
  { role: Role.SUPER_ADMIN, action: Action.UPDATE, resource: Resource.PROVIDER },
  { role: Role.SUPER_ADMIN, action: Action.DELETE, resource: Resource.PROVIDER },

  { role: Role.SUPER_ADMIN, action: Action.READ, resource: Resource.USER },
  { role: Role.SUPER_ADMIN, action: Action.CREATE, resource: Resource.USER },
  { role: Role.SUPER_ADMIN, action: Action.UPDATE, resource: Resource.USER },
  { role: Role.SUPER_ADMIN, action: Action.DELETE, resource: Resource.USER },

  { role: Role.SUPER_ADMIN, action: Action.READ, resource: Resource.FINDING },
  { role: Role.SUPER_ADMIN, action: Action.CREATE, resource: Resource.FINDING },
  { role: Role.SUPER_ADMIN, action: Action.UPDATE, resource: Resource.FINDING },
  { role: Role.SUPER_ADMIN, action: Action.DELETE, resource: Resource.FINDING },

  { role: Role.SUPER_ADMIN, action: Action.READ, resource: Resource.AUDIT_LOG },
  { role: Role.SUPER_ADMIN, action: Action.READ, resource: Resource.SETTINGS },
  { role: Role.SUPER_ADMIN, action: Action.UPDATE, resource: Resource.SETTINGS },

  // Provider admin: manage own provider
  { role: Role.PROVIDER_ADMIN, action: Action.READ, resource: Resource.PROVIDER, constraint: 'own_only' },
  { role: Role.PROVIDER_ADMIN, action: Action.UPDATE, resource: Resource.PROVIDER, constraint: 'own_only' },

  { role: Role.PROVIDER_ADMIN, action: Action.CREATE, resource: Resource.USER, constraint: 'own_only' },
  { role: Role.PROVIDER_ADMIN, action: Action.READ, resource: Resource.USER, constraint: 'own_only' },
  { role: Role.PROVIDER_ADMIN, action: Action.UPDATE, resource: Resource.USER, constraint: 'own_only' },
  { role: Role.PROVIDER_ADMIN, action: Action.DELETE, resource: Resource.USER, constraint: 'own_only' },

  { role: Role.PROVIDER_ADMIN, action: Action.READ, resource: Resource.FINDING, constraint: 'own_only' },
  { role: Role.PROVIDER_ADMIN, action: Action.CREATE, resource: Resource.FINDING, constraint: 'own_only' },
  { role: Role.PROVIDER_ADMIN, action: Action.UPDATE, resource: Resource.FINDING, constraint: 'own_only' },

  { role: Role.PROVIDER_ADMIN, action: Action.READ, resource: Resource.AUDIT_LOG, constraint: 'own_only' },

  // Auditor: read-only with assignment constraints
  { role: Role.AUDITOR, action: Action.READ, resource: Resource.FINDING, constraint: 'assigned_only' },
  { role: Role.AUDITOR, action: Action.UPDATE, resource: Resource.FINDING, constraint: 'assigned_only' },
  { role: Role.AUDITOR, action: Action.READ, resource: Resource.AUDIT_LOG, constraint: 'assigned_only' },
];

/**
 * RBAC Service - role-based access control
 */
export class RBACService {
  constructor(private pool: Pool) {}

  /**
   * Check if user has permission for action on resource
   */
  hasPermission(userRole: Role, action: Action, resource: Resource): boolean {
    const permission = PERMISSION_MATRIX.find(
      (p) => p.role === userRole && p.action === action && p.resource === resource
    );

    return !!permission;
  }

  /**
   * Get all permissions for a role
   */
  getPermissionsForRole(role: Role): Permission[] {
    return PERMISSION_MATRIX.filter((p) => p.role === role);
  }

  /**
   * Check if user can access a specific resource (with ownership constraint)
   */
  async canAccessResource(
    userId: string,
    userRole: Role,
    userProviderId: string,
    resourceId: string,
    resourceType: Resource
  ): Promise<boolean> {
    // Super admin can access anything
    if (userRole === Role.SUPER_ADMIN) {
      return true;
    }

    // Get permission (with constraint)
    const permission = PERMISSION_MATRIX.find(
      (p) => p.role === userRole && p.resource === resourceType
    );

    if (!permission) {
      return false;
    }

    // If no constraint, user can access
    if (!permission.constraint || permission.constraint === 'none') {
      return true;
    }

    // Own provider constraint
    if (permission.constraint === 'own_only') {
      try {
        // Check if resource belongs to user's provider
        const result = await this.pool.query(
          'SELECT provider_id FROM providers WHERE id = $1',
          [resourceId]
        );

        if (result.rows.length === 0) {
          // Also check if it's a user resource
          const userResult = await this.pool.query(
            'SELECT provider_id FROM users WHERE id = $1',
            [resourceId]
          );

          if (userResult.rows.length === 0) {
            return false;
          }

          return userResult.rows[0].provider_id === userProviderId;
        }

        return result.rows[0].provider_id === userProviderId;
      } catch (err) {
        logger.error({ error: err instanceof Error ? err.message : err }, 'Error checking resource access');
        return false;
      }
    }

    // Assigned only constraint (for auditors)
    if (permission.constraint === 'assigned_only') {
      try {
        const result = await this.pool.query(
          'SELECT assigned_to FROM findings WHERE id = $1',
          [resourceId]
        );

        if (result.rows.length === 0) {
          return false;
        }

        return result.rows[0].assigned_to === userId;
      } catch (err) {
        logger.error({ error: err instanceof Error ? err.message : err }, 'Error checking assignment');
        return false;
      }
    }

    return false;
  }

  /**
   * Filter resources by permission (for list endpoints)
   */
  async filterResourcesByPermission(
    userId: string,
    userRole: Role,
    userProviderId: string,
    resources: any[],
    resourceType: Resource
  ): Promise<any[]> {
    // Super admin sees all
    if (userRole === Role.SUPER_ADMIN) {
      return resources;
    }

    const filtered = [];

    for (const resource of resources) {
      const canAccess = await this.canAccessResource(
        userId,
        userRole,
        userProviderId,
        resource.id,
        resourceType
      );

      if (canAccess) {
        filtered.push(resource);
      }
    }

    return filtered;
  }

  /**
   * Validate role assignment (prevent privilege escalation)
   */
  canAssignRole(assignerRole: Role, targetRole: Role): boolean {
    // Only super_admin can assign super_admin role
    if (targetRole === Role.SUPER_ADMIN && assignerRole !== Role.SUPER_ADMIN) {
      return false;
    }

    // Super admin can assign any role
    if (assignerRole === Role.SUPER_ADMIN) {
      return true;
    }

    // Provider admin can assign provider_admin and auditor
    if (assignerRole === Role.PROVIDER_ADMIN) {
      return targetRole === Role.PROVIDER_ADMIN || targetRole === Role.AUDITOR;
    }

    // Auditors cannot assign roles
    return false;
  }
}
