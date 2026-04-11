import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Actions List Component
 * Main list with filters, sort, bulk actions
 */
import { useEffect, useState, useCallback } from 'react';
import { useActionStore } from '../../stores/actionStore';
import { ActionDetail } from './ActionDetail';
import './ActionsList.css';
export const ActionsList = ({ providerId, readonly = false, }) => {
    const { actions, selectedAction, filters, loading, error, fetchActions, setSelectedAction, setFilters, clearError, } = useActionStore();
    const [showDetail, setShowDetail] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [sortBy, setSortBy] = useState('deadline');
    const [sortOrder, setSortOrder] = useState('asc');
    // Debounced filter application
    const applyFilters = useCallback(() => {
        const newFilters = {
            providerId,
            sortBy,
            sortOrder,
            limit: 100,
            offset: 0,
        };
        if (statusFilter) {
            newFilters.status = statusFilter;
        }
        if (priorityFilter) {
            newFilters.priority = priorityFilter;
        }
        setFilters(newFilters);
        fetchActions(newFilters);
    }, [providerId, statusFilter, priorityFilter, sortBy, sortOrder, setFilters, fetchActions]);
    useEffect(() => {
        applyFilters();
    }, [applyFilters]);
    const handleRowClick = (actionId) => {
        const action = actions.find((a) => a.id === actionId);
        if (action) {
            setSelectedAction(action);
            setShowDetail(true);
        }
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
    const getPriorityColor = (priority) => {
        const colors = {
            crítica: '#c62828',
            alta: '#f57c00',
            media: '#fbc02d',
            baja: '#388e3c',
        };
        return colors[priority] || '#999';
    };
    const getDaysUntilDeadline = (deadline) => {
        const days = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return days;
    };
    const isOverdue = (deadline) => {
        return getDaysUntilDeadline(deadline) < 0;
    };
    const isDueSoon = (deadline) => {
        const days = getDaysUntilDeadline(deadline);
        return days >= 0 && days <= 7;
    };
    const getRowClass = (action) => {
        if (isOverdue(action.due_date))
            return 'overdue';
        if (isDueSoon(action.due_date))
            return 'due-soon';
        return '';
    };
    return (_jsxs("div", { className: "actions-list-container", children: [error && (_jsxs("div", { className: "alert alert-error", children: [error, _jsx("button", { onClick: clearError, children: "\u2715" })] })), _jsxs("div", { className: "filters-bar", children: [_jsxs("div", { className: "filter-group", children: [_jsx("label", { htmlFor: "status", children: "Estado:" }), _jsxs("select", { id: "status", value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), children: [_jsx("option", { value: "", children: "-- Todos --" }), _jsx("option", { value: "abierta", children: "Abierta" }), _jsx("option", { value: "en_progreso", children: "En Progreso" }), _jsx("option", { value: "cerrada", children: "Cerrada" })] })] }), _jsxs("div", { className: "filter-group", children: [_jsx("label", { htmlFor: "priority", children: "Prioridad:" }), _jsxs("select", { id: "priority", value: priorityFilter, onChange: (e) => setPriorityFilter(e.target.value), children: [_jsx("option", { value: "", children: "-- Todas --" }), _jsx("option", { value: "cr\u00EDtica", children: "Cr\u00EDtica" }), _jsx("option", { value: "alta", children: "Alta" }), _jsx("option", { value: "media", children: "Media" }), _jsx("option", { value: "baja", children: "Baja" })] })] }), _jsxs("div", { className: "filter-group", children: [_jsx("label", { htmlFor: "sort", children: "Ordenar por:" }), _jsxs("select", { id: "sort", value: sortBy, onChange: (e) => setSortBy(e.target.value), children: [_jsx("option", { value: "deadline", children: "Plazo" }), _jsx("option", { value: "priority", children: "Prioridad" }), _jsx("option", { value: "progress", children: "Progreso" })] })] }), _jsxs("div", { className: "filter-group", children: [_jsx("label", { htmlFor: "order", children: "Orden:" }), _jsxs("select", { id: "order", value: sortOrder, onChange: (e) => setSortOrder(e.target.value), children: [_jsx("option", { value: "asc", children: "Ascendente" }), _jsx("option", { value: "desc", children: "Descendente" })] })] })] }), _jsx("div", { className: "table-wrapper", children: loading && !actions.length ? (_jsx("div", { className: "loading-state", children: "Cargando acciones..." })) : actions.length === 0 ? (_jsx("div", { className: "empty-state", children: _jsx("p", { children: "No hay acciones que coincidan con los filtros" }) })) : (_jsxs("table", { className: "actions-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Acci\u00F3n #" }), _jsx("th", { children: "T\u00EDtulo" }), _jsx("th", { children: "Hallazgo" }), _jsx("th", { children: "Prioridad" }), _jsx("th", { children: "Estado" }), _jsx("th", { children: "Plazo" }), _jsx("th", { children: "Progreso" }), _jsx("th", { children: "Acciones" })] }) }), _jsx("tbody", { children: actions.map((action) => (_jsxs("tr", { className: `action-row ${getRowClass(action)}`, onClick: () => !readonly && handleRowClick(action.id), children: [_jsx("td", { className: "action-number", children: action.action_number }), _jsx("td", { className: "action-title", children: action.title }), _jsxs("td", { className: "action-finding", children: [action.finding_id.substring(0, 10), "..."] }), _jsx("td", { className: "action-priority", children: _jsx("span", { className: "badge", style: { backgroundColor: getPriorityColor(action.priority) }, children: action.priority }) }), _jsx("td", { className: "action-status", children: _jsx("span", { className: "badge", style: { backgroundColor: getStatusColor(action.status) }, children: getStatusLabel(action.status) }) }), _jsx("td", { className: "action-deadline", children: _jsxs("span", { className: isOverdue(action.due_date) ? 'overdue-text' : '', children: [new Date(action.due_date).toLocaleDateString('es-CO'), isDueSoon(action.due_date) && (_jsxs("span", { className: "days-info", children: [' ', "(", getDaysUntilDeadline(action.due_date), " d\u00EDas)"] }))] }) }), _jsxs("td", { className: "action-progress", children: [_jsx("div", { className: "progress-mini", children: _jsx("div", { className: "progress-fill", style: { width: `${action.completion_percentage}%` } }) }), _jsxs("span", { className: "progress-text", children: [action.completion_percentage, "%"] })] }), _jsx("td", { className: "action-cell-actions", children: !readonly && (_jsx("button", { className: "btn btn-link", onClick: (e) => {
                                                e.stopPropagation();
                                                handleRowClick(action.id);
                                            }, children: "Ver" })) })] }, action.id))) })] })) }), showDetail && selectedAction && (_jsx("div", { className: "detail-modal-overlay", children: _jsx("div", { className: "detail-modal-content", children: _jsx(ActionDetail, { actionId: selectedAction.id, onClose: () => setShowDetail(false), readonly: readonly }) }) }))] }));
};
//# sourceMappingURL=ActionsList.js.map