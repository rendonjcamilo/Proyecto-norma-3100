/**
 * Action Detail Component
 * Full detail view with timeline, follow-ups, edit capabilities
 */

import React, { useEffect, useState } from 'react';
import { useActionStore, Action, ActionFollowup } from '../../stores/actionStore';
import { FollowUpStep } from './FollowUpStep';
import { ProgressUpdateForm, ProgressUpdateData } from './ProgressUpdateForm';
import './ActionDetail.css';

interface ActionDetailProps {
  actionId: string;
  onClose?: () => void;
  readonly?: boolean;
}

export const ActionDetail: React.FC<ActionDetailProps> = ({
  actionId,
  onClose,
  readonly = false,
}) => {
  const { actionDetail, fetchActionDetail, updateActionProgress, loading, error } =
    useActionStore();

  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Partial<Action> | null>(null);

  useEffect(() => {
    fetchActionDetail(actionId);
  }, [actionId, fetchActionDetail]);

  if (loading) {
    return <div className="action-detail loading">Cargando...</div>;
  }

  if (!actionDetail) {
    return (
      <div className="action-detail error">
        <p>No se encontró la acción</p>
        {onClose && <button onClick={onClose}>Cerrar</button>}
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      crítica: '#c62828',
      alta: '#f57c00',
      media: '#fbc02d',
      baja: '#388e3c',
    };
    return colors[priority] || '#999';
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

  const daysUntilDeadline = Math.ceil(
    (new Date(actionDetail.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const isOverdue = daysUntilDeadline < 0;
  const isDueSoon = daysUntilDeadline >= 0 && daysUntilDeadline <= 7;

  const handleProgressUpdate = async (data: ProgressUpdateData) => {
    try {
      await updateActionProgress(actionId, data.followupId, {
        status: data.status,
        completion_percentage: data.completionPercentage,
        evidence_attachment: data.evidence,
        comments: data.comment,
      });
      setShowUpdateForm(false);
    } catch (err) {
      console.error('Error updating progress:', err);
    }
  };

  return (
    <div className="action-detail">
      {onClose && (
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      )}

      <div className="detail-header">
        <div className="header-top">
          <div>
            <h2>{actionDetail.title}</h2>
            <p className="action-number">#{actionDetail.action_number}</p>
          </div>
          <div className="header-badges">
            <span
              className="badge priority-badge"
              style={{ backgroundColor: getPriorityColor(actionDetail.priority) }}
            >
              {actionDetail.priority.toUpperCase()}
            </span>
            <span
              className="badge status-badge"
              style={{ backgroundColor: getStatusColor(actionDetail.status) }}
            >
              {getStatusLabel(actionDetail.status)}
            </span>
          </div>
        </div>

        <div className={`deadline-info ${isOverdue ? 'overdue' : isDueSoon ? 'due-soon' : ''}`}>
          <span className="deadline-label">Plazo:</span>
          <span className="deadline-date">
            {new Date(actionDetail.due_date).toLocaleDateString('es-CO')}
          </span>
          {isOverdue && (
            <span className="deadline-status overdue">
              {Math.abs(daysUntilDeadline)} días vencido
            </span>
          )}
          {isDueSoon && !isOverdue && (
            <span className="deadline-status due-soon">
              {daysUntilDeadline} días restantes
            </span>
          )}
        </div>
      </div>

      <div className="detail-content">
        {/* Metadata */}
        <section className="section">
          <h3>Información de la Acción</h3>
          <div className="metadata-grid">
            <div className="metadata-item">
              <span className="label">Hallazgo:</span>
              <span className="value">{actionDetail.finding_id}</span>
            </div>
            {actionDetail.assigned_to && (
              <div className="metadata-item">
                <span className="label">Responsable:</span>
                <span className="value">{actionDetail.assigned_to}</span>
              </div>
            )}
            <div className="metadata-item">
              <span className="label">Descripción:</span>
              <span className="value">{actionDetail.description}</span>
            </div>
          </div>
        </section>

        {/* Completion Progress */}
        <section className="section">
          <div className="section-header">
            <h3>Progreso General</h3>
            <span className="completion-percent">{actionDetail.completion_percentage}%</span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${actionDetail.completion_percentage}%` }}
              />
            </div>
          </div>
        </section>

        {/* Follow-up Steps Timeline */}
        <section className="section">
          <div className="section-header">
            <h3>Pasos de Seguimiento ({actionDetail.followups.length})</h3>
            {!readonly && (
              <button
                className="btn btn-small"
                onClick={() => setShowUpdateForm(true)}
              >
                + Actualizar Progreso
              </button>
            )}
          </div>

          <div className="followups-list">
            {actionDetail.followups && actionDetail.followups.length > 0 ? (
              actionDetail.followups.map((followup) => (
                <FollowUpStep
                  key={followup.id}
                  followup={followup}
                  readonly={readonly}
                  onUpdateStatus={(followupId, newStatus) => {
                    updateActionProgress(actionId, followupId, {
                      status: newStatus,
                    });
                  }}
                  onAddComment={(followupId, comment) => {
                    updateActionProgress(actionId, followupId, {
                      comments: comment,
                    });
                  }}
                  onAddEvidence={(followupId, evidence) => {
                    updateActionProgress(actionId, followupId, {
                      evidence_attachment: evidence,
                    });
                  }}
                />
              ))
            ) : (
              <p className="empty-message">No hay pasos de seguimiento definidos</p>
            )}
          </div>
        </section>

        {/* Status History */}
        <section className="section">
          <h3>Historial de Cambios</h3>
          <div className="history-item">
            <span className="history-date">
              {new Date(actionDetail.created_date).toLocaleDateString('es-CO')}
            </span>
            <span className="history-action">Creada por {actionDetail.created_by}</span>
          </div>
        </section>

        {/* Actions */}
        {!readonly && (
          <div className="detail-actions">
            <button className="btn btn-secondary" onClick={onClose}>
              Cerrar
            </button>
            <button className="btn btn-primary" onClick={() => setEditMode(!editMode)}>
              {editMode ? 'Cancelar Edición' : 'Editar'}
            </button>
          </div>
        )}
      </div>

      {showUpdateForm && actionDetail.followups && (
        <ProgressUpdateForm
          actionId={actionId}
          followups={actionDetail.followups}
          onSubmit={handleProgressUpdate}
          onCancel={() => setShowUpdateForm(false)}
          loading={loading}
        />
      )}
    </div>
  );
};
