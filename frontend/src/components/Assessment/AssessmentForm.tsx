/**
 * AssessmentForm Component
 * Renders the assessment execution form with criteria grouped by standard
 * Features:
 * - Display questionnaire criteria (40-80 total)
 * - Grouped by standard (7 transversales + service-specific)
 * - Support C/NC/NA responses
 * - Required hallazgo description for NC
 * - Optional comment for all responses
 * - Progress tracking
 * - Auto-save every 30s
 * - Manual save button
 * - Submit button (only if all criteria answered)
 */

import React, { useState, useEffect, useCallback } from 'react';
import './AssessmentForm.css';
import CriterionInput from './CriterionInput';
import ProgressBar from './ProgressBar';
import ScoresDisplay from './ScoresDisplay';

interface Assessment {
  id: string;
  providerId: string;
  serviceId: string;
  questionnaireId: string;
  assessmentVersion: string;
  status: 'in_progress' | 'submitted' | 'locked';
  startedDate: string;
  compliancePercent: number;
  semaforo: 'verde' | 'naranja' | 'rojo';
}

interface Criterion {
  id: string;
  code: string;
  name: string;
  description: string;
  evidenceRequirement: string;
  complexity: 'simple' | 'medium' | 'complex';
}

interface Standard {
  id: string;
  code: string;
  name: string;
  isTransversal: boolean;
  criteria: Criterion[];
}

interface Response {
  criterionId: string;
  status: 'C' | 'NC' | 'NA';
  description?: string;
  comments?: string;
}

export interface AssessmentFormProps {
  assessment: Assessment;
  questionnaiireData: {
    standards: Standard[];
  };
  initialResponses?: Response[];
  onSave?: (responses: Response[]) => Promise<void>;
  onSubmit?: () => Promise<void>;
  readOnly?: boolean;
}

