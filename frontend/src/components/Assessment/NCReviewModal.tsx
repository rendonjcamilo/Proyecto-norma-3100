/**
 * NCReviewModal Component
 * Modal para revisar y justificar criterios NC (No Cumple) antes de enviar evaluación
 * - Agrupa criterios por estándar
 * - Muestra C y NA como solo lectura
 * - Muestra NC con textarea + botón "Sugerir" que auto-llena la justificación
 * - Desactiva "Enviar" hasta que todos los NC tengan descripción ≥10 caracteres
 */

import React, { useMemo } from 'react';

interface Criterion {
  id: string;
  code: string;
  name: string;
  standard_id: string;
  standard_name: string;
  is_transversal: boolean;
  nc_hint?: string;
}

interface Response {
  criterionId: string;
  status: 'C' | 'NC' | 'NA';
  description?: string;
  comments?: string;
}

interface NCReviewModalProps {
  criteria: Criterion[];
  responses: Map<string, Response>;
  onDescriptionChange: (criterionId: string, description: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

// Genera una observación genérica de no cumplimiento sin reutilizar el texto del criterio,
// ya que los criterios están redactados como afirmaciones y su negación literal resulta contradictoria.
const sugerirNegacion = (_criterionName: string): string => {
  const plantillas = [
    'No se aporta evidencia documental que acredite el cumplimiento de este criterio.',
    'No se cuenta con documentación soporte que demuestre el cumplimiento de este criterio durante la evaluación.',
  ];
  return plantillas[Math.floor(Math.random() * plantillas.length)];
};

export const NCReviewModal: React.FC<NCReviewModalProps> = ({
  criteria,
  responses,
  onDescriptionChange,
  onConfirm,
  onCancel,
}) => {
  // Agrupar criterios por estándar
  const groupedByStandard = useMemo(() => {
    const grouped = new Map<string, Criterion[]>();
    for (const criterion of criteria) {
      const key = criterion.standard_id;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(criterion);
    }
    return Array.from(grouped.entries());
  }, [criteria]);

  // Validar que todos los NC tienen descripción ≥10 caracteres
  const ncCriteria = criteria.filter((c) => responses.get(c.id)?.status === 'NC');
  const todosNcJustificados = ncCriteria.every((c) => {
    const desc = responses.get(c.id)?.description ?? '';
    return desc.length >= 10;
  });

  const handleSuggest = (criterionId: string, criterionName: string, ncHint?: string) => {
    // Usa el hallazgo pre-generado por IA si está disponible; si no, usa el genérico
    const suggested = ncHint || sugerirNegacion(criterionName);
    onDescriptionChange(criterionId, suggested);
  };

  return (
    <div className="nc-review-modal-overlay" onClick={onCancel}>
      <div className="nc-review-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="nc-review-modal-header">
          <h2>Revisar evaluación antes de enviar</h2>
          <button className="nc-review-modal-close" onClick={onCancel} type="button">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="nc-review-modal-body">
          <div className="nc-review-warning">
            <span className="warning-icon">⚠️</span>
            <span className="warning-text">
              Se requiere justificación para los criterios No Cumple antes de enviar
            </span>
          </div>

          {/* Standards grouped */}
          {groupedByStandard.map(([standardId, standardCriteria]) => {
            // Obtener nombre del estándar desde el primer criterio del grupo
            const standardName = standardCriteria[0]?.standard_name || 'Estándar';

            return (
              <div key={standardId} className="nc-review-standard-group">
                <h3 className="nc-review-standard-name">{standardName}</h3>

                <div className="nc-review-criteria-list">
                  {standardCriteria.map((criterion) => {
                    const response = responses.get(criterion.id);
                    const status = response?.status ?? 'NA';
                    const description = response?.description ?? '';

                    return (
                      <div
                        key={criterion.id}
                        className={`nc-review-criterion nc-review-criterion-${status.toLowerCase()}`}
                      >
                        <div className="nc-review-criterion-header">
                          <div className="nc-review-criterion-badge" data-status={status}>
                            {status === 'C' && '✓ Cumple'}
                            {status === 'NC' && '✕ No Cumple'}
                            {status === 'NA' && '– No Aplica'}
                          </div>
                          <span className="nc-review-criterion-name">{criterion.name}</span>
                        </div>

                        {status === 'NC' && (
                          <div className="nc-review-criterion-input-group">
                            <textarea
                              className="nc-review-criterion-textarea"
                              value={description}
                              onChange={(e) => onDescriptionChange(criterion.id, e.target.value)}
                              placeholder="Ingrese justificación (mínimo 10 caracteres)..."
                              rows={3}
                            />
                            <div className="nc-review-criterion-actions">
                              <button
                                className="nc-review-btn-suggest"
                                onClick={() => handleSuggest(criterion.id, criterion.name, criterion.nc_hint)}
                                type="button"
                              >
                                💡 Sugerir
                              </button>
                              <span className="nc-review-char-count">
                                {description.length} caracteres
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="nc-review-modal-footer">
          <button
            className="nc-review-btn nc-review-btn-cancel"
            onClick={onCancel}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="nc-review-btn nc-review-btn-submit"
            onClick={onConfirm}
            disabled={!todosNcJustificados}
            title={
              todosNcJustificados
                ? 'Enviar evaluación'
                : `Completa justificaciones de ${ncCriteria.filter((c) => (responses.get(c.id)?.description?.length ?? 0) < 10).length} criterios NC`
            }
            type="button"
          >
            ✅ Enviar evaluación
          </button>
        </div>
      </div>

      <style>{`
        .nc-review-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .nc-review-modal-dialog {
          background: white;
          border-radius: 8px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          width: 90%;
          max-width: 700px;
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .nc-review-modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid #e0e0e0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .nc-review-modal-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #202124;
        }

        .nc-review-modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #5f6368;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .nc-review-modal-close:hover {
          background-color: #f0f0f0;
        }

        .nc-review-modal-body {
          padding: 20px 24px;
          overflow-y: auto;
          flex: 1;
        }

        .nc-review-warning {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 16px;
          background-color: #fff3e0;
          border: 1px solid #ffe0b2;
          border-radius: 6px;
          margin-bottom: 20px;
        }

        .warning-icon {
          font-size: 18px;
          flex-shrink: 0;
        }

        .warning-text {
          color: #e65100;
          font-size: 14px;
          font-weight: 500;
        }

        .nc-review-standard-group {
          margin-bottom: 24px;
        }

        .nc-review-standard-group:last-child {
          margin-bottom: 0;
        }

        .nc-review-standard-name {
          margin: 0 0 12px 0;
          font-size: 15px;
          font-weight: 600;
          color: #202124;
          padding-bottom: 8px;
          border-bottom: 2px solid #e0e0e0;
        }

        .nc-review-criteria-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .nc-review-criterion {
          padding: 12px;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          background-color: #fafbfc;
        }

        .nc-review-criterion-c {
          background-color: #e6f4ea;
          border-color: #81c995;
        }

        .nc-review-criterion-nc {
          background-color: #fce8e6;
          border-color: #e8b4b1;
        }

        .nc-review-criterion-na {
          background-color: #f8f9fa;
          border-color: #dadce0;
        }

        .nc-review-criterion-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 0;
        }

        .nc-review-criterion-nc .nc-review-criterion-header {
          margin-bottom: 12px;
        }

        .nc-review-criterion-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          flex-shrink: 0;
          white-space: nowrap;
        }

        .nc-review-criterion-badge[data-status='C'] {
          background-color: #81c995;
          color: white;
        }

        .nc-review-criterion-badge[data-status='NC'] {
          background-color: #d33827;
          color: white;
        }

        .nc-review-criterion-badge[data-status='NA'] {
          background-color: #9aa0a6;
          color: white;
        }

        .nc-review-criterion-name {
          color: #202124;
          font-size: 14px;
          font-weight: 500;
          flex: 1;
        }

        .nc-review-criterion-input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .nc-review-criterion-textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #dadce0;
          border-radius: 4px;
          font-family: inherit;
          font-size: 14px;
          resize: vertical;
          min-height: 60px;
          color: #202124;
        }

        .nc-review-criterion-textarea:focus {
          outline: none;
          border-color: #0052cc;
          box-shadow: 0 0 0 3px rgba(0, 82, 204, 0.1);
        }

        .nc-review-criterion-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .nc-review-btn-suggest {
          padding: 6px 14px;
          background-color: #f3f3f3;
          border: 1px solid #dadce0;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          color: #202124;
          transition: background-color 0.2s;
        }

        .nc-review-btn-suggest:hover {
          background-color: #e8eaed;
        }

        .nc-review-btn-suggest:active {
          background-color: #dadce0;
        }

        .nc-review-char-count {
          font-size: 12px;
          color: #5f6368;
          margin-left: auto;
        }

        .nc-review-modal-footer {
          padding: 16px 24px;
          border-top: 1px solid #e0e0e0;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          background-color: #f8f9fa;
        }

        .nc-review-btn {
          padding: 8px 24px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .nc-review-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .nc-review-btn-cancel {
          background-color: white;
          color: #202124;
          border: 1px solid #dadce0;
        }

        .nc-review-btn-cancel:hover {
          background-color: #f8f9fa;
        }

        .nc-review-btn-submit {
          background-color: #0052cc;
          color: white;
        }

        .nc-review-btn-submit:hover:not(:disabled) {
          background-color: #003da5;
        }

        .nc-review-btn-submit:active:not(:disabled) {
          background-color: #002d7a;
        }
      `}</style>
    </div>
  );
};

export default NCReviewModal;
