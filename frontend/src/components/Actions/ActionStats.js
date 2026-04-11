import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Action Stats Component
 * Displays summary cards with action metrics
 */
import { useEffect } from 'react';
import { useActionStore } from '../../stores/actionStore';
import './ActionStats.css';
export const ActionStats = () => {
    const { stats, fetchStats, loading } = useActionStore();
    useEffect(() => {
        fetchStats();
    }, [fetchStats]);
    if (loading || !stats) {
        return (_jsx("div", { className: "action-stats", children: _jsx("div", { className: "stat-card loading", children: "Cargando..." }) }));
    }
    const overduePercent = stats.total_actions > 0
        ? Math.round((stats.overdue_actions / stats.total_actions) * 100)
        : 0;
    return (_jsxs("div", { className: "action-stats", children: [_jsxs("div", { className: "stat-card stat-total", children: [_jsx("div", { className: "stat-number", children: stats.total_actions }), _jsx("div", { className: "stat-label", children: "Total de Acciones" })] }), _jsxs("div", { className: "stat-card stat-open", children: [_jsx("div", { className: "stat-number", children: stats.open_actions }), _jsx("div", { className: "stat-label", children: "Abierta" }), _jsx("div", { className: "stat-sublabel", children: "Sin empezar" })] }), _jsxs("div", { className: "stat-card stat-in-progress", children: [_jsx("div", { className: "stat-number", children: stats.in_progress }), _jsx("div", { className: "stat-label", children: "En Progreso" }), _jsx("div", { className: "stat-sublabel", children: "En ejecuci\u00F3n" })] }), _jsxs("div", { className: "stat-card stat-closed", children: [_jsx("div", { className: "stat-number", children: stats.closed_actions }), _jsx("div", { className: "stat-label", children: "Cerrada" }), _jsx("div", { className: "stat-sublabel", children: "Completada" })] }), _jsxs("div", { className: "stat-card stat-overdue", children: [_jsx("div", { className: "stat-number", children: stats.overdue_actions }), _jsx("div", { className: "stat-label", children: "Vencidas" }), _jsxs("div", { className: "stat-sublabel", children: [overduePercent, "% del total"] })] }), _jsxs("div", { className: "stat-card stat-completion", children: [_jsxs("div", { className: "stat-number", children: [Math.round(stats.avg_completion), "%"] }), _jsx("div", { className: "stat-label", children: "Progreso Promedio" }), _jsx("div", { className: "progress-bar", children: _jsx("div", { className: "progress-fill", style: { width: `${stats.avg_completion}%` } }) })] })] }));
};
//# sourceMappingURL=ActionStats.js.map