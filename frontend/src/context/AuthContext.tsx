import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  role: 'super_admin' | 'auditor' | 'provider_admin';
  first_name?: string;
  last_name?: string;
  provider_id?: string;
}

export class PasswordChangeRequired extends Error {
  constructor(public tempToken: string, public userEmail: string) {
    super('PASSWORD_CHANGE_REQUIRED');
  }
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithMock: (email: string, role: User['role']) => Promise<void>;
  loginWithToken: (accessToken: string, userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('auth_user');
    const token = localStorage.getItem('auth_token');
    if (stored && token) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // necesario para recibir la cookie HttpOnly de refresh token
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();

      if (data.requiresPasswordChange) {
        throw new PasswordChangeRequired(data.temp_token, data.user.email);
      }

      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithToken = (accessToken: string, userData: User) => {
    localStorage.setItem('auth_token', accessToken);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    setUser(userData);
  };

  const loginWithMock = async (email: string, role: User['role']) => {
    // Desarrollo únicamente: obtiene un JWT real firmado del backend sin contraseña
    setIsLoading(true);
    try {
      const response = await fetch('/auth/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, role }),
      });

      if (!response.ok) {
        throw new Error('Dev login falló — ¿el backend está corriendo en modo desarrollo?');
      }

      const data = await response.json();
      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Notificar al backend para revocar el token y limpiar la cookie HttpOnly
    const token = localStorage.getItem('auth_token');
    if (token) {
      fetch('/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      }).catch(() => { /* silencioso — el cliente siempre cierra sesión localmente */ });
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      loginWithMock,
      loginWithToken,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
