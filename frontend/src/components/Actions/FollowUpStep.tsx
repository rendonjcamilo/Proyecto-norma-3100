/**
 * Follow-Up Step Component
 * Individual step card showing progress, evidence, and comments
 */

import React, { useState } from 'react';
import { ActionFollowup } from '../../stores/actionStore';
import './FollowUpStep.css';

interface FollowUpStepProps {
  followup: ActionFollowup;
  onUpdateStatus?: (
    followupId: string,
    status: 'pendiente' | 'en_progreso' | 'completado'
  ) => void;
  onAddEvidence?: (followupId: string, evidence: string) => void;
  onAddComment?: (followupId: string, comment: string) => void;
  readonly?: boolean;
}

export const FollowUpStep: React.FC<FollowUpStepProps> = ({
  followup,
  onUpdateStatus,
  onAddEvidence,
  onAddComment,
  readonly = false,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [newEvidence, setNewEvidence] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completado':
        return 'success';
      case 'en_progreso':
        return 'warning';
      case 'pendiente':
      default:
        return 'pending';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pendiente: 'Pendiente',
      en_progreso: 'En Progreso',
      completado: 'Completado',
    };
    return labels[status] || status;
  };

  const handleAddComment = () => {
    if (newComment.trim() && onAddComment) {
      onAddComment(followup.id, newComment);
      setNewComment('');
    }
  };

  const handleStatusChange = (newStatus: 'pendiente' | 'en_progreso' | 'completado') => {
    if (onUpdateStatus) {
      onUpdateStatus(followup.id, newStatus);
    }
  };

  const daysUntilDue = followup.due_date
    ? Math.ceil(
        (new Date(followup.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;

  const isDue = daysUntilDue !== null && daysUntilDue <= 0;
  const isDueSoon = daysUntilDue !== null && daysUntilDue <= 7 && daysUntilDue > 0;

  return (
    <div className={`followup-step status-${getStatusColor(followup.status)}`}>
      <div className="step-header">
        <div className="step-title">
          <span className="step-number">Paso {followup.step_number}</span>
          <h4>{followup.step_name}</h4>
        </div>
        <div className="step-actions">
          {!readonly && (
            <select
              className="status-select"
              value={followup.status}
              onChange={(e) =>
                handleStatusChange(
                  e.target.value as 'pendiente' | 'en_progreso' | 'completado'
                )
              }
            >
              <option value="pendiente">Pendiente</option>
              <option value="en_progreso">En Progreso</option>
              <option value="completado">Completado</option>
            </select>
          )}
          {readonly && (
            <span className={`status-badge status-${getStatusColor(followup.status)}`}>
              {getStatusLabel(followup.status)}
            </span>
          )}
        </div>
      </div>

      {followup.description && (
        <p className="step-description">{followup.description}</p>
      )}

      <div className="step-meta">
        {followup.due_date && (
          <div className={`meta-item ${isDue ? 'overdue' : isDueSoon ? 'due-soon' : ''}`}>
            <span className="meta-label">Plazo:</span>
            <span className="meta-value">
              {new Date(followup.due_date).toLocaleDateString('es-CO')}
              {daysUntilDue !== null && (
                <span className="days-info">
                  {daysUntilDue === 0
                    ? ' (Hoy)'
                    : daysUntilDue > 0
                      ? ` (${daysUntilDue} días)`
                      : ` (${Math.abs(daysUntilDue)} días vencido)`}
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      <div className="progress-section">
        <div className="progress-label">
          <span>Progreso:</span>
          <span className="progress-percent">{followup.completion_percentage}%</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${followup.completion_percentage}%` }}
          />
        </div>
      </div>

      {followup.evidence_attachment && (
        <div className="evidence-section">
          <div className="evidence-label">Evidencia/Prueba:</div>
          <a
            href={followup.evidence_attachment}
            target="_blank"
            rel="noopener noreferrer"
            className="evidence-link"
          >
            📎 Ver evidencia
          </a>
        </div>
      )}

      {followup.comments && (
        <div className="comments-section">
          <div className="comments-label">Comentarios:</div>
          <p className="comments-text">{followup.comments}</p>
        </div>
      )}

      {!readonly && (
        <div className="form-section">
          <button
            className="toggle-form-btn"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? '✕ Cerrar' : '+ Agregar Comentario/Evidencia'}
          </button>

          {showForm && (
            <div className="step-form">
              <div className="form-group">
                <label>Agregar Comentario:</label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Describe el progreso realizado..."
                  rows={2}
                />
              </div>

              <div className="form-group">
                <label>URL de Evidencia:</label>
                <input
                  type="text"
                  value={newEvidence}
                  onChange={(e) => setNewEvidence(e.target.value)}
                  placeholder="https://ejemplo.com/evidencia.pdf"
                />
              </div>

              <div className="form-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleAddComment}
                >
                  Guardar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
