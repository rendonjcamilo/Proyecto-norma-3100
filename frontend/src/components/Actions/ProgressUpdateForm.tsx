/**
 * Progress Update Form Component
 * Modal/drawer for updating action progress with evidence and comments
 */

import React, { useState } from 'react';
import { ActionFollowup } from '../../stores/actionStore';
import './ProgressUpdateForm.css';

interface ProgressUpdateFormProps {
  actionId: string;
  followups: ActionFollowup[];
  onSubmit: (data: ProgressUpdateData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export interface ProgressUpdateData {
  followupId: string;
  status: 'pendiente' | 'en_progreso' | 'completado';
  completionPercentage: number;
  evidence?: string;
  comment?: string;
  estimatedRemainingDays?: number;
}

export const ProgressUpdateForm: React.FC<ProgressUpdateFormProps> = ({
  actionId,
  followups,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [selectedFollowupId, setSelectedFollowupId] = useState(
    followups.length > 0 ? followups[0].id : ''
  );
  const [status, setStatus] = useState<'pendiente' | 'en_progreso' | 'completado'>(
    'en_progreso'
  );
  const [completionPercentage, setCompletionPercentage] = useState(50);
  const [evidence, setEvidence] = useState('');
  const [comment, setComment] = useState('');
  const [estimatedRemainingDays, setEstimatedRemainingDays] = useState('');
  const [error, setError] = useState('');

  const selectedFollowup = followups.find((f) => f.id === selectedFollowupId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedFollowupId) {
      setError('Selecciona un paso de seguimiento');
      return;
    }

    if (completionPercentage < 0 || completionPercentage > 100) {
      setError('El progreso debe estar entre 0 y 100%');
      return;
    }

    try {
      const data: ProgressUpdateData = {
        followupId: selectedFollowupId,
        status,
        completionPercentage,
        evidence: evidence.trim() || undefined,
        comment: comment.trim() || undefined,
        estimatedRemainingDays: estimatedRemainingDays
          ? parseInt(estimatedRemainingDays, 10)
          : undefined,
      };

      await onSubmit(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar';
      setError(message);
    }
  };

  return (
    <div className="progress-update-overlay">
      <div className="progress-update-modal">
        <div className="modal-header">
          <h3>Actualizar Progreso</h3>
          <button className="close-btn" onClick={onCancel} disabled={loading}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="progress-form">
          {error && <div className="form-error">{error}</div>}

          {/* Step Selection */}
          <div className="form-group">
            <label htmlFor="followup">Paso de Seguimiento:</label>
            <select
              id="followup"
              value={selectedFollowupId}
              onChange={(e) => setSelectedFollowupId(e.target.value)}
              required
              disabled={loading}
            >
              <option value="">-- Selecciona un paso --</option>
              {followups.map((f) => (
                <option key={f.id} value={f.id}>
                  Paso {f.step_number}: {f.step_name} ({f.status})
                </option>
              ))}
            </select>
          </div>

          {selectedFollowup && (
            <div className="followup-info">
              <p>
                <strong>Plazo:</strong>{' '}
                {selectedFollowup.due_date
                  ? new Date(selectedFollowup.due_date).toLocaleDateString('es-CO')
                  : 'No definido'}
              </p>
              <p>
                <strong>Progreso actual:</strong> {selectedFollowup.completion_percentage}%
              </p>
            </div>
          )}

          {/* Status Selection */}
          <div className="form-group">
            <label htmlFor="status">Estado:</label>
            <select
              id="status"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as 'pendiente' | 'en_progreso' | 'completado')
              }
              disabled={loading}
            >
              <option value="pendiente">Pendiente</option>
              <option value="en_progreso">En Progreso</option>
              <option value="completado">Completado</option>
            </select>
          </div>

          {/* Completion Percentage */}
          <div className="form-group">
            <label htmlFor="completion">
              Progreso: <span className="percentage-display">{completionPercentage}%</span>
            </label>
            <input
              id="completion"
              type="range"
              min="0"
              max="100"
              step="5"
              value={completionPercentage}
              onChange={(e) => setCompletionPercentage(parseInt(e.target.value, 10))}
              disabled={loading}
              className="range-input"
            />
            <div className="range-labels">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Evidence URL */}
          <div className="form-group">
            <label htmlFor="evidence">Prueba/Evidencia (URL):</label>
            <input
              id="evidence"
              type="url"
              placeholder="https://ejemplo.com/evidencia.pdf"
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              disabled={loading}
            />
            <small>Proporciona un enlace a la documentación o evidencia</small>
          </div>

          {/* Comment */}
          <div className="form-group">
            <label htmlFor="comment">Comentario/Descripción:</label>
            <textarea
              id="comment"
              placeholder="Describe qué se ha completado y qué está pendiente..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              disabled={loading}
            />
          </div>

          {/* Estimated Remaining Days */}
          <div className="form-group">
            <label htmlFor="remaining">Días estimados restantes:</label>
            <input
              id="remaining"
              type="number"
              min="0"
              placeholder="Ej: 5"
              value={estimatedRemainingDays}
              onChange={(e) => setEstimatedRemainingDays(e.target.value)}
              disabled={loading}
            />
            <small>Estimación para completar este paso</small>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar Progreso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
