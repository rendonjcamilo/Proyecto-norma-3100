/**
 * Reports Page
 * Professional interface for generating PDF and Excel compliance reports
 */

import React, { useEffect, useState } from 'react';
import { reportsApi, assessmentsApi, downloadBlob, Assessment, providersApi, Provider } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './ReportsPage.css';
import '../../pages/Pages.css';

const VERSION_LABELS: Record<string, string> = {
  initial: 'Autoevaluación Inicial',
  year4: 'Evaluación a los 4 Años',
  annual: 'Evaluación Anual',
  'pre-novelty': 'Pre-Novedad',
};

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
  const { user } = useAuth();
  const isAuditor = user?.role === 'auditor';
  const isSuperAdmin = user?.role === 'super_admin';
  const canDownloadAuditReport = isAuditor || isSuperAdmin;

  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<'pdf' | 'xlsx' | 'auditoria-pdf' | 'auditoria-docx' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [completedAssessments, setCompletedAssessments] = useState<Assessment[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | undefined>(undefined);
  const [providers, setProviders] = useState<Provider[]>([]);
  // Para auditors: permitir cambiar de prestador. Para otros: usar el preseleccionado
  const [selectedProviderId, setSelectedProviderId] = useState<string>(isAuditor ? "" : (providerId || ""));

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        // Si no hay providerId, cargar lista de prestadores
        if (!selectedProviderId) {
          const providersRes = await providersApi.list();
          setProviders(providersRes.data || []);
          setLoading(false);
          return;
        }

        const [summaryRes, assessmentsRes] = await Promise.all([
          reportsApi.getSummary(selectedProviderId),
          assessmentsApi.listByProvider(selectedProviderId),
        ]);
        setSummary(summaryRes.data as ReportSummary);

        // Filtrar evaluaciones completadas (submitted o completed)
        const completed = (assessmentsRes.data || []).filter(
          (a: Assessment) => a.status === 'submitted' || a.status === 'completed'
        );
        setCompletedAssessments(completed);
        if (completed.length > 0) {
          setSelectedAssessmentId(completed[0].id);
        }

        setError(null);
      } catch (err) {
        console.error('Failed to load summary', err);
        setError('No se pudo cargar el resumen del reporte');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedProviderId]);

  const handleDownload = async (format: 'pdf' | 'xlsx') => {
    try {
      setDownloading(format);
      const blob = format === 'pdf'
        ? await reportsApi.downloadCompliancePdf(selectedProviderId)
        : await reportsApi.downloadComplianceExcel(selectedProviderId);
      downloadBlob(blob, `reporte_cumplimiento_${selectedProviderId}.${format}`);
      showToast('success', `Reporte ${format.toUpperCase()} descargado correctamente`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : `Error al generar reporte ${format.toUpperCase()}`;
      showToast('error', msg);
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadAuditoria = async (format: 'pdf' | 'docx' = 'pdf') => {
    try {
      const downloadState = format === 'pdf' ? 'auditoria-pdf' : 'auditoria-docx';
      setDownloading(downloadState);

      const blob =
        format === 'pdf'
          ? await reportsApi.downloadAuditReportPdf(selectedProviderId, selectedAssessmentId)
          : await reportsApi.downloadAuditReportDocx(selectedProviderId, selectedAssessmentId);

      const ext = format === 'pdf' ? 'pdf' : 'docx';
      downloadBlob(blob, `informe_auditoria_${selectedProviderId}.${ext}`);
      showToast('success', `Informe de Auditoría (${ext.toUpperCase()}) descargado correctamente`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al generar informe de auditoría';
      showToast('error', msg);
    } finally {
      setDownloading(null);
    }
  };

  // Si no hay prestador seleccionado, mostrar selector
  if (!selectedProviderId || selectedProviderId.length === 0) {
    if (loading) {
      return (
        <div className="reports-page reports-loading">
          <div className="reports-spinner" />
          <p>Cargando prestadores...</p>
        </div>
      );
    }
    return (
      <div className="reports-page">
        <div className="aud-hero">
          <div className="aud-hero-content">
            <span className="aud-hero-badge">
              <svg width="6" height="6" viewBox="0 0 6 6" fill="none"><circle cx="3" cy="3" r="3" fill="#818cf8"/></svg>
              Auditoría
            </span>
            <h1 className="aud-hero-title">Reportes de Cumplimiento</h1>
            <p className="aud-hero-subtitle">Selecciona un prestador para generar reportes</p>
          </div>
          <div className="aud-hero-orb" />
        </div>

        <section style={{ padding: '40px 20px' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: '#1e1b4b' }}>
              Selecciona un prestador:
            </label>
            <select
              value={selectedProviderId}
              onChange={(e) => setSelectedProviderId(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit',
                marginBottom: '24px',
                outline: 'none',
                boxShadow: '0 1px 4px rgba(99,102,241,0.08)',
              }}
            >
              <option value="">-- Selecciona prestador --</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.legal_name || p.legalName} (RUT: {p.rut})
                </option>
              ))}
            </select>
          </div>
        </section>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="reports-page reports-loading">
        <div className="reports-spinner" />
        <p>Cargando datos del reporte...</p>
      </div>
    );
  }

  const compliance = summary?.metrics.compliancePercentage ?? 0;
  const complianceColor = compliance >= 80 ? '#059669' : compliance >= 50 ? '#d97706' : '#dc2626';
  const complianceLabel = compliance >= 80 ? 'Cumplimiento Alto' : compliance >= 50 ? 'Cumplimiento Parcial' : 'Cumplimiento Bajo';

  return (
    <div className="reports-page">
      {/* === HEADER === */}
      <div className="aud-hero">
        <div className="aud-hero-content">
          <span className="aud-hero-badge">
            <svg width="6" height="6" viewBox="0 0 6 6" fill="none"><circle cx="3" cy="3" r="3" fill="#818cf8"/></svg>
            Auditoría
          </span>
          <h1 className="aud-hero-title">Reportes de Cumplimiento</h1>
          <p className="aud-hero-subtitle">{providerName} · Genera reportes ejecutivos según Norma 3100</p>
        </div>
        <div className="aud-hero-orb" />
      </div>

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
              <div className="metric-value" style={{ color: '#6366f1' }}>
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
                  <strong style={{ color: '#6366f1' }}>
                    {Math.round(summary.documentCompliance.compliancePercentage)}%
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* Top findings preview */}
          {(summary.topFindings ?? []).length > 0 && (
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

          {/* INFORME DE AUDITORÍA OFICIAL (solo para auditor/super_admin) */}
          {canDownloadAuditReport && (
            <div className="download-card" style={{ borderLeft: '4px solid #6366f1' }}>
              <div className="download-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                  <rect x="9" y="3" width="6" height="4" rx="1" />
                  <line x1="9" y1="12" x2="15" y2="12" />
                  <line x1="9" y1="16" x2="13" y2="16" />
                </svg>
              </div>
              <h3>Informe de Auditoría Oficial</h3>
              <p>Formato oficial de verificación de condiciones de habilitación según Resolución 3100 de 2019</p>

              {/* Selector de evaluación */}
              {completedAssessments.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: '#1e1b4b' }}>
                    Selecciona una evaluación completada:
                  </label>
                  <select
                    value={selectedAssessmentId || ''}
                    onChange={(e) => setSelectedAssessmentId(e.target.value || undefined)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid rgba(99,102,241,0.3)',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      boxShadow: '0 1px 3px rgba(99,102,241,0.07)',
                    }}
                  >
                    <option value="">-- Selecciona evaluación --</option>
                    {completedAssessments.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title || VERSION_LABELS[a.assessment_version] || 'Evaluación'} — {new Date(a.created_at).toLocaleDateString('es-CO')} (
                        {a.compliance_percent || a.compliance_percentage || 0}%)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <ul className="download-features">
                <li>3 condiciones de habilitación</li>
                <li>Resultados por estándar (TSTH · TSINF · TSDOT · TSMD · TSPP · TSHCR · TSINT)</li>
                <li>Hallazgos organizados por estándar</li>
              </ul>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn-download"
                  style={{ background: '#6366f1', flex: 1 }}
                  onClick={() => handleDownloadAuditoria('docx')}
                  disabled={!!downloading}
                >
                  {downloading === 'auditoria-docx' ? (
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
                      Word
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

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
            <p>Libro de trabajo multi-hoja para análisis avanzado y manipulación de datos</p>
            <ul className="download-features">
              <li>Hoja &quot;Resumen Ejecutivo&quot;</li>
              <li>Hoja &quot;Hallazgos&quot; con auto-filtro</li>
              <li>Hoja &quot;Metadatos&quot;</li>
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
