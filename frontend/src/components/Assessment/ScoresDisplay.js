import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import './ScoresDisplay.css';
const ScoresDisplay = ({ compliance, semaforo, perStandardMetrics = [], hallazgosCount = 0, }) => {
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
    return (_jsxs("div", { className: "scores-display", children: [_jsxs("div", { className: `overall-score semaforo-${semaforo}`, children: [_jsxs("div", { className: "score-value", children: [Math.round(compliance), "%"] }), _jsx("div", { className: "score-label", children: getSemaforoLabel(semaforo) }), _jsx("div", { className: "score-description", children: getSemaforoDescription(semaforo) }), hallazgosCount > 0 && (_jsxs("div", { className: "hallazgos-count", children: [hallazgosCount, " incumplimiento", hallazgosCount !== 1 ? 's' : ''] }))] }), perStandardMetrics.length > 0 && (_jsxs("div", { className: "per-standard-scores", children: [_jsx("h4", { children: "Cumplimiento por Est\u00E1ndar:" }), _jsx("div", { className: "standards-grid", children: perStandardMetrics.map((std) => (_jsxs("div", { className: `standard-score semaforo-${std.color}`, children: [_jsx("div", { className: "standard-code", children: std.code }), _jsx("div", { className: "standard-name", children: std.name }), _jsxs("div", { className: "standard-percent", children: [Math.round(std.percent), "%"] })] }, std.code))) })] }))] }));
};
export default ScoresDisplay;
//# sourceMappingURL=ScoresDisplay.js.map