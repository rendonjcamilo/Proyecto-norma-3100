import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Compliance Dashboard Component
 * Displays comprehensive compliance metrics, risk scoring, and action status
 * for both providers and auditors
 */
import { useState, useEffect } from 'react';
import './ComplianceDashboard.css';
export const ComplianceDashboard = ({ providerId, providerName, metrics, riskAlerts = [], loading = false, onRefresh, userRole = 'provider_admin', }) => {
    const [refreshing, setRefreshing] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(false);
    useEffect(() => {
        if (!autoRefresh)
            return;
        const interval = setInterval(() => {
            handleRefresh();
        }, 5 * 60 * 1000); // Refresh every 5 minutes
        return () => clearInterval(interval);
    }, [autoRefresh, onRefresh]);
    const handleRefresh = async () => {
        if (!onRefresh)
            return;
        setRefreshing(true);
        try {
            await onRefresh();
        }
        finally {
            setRefreshing(false);
        }
    };
    const getComplianceStatus = (percentage) => {
        if (percentage >= 80)
            return 'verde';
        if (percentage >= 50)
            return 'naranja';
        return 'rojo';
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'verde':
                return '#2e7d32';
            case 'naranja':
                return '#f57c00';
            case 'rojo':
                return '#c62828';
        }
    };
    const getStatusLabel = (status) => {
        switch (status) {
            case 'verde':
                return 'Cumplimiento Alto';
            case 'naranja':
                return 'Cumplimiento Parcial';
            case 'rojo':
                return 'Cumplimiento Bajo';
        }
    };
    if (loading && !metrics) {
        return (_jsx("div", { className: "compliance-dashboard loading", children: _jsx("div", { className: "spinner", children: "Cargando dashboard..." }) }));
    }
    if (!metrics) {
        return (_jsx("div", { className: "compliance-dashboard error", children: _jsx("p", { children: "No hay datos de cumplimiento disponibles" }) }));
    }
    const complianceStatus = getComplianceStatus(metrics.compliancePercentage);
    const statusColor = getStatusColor(complianceStatus);
    return (_jsxs("div", { className: "compliance-dashboard", children: [_jsxs("div", { className: "dashboard-header", children: [_jsxs("div", { className: "header-info", children: [_jsx("h1", { children: "Dashboard de Cumplimiento Norma 3100" }), providerName && _jsx("p", { className: "provider-name", children: providerName })] }), _jsxs("div", { className: "header-actions", children: [_jsxs("button", { type: "button", className: "btn-refresh", onClick: handleRefresh, disabled: refreshing, title: "Actualizar datos", children: ["\uD83D\uDD04 ", refreshing ? 'Actualizando...' : 'Actualizar'] }), _jsxs("label", { className: "auto-refresh-toggle", children: [_jsx("input", { type: "checkbox", checked: autoRefresh, onChange: e => setAutoRefresh(e.target.checked) }), "Auto-actualizar"] })] })] }), _jsxs("div", { className: "compliance-overview", children: [_jsxs("div", { className: "compliance-card main", children: [_jsx("div", { className: "compliance-circle", style: { borderColor: statusColor }, children: _jsxs("div", { className: "compliance-percentage", children: [Math.round(metrics.compliancePercentage), "%"] }) }), _jsxs("div", { className: "compliance-info", children: [_jsx("h3", { children: "Cumplimiento General" }), _jsx("p", { className: "status-label", style: { color: statusColor }, children: getStatusLabel(complianceStatus) }), _jsxs("p", { className: "status-description", children: [metrics.inProgressFindings + metrics.resolvedFindings, " de ", metrics.totalFindings, " hallazgos en proceso o resueltos"] })] })] }), _jsxs("div", { className: "compliance-card trend", children: [_jsx("h3", { children: "Tendencia" }), _jsxs("div", { className: "trend-indicator", children: [metrics.trendDirection === 'improving' && (_jsx("div", { className: "trend improving", children: "\uD83D\uDCC8 Mejorando" })), metrics.trendDirection === 'stable' && (_jsx("div", { className: "trend stable", children: "\u27A1\uFE0F Estable" })), metrics.trendDirection === 'worsening' && (_jsx("div", { className: "trend worsening", children: "\uD83D\uDCC9 Empeorando" }))] })] }), _jsxs("div", { className: "compliance-card risk-score", children: [_jsx("h3", { children: "Riesgo Promedio" }), _jsxs("div", { className: "score-display", children: [_jsx("span", { className: "score-value", children: Math.round(metrics.averageRiskScore) }), _jsx("span", { className: "score-label", children: "de 100" })] }), _jsx("p", { className: "risk-description", children: metrics.averageRiskScore >= 70 ? '🔴 Alto riesgo' : metrics.averageRiskScore >= 40 ? '🟡 Riesgo moderado' : '🟢 Bajo riesgo' })] })] }), _jsxs("div", { className: "findings-breakdown", children: [_jsx("h2", { children: "Estado de Hallazgos" }), _jsxs("div", { className: "breakdown-grid", children: [_jsxs("div", { className: "breakdown-card open", children: [_jsx("div", { className: "count", children: metrics.openFindings }), _jsx("div", { className: "label", children: "Abiertos" })] }), _jsxs("div", { className: "breakdown-card in-progress", children: [_jsx("div", { className: "count", children: metrics.inProgressFindings }), _jsx("div", { className: "label", children: "En Progreso" })] }), _jsxs("div", { className: "breakdown-card resolved", children: [_jsx("div", { className: "count", children: metrics.resolvedFindings }), _jsx("div", { className: "label", children: "Resueltos" })] }), _jsxs("div", { className: "breakdown-card closed", children: [_jsx("div", { className: "count", children: metrics.closedFindings }), _jsx("div", { className: "label", children: "Cerrados" })] }), _jsxs("div", { className: "breakdown-card overdue", children: [_jsx("div", { className: "count", children: metrics.overdueFindingsCount }), _jsx("div", { className: "label", children: "Vencidos" })] })] }), _jsx("div", { className: "progress-container", children: _jsxs("div", { className: "progress-bar", children: [_jsx("div", { className: "progress-segment open", style: { width: `${(metrics.openFindings / metrics.totalFindings) * 100}%` }, title: `Abiertos: ${metrics.openFindings}` }), _jsx("div", { className: "progress-segment in-progress", style: { width: `${(metrics.inProgressFindings / metrics.totalFindings) * 100}%` }, title: `En Progreso: ${metrics.inProgressFindings}` }), _jsx("div", { className: "progress-segment resolved", style: { width: `${(metrics.resolvedFindings / metrics.totalFindings) * 100}%` }, title: `Resueltos: ${metrics.resolvedFindings}` }), _jsx("div", { className: "progress-segment closed", style: { width: `${(metrics.closedFindings / metrics.totalFindings) * 100}%` }, title: `Cerrados: ${metrics.closedFindings}` })] }) })] }), riskAlerts.length > 0 && (_jsxs("div", { className: "risk-alerts-section", children: [_jsx("h2", { children: "Alertas de Riesgo" }), _jsx("div", { className: "alerts-list", children: riskAlerts.slice(0, 5).map(alert => (_jsxs("div", { className: `alert alert-${alert.severity}`, children: [_jsxs("div", { className: "alert-header", children: [_jsx("h4", { children: alert.title }), _jsx("span", { className: `severity-badge ${alert.severity}`, children: alert.severity.toUpperCase() })] }), _jsxs("div", { className: "alert-details", children: [_jsxs("p", { children: [_jsx("strong", { children: "Puntuaci\u00F3n de riesgo:" }), " ", Math.round(alert.riskScore), "/100"] }), alert.daysOverdue > 0 && (_jsx("p", { className: "overdue", children: _jsxs("strong", { children: ["\u26A0\uFE0F Vencido hace ", alert.daysOverdue, " d\u00EDas"] }) }))] })] }, alert.id))) }), riskAlerts.length > 5 && (_jsxs("p", { className: "more-alerts", children: ["... y ", riskAlerts.length - 5, " alertas m\u00E1s"] }))] })), _jsxs("div", { className: "quick-actions", children: [_jsx("h2", { children: "Acciones R\u00E1pidas" }), _jsxs("div", { className: "actions-grid", children: [_jsx("button", { type: "button", className: "action-button", children: "\uD83D\uDCCB Ver Todos los Hallazgos" }), _jsx("button", { type: "button", className: "action-button", children: "\uD83D\uDCDD Ver Todas las Acciones" }), _jsx("button", { type: "button", className: "action-button", children: "\uD83D\uDCCA Descargar Reporte" }), userRole !== 'provider_admin' && (_jsx("button", { type: "button", className: "action-button", children: "\u2705 Verificar Acciones" }))] })] }), _jsxs("div", { className: "dashboard-footer", children: [_jsxs("p", { className: "update-time", children: ["\u00DAltima actualizaci\u00F3n: ", new Date().toLocaleString('es-CO')] }), _jsx("p", { className: "help-text", children: "Las m\u00E9tricas se actualizan autom\u00E1ticamente cada 5 minutos. Haz clic en \"Actualizar\" para forzar una actualizaci\u00F3n inmediata." })] })] }));
};
export default ComplianceDashboard;
//# sourceMappingURL=ComplianceDashboard.js.map