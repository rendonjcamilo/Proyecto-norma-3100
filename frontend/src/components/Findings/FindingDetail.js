import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Finding Detail Component
 * Shows full finding information with actions and event timeline
 */
import { useState, useEffect } from 'react';
import './FindingDetail.css';
/**
 * Finding Detail Component
 */
export const FindingDetail = ({ findingId, onClose, onCreateAction, }) => {
    const [finding, setFinding] = useState(null);
    const [actions, setActions] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState('details');
    useEffect(() => {
        loadFindingDetail();
    }, [findingId]);
    const loadFindingDetail = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/findings/${findingId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            if (response.ok) {
                const data = await response.json();
                setFinding(data.finding);
                setActions(data.actions || []);
                setEvents(data.events || []);
            }
        }
        catch (err) {
            console.error('Error loading finding detail:', err);
        }
        finally {
            setLoading(false);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "finding-detail-container", children: _jsx("div", { className: "loading", children: "Cargando detalles..." }) }));
    }
    if (!finding) {
        return (_jsx("div", { className: "finding-detail-container", children: _jsx("div", { className: "error", children: "Hallazgo no encontrado" }) }));
    }
    const getSeverityBadgeClass = (severity) => {
        switch (severity) {
            case 'crítica':
                return 'severity-critical';
            case 'alta':
                return 'severity-high';
            case 'media':
                return 'severity-medium';
            case 'baja':
                return 'severity-low';
            default:
                return 'severity-pending';
        }
    };
    const getStatusLabel = (status) => {
        const labels = {
            abierta: 'Abierta',
            asignada: 'Asignada',
            en_progreso: 'En Progreso',
            cerrada: 'Cerrada',
        };
        return labels[status] || status;
    };
    const getEventIcon = (eventType) => {
        switch (eventType) {
            case 'finding.created':
                return '✓';
            case 'finding.assigned':
                return '👤';
            case 'finding.status_changed':
                return '↻';
            case 'action.created':
                return '✚';
            case 'followup.completed':
                return '✅';
            default:
                return '•';
        }
    };
    const getEventLabel = (eventType) => {
        const labels = {
            'finding.created': 'Hallazgo creado',
            'finding.assigned': 'Asignado',
            'finding.status_changed': 'Estado modificado',
            'finding.severity_set': 'Severidad establecida',
            'action.created': 'Acción creada',
            'action.status_changed': 'Estado de acción modificado',
            'followup.completed': 'Seguimiento completado',
            'finding.closed': 'Hallazgo cerrado',
        };
        return labels[eventType] || eventType;
    };
    return (_jsxs("div", { className: "finding-detail-container", children: [_jsx("div", { className: "detail-header", children: _jsxs("div", { className: "header-content", children: [_jsx("button", { className: "btn-back", onClick: onClose, children: "\u2190 Volver" }), _jsxs("div", { className: "header-title", children: [_jsx("h2", { children: finding.title }), _jsx("span", { className: "finding-number", children: finding.finding_number })] }), _jsxs("div", { className: "header-badges", children: [_jsx("span", { className: `badge severity-badge ${getSeverityBadgeClass(finding.severity)}`, children: finding.severity.charAt(0).toUpperCase() + finding.severity.slice(1) }), _jsx("span", { className: "badge status-badge", children: getStatusLabel(finding.status) })] })] }) }), _jsxs("div", { className: "detail-tabs", children: [_jsx("button", { className: `tab ${selectedTab === 'details' ? 'active' : ''}`, onClick: () => setSelectedTab('details'), children: "Detalles" }), _jsxs("button", { className: `tab ${selectedTab === 'actions' ? 'active' : ''}`, onClick: () => setSelectedTab('actions'), children: ["Acciones (", actions.length, ")"] }), _jsx("button", { className: `tab ${selectedTab === 'timeline' ? 'active' : ''}`, onClick: () => setSelectedTab('timeline'), children: "Historial" })] }), _jsxs("div", { className: "detail-content", children: [selectedTab === 'details' && (_jsxs("div", { className: "details-tab", children: [_jsxs("div", { className: "detail-section", children: [_jsx("h3", { children: "Informaci\u00F3n del Hallazgo" }), _jsxs("div", { className: "detail-grid", children: [_jsxs("div", { className: "detail-item", children: [_jsx("label", { children: "N\u00FAmero" }), _jsx("p", { children: finding.finding_number })] }), _jsxs("div", { className: "detail-item", children: [_jsx("label", { children: "Estado" }), _jsx("p", { children: getStatusLabel(finding.status) })] }), _jsxs("div", { className: "detail-item", children: [_jsx("label", { children: "Severidad" }), _jsx("p", { children: finding.severity })] }), _jsxs("div", { className: "detail-item", children: [_jsx("label", { children: "Puntuaci\u00F3n de Riesgo" }), _jsxs("p", { children: [_jsx("div", { className: "risk-bar", children: _jsx("div", { className: "risk-fill", style: {
                                                                        width: `${finding.risk_score}%`,
                                                                        backgroundColor: finding.risk_score >= 80 ? '#dc3545' :
                                                                            finding.risk_score >= 60 ? '#ff9800' :
                                                                                '#4caf50',
                                                                    } }) }), finding.risk_score, "%"] })] })] })] }), _jsxs("div", { className: "detail-section", children: [_jsx("h3", { children: "Descripci\u00F3n" }), _jsx("p", { className: "description-text", children: finding.description })] }), _jsxs("div", { className: "detail-section", children: [_jsx("h3", { children: "Cronolog\u00EDa" }), _jsxs("div", { className: "detail-grid", children: [_jsxs("div", { className: "detail-item", children: [_jsx("label", { children: "Fecha de Creaci\u00F3n" }), _jsx("p", { children: new Date(finding.created_date).toLocaleDateString('es-CO') })] }), finding.closed_date && (_jsxs("div", { className: "detail-item", children: [_jsx("label", { children: "Fecha de Cierre" }), _jsx("p", { children: new Date(finding.closed_date).toLocaleDateString('es-CO') })] }))] })] }), onCreateAction && finding.status === 'abierta' && (_jsx("div", { className: "detail-actions", children: _jsx("button", { className: "btn-primary", onClick: () => onCreateAction(finding), children: "Crear Acci\u00F3n Correctiva" }) }))] })), selectedTab === 'actions' && (_jsx("div", { className: "actions-tab", children: actions.length === 0 ? (_jsx("div", { className: "empty-state", children: _jsx("p", { children: "No hay acciones correctivas asignadas a este hallazgo." }) })) : (_jsx("div", { className: "actions-list", children: actions.map((action) => (_jsxs("div", { className: "action-card", children: [_jsxs("div", { className: "action-header", children: [_jsx("h4", { children: action.title }), _jsx("span", { className: `priority-badge priority-${action.priority}`, children: action.priority })] }), _jsx("p", { className: "action-description", children: action.description }), _jsxs("div", { className: "action-meta", children: [_jsxs("div", { className: "meta-item", children: [_jsx("label", { children: "Estado" }), _jsx("span", { children: action.status })] }), _jsxs("div", { className: "meta-item", children: [_jsx("label", { children: "Progreso" }), _jsx("div", { className: "progress-bar", children: _jsx("div", { className: "progress-fill", style: { width: `${action.completion_percentage}%` } }) }), _jsxs("span", { children: [action.completion_percentage, "%"] })] }), _jsxs("div", { className: "meta-item", children: [_jsx("label", { children: "Plazo" }), _jsx("span", { children: new Date(action.deadline).toLocaleDateString('es-CO') })] })] })] }, action.id))) })) })), selectedTab === 'timeline' && (_jsx("div", { className: "timeline-tab", children: events.length === 0 ? (_jsx("div", { className: "empty-state", children: _jsx("p", { children: "No hay eventos registrados." }) })) : (_jsx("div", { className: "timeline", children: events.map((event) => (_jsxs("div", { className: "timeline-item", children: [_jsx("div", { className: "timeline-icon", children: getEventIcon(event.event_type) }), _jsxs("div", { className: "timeline-content", children: [_jsx("h4", { children: getEventLabel(event.event_type) }), _jsx("p", { className: "event-time", children: new Date(event.created_at).toLocaleString('es-CO') }), Object.keys(event.data).length > 0 && (_jsx("pre", { className: "event-data", children: JSON.stringify(event.data, null, 2) }))] })] }, event.id))) })) }))] })] }));
};
//# sourceMappingURL=FindingDetail.js.map