/**
 * CriterionInput Component
 * Renders a single criterion with:
 * - Radio buttons: Cumple / No Cumple / No Aplica
 * - For NC: required hallazgo description field
 * - Optional comment field
 * - Optional evidence upload
 */

import React, { useState } from 'react';
import './CriterionInput.css';

interface Criterion {
  id: string;
  code: string;
  name: string;
  description: string;
  evidenceRequirement: string;
  complexity: 'simple' | 'medium' | 'complex';
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
  number: number;
  response?: CriterionResponse;
  onChange: (response: CriterionResponse) => void;
  readOnly?: boolean;
}

const CriterionInput: React.FC<CriterionInputProps> = ({
  criterion,
  number,
  response,
  onChange,
  readOnly = false,
}) => {
  const [localResponse, setLocalResponse] = useState<CriterionResponse>(
    response || { criterionId: criterion.id, status: 'C' }
  );

  const handleStatusChange = (status: 'C' | 'NC' | 'NA') => {
    const newResponse = { ...localResponse, status };
    // Clear description if not NC
    if (status !== 'NC') {
      newResponse.description = '';
    }
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

  const complexityColor: Record<string, string> = {
    simple: 'complexity-simple',
    medium: 'complexity-medium',
    complex: 'complexity-complex',
  };

  const isDescriptionValid = localResponse.status !== 'NC' || (localResponse.description && localResponse.description.length >= 10);
  const hasError = localResponse.status === 'NC' && !isDescriptionValid;

  return (
    <div className={`criterion-input ${hasError ? 'error' : ''} ${readOnly ? 'read-only' : ''}`}>
      <div className="criterion-header">
        <div className="criterion-number">{number}.</div>
        <div className="criterion-details">
          <div className="criterion-code">
            {criterion.code}
            <span className={`complexity-badge ${complexityColor[criterion.complexity]}`}>
              {criterion.complexity}
            </span>
          </div>
          <h5 className="criterion-name">{criterion.name}</h5>
          <p className="criterion-description">{criterion.description}</p>
          {criterion.evidenceRequirement && (
            <p className="criterion-evidence">
              <strong>Evidencia requerida:</strong> {criterion.evidenceRequirement}
            </p>
          )}
        </div>
      </div>

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
            <label htmlFor={`hallazgo-${criterion.id}`}>
              <strong>* Descripción del incumplimiento (requerida):</strong>
              <span className="char-count">
                {localResponse.description?.length || 0}/500
              </span>
            </label>
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
