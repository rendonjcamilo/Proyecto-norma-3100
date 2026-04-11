import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
/**
 * Follow-Up Step Component
 * Individual step card showing progress, evidence, and comments
 */
import { useState } from 'react';
import './FollowUpStep.css';
export const FollowUpStep = ({ followup, onUpdateStatus, onAddEvidence, onAddComment, readonly = false, }) => {
    const [showForm, setShowForm] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [newEvidence, setNewEvidence] = useState('');
    const getStatusColor = (status) => {
        switch (status) {
            case 'completado':
                return 'success';
            case 'en_progreso':
                return 'warning';
            case 'pendiente':
            default:
                return 'pending';
        }
    };
    const getStatusLabel = (status) => {
        const labels = {
            pendiente: 'Pendiente',
            en_progreso: 'En Progreso',
            completado: 'Completado',
        };
        return labels[status] || status;
    };
    const handleAddComment = () => {
        if (newComment.trim() && onAddComment) {
            onAddComment(followup.id, newComment);
            setNewComment('');
        }
    };
    const handleStatusChange = (newStatus) => {
        if (onUpdateStatus) {
            onUpdateStatus(followup.id, newStatus);
        }
    };
    const daysUntilDue = followup.due_date
        ? Math.ceil((new Date(followup.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null;
    const isDue = daysUntilDue !== null && daysUntilDue <= 0;
    const isDueSoon = daysUntilDue !== null && daysUntilDue <= 7 && daysUntilDue > 0;
    return (_jsxs("div", { className: `followup-step status-${getStatusColor(followup.status)}`, children: [_jsxs("div", { className: "step-header", children: [_jsxs("div", { className: "step-title", children: [_jsxs("span", { className: "step-number", children: ["Paso ", followup.step_number] }), _jsx("h4", { children: followup.step_name })] }), _jsxs("div", { className: "step-actions", children: [!readonly && (_jsxs("select", { className: "status-select", value: followup.status, onChange: (e) => handleStatusChange(e.target.value), children: [_jsx("option", { value: "pendiente", children: "Pendiente" }), _jsx("option", { value: "en_progreso", children: "En Progreso" }), _jsx("option", { value: "completado", children: "Completado" })] })), readonly && (_jsx("span", { className: `status-badge status-${getStatusColor(followup.status)}`, children: getStatusLabel(followup.status) }))] })] }), followup.description && (_jsx("p", { className: "step-description", children: followup.description })), _jsx("div", { className: "step-meta", children: followup.due_date && (_jsxs("div", { className: `meta-item ${isDue ? 'overdue' : isDueSoon ? 'due-soon' : ''}`, children: [_jsx("span", { className: "meta-label", children: "Plazo:" }), _jsxs("span", { className: "meta-value", children: [new Date(followup.due_date).toLocaleDateString('es-CO'), daysUntilDue !== null && (_jsx("span", { className: "days-info", children: daysUntilDue === 0
                                        ? ' (Hoy)'
                                        : daysUntilDue > 0
                                            ? ` (${daysUntilDue} días)`
                                            : ` (${Math.abs(daysUntilDue)} días vencido)` }))] })] })) }), _jsxs("div", { className: "progress-section", children: [_jsxs("div", { className: "progress-label", children: [_jsx("span", { children: "Progreso:" }), _jsxs("span", { className: "progress-percent", children: [followup.completion_percentage, "%"] })] }), _jsx("div", { className: "progress-bar", children: _jsx("div", { className: "progress-fill", style: { width: `${followup.completion_percentage}%` } }) })] }), followup.evidence_attachment && (_jsxs("div", { className: "evidence-section", children: [_jsx("div", { className: "evidence-label", children: "Evidencia/Prueba:" }), _jsx("a", { href: followup.evidence_attachment, target: "_blank", rel: "noopener noreferrer", className: "evidence-link", children: "\uD83D\uDCCE Ver evidencia" })] })), followup.comments && (_jsxs("div", { className: "comments-section", children: [_jsx("div", { className: "comments-label", children: "Comentarios:" }), _jsx("p", { className: "comments-text", children: followup.comments })] })), !readonly && (_jsxs("div", { className: "form-section", children: [_jsx("button", { className: "toggle-form-btn", onClick: () => setShowForm(!showForm), children: showForm ? '✕ Cerrar' : '+ Agregar Comentario/Evidencia' }), showForm && (_jsxs("div", { className: "step-form", children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { children: "Agregar Comentario:" }), _jsx("textarea", { value: newComment, onChange: (e) => setNewComment(e.target.value), placeholder: "Describe el progreso realizado...", rows: 2 })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "URL de Evidencia:" }), _jsx("input", { type: "text", value: newEvidence, onChange: (e) => setNewEvidence(e.target.value), placeholder: "https://ejemplo.com/evidencia.pdf" })] }), _jsxs("div", { className: "form-actions", children: [_jsx("button", { className: "btn btn-secondary", onClick: () => setShowForm(false), children: "Cancelar" }), _jsx("button", { className: "btn btn-primary", onClick: handleAddComment, children: "Guardar" })] })] }))] }))] }));
};
//# sourceMappingURL=FollowUpStep.js.map