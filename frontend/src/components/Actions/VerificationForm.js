import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Action Verification Form Component
 * Auditor form for approving or rejecting corrective action evidence
 * Only shown when action status is 'resolved'
 */
import { useState } from 'react';
import './VerificationForm.css';
export const VerificationForm = ({ actionId, actionTitle, actionDescription, evidence, onVerify, onCancel, loading = false, }) => {
    const [decision, setDecision] = useState(null);
    const [comments, setComments] = useState('');
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (!decision) {
            setError('Debes seleccionar una decisión (Aprobado o Rechazado)');
            return;
        }
        if (!comments.trim()) {
            setError('Por favor, añade comentarios sobre tu decisión');
            return;
        }
        if (comments.trim().length < 10) {
            setError('Los comentarios deben tener al menos 10 caracteres');
            return;
        }
        try {
            setSubmitting(true);
            await onVerify({
                actionId,
                decision,
                comments: comments.trim(),
            });
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Error al verificar la acción');
        }
        finally {
            setSubmitting(false);
        }
    };
    const formatFileSize = (bytes) => {
        if (bytes === 0)
            return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };
    return (_jsxs("form", { className: "verification-form", onSubmit: handleSubmit, children: [_jsxs("div", { className: "form-header", children: [_jsx("h3", { children: "Verificar Acci\u00F3n Correctiva" }), _jsx("p", { className: "form-subtitle", children: "Revisa la evidencia y aprueba o rechaza la acci\u00F3n" })] }), error && (_jsxs("div", { className: "form-error", children: [_jsx("strong", { children: "Error:" }), " ", error] })), _jsxs("div", { className: "action-summary", children: [_jsxs("div", { className: "summary-item", children: [_jsx("label", { children: "Acci\u00F3n:" }), _jsx("p", { children: actionTitle })] }), _jsxs("div", { className: "summary-item", children: [_jsx("label", { children: "Descripci\u00F3n:" }), _jsx("p", { children: actionDescription })] })] }), _jsxs("div", { className: "evidence-section", children: [_jsx("h4", { children: "Evidencia Adjunta" }), evidence.length === 0 ? (_jsx("div", { className: "no-evidence", children: _jsx("p", { children: "No hay evidencia adjunta" }) })) : (_jsx("ul", { className: "evidence-list", children: evidence.map(file => (_jsxs("li", { className: "evidence-item", children: [_jsx("span", { className: "evidence-icon", children: "\uD83D\uDCCE" }), _jsx("span", { className: "evidence-name", children: file.filename }), _jsxs("span", { className: "evidence-size", children: ["(", formatFileSize(file.fileSize), ")"] })] }, file.id))) }))] }), _jsxs("div", { className: "decision-section", children: [_jsx("label", { className: "decision-label", children: "Decisi\u00F3n:" }), _jsxs("div", { className: "decision-options", children: [_jsxs("label", { className: "decision-option", children: [_jsx("input", { type: "radio", name: "decision", value: "approved", checked: decision === 'approved', onChange: e => setDecision(e.target.value), disabled: loading || submitting }), _jsxs("span", { className: "option-label approved", children: [_jsx("span", { className: "option-icon", children: "\u2713" }), "Aprobado"] }), _jsx("span", { className: "option-description", children: "La evidencia es suficiente y la acci\u00F3n est\u00E1 completada correctamente" })] }), _jsxs("label", { className: "decision-option", children: [_jsx("input", { type: "radio", name: "decision", value: "rejected", checked: decision === 'rejected', onChange: e => setDecision(e.target.value), disabled: loading || submitting }), _jsxs("span", { className: "option-label rejected", children: [_jsx("span", { className: "option-icon", children: "\u2715" }), "Rechazado"] }), _jsx("span", { className: "option-description", children: "La evidencia es insuficiente o la acci\u00F3n requiere m\u00E1s trabajo" })] })] })] }), _jsxs("div", { className: "comments-section", children: [_jsx("label", { htmlFor: "comments", className: "comments-label", children: "Comentarios y Retroalimentaci\u00F3n *" }), _jsx("textarea", { id: "comments", className: "comments-textarea", value: comments, onChange: e => setComments(e.target.value), placeholder: "Proporciona detalles sobre tu decisi\u00F3n. Si rechazas, describe qu\u00E9 evidencia adicional se necesita...", rows: 4, disabled: loading || submitting }), _jsxs("p", { className: "comments-hint", children: [comments.length, "/200 caracteres m\u00EDnimo: 10"] })] }), _jsxs("div", { className: "form-actions", children: [_jsx("button", { type: "submit", className: "btn-submit", disabled: loading || submitting || !decision, children: submitting ? 'Guardando...' : 'Enviar Verificación' }), _jsx("button", { type: "button", className: "btn-cancel", onClick: onCancel, disabled: loading || submitting, children: "Cancelar" })] }), _jsx("p", { className: "form-help", children: "* Campos obligatorios. Esta informaci\u00F3n se registrar\u00E1 en el historial de auditor\u00EDa." })] }));
};
export default VerificationForm;
//# sourceMappingURL=VerificationForm.js.map