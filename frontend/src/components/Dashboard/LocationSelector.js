import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import './LocationSelector.css';
export const LocationSelector = ({ locations, selectedLocationId, onChange, }) => {
    return (_jsx("select", { className: "location-selector", value: selectedLocationId || '', onChange: e => onChange(e.target.value), children: locations.length === 0 ? (_jsx("option", { value: "", children: "No hay ubicaciones disponibles" })) : (_jsxs(_Fragment, { children: [_jsx("option", { value: "", children: "-- Seleccionar una ubicaci\u00F3n --" }), locations.map(location => (_jsxs("option", { value: location.id, children: [location.name, " (", location.city, ")"] }, location.id)))] })) }));
};
export default LocationSelector;
//# sourceMappingURL=LocationSelector.js.map