/**
 * Action Verification Form Component
 * Auditor form for approving or rejecting corrective action evidence
 * Only shown when action status is 'resolved'
 */

import React, { useState } from 'react';
import './VerificationForm.css';

export interface VerificationData {
  actionId: string;
  decision: 'approved' | 'rejected';
  comments: string;
}

interface VerificationFormProps {
  actionId: string;
  actionTitle: string;
  actionDescription: string;
  evidence: Array<{
    id: string;
    filename: string;
    fileSize: number;
  }>;
  onVerify: (data: VerificationData) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

export const VerificationForm: React.FC<VerificationFormProps> = ({
  actionId,
  actionTitle,
  actionDescription,
  evidence,
  onVerify,
  onCancel,
  loading = false,
}) => {
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null);
  const [comments, setComments] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!decision) {
      setError('Debes seleccionar una decisión (Aprobado o Rechazado)');
      return;
    }

    if (!comments.trim()) {
      setError('Por favor, añade comentarios sobre tu decisión');
      return;
    }

    if (comments.trim().length < 10) {
      setError('Los comentarios deben tener al menos 10 caracteres');
      return;
    }

    try {
      setSubmitting(true);
      await onVerify({
        actionId,
        decision,
        comments: comments.trim(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al verificar la acción');
    } finally {
      setSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <form className="verification-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <h3>Verificar Acción Correctiva</h3>
        <p className="form-subtitle">Revisa la evidencia y aprueba o rechaza la acción</p>
      </div>

      {error && (
        <div className="form-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="action-summary">
        <div className="summary-item">
          <label>Acción:</label>
          <p>{actionTitle}</p>
        </div>
        <div className="summary-item">
          <label>Descripción:</label>
          <p>{actionDescription}</p>
        </div>
      </div>

      <div className="evidence-section">
        <h4>Evidencia Adjunta</h4>
        {evidence.length === 0 ? (
          <div className="no-evidence">
            <p>No hay evidencia adjunta</p>
          </div>
        ) : (
          <ul className="evidence-list">
            {evidence.map(file => (
              <li key={file.id} className="evidence-item">
                <span className="evidence-icon">📎</span>
                <span className="evidence-name">{file.filename}</span>
                <span className="evidence-size">({formatFileSize(file.fileSize)})</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="decision-section">
        <label className="decision-label">Decisión:</label>
        <div className="decision-options">
          <label className="decision-option">
            <input
              type="radio"
              name="decision"
              value="approved"
              checked={decision === 'approved'}
              onChange={e => setDecision(e.target.value as 'approved')}
              disabled={loading || submitting}
            />
            <span className="option-label approved">
              <span className="option-icon">✓</span>
              Aprobado
            </span>
            <span className="option-description">
              La evidencia es suficiente y la acción está completada correctamente
            </span>
          </label>

          <label className="decision-option">
            <input
              type="radio"
              name="decision"
              value="rejected"
              checked={decision === 'rejected'}
              onChange={e => setDecision(e.target.value as 'rejected')}
              disabled={loading || submitting}
            />
            <span className="option-label rejected">
              <span className="option-icon">✕</span>
              Rechazado
            </span>
            <span className="option-description">
              La evidencia es insuficiente o la acción requiere más trabajo
            </span>
          </label>
        </div>
      </div>

      <div className="comments-section">
        <label htmlFor="comments" className="comments-label">
          Comentarios y Retroalimentación *
        </label>
        <textarea
          id="comments"
          className="comments-textarea"
          value={comments}
          onChange={e => setComments(e.target.value)}
          placeholder="Proporciona detalles sobre tu decisión. Si rechazas, describe qué evidencia adicional se necesita..."
          rows={4}
          disabled={loading || submitting}
        />
        <p className="comments-hint">
          {comments.length}/200 caracteres mínimo: 10
        </p>
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="btn-submit"
          disabled={loading || submitting || !decision}
        >
          {submitting ? 'Guardando...' : 'Enviar Verificación'}
        </button>
        <button
          type="button"
          className="btn-cancel"
          onClick={onCancel}
          disabled={loading || submitting}
        >
          Cancelar
        </button>
      </div>

      <p className="form-help">
        * Campos obligatorios. Esta información se registrará en el historial de auditoría.
      </p>
    </form>
  );
};

export default VerificationForm;
