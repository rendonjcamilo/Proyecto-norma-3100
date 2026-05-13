/**
 * Action Progress Dashboard Component
 * Displays action completion metrics and timeline
 */

import React, { useState, useEffect } from 'react';
import { formatDate } from '@/utils/dateFormat';
import './ActionProgressDashboard.css';

interface DashboardMetrics {
  total_actions: number;
  open_actions: number;
  in_progress: number;
  closed_actions: number;
  overdue_actions: number;
  avg_completion: number;
}

interface OverdueAction {
  id: string;
  title: string;
  finding_id: string;
  deadline: Date;
  days_overdue: number;
  priority: string;
}

/**
 * Action Progress Dashboard Component
 */
export const ActionProgressDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [overdueActions, setOverdueActions] = useState<OverdueAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/actions/dashboard', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (response.ok) {
        const data = await response.json();
        setMetrics(data);

        // Load overdue actions
        const actionsResponse = await fetch(
          '/api/actions?status=abierta&status=en_progreso&sort=deadline',
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }
        );

        if (actionsResponse.ok) {
          const actionsData = await actionsResponse.json();
          const now = new Date();

          const overdue = actionsData.actions
            ?.filter((a: any) => new Date(a.deadline) < now)
            .map((a: any) => ({
              ...a,
              days_overdue: Math.floor(
                (now.getTime() - new Date(a.deadline).getTime()) / (1000 * 60 * 60 * 24)
              ),
            }))
            .slice(0, 5) || [];

          setOverdueActions(overdue);
        }
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Cargando dashboard...</div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="dashboard-container">
        <div className="error">Error al cargar métricas</div>
      </div>
    );
  }

  const completionPercentage = Math.round(metrics.avg_completion);
  const completionColor =
    completionPercentage >= 80 ? '#4caf50' :
    completionPercentage >= 60 ? '#ff9800' :
    '#dc3545';

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Dashboard de Acciones Correctivas</h2>
        <p className="subtitle">Seguimiento de progreso y alertas</p>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">📋</div>
          <div className="metric-content">
            <h4>Acciones Totales</h4>
            <div className="metric-value">{metrics.total_actions}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🔵</div>
          <div className="metric-content">
            <h4>Abiertas</h4>
            <div className="metric-value">{metrics.open_actions}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🟡</div>
          <div className="metric-content">
            <h4>En Progreso</h4>
            <div className="metric-value">{metrics.in_progress}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">✅</div>
          <div className="metric-content">
            <h4>Cerradas</h4>
            <div className="metric-value">{metrics.closed_actions}</div>
          </div>
        </div>

        <div className="metric-card alert">
          <div className="metric-icon">⚠️</div>
          <div className="metric-content">
            <h4>Vencidas</h4>
            <div className="metric-value alert-text">{metrics.overdue_actions}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <h4>Progreso Promedio</h4>
            <div
              className="metric-value"
              style={{ color: completionColor }}
            >
              {completionPercentage}%
            </div>
          </div>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="dashboard-section">
        <h3>Distribución de Estados</h3>
        <div className="status-distribution">
          <div className="distribution-item">
            <div className="distribution-bar">
              <div
                className="bar-segment"
                style={{
                  width: `${(metrics.open_actions / metrics.total_actions) * 100}%`,
                  backgroundColor: '#2196f3',
                }}
                title={`Abiertas: ${metrics.open_actions}`}
              />
              <div
                className="bar-segment"
                style={{
                  width: `${(metrics.in_progress / metrics.total_actions) * 100}%`,
                  backgroundColor: '#ff9800',
                }}
                title={`En Progreso: ${metrics.in_progress}`}
              />
              <div
                className="bar-segment"
                style={{
                  width: `${(metrics.closed_actions / metrics.total_actions) * 100}%`,
                  backgroundColor: '#4caf50',
                }}
                title={`Cerradas: ${metrics.closed_actions}`}
              />
            </div>
            <div className="bar-legend">
              <span className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#2196f3' }} />
                Abiertas ({metrics.open_actions})
              </span>
              <span className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#ff9800' }} />
                En Progreso ({metrics.in_progress})
              </span>
              <span className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#4caf50' }} />
                Cerradas ({metrics.closed_actions})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Completion Progress */}
      <div className="dashboard-section">
        <h3>Progreso General</h3>
        <div className="completion-progress">
          <div className="progress-visualization">
            <div
              className="progress-circle"
              style={{
                background: `conic-gradient(
                  ${completionColor} 0deg ${completionPercentage * 3.6}deg,
                  #e0e0e0 ${completionPercentage * 3.6}deg 360deg
                )`,
              }}
            >
              <div className="progress-circle-inner">
                <div className="progress-value">{completionPercentage}%</div>
                <div className="progress-label">Completado</div>
              </div>
            </div>
          </div>

          <div className="progress-breakdown">
            <div className="breakdown-item">
              <label>0-25%</label>
              <div className="breakdown-bar">
                <div className="breakdown-fill" style={{ width: '25%', backgroundColor: '#dc3545' }} />
              </div>
              <span className="breakdown-label">Inicio</span>
            </div>

            <div className="breakdown-item">
              <label>26-50%</label>
              <div className="breakdown-bar">
                <div className="breakdown-fill" style={{ width: '50%', backgroundColor: '#ff9800' }} />
              </div>
              <span className="breakdown-label">Desarrollo</span>
            </div>

            <div className="breakdown-item">
              <label>51-75%</label>
              <div className="breakdown-bar">
                <div className="breakdown-fill" style={{ width: '75%', backgroundColor: '#ffc107' }} />
              </div>
              <span className="breakdown-label">Avanzado</span>
            </div>

            <div className="breakdown-item">
              <label>76-100%</label>
              <div className="breakdown-bar">
                <div className="breakdown-fill" style={{ width: '100%', backgroundColor: '#4caf50' }} />
              </div>
              <span className="breakdown-label">Completado</span>
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Actions Alert */}
      {overdueActions.length > 0 && (
        <div className="dashboard-section alert-section">
          <h3>⚠️ Acciones Vencidas</h3>
          <div className="overdue-list">
            {overdueActions.map((action) => (
              <div key={action.id} className="overdue-item">
                <div className="overdue-header">
                  <h4>{action.title}</h4>
                  <span className={`priority-badge priority-${action.priority}`}>
                    {action.priority}
                  </span>
                </div>
                <div className="overdue-info">
                  <span className="overdue-days">
                    {action.days_overdue} día(s) vencida
                  </span>
                  <span className="deadline">
                    Plazo: {formatDate(action.deadline)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Timeline */}
      <div className="dashboard-section">
        <h3>Línea de Tiempo de Cumplimiento</h3>
        <div className="timeline-chart">
          <div className="timeline-header">
            <span>Hoy</span>
            <span>7 días</span>
            <span>14 días</span>
            <span>30 días</span>
          </div>
          <div className="timeline-bar">
            <div className="timeline-marker" style={{ left: '0%' }} title="Hoy" />
            <div className="timeline-marker" style={{ left: '25%' }} title="7 días" />
            <div className="timeline-marker" style={{ left: '50%' }} title="14 días" />
            <div className="timeline-marker" style={{ left: '100%' }} title="30 días" />
          </div>
          <p className="timeline-note">
            Muestra la distribución de próximas fechas de entrega en los próximos 30 días
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="dashboard-actions">
        <button className="btn-secondary" onClick={() => window.location.reload()}>
          Actualizar
        </button>
        <button className="btn-primary" onClick={() => window.location.href = '/findings'}>
          Ver Hallazgos
        </button>
      </div>
    </div>
  );
};
