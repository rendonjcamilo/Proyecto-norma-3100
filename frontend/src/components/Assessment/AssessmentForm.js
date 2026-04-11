import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
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
import { useState, useEffect, useCallback } from 'react';
import './AssessmentForm.css';
import CriterionInput from './CriterionInput';
import ProgressBar from './ProgressBar';
import ScoresDisplay from './ScoresDisplay';
const AssessmentForm = ({ assessment, questionnaiireData, onSave, onSubmit, readOnly = false, }) => {
    const [responses, setResponses] = useState(new Map());
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [saveMessage, setSaveMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [expandedStandards, setExpandedStandards] = useState(new Set(questionnaiireData.standards.map((s) => s.id).slice(0, 1)));
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
        if (!onSave || responses.size === 0 || readOnly)
            return;
        setIsSaving(true);
        try {
            const responsesArray = Array.from(responses.values());
            await onSave(responsesArray);
            setLastSaved(new Date());
            setSaveMessage('✓ Guardado correctamente');
            setTimeout(() => setSaveMessage(''), 3000);
        }
        catch (error) {
            setSaveMessage('✗ Error al guardar');
            console.error('Save error:', error);
        }
        finally {
            setIsSaving(false);
        }
    }, [responses, onSave, readOnly]);
    const handleResponseChange = (criterionId, response) => {
        const newResponses = new Map(responses);
        newResponses.set(criterionId, response);
        setResponses(newResponses);
    };
    const handleSubmit = async () => {
        if (!onSubmit)
            return;
        // Validate all criteria are answered (except NA)
        const allStandardCriteria = questionnaiireData.standards.flatMap((s) => s.criteria);
        const unansweredCriteria = allStandardCriteria.filter((c) => !responses.has(c.id));
        if (unansweredCriteria.length > 0) {
            alert(`Por favor responda todos los criterios. Criterios sin responder: ${unansweredCriteria.length}`);
            return;
        }
        if (window.confirm('¿Está seguro de que desea enviar la evaluación? No podrá hacer cambios después.')) {
            setIsSubmitting(true);
            try {
                await onSubmit();
            }
            catch (error) {
                alert('Error al enviar la evaluación');
                console.error('Submit error:', error);
            }
            finally {
                setIsSubmitting(false);
            }
        }
    };
    const toggleStandard = (standardId) => {
        const newExpanded = new Set(expandedStandards);
        if (newExpanded.has(standardId)) {
            newExpanded.delete(standardId);
        }
        else {
            newExpanded.add(standardId);
        }
        setExpandedStandards(newExpanded);
    };
    const totalCriteria = questionnaiireData.standards.reduce((acc, s) => acc + s.criteria.length, 0);
    const answeredCriteria = responses.size;
    const completionPercent = totalCriteria > 0 ? (answeredCriteria / totalCriteria) * 100 : 0;
    // Group standards (transversales first, then service-specific)
    const transversales = questionnaiireData.standards.filter((s) => s.isTransversal);
    const serviceSpecific = questionnaiireData.standards.filter((s) => !s.isTransversal);
    return (_jsxs("div", { className: "assessment-form", children: [_jsxs("div", { className: "form-header", children: [_jsxs("h1", { children: ["Evaluaci\u00F3n de Cumplimiento - ", assessment.assessmentVersion] }), _jsxs("p", { children: ["Servicio: ", assessment.serviceId] }), _jsxs("div", { className: "form-stats", children: [_jsx(ProgressBar, { completed: answeredCriteria, total: totalCriteria }), _jsx(ScoresDisplay, { compliance: assessment.compliancePercent, semaforo: assessment.semaforo })] }), lastSaved && !readOnly && (_jsx("div", { className: "save-status", children: _jsxs("span", { className: "save-indicator", children: ["Auto-guardado a las ", lastSaved.toLocaleTimeString('es-CO')] }) }))] }), !readOnly && (_jsxs("div", { className: "form-actions-top", children: [_jsx("button", { onClick: handleSave, disabled: isSaving || responses.size === 0, className: "btn btn-save", children: isSaving ? 'Guardando...' : '💾 Guardar' }), saveMessage && _jsx("span", { className: `save-message ${saveMessage.includes('✓') ? 'success' : 'error'}`, children: saveMessage })] })), _jsxs("div", { className: "assessment-body", children: [transversales.length > 0 && (_jsxs("section", { className: "standards-section transversales-section", children: [_jsx("h2", { children: "Est\u00E1ndares Transversales (Aplicables a todos los servicios)" }), transversales.map((standard) => (_jsx(StandardGroup, { standard: standard, isExpanded: expandedStandards.has(standard.id), onToggle: () => toggleStandard(standard.id), responses: responses, onResponseChange: handleResponseChange, readOnly: readOnly }, standard.id)))] })), serviceSpecific.length > 0 && (_jsxs("section", { className: "standards-section service-specific-section", children: [_jsx("h2", { children: "Est\u00E1ndares Espec\u00EDficos del Servicio" }), serviceSpecific.map((standard) => (_jsx(StandardGroup, { standard: standard, isExpanded: expandedStandards.has(standard.id), onToggle: () => toggleStandard(standard.id), responses: responses, onResponseChange: handleResponseChange, readOnly: readOnly }, standard.id)))] }))] }), !readOnly && (_jsxs("div", { className: "form-actions", children: [_jsx("button", { onClick: handleSave, disabled: isSaving || responses.size === 0, className: "btn btn-save", children: isSaving ? 'Guardando...' : '💾 Guardar' }), _jsx("button", { onClick: handleSubmit, disabled: isSubmitting || answeredCriteria < totalCriteria, className: "btn btn-submit", title: answeredCriteria < totalCriteria
                            ? `Por favor responda todos los criterios (${answeredCriteria}/${totalCriteria})`
                            : 'Enviar evaluación', children: isSubmitting ? 'Enviando...' : '✅ Enviar Evaluación' })] }))] }));
};
const StandardGroup = ({ standard, isExpanded, onToggle, responses, onResponseChange, readOnly, }) => {
    const answeredInGroup = standard.criteria.filter((c) => responses.has(c.id)).length;
    const completionPercent = standard.criteria.length > 0 ? (answeredInGroup / standard.criteria.length) * 100 : 0;
    return (_jsxs("div", { className: `standard-group ${standard.isTransversal ? 'transversal' : 'service-specific'}`, children: [_jsxs("div", { className: "standard-header", onClick: onToggle, children: [_jsxs("div", { className: "standard-title-section", children: [_jsx("span", { className: "expand-icon", children: isExpanded ? '▼' : '▶' }), _jsxs("div", { className: "standard-info", children: [_jsx("h3", { className: "standard-code", children: standard.code }), _jsx("h4", { className: "standard-name", children: standard.name })] })] }), _jsxs("div", { className: "standard-progress", children: [_jsxs("span", { className: "progress-text", children: [answeredInGroup, "/", standard.criteria.length] }), _jsx("div", { className: "progress-bar-mini", children: _jsx("div", { className: "progress-bar-fill", style: { width: `${completionPercent}%` } }) })] })] }), isExpanded && (_jsx("div", { className: "standard-criteria", children: standard.criteria.map((criterion, index) => (_jsx(CriterionInput, { criterion: criterion, number: index + 1, response: responses.get(criterion.id), onChange: (response) => onResponseChange(criterion.id, response), readOnly: readOnly }, criterion.id))) }))] }));
};
export default AssessmentForm;
//# sourceMappingURL=AssessmentForm.js.map