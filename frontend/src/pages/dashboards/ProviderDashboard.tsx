/**
 * Provider Admin Dashboard
 * Compliance metrics, trends, and management for a single provider
 */

import './dashboards.css';
import React, { useState, useEffect, useCallback } from 'react';
import { useProvider } from '@context/ProviderContext';
import { assessmentsApi, findingsApi, documentsApi } from '@services/api';

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

// Mock data for development
const MOCK_TRENDS: ComplianceTrend[] = [
  { period: 'Ene 2024', percentage: 65 },
  { period: 'Feb 2024', percentage: 68 },
  { period: 'Mar 2024', percentage: 72 },
  { period: 'Abr 2024', percentage: 70 },
  { period: 'May 2024', percentage: 75 },
  { period: 'Jun 2024', percentage: 78 },
];

const MOCK_STANDARDS: StandardCompliance[] = [
  { code: 'TSTH', name: 'Talento Humano', percentage: 82 },
  { code: 'TSINF', name: 'Información', percentage: 85 },
  { code: 'TSDOT', name: 'Dotación', percentage: 76 },
  { code: 'TSMD', name: 'Medicamentos', percentage: 72 },
  { code: 'TSPP', name: 'Procesos', percentage: 79 },
  { code: 'TSHCR', name: 'Habilitación Conjunta', percentage: 74 },
  { code: 'TSINT', name: 'Integralidad', percentage: 88 },
];

const MOCK_METRICS: ComplianceMetrics = {
  compliance_rate: 78,
  open_findings: 8,
  in_progress_findings: 5,
  resolved_findings: 12,
  pending_actions: 3,
};

const MOCK_DOCUMENTS = [
  { name: 'Política de Talento Humano', daysUntilExpiry: 45, status: 'warning' },
  { name: 'Manual de Procesos', daysUntilExpiry: 15, status: 'danger' },
  { name: 'Matriz de Competencias', daysUntilExpiry: 120, status: 'ok' },
];

const MOCK_RECENT_ASSESSMENTS = [
  { service: 'Urgencias', date: '2024-06-10', status: 'completed', percentage: 82 },
  { service: 'Consultoría Externa', date: '2024-06-05', status: 'completed', percentage: 75 },
  { service: 'Laboratorio Clínico', date: '2024-05-28', status: 'in_progress', percentage: 68 },
];

export function ProviderDashboard(): JSX.Element {
  const { selectedProvider } = useProvider();
  const [metrics, setMetrics] = useState<ComplianceMetrics>(MOCK_METRICS);
  const [trends, setTrends] = useState<ComplianceTrend[]>(MOCK_TRENDS);
  const [standards, setStandards] = useState<StandardCompliance[]>(MOCK_STANDARDS);
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

      try {
        const assessmentsRes = await assessmentsApi.listByProvider(selectedProvider.id);
        const findingsRes = await findingsApi.listByProvider(selectedProvider.id);

        const openFindings = findingsRes.data?.filter((f: any) => f.status === 'open' || f.status === 'abierta').length || 0;
        const inProgressFindings = findingsRes.data?.filter((f: any) => f.status === 'in_progress' || f.status === 'en_proceso').length || 0;
        const resolvedFindings = findingsRes.data?.filter((f: any) => f.status === 'resolved' || f.status === 'cerrada').length || 0;

        const complianceRate = assessmentsRes.data?.[0]?.compliance_percentage || assessmentsRes.data?.[0]?.compliance_percent || 0;

        setMetrics({
          compliance_rate: complianceRate,
          open_findings: openFindings,
          in_progress_findings: inProgressFindings,
          resolved_findings: resolvedFindings,
          pending_actions: Math.max(0, openFindings - inProgressFindings),
        });
      } catch (apiError) {
        // Use mock data if API fails
        console.warn('Using mock data due to API error:', apiError);
        setMetrics(MOCK_METRICS);
      }
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

      {/* Recent Assessments */}
      <section className="dashboard-section">
        <h2>Evaluaciones Recientes</h2>
        <div className="assessments-list">
          {MOCK_RECENT_ASSESSMENTS.map((assessment, idx) => (
            <div key={idx} className="assessment-item">
              <div className="assessment-service">{assessment.service}</div>
              <div className="assessment-date">{new Date(assessment.date).toLocaleDateString('es-CO')}</div>
              <div className="assessment-status" style={{ color: getTrendColor(assessment.percentage) }}>
                {assessment.percentage}%
              </div>
              <div className="assessment-badge" style={{ background: getTrendColor(assessment.percentage) + '20' }}>
                {assessment.status === 'completed' ? '✓ Completada' : '⏳ En progreso'}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Documents Expiring */}
      <section className="dashboard-section">
        <h2>Documentos por Vencer</h2>
        <div className="documents-list">
          {MOCK_DOCUMENTS.map((doc, idx) => (
            <div key={idx} className={`document-item document-${doc.status}`}>
              <div className="doc-icon">📄</div>
              <div className="doc-content">
                <div className="doc-name">{doc.name}</div>
                <div className="doc-days">
                  {doc.daysUntilExpiry > 30 ? `Vence en ${doc.daysUntilExpiry} días` : `⚠ Vence en ${doc.daysUntilExpiry} días`}
                </div>
              </div>
              <div className={`doc-status status-${doc.status}`}>
                {doc.status === 'ok' ? '✓' : doc.status === 'warning' ? '⚠' : '✗'}
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
