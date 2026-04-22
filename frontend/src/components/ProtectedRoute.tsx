import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: Array<'super_admin' | 'auditor' | 'provider_admin'>;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  console.log('[ProtectedRoute] Rendering:', { isAuthenticated, isLoading, userRole: user?.role, requiredRoles });

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontSize: '14px',
        color: '#666',
      }}>
        Cargando...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    console.error('[ProtectedRoute] Permission denied', {
      userRole: user.role,
      requiredRoles,
      user: { id: user.id, email: user.email, role: user.role }
    });
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontSize: '14px',
        color: '#c33',
      }}>
        ❌ No tienes permisos para acceder a esta página
        <div style={{ fontSize: '12px', marginTop: '10px', color: '#999' }}>
          (Tu rol: <code>{user.role}</code>, Requeridos: <code>{requiredRoles.join(', ')}</code>)
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
