/**
 * CriterionInput Component
 * Renders a single criterion with:
 * - Radio buttons: Cumple / No Cumple / No Aplica
 * - For NC: required hallazgo description field
 * - Optional comment field
 * - Optional evidence upload
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import './CriterionInput.css';

const RethusConsulta = lazy(() => import('./RethusConsulta'));

interface Criterion {
  id: string;
  code: string;
  name: string;
  description: string;
  evidenceRequirement: string;
  complexity: 'simple' | 'medium' | 'complex';
  ncHint?: string;
  is_section_header?: boolean;
  sort_order?: number;
}

interface CriterionResponse {
  criterionId: string;
  status: 'C' | 'NC' | 'NA';
  description?: string;
  comments?: string;
  evidenceFileIds?: string[];
}

interface CriterionInputProps {
  criterion: Criterion;
  number: number | string;
  response?: CriterionResponse;
  onChange: (response: CriterionResponse) => void;
  readOnly?: boolean;
  isBranchParent?: boolean;
  branchSize?: number;
  isAuditor?: boolean;
  onDenyBranch?: () => void;
  onNABranch?: () => void;
}

// Detecta el nivel jerárquico del número oficial embebido en el nombre
// Ej: "4.1. Convenio..." → nivel 1 | "13.1.1. Profesional..." → nivel 2 | "1. El prestador..." → nivel 0
function getSubLevel(name: string): number {
  const match = name.match(/^(\d+(?:\.\d+)+)\./);
  if (!match) return 0;
  return match[1].split('.').length - 1;
}

const CriterionInput: React.FC<CriterionInputProps> = ({
  criterion,
  number: _number,
  response,
  onChange,
  readOnly = false,
  isBranchParent = false,
  branchSize = 0,
  isAuditor = false,
  onDenyBranch,
  onNABranch,
}) => {
  const subLevel = getSubLevel(criterion.name);

  const [localResponse, setLocalResponse] = useState<CriterionResponse>(
    response || { criterionId: criterion.id, status: 'C' }
  );
  const [showDenyConfirm, setShowDenyConfirm] = useState(false);
  const [showNAConfirm, setShowNAConfirm] = useState(false);

  // Sincroniza estado local cuando el padre actualiza la respuesta externamente (ej: negar rama)
  const responseStatus = response?.status;
  const responseDescription = response?.description;
  const responseComments = response?.comments;
  useEffect(() => {
    if (response) {
      setLocalResponse(response);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [responseStatus, responseDescription, responseComments]);

  const handleStatusChange = (status: 'C' | 'NC' | 'NA') => {
    const newResponse = { ...localResponse, status };
    if (status !== 'NC') {
      newResponse.description = '';
      newResponse.comments = '';
    }
    setLocalResponse(newResponse);
    onChange(newResponse);
  };

  const handleDenyBranchClick = () => { setShowNAConfirm(false); setShowDenyConfirm(true); };
  const handleDenyBranchCancel = () => setShowDenyConfirm(false);
  const handleDenyBranchConfirm = () => {
    setShowDenyConfirm(false);
    onDenyBranch?.();
  };

  const handleNABranchClick = () => { setShowDenyConfirm(false); setShowNAConfirm(true); };
  const handleNABranchCancel = () => setShowNAConfirm(false);
  const handleNABranchConfirm = () => {
    setShowNAConfirm(false);
    onNABranch?.();
  };

  const handleSuggest = () => {
    const suggested = criterion.ncHint ||
      'No se aporta evidencia documental que acredite el cumplimiento de este criterio.';
    const newResponse = { ...localResponse, description: suggested };
    setLocalResponse(newResponse);
    onChange(newResponse);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newResponse = { ...localResponse, description: e.target.value };
    setLocalResponse(newResponse);
    onChange(newResponse);
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newResponse = { ...localResponse, comments: e.target.value };
    setLocalResponse(newResponse);
    onChange(newResponse);
  };

  const _complexityColor: Record<string, string> = {
    simple: 'complexity-simple',
    medium: 'complexity-medium',
    complex: 'complexity-complex',
  };

  const isDescriptionValid = localResponse.status !== 'NC' || (localResponse.description && localResponse.description.length >= 10);
  const hasError = localResponse.status === 'NC' && !isDescriptionValid;

  // Título de sección: solo los marcados explícitamente en BD (is_section_header=true)
  const isHeader = criterion.is_section_header === true;

  if (isHeader) {
    return (
      <div className={`criterion-input criterion-section-header${subLevel > 0 ? ` sub-level-${subLevel}` : ''}`}>
        <div className="criterion-header">
          <div className="criterion-details">
            <h5 className="criterion-name">{criterion.name}</h5>
            {criterion.description && criterion.description !== criterion.name && (
              <p className="criterion-description">{criterion.description}</p>
            )}
          </div>
          {isBranchParent && !readOnly && (
            <div className="branch-actions">
              {showNAConfirm ? (
                <div className="na-branch-confirm">
                  <span>¿Marcar {branchSize} criterio{branchSize !== 1 ? 's' : ''} como NA?</span>
                  <button type="button" className="btn-na-confirm" onClick={handleNABranchConfirm}>Confirmar</button>
                  <button type="button" className="btn-deny-cancel" onClick={handleNABranchCancel}>Cancelar</button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-na-branch"
                  onClick={handleNABranchClick}
                  title={`Marcar los ${branchSize} criterio${branchSize !== 1 ? 's' : ''} de esta rama como No Aplica`}
                >
                  ○ No Aplica rama ({branchSize})
                </button>
              )}
              {isAuditor && !showNAConfirm && (
                showDenyConfirm ? (
                  <div className="deny-branch-confirm">
                    <span>¿Negar {branchSize} criterio{branchSize !== 1 ? 's' : ''}?</span>
                    <button type="button" className="btn-deny-confirm" onClick={handleDenyBranchConfirm}>Confirmar</button>
                    <button type="button" className="btn-deny-cancel" onClick={handleDenyBranchCancel}>Cancelar</button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn-deny-branch"
                    onClick={handleDenyBranchClick}
                    title={`Marcar los ${branchSize} criterio${branchSize !== 1 ? 's' : ''} de esta rama como No Cumple`}
                  >
                    🚫 Negar rama ({branchSize})
                  </button>
                )
              )}
            </div>
          )}
        </div>
        <p className="criterion-header-note">
          Los ítems siguientes detallan las condiciones específicas a evaluar.
        </p>
      </div>
    );
  }

  return (
    <div className={`criterion-input${subLevel > 0 ? ` sub-level-${subLevel}` : ''} ${hasError ? 'error' : ''} ${readOnly ? 'read-only' : ''}`}>
      <div className="criterion-header">
        <div className="criterion-details">
          <h5 className="criterion-name">{criterion.name}</h5>
          {criterion.description && criterion.description !== criterion.name && (
            <p className="criterion-description">{criterion.description}</p>
          )}
          {criterion.evidenceRequirement && (
            <p className="criterion-evidence">
              <strong>Evidencia requerida:</strong> {criterion.evidenceRequirement}
            </p>
          )}
        </div>
        {isBranchParent && !readOnly && (
          <div className="branch-actions">
            {showNAConfirm ? (
              <div className="na-branch-confirm">
                <span>¿Marcar {branchSize} sub-criterio{branchSize !== 1 ? 's' : ''} como NA?</span>
                <button type="button" className="btn-na-confirm" onClick={handleNABranchConfirm}>Confirmar</button>
                <button type="button" className="btn-deny-cancel" onClick={handleNABranchCancel}>Cancelar</button>
              </div>
            ) : (
              <button
                type="button"
                className="btn-na-branch"
                onClick={handleNABranchClick}
                title={`Marcar este criterio y sus ${branchSize} sub-criterio${branchSize !== 1 ? 's' : ''} como No Aplica`}
              >
                ○ No Aplica rama ({branchSize})
              </button>
            )}
            {isAuditor && !showNAConfirm && (
              showDenyConfirm ? (
                <div className="deny-branch-confirm">
                  <span>¿Negar {branchSize} sub-criterio{branchSize !== 1 ? 's' : ''}?</span>
                  <button type="button" className="btn-deny-confirm" onClick={handleDenyBranchConfirm}>Confirmar</button>
                  <button type="button" className="btn-deny-cancel" onClick={handleDenyBranchCancel}>Cancelar</button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-deny-branch"
                  onClick={handleDenyBranchClick}
                  title={`Marcar este criterio y sus ${branchSize} sub-criterio${branchSize !== 1 ? 's' : ''} como No Cumple`}
                >
                  🚫 Negar rama ({branchSize})
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* Widget RETHUS — solo para criterio TSTH-003 (Inscripción ReTHUS) */}
      {criterion.code === 'TSTH-002' && (
        <Suspense fallback={null}>
          <RethusConsulta />
        </Suspense>
      )}

      <div className="criterion-response">
        {/* Radio Buttons */}
        <fieldset className="response-options" disabled={readOnly}>
          <legend>Marque su respuesta:</legend>

          <label className="radio-option">
            <input
              type="radio"
              name={`criterion-${criterion.id}`}
              value="C"
              checked={localResponse.status === 'C'}
              onChange={() => handleStatusChange('C')}
              disabled={readOnly}
            />
            <span className="radio-label cumple">✓ Cumple (C)</span>
          </label>

          <label className="radio-option">
            <input
              type="radio"
              name={`criterion-${criterion.id}`}
              value="NC"
              checked={localResponse.status === 'NC'}
              onChange={() => handleStatusChange('NC')}
              disabled={readOnly}
            />
            <span className="radio-label no-cumple">✗ No Cumple (NC)</span>
          </label>

          <label className="radio-option">
            <input
              type="radio"
              name={`criterion-${criterion.id}`}
              value="NA"
              checked={localResponse.status === 'NA'}
              onChange={() => handleStatusChange('NA')}
              disabled={readOnly}
            />
            <span className="radio-label no-aplica">○ No Aplica (NA)</span>
          </label>
        </fieldset>

        {/* Hallazgo Description (for NC only) */}
        {localResponse.status === 'NC' && (
          <div className="hallazgo-field">
            <div className="hallazgo-label-row">
              <label htmlFor={`hallazgo-${criterion.id}`}>
                <strong>* Descripción del incumplimiento (requerida):</strong>
                <span className="char-count">
                  {localResponse.description?.length || 0}/500
                </span>
              </label>
              {!readOnly && (
                <button
                  type="button"
                  className="btn-suggest"
                  onClick={handleSuggest}
                  title="Usar sugerencia generada automáticamente"
                >
                  💡 Sugerir
                </button>
              )}
            </div>
            <textarea
              id={`hallazgo-${criterion.id}`}
              value={localResponse.description || ''}
              onChange={handleDescriptionChange}
              placeholder="Describe el incumplimiento observado. Mínimo 10 caracteres."
              maxLength={500}
              rows={3}
              disabled={readOnly}
              className={`hallazgo-input ${isDescriptionValid ? '' : 'invalid'}`}
            />
            {!isDescriptionValid && (
              <span className="error-message">
                {!localResponse.description
                  ? 'Campo requerido para respuestas NC'
                  : 'Mínimo 10 caracteres requeridos'}
              </span>
            )}
          </div>
        )}

        {/* Comment Field (optional for all responses) */}
        <div className="comment-field">
          <label htmlFor={`comment-${criterion.id}`}>
            Comentario adicional (opcional):
            <span className="char-count">
              {localResponse.comments?.length || 0}/500
            </span>
          </label>
          <textarea
            id={`comment-${criterion.id}`}
            value={localResponse.comments || ''}
            onChange={handleCommentChange}
            placeholder="Agregue cualquier comentario adicional relevante..."
            maxLength={500}
            rows={2}
            disabled={readOnly}
            className="comment-input"
          />
        </div>

        {/* Evidence Upload (future) */}
        <div className="evidence-field">
          <label>Evidencia (opcional):</label>
          <p className="evidence-note">
            Soporte para subir evidencia disponible en versión mejorada
          </p>
        </div>
      </div>
    </div>
  );
};

export default CriterionInput;
