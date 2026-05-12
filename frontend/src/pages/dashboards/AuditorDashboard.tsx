/**
 * Auditor Dashboard
 * Manage assigned providers and review pending evaluations
 */

import './dashboards.css';
import './AuditorDashboard.css';
import React, { useState, useEffect } from 'react';
import { providersApi } from '@services/api';
import { useAuth } from '@context/AuthContext';


interface ProviderWithMetrics {
  id: string;
  legal_name: string;
  rut: string;
  compliance_rate?: number;
  pending_validations?: number;
  city?: string;
}

interface AuditorMetrics {
  totalProviders: number;
  pendingEvaluations: number;
  criticalFindings: number;
  avgComplianceRate: number;
  actionsRequired: number;
}


export function AuditorDashboard(): JSX.Element {
  const { user } = useAuth();
  const [providers, setProviders] = useState<ProviderWithMetrics[]>([]);
  const [metrics, setMetrics] = useState<AuditorMetrics>({
    totalProviders: 0,
    pendingEvaluations: 0,
    criticalFindings: 0,
    avgComplianceRate: 0,
    actionsRequired: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProviders();
  }, [user?.id]);

  const loadProviders = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const [response, kpis] = await Promise.all([
        providersApi.getAuditorProviders(user.id),
        providersApi.getAuditorMetrics(user.id).catch(() => null),
      ]);
      setProviders((response.providers || []) as ProviderWithMetrics[]);
      setMetrics({
        totalProviders: response.count || 0,
        pendingEvaluations: kpis?.pendingEvaluations ?? 0,
        criticalFindings: kpis?.criticalFindings ?? 0,
        avgComplianceRate: kpis?.avgComplianceRate ?? 0,
        actionsRequired: kpis?.actionsRequired ?? 0,
      });
    } catch (err) {
      console.error('Error loading auditor providers:', err);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeClass = (rate?: number) => {
    if (!rate) return 'adb-badge-gray';
    if (rate >= 80) return 'adb-badge-green';
    if (rate >= 50) return 'adb-badge-orange';
    return 'adb-badge-red';
  };

  const getBadgeLabel = (rate?: number) => {
    if (!rate) return '';
    if (rate >= 80) return '✓ Conforme';
    if (rate >= 50) return '⚠ Parcial';
    return '✗ No conforme';
  };

  if (loading) {
    return <div className="dashboard-loading">Cargando dashboard...</div>;
  }

  return (
    <div className="adb-root">

      {/* ── HERO BANNER ─────────────────────────────────── */}
      <div className="adb-hero">
        <div className="adb-hero-content">
          <span className="adb-hero-badge">
            <svg width="6" height="6" viewBox="0 0 6 6" fill="none">
              <circle cx="3" cy="3" r="3" fill="#A78BFA"/>
            </svg>
            Auditoría — Norma 3100
          </span>
          <h1 className="adb-hero-title">
            Bienvenido(a), <span>{user?.first_name || 'Auditor'}</span>
          </h1>
          <p className="adb-hero-subtitle">
            Panel de auditoría y seguimiento de cumplimiento de prestadores
          </p>
        </div>

        <button onClick={loadProviders} className="adb-refresh-btn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          Actualizar
        </button>

        <div className="adb-hero-orb adb-hero-orb-1" />
        <div className="adb-hero-orb adb-hero-orb-2" />
      </div>

      {/* ── KPI STRIP ───────────────────────────────────── */}
      <div className="adb-kpi-strip">

        {/* Prestadores */}
        <div className="adb-kpi-card adb-kpi-indigo">
          <div className="adb-kpi-icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div className="adb-kpi-body">
            <div className="adb-kpi-value">{metrics.totalProviders}</div>
            <div className="adb-kpi-label">Prestadores</div>
          </div>
          <div className="adb-kpi-glow" />
        </div>

        {/* Auditorías Realizadas */}
        <div className="adb-kpi-card adb-kpi-amber">
          <div className="adb-kpi-icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
              <polyline points="9 12 11 14 15 10"/>
            </svg>
          </div>
          <div className="adb-kpi-body">
            <div className="adb-kpi-value">{metrics.pendingEvaluations}</div>
            <div className="adb-kpi-label">Audit. Realizadas</div>
          </div>
          <div className="adb-kpi-glow" />
        </div>

        {/* Hallazgos Críticos */}
        <div className="adb-kpi-card adb-kpi-rose">
          <div className="adb-kpi-icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div className="adb-kpi-body">
            <div className="adb-kpi-value">{metrics.criticalFindings}</div>
            <div className="adb-kpi-label">Hallazgos Críticos</div>
          </div>
          <div className="adb-kpi-glow" />
        </div>

        {/* Cumplimiento Promedio */}
        <div className="adb-kpi-card adb-kpi-cyan">
          <div className="adb-kpi-icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6"  y1="20" x2="6"  y2="14"/>
            </svg>
          </div>
          <div className="adb-kpi-body">
            <div className="adb-kpi-value">{metrics.avgComplianceRate}%</div>
            <div className="adb-kpi-label">Cumpl. Promedio</div>
          </div>
          <div className="adb-kpi-glow" />
        </div>

      </div>

      {/* ── PRESTADORES ─────────────────────────────────── */}
      <div className="adb-section">
        <div className="adb-section-header">
          <span className="adb-section-dot" />
          <h2>Mis Prestadores Asignados</h2>
        </div>

        {providers.length === 0 ? (
          <div className="adb-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <h3>Sin prestadores asignados</h3>
            <p>Solicite que le asignen prestadores para comenzar a auditar</p>
          </div>
        ) : (
          <div className="adb-provider-grid">
            {providers.map(provider => (
              <div key={provider.id} className="adb-provider-card">
                <div className="adb-provider-top">
                  <div className="adb-provider-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                      <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                  </div>
                  <span className={`adb-provider-badge ${getBadgeClass(provider.compliance_rate)}`}>
                    {getBadgeLabel(provider.compliance_rate)}
                  </span>
                </div>

                <div className="adb-provider-name">{provider.legal_name}</div>

                <div className="adb-provider-info">
                  <div className="adb-info-row">
                    <span className="adb-info-label">Identificación</span>
                    <span className="adb-info-value">{provider.rut}</span>
                  </div>
                  <div className="adb-info-row">
                    <span className="adb-info-label">Cumplimiento</span>
                    <span className="adb-info-value">
                      {provider.compliance_rate != null ? `${provider.compliance_rate.toFixed(1)}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="adb-info-row">
                    <span className="adb-info-label">Pendientes validar</span>
                    <span className="adb-pending-badge">{provider.pending_validations || 0}</span>
                  </div>
                </div>

                <div className="adb-provider-actions">
                  <a href={`/providers/${provider.id}`} className="adb-btn-outline">
                    Ver Detalles
                  </a>
                  <a href={`/assessments?provider=${provider.id}`} className="adb-btn-outline">
                    Auditorías
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
