/**
 * Super Admin Dashboard
 * Global metrics and quick access for system administration
 */

import './dashboards.css';
import React, { useState, useEffect } from 'react';
import { reportsApi, providersApi } from '@services/api';

interface GlobalSummary {
  totalProviders: number;
  totalAuditors: number;
  assessmentsInProgress: number;
  criticalFindings: number;
  avgComplianceRate: number;
}

export function SuperAdminDashboard(): JSX.Element {
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
    <div className="dashboard super-admin-dashboard">
      <div className="dashboard-header super-admin-header">
        <h1>Panel de administración</h1>
        <button onClick={fetchGlobalSummary} className="btn-refresh">
          Actualizar
        </button>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Prestadores Registrados</div>
          <div className="kpi-value">{summary?.totalProviders || 0}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Auditores Activos</div>
          <div className="kpi-value">{summary?.totalAuditors || 0}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Evaluaciones en Curso</div>
          <div className="kpi-value">{summary?.assessmentsInProgress || 0}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Hallazgos Críticos</div>
          <div className="kpi-value critical">{summary?.criticalFindings || 0}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Cumplimiento Promedio</div>
          <div className="kpi-value">{summary?.avgComplianceRate || 0}%</div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2 className="section-title">Accesos rápidos de administración</h2>
        <div className="quick-access-grid">
          <a href="/providers" className="quick-access-card">
            <div className="card-icon">🏥</div>
            <div className="card-label">Prestadores de Salud</div>
          </a>

          <a href="/questionnaires" className="quick-access-card">
            <div className="card-icon">📋</div>
            <div className="card-label">Cuestionarios</div>
          </a>

          <a href="/users" className="quick-access-card">
            <div className="card-icon">👥</div>
            <div className="card-label">Gestionar Usuarios</div>
          </a>

          <a href="/reports" className="quick-access-card">
            <div className="card-icon">📊</div>
            <div className="card-label">Reportes Globales</div>
          </a>

          <a href="/notifications/email-templates" className="quick-access-card">
            <div className="card-icon">📧</div>
            <div className="card-label">Plantillas Notificación</div>
          </a>
        </div>
      </div>

    </div>
  );
}
