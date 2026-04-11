/**
 * Bulk Action Import Component
 * CSV file upload and import for creating multiple corrective actions
 * Format: provider_id, location_id, action_description, assigned_to, due_date
 */

import React, { useState, useRef } from 'react';
import './BulkActionImport.css';

export interface ActionImportRow {
  provider_id: string;
  location_id: string;
  action_description: string;
  assigned_to: string;
  due_date: string;
}

export interface ImportResult {
  row_number: number;
  status: 'success' | 'error';
  message: string;
}

interface BulkActionImportProps {
  onImport: (actions: ActionImportRow[]) => Promise<ImportResult[]>;
  onClose?: () => void;
  loading?: boolean;
}

export const BulkActionImport: React.FC<BulkActionImportProps> = ({
  onImport,
  onClose,
  loading = false,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ActionImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): ActionImportRow[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const rows: ActionImportRow[] = [];

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

  const handleFileSelect = async (selectedFile: File | null) => {
    if (!selectedFile) return;

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al leer el archivo');
      setPreview([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    handleFileSelect(selectedFile || null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === 'text/csv' || droppedFile?.name.endsWith('.csv')) {
      handleFileSelect(droppedFile);
    } else {
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
      } else if (successCount === 0) {
        setError(`Error: ${errorCount} filas fallaron. Revisa los detalles abajo.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al importar acciones');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template =
      'provider_id,location_id,action_description,assigned_to,due_date\n' +
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

  return (
    <div className="bulk-action-import">
      <div className="import-header">
        <h3>Importar Acciones Correctivas en Lote</h3>
        <p className="import-subtitle">
          Carga un archivo CSV con múltiples acciones para asignarlas rápidamente
        </p>
      </div>

      {results === null ? (
        <>
          {error && (
            <div className="import-error">
              <strong>Error:</strong> {error}
            </div>
          )}

          <div
            className="csv-upload-zone"
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={importing}
              className="csv-input"
            />

            <span className="upload-icon">📋</span>
            <p>
              Arrastra un archivo CSV aquí o{' '}
              <button
                type="button"
                className="browse-link"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
              >
                selecciona
              </button>
            </p>
          </div>

          <div className="csv-help">
            <h4>Formato del archivo CSV:</h4>
            <p>Columnas requeridas (en orden):</p>
            <ul>
              <li><strong>provider_id</strong> - ID del proveedor</li>
              <li><strong>location_id</strong> - ID de la ubicación</li>
              <li><strong>action_description</strong> - Descripción de la acción</li>
              <li><strong>assigned_to</strong> - Email del responsable</li>
              <li><strong>due_date</strong> - Fecha vencimiento (YYYY-MM-DD)</li>
            </ul>
            <button type="button" className="download-template" onClick={downloadTemplate}>
              ⬇️ Descargar plantilla
            </button>
          </div>

          {preview.length > 0 && (
            <div className="preview-section">
              <h4>Vista Previa ({preview.length} acciones)</h4>
              <div className="preview-table">
                <div className="preview-header">
                  <div className="col-provider">Proveedor</div>
                  <div className="col-location">Ubicación</div>
                  <div className="col-description">Descripción</div>
                  <div className="col-assigned">Asignado a</div>
                  <div className="col-due">Vencimiento</div>
                </div>
                <div className="preview-body">
                  {preview.slice(0, 10).map((row, idx) => (
                    <div key={idx} className="preview-row">
                      <div className="col-provider">{row.provider_id}</div>
                      <div className="col-location">{row.location_id}</div>
                      <div className="col-description">{row.action_description}</div>
                      <div className="col-assigned">{row.assigned_to}</div>
                      <div className="col-due">{row.due_date}</div>
                    </div>
                  ))}
                  {preview.length > 10 && (
                    <div className="preview-more">
                      ... y {preview.length - 10} acciones más
                    </div>
                  )}
                </div>
              </div>

              <div className="import-actions">
                <button
                  type="button"
                  className="btn-import"
                  onClick={handleImport}
                  disabled={importing}
                >
                  {importing ? 'Importando...' : `Importar ${preview.length} Acciones`}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setFile(null);
                    setPreview([]);
                    setError(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  disabled={importing}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="import-results">
          <h4>Resultados de Importación</h4>
          <div className="results-summary">
            <div className="summary-item success">
              <span className="summary-count">
                {results.filter(r => r.status === 'success').length}
              </span>
              <span className="summary-label">Importadas</span>
            </div>
            <div className="summary-item error">
              <span className="summary-count">
                {results.filter(r => r.status === 'error').length}
              </span>
              <span className="summary-label">Errores</span>
            </div>
          </div>

          {results.some(r => r.status === 'error') && (
            <div className="error-details">
              <h5>Errores:</h5>
              <ul className="error-list">
                {results
                  .filter(r => r.status === 'error')
                  .map((result, idx) => (
                    <li key={idx}>
                      <strong>Fila {result.row_number}:</strong> {result.message}
                    </li>
                  ))}
              </ul>
            </div>
          )}

          <div className="results-actions">
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkActionImport;
