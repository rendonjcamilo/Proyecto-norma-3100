import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import './ComplianceCharts.css';
export const ComplianceCharts = ({ data }) => {
    // Calculate average compliance
    const avgCompliance = data.reduce((sum, loc) => sum + loc.overallCompliance, 0) / data.length;
    // Get all unique standards and aggregate data
    const allStandardCodes = new Set();
    data.forEach(loc => {
        loc.perStandardMetrics.forEach(std => {
            allStandardCodes.add(std.code);
        });
    });
    const standardAverages = Array.from(allStandardCodes)
        .map(code => {
        const standards = data
            .flatMap(loc => loc.perStandardMetrics)
            .filter(std => std.code === code);
        const avgPercent = standards.reduce((sum, std) => sum + std.percent, 0) / standards.length;
        const getSemaforoColor = (percent) => {
            if (percent >= 80)
                return 'verde';
            if (percent >= 50)
                return 'naranja';
            return 'rojo';
        };
        return {
            code,
            name: standards[0]?.name || code,
            percent: avgPercent,
            color: getSemaforoColor(avgPercent),
        };
    })
        .sort((a, b) => b.percent - a.percent);
    // Count locations by semáforo
    const semaforoCount = {
        verde: data.filter(loc => loc.semaforo === 'verde').length,
        naranja: data.filter(loc => loc.semaforo === 'naranja').length,
        rojo: data.filter(loc => loc.semaforo === 'rojo').length,
    };
    return (_jsxs("div", { className: "compliance-charts", children: [_jsx("h2", { children: "An\u00E1lisis Comparativo" }), _jsxs("div", { className: "charts-grid", children: [_jsxs("div", { className: "chart-card average-card", children: [_jsx("h3", { children: "Cumplimiento Promedio" }), _jsxs("div", { className: "chart-content", children: [_jsx("div", { className: "large-percentage", children: _jsxs("span", { className: "value", children: [Math.round(avgCompliance), "%"] }) }), _jsxs("p", { className: "description", children: ["Promedio de todas las ", data.length, " ubicaci\u00F3n", data.length !== 1 ? 'es' : ''] })] })] }), _jsxs("div", { className: "chart-card semaforo-distribution", children: [_jsx("h3", { children: "Distribuci\u00F3n por Estado" }), _jsxs("div", { className: "distribution-grid", children: [_jsxs("div", { className: "distribution-item", children: [_jsxs("div", { className: "distribution-bar", children: [_jsx("div", { className: "bar-label", children: "Verde" }), _jsx("div", { className: "bar-value", children: semaforoCount.verde })] }), _jsx("div", { className: "bar-visual verde", style: {
                                                    height: `${(semaforoCount.verde / data.length) * 100}%`,
                                                    minHeight: '20px',
                                                } })] }), _jsxs("div", { className: "distribution-item", children: [_jsxs("div", { className: "distribution-bar", children: [_jsx("div", { className: "bar-label", children: "Naranja" }), _jsx("div", { className: "bar-value", children: semaforoCount.naranja })] }), _jsx("div", { className: "bar-visual naranja", style: {
                                                    height: `${(semaforoCount.naranja / data.length) * 100}%`,
                                                    minHeight: '20px',
                                                } })] }), _jsxs("div", { className: "distribution-item", children: [_jsxs("div", { className: "distribution-bar", children: [_jsx("div", { className: "bar-label", children: "Rojo" }), _jsx("div", { className: "bar-value", children: semaforoCount.rojo })] }), _jsx("div", { className: "bar-visual rojo", style: {
                                                    height: `${(semaforoCount.rojo / data.length) * 100}%`,
                                                    minHeight: '20px',
                                                } })] })] })] }), _jsxs("div", { className: "chart-card location-comparison", children: [_jsx("h3", { children: "Cumplimiento por Ubicaci\u00F3n" }), _jsx("div", { className: "bars-container", children: data
                                    .sort((a, b) => b.overallCompliance - a.overallCompliance)
                                    .map(location => (_jsxs("div", { className: "bar-row", children: [_jsx("div", { className: "location-label", children: location.locationName }), _jsx("div", { className: "bar-wrapper", children: _jsx("div", { className: `bar-fill semaforo-${location.semaforo}`, style: {
                                                    width: `${location.overallCompliance}%`,
                                                }, children: _jsxs("span", { className: "bar-text", children: [Math.round(location.overallCompliance), "%"] }) }) })] }, location.locationId))) })] }), _jsxs("div", { className: "chart-card top-standards", children: [_jsx("h3", { children: "Est\u00E1ndares con Mayor Cumplimiento" }), _jsx("div", { className: "standards-ranking", children: standardAverages.slice(0, 5).map((std, index) => (_jsxs("div", { className: "standard-rank", children: [_jsxs("div", { className: "rank-number", children: ["#", index + 1] }), _jsxs("div", { className: "rank-info", children: [_jsx("div", { className: "rank-name", children: std.code }), _jsx("div", { className: "rank-description", children: std.name })] }), _jsxs("div", { className: `rank-percentage semaforo-${std.color}`, children: [Math.round(std.percent), "%"] })] }, std.code))) })] }), _jsxs("div", { className: "chart-card standards-breakdown full-width", children: [_jsx("h3", { children: "Promedio por Est\u00E1ndar" }), _jsx("div", { className: "breakdown-grid", children: standardAverages.map(std => (_jsxs("div", { className: "breakdown-item", children: [_jsx("div", { className: "breakdown-label", children: std.code }), _jsx("div", { className: `breakdown-bar semaforo-${std.color}`, children: _jsx("div", { className: "breakdown-fill", style: {
                                                    width: `${std.percent}%`,
                                                } }) }), _jsxs("div", { className: "breakdown-percent", children: [Math.round(std.percent), "%"] })] }, std.code))) })] })] })] }));
};
export default ComplianceCharts;
//# sourceMappingURL=ComplianceCharts.js.map