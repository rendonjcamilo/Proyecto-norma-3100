import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Findings List Component
 * Displays findings in a filterable table with status and severity color coding
 */
import { useState, useEffect } from 'react';
import './FindingsList.css';
/**
 * Findings List Component
 */
export const FindingsList = ({ providerId, onSelectFinding, onCreateAction, }) => {
    const [findings, setFindings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: '',
        severity: '',
        service_id: '',
        standard_id: '',
    });
    const [total, setTotal] = useState(0);
    const [limit, setLimit] = useState(25);
    const [offset, setOffset] = useState(0);
    // Load findings
    useEffect(() => {
        loadFindings();
    }, [filters, limit, offset, providerId]);
    const loadFindings = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.status)
                params.append('status', filters.status);
            if (filters.severity)
                params.append('severity', filters.severity);
            if (filters.service_id)
                params.append('service_id', filters.service_id);
            if (filters.standard_id)
                params.append('standard_id', filters.standard_id);
            if (providerId)
                params.append('provider_id', providerId);
            params.append('limit', limit.toString());
            params.append('offset', offset.toString());
            const response = await fetch(`/api/findings?${params.toString()}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            if (response.ok) {
                const data = await response.json();
                setFindings(data.findings || []);
                setTotal(data.total || 0);
            }
        }
        catch (err) {
            console.error('Error loading findings:', err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleFilterChange = (field, value) => {
        setFilters({ ...filters, [field]: value });
        setOffset(0); // Reset pagination
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'abierta':
                return 'status-open';
            case 'asignada':
                return 'status-assigned';
            case 'en_progreso':
                return 'status-in-progress';
            case 'cerrada':
                return 'status-closed';
            default:
                return 'status-default';
        }
    };
    const getSeverityColor = (severity) => {
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
            en_revision: 'En Revisión',
            asignada: 'Asignada',
            en_progreso: 'En Progreso',
            cerrada: 'Cerrada',
        };
        return labels[status] || status;
    };
    const getSeverityLabel = (severity) => {
        const labels = {
            crítica: 'Crítica',
            alta: 'Alta',
            media: 'Media',
            baja: 'Baja',
            pendiente: 'Pendiente',
        };
        return labels[severity] || severity;
    };
    const totalPages = Math.ceil(total / limit);
    const currentPage = Math.floor(offset / limit) + 1;
    return (_jsxs("div", { className: "findings-list-container", children: [_jsxs("div", { className: "findings-header", children: [_jsx("h2", { children: "Hallazgos" }), _jsx("p", { className: "subtitle", children: "Gesti\u00F3n de hallazgos y acciones correctivas" })] }), _jsxs("div", { className: "findings-filters", children: [_jsxs("div", { className: "filter-group", children: [_jsx("label", { htmlFor: "status-filter", children: "Estado" }), _jsxs("select", { id: "status-filter", value: filters.status, onChange: (e) => handleFilterChange('status', e.target.value), className: "filter-select", children: [_jsx("option", { value: "", children: "Todos los estados" }), _jsx("option", { value: "abierta", children: "Abierta" }), _jsx("option", { value: "en_revision", children: "En Revisi\u00F3n" }), _jsx("option", { value: "asignada", children: "Asignada" }), _jsx("option", { value: "en_progreso", children: "En Progreso" }), _jsx("option", { value: "cerrada", children: "Cerrada" })] })] }), _jsxs("div", { className: "filter-group", children: [_jsx("label", { htmlFor: "severity-filter", children: "Severidad" }), _jsxs("select", { id: "severity-filter", value: filters.severity, onChange: (e) => handleFilterChange('severity', e.target.value), className: "filter-select", children: [_jsx("option", { value: "", children: "Todas las severidades" }), _jsx("option", { value: "cr\u00EDtica", children: "Cr\u00EDtica" }), _jsx("option", { value: "alta", children: "Alta" }), _jsx("option", { value: "media", children: "Media" }), _jsx("option", { value: "baja", children: "Baja" }), _jsx("option", { value: "pendiente", children: "Pendiente" })] })] }), _jsxs("div", { className: "filter-group", children: [_jsx("label", { htmlFor: "service-filter", children: "Servicio" }), _jsxs("select", { id: "service-filter", value: filters.service_id, onChange: (e) => handleFilterChange('service_id', e.target.value), className: "filter-select", children: [_jsx("option", { value: "", children: "Todos los servicios" }), _jsx("option", { value: "service-1", children: "Servicios Ambulatorios" }), _jsx("option", { value: "service-2", children: "Servicios de Hospitalizaci\u00F3n" }), _jsx("option", { value: "service-3", children: "Unidad de Cuidados Intensivos" })] })] })] }), loading ? (_jsx("div", { className: "loading", children: "Cargando hallazgos..." })) : findings.length === 0 ? (_jsx("div", { className: "empty-state", children: _jsx("p", { children: "No se encontraron hallazgos con los criterios especificados." }) })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "findings-table-wrapper", children: _jsxs("table", { className: "findings-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { className: "col-number", children: "No." }), _jsx("th", { className: "col-title", children: "Hallazgo" }), _jsx("th", { className: "col-service", children: "Servicio" }), _jsx("th", { className: "col-status", children: "Estado" }), _jsx("th", { className: "col-severity", children: "Severidad" }), _jsx("th", { className: "col-risk", children: "Riesgo" }), _jsx("th", { className: "col-assigned", children: "Asignado a" }), _jsx("th", { className: "col-date", children: "Fecha Creaci\u00F3n" }), _jsx("th", { className: "col-actions", children: "Acciones" })] }) }), _jsx("tbody", { children: findings.map((finding) => (_jsxs("tr", { className: "finding-row", children: [_jsx("td", { className: "col-number", children: finding.finding_number }), _jsx("td", { className: "col-title", children: _jsxs("div", { className: "finding-title-cell", children: [_jsx("strong", { children: finding.title }), _jsxs("p", { className: "finding-description", children: [finding.description.substring(0, 50), "..."] })] }) }), _jsx("td", { className: "col-service", children: finding.service_id || '—' }), _jsx("td", { className: "col-status", children: _jsx("span", { className: `status-badge ${getStatusColor(finding.status)}`, children: getStatusLabel(finding.status) }) }), _jsx("td", { className: "col-severity", children: _jsx("span", { className: `severity-badge ${getSeverityColor(finding.severity)}`, children: getSeverityLabel(finding.severity) }) }), _jsx("td", { className: "col-risk", children: _jsxs("div", { className: "risk-score", children: [_jsx("div", { className: "risk-bar", children: _jsx("div", { className: "risk-fill", style: {
                                                                    width: `${finding.risk_score}%`,
                                                                    backgroundColor: finding.risk_score >= 80 ? '#dc3545' :
                                                                        finding.risk_score >= 60 ? '#ff9800' :
                                                                            '#4caf50',
                                                                } }) }), _jsx("span", { className: "risk-text", children: finding.risk_score })] }) }), _jsx("td", { className: "col-assigned", children: finding.assigned_to || '—' }), _jsx("td", { className: "col-date", children: new Date(finding.created_date).toLocaleDateString('es-CO') }), _jsx("td", { className: "col-actions", children: _jsxs("div", { className: "action-buttons", children: [_jsx("button", { className: "btn-icon btn-view", onClick: () => onSelectFinding(finding), title: "Ver detalles", children: "\uD83D\uDC41" }), onCreateAction && finding.status === 'abierta' && (_jsx("button", { className: "btn-icon btn-action", onClick: () => onCreateAction(finding), title: "Crear acci\u00F3n correctiva", children: "\u2795" }))] }) })] }, finding.id))) })] }) }), _jsxs("div", { className: "pagination", children: [_jsx("button", { className: "btn-pagination", onClick: () => setOffset(Math.max(0, offset - limit)), disabled: offset === 0, children: "\u2190 Anterior" }), _jsxs("span", { className: "pagination-info", children: ["P\u00E1gina ", currentPage, " de ", totalPages, " (", total, " total)"] }), _jsx("button", { className: "btn-pagination", onClick: () => setOffset(offset + limit), disabled: offset + limit >= total, children: "Siguiente \u2192" })] })] }))] }));
};
//# sourceMappingURL=FindingsList.js.map