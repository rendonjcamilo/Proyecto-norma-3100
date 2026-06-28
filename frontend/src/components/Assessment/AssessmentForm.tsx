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

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { formatTime } from '@/utils/dateFormat';
import { useAuth } from '@context/AuthContext';
import './AssessmentForm.css';
import CriterionInput from './CriterionInput';
import ProgressBar from './ProgressBar';
import ScoresDisplay from './ScoresDisplay';
import NCReviewModal from './NCReviewModal';

interface Assessment {
  id: string;
  providerId: string;
  serviceId: string;
  serviceName?: string;
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
  number?: string;
  name: string;
  description: string;
  evidenceRequirement: string;
  complexity: 'simple' | 'medium' | 'complex';
  ncHint?: string;
  is_section_header?: boolean;
  sort_order?: number;
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

/**
 * Extrae el número jerárquico embebido en el nombre del criterio.
 * El campo `number` de la BD es un contador secuencial (1, 2, 3...) y no refleja
 * la jerarquía real. El número jerárquico vive solo en el nombre:
 *   "4. El prestador..."  → "4"
 *   "4.1. Convenio..."   → "4.1"
 *   "13.1.1. Profesional..." → "13.1.1"
 */
function getHierarchicalNumber(criterion: Criterion): string | null {
  const match = criterion.name.match(/^(\d+(?:\.\d+)*)[.\s]/);
  return match ? match[1] : null;
}

/**
 * Retorna los IDs de todos los criterios descendientes del criterio dado,
 * detectados por prefijo numérico (ej: padre "5" → hijos "5.1", "5.2", "5.1.1", etc.)
 */
function getBranchChildIds(criterion: Criterion, allCriteria: Criterion[]): string[] {
  const num = getHierarchicalNumber(criterion);
  if (!num) return [];
  const prefix = num + '.';
  return allCriteria
    .filter((c) => {
      if (c.id === criterion.id) return false;
      const childNum = getHierarchicalNumber(c);
      return childNum?.startsWith(prefix) ?? false;
    })
    .map((c) => c.id);
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
  const [collapsedBranches, setCollapsedBranches] = useState<Set<string>>(new Set());

  const { user } = useAuth();
  const isAuditor = user?.role === 'auditor' || user?.role === 'super_admin';

  const [expandedStandards, setExpandedStandards] = useState<Set<string>>(
    new Set(questionnaiireData.standards.map((s) => s.id).slice(0, 1))
  );

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

  // Auto-save every 60 seconds
  useEffect(() => {
    const autoSaveInterval = setInterval(async () => {
      if (responses.size > 0 && !readOnly) {
        await handleSave();
      }
    }, 60000);

    return () => clearInterval(autoSaveInterval);
  }, [responses, readOnly, handleSave]);

  const handleResponseChange = (criterionId: string, response: Response) => {
    const newResponses = new Map(responses);
    newResponses.set(criterionId, response);
    setResponses(newResponses);
  };

  /**
   * Marca como NC todos los criterios evaluables de la rama (padre + descendientes).
   * Los encabezados de sección dentro de la rama se omiten ya que no son evaluables.
   */
  const handleDenyBranch = useCallback((parentId: string, branchIds: string[]) => {
    const allCriteria = questionnaiireData.standards.flatMap((s) => s.criteria);
    const defaultDescription = 'No cumple. Se niega la rama completa por incumplimiento del criterio principal.';
    const newResponses = new Map(responses);

    for (const id of [parentId, ...branchIds]) {
      const criterion = allCriteria.find((c) => c.id === id);
      if (criterion && !criterion.is_section_header) {
        newResponses.set(id, { criterionId: id, status: 'NC', description: defaultDescription });
      }
    }

    setResponses(newResponses);
    setCollapsedBranches((prev) => new Set([...prev, parentId]));
  }, [responses, questionnaiireData]);

  /**
   * Marca como NA todos los criterios evaluables de la rama (padre + descendientes).
   * Los encabezados de sección dentro de la rama se omiten ya que no son evaluables.
   */
  const handleNABranch = useCallback((parentId: string, branchIds: string[]) => {
    const allCriteria = questionnaiireData.standards.flatMap((s) => s.criteria);
    const newResponses = new Map(responses);

    for (const id of [parentId, ...branchIds]) {
      const criterion = allCriteria.find((c) => c.id === id);
      if (criterion && !criterion.is_section_header) {
        newResponses.set(id, { criterionId: id, status: 'NA' });
      }
    }

    setResponses(newResponses);
    setCollapsedBranches((prev) => new Set([...prev, parentId]));
  }, [responses, questionnaiireData]);

  const handleExpandBranch = useCallback((parentId: string) => {
    setCollapsedBranches((prev) => {
      const next = new Set(prev);
      next.delete(parentId);
      return next;
    });
  }, []);

  const handleDescriptionChange = (criterionId: string, description: string) => {
    const response = responses.get(criterionId);
    if (response) {
      const newResponses = new Map(responses);
      newResponses.set(criterionId, { ...response, description });
      setResponses(newResponses);
    }
  };

  const handleSubmit = async () => {
    if (!onSubmit) return;

    // Valida que todos los criterios evaluables tengan respuesta (excluye encabezados de sección)
    const allStandardCriteria = questionnaiireData.standards.flatMap((s) =>
      s.criteria.filter((c) => !c.is_section_header)
    );
    const unansweredCriteria = allStandardCriteria.filter((c) => !responses.has(c.id));

    if (unansweredCriteria.length > 0) {
      setErrorMessage(
        `Por favor responda todos los criterios. Criterios sin responder: ${unansweredCriteria.length}`
      );
      return;
    }

    // Mostrar modal de revisión NC
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    if (!onSubmit) return;

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      // Guardar respuestas actuales antes de enviar
      if (onSave && responses.size > 0) {
        await onSave(Array.from(responses.values()));
      }
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

  const allEvaluable = useMemo(
    () => questionnaiireData.standards.flatMap((s) => s.criteria.filter((c) => !c.is_section_header)),
    [questionnaiireData]
  );
  const totalCriteria = allEvaluable.length;
  const evaluableIds = useMemo(() => new Set(allEvaluable.map((c) => c.id)), [allEvaluable]);
  const answeredCriteria = Array.from(responses.keys()).filter((id) => evaluableIds.has(id)).length;

  // Cálculo en tiempo real: solo C y NC cuentan, NA excluido
  const liveCompliance = useMemo(() => {
    const vals = Array.from(responses.values());
    const cumple = vals.filter((r) => r.status === 'C').length;
    const noCumple = vals.filter((r) => r.status === 'NC').length;
    const denom = cumple + noCumple;
    return denom > 0 ? Math.round((cumple / denom) * 100) : 0;
  }, [responses]);

  const liveSemaforo: 'verde' | 'naranja' | 'rojo' =
    liveCompliance >= 80 ? 'verde' : liveCompliance >= 50 ? 'naranja' : 'rojo';

  // Group standards (transversales first, then service-specific)
  const transversales = questionnaiireData.standards.filter((s) => s.isTransversal);
  const serviceSpecific = questionnaiireData.standards.filter((s) => !s.isTransversal);

  return (
    <div className="assessment-form">
      <div className="form-header">
        <h1>Evaluación de Cumplimiento - {assessment.assessmentVersion}</h1>
        {(assessment.serviceName || assessment.serviceId) && (
          <p>Servicio: {assessment.serviceName || assessment.serviceId}</p>
        )}

        {/* Progress & Scores */}
        <div className="form-stats">
          <ProgressBar completed={answeredCriteria} total={totalCriteria} />
          <ScoresDisplay compliance={liveCompliance} semaforo={liveSemaforo} />
        </div>

        {/* Last Saved Indicator */}
        {lastSaved && !readOnly && (
          <div className="save-status">
            <span className="save-indicator">
              Auto-guardado a las {formatTime(lastSaved)}
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
                onDenyBranch={handleDenyBranch}
                onNABranch={handleNABranch}
                readOnly={readOnly}
                isAuditor={isAuditor}
                collapsedBranches={collapsedBranches}
                onExpandBranch={handleExpandBranch}
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
                onDenyBranch={handleDenyBranch}
                onNABranch={handleNABranch}
                readOnly={readOnly}
                isAuditor={isAuditor}
                collapsedBranches={collapsedBranches}
                onExpandBranch={handleExpandBranch}
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

      {/* NC Review Modal */}
      {showConfirmModal && (
        <NCReviewModal
          criteria={questionnaiireData.standards.flatMap((s) =>
            s.criteria.map((c) => ({
              id: c.id,
              code: c.code,
              name: c.name,
              standard_id: s.id,
              standard_name: s.name,
              is_transversal: s.isTransversal,
              nc_hint: c.ncHint,
            }))
          )}
          responses={responses}
          onDescriptionChange={handleDescriptionChange}
          onConfirm={handleConfirmSubmit}
          onCancel={handleCancelSubmit}
        />
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
  onDenyBranch: (parentId: string, branchIds: string[]) => void;
  onNABranch: (parentId: string, branchIds: string[]) => void;
  readOnly?: boolean;
  isAuditor?: boolean;
  collapsedBranches: Set<string>;
  onExpandBranch: (parentId: string) => void;
}

const StandardGroup: React.FC<StandardGroupProps> = ({
  standard,
  isExpanded,
  onToggle,
  responses,
  onResponseChange,
  onDenyBranch,
  onNABranch,
  readOnly,
  isAuditor = false,
  collapsedBranches,
  onExpandBranch,
}) => {
  const evaluable = standard.criteria.filter((c) => !c.is_section_header);
  const answeredInGroup = evaluable.filter((c) => responses.has(c.id)).length;
  const completionPercent = evaluable.length > 0 ? (answeredInGroup / evaluable.length) * 100 : 0;

  // IDs de criterios hijos de ramas colapsadas (se ocultan en el render)
  const collapsedChildIds = useMemo(() => {
    const ids = new Set<string>();
    for (const parentId of collapsedBranches) {
      const parent = standard.criteria.find((c) => c.id === parentId);
      if (parent) {
        getBranchChildIds(parent, standard.criteria).forEach((id) => ids.add(id));
      }
    }
    return ids;
  }, [collapsedBranches, standard.criteria]);

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
            {answeredInGroup}/{evaluable.length}
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
          {standard.criteria.map((criterion, index) => {
            // Ocultar hijos de ramas colapsadas
            if (collapsedChildIds.has(criterion.id)) return null;

            const branchIds = getBranchChildIds(criterion, standard.criteria);
            const isCollapsed = collapsedBranches.has(criterion.id) && branchIds.length > 0;
            const branchStatus = responses.get(criterion.id)?.status;

            return (
              <React.Fragment key={criterion.id}>
                <CriterionInput
                  criterion={criterion}
                  number={criterion.number || String(index + 1)}
                  response={responses.get(criterion.id)}
                  onChange={(response) => onResponseChange(criterion.id, response)}
                  readOnly={readOnly}
                  isBranchParent={branchIds.length > 0}
                  branchSize={branchIds.length}
                  isAuditor={isAuditor}
                  onDenyBranch={branchIds.length > 0 ? () => onDenyBranch(criterion.id, branchIds) : undefined}
                  onNABranch={branchIds.length > 0 ? () => onNABranch(criterion.id, branchIds) : undefined}
                />
                {isCollapsed && (
                  <div className="branch-collapsed-summary">
                    <span className="branch-collapsed-label">
                      {branchIds.length} sub-criterio{branchIds.length !== 1 ? 's' : ''} marcado{branchIds.length !== 1 ? 's' : ''} como{' '}
                      <strong>{branchStatus === 'NC' ? 'No Cumple' : 'No Aplica'}</strong>
                    </span>
                    <button
                      type="button"
                      className="btn-expand-branch"
                      onClick={() => onExpandBranch(criterion.id)}
                    >
                      Expandir ▼
                    </button>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AssessmentForm;
