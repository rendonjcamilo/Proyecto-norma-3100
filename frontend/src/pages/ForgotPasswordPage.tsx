import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../services/api';
import './LoginPage.css';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('El correo electrónico es requerido');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSubmitted(true);
    } catch {
      // Mostrar mensaje genérico incluso en error para no revelar info
      setSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-box">
          <div className="login-header">
            <h1>Norma 3100</h1>
            <p>Recuperar contraseña</p>
          </div>

          {submitted ? (
            <div>
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #86efac',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px',
                color: '#166534',
                fontSize: '14px',
                lineHeight: '1.6',
              }}>
                <strong>Solicitud enviada</strong><br />
                Si el correo <strong>{email}</strong> está registrado en el sistema, recibirás las instrucciones para restablecer tu contraseña en los próximos minutos.
              </div>
              <p style={{ fontSize: '13px', color: '#888', textAlign: 'center' }}>
                ¿No recibiste el correo? Verifica tu carpeta de spam o{' '}
                <button
                  type="button"
                  onClick={() => { setSubmitted(false); setEmail(''); }}
                  style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', fontSize: '13px', padding: 0 }}
                >
                  intenta de nuevo
                </button>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="login-form">
              <p style={{ fontSize: '14px', color: '#555', marginBottom: '20px' }}>
                Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
              </p>

              <div className="dashboard-form-group">
                <label htmlFor="email">Correo electrónico</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" disabled={isLoading} className="login-btn">
                {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </button>
            </form>
          )}

          <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #eee' }}>
            <Link
              to="/login"
              style={{ fontSize: '13px', color: '#667eea', textDecoration: 'none' }}
            >
              ← Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
