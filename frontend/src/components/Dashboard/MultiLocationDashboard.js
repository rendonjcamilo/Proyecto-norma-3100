import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Multi-Location Compliance Dashboard
 * Displays compliance status across all provider locations
 * Shows semáforo colors (verde/naranja/rojo) and allows location comparison
 */
import { useEffect, useState } from 'react';
import { LocationComplianceCard } from './LocationComplianceCard';
import { LocationSelector } from './LocationSelector';
import { ComplianceCharts } from './ComplianceCharts';
import './MultiLocationDashboard.css';
const API_BASE_URL = '/api';
export const MultiLocationDashboard = () => {
    const [locations, setLocations] = useState([]);
    const [selectedLocationId, setSelectedLocationId] = useState(null);
    const [complianceData, setComplianceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('all');
    // Fetch locations
    useEffect(() => {
        const fetchLocations = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_BASE_URL}/providers/locations`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                    },
                });
                if (!response.ok)
                    throw new Error('Error al cargar ubicaciones');
                const data = await response.json();
                setLocations(data);
                if (data.length > 0) {
                    setSelectedLocationId(data[0].id);
                }
            }
            catch (err) {
                setError(err instanceof Error ? err.message : 'Error desconocido');
            }
        };
        fetchLocations();
    }, []);
    // Fetch compliance data for all locations
    useEffect(() => {
        const fetchCompliance = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_BASE_URL}/assessments/locations/compliance`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                    },
                });
                if (!response.ok)
                    throw new Error('Error al cargar datos de cumplimiento');
                const data = await response.json();
                setComplianceData(data);
            }
            catch (err) {
                setError(err instanceof Error ? err.message : 'Error desconocido');
            }
            finally {
                setLoading(false);
            }
        };
        if (locations.length > 0) {
            fetchCompliance();
        }
    }, [locations]);
    const getSemaforoColor = (percent) => {
        if (percent >= 80)
            return 'verde';
        if (percent >= 50)
            return 'naranja';
        return 'rojo';
    };
    const selectedLocation = locations.find(loc => loc.id === selectedLocationId);
    const selectedCompliance = complianceData.find(comp => comp.locationId === selectedLocationId);
    const displayedCompliance = viewMode === 'selected' && selectedCompliance
        ? [selectedCompliance]
        : complianceData;
    if (loading && complianceData.length === 0) {
        return (_jsx("div", { className: "multi-location-dashboard loading", children: _jsx("div", { className: "loading-spinner", children: "Cargando datos de cumplimiento..." }) }));
    }
    return (_jsxs("div", { className: "multi-location-dashboard", children: [_jsxs("div", { className: "dashboard-header", children: [_jsx("h1", { children: "Cumplimiento por Ubicaci\u00F3n" }), _jsx("p", { className: "dashboard-subtitle", children: "Visualizaci\u00F3n del estado de cumplimiento Norma 3100 en todas las ubicaciones" })] }), error && (_jsxs("div", { className: "error-message", children: [_jsx("strong", { children: "Error:" }), " ", error] })), _jsxs("div", { className: "dashboard-controls", children: [_jsxs("div", { className: "control-group", children: [_jsx("label", { htmlFor: "location-selector", children: "Seleccionar Ubicaci\u00F3n:" }), _jsx(LocationSelector, { locations: locations, selectedLocationId: selectedLocationId, onChange: setSelectedLocationId })] }), _jsxs("div", { className: "control-group view-mode", children: [_jsx("label", { children: "Modo de Vista:" }), _jsxs("div", { className: "view-buttons", children: [_jsx("button", { className: `view-btn ${viewMode === 'all' ? 'active' : ''}`, onClick: () => setViewMode('all'), children: "Todas las Ubicaciones" }), _jsx("button", { className: `view-btn ${viewMode === 'selected' ? 'active' : ''}`, onClick: () => setViewMode('selected'), children: "Solo Seleccionada" })] })] })] }), selectedCompliance && (_jsxs("div", { className: "selected-location-info", children: [_jsxs("div", { className: "location-header", children: [_jsx("h2", { children: selectedLocation?.name }), _jsxs("p", { className: "location-details", children: [selectedLocation?.city, ", ", selectedLocation?.state] })] }), selectedCompliance.lastAssessmentDate && (_jsxs("p", { className: "last-assessment", children: ["\u00DAltima evaluaci\u00F3n: ", new Date(selectedCompliance.lastAssessmentDate).toLocaleDateString('es-CO')] }))] })), displayedCompliance.length === 0 ? (_jsx("div", { className: "no-data", children: _jsx("p", { children: "No hay datos de cumplimiento disponibles" }) })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "locations-grid", children: displayedCompliance.map(compliance => (_jsx(LocationComplianceCard, { compliance: compliance, isSelected: compliance.locationId === selectedLocationId, onClick: () => setSelectedLocationId(compliance.locationId) }, compliance.locationId))) }), displayedCompliance.length > 1 && (_jsx(ComplianceCharts, { data: displayedCompliance }))] }))] }));
};
export default MultiLocationDashboard;
//# sourceMappingURL=MultiLocationDashboard.js.map