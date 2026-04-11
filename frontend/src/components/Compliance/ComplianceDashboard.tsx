/**
 * Compliance Dashboard Component
 * Displays comprehensive compliance metrics, risk scoring, and action status
 * for both providers and auditors
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

export const ComplianceDashboard: React.FC<DashboardProps> = ({
  providerId,
  providerName,
  metrics,
  riskAlerts = [],
  loading = false,
  onRefresh,
  userRole = 'provider_admin',
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      handleRefresh();
    }, 5 * 60 * 1000); // Refresh every 5 minutes

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

  const getComplianceStatus = (percentage: number): 'verde' | 'naranja' | 'rojo' => {
    if (percentage >= 80) return 'verde';
    if (percentage >= 50) return 'naranja';
    return 'rojo';
  };

  const getStatusColor = (status: 'verde' | 'naranja' | 'rojo'): string => {
    switch (status) {
      case 'verde':
        return '#2e7d32';
      case 'naranja':
        return '#f57c00';
      case 'rojo':
        return '#c62828';
    }
  };

  const getStatusLabel = (status: 'verde' | 'naranja' | 'rojo'): string => {
    switch (status) {
      case 'verde':
        return 'Cumplimiento Alto';
      case 'naranja':
        return 'Cumplimiento Parcial';
      case 'rojo':
        return 'Cumplimiento Bajo';
    }
  };

  if (loading && !metrics) {
    return (
      <div className="compliance-dashboard loading">
        <div className="spinner">Cargando dashboard...</div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="compliance-dashboard error">
        <p>No hay datos de cumplimiento disponibles</p>
      </div>
    );
  }

  const complianceStatus = getComplianceStatus(metrics.compliancePercentage);
  const statusColor = getStatusColor(complianceStatus);

  return (
    <div className="compliance-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-info">
          <h1>Dashboard de Cumplimiento Norma 3100</h1>
          {providerName && <p className="provider-name">{providerName}</p>}
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn-refresh"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Actualizar datos"
          >
            🔄 {refreshing ? 'Actualizando...' : 'Actualizar'}
          </button>
          <label className="auto-refresh-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
            />
            Auto-actualizar
          </label>
        </div>
      </div>

      {/* Compliance Overview */}
      <div className="compliance-overview">
        <div className="compliance-card main">
          <div className="compliance-circle" style={{ borderColor: statusColor }}>
            <div className="compliance-percentage">{Math.round(metrics.compliancePercentage)}%</div>
          </div>
          <div className="compliance-info">
            <h3>Cumplimiento General</h3>
            <p className="status-label" style={{ color: statusColor }}>
              {getStatusLabel(complianceStatus)}
            </p>
            <p className="status-description">
              {metrics.inProgressFindings + metrics.resolvedFindings} de {metrics.totalFindings} hallazgos en proceso o resueltos
            </p>
          </div>
        </div>

        {/* Trend Indicator */}
        <div className="compliance-card trend">
          <h3>Tendencia</h3>
          <div className="trend-indicator">
            {metrics.trendDirection === 'improving' && (
              <div className="trend improving">
                📈 Mejorando
              </div>
            )}
            {metrics.trendDirection === 'stable' && (
              <div className="trend stable">
                ➡️ Estable
              </div>
            )}
            {metrics.trendDirection === 'worsening' && (
              <div className="trend worsening">
                📉 Empeorando
              </div>
            )}
          </div>
        </div>

        {/* Risk Score */}
        <div className="compliance-card risk-score">
          <h3>Riesgo Promedio</h3>
          <div className="score-display">
            <span className="score-value">{Math.round(metrics.averageRiskScore)}</span>
            <span className="score-label">de 100</span>
          </div>
          <p className="risk-description">
            {metrics.averageRiskScore >= 70 ? '🔴 Alto riesgo' : metrics.averageRiskScore >= 40 ? '🟡 Riesgo moderado' : '🟢 Bajo riesgo'}
          </p>
        </div>
      </div>

      {/* Findings Status Breakdown */}
      <div className="findings-breakdown">
        <h2>Estado de Hallazgos</h2>
        <div className="breakdown-grid">
          <div className="breakdown-card open">
            <div className="count">{metrics.openFindings}</div>
            <div className="label">Abiertos</div>
          </div>
          <div className="breakdown-card in-progress">
            <div className="count">{metrics.inProgressFindings}</div>
            <div className="label">En Progreso</div>
          </div>
          <div className="breakdown-card resolved">
            <div className="count">{metrics.resolvedFindings}</div>
            <div className="label">Resueltos</div>
          </div>
          <div className="breakdown-card closed">
            <div className="count">{metrics.closedFindings}</div>
            <div className="label">Cerrados</div>
          </div>
          <div className="breakdown-card overdue">
            <div className="count">{metrics.overdueFindingsCount}</div>
            <div className="label">Vencidos</div>
          </div>
        </div>

        {/* Status Progress Bar */}
        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-segment open"
              style={{ width: `${(metrics.openFindings / metrics.totalFindings) * 100}%` }}
              title={`Abiertos: ${metrics.openFindings}`}
            />
            <div
              className="progress-segment in-progress"
              style={{ width: `${(metrics.inProgressFindings / metrics.totalFindings) * 100}%` }}
              title={`En Progreso: ${metrics.inProgressFindings}`}
            />
            <div
              className="progress-segment resolved"
              style={{ width: `${(metrics.resolvedFindings / metrics.totalFindings) * 100}%` }}
              title={`Resueltos: ${metrics.resolvedFindings}`}
            />
            <div
              className="progress-segment closed"
              style={{ width: `${(metrics.closedFindings / metrics.totalFindings) * 100}%` }}
              title={`Cerrados: ${metrics.closedFindings}`}
            />
          </div>
        </div>
      </div>

      {/* Risk Alerts */}
      {riskAlerts.length > 0 && (
        <div className="risk-alerts-section">
          <h2>Alertas de Riesgo</h2>
          <div className="alerts-list">
            {riskAlerts.slice(0, 5).map(alert => (
              <div key={alert.id} className={`alert alert-${alert.severity}`}>
                <div className="alert-header">
                  <h4>{alert.title}</h4>
                  <span className={`severity-badge ${alert.severity}`}>
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
                <div className="alert-details">
                  <p>
                    <strong>Puntuación de riesgo:</strong> {Math.round(alert.riskScore)}/100
                  </p>
                  {alert.daysOverdue > 0 && (
                    <p className="overdue">
                      <strong>⚠️ Vencido hace {alert.daysOverdue} días</strong>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {riskAlerts.length > 5 && (
            <p className="more-alerts">... y {riskAlerts.length - 5} alertas más</p>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Acciones Rápidas</h2>
        <div className="actions-grid">
          <button type="button" className="action-button">
            📋 Ver Todos los Hallazgos
          </button>
          <button type="button" className="action-button">
            📝 Ver Todas las Acciones
          </button>
          <button type="button" className="action-button">
            📊 Descargar Reporte
          </button>
          {userRole !== 'provider_admin' && (
            <button type="button" className="action-button">
              ✅ Verificar Acciones
            </button>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="dashboard-footer">
        <p className="update-time">
          Última actualización: {new Date().toLocaleString('es-CO')}
        </p>
        <p className="help-text">
          Las métricas se actualizan automáticamente cada 5 minutos. Haz clic en "Actualizar" para forzar una actualización inmediata.
        </p>
      </div>
    </div>
  );
};

export default ComplianceDashboard;
