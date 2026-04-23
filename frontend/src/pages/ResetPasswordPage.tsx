import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../services/api';
import './LoginPage.css';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') || '';
  const userId = searchParams.get('uid') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !userId) {
      setError('El enlace de recuperación no es válido. Solicita uno nuevo.');
    }
  }, [token, userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('Completa todos los campos');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 12) {
      setError('La contraseña debe tener al menos 12 caracteres');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword(token, userId, newPassword);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al restablecer la contraseña';
      setError(msg.includes('venc') || msg.includes('valid') ? msg : 'El enlace no es válido o ya fue utilizado. Solicita uno nuevo.');
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
            <p>Nueva contraseña</p>
          </div>

          {success ? (
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
                <strong>¡Contraseña restablecida!</strong><br />
                Tu contraseña ha sido actualizada exitosamente. Serás redirigido al inicio de sesión en unos segundos.
              </div>
              <div style={{ textAlign: 'center' }}>
                <Link to="/login" className="login-btn" style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center' }}>
                  Ir al inicio de sesión
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="login-form">
              <p style={{ fontSize: '14px', color: '#555', marginBottom: '20px' }}>
                Crea una nueva contraseña segura para tu cuenta. Debe tener al menos 12 caracteres.
              </p>

              <div className="dashboard-form-group">
                <label htmlFor="newPassword">Nueva contraseña</label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 12 caracteres"
                  disabled={isLoading || !token}
                  autoFocus
                />
              </div>

              <div className="dashboard-form-group">
                <label htmlFor="confirmPassword">Confirmar contraseña</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  disabled={isLoading || !token}
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" disabled={isLoading || !token} className="login-btn">
                {isLoading ? 'Guardando...' : 'Guardar nueva contraseña'}
              </button>
            </form>
          )}

          <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #eee' }}>
            <Link
              to="/forgot-password"
              style={{ fontSize: '13px', color: '#667eea', textDecoration: 'none' }}
            >
              Solicitar nuevo enlace
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
