import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
/**
 * CriterionInput Component
 * Renders a single criterion with:
 * - Radio buttons: Cumple / No Cumple / No Aplica
 * - For NC: required hallazgo description field
 * - Optional comment field
 * - Optional evidence upload
 */
import { useState } from 'react';
import './CriterionInput.css';
const CriterionInput = ({ criterion, number, response, onChange, readOnly = false, }) => {
    const [localResponse, setLocalResponse] = useState(response || { criterionId: criterion.id, status: 'C' });
    const handleStatusChange = (status) => {
        const newResponse = { ...localResponse, status };
        // Clear description if not NC
        if (status !== 'NC') {
            newResponse.description = '';
        }
        setLocalResponse(newResponse);
        onChange(newResponse);
    };
    const handleDescriptionChange = (e) => {
        const newResponse = { ...localResponse, description: e.target.value };
        setLocalResponse(newResponse);
        onChange(newResponse);
    };
    const handleCommentChange = (e) => {
        const newResponse = { ...localResponse, comments: e.target.value };
        setLocalResponse(newResponse);
        onChange(newResponse);
    };
    const complexityColor = {
        simple: 'complexity-simple',
        medium: 'complexity-medium',
        complex: 'complexity-complex',
    };
    const isDescriptionValid = localResponse.status !== 'NC' || (localResponse.description && localResponse.description.length >= 10);
    const hasError = localResponse.status === 'NC' && !isDescriptionValid;
    return (_jsxs("div", { className: `criterion-input ${hasError ? 'error' : ''} ${readOnly ? 'read-only' : ''}`, children: [_jsxs("div", { className: "criterion-header", children: [_jsxs("div", { className: "criterion-number", children: [number, "."] }), _jsxs("div", { className: "criterion-details", children: [_jsxs("div", { className: "criterion-code", children: [criterion.code, _jsx("span", { className: `complexity-badge ${complexityColor[criterion.complexity]}`, children: criterion.complexity })] }), _jsx("h5", { className: "criterion-name", children: criterion.name }), _jsx("p", { className: "criterion-description", children: criterion.description }), criterion.evidenceRequirement && (_jsxs("p", { className: "criterion-evidence", children: [_jsx("strong", { children: "Evidencia requerida:" }), " ", criterion.evidenceRequirement] }))] })] }), _jsxs("div", { className: "criterion-response", children: [_jsxs("fieldset", { className: "response-options", disabled: readOnly, children: [_jsx("legend", { children: "Marque su respuesta:" }), _jsxs("label", { className: "radio-option", children: [_jsx("input", { type: "radio", name: `criterion-${criterion.id}`, value: "C", checked: localResponse.status === 'C', onChange: () => handleStatusChange('C'), disabled: readOnly }), _jsx("span", { className: "radio-label cumple", children: "\u2713 Cumple (C)" })] }), _jsxs("label", { className: "radio-option", children: [_jsx("input", { type: "radio", name: `criterion-${criterion.id}`, value: "NC", checked: localResponse.status === 'NC', onChange: () => handleStatusChange('NC'), disabled: readOnly }), _jsx("span", { className: "radio-label no-cumple", children: "\u2717 No Cumple (NC)" })] }), _jsxs("label", { className: "radio-option", children: [_jsx("input", { type: "radio", name: `criterion-${criterion.id}`, value: "NA", checked: localResponse.status === 'NA', onChange: () => handleStatusChange('NA'), disabled: readOnly }), _jsx("span", { className: "radio-label no-aplica", children: "\u25CB No Aplica (NA)" })] })] }), localResponse.status === 'NC' && (_jsxs("div", { className: "hallazgo-field", children: [_jsxs("label", { htmlFor: `hallazgo-${criterion.id}`, children: [_jsx("strong", { children: "* Descripci\u00F3n del incumplimiento (requerida):" }), _jsxs("span", { className: "char-count", children: [localResponse.description?.length || 0, "/500"] })] }), _jsx("textarea", { id: `hallazgo-${criterion.id}`, value: localResponse.description || '', onChange: handleDescriptionChange, placeholder: "Describe el incumplimiento observado. M\u00EDnimo 10 caracteres.", maxLength: 500, rows: 3, disabled: readOnly, className: `hallazgo-input ${isDescriptionValid ? '' : 'invalid'}` }), !isDescriptionValid && (_jsx("span", { className: "error-message", children: !localResponse.description
                                    ? 'Campo requerido para respuestas NC'
                                    : 'Mínimo 10 caracteres requeridos' }))] })), _jsxs("div", { className: "comment-field", children: [_jsxs("label", { htmlFor: `comment-${criterion.id}`, children: ["Comentario adicional (opcional):", _jsxs("span", { className: "char-count", children: [localResponse.comments?.length || 0, "/500"] })] }), _jsx("textarea", { id: `comment-${criterion.id}`, value: localResponse.comments || '', onChange: handleCommentChange, placeholder: "Agregue cualquier comentario adicional relevante...", maxLength: 500, rows: 2, disabled: readOnly, className: "comment-input" })] }), _jsxs("div", { className: "evidence-field", children: [_jsx("label", { children: "Evidencia (opcional):" }), _jsx("p", { className: "evidence-note", children: "Soporte para subir evidencia disponible en versi\u00F3n mejorada" })] })] })] }));
};
export default CriterionInput;
//# sourceMappingURL=CriterionInput.js.map