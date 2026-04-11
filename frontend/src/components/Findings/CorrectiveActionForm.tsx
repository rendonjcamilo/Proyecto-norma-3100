/**
 * Corrective Action Form Component
 * Form for creating corrective actions with 6 follow-up steps
 */

import React, { useState } from 'react';
import './CorrectiveActionForm.css';

interface Finding {
  id: string;
  title: string;
  severity: string;
}

interface FollowupStep {
  step_number: number;
  step_name: string;
  description: string;
  due_date: string;
  completion_percentage: number;
  evidence_attachment?: string;
  comments: string;
}

interface CorrectiveActionFormProps {
  finding: Finding;
  onSubmit: (action: any) => Promise<void>;
  onCancel: () => void;
}

const STEP_NAMES = [
  'Planificación',
  'Diseño',
  'Implementación',
  'Pruebas',
  'Validación',
  'Cierre',
];

const DEFAULT_PERCENTAGES = [30, 40, 60, 80, 90, 100];

/**
 * Corrective Action Form Component
 */
export const CorrectiveActionForm: React.FC<CorrectiveActionFormProps> = ({
  finding,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    responsible_user_id: '',
    deadline: '',
    priority: 'media',
  });

  const [followups, setFollowups] = useState<FollowupStep[]>(
    STEP_NAMES.map((name, i) => ({
      step_number: i + 1,
      step_name: name,
      description: '',
      due_date: '',
      completion_percentage: DEFAULT_PERCENTAGES[i],
      comments: '',
    }))
  );

  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFormChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleFollowupChange = (stepNumber: number, field: string, value: any) => {
    setFollowups(
      followups.map((step) =>
        step.step_number === stepNumber ? { ...step, [field]: value } : step
      )
    );
  };

  const toggleStep = (stepNumber: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepNumber)) {
      newExpanded.delete(stepNumber);
    } else {
      newExpanded.add(stepNumber);
    }
    setExpandedSteps(newExpanded);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    if (!formData.deadline) {
      newErrors.deadline = 'La fecha límite es requerida';
    }

    if (!formData.responsible_user_id) {
      newErrors.responsible_user_id = 'El responsable es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      const action = {
        finding_id: finding.id,
        ...formData,
        deadline: new Date(formData.deadline).toISOString(),
      };

      await onSubmit({
        action,
        followups,
      });
    } catch (err) {
      console.error('Error submitting action:', err);
      setErrors({ submit: 'Error al crear la acción correctiva' });
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityClass = (priority: string): string => {
    switch (priority) {
      case 'crítica':
        return 'priority-critical';
      case 'alta':
        return 'priority-high';
      case 'media':
        return 'priority-medium';
      case 'baja':
        return 'priority-low';
      default:
        return 'priority-medium';
    }
  };

  return (
    <div className="corrective-action-form-container">
      <div className="form-header">
        <h2>Crear Acción Correctiva</h2>
        <p className="form-subtitle">
          Para hallazgo: <strong>{finding.title}</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="corrective-action-form">
        {/* Basic Information Section */}
        <div className="form-section">
          <h3>Información General</h3>

          <div className="form-group">
            <label htmlFor="title">
              Título de la Acción <span className="required">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleFormChange('title', e.target.value)}
              placeholder="Ej: Implementar procedimiento de control de infecciones"
              className={`form-input ${errors.title ? 'error' : ''}`}
            />
            {errors.title && <p className="error-text">{errors.title}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="description">
              Descripción Detallada <span className="required">*</span>
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              placeholder="Describa en detalle qué se hará para corregir el hallazgo"
              rows={4}
              className={`form-textarea ${errors.description ? 'error' : ''}`}
            />
            {errors.description && <p className="error-text">{errors.description}</p>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="responsible">
                Responsable <span className="required">*</span>
              </label>
              <select
                id="responsible"
                value={formData.responsible_user_id}
                onChange={(e) => handleFormChange('responsible_user_id', e.target.value)}
                className={`form-select ${errors.responsible_user_id ? 'error' : ''}`}
              >
                <option value="">Seleccionar responsable...</option>
                <option value="user-1">Juan García - Coordinador</option>
                <option value="user-2">María López - Enfermera Jefe</option>
                <option value="user-3">Carlos Rodríguez - Director</option>
              </select>
              {errors.responsible_user_id && (
                <p className="error-text">{errors.responsible_user_id}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="deadline">
                Fecha Límite <span className="required">*</span>
              </label>
              <input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => handleFormChange('deadline', e.target.value)}
                className={`form-input ${errors.deadline ? 'error' : ''}`}
              />
              {errors.deadline && <p className="error-text">{errors.deadline}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="priority">Prioridad</label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => handleFormChange('priority', e.target.value)}
                className="form-select"
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="crítica">Crítica</option>
              </select>
              <span className={`priority-indicator ${getPriorityClass(formData.priority)}`}>
                {formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Follow-up Steps Section */}
        <div className="form-section">
          <h3>Pasos de Seguimiento (Seguimiento y Validación)</h3>
          <p className="section-note">
            Define hasta 6 pasos para el progreso de la acción. Cada paso tiene un porcentaje de
            completitud asociado.
          </p>

          <div className="followups-container">
            {followups.map((step) => (
              <div key={step.step_number} className="followup-card">
                <div
                  className="followup-header"
                  onClick={() => toggleStep(step.step_number)}
                >
                  <div className="followup-title">
                    <span className="step-badge">Paso {step.step_number}</span>
                    <h4>{step.step_name}</h4>
                  </div>
                  <div className="followup-summary">
                    <span className="completion-badge">{step.completion_percentage}%</span>
                    <span className="toggle-icon">
                      {expandedSteps.has(step.step_number) ? '▼' : '▶'}
                    </span>
                  </div>
                </div>

                {expandedSteps.has(step.step_number) && (
                  <div className="followup-content">
                    <div className="form-group">
                      <label htmlFor={`description-${step.step_number}`}>
                        Descripción del Paso
                      </label>
                      <textarea
                        id={`description-${step.step_number}`}
                        value={step.description}
                        onChange={(e) =>
                          handleFollowupChange(step.step_number, 'description', e.target.value)
                        }
                        placeholder={`Describe qué se hará en la etapa de ${step.step_name.toLowerCase()}`}
                        rows={2}
                        className="form-textarea"
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor={`due-date-${step.step_number}`}>
                          Fecha Esperada
                        </label>
                        <input
                          id={`due-date-${step.step_number}`}
                          type="date"
                          value={step.due_date}
                          onChange={(e) =>
                            handleFollowupChange(step.step_number, 'due_date', e.target.value)
                          }
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor={`completion-${step.step_number}`}>
                          Completitud (%)
                        </label>
                        <input
                          id={`completion-${step.step_number}`}
                          type="number"
                          min="0"
                          max="100"
                          value={step.completion_percentage}
                          onChange={(e) =>
                            handleFollowupChange(
                              step.step_number,
                              'completion_percentage',
                              parseInt(e.target.value, 10)
                            )
                          }
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor={`comments-${step.step_number}`}>
                        Notas
                      </label>
                      <textarea
                        id={`comments-${step.step_number}`}
                        value={step.comments}
                        onChange={(e) =>
                          handleFollowupChange(step.step_number, 'comments', e.target.value)
                        }
                        placeholder="Notas adicionales sobre este paso"
                        rows={2}
                        className="form-textarea"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Messages */}
        {errors.submit && (
          <div className="form-error-message">
            <p>{errors.submit}</p>
          </div>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={submitting}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Creando...' : 'Crear Acción Correctiva'}
          </button>
        </div>
      </form>
    </div>
  );
};
