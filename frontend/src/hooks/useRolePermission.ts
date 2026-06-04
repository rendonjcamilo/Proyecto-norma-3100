/**
 * Hook to check if current user has permission to perform actions
 * Centralizes role-based permission logic
 */

import { useAuth } from '../context/AuthContext';

type UserRole = 'super_admin' | 'auditor' | 'provider_admin';

interface PermissionConfig {
  canCreate: UserRole[];
  canEdit: UserRole[];
  canDelete: UserRole[];
  canView: UserRole[];
  canManage: UserRole[];
}

// Define permissions for each resource type
// Based on the role hierarchy: super_admin > auditor > provider_admin
const PERMISSIONS: Record<string, PermissionConfig> = {
  providers: {
    canCreate: ['super_admin', 'auditor'],
    canEdit: ['super_admin', 'auditor'],
    canDelete: ['super_admin'],
    canView: ['super_admin', 'auditor', 'provider_admin'],
    canManage: ['super_admin'],
  },
  assessments: {
    canCreate: ['super_admin', 'auditor'],
    canEdit: ['super_admin', 'auditor'],
    canDelete: ['super_admin', 'auditor'],
    canView: ['super_admin', 'auditor', 'provider_admin'],
    canManage: ['super_admin'],
  },
  findings: {
    canCreate: ['super_admin'],
    canEdit: ['super_admin', 'auditor'],
    canDelete: ['super_admin'],
    canView: ['super_admin', 'auditor', 'provider_admin'],
    canManage: ['super_admin', 'auditor'],
  },
  documents: {
    canCreate: ['super_admin', 'auditor', 'provider_admin'],
    canEdit: ['super_admin', 'auditor'],
    canDelete: ['super_admin'],
    canView: ['super_admin', 'auditor', 'provider_admin'],
    canManage: ['super_admin', 'auditor'],
  },
  reports: {
    canCreate: ['super_admin', 'auditor'],
    canEdit: ['super_admin'],
    canDelete: ['super_admin'],
    canView: ['super_admin', 'auditor', 'provider_admin'],
    canManage: ['super_admin', 'auditor'],
  },
  users: {
    canCreate: ['super_admin'],
    canEdit: ['super_admin'],
    canDelete: ['super_admin'],
    canView: ['super_admin', 'auditor', 'provider_admin'],
    canManage: ['super_admin'],
  },
  questionnaires: {
    canCreate: ['super_admin'],
    canEdit: ['super_admin'],
    canDelete: ['super_admin'],
    canView: ['super_admin', 'auditor', 'provider_admin'],
    canManage: ['super_admin'],
  },
  notifications: {
    canCreate: ['super_admin'],
    canEdit: ['super_admin'],
    canDelete: ['super_admin'],
    canView: ['super_admin', 'auditor', 'provider_admin'],
    canManage: ['super_admin'],
  },
  templates: {
    canCreate: ['super_admin', 'auditor'],
    canEdit: ['super_admin', 'auditor'],
    canDelete: ['super_admin', 'auditor'],
    canView: ['super_admin', 'auditor'],
    canManage: ['super_admin', 'auditor'],
  },
  invima: {
    canCreate: ['super_admin', 'auditor'],
    canEdit: ['super_admin', 'auditor'],
    canDelete: ['super_admin', 'auditor'],
    canView: ['super_admin', 'auditor', 'provider_admin'],
    canManage: ['super_admin', 'auditor'],
  },
};

export const useRolePermission = () => {
  const { user } = useAuth();

  const can = (resource: string, action: 'create' | 'edit' | 'delete' | 'view' | 'manage'): boolean => {
    if (!user) return false;

    const config = PERMISSIONS[resource];
    if (!config) return false;

    const actionKey = `can${action.charAt(0).toUpperCase()}${action.slice(1)}` as keyof PermissionConfig;
    const allowedRoles = config[actionKey];

    return allowedRoles.includes(user.role);
  };

  const hasPermission = (resource: string, action: 'create' | 'edit' | 'delete' | 'view' | 'manage'): boolean => {
    return can(resource, action);
  };

  // Helper methods for common checks
  const canViewResource = (resource: string): boolean => can(resource, 'view');
  const canCreateResource = (resource: string): boolean => can(resource, 'create');
  const canEditResource = (resource: string): boolean => can(resource, 'edit');
  const canDeleteResource = (resource: string): boolean => can(resource, 'delete');
  const canManageResource = (resource: string): boolean => can(resource, 'manage');

  return {
    can,
    hasPermission,
    canViewResource,
    canCreateResource,
    canEditResource,
    canDeleteResource,
    canManageResource,
    userRole: user?.role,
    isAdmin: user?.role === 'super_admin',
    isAuditor: user?.role === 'auditor',
    isProviderAdmin: user?.role === 'provider_admin',
  };
};
