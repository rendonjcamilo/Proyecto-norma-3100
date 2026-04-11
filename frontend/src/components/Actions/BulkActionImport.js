import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Bulk Action Import Component
 * CSV file upload and import for creating multiple corrective actions
 * Format: provider_id, location_id, action_description, assigned_to, due_date
 */
import { useState, useRef } from 'react';
import './BulkActionImport.css';
export const BulkActionImport = ({ onImport, onClose, loading = false, }) => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState([]);
    const [importing, setImporting] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
    const parseCSV = (text) => {
        const lines = text.split('\n').filter(line => line.trim());
        const rows = [];
        // Skip header row if present
        const startRow = lines[0].toLowerCase().includes('provider_id') ? 1 : 0;
        for (let i = startRow; i < lines.length; i++) {
            const parts = lines[i]
                .split(',')
                .map(p => p.trim())
                .filter(p => p);
            if (parts.length >= 5) {
                rows.push({
                    provider_id: parts[0],
                    location_id: parts[1],
                    action_description: parts[2],
                    assigned_to: parts[3],
                    due_date: parts[4],
                });
            }
        }
        return rows;
    };
    const handleFileSelect = async (selectedFile) => {
        if (!selectedFile)
            return;
        setError(null);
        setResults(null);
        setFile(selectedFile);
        try {
            const text = await selectedFile.text();
            const parsed = parseCSV(text);
            if (parsed.length === 0) {
                setError('El archivo CSV no contiene filas válidas');
                setPreview([]);
                return;
            }
            setPreview(parsed);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Error al leer el archivo');
            setPreview([]);
        }
    };
    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0];
        handleFileSelect(selectedFile || null);
    };
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile?.type === 'text/csv' || droppedFile?.name.endsWith('.csv')) {
            handleFileSelect(droppedFile);
        }
        else {
            setError('Por favor, sube un archivo CSV válido');
        }
    };
    const handleImport = async () => {
        if (preview.length === 0) {
            setError('No hay acciones para importar');
            return;
        }
        try {
            setImporting(true);
            setError(null);
            const importResults = await onImport(preview);
            setResults(importResults);
            const successCount = importResults.filter(r => r.status === 'success').length;
            const errorCount = importResults.filter(r => r.status === 'error').length;
            if (errorCount === 0) {
                setError(null);
            }
            else if (successCount === 0) {
                setError(`Error: ${errorCount} filas fallaron. Revisa los detalles abajo.`);
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Error al importar acciones');
        }
        finally {
            setImporting(false);
        }
    };
    const downloadTemplate = () => {
        const template = 'provider_id,location_id,action_description,assigned_to,due_date\n' +
            'prov-001,loc-001,Implementar nuevo sistema de backup,engineer@hospital.com,2026-05-10\n' +
            'prov-001,loc-002,Actualizar certificaciones del personal,hr@hospital.com,2026-05-15\n' +
            'prov-002,loc-003,Mejorar protocolos de seguridad,security@clinic.com,2026-05-20';
        const blob = new Blob([template], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla-acciones.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };
    return (_jsxs("div", { className: "bulk-action-import", children: [_jsxs("div", { className: "import-header", children: [_jsx("h3", { children: "Importar Acciones Correctivas en Lote" }), _jsx("p", { className: "import-subtitle", children: "Carga un archivo CSV con m\u00FAltiples acciones para asignarlas r\u00E1pidamente" })] }), results === null ? (_jsxs(_Fragment, { children: [error && (_jsxs("div", { className: "import-error", children: [_jsx("strong", { children: "Error:" }), " ", error] })), _jsxs("div", { className: "csv-upload-zone", onDragOver: e => e.preventDefault(), onDrop: handleDrop, children: [_jsx("input", { ref: fileInputRef, type: "file", accept: ".csv", onChange: handleFileChange, disabled: importing, className: "csv-input" }), _jsx("span", { className: "upload-icon", children: "\uD83D\uDCCB" }), _jsxs("p", { children: ["Arrastra un archivo CSV aqu\u00ED o", ' ', _jsx("button", { type: "button", className: "browse-link", onClick: () => fileInputRef.current?.click(), disabled: importing, children: "selecciona" })] })] }), _jsxs("div", { className: "csv-help", children: [_jsx("h4", { children: "Formato del archivo CSV:" }), _jsx("p", { children: "Columnas requeridas (en orden):" }), _jsxs("ul", { children: [_jsxs("li", { children: [_jsx("strong", { children: "provider_id" }), " - ID del proveedor"] }), _jsxs("li", { children: [_jsx("strong", { children: "location_id" }), " - ID de la ubicaci\u00F3n"] }), _jsxs("li", { children: [_jsx("strong", { children: "action_description" }), " - Descripci\u00F3n de la acci\u00F3n"] }), _jsxs("li", { children: [_jsx("strong", { children: "assigned_to" }), " - Email del responsable"] }), _jsxs("li", { children: [_jsx("strong", { children: "due_date" }), " - Fecha vencimiento (YYYY-MM-DD)"] })] }), _jsx("button", { type: "button", className: "download-template", onClick: downloadTemplate, children: "\u2B07\uFE0F Descargar plantilla" })] }), preview.length > 0 && (_jsxs("div", { className: "preview-section", children: [_jsxs("h4", { children: ["Vista Previa (", preview.length, " acciones)"] }), _jsxs("div", { className: "preview-table", children: [_jsxs("div", { className: "preview-header", children: [_jsx("div", { className: "col-provider", children: "Proveedor" }), _jsx("div", { className: "col-location", children: "Ubicaci\u00F3n" }), _jsx("div", { className: "col-description", children: "Descripci\u00F3n" }), _jsx("div", { className: "col-assigned", children: "Asignado a" }), _jsx("div", { className: "col-due", children: "Vencimiento" })] }), _jsxs("div", { className: "preview-body", children: [preview.slice(0, 10).map((row, idx) => (_jsxs("div", { className: "preview-row", children: [_jsx("div", { className: "col-provider", children: row.provider_id }), _jsx("div", { className: "col-location", children: row.location_id }), _jsx("div", { className: "col-description", children: row.action_description }), _jsx("div", { className: "col-assigned", children: row.assigned_to }), _jsx("div", { className: "col-due", children: row.due_date })] }, idx))), preview.length > 10 && (_jsxs("div", { className: "preview-more", children: ["... y ", preview.length - 10, " acciones m\u00E1s"] }))] })] }), _jsxs("div", { className: "import-actions", children: [_jsx("button", { type: "button", className: "btn-import", onClick: handleImport, disabled: importing, children: importing ? 'Importando...' : `Importar ${preview.length} Acciones` }), _jsx("button", { type: "button", className: "btn-cancel", onClick: () => {
                                            setFile(null);
                                            setPreview([]);
                                            setError(null);
                                            if (fileInputRef.current)
                                                fileInputRef.current.value = '';
                                        }, disabled: importing, children: "Cancelar" })] })] }))] })) : (_jsxs("div", { className: "import-results", children: [_jsx("h4", { children: "Resultados de Importaci\u00F3n" }), _jsxs("div", { className: "results-summary", children: [_jsxs("div", { className: "summary-item success", children: [_jsx("span", { className: "summary-count", children: results.filter(r => r.status === 'success').length }), _jsx("span", { className: "summary-label", children: "Importadas" })] }), _jsxs("div", { className: "summary-item error", children: [_jsx("span", { className: "summary-count", children: results.filter(r => r.status === 'error').length }), _jsx("span", { className: "summary-label", children: "Errores" })] })] }), results.some(r => r.status === 'error') && (_jsxs("div", { className: "error-details", children: [_jsx("h5", { children: "Errores:" }), _jsx("ul", { className: "error-list", children: results
                                    .filter(r => r.status === 'error')
                                    .map((result, idx) => (_jsxs("li", { children: [_jsxs("strong", { children: ["Fila ", result.row_number, ":"] }), " ", result.message] }, idx))) })] })), _jsx("div", { className: "results-actions", children: _jsx("button", { type: "button", className: "btn-close", onClick: onClose, children: "Cerrar" }) })] }))] }));
};
export default BulkActionImport;
//# sourceMappingURL=BulkActionImport.js.map