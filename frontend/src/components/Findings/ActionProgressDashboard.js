import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Action Progress Dashboard Component
 * Displays action completion metrics and timeline
 */
import { useState, useEffect } from 'react';
import './ActionProgressDashboard.css';
/**
 * Action Progress Dashboard Component
 */
export const ActionProgressDashboard = () => {
    const [metrics, setMetrics] = useState(null);
    const [overdueActions, setOverdueActions] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        loadDashboard();
    }, []);
    const loadDashboard = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/actions/dashboard', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            if (response.ok) {
                const data = await response.json();
                setMetrics(data);
                // Load overdue actions
                const actionsResponse = await fetch('/api/actions?status=abierta&status=en_progreso&sort=deadline', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });
                if (actionsResponse.ok) {
                    const actionsData = await actionsResponse.json();
                    const now = new Date();
                    const overdue = actionsData.actions
                        ?.filter((a) => new Date(a.deadline) < now)
                        .map((a) => ({
                        ...a,
                        days_overdue: Math.floor((now.getTime() - new Date(a.deadline).getTime()) / (1000 * 60 * 60 * 24)),
                    }))
                        .slice(0, 5) || [];
                    setOverdueActions(overdue);
                }
            }
        }
        catch (err) {
            console.error('Error loading dashboard:', err);
        }
        finally {
            setLoading(false);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "dashboard-container", children: _jsx("div", { className: "loading", children: "Cargando dashboard..." }) }));
    }
    if (!metrics) {
        return (_jsx("div", { className: "dashboard-container", children: _jsx("div", { className: "error", children: "Error al cargar m\u00E9tricas" }) }));
    }
    const completionPercentage = Math.round(metrics.avg_completion);
    const completionColor = completionPercentage >= 80 ? '#4caf50' :
        completionPercentage >= 60 ? '#ff9800' :
            '#dc3545';
    return (_jsxs("div", { className: "dashboard-container", children: [_jsxs("div", { className: "dashboard-header", children: [_jsx("h2", { children: "Dashboard de Acciones Correctivas" }), _jsx("p", { className: "subtitle", children: "Seguimiento de progreso y alertas" })] }), _jsxs("div", { className: "metrics-grid", children: [_jsxs("div", { className: "metric-card", children: [_jsx("div", { className: "metric-icon", children: "\uD83D\uDCCB" }), _jsxs("div", { className: "metric-content", children: [_jsx("h4", { children: "Acciones Totales" }), _jsx("div", { className: "metric-value", children: metrics.total_actions })] })] }), _jsxs("div", { className: "metric-card", children: [_jsx("div", { className: "metric-icon", children: "\uD83D\uDD35" }), _jsxs("div", { className: "metric-content", children: [_jsx("h4", { children: "Abiertas" }), _jsx("div", { className: "metric-value", children: metrics.open_actions })] })] }), _jsxs("div", { className: "metric-card", children: [_jsx("div", { className: "metric-icon", children: "\uD83D\uDFE1" }), _jsxs("div", { className: "metric-content", children: [_jsx("h4", { children: "En Progreso" }), _jsx("div", { className: "metric-value", children: metrics.in_progress })] })] }), _jsxs("div", { className: "metric-card", children: [_jsx("div", { className: "metric-icon", children: "\u2705" }), _jsxs("div", { className: "metric-content", children: [_jsx("h4", { children: "Cerradas" }), _jsx("div", { className: "metric-value", children: metrics.closed_actions })] })] }), _jsxs("div", { className: "metric-card alert", children: [_jsx("div", { className: "metric-icon", children: "\u26A0\uFE0F" }), _jsxs("div", { className: "metric-content", children: [_jsx("h4", { children: "Vencidas" }), _jsx("div", { className: "metric-value alert-text", children: metrics.overdue_actions })] })] }), _jsxs("div", { className: "metric-card", children: [_jsx("div", { className: "metric-icon", children: "\uD83D\uDCCA" }), _jsxs("div", { className: "metric-content", children: [_jsx("h4", { children: "Progreso Promedio" }), _jsxs("div", { className: "metric-value", style: { color: completionColor }, children: [completionPercentage, "%"] })] })] })] }), _jsxs("div", { className: "dashboard-section", children: [_jsx("h3", { children: "Distribuci\u00F3n de Estados" }), _jsx("div", { className: "status-distribution", children: _jsxs("div", { className: "distribution-item", children: [_jsxs("div", { className: "distribution-bar", children: [_jsx("div", { className: "bar-segment", style: {
                                                width: `${(metrics.open_actions / metrics.total_actions) * 100}%`,
                                                backgroundColor: '#2196f3',
                                            }, title: `Abiertas: ${metrics.open_actions}` }), _jsx("div", { className: "bar-segment", style: {
                                                width: `${(metrics.in_progress / metrics.total_actions) * 100}%`,
                                                backgroundColor: '#ff9800',
                                            }, title: `En Progreso: ${metrics.in_progress}` }), _jsx("div", { className: "bar-segment", style: {
                                                width: `${(metrics.closed_actions / metrics.total_actions) * 100}%`,
                                                backgroundColor: '#4caf50',
                                            }, title: `Cerradas: ${metrics.closed_actions}` })] }), _jsxs("div", { className: "bar-legend", children: [_jsxs("span", { className: "legend-item", children: [_jsx("span", { className: "legend-color", style: { backgroundColor: '#2196f3' } }), "Abiertas (", metrics.open_actions, ")"] }), _jsxs("span", { className: "legend-item", children: [_jsx("span", { className: "legend-color", style: { backgroundColor: '#ff9800' } }), "En Progreso (", metrics.in_progress, ")"] }), _jsxs("span", { className: "legend-item", children: [_jsx("span", { className: "legend-color", style: { backgroundColor: '#4caf50' } }), "Cerradas (", metrics.closed_actions, ")"] })] })] }) })] }), _jsxs("div", { className: "dashboard-section", children: [_jsx("h3", { children: "Progreso General" }), _jsxs("div", { className: "completion-progress", children: [_jsx("div", { className: "progress-visualization", children: _jsx("div", { className: "progress-circle", style: {
                                        background: `conic-gradient(
                  ${completionColor} 0deg ${completionPercentage * 3.6}deg,
                  #e0e0e0 ${completionPercentage * 3.6}deg 360deg
                )`,
                                    }, children: _jsxs("div", { className: "progress-circle-inner", children: [_jsxs("div", { className: "progress-value", children: [completionPercentage, "%"] }), _jsx("div", { className: "progress-label", children: "Completado" })] }) }) }), _jsxs("div", { className: "progress-breakdown", children: [_jsxs("div", { className: "breakdown-item", children: [_jsx("label", { children: "0-25%" }), _jsx("div", { className: "breakdown-bar", children: _jsx("div", { className: "breakdown-fill", style: { width: '25%', backgroundColor: '#dc3545' } }) }), _jsx("span", { className: "breakdown-label", children: "Inicio" })] }), _jsxs("div", { className: "breakdown-item", children: [_jsx("label", { children: "26-50%" }), _jsx("div", { className: "breakdown-bar", children: _jsx("div", { className: "breakdown-fill", style: { width: '50%', backgroundColor: '#ff9800' } }) }), _jsx("span", { className: "breakdown-label", children: "Desarrollo" })] }), _jsxs("div", { className: "breakdown-item", children: [_jsx("label", { children: "51-75%" }), _jsx("div", { className: "breakdown-bar", children: _jsx("div", { className: "breakdown-fill", style: { width: '75%', backgroundColor: '#ffc107' } }) }), _jsx("span", { className: "breakdown-label", children: "Avanzado" })] }), _jsxs("div", { className: "breakdown-item", children: [_jsx("label", { children: "76-100%" }), _jsx("div", { className: "breakdown-bar", children: _jsx("div", { className: "breakdown-fill", style: { width: '100%', backgroundColor: '#4caf50' } }) }), _jsx("span", { className: "breakdown-label", children: "Completado" })] })] })] })] }), overdueActions.length > 0 && (_jsxs("div", { className: "dashboard-section alert-section", children: [_jsx("h3", { children: "\u26A0\uFE0F Acciones Vencidas" }), _jsx("div", { className: "overdue-list", children: overdueActions.map((action) => (_jsxs("div", { className: "overdue-item", children: [_jsxs("div", { className: "overdue-header", children: [_jsx("h4", { children: action.title }), _jsx("span", { className: `priority-badge priority-${action.priority}`, children: action.priority })] }), _jsxs("div", { className: "overdue-info", children: [_jsxs("span", { className: "overdue-days", children: [action.days_overdue, " d\u00EDa(s) vencida"] }), _jsxs("span", { className: "deadline", children: ["Plazo: ", new Date(action.deadline).toLocaleDateString('es-CO')] })] })] }, action.id))) })] })), _jsxs("div", { className: "dashboard-section", children: [_jsx("h3", { children: "L\u00EDnea de Tiempo de Cumplimiento" }), _jsxs("div", { className: "timeline-chart", children: [_jsxs("div", { className: "timeline-header", children: [_jsx("span", { children: "Hoy" }), _jsx("span", { children: "7 d\u00EDas" }), _jsx("span", { children: "14 d\u00EDas" }), _jsx("span", { children: "30 d\u00EDas" })] }), _jsxs("div", { className: "timeline-bar", children: [_jsx("div", { className: "timeline-marker", style: { left: '0%' }, title: "Hoy" }), _jsx("div", { className: "timeline-marker", style: { left: '25%' }, title: "7 d\u00EDas" }), _jsx("div", { className: "timeline-marker", style: { left: '50%' }, title: "14 d\u00EDas" }), _jsx("div", { className: "timeline-marker", style: { left: '100%' }, title: "30 d\u00EDas" })] }), _jsx("p", { className: "timeline-note", children: "Muestra la distribuci\u00F3n de pr\u00F3ximas fechas de entrega en los pr\u00F3ximos 30 d\u00EDas" })] })] }), _jsxs("div", { className: "dashboard-actions", children: [_jsx("button", { className: "btn-secondary", onClick: () => window.location.reload(), children: "Actualizar" }), _jsx("button", { className: "btn-primary", onClick: () => window.location.href = '/findings', children: "Ver Hallazgos" })] })] }));
};
//# sourceMappingURL=ActionProgressDashboard.js.map