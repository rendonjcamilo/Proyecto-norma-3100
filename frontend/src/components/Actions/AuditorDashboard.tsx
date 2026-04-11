/**
 * Auditor Dashboard Component
 * Read-only overview of all providers' actions with distribution, overdue count, and approval
 */

import React, { useEffect, useState } from 'react';
import { useActionStore } from '../../stores/actionStore';
import { ActionsList } from './ActionsList';
import './AuditorDashboard.css';

interface AuditorDashboardProps {
  onApprove?: (actionId: string) => Promise<void>;
  onReject?: (actionId: string, reason: string) => Promise<void>;
}

export const AuditorDashboard: React.FC<AuditorDashboardProps> = ({
  onApprove,
  onReject,
}) => {
  const { stats, fetchStats, fetchActions } = useActionStore();
  const [showRejectForm, setShowRejectForm] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchStats();
    fetchActions({ limit: 1000, offset: 0 });
  }, [fetchStats, fetchActions]);

  const handleApprove = async (actionId: string) => {
    if (onApprove) {
      try {
        await onApprove(actionId);
        alert('Acción aprobada');
      } catch (err) {
        console.error('Error approving action:', err);
      }
    }
  };

  const handleReject = async (actionId: string) => {
    if (onReject && rejectReason.trim()) {
      try {
        await onReject(actionId, rejectReason);
        setShowRejectForm(null);
        setRejectReason('');
        alert('Acción rechazada');
      } catch (err) {
        console.error('Error rejecting action:', err);
      }
    }
  };

  if (!stats) {
    return <div className="auditor-dashboard loading">Cargando...</div>;
  }

  const getStatusDistribution = () => {
    const total = stats.total_actions;
    return {
      abierta: {
        count: stats.open_actions,
        percent: total > 0 ? Math.round((stats.open_actions / total) * 100) : 0,
        label: 'Abierta',
        color: '#d32f2f',
      },
      en_progreso: {
        count: stats.in_progress,
        percent: total > 0 ? Math.round((stats.in_progress / total) * 100) : 0,
        label: 'En Progreso',
        color: '#f57c00',
      },
      cerrada: {
        count: stats.closed_actions,
        percent: total > 0 ? Math.round((stats.closed_actions / total) * 100) : 0,
        label: 'Cerrada',
        color: '#388e3c',
      },
    };
  };

  const distribution = getStatusDistribution();
  const overduePercent = stats.total_actions > 0
    ? Math.round((stats.overdue_actions / stats.total_actions) * 100)
    : 0;

  return (
    <div className="auditor-dashboard">
      <h1>Panel de Control del Auditor</h1>

      {/* Summary Stats */}
      <div className="dashboard-section">
        <h2>Resumen de Acciones</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.total_actions}</div>
            <div className="stat-label">Total de Acciones</div>
          </div>

          <div className="stat-card alert-card">
            <div className="stat-value" style={{ color: '#c62828' }}>
              {stats.overdue_actions}
            </div>
            <div className="stat-label">Vencidas ({overduePercent}%)</div>
          </div>

          <div className="stat-card">
            <div className="stat-value">{Math.round(stats.avg_completion)}%</div>
            <div className="stat-label">Progreso Promedio</div>
          </div>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="dashboard-section">
        <h2>Distribución de Estado</h2>
        <div className="distribution-container">
          {/* Pie Chart */}
          <div className="pie-chart">
            <svg viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={distribution.abierta.color}
                strokeWidth="20"
                strokeDasharray={`${distribution.abierta.percent * 2.83} ${283.6 - distribution.abierta.percent * 2.83}`}
                strokeDashoffset="0"
                transform="rotate(-90 50 50)"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={distribution.en_progreso.color}
                strokeWidth="20"
                strokeDasharray={`${distribution.en_progreso.percent * 2.83} ${283.6 - distribution.en_progreso.percent * 2.83}`}
                strokeDashoffset={`-${distribution.abierta.percent * 2.83}`}
                transform="rotate(-90 50 50)"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={distribution.cerrada.color}
                strokeWidth="20"
                strokeDasharray={`${distribution.cerrada.percent * 2.83} ${283.6 - distribution.cerrada.percent * 2.83}`}
                strokeDashoffset={`-${(distribution.abierta.percent + distribution.en_progreso.percent) * 2.83}`}
                transform="rotate(-90 50 50)"
              />
              <text x="50" y="55" textAnchor="middle" fontSize="24" fill="#333" fontWeight="bold">
                {stats.total_actions}
              </text>
            </svg>
          </div>

          {/* Legend */}
          <div className="distribution-legend">
            {Object.entries(distribution).map(([key, data]) => (
              <div key={key} className="legend-item">
                <div
                  className="legend-color"
                  style={{ backgroundColor: data.color }}
                />
                <div className="legend-info">
                  <div className="legend-label">{data.label}</div>
                  <div className="legend-value">
                    {data.count} ({data.percent}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Overdue Actions List */}
      {stats.overdue_actions > 0 && (
        <div className="dashboard-section alert-section">
          <h2>Acciones Vencidas</h2>
          <div className="overdue-alert">
            <span className="alert-icon">⚠️</span>
            <p>
              Hay <strong>{stats.overdue_actions}</strong> acciones vencidas que requieren atención
              inmediata.
            </p>
          </div>
        </div>
      )}

      {/* Actions Table */}
      <div className="dashboard-section">
        <h2>Todas las Acciones</h2>
        <ActionsList readonly={false} />
      </div>

      {/* Reject Form Modal */}
      {showRejectForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Rechazar Acción</h3>
            <textarea
              placeholder="Motivo del rechazo..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowRejectForm(null);
                  setRejectReason('');
                }}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={() => showRejectForm && handleReject(showRejectForm)}
              >
                Rechazar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
