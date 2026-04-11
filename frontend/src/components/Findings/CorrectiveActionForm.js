import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Corrective Action Form Component
 * Form for creating corrective actions with 6 follow-up steps
 */
import { useState } from 'react';
import './CorrectiveActionForm.css';
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
export const CorrectiveActionForm = ({ finding, onSubmit, onCancel, }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        responsible_user_id: '',
        deadline: '',
        priority: 'media',
    });
    const [followups, setFollowups] = useState(STEP_NAMES.map((name, i) => ({
        step_number: i + 1,
        step_name: name,
        description: '',
        due_date: '',
        completion_percentage: DEFAULT_PERCENTAGES[i],
        comments: '',
    })));
    const [expandedSteps, setExpandedSteps] = useState(new Set());
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const handleFormChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
        // Clear error for this field
        if (errors[field]) {
            setErrors({ ...errors, [field]: '' });
        }
    };
    const handleFollowupChange = (stepNumber, field, value) => {
        setFollowups(followups.map((step) => step.step_number === stepNumber ? { ...step, [field]: value } : step));
    };
    const toggleStep = (stepNumber) => {
        const newExpanded = new Set(expandedSteps);
        if (newExpanded.has(stepNumber)) {
            newExpanded.delete(stepNumber);
        }
        else {
            newExpanded.add(stepNumber);
        }
        setExpandedSteps(newExpanded);
    };
    const validateForm = () => {
        const newErrors = {};
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
    const handleSubmit = async (e) => {
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
        }
        catch (err) {
            console.error('Error submitting action:', err);
            setErrors({ submit: 'Error al crear la acción correctiva' });
        }
        finally {
            setSubmitting(false);
        }
    };
    const getPriorityClass = (priority) => {
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
    return (_jsxs("div", { className: "corrective-action-form-container", children: [_jsxs("div", { className: "form-header", children: [_jsx("h2", { children: "Crear Acci\u00F3n Correctiva" }), _jsxs("p", { className: "form-subtitle", children: ["Para hallazgo: ", _jsx("strong", { children: finding.title })] })] }), _jsxs("form", { onSubmit: handleSubmit, className: "corrective-action-form", children: [_jsxs("div", { className: "form-section", children: [_jsx("h3", { children: "Informaci\u00F3n General" }), _jsxs("div", { className: "form-group", children: [_jsxs("label", { htmlFor: "title", children: ["T\u00EDtulo de la Acci\u00F3n ", _jsx("span", { className: "required", children: "*" })] }), _jsx("input", { id: "title", type: "text", value: formData.title, onChange: (e) => handleFormChange('title', e.target.value), placeholder: "Ej: Implementar procedimiento de control de infecciones", className: `form-input ${errors.title ? 'error' : ''}` }), errors.title && _jsx("p", { className: "error-text", children: errors.title })] }), _jsxs("div", { className: "form-group", children: [_jsxs("label", { htmlFor: "description", children: ["Descripci\u00F3n Detallada ", _jsx("span", { className: "required", children: "*" })] }), _jsx("textarea", { id: "description", value: formData.description, onChange: (e) => handleFormChange('description', e.target.value), placeholder: "Describa en detalle qu\u00E9 se har\u00E1 para corregir el hallazgo", rows: 4, className: `form-textarea ${errors.description ? 'error' : ''}` }), errors.description && _jsx("p", { className: "error-text", children: errors.description })] }), _jsxs("div", { className: "form-row", children: [_jsxs("div", { className: "form-group", children: [_jsxs("label", { htmlFor: "responsible", children: ["Responsable ", _jsx("span", { className: "required", children: "*" })] }), _jsxs("select", { id: "responsible", value: formData.responsible_user_id, onChange: (e) => handleFormChange('responsible_user_id', e.target.value), className: `form-select ${errors.responsible_user_id ? 'error' : ''}`, children: [_jsx("option", { value: "", children: "Seleccionar responsable..." }), _jsx("option", { value: "user-1", children: "Juan Garc\u00EDa - Coordinador" }), _jsx("option", { value: "user-2", children: "Mar\u00EDa L\u00F3pez - Enfermera Jefe" }), _jsx("option", { value: "user-3", children: "Carlos Rodr\u00EDguez - Director" })] }), errors.responsible_user_id && (_jsx("p", { className: "error-text", children: errors.responsible_user_id }))] }), _jsxs("div", { className: "form-group", children: [_jsxs("label", { htmlFor: "deadline", children: ["Fecha L\u00EDmite ", _jsx("span", { className: "required", children: "*" })] }), _jsx("input", { id: "deadline", type: "date", value: formData.deadline, onChange: (e) => handleFormChange('deadline', e.target.value), className: `form-input ${errors.deadline ? 'error' : ''}` }), errors.deadline && _jsx("p", { className: "error-text", children: errors.deadline })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "priority", children: "Prioridad" }), _jsxs("select", { id: "priority", value: formData.priority, onChange: (e) => handleFormChange('priority', e.target.value), className: "form-select", children: [_jsx("option", { value: "baja", children: "Baja" }), _jsx("option", { value: "media", children: "Media" }), _jsx("option", { value: "alta", children: "Alta" }), _jsx("option", { value: "cr\u00EDtica", children: "Cr\u00EDtica" })] }), _jsx("span", { className: `priority-indicator ${getPriorityClass(formData.priority)}`, children: formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1) })] })] })] }), _jsxs("div", { className: "form-section", children: [_jsx("h3", { children: "Pasos de Seguimiento (Seguimiento y Validaci\u00F3n)" }), _jsx("p", { className: "section-note", children: "Define hasta 6 pasos para el progreso de la acci\u00F3n. Cada paso tiene un porcentaje de completitud asociado." }), _jsx("div", { className: "followups-container", children: followups.map((step) => (_jsxs("div", { className: "followup-card", children: [_jsxs("div", { className: "followup-header", onClick: () => toggleStep(step.step_number), children: [_jsxs("div", { className: "followup-title", children: [_jsxs("span", { className: "step-badge", children: ["Paso ", step.step_number] }), _jsx("h4", { children: step.step_name })] }), _jsxs("div", { className: "followup-summary", children: [_jsxs("span", { className: "completion-badge", children: [step.completion_percentage, "%"] }), _jsx("span", { className: "toggle-icon", children: expandedSteps.has(step.step_number) ? '▼' : '▶' })] })] }), expandedSteps.has(step.step_number) && (_jsxs("div", { className: "followup-content", children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: `description-${step.step_number}`, children: "Descripci\u00F3n del Paso" }), _jsx("textarea", { id: `description-${step.step_number}`, value: step.description, onChange: (e) => handleFollowupChange(step.step_number, 'description', e.target.value), placeholder: `Describe qué se hará en la etapa de ${step.step_name.toLowerCase()}`, rows: 2, className: "form-textarea" })] }), _jsxs("div", { className: "form-row", children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: `due-date-${step.step_number}`, children: "Fecha Esperada" }), _jsx("input", { id: `due-date-${step.step_number}`, type: "date", value: step.due_date, onChange: (e) => handleFollowupChange(step.step_number, 'due_date', e.target.value), className: "form-input" })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: `completion-${step.step_number}`, children: "Completitud (%)" }), _jsx("input", { id: `completion-${step.step_number}`, type: "number", min: "0", max: "100", value: step.completion_percentage, onChange: (e) => handleFollowupChange(step.step_number, 'completion_percentage', parseInt(e.target.value, 10)), className: "form-input" })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: `comments-${step.step_number}`, children: "Notas" }), _jsx("textarea", { id: `comments-${step.step_number}`, value: step.comments, onChange: (e) => handleFollowupChange(step.step_number, 'comments', e.target.value), placeholder: "Notas adicionales sobre este paso", rows: 2, className: "form-textarea" })] })] }))] }, step.step_number))) })] }), errors.submit && (_jsx("div", { className: "form-error-message", children: _jsx("p", { children: errors.submit }) })), _jsxs("div", { className: "form-actions", children: [_jsx("button", { type: "button", className: "btn-secondary", onClick: onCancel, disabled: submitting, children: "Cancelar" }), _jsx("button", { type: "submit", className: "btn-primary", disabled: submitting, children: submitting ? 'Creando...' : 'Crear Acción Correctiva' })] })] })] }));
};
//# sourceMappingURL=CorrectiveActionForm.js.map