/**
 * Compliance Dashboard Component
 * Professional, interactive dashboard with metric cards, KPIs and risk insights
 */

import React, { useState, useEffect } from 'react';
import './ComplianceDashboard.css';

interface ComplianceMetrics {
  providerId: string;
  providerName: string;
  totalFindings: number;
  openFindings: number;
  inProgressFindings: number;
  resolvedFindings: number;
  closedFindings: number;
  overdueFindingsCount: number;
  averageRiskScore: number;
  compliancePercentage: number;
  trendDirection: 'improving' | 'stable' | 'worsening';
}

interface RiskAlert {
  id: string;
  findingId: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  daysOverdue: number;
}

interface DashboardProps {
  providerId?: string;
  providerName?: string;
  metrics?: ComplianceMetrics;
  riskAlerts?: RiskAlert[];
  loading?: boolean;
  onRefresh?: () => Promise<void>;
  userRole?: 'auditor' | 'provider_admin' | 'super_admin';
}

type ComplianceStatus = 'verde' | 'naranja' | 'rojo';

const STATUS_LABELS: Record<ComplianceStatus, string> = {
  verde: 'Cumplimiento Alto',
  naranja: 'Cumplimiento Parcial',
  rojo: 'Cumplimiento Bajo',
};

const getComplianceStatus = (percentage: number): ComplianceStatus => {
  if (percentage >= 80) return 'verde';
  if (percentage >= 50) return 'naranja';
  return 'rojo';
};

// SVG Icons
const Icons = {
  refresh: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  trendUp: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  trendFlat: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="13 6 19 12 13 18" />
    </svg>
  ),
  trendDown: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  ),
  open: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  inProgress: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  resolved: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  closed: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  overdue: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  riskShield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  download: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  list: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  edit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  arrow: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
};

