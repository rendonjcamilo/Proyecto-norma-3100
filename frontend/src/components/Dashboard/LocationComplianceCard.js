import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import './LocationComplianceCard.css';
export const LocationComplianceCard = ({ compliance, isSelected = false, onClick, }) => {
    const getSemaforoLabel = (color) => {
        const labels = {
            verde: 'Verde - Cumple',
            naranja: 'Naranja - Parcial',
            rojo: 'Rojo - No Cumple',
        };
        return labels[color] || color;
    };
    const getSemaforoDescription = (color) => {
        const descriptions = {
            verde: 'Cumplimiento ≥ 80%',
            naranja: 'Cumplimiento 50-79%',
            rojo: 'Cumplimiento < 50%',
        };
        return descriptions[color] || '';
    };
    const getTopStandards = () => {
        return compliance.perStandardMetrics
            .sort((a, b) => b.percent - a.percent)
            .slice(0, 3);
    };
    const topThreeStandards = getTopStandards();
    return (_jsxs("div", { className: `location-compliance-card semaforo-${compliance.semaforo} ${isSelected ? 'selected' : ''}`, onClick: onClick, role: "button", tabIndex: 0, onKeyDown: (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                onClick?.();
            }
        }, children: [_jsxs("div", { className: "card-header", children: [_jsx("h3", { className: "location-name", children: compliance.locationName }), isSelected && _jsx("div", { className: "selection-badge", children: "Seleccionada" })] }), _jsxs("div", { className: "overall-score", children: [_jsx("div", { className: "score-circle", children: _jsxs("span", { className: "score-value", children: [Math.round(compliance.overallCompliance), "%"] }) }), _jsxs("div", { className: "score-info", children: [_jsx("div", { className: "score-label", children: getSemaforoLabel(compliance.semaforo) }), _jsx("div", { className: "score-description", children: getSemaforoDescription(compliance.semaforo) })] })] }), compliance.hallazgosCount > 0 && (_jsxs("div", { className: "hallazgos-info", children: [_jsx("span", { className: "hallazgo-icon", children: "\u26A0\uFE0F" }), _jsxs("span", { className: "hallazgo-count", children: [compliance.hallazgosCount, " incumplimiento", compliance.hallazgosCount !== 1 ? 's' : ''] })] })), compliance.perStandardMetrics.length > 0 && (_jsxs("div", { className: "top-standards", children: [_jsx("h4", { children: "Principales Est\u00E1ndares" }), _jsx("div", { className: "standards-list", children: topThreeStandards.map(std => (_jsxs("div", { className: "standard-item", children: [_jsx("span", { className: `standard-dot semaforo-${std.color}` }), _jsxs("span", { className: "standard-info", children: [_jsx("span", { className: "standard-code", children: std.code }), _jsxs("span", { className: "standard-percent", children: [Math.round(std.percent), "%"] })] })] }, std.code))) })] })), compliance.lastAssessmentDate && (_jsxs("div", { className: "assessment-date", children: ["Evaluaci\u00F3n: ", new Date(compliance.lastAssessmentDate).toLocaleDateString('es-CO')] })), _jsx("div", { className: "card-footer", children: _jsx("button", { className: "view-details-btn", children: "Ver Detalles \u2192" }) })] }));
};
export default LocationComplianceCard;
//# sourceMappingURL=LocationComplianceCard.js.map