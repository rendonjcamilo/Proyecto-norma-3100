/**
 * Actions List Component
 * Main list with filters, sort, bulk actions
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useActionStore, ActionFilters } from '../../stores/actionStore';
import { ActionDetail } from './ActionDetail';
import './ActionsList.css';

interface ActionsListProps {
  providerId?: string;
  readonly?: boolean;
}

export const ActionsList: React.FC<ActionsListProps> = ({
  providerId,
  readonly = false,
}) => {
  const {
    actions,
    selectedAction,
    filters,
    loading,
    error,
    fetchActions,
    setSelectedAction,
    setFilters,
    clearError,
  } = useActionStore();

  const [showDetail, setShowDetail] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'deadline' | 'priority' | 'progress'>('deadline');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Debounced filter application
  const applyFilters = useCallback(() => {
    const newFilters: ActionFilters = {
      providerId,
      sortBy,
      sortOrder,
      limit: 100,
      offset: 0,
    };

    if (statusFilter) {
      newFilters.status = statusFilter as 'abierta' | 'en_progreso' | 'cerrada';
    }

    if (priorityFilter) {
      newFilters.priority = priorityFilter as 'crítica' | 'alta' | 'media' | 'baja';
    }

    setFilters(newFilters);
    fetchActions(newFilters);
  }, [providerId, statusFilter, priorityFilter, sortBy, sortOrder, setFilters, fetchActions]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleRowClick = (actionId: string) => {
    const action = actions.find((a) => a.id === actionId);
    if (action) {
      setSelectedAction(action);
      setShowDetail(true);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      abierta: '#d32f2f',
      en_progreso: '#f57c00',
      cerrada: '#388e3c',
    };
    return colors[status] || '#999';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      abierta: 'Abierta',
      en_progreso: 'En Progreso',
      cerrada: 'Cerrada',
    };
    return labels[status] || status;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      crítica: '#c62828',
      alta: '#f57c00',
      media: '#fbc02d',
      baja: '#388e3c',
    };
    return colors[priority] || '#999';
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const days = Math.ceil(
      (new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  const isOverdue = (deadline: string) => {
    return getDaysUntilDeadline(deadline) < 0;
  };

  const isDueSoon = (deadline: string) => {
    const days = getDaysUntilDeadline(deadline);
    return days >= 0 && days <= 7;
  };

  const getRowClass = (action: any) => {
    if (isOverdue(action.due_date)) return 'overdue';
    if (isDueSoon(action.due_date)) return 'due-soon';
    return '';
  };

  return (
    <div className="actions-list-container">
      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={clearError}>✕</button>
        </div>
      )}

      {/* Filters */}
      <div className="filters-bar">
        <div className="filter-group">
          <label htmlFor="status">Estado:</label>
          <select
            id="status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">-- Todos --</option>
            <option value="abierta">Abierta</option>
            <option value="en_progreso">En Progreso</option>
            <option value="cerrada">Cerrada</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="priority">Prioridad:</label>
          <select
            id="priority"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">-- Todas --</option>
            <option value="crítica">Crítica</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="sort">Ordenar por:</label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="deadline">Plazo</option>
            <option value="priority">Prioridad</option>
            <option value="progress">Progreso</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="order">Orden:</label>
          <select
            id="order"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
          >
            <option value="asc">Ascendente</option>
            <option value="desc">Descendente</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        {loading && !actions.length ? (
          <div className="loading-state">Cargando acciones...</div>
        ) : actions.length === 0 ? (
          <div className="empty-state">
            <p>No hay acciones que coincidan con los filtros</p>
          </div>
        ) : (
          <table className="actions-table">
            <thead>
              <tr>
                <th>Acción #</th>
                <th>Título</th>
                <th>Hallazgo</th>
                <th>Prioridad</th>
                <th>Estado</th>
                <th>Plazo</th>
                <th>Progreso</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((action) => (
                <tr
                  key={action.id}
                  className={`action-row ${getRowClass(action)}`}
                  onClick={() => !readonly && handleRowClick(action.id)}
                >
                  <td className="action-number">{action.action_number}</td>
                  <td className="action-title">{action.title}</td>
                  <td className="action-finding">{action.finding_id.substring(0, 10)}...</td>
                  <td className="action-priority">
                    <span
                      className="badge"
                      style={{ backgroundColor: getPriorityColor(action.priority) }}
                    >
                      {action.priority}
                    </span>
                  </td>
                  <td className="action-status">
                    <span
                      className="badge"
                      style={{ backgroundColor: getStatusColor(action.status) }}
                    >
                      {getStatusLabel(action.status)}
                    </span>
                  </td>
                  <td className="action-deadline">
                    <span className={isOverdue(action.due_date) ? 'overdue-text' : ''}>
                      {new Date(action.due_date).toLocaleDateString('es-CO')}
                      {isDueSoon(action.due_date) && (
                        <span className="days-info">
                          {' '}
                          ({getDaysUntilDeadline(action.due_date)} días)
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="action-progress">
                    <div className="progress-mini">
                      <div
                        className="progress-fill"
                        style={{ width: `${action.completion_percentage}%` }}
                      />
                    </div>
                    <span className="progress-text">{action.completion_percentage}%</span>
                  </td>
                  <td className="action-cell-actions">
                    {!readonly && (
                      <button
                        className="btn btn-link"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(action.id);
                        }}
                      >
                        Ver
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      {showDetail && selectedAction && (
        <div className="detail-modal-overlay">
          <div className="detail-modal-content">
            <ActionDetail
              actionId={selectedAction.id}
              onClose={() => setShowDetail(false)}
              readonly={readonly}
            />
          </div>
        </div>
      )}
    </div>
  );
};
