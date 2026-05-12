/**
 * Super Admin Dashboard
 * Global metrics and quick access for system administration
 */

import './dashboards.css';
import './SuperAdminDashboard.css';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportsApi } from '@services/api';
import { useAuth } from '@context/AuthContext';

interface GlobalSummary {
  totalProviders: number;
  totalAuditors: number;
  assessmentsInProgress: number;
  criticalFindings: number;
  avgComplianceRate: number;
}

export function SuperAdminDashboard(): JSX.Element {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<GlobalSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGlobalSummary();
  }, []);

  const fetchGlobalSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportsApi.getGlobalSummary();
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading summary');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Cargando métricas globales...</div>;
  }

  if (error) {
    return <div className="dashboard-error">Error: {error}</div>;
  }

  return (
    <div className="sad-root">

      {/* ── HERO BANNER ─────────────────────────────────── */}
      <div className="sad-hero">
        <div className="sad-hero-content">
          <span className="sad-hero-badge">
            {/* punto de estado */}
            <svg width="6" height="6" viewBox="0 0 6 6" fill="none">
              <circle cx="3" cy="3" r="3" fill="#818cf8"/>
            </svg>
            Sistema de Gestión — Norma 3100
          </span>
          <h1 className="sad-hero-title">
            Bienvenido(a), <span>{user?.first_name || 'Administrador'}</span>
          </h1>
          <p className="sad-hero-subtitle">
            Panel de control del sistema de auditoría y cumplimiento
          </p>
        </div>

        <button onClick={fetchGlobalSummary} className="sad-refresh-btn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          Actualizar
        </button>

        <div className="sad-hero-orb sad-hero-orb-1" />
        <div className="sad-hero-orb sad-hero-orb-2" />
      </div>

      {/* ── KPI STRIP ───────────────────────────────────── */}
      <div className="sad-kpi-strip">

        {/* Prestadores */}
        <div className="sad-kpi-card sad-kpi-indigo sad-kpi-clickable" onClick={() => navigate('/providers')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate('/providers')}>
          <div className="sad-kpi-icon-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div className="sad-kpi-body">
            <div className="sad-kpi-value">{summary?.totalProviders ?? 0}</div>
            <div className="sad-kpi-label">Prestadores</div>
          </div>
          <div className="sad-kpi-glow" />
        </div>

        {/* Auditores */}
        <div className="sad-kpi-card sad-kpi-cyan sad-kpi-clickable" onClick={() => navigate('/users')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate('/users')}>
          <div className="sad-kpi-icon-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div className="sad-kpi-body">
            <div className="sad-kpi-value">{summary?.totalAuditors ?? 0}</div>
            <div className="sad-kpi-label">Auditores activos</div>
          </div>
          <div className="sad-kpi-glow" />
        </div>

      </div>

      {/* ── QUICK ACCESS ────────────────────────────────── */}
      <div className="sad-section">
        <div className="sad-section-header">
          <span className="sad-section-dot" />
          <h2>Accesos rápidos de administración</h2>
        </div>

        <div className="sad-nav-grid">

          {/* Cuestionarios */}
          <a href="/questionnaires" className="sad-nav-card sad-nav-indigo">
            <div className="sad-nav-icon-row">
              <div className="sad-nav-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <svg className="sad-nav-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7"/>
                <polyline points="7 7 17 7 17 17"/>
              </svg>
            </div>
            <div className="sad-nav-label">Cuestionarios</div>
            <div className="sad-nav-desc">Gestiona los cuestionarios de la Norma 3100 y sus criterios transversales</div>
          </a>

          {/* Usuarios */}
          <a href="/users" className="sad-nav-card sad-nav-emerald">
            <div className="sad-nav-icon-row">
              <div className="sad-nav-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <svg className="sad-nav-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7"/>
                <polyline points="7 7 17 7 17 17"/>
              </svg>
            </div>
            <div className="sad-nav-label">Gestionar Usuarios</div>
            <div className="sad-nav-desc">Crea, edita y administra los usuarios del sistema por rol y prestador</div>
          </a>

{/* Plantillas */}
          <a href="/notifications/email-templates" className="sad-nav-card sad-nav-cyan">
            <div className="sad-nav-icon-row">
              <div className="sad-nav-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <svg className="sad-nav-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7"/>
                <polyline points="7 7 17 7 17 17"/>
              </svg>
            </div>
            <div className="sad-nav-label">Plantillas Notificación</div>
            <div className="sad-nav-desc">Diseña y actualiza plantillas de email y SMS para comunicaciones del sistema</div>
          </a>

        </div>
      </div>

    </div>
  );
}
