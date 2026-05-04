/**
 * Provider Admin Dashboard
 * Compliance metrics, trends, and management for a single provider
 */

import './dashboards.css';
import React, { useState, useEffect, useCallback } from 'react';
import { useProvider } from '@context/ProviderContext';
import { reportsApi } from '@services/api';

interface ComplianceMetrics {
  compliance_rate: number;
  open_findings: number;
  in_progress_findings: number;
  resolved_findings: number;
  pending_actions: number;
}

interface ComplianceTrend {
  period: string;
  percentage: number;
}

interface StandardCompliance {
  code: string;
  name: string;
  percentage: number;
}


export function ProviderDashboard(): JSX.Element {
  const { selectedProvider } = useProvider();
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [trends, setTrends] = useState<ComplianceTrend[]>([]);
  const [standards, setStandards] = useState<StandardCompliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedProvider) {
      loadMetrics();
    }
  }, [selectedProvider]);

  const loadMetrics = useCallback(async () => {
    if (!selectedProvider) return;
    try {
      setLoading(true);
      setError(null);

      // Import reportsApi
      const { reportsApi } = await import('@services/api');
      const dashboardRes = await reportsApi.getDashboardSummary(selectedProvider.id);

      setMetrics({
        compliance_rate: dashboardRes.compliance_rate,
        open_findings: dashboardRes.open_findings,
        in_progress_findings: dashboardRes.in_progress_findings,
        resolved_findings: dashboardRes.resolved_findings,
        pending_actions: dashboardRes.pending_actions,
      });
    } catch (err) {
      console.error('Error loading metrics:', err);
      // Set default metrics with zeros instead of failing
      setMetrics({
        compliance_rate: 0,
        open_findings: 0,
        in_progress_findings: 0,
        resolved_findings: 0,
        pending_actions: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [selectedProvider]);

  const getTrafficLightColor = (rate: number) => {
    if (rate >= 80) return 'green';
    if (rate >= 50) return 'orange';
    return 'red';
  };

  const getTrendColor = (percentage: number) => {
    if (percentage >= 80) return '#00875a';
    if (percentage >= 50) return '#ff8b00';
    return '#de350b';
  };

  if (loading) {
    return <div className="dashboard-loading">Cargando dashboard...</div>;
  }

  if (!selectedProvider) {
    return <div className="dashboard-error">No hay prestador seleccionado</div>;
  }

  if (!metrics) {
    return <div className="dashboard-loading">Cargando métricas...</div>;
  }

  return (
    <div className="dashboard provider-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>{selectedProvider.legalName}</h1>
          <p className="subtitle">RUT: {selectedProvider.rut} • {selectedProvider.city}, {selectedProvider.department}</p>
        </div>
      </div>

      {/* Main Compliance Card */}
      <section className="compliance-hero">
        <div className={`traffic-light ${getTrafficLightColor(metrics.compliance_rate)}`}>
          <div className="light-circle"></div>
          <div className="compliance-info">
            <div className="compliance-rate">{metrics.compliance_rate.toFixed(1)}%</div>
            <div className="compliance-label">Cumplimiento General</div>
            <div className="compliance-status">
              {metrics.compliance_rate >= 80 ? '✓ Alto' : metrics.compliance_rate >= 50 ? '⚠ Parcial' : '✗ Bajo'}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="compliance-stats">
          <div className="stat">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-value">{metrics.open_findings}</div>
              <div className="stat-label">Hallazgos Abiertos</div>
            </div>
          </div>
          <div className="stat">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <div className="stat-value">{metrics.in_progress_findings}</div>
              <div className="stat-label">En Progreso</div>
            </div>
          </div>
          <div className="stat">
            <div className="stat-icon">✓</div>
            <div className="stat-content">
              <div className="stat-value">{metrics.resolved_findings}</div>
              <div className="stat-label">Resueltos</div>
            </div>
          </div>
          <div className="stat">
            <div className="stat-icon">⚠</div>
            <div className="stat-content">
              <div className="stat-value">{metrics.pending_actions}</div>
              <div className="stat-label">Acciones Pendientes</div>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Trend Chart */}
      <section className="dashboard-section">
        <h2>Tendencia de Cumplimiento (últimos 6 meses)</h2>
        <div className="trend-chart">
          <div className="chart-bars">
            {trends.map((trend, idx) => (
              <div key={idx} className="chart-bar-group">
                <div className="chart-bar-wrapper">
                  <div
                    className="chart-bar"
                    style={{
                      height: `${trend.percentage}%`,
                      backgroundColor: getTrendColor(trend.percentage),
                    }}
                    title={`${trend.percentage}%`}
                  />
                  <div className="chart-value">{trend.percentage}%</div>
                </div>
                <div className="chart-label">{trend.period}</div>
              </div>
            ))}
          </div>
          <div className="chart-axis">
            <div>0%</div>
            <div>50%</div>
            <div>100%</div>
          </div>
        </div>
      </section>

      {/* Standards Compliance */}
      <section className="dashboard-section">
        <h2>Cumplimiento por Estándar</h2>
        <div className="standards-grid">
          {standards.map((std) => (
            <div key={std.code} className="standard-card">
              <div className="standard-header">
                <div className="standard-code">{std.code}</div>
                <div className="standard-percentage" style={{ color: getTrendColor(std.percentage) }}>
                  {std.percentage}%
                </div>
              </div>
              <div className="standard-name">{std.name}</div>
              <div className="standard-bar">
                <div
                  className="standard-bar-fill"
                  style={{
                    width: `${std.percentage}%`,
                    backgroundColor: getTrendColor(std.percentage),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* Quick Actions */}
      <section className="dashboard-section">
        <h2>Acciones Rápidas</h2>
        <div className="actions-grid">
          <a href={`/assessments?provider=${selectedProvider.id}`} className="action-card action-assessments">
            <div className="action-icon">📊</div>
            <div className="action-label">Ver Evaluaciones</div>
            <div className="action-hint">Ejecutar y completar evaluaciones</div>
          </a>

          <a href={`/findings?provider=${selectedProvider.id}`} className="action-card action-findings">
            <div className="action-icon">🔍</div>
            <div className="action-label">Gestionar Hallazgos</div>
            <div className="action-hint">Revisar y resolver hallazgos</div>
          </a>

          <a href={`/reports?provider=${selectedProvider.id}`} className="action-card action-reports">
            <div className="action-icon">📋</div>
            <div className="action-label">Descargar Reportes</div>
            <div className="action-hint">Reportes de cumplimiento</div>
          </a>

          <a href={`/documents?provider=${selectedProvider.id}`} className="action-card action-documents">
            <div className="action-icon">📚</div>
            <div className="action-label">Documentos</div>
            <div className="action-hint">Gestionar documentos requeridos</div>
          </a>
        </div>
      </section>
    </div>
  );
}

export default ProviderDashboard;
