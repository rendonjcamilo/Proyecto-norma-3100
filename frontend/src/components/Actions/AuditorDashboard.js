import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Auditor Dashboard Component
 * Read-only overview of all providers' actions with distribution, overdue count, and approval
 */
import { useEffect, useState } from 'react';
import { useActionStore } from '../../stores/actionStore';
import { ActionsList } from './ActionsList';
import './AuditorDashboard.css';
export const AuditorDashboard = ({ onApprove, onReject, }) => {
    const { stats, fetchStats, fetchActions } = useActionStore();
    const [showRejectForm, setShowRejectForm] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    useEffect(() => {
        fetchStats();
        fetchActions({ limit: 1000, offset: 0 });
    }, [fetchStats, fetchActions]);
    const handleApprove = async (actionId) => {
        if (onApprove) {
            try {
                await onApprove(actionId);
                alert('Acción aprobada');
            }
            catch (err) {
                console.error('Error approving action:', err);
            }
        }
    };
    const handleReject = async (actionId) => {
        if (onReject && rejectReason.trim()) {
            try {
                await onReject(actionId, rejectReason);
                setShowRejectForm(null);
                setRejectReason('');
                alert('Acción rechazada');
            }
            catch (err) {
                console.error('Error rejecting action:', err);
            }
        }
    };
    if (!stats) {
        return _jsx("div", { className: "auditor-dashboard loading", children: "Cargando..." });
    }
    const getStatusDistribution = () => {
        const total = stats.total_actions;
        return {
            abierta: {
                count: stats.open_actions,
                percent: total > 0 ? Math.round((stats.open_actions / total) * 100) : 0,
                label: 'Abierta',
                color: '#d32f2f',
            },
            en_progreso: {
                count: stats.in_progress,
                percent: total > 0 ? Math.round((stats.in_progress / total) * 100) : 0,
                label: 'En Progreso',
                color: '#f57c00',
            },
            cerrada: {
                count: stats.closed_actions,
                percent: total > 0 ? Math.round((stats.closed_actions / total) * 100) : 0,
                label: 'Cerrada',
                color: '#388e3c',
            },
        };
    };
    const distribution = getStatusDistribution();
    const overduePercent = stats.total_actions > 0
        ? Math.round((stats.overdue_actions / stats.total_actions) * 100)
        : 0;
    return (_jsxs("div", { className: "auditor-dashboard", children: [_jsx("h1", { children: "Panel de Control del Auditor" }), _jsxs("div", { className: "dashboard-section", children: [_jsx("h2", { children: "Resumen de Acciones" }), _jsxs("div", { className: "stats-grid", children: [_jsxs("div", { className: "stat-card", children: [_jsx("div", { className: "stat-value", children: stats.total_actions }), _jsx("div", { className: "stat-label", children: "Total de Acciones" })] }), _jsxs("div", { className: "stat-card alert-card", children: [_jsx("div", { className: "stat-value", style: { color: '#c62828' }, children: stats.overdue_actions }), _jsxs("div", { className: "stat-label", children: ["Vencidas (", overduePercent, "%)"] })] }), _jsxs("div", { className: "stat-card", children: [_jsxs("div", { className: "stat-value", children: [Math.round(stats.avg_completion), "%"] }), _jsx("div", { className: "stat-label", children: "Progreso Promedio" })] })] })] }), _jsxs("div", { className: "dashboard-section", children: [_jsx("h2", { children: "Distribuci\u00F3n de Estado" }), _jsxs("div", { className: "distribution-container", children: [_jsx("div", { className: "pie-chart", children: _jsxs("svg", { viewBox: "0 0 100 100", children: [_jsx("circle", { cx: "50", cy: "50", r: "45", fill: "none", stroke: distribution.abierta.color, strokeWidth: "20", strokeDasharray: `${distribution.abierta.percent * 2.83} ${283.6 - distribution.abierta.percent * 2.83}`, strokeDashoffset: "0", transform: "rotate(-90 50 50)" }), _jsx("circle", { cx: "50", cy: "50", r: "45", fill: "none", stroke: distribution.en_progreso.color, strokeWidth: "20", strokeDasharray: `${distribution.en_progreso.percent * 2.83} ${283.6 - distribution.en_progreso.percent * 2.83}`, strokeDashoffset: `-${distribution.abierta.percent * 2.83}`, transform: "rotate(-90 50 50)" }), _jsx("circle", { cx: "50", cy: "50", r: "45", fill: "none", stroke: distribution.cerrada.color, strokeWidth: "20", strokeDasharray: `${distribution.cerrada.percent * 2.83} ${283.6 - distribution.cerrada.percent * 2.83}`, strokeDashoffset: `-${(distribution.abierta.percent + distribution.en_progreso.percent) * 2.83}`, transform: "rotate(-90 50 50)" }), _jsx("text", { x: "50", y: "55", textAnchor: "middle", fontSize: "24", fill: "#333", fontWeight: "bold", children: stats.total_actions })] }) }), _jsx("div", { className: "distribution-legend", children: Object.entries(distribution).map(([key, data]) => (_jsxs("div", { className: "legend-item", children: [_jsx("div", { className: "legend-color", style: { backgroundColor: data.color } }), _jsxs("div", { className: "legend-info", children: [_jsx("div", { className: "legend-label", children: data.label }), _jsxs("div", { className: "legend-value", children: [data.count, " (", data.percent, "%)"] })] })] }, key))) })] })] }), stats.overdue_actions > 0 && (_jsxs("div", { className: "dashboard-section alert-section", children: [_jsx("h2", { children: "Acciones Vencidas" }), _jsxs("div", { className: "overdue-alert", children: [_jsx("span", { className: "alert-icon", children: "\u26A0\uFE0F" }), _jsxs("p", { children: ["Hay ", _jsx("strong", { children: stats.overdue_actions }), " acciones vencidas que requieren atenci\u00F3n inmediata."] })] })] })), _jsxs("div", { className: "dashboard-section", children: [_jsx("h2", { children: "Todas las Acciones" }), _jsx(ActionsList, { readonly: false })] }), showRejectForm && (_jsx("div", { className: "modal-overlay", children: _jsxs("div", { className: "modal-content", children: [_jsx("h3", { children: "Rechazar Acci\u00F3n" }), _jsx("textarea", { placeholder: "Motivo del rechazo...", value: rejectReason, onChange: (e) => setRejectReason(e.target.value), rows: 3 }), _jsxs("div", { className: "modal-actions", children: [_jsx("button", { className: "btn btn-secondary", onClick: () => {
                                        setShowRejectForm(null);
                                        setRejectReason('');
                                    }, children: "Cancelar" }), _jsx("button", { className: "btn btn-primary", onClick: () => showRejectForm && handleReject(showRejectForm), children: "Rechazar" })] })] }) }))] }));
};
//# sourceMappingURL=AuditorDashboard.js.map