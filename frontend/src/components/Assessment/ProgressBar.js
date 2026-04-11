import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import './ProgressBar.css';
const ProgressBar = ({ completed, total, showLabel = true }) => {
    const percent = total > 0 ? (completed / total) * 100 : 0;
    const getProgressColor = (p) => {
        if (p >= 80)
            return 'progress-verde';
        if (p >= 50)
            return 'progress-naranja';
        return 'progress-rojo';
    };
    return (_jsxs("div", { className: "progress-bar-container", children: [showLabel && (_jsxs("div", { className: "progress-label", children: [_jsx("span", { className: "label-text", children: "Progreso de la evaluaci\u00F3n:" }), _jsxs("span", { className: "label-count", children: [completed, "/", total, " criterios respondidos"] })] })), _jsx("div", { className: "progress-bar", children: _jsx("div", { className: `progress-fill ${getProgressColor(percent)}`, style: { width: `${percent}%` }, children: _jsxs("span", { className: "progress-percent", children: [Math.round(percent), "%"] }) }) }), !showLabel && (_jsxs("span", { className: "progress-text", children: [completed, "/", total] }))] }));
};
export default ProgressBar;
//# sourceMappingURL=ProgressBar.js.map