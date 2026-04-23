import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

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
    <div className="lp-root">

      {/* ── Panel izquierdo — hero ───────────────────────────── */}
      <div className="lp-hero">
        <div className="lp-orb lp-orb-1" />
        <div className="lp-orb lp-orb-2" />
        <div className="lp-orb lp-orb-3" />

        <div className="lp-hero-content">
          <span className="lp-hero-badge">
            <svg width="6" height="6" viewBox="0 0 6 6" fill="none">
              <circle cx="3" cy="3" r="3" fill="#818cf8" />
            </svg>
            Resolución 3100 · MinSalud Colombia
          </span>

          <h1 className="lp-hero-title">
            Sistema de<br />
            <span>Gestión de</span><br />
            Cumplimiento
          </h1>

          <p className="lp-hero-subtitle">
            Plataforma de autoevaluación y auditoría para prestadores
            de servicios de salud bajo la Norma 3100.
          </p>

          <div className="lp-features">
            <div className="lp-feature-item">
              <div className="lp-feature-dot" />
              512 criterios transversales evaluados
            </div>
            <div className="lp-feature-item">
              <div className="lp-feature-dot" />
              7 estándares de habilitación
            </div>
            <div className="lp-feature-item">
              <div className="lp-feature-dot" />
              Rastreo de hallazgos y acciones correctivas
            </div>
            <div className="lp-feature-item">
              <div className="lp-feature-dot" />
              Informes de auditoría descargables
            </div>
          </div>
        </div>
      </div>

      {/* ── Panel derecho — formulario ───────────────────────── */}
      <div className="lp-form-panel">
        <div className="lp-card">
          <div className="lp-card-header">
            <h2 className="lp-card-title">Iniciar sesión</h2>
            <p className="lp-card-subtitle">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleLogin} className="lp-form">
            <div className="lp-field">
              <label htmlFor="email" className="lp-label">Correo electrónico</label>
              <input
                id="email"
                type="email"
                className="lp-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            <div className="lp-field">
              <label htmlFor="password" className="lp-label">Contraseña</label>
              <input
                id="password"
                type="password"
                className="lp-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            {error && <div className="lp-error">{error}</div>}

            <button type="submit" disabled={isLoading} className="lp-submit-btn">
              {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>

            <div className="lp-forgot">
              <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
            </div>
          </form>

          <div className="lp-card-footer">
            <p>Sistema restringido a usuarios autorizados.<br />Norma 3100 · Ministerio de Salud de Colombia</p>
          </div>
        </div>
      </div>

    </div>
  );
};
