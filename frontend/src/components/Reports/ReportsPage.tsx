/**
 * Reports Page
 * Professional interface for generating PDF and Excel compliance reports
 */

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ReportsPage.css';

interface ReportsPageProps {
  providerId: string;
  providerName: string;
}

interface ReportSummary {
  provider: {
    legal_name: string;
    rut: string;
    city: string;
    department: string;
  };
  generatedAt: string;
  metrics: {
    totalFindings: number;
    openFindings: number;
    inProgressFindings: number;
    resolvedFindings: number;
    closedFindings: number;
    overdueFindings: number;
    averageRiskScore: number;
    compliancePercentage: number;
  };
  documentCompliance?: {
    totalRequired: number;
    compliantCount: number;
    expiredCount: number;
    pendingCount: number;
    compliancePercentage: number;
  };
  topFindings: Array<{
    title: string;
    severity: string;
    riskScore: number;
    status: string;
    daysOverdue: number;
  }>;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ providerId, providerName }) => {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<'pdf' | 'xlsx' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/providers/${providerId}/reports/summary`);
        setSummary(res.data.data);
        setError(null);
      } catch (err) {
        console.error('Failed to load summary', err);
        setError('No se pudo cargar el resumen del reporte');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [providerId]);

  const handleDownload = async (format: 'pdf' | 'xlsx') => {
    try {
      setDownloading(format);
      const res = await axios.get(
        `/api/providers/${providerId}/reports/compliance.${format}`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_cumplimiento_${providerId}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('success', `Reporte ${format.toUpperCase()} descargado correctamente`);
    } catch (err) {
      const msg = axios.isAxiosError(err) && err.response?.data?.error
        ? err.response.data.error
        : `Error al generar reporte ${format.toUpperCase()}`;
      showToast('error', msg);
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <div className="reports-page reports-loading">
        <div className="reports-spinner" />
        <p>Cargando datos del reporte...</p>
      </div>
    );
  }

  const compliance = summary?.metrics.compliancePercentage ?? 0;
  const complianceColor = compliance >= 80 ? '#00875a' : compliance >= 50 ? '#ff8b00' : '#de350b';
  const complianceLabel = compliance >= 80 ? 'Cumplimiento Alto' : compliance >= 50 ? 'Cumplimiento Parcial' : 'Cumplimiento Bajo';

  return (
    <div className="reports-page">
      {/* === HEADER === */}
      <header className="reports-header">
        <div>
          <h1 className="reports-title">Reportes de Cumplimiento</h1>
          <p className="reports-subtitle">
            {providerName} · Genera reportes ejecutivos según Norma 3100
          </p>
        </div>
      </header>

      {error && (
        <div className="reports-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {/* === PREVIEW CARD === */}
      {summary && (
        <section className="report-preview">
          <div className="preview-header">
            <h2>Vista Previa</h2>
            <span className="preview-date">
              Datos al {new Date(summary.generatedAt).toLocaleDateString('es-CO', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>

          {/* Big compliance number */}
          <div className="preview-hero">
            <div className="hero-compliance">
              <div className="hero-label">Cumplimiento General</div>
              <div className="hero-value" style={{ color: complianceColor }}>
                {Math.round(compliance)}%
              </div>
              <div className="hero-tag" style={{ color: complianceColor, background: `${complianceColor}15` }}>
                {complianceLabel}
              </div>
            </div>
            <div className="hero-divider" />
            <div className="hero-risk">
              <div className="hero-label">Riesgo Promedio</div>
              <div className="hero-value-sm">{Math.round(summary.metrics.averageRiskScore)}</div>
              <div className="hero-hint">/ 100</div>
            </div>
          </div>

          {/* Metrics breakdown */}
          <div className="preview-metrics">
            <div className="metric-box">
              <div className="metric-value">{summary.metrics.totalFindings}</div>
              <div className="metric-label">Total Hallazgos</div>
            </div>
            <div className="metric-box">
              <div className="metric-value" style={{ color: '#de350b' }}>
                {summary.metrics.openFindings}
              </div>
              <div className="metric-label">Abiertos</div>
            </div>
            <div className="metric-box">
              <div className="metric-value" style={{ color: '#0052cc' }}>
                {summary.metrics.inProgressFindings}
              </div>
              <div className="metric-label">En Progreso</div>
            </div>
            <div className="metric-box">
              <div className="metric-value" style={{ color: '#00875a' }}>
                {summary.metrics.resolvedFindings + summary.metrics.closedFindings}
              </div>
              <div className="metric-label">Resueltos</div>
            </div>
            <div className="metric-box">
              <div className="metric-value" style={{ color: '#ff8b00' }}>
                {summary.metrics.overdueFindings}
              </div>
              <div className="metric-label">Vencidos</div>
            </div>
          </div>

          {/* Document compliance (if available) */}
          {summary.documentCompliance && (
            <div className="preview-docs">
              <h3>Matriz Documental</h3>
              <div className="docs-stats">
                <div className="doc-stat">
                  <span>Requeridos</span>
                  <strong>{summary.documentCompliance.totalRequired}</strong>
                </div>
                <div className="doc-stat">
                  <span>Conformes</span>
                  <strong style={{ color: '#00875a' }}>{summary.documentCompliance.compliantCount}</strong>
                </div>
                <div className="doc-stat">
                  <span>Vencidos</span>
                  <strong style={{ color: '#de350b' }}>{summary.documentCompliance.expiredCount}</strong>
                </div>
                <div className="doc-stat">
                  <span>Pendientes</span>
                  <strong style={{ color: '#6b778c' }}>{summary.documentCompliance.pendingCount}</strong>
                </div>
                <div className="doc-stat doc-stat-highlight">
                  <span>Cumplimiento Doc.</span>
                  <strong style={{ color: '#0052cc' }}>
                    {Math.round(summary.documentCompliance.compliancePercentage)}%
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* Top findings preview */}
          {summary.topFindings.length > 0 && (
            <div className="preview-findings">
              <h3>Hallazgos Prioritarios ({summary.topFindings.length})</h3>
              <ul className="findings-list">
                {summary.topFindings.slice(0, 5).map((f, i) => (
                  <li key={i} className="finding-item">
                    <span
                      className={`sev-dot sev-${f.severity}`}
                      aria-label={f.severity}
                    />
                    <div className="finding-title">{f.title}</div>
                    <div className="finding-risk">{Math.round(f.riskScore)}</div>
                  </li>
                ))}
              </ul>
              {summary.topFindings.length > 5 && (
                <div className="findings-more">
                  +{summary.topFindings.length - 5} hallazgos adicionales en el reporte completo
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* === DOWNLOAD CARDS === */}
      <section className="reports-downloads">
        <h2>Descargar Reportes</h2>
        <div className="download-grid">
          {/* PDF CARD */}
          <div className="download-card download-pdf">
            <div className="download-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <h3>Reporte PDF</h3>
            <p>Documento ejecutivo listo para imprimir o enviar por correo electrónico</p>
            <ul className="download-features">
              <li>Encabezado corporativo</li>
              <li>Métricas con código de color</li>
              <li>Tabla de hallazgos prioritarios</li>
              <li>Matriz documental</li>
              <li>Pie con paginación</li>
            </ul>
            <button
              className="btn-download btn-download-pdf"
              onClick={() => handleDownload('pdf')}
              disabled={!!downloading}
            >
              {downloading === 'pdf' ? (
                <>
                  <span className="btn-spinner" />
                  Generando...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Descargar PDF
                </>
              )}
            </button>
          </div>

          {/* EXCEL CARD */}
          <div className="download-card download-xlsx">
            <div className="download-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="8" y1="13" x2="16" y2="13" />
                <line x1="8" y1="17" x2="16" y2="17" />
                <line x1="12" y1="13" x2="12" y2="21" />
              </svg>
            </div>
            <h3>Reporte Excel</h3>
            <p>Workbook multi-hoja para análisis avanzado y manipulación de datos</p>
            <ul className="download-features">
              <li>Hoja "Resumen Ejecutivo"</li>
              <li>Hoja "Hallazgos" con auto-filtro</li>
              <li>Hoja "Metadatos"</li>
              <li>Formato condicional por severidad</li>
              <li>Datos listos para tablas dinámicas</li>
            </ul>
            <button
              className="btn-download btn-download-xlsx"
              onClick={() => handleDownload('xlsx')}
              disabled={!!downloading}
            >
              {downloading === 'xlsx' ? (
                <>
                  <span className="btn-spinner" />
                  Generando...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Descargar Excel
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* === TOAST === */}
      {toast && (
        <div className={`reports-toast reports-toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