export const ComplianceDashboard: React.FC<DashboardProps> = ({
  providerName,
  metrics,
  riskAlerts = [],
  loading = false,
  onRefresh,
  userRole = 'provider_admin',
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [activeBreakdown, setActiveBreakdown] = useState<string | null>(null);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      handleRefresh();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, onRefresh]);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  if (loading && !metrics) {
    return (
      <div className="dashboard-state">
        <div className="dashboard-spinner" />
        <p>Cargando dashboard de cumplimiento...</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="dashboard-state error">
        <p>No hay datos de cumplimiento disponibles</p>
      </div>
    );
  }

  const complianceStatus = getComplianceStatus(metrics.compliancePercentage);
  const compliancePct = Math.round(metrics.compliancePercentage);
  const circumference = 2 * Math.PI * 70;
  const strokeOffset = circumference - (compliancePct / 100) * circumference;

  const trendMap = {
    improving: { icon: Icons.trendUp, label: 'Mejorando', tone: 'success', delta: '+5.2%' },
    stable: { icon: Icons.trendFlat, label: 'Estable', tone: 'neutral', delta: '0%' },
    worsening: { icon: Icons.trendDown, label: 'Empeorando', tone: 'danger', delta: '-3.4%' },
  };
  const trend = trendMap[metrics.trendDirection];

  const riskTone =
    metrics.averageRiskScore >= 70 ? 'danger' : metrics.averageRiskScore >= 40 ? 'warning' : 'success';
  const riskLabel =
    metrics.averageRiskScore >= 70 ? 'Alto Riesgo' : metrics.averageRiskScore >= 40 ? 'Riesgo Moderado' : 'Bajo Riesgo';

  const breakdownItems = [
    { key: 'open', label: 'Abiertos', count: metrics.openFindings, icon: Icons.open, tone: 'danger', description: 'Sin acción inicial' },
    { key: 'in-progress', label: 'En Progreso', count: metrics.inProgressFindings, icon: Icons.inProgress, tone: 'info', description: 'Con plan de acción' },
    { key: 'resolved', label: 'Resueltos', count: metrics.resolvedFindings, icon: Icons.resolved, tone: 'success', description: 'Pendientes verificación' },
    { key: 'closed', label: 'Cerrados', count: metrics.closedFindings, icon: Icons.closed, tone: 'neutral', description: 'Verificados y archivados' },
    { key: 'overdue', label: 'Vencidos', count: metrics.overdueFindingsCount, icon: Icons.overdue, tone: 'warning', description: 'Requieren atención urgente' },
  ];

  return (
    <div className="compliance-dashboard">
      {/* === HEADER === */}
      <header className="dashboard-header">
        <div className="dashboard-header-info">
          <div className="header-eyebrow">
            <span className="status-pulse" data-status={complianceStatus} />
            <span>Sistema operativo · Datos en tiempo real</span>
          </div>
          <h1 className="dashboard-title">Dashboard de Cumplimiento</h1>
          {providerName && (
            <p className="dashboard-subtitle">
              {providerName} <span className="subtitle-divider">·</span> Norma 3100
            </p>
          )}
        </div>

        <div className="dashboard-header-actions">
          <label className="auto-refresh-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
            />
            <span className="toggle-track">
              <span className="toggle-thumb" />
            </span>
            <span className="toggle-label">Auto-actualizar</span>
          </label>
          <button
            type="button"
            className={`btn-primary ${refreshing ? 'is-loading' : ''}`}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <span className="btn-icon">{Icons.refresh}</span>
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
      </header>

      {/* === KPI HERO === */}
      <section className="kpi-hero">
        {/* Compliance Gauge */}
        <article className={`kpi-card kpi-hero-main status-${complianceStatus}`}>
          <div className="kpi-card-header">
            <span className="kpi-label">Cumplimiento General</span>
            <span className={`kpi-badge tone-${complianceStatus}`}>{STATUS_LABELS[complianceStatus]}</span>
          </div>
          <div className="kpi-gauge-wrapper">
            <svg className="kpi-gauge" viewBox="0 0 160 160">
              <defs>
                <linearGradient id="gauge-gradient-verde" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00875a" />
                  <stop offset="100%" stopColor="#36b37e" />
                </linearGradient>
                <linearGradient id="gauge-gradient-naranja" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ff8b00" />
                  <stop offset="100%" stopColor="#ffab00" />
                </linearGradient>
                <linearGradient id="gauge-gradient-rojo" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#de350b" />
                  <stop offset="100%" stopColor="#ff5630" />
                </linearGradient>
              </defs>
              <circle cx="80" cy="80" r="70" className="gauge-track" />
              <circle
                cx="80"
                cy="80"
                r="70"
                className="gauge-fill"
                stroke={`url(#gauge-gradient-${complianceStatus})`}
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                transform="rotate(-90 80 80)"
              />
            </svg>
            <div className="kpi-gauge-center">
              <div className="kpi-gauge-value">{compliancePct}<span>%</span></div>
              <div className="kpi-gauge-label">Conformidad</div>
            </div>
          </div>
          <div className="kpi-card-footer">
            <div className="kpi-footer-stat">
              <span className="stat-value">{metrics.inProgressFindings + metrics.resolvedFindings}</span>
              <span className="stat-label">en proceso/resueltos</span>
            </div>
            <div className="kpi-footer-divider" />
            <div className="kpi-footer-stat">
              <span className="stat-value">{metrics.totalFindings}</span>
              <span className="stat-label">total hallazgos</span>
            </div>
          </div>
        </article>

        {/* Trend */}
        <article className={`kpi-card kpi-trend tone-${trend.tone}`}>
          <div className="kpi-card-header">
            <span className="kpi-label">Tendencia Mensual</span>
            <span className={`kpi-delta tone-${trend.tone}`}>{trend.delta}</span>
          </div>
          <div className="kpi-trend-display">
            <div className={`trend-icon tone-${trend.tone}`}>{trend.icon}</div>
            <div>
              <div className="trend-value">{trend.label}</div>
              <div className="trend-context">vs. mes anterior</div>
            </div>
          </div>
          <div className="kpi-sparkline">
            <svg viewBox="0 0 200 60" preserveAspectRatio="none">
              <defs>
                <linearGradient id="spark-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(0, 135, 90, 0.3)" />
                  <stop offset="100%" stopColor="rgba(0, 135, 90, 0)" />
                </linearGradient>
              </defs>
              <path
                d="M0,45 L25,40 L50,42 L75,30 L100,32 L125,25 L150,20 L175,15 L200,10 L200,60 L0,60 Z"
                fill="url(#spark-gradient)"
              />
              <path
                d="M0,45 L25,40 L50,42 L75,30 L100,32 L125,25 L150,20 L175,15 L200,10"
                fill="none"
                stroke="#00875a"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </article>

        {/* Risk Score */}
        <article className={`kpi-card kpi-risk tone-${riskTone}`}>
          <div className="kpi-card-header">
            <span className="kpi-label">Riesgo Promedio</span>
            <div className={`kpi-icon-badge tone-${riskTone}`}>{Icons.riskShield}</div>
          </div>
          <div className="kpi-risk-display">
            <div className="risk-value">
              <span className="risk-number">{Math.round(metrics.averageRiskScore)}</span>
              <span className="risk-max">/100</span>
            </div>
            <div className={`risk-label tone-${riskTone}`}>{riskLabel}</div>
          </div>
          <div className="kpi-risk-bar">
            <div className="risk-bar-track">
              <div
                className={`risk-bar-fill tone-${riskTone}`}
                style={{ width: `${metrics.averageRiskScore}%` }}
              />
            </div>
            <div className="risk-bar-markers">
              <span>0</span>
              <span>40</span>
              <span>70</span>
              <span>100</span>
            </div>
          </div>
        </article>
      </section>

      {/* === FINDINGS BREAKDOWN === */}
      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Estado de Hallazgos</h2>
            <p className="section-subtitle">Distribución actual por estado del ciclo de vida</p>
          </div>
          <button type="button" className="section-link">
            Ver detalles {Icons.arrow}
          </button>
        </div>

        <div className="breakdown-grid">
          {breakdownItems.map(item => {
            const percentage = metrics.totalFindings > 0
              ? Math.round((item.count / metrics.totalFindings) * 100)
              : 0;
            return (
              <button
                key={item.key}
                type="button"
                className={`breakdown-card tone-${item.tone} ${activeBreakdown === item.key ? 'is-active' : ''}`}
                onMouseEnter={() => setActiveBreakdown(item.key)}
                onMouseLeave={() => setActiveBreakdown(null)}
              >
                <div className="breakdown-card-top">
                  <div className={`breakdown-icon tone-${item.tone}`}>{item.icon}</div>
                  <span className="breakdown-percentage">{percentage}%</span>
                </div>
                <div className="breakdown-count">{item.count}</div>
                <div className="breakdown-label">{item.label}</div>
                <div className="breakdown-description">{item.description}</div>
                <div className="breakdown-progress">
                  <div
                    className={`breakdown-progress-fill tone-${item.tone}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Combined progress bar */}
        <div className="distribution-bar">
          <div className="distribution-header">
            <span className="distribution-title">Distribución Total</span>
            <span className="distribution-total">{metrics.totalFindings} hallazgos</span>
          </div>
          <div className="distribution-track">
            {breakdownItems.slice(0, 4).map(item => {
              const width = metrics.totalFindings > 0
                ? (item.count / metrics.totalFindings) * 100
                : 0;
              if (width === 0) return null;
              return (
                <div
                  key={item.key}
                  className={`distribution-segment tone-${item.tone} ${activeBreakdown === item.key ? 'is-highlighted' : ''}`}
                  style={{ width: `${width}%` }}
                  title={`${item.label}: ${item.count}`}
                  onMouseEnter={() => setActiveBreakdown(item.key)}
                  onMouseLeave={() => setActiveBreakdown(null)}
                />
              );
            })}
          </div>
          <div className="distribution-legend">
            {breakdownItems.slice(0, 4).map(item => (
              <div
                key={item.key}
                className={`legend-item ${activeBreakdown === item.key ? 'is-highlighted' : ''}`}
                onMouseEnter={() => setActiveBreakdown(item.key)}
                onMouseLeave={() => setActiveBreakdown(null)}
              >
                <span className={`legend-dot tone-${item.tone}`} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === RISK ALERTS === */}
      {riskAlerts.length > 0 && (
        <section className="dashboard-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">
                Alertas de Riesgo
                <span className="section-count">{riskAlerts.length}</span>
              </h2>
              <p className="section-subtitle">Hallazgos críticos que requieren atención inmediata</p>
            </div>
            <button type="button" className="section-link">
              Ver todas {Icons.arrow}
            </button>
          </div>

          <div className="alerts-list">
            {riskAlerts.slice(0, 5).map((alert, idx) => (
              <article
                key={alert.id}
                className={`alert-card severity-${alert.severity}`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className={`alert-severity-bar severity-${alert.severity}`} />
                <div className="alert-body">
                  <div className="alert-meta">
                    <span className={`severity-pill severity-${alert.severity}`}>
                      {{ critical: 'CRÍTICO', high: 'ALTO', medium: 'MEDIO', low: 'BAJO' }[alert.severity] || alert.severity.toUpperCase()}
                    </span>
                    <span className="alert-id">#{alert.findingId}</span>
                    {alert.daysOverdue > 0 && (
                      <span className="overdue-pill">
                        Vencido hace {alert.daysOverdue} {alert.daysOverdue === 1 ? 'día' : 'días'}
                      </span>
                    )}
                  </div>
                  <h4 className="alert-title">{alert.title}</h4>
                  <div className="alert-footer">
                    <div className="alert-risk">
                      <span className="alert-risk-label">Puntuación de riesgo</span>
                      <div className="alert-risk-bar">
                        <div
                          className={`alert-risk-fill severity-${alert.severity}`}
                          style={{ width: `${alert.riskScore}%` }}
                        />
                      </div>
                      <span className="alert-risk-value">{Math.round(alert.riskScore)}/100</span>
                    </div>
                  </div>
                </div>
                <button type="button" className="alert-action" aria-label="Ver hallazgo">
                  {Icons.arrow}
                </button>
              </article>
            ))}
          </div>

          {riskAlerts.length > 5 && (
            <div className="more-alerts">
              <button type="button" className="more-alerts-btn">
                Ver {riskAlerts.length - 5} alertas más
              </button>
            </div>
          )}
        </section>
      )}

      {/* === QUICK ACTIONS === */}
      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Acciones Rápidas</h2>
            <p className="section-subtitle">Accesos directos a las tareas más frecuentes</p>
          </div>
        </div>

        <div className="actions-grid">
          <button type="button" className="action-card">
            <div className="action-icon tone-info">{Icons.list}</div>
            <div className="action-content">
              <h4>Ver Hallazgos</h4>
              <p>Listado completo y filtros</p>
            </div>
            <span className="action-arrow">{Icons.arrow}</span>
          </button>

          <button type="button" className="action-card">
            <div className="action-icon tone-purple">{Icons.edit}</div>
            <div className="action-content">
              <h4>Plan de Acciones</h4>
              <p>Gestionar acciones correctivas</p>
            </div>
            <span className="action-arrow">{Icons.arrow}</span>
          </button>

          <button type="button" className="action-card">
            <div className="action-icon tone-success">{Icons.download}</div>
            <div className="action-content">
              <h4>Descargar Reporte</h4>
              <p>Exportar datos en PDF/Excel</p>
            </div>
            <span className="action-arrow">{Icons.arrow}</span>
          </button>

          {userRole !== 'provider_admin' && (
            <button type="button" className="action-card">
              <div className="action-icon tone-warning">{Icons.check}</div>
              <div className="action-content">
                <h4>Verificar Acciones</h4>
                <p>Aprobar cierres pendientes</p>
              </div>
              <span className="action-arrow">{Icons.arrow}</span>
            </button>
          )}
        </div>
      </section>

      {/* === FOOTER === */}
      <footer className="dashboard-footer">
        <div className="footer-meta">
          <span className="footer-dot" />
          <span>Última actualización: {new Date().toLocaleString('es-CO')}</span>
        </div>
        <p className="footer-help">
          Las métricas se actualizan automáticamente cada 5 minutos. Activa "Auto-actualizar" para ver datos en tiempo real.
        </p>
      </footer>
    </div>
  );
};

export default ComplianceDashboard;
