/**
 * Action Stats Component
 * Displays summary cards with action metrics
 */

import React, { useEffect } from 'react';
import { useActionStore } from '../../stores/actionStore';
import './ActionStats.css';

export const ActionStats: React.FC = () => {
  const { stats, fetchStats, loading } = useActionStore();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading || !stats) {
    return (
      <div className="action-stats">
        <div className="stat-card loading">Cargando...</div>
      </div>
    );
  }

  const overduePercent = stats.total_actions > 0
    ? Math.round((stats.overdue_actions / stats.total_actions) * 100)
    : 0;

  return (
    <div className="action-stats">
      <div className="stat-card stat-total">
        <div className="stat-number">{stats.total_actions}</div>
        <div className="stat-label">Total de Acciones</div>
      </div>

      <div className="stat-card stat-open">
        <div className="stat-number">{stats.open_actions}</div>
        <div className="stat-label">Abierta</div>
        <div className="stat-sublabel">Sin empezar</div>
      </div>

      <div className="stat-card stat-in-progress">
        <div className="stat-number">{stats.in_progress}</div>
        <div className="stat-label">En Progreso</div>
        <div className="stat-sublabel">En ejecución</div>
      </div>

      <div className="stat-card stat-closed">
        <div className="stat-number">{stats.closed_actions}</div>
        <div className="stat-label">Cerrada</div>
        <div className="stat-sublabel">Completada</div>
      </div>

      <div className="stat-card stat-overdue">
        <div className="stat-number">{stats.overdue_actions}</div>
        <div className="stat-label">Vencidas</div>
        <div className="stat-sublabel">{overduePercent}% del total</div>
      </div>

      <div className="stat-card stat-completion">
        <div className="stat-number">{Math.round(stats.avg_completion)}%</div>
        <div className="stat-label">Progreso Promedio</div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${stats.avg_completion}%` }}
          />
        </div>
      </div>
    </div>
  );
};