const AssessmentForm: React.FC<AssessmentFormProps> = ({
  assessment,
  questionnaiireData,
  initialResponses,
  onSave,
  onSubmit,
  readOnly = false,
}) => {
  const [responses, setResponses] = useState<Map<string, Response>>(() => {
    const map = new Map<string, Response>();
    if (initialResponses) {
      for (const r of initialResponses) {
        map.set(r.criterionId, r);
      }
    }
    return map;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveMessage, setSaveMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [expandedStandards, setExpandedStandards] = useState<Set<string>>(
    new Set(questionnaiireData.standards.map((s) => s.id).slice(0, 1))
  );

  // Auto-save every 30 seconds
  useEffect(() => {
    const autoSaveInterval = setInterval(async () => {
      if (responses.size > 0 && !readOnly) {
        await handleSave();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [responses, readOnly]);

  const handleSave = useCallback(async () => {
    if (!onSave || responses.size === 0 || readOnly) return;

    setIsSaving(true);
    try {
      const responsesArray = Array.from(responses.values());
      await onSave(responsesArray);
      setLastSaved(new Date());
      setSaveMessage('✓ Guardado correctamente');
      setTimeout(() => setSaveMessage(''), 5000);
    } catch (error) {
      setSaveMessage('✗ Error al guardar');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  }, [responses, onSave, readOnly]);

  const handleResponseChange = (criterionId: string, response: Response) => {
    const newResponses = new Map(responses);
    newResponses.set(criterionId, response);
    setResponses(newResponses);
  };

  const handleSubmit = async () => {
    if (!onSubmit) return;

    // Validate all criteria are answered (except NA)
    const allStandardCriteria = questionnaiireData.standards.flatMap((s) => s.criteria);
    const unansweredCriteria = allStandardCriteria.filter((c) => !responses.has(c.id));

    if (unansweredCriteria.length > 0) {
      setErrorMessage(
        `Por favor responda todos los criterios. Criterios sin responder: ${unansweredCriteria.length}`
      );
      return;
    }

    // Mostrar modal de confirmación
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    if (!onSubmit) return;

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await onSubmit();
    } catch (error) {
      setErrorMessage('Error al enviar la evaluación');
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSubmit = () => {
    setShowConfirmModal(false)
  };

  const toggleStandard = (standardId: string) => {
    const newExpanded = new Set(expandedStandards);
    if (newExpanded.has(standardId)) {
      newExpanded.delete(standardId);
    } else {
      newExpanded.add(standardId);
    }
    setExpandedStandards(newExpanded);
  };

  const totalCriteria = questionnaiireData.standards.reduce((acc, s) => acc + s.criteria.length, 0);
  const answeredCriteria = responses.size;

  // Group standards (transversales first, then service-specific)
  const transversales = questionnaiireData.standards.filter((s) => s.isTransversal);
  const serviceSpecific = questionnaiireData.standards.filter((s) => !s.isTransversal);

  return (
    <div className="assessment-form">
      <div className="form-header">
        <h1>Evaluación de Cumplimiento - {assessment.assessmentVersion}</h1>
        <p>Servicio: {assessment.serviceId}</p>

        {/* Progress & Scores */}
        <div className="form-stats">
          <ProgressBar completed={answeredCriteria} total={totalCriteria} />
          <ScoresDisplay compliance={assessment.compliancePercent} semaforo={assessment.semaforo} />
        </div>

        {/* Last Saved Indicator */}
        {lastSaved && !readOnly && (
          <div className="save-status">
            <span className="save-indicator">
              Auto-guardado a las {lastSaved.toLocaleTimeString('es-CO')}
            </span>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="error-banner">
            <span>⚠️</span>
            <span>{errorMessage}</span>
            <button
              className="error-close"
              onClick={() => setErrorMessage('')}
              type="button"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Assessment Form */}
      {!readOnly && (
        <div className="form-actions-top">
          <button
            onClick={handleSave}
            disabled={isSaving || responses.size === 0}
            className="btn btn-save"
            title={responses.size === 0 ? 'Responde al menos un criterio para guardar' : 'Guardar respuestas'}
          >
            {isSaving ? 'Guardando...' : '💾 Guardar'}
          </button>
          {responses.size === 0 && !saveMessage && (
            <span className="save-hint">Responde criterios primero</span>
          )}
          {saveMessage && <span className={`save-message ${saveMessage.includes('✓') ? 'success' : 'error'}`}>{saveMessage}</span>}
        </div>
      )}

      {/* Standards & Criteria */}
      <div className="assessment-body">
        {/* Transversales Section */}
        {transversales.length > 0 && (
          <section className="standards-section transversales-section">
            <h2>Estándares Transversales (Aplicables a todos los servicios)</h2>
            {transversales.map((standard) => (
              <StandardGroup
                key={standard.id}
                standard={standard}
                isExpanded={expandedStandards.has(standard.id)}
                onToggle={() => toggleStandard(standard.id)}
                responses={responses}
                onResponseChange={handleResponseChange}
                readOnly={readOnly}
              />
            ))}
          </section>
        )}

        {/* Service-Specific Section */}
        {serviceSpecific.length > 0 && (
          <section className="standards-section service-specific-section">
            <h2>Estándares Específicos del Servicio</h2>
            {serviceSpecific.map((standard) => (
              <StandardGroup
                key={standard.id}
                standard={standard}
                isExpanded={expandedStandards.has(standard.id)}
                onToggle={() => toggleStandard(standard.id)}
                responses={responses}
                onResponseChange={handleResponseChange}
                readOnly={readOnly}
              />
            ))}
          </section>
        )}
      </div>

      {/* Form Actions */}
      {!readOnly && (
        <div className="form-actions">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || answeredCriteria < totalCriteria}
            className="btn btn-submit"
            title={
              answeredCriteria < totalCriteria
                ? `Por favor responda todos los criterios (${answeredCriteria}/${totalCriteria})`
                : 'Enviar evaluación'
            }
          >
            {isSubmitting ? 'Enviando...' : '✅ Enviar Evaluación'}
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={handleCancelSubmit}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirmar envío</h2>
              <button
                className="modal-close"
                onClick={handleCancelSubmit}
                type="button"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>¿Está seguro de que desea enviar la evaluación?</p>
              <p className="modal-warning">
                ⚠️ No podrá hacer cambios después de enviar.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={handleCancelSubmit}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="btn btn-danger"
                onClick={handleConfirmSubmit}
                type="button"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Enviando...' : 'Sí, enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * StandardGroup Component - Collapsible standard with its criteria
 */
interface StandardGroupProps {
  standard: Standard;
  isExpanded: boolean;
  onToggle: () => void;
  responses: Map<string, Response>;
  onResponseChange: (criterionId: string, response: Response) => void;
  readOnly?: boolean;
}

const StandardGroup: React.FC<StandardGroupProps> = ({
  standard,
  isExpanded,
  onToggle,
  responses,
  onResponseChange,
  readOnly,
}) => {
  const answeredInGroup = standard.criteria.filter((c) => responses.has(c.id)).length;
  const completionPercent =
    standard.criteria.length > 0 ? (answeredInGroup / standard.criteria.length) * 100 : 0;

  return (
    <div className={`standard-group ${standard.isTransversal ? 'transversal' : 'service-specific'}`}>
      <div className="standard-header" onClick={onToggle}>
        <div className="standard-title-section">
          <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
          <div className="standard-info">
            <h3 className="standard-code">{standard.code}</h3>
            <h4 className="standard-name">{standard.name}</h4>
          </div>
        </div>
        <div className="standard-progress">
          <span className="progress-text">
            {answeredInGroup}/{standard.criteria.length}
          </span>
          <div className="progress-bar-mini">
            <div
              className="progress-bar-fill"
              style={{ width: `${completionPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="standard-criteria">
          {standard.criteria.map((criterion, index) => (
            <CriterionInput
              key={criterion.id}
              criterion={criterion}
              number={index + 1}
              response={responses.get(criterion.id)}
              onChange={(response) => onResponseChange(criterion.id, response)}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AssessmentForm;
