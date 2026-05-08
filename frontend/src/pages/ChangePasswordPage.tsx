import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const tempToken = sessionStorage.getItem('change_password_token');
  const email = sessionStorage.getItem('change_password_email') || '';

  useEffect(() => {
    if (!tempToken) {
      navigate('/');
    }
  }, [tempToken, navigate]);

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

    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ temp_token: tempToken, new_password: newPassword, confirm_password: confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        const detail = data.details?.join('. ') || data.message || 'Error al cambiar la contraseña';
        setError(detail);
        return;
      }

      sessionStorage.removeItem('change_password_token');
      sessionStorage.removeItem('change_password_email');

      loginWithToken(data.access_token, data.user);
      navigate('/');
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="lp-root">
      {/* Hero */}
      <div className="lp-hero">
        <div className="lp-hero-brand">
          <div className="lp-brand-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <span className="lp-brand-name">HabilitaPro</span>
        </div>
        <h1 className="lp-hero-title">Crea tu contraseña</h1>
        <p className="lp-hero-sub">
          Por seguridad, debes establecer una contraseña personal antes de continuar.
        </p>
        <ul className="lp-hero-features">
          <li><span className="lp-check">✓</span> Mínimo 8 caracteres</li>
          <li><span className="lp-check">✓</span> Al menos una mayúscula y una minúscula</li>
          <li><span className="lp-check">✓</span> Al menos un número</li>
        </ul>
      </div>

      {/* Form */}
      <div className="lp-form-panel">
        <div className="lp-form-card">
          <div className="lp-form-header">
            <h2 className="lp-form-title">Nueva contraseña</h2>
            {email && <p className="lp-form-subtitle">Cuenta: <strong>{email}</strong></p>}
          </div>

          {error && (
            <div className="lp-error-box">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="lp-form">
            <div className="lp-field">
              <label className="lp-label">Nueva contraseña</label>
              <input
                type="password"
                className="lp-input"
                placeholder="Mínimo 8 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoFocus
              />
            </div>
            <div className="lp-field">
              <label className="lp-label">Confirmar contraseña</label>
              <input
                type="password"
                className="lp-input"
                placeholder="Repite la contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="lp-submit-btn" disabled={isLoading}>
              {isLoading ? (
                <span className="lp-btn-loading">
                  <span className="lp-spinner" />
                  Guardando…
                </span>
              ) : (
                'Establecer contraseña e ingresar'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
