/**
 * Provider Admin Dashboard
 * Compliance metrics and management for a single provider
 */

import './dashboards.css';
import React, { useState, useEffect, useCallback } from 'react';
import { useProvider } from '@context/ProviderContext';
import { assessmentsApi, findingsApi, reportsApi } from '@services/api';

interface ComplianceMetrics {
  compliance_rate: number;
  open_findings: number;
  in_progress_findings: number;
  resolved_findings: number;
  pending_actions: number;
}

export function ProviderDashboard(): JSX.Element {
  const { selectedProvider } = useProvider();
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading metrics');
    } finally {
      setLoading(false);
    }
  }, [selectedProvider]);

  const getTrafficLightColor = (rate: number) => {
    if (rate >= 80) return 'green';
    if (rate >= 50) return 'orange';
    return 'red';
  };

  if (loading) {
    return <div className="dashboard-loading">Cargando métricas de cumplimiento...</div>;
  }

  if (error) {
    return <div className="dashboard-error">Error: {error}</div>;
  }

  if (!selectedProvider) {
    return <div className="dashboard-error">No hay prestador seleccionado</div>;
  }

  return (
    <div className="dashboard provider-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>{selectedProvider.legalName}</h1>
          <p className="subtitle">RUT: {selectedProvider.rut}</p>
        </div>
      </div>

      <div className="compliance-section">
        <div className={`traffic-light ${getTrafficLightColor(metrics?.compliance_rate || 0)}`}>
          <div className="light-circle"></div>
          <div className="compliance-info">
            <div className="compliance-rate">{metrics?.compliance_rate?.toFixed(1) || 0}%</div>
            <div className="compliance-label">Cumplimiento General</div>
          </div>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon open">🔴</div>
          <div className="metric-content">
            <div className="metric-value">{metrics?.open_findings || 0}</div>
            <div className="metric-label">Hallazgos Abiertos</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon progress">⏳</div>
          <div className="metric-content">
            <div className="metric-value">{metrics?.in_progress_findings || 0}</div>
            <div className="metric-label">En Progreso</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon resolved">✓</div>
          <div className="metric-content">
            <div className="metric-value">{metrics?.resolved_findings || 0}</div>
            <div className="metric-label">Resueltos</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon pending">⚠</div>
          <div className="metric-content">
            <div className="metric-value">{metrics?.pending_actions || 0}</div>
            <div className="metric-label">Acciones Pendientes</div>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Acciones Rápidas</h2>
        <div className="actions-grid">
          <a href={`/assessments?provider=${selectedProvider.id}`} className="action-card">
            <div className="action-icon">📊</div>
            <div className="action-label">Ver Evaluaciones</div>
          </a>

          <a href={`/findings?provider=${selectedProvider.id}`} className="action-card">
            <div className="action-icon">🔍</div>
            <div className="action-label">Gestionar Hallazgos</div>
          </a>

          <a href={`/reports?provider=${selectedProvider.id}`} className="action-card">
            <div className="action-icon">📋</div>
            <div className="action-label">Descargar Reportes</div>
          </a>

          <a href={`/users?provider=${selectedProvider.id}`} className="action-card">
            <div className="action-icon">👥</div>
            <div className="action-label">Gestionar Usuarios</div>
          </a>
        </div>
      </div>
    </div>
  );
}
