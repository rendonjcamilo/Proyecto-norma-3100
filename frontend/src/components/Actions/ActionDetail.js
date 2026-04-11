import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Action Detail Component
 * Full detail view with timeline, follow-ups, edit capabilities
 */
import { useEffect, useState } from 'react';
import { useActionStore } from '../../stores/actionStore';
import { FollowUpStep } from './FollowUpStep';
import { ProgressUpdateForm } from './ProgressUpdateForm';
import './ActionDetail.css';
export const ActionDetail = ({ actionId, onClose, readonly = false, }) => {
    const { actionDetail, fetchActionDetail, updateActionProgress, loading, error } = useActionStore();
    const [showUpdateForm, setShowUpdateForm] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editData, setEditData] = useState(null);
    useEffect(() => {
        fetchActionDetail(actionId);
    }, [actionId, fetchActionDetail]);
    if (loading) {
        return _jsx("div", { className: "action-detail loading", children: "Cargando..." });
    }
    if (!actionDetail) {
        return (_jsxs("div", { className: "action-detail error", children: [_jsx("p", { children: "No se encontr\u00F3 la acci\u00F3n" }), onClose && _jsx("button", { onClick: onClose, children: "Cerrar" })] }));
    }
    const getPriorityColor = (priority) => {
        const colors = {
            crítica: '#c62828',
            alta: '#f57c00',
            media: '#fbc02d',
            baja: '#388e3c',
        };
        return colors[priority] || '#999';
    };
    const getStatusColor = (status) => {
        const colors = {
            abierta: '#d32f2f',
            en_progreso: '#f57c00',
            cerrada: '#388e3c',
        };
        return colors[status] || '#999';
    };
    const getStatusLabel = (status) => {
        const labels = {
            abierta: 'Abierta',
            en_progreso: 'En Progreso',
            cerrada: 'Cerrada',
        };
        return labels[status] || status;
    };
    const daysUntilDeadline = Math.ceil((new Date(actionDetail.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    const isOverdue = daysUntilDeadline < 0;
    const isDueSoon = daysUntilDeadline >= 0 && daysUntilDeadline <= 7;
    const handleProgressUpdate = async (data) => {
        try {
            await updateActionProgress(actionId, data.followupId, {
                status: data.status,
                completion_percentage: data.completionPercentage,
                evidence_attachment: data.evidence,
                comments: data.comment,
            });
            setShowUpdateForm(false);
        }
        catch (err) {
            console.error('Error updating progress:', err);
        }
    };
    return (_jsxs("div", { className: "action-detail", children: [onClose && (_jsx("button", { className: "close-btn", onClick: onClose, children: "\u2715" })), _jsxs("div", { className: "detail-header", children: [_jsxs("div", { className: "header-top", children: [_jsxs("div", { children: [_jsx("h2", { children: actionDetail.title }), _jsxs("p", { className: "action-number", children: ["#", actionDetail.action_number] })] }), _jsxs("div", { className: "header-badges", children: [_jsx("span", { className: "badge priority-badge", style: { backgroundColor: getPriorityColor(actionDetail.priority) }, children: actionDetail.priority.toUpperCase() }), _jsx("span", { className: "badge status-badge", style: { backgroundColor: getStatusColor(actionDetail.status) }, children: getStatusLabel(actionDetail.status) })] })] }), _jsxs("div", { className: "deadline-info", className: isOverdue ? 'overdue' : isDueSoon ? 'due-soon' : '', children: [_jsx("span", { className: "deadline-label", children: "Plazo:" }), _jsx("span", { className: "deadline-date", children: new Date(actionDetail.due_date).toLocaleDateString('es-CO') }), isOverdue && (_jsxs("span", { className: "deadline-status overdue", children: [Math.abs(daysUntilDeadline), " d\u00EDas vencido"] })), isDueSoon && !isOverdue && (_jsxs("span", { className: "deadline-status due-soon", children: [daysUntilDeadline, " d\u00EDas restantes"] }))] })] }), _jsxs("div", { className: "detail-content", children: [_jsxs("section", { className: "section", children: [_jsx("h3", { children: "Informaci\u00F3n de la Acci\u00F3n" }), _jsxs("div", { className: "metadata-grid", children: [_jsxs("div", { className: "metadata-item", children: [_jsx("span", { className: "label", children: "Hallazgo:" }), _jsx("span", { className: "value", children: actionDetail.finding_id })] }), actionDetail.assigned_to && (_jsxs("div", { className: "metadata-item", children: [_jsx("span", { className: "label", children: "Responsable:" }), _jsx("span", { className: "value", children: actionDetail.assigned_to })] })), _jsxs("div", { className: "metadata-item", children: [_jsx("span", { className: "label", children: "Descripci\u00F3n:" }), _jsx("span", { className: "value", children: actionDetail.description })] })] })] }), _jsxs("section", { className: "section", children: [_jsxs("div", { className: "section-header", children: [_jsx("h3", { children: "Progreso General" }), _jsxs("span", { className: "completion-percent", children: [actionDetail.completion_percentage, "%"] })] }), _jsx("div", { className: "progress-bar-container", children: _jsx("div", { className: "progress-bar", children: _jsx("div", { className: "progress-fill", style: { width: `${actionDetail.completion_percentage}%` } }) }) })] }), _jsxs("section", { className: "section", children: [_jsxs("div", { className: "section-header", children: [_jsxs("h3", { children: ["Pasos de Seguimiento (", actionDetail.followups.length, ")"] }), !readonly && (_jsx("button", { className: "btn btn-small", onClick: () => setShowUpdateForm(true), children: "+ Actualizar Progreso" }))] }), _jsx("div", { className: "followups-list", children: actionDetail.followups && actionDetail.followups.length > 0 ? (actionDetail.followups.map((followup) => (_jsx(FollowUpStep, { followup: followup, readonly: readonly, onUpdateStatus: (followupId, newStatus) => {
                                        updateActionProgress(actionId, followupId, {
                                            status: newStatus,
                                        });
                                    }, onAddComment: (followupId, comment) => {
                                        updateActionProgress(actionId, followupId, {
                                            comments: comment,
                                        });
                                    }, onAddEvidence: (followupId, evidence) => {
                                        updateActionProgress(actionId, followupId, {
                                            evidence_attachment: evidence,
                                        });
                                    } }, followup.id)))) : (_jsx("p", { className: "empty-message", children: "No hay pasos de seguimiento definidos" })) })] }), _jsxs("section", { className: "section", children: [_jsx("h3", { children: "Historial de Cambios" }), _jsxs("div", { className: "history-item", children: [_jsx("span", { className: "history-date", children: new Date(actionDetail.created_date).toLocaleDateString('es-CO') }), _jsxs("span", { className: "history-action", children: ["Creada por ", actionDetail.created_by] })] })] }), !readonly && (_jsxs("div", { className: "detail-actions", children: [_jsx("button", { className: "btn btn-secondary", onClick: onClose, children: "Cerrar" }), _jsx("button", { className: "btn btn-primary", onClick: () => setEditMode(!editMode), children: editMode ? 'Cancelar Edición' : 'Editar' })] }))] }), showUpdateForm && actionDetail.followups && (_jsx(ProgressUpdateForm, { actionId: actionId, followups: actionDetail.followups, onSubmit: handleProgressUpdate, onCancel: () => setShowUpdateForm(false), loading: loading }))] }));
};
//# sourceMappingURL=ActionDetail.js.map