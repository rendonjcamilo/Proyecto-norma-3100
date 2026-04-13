/**
 * Hook to check if current user has permission to perform actions
 * Centralizes role-based permission logic
 */

import { useAuth } from '../context/AuthContext';

type UserRole = 'super_admin' | 'auditor' | 'provider_admin' | 'viewer';

interface PermissionConfig {
  canCreate: UserRole[];
  canEdit: UserRole[];
  canDelete: UserRole[];
  canView: UserRole[];
}

// Define permissions for each resource type
const PERMISSIONS: Record<string, PermissionConfig> = {
  findings: {
    canCreate: ['super_admin', 'auditor', 'provider_admin'],
    canEdit: ['super_admin', 'auditor', 'provider_admin'],
    canDelete: ['super_admin', 'auditor'],
    canView: ['super_admin', 'auditor', 'provider_admin', 'viewer'],
  },
  assessments: {
    canCreate: ['super_admin', 'auditor', 'provider_admin'],
    canEdit: ['super_admin', 'auditor', 'provider_admin'],
    canDelete: ['super_admin'],
    canView: ['super_admin', 'auditor', 'provider_admin'],
  },
  documents: {
    canCreate: ['super_admin', 'auditor', 'provider_admin'],
    canEdit: ['super_admin', 'auditor', 'provider_admin'],
    canDelete: ['super_admin', 'auditor'],
    canView: ['super_admin', 'auditor', 'provider_admin'],
  },
  reports: {
    canCreate: ['super_admin', 'auditor'],
    canEdit: ['super_admin'],
    canDelete: ['super_admin'],
    canView: ['super_admin', 'auditor'],
  },
  providers: {
    canCreate: ['super_admin'],
    canEdit: ['super_admin'],
    canDelete: ['super_admin'],
    canView: ['super_admin', 'auditor'],
  },
  notifications: {
    canCreate: ['super_admin', 'auditor'],
    canEdit: ['super_admin'],
    canDelete: ['super_admin'],
    canView: ['super_admin', 'auditor'],
  },
  templates: {
    canCreate: ['super_admin'],
    canEdit: ['super_admin'],
    canDelete: ['super_admin'],
    canView: ['super_admin'],
  },
};

export const useRolePermission = () => {
  const { user } = useAuth();

  const can = (resource: string, action: 'create' | 'edit' | 'delete' | 'view'): boolean => {
    if (!user) return false;

    const config = PERMISSIONS[resource];
    if (!config) return false;

    const actionKey = `can${action.charAt(0).toUpperCase()}${action.slice(1)}` as keyof PermissionConfig;
    const allowedRoles = config[actionKey];

    return allowedRoles.includes(user.role);
  };

  const hasPermission = (resource: string, action: 'create' | 'edit' | 'delete' | 'view'): boolean => {
    return can(resource, action);
  };

  return {
    can,
    hasPermission,
    userRole: user?.role,
  };
};
