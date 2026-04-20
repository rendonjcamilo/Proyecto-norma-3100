import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginWithMock, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

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
      setError('Error de autenticación. Verifica tu correo y contraseña.');
    }
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

          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #ccc' }}>
            <p style={{ fontSize: '12px', color: '#666' }}>🔧 Dev: Login Mock</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => { loginWithMock('dev@test.com', 'super_admin'); navigate('/'); }}
                style={{ padding: '8px 12px', fontSize: '12px', flex: 1, minWidth: '100px' }}
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => { loginWithMock('dev@test.com', 'auditor'); navigate('/'); }}
                style={{ padding: '8px 12px', fontSize: '12px', flex: 1, minWidth: '100px' }}
              >
                Auditor
              </button>
              <button
                type="button"
                onClick={() => { loginWithMock('dev@test.com', 'provider_admin'); navigate('/'); }}
                style={{ padding: '8px 12px', fontSize: '12px', flex: 1, minWidth: '100px' }}
              >
                Provider
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
