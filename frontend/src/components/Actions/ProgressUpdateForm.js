import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Progress Update Form Component
 * Modal/drawer for updating action progress with evidence and comments
 */
import { useState } from 'react';
import './ProgressUpdateForm.css';
export const ProgressUpdateForm = ({ actionId, followups, onSubmit, onCancel, loading = false, }) => {
    const [selectedFollowupId, setSelectedFollowupId] = useState(followups.length > 0 ? followups[0].id : '');
    const [status, setStatus] = useState('en_progreso');
    const [completionPercentage, setCompletionPercentage] = useState(50);
    const [evidence, setEvidence] = useState('');
    const [comment, setComment] = useState('');
    const [estimatedRemainingDays, setEstimatedRemainingDays] = useState('');
    const [error, setError] = useState('');
    const selectedFollowup = followups.find((f) => f.id === selectedFollowupId);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!selectedFollowupId) {
            setError('Selecciona un paso de seguimiento');
            return;
        }
        if (completionPercentage < 0 || completionPercentage > 100) {
            setError('El progreso debe estar entre 0 y 100%');
            return;
        }
        try {
            const data = {
                followupId: selectedFollowupId,
                status,
                completionPercentage,
                evidence: evidence.trim() || undefined,
                comment: comment.trim() || undefined,
                estimatedRemainingDays: estimatedRemainingDays
                    ? parseInt(estimatedRemainingDays, 10)
                    : undefined,
            };
            await onSubmit(data);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Error al guardar';
            setError(message);
        }
    };
    return (_jsx("div", { className: "progress-update-overlay", children: _jsxs("div", { className: "progress-update-modal", children: [_jsxs("div", { className: "modal-header", children: [_jsx("h3", { children: "Actualizar Progreso" }), _jsx("button", { className: "close-btn", onClick: onCancel, disabled: loading, children: "\u2715" })] }), _jsxs("form", { onSubmit: handleSubmit, className: "progress-form", children: [error && _jsx("div", { className: "form-error", children: error }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "followup", children: "Paso de Seguimiento:" }), _jsxs("select", { id: "followup", value: selectedFollowupId, onChange: (e) => setSelectedFollowupId(e.target.value), required: true, disabled: loading, children: [_jsx("option", { value: "", children: "-- Selecciona un paso --" }), followups.map((f) => (_jsxs("option", { value: f.id, children: ["Paso ", f.step_number, ": ", f.step_name, " (", f.status, ")"] }, f.id)))] })] }), selectedFollowup && (_jsxs("div", { className: "followup-info", children: [_jsxs("p", { children: [_jsx("strong", { children: "Plazo:" }), ' ', selectedFollowup.due_date
                                            ? new Date(selectedFollowup.due_date).toLocaleDateString('es-CO')
                                            : 'No definido'] }), _jsxs("p", { children: [_jsx("strong", { children: "Progreso actual:" }), " ", selectedFollowup.completion_percentage, "%"] })] })), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "status", children: "Estado:" }), _jsxs("select", { id: "status", value: status, onChange: (e) => setStatus(e.target.value), disabled: loading, children: [_jsx("option", { value: "pendiente", children: "Pendiente" }), _jsx("option", { value: "en_progreso", children: "En Progreso" }), _jsx("option", { value: "completado", children: "Completado" })] })] }), _jsxs("div", { className: "form-group", children: [_jsxs("label", { htmlFor: "completion", children: ["Progreso: ", _jsxs("span", { className: "percentage-display", children: [completionPercentage, "%"] })] }), _jsx("input", { id: "completion", type: "range", min: "0", max: "100", step: "5", value: completionPercentage, onChange: (e) => setCompletionPercentage(parseInt(e.target.value, 10)), disabled: loading, className: "range-input" }), _jsxs("div", { className: "range-labels", children: [_jsx("span", { children: "0%" }), _jsx("span", { children: "50%" }), _jsx("span", { children: "100%" })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "evidence", children: "Prueba/Evidencia (URL):" }), _jsx("input", { id: "evidence", type: "url", placeholder: "https://ejemplo.com/evidencia.pdf", value: evidence, onChange: (e) => setEvidence(e.target.value), disabled: loading }), _jsx("small", { children: "Proporciona un enlace a la documentaci\u00F3n o evidencia" })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "comment", children: "Comentario/Descripci\u00F3n:" }), _jsx("textarea", { id: "comment", placeholder: "Describe qu\u00E9 se ha completado y qu\u00E9 est\u00E1 pendiente...", value: comment, onChange: (e) => setComment(e.target.value), rows: 3, disabled: loading })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "remaining", children: "D\u00EDas estimados restantes:" }), _jsx("input", { id: "remaining", type: "number", min: "0", placeholder: "Ej: 5", value: estimatedRemainingDays, onChange: (e) => setEstimatedRemainingDays(e.target.value), disabled: loading }), _jsx("small", { children: "Estimaci\u00F3n para completar este paso" })] }), _jsxs("div", { className: "form-actions", children: [_jsx("button", { type: "button", className: "btn btn-secondary", onClick: onCancel, disabled: loading, children: "Cancelar" }), _jsx("button", { type: "submit", className: "btn btn-primary", disabled: loading, children: loading ? 'Guardando...' : 'Guardar Progreso' })] })] })] }) }));
};
//# sourceMappingURL=ProgressUpdateForm.js.map