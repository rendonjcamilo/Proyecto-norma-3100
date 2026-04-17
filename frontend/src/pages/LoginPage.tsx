import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, User } from '../context/AuthContext';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginWithMock, isLoading } = useAuth();

  const [email, setEmail] = useState('admin@test.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showMockOptions, setShowMockOptions] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email es requerido');
      return;
    }

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      // Si falla la BD, usar mock login automáticamente
      console.log('BD no disponible, usando mock login');
      loginWithMock(email, 'provider_admin');
      navigate('/');
    }
  };

  const handleMockLogin = (role: User['role']) => {
    loginWithMock(email || 'demo@test.com', role);
    navigate('/');
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-box">
          <div className="login-header">
            <h1>Norma 3100</h1>
            <p>Sistema de Gestión de Cumplimiento</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="dashboard-form-group">
              <label htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                disabled={isLoading}
              />
            </div>

            <div className="dashboard-form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" disabled={isLoading} className="login-btn">
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="divider">O</div>

          <div className="mock-login-section">
            <p className="mock-info">
              🧪 Para demostración, usa una cuenta mock (sin BD disponible):
            </p>
            <button
              type="button"
              onClick={() => setShowMockOptions(!showMockOptions)}
              className="toggle-mock-btn"
            >
              {showMockOptions ? '↓ Ocultar' : '→ Mostrar'} opciones de prueba
            </button>

            {showMockOptions && (
              <div className="mock-options">
                <button
                  type="button"
                  onClick={() => handleMockLogin('super_admin')}
                  className="mock-btn super-admin"
                >
                  👤 Administrador
                </button>
                <button
                  type="button"
                  onClick={() => handleMockLogin('provider_admin')}
                  className="mock-btn provider-admin"
                >
                  🏥 Prestador de Servicio
                </button>
                <button
                  type="button"
                  onClick={() => handleMockLogin('auditor')}
                  className="mock-btn auditor"
                >
                  📋 Auditor
                </button>
              </div>
            )}
          </div>

          <div className="login-footer">
            <p className="credentials-hint">
              💡 Credenciales de prueba con BD:
              <br />
              Correo: admin@test.com
              <br />
              Contraseña: AdminTest2025!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
