/**
 * Documents Page - Matriz Documental
 * Vista para prestador: subir documentos (máx 5MB)
 * Vista para auditor: revisar, descargar y validar documentos del prestador
 */

import React, { useEffect, useMemo, useState } from 'react';
import { documentsApi, downloadBlob } from '../../services/api';
import { useRolePermission } from '../../hooks/useRolePermission';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '@/utils/dateFormat';
import './DocumentsPage.css';
import '../../pages/Pages.css';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface DocumentCatalogItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  is_mandatory: boolean;
  expiry_months?: number;
  standard_reference?: string;
}

interface ProviderDocument {
  id: string;
  provider_id: string;
  document_catalog_id: string;
  filename?: string | null;
  original_filename?: string | null;
  mime_type?: string | null;
  file_size_bytes?: number | null;
  external_url?: string | null;
  status: 'pending' | 'compliant' | 'expired' | 'rejected' | 'under_review';
  issue_date?: string;
  expiry_date?: string;
  version: number;
  document_name?: string;
  document_category?: string;
  computed_status?: string;
  validation_notes?: string;
  validated_at?: string;
}

interface ComplianceSummary {
  provider_id: string;
  provider_name: string;
  total_required: number;
  compliant_count: number;
  expired_count: number;
  expiring_soon_count: number;
  pending_count: number;
  rejected_count: number;
  compliance_percentage: number;
}

interface DocumentsPageProps {
  providerId: string;
  providerName: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  compliant: 'Conforme',
  expired: 'Vencido',
  rejected: 'Rechazado',
  under_review: 'En revisión',
  expiring_soon: 'Próx. vencer',
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#6b778c',
  compliant: '#00875a',
  expired: '#de350b',
  rejected: '#de350b',
  under_review: '#ff8b00',
  expiring_soon: '#ff8b00',
};

export const DocumentsPage: React.FC<DocumentsPageProps> = ({ providerId, providerName }) => {
  const [catalog, setCatalog] = useState<DocumentCatalogItem[]>([]);
  const [documents, setDocuments] = useState<ProviderDocument[]>([]);
  const [summary, setSummary] = useState<ComplianceSummary | null>(null);
  const [missing, setMissing] = useState<DocumentCatalogItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadModal, setUploadModal] = useState<DocumentCatalogItem | null>(null);
  const [validateModal, setValidateModal] = useState<{ doc: ProviderDocument; item: DocumentCatalogItem } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadMode, setUploadMode] = useState<'file' | 'drive'>('file');
  const [driveUrl, setDriveUrl] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const { can } = useRolePermission();
  const { user } = useAuth();

  const isAuditor = user?.role === 'auditor' || user?.role === 'super_admin';

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    if (!providerId) return;
    try {
      setLoading(true);
      const [catalogRes, docsRes, summaryRes, missingRes] = await Promise.all([
        documentsApi.getCatalog(),
        documentsApi.listByProvider(providerId),
        documentsApi.getComplianceSummary(providerId).catch(() => null),
        documentsApi.getMissingDocuments(providerId).catch(() => null),
      ]);
      setCatalog((catalogRes.data || []) as unknown as DocumentCatalogItem[]);
      setDocuments((docsRes.data || []) as unknown as ProviderDocument[]);
      if (summaryRes?.data) setSummary(summaryRes.data as unknown as ComplianceSummary);
      if (missingRes?.data) setMissing(missingRes.data as unknown as DocumentCatalogItem[]);
    } catch (err) {
      console.error('Failed to load documents', err);
      showToast('error', 'Error al cargar la matriz documental');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId]);

  const categories = useMemo(() => {
    const set = new Set(catalog.map((c) => c.category));
    return ['all', ...Array.from(set).sort()];
  }, [catalog]);

  const documentsByCatalogId = useMemo(() => {
    const map = new Map<string, ProviderDocument>();
    documents.forEach((d) => map.set(d.document_catalog_id, d));
    return map;
  }, [documents]);

  const filteredCatalog = useMemo(() => {
    return catalog.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.code.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [catalog, selectedCategory, searchQuery]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (file && file.size > MAX_FILE_SIZE) {
      setFileError(`El archivo supera el límite de 5MB (tamaño actual: ${(file.size / 1024 / 1024).toFixed(1)}MB)`);
      e.target.value = '';
    }
  };

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!uploadModal) return;
    const form = event.currentTarget;
    const fileInput = form.querySelector<HTMLInputElement>('input[type="file"]');
    const file = fileInput?.files?.[0];

    if (!file) {
      showToast('error', 'Debes seleccionar un archivo');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      showToast('error', 'El archivo supera el límite de 5MB');
      return;
    }

    const formData = new FormData(form);
    formData.append('document_catalog_id', uploadModal.id);

    try {
      setUploading(true);
      await documentsApi.upload(providerId, formData);
      showToast('success', `Documento "${uploadModal.name}" subido correctamente`);
      setUploadModal(null);
      await loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al subir el documento';
      showToast('error', msg);
    } finally {
      setUploading(false);
    }
  };

  const handleLinkDrive = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!uploadModal) return;

    const url = driveUrl.trim();
    let host = '';
    try { host = new URL(url).hostname; } catch { /* inválida */ }
    if (host !== 'drive.google.com' && host !== 'docs.google.com') {
      showToast('error', 'Solo se aceptan enlaces de Google Drive o Google Docs');
      return;
    }

    const form = event.currentTarget;
    const issueDateEl = form.querySelector<HTMLInputElement>('input[name="issue_date"]');
    const expiryDateEl = form.querySelector<HTMLInputElement>('input[name="expiry_date"]');

    try {
      setUploading(true);
      await documentsApi.linkExternal(providerId, {
        document_catalog_id: uploadModal.id,
        external_url: url,
        issue_date: issueDateEl?.value || undefined,
        expiry_date: expiryDateEl?.value || undefined,
      });
      showToast('success', `Documento "${uploadModal.name}" enlazado desde Drive`);
      setUploadModal(null);
      setDriveUrl('');
      setUploadMode('file');
      await loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar el enlace';
      showToast('error', msg);
    } finally {
      setUploading(false);
    }
  };

  const resetUploadModal = () => {
    setUploadModal(null);
    setFileError(null);
    setDriveUrl('');
    setUploadMode('file');
  };

  const handleDownload = async (docId: string, originalName: string) => {
    try {
      const fileBlob = await documentsApi.download(docId);
      downloadBlob(fileBlob, originalName);
    } catch {
      showToast('error', 'Error al descargar el documento');
    }
  };

  const handleValidate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateModal) return;
    const form = event.currentTarget;
    const statusEl = form.querySelector<HTMLSelectElement>('select[name="status"]');
    const notesEl = form.querySelector<HTMLTextAreaElement>('textarea[name="notes"]');
    const status = statusEl?.value as 'compliant' | 'rejected' | 'under_review' | 'pending';
    const notes = notesEl?.value || undefined;

    try {
      setValidating(true);
      await documentsApi.validate(validateModal.doc.id, status, notes);
      showToast('success', `Documento "${validateModal.item.name}" validado como ${STATUS_LABELS[status]}`);
      setValidateModal(null);
      await loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al validar el documento';
      showToast('error', msg);
    } finally {
      setValidating(false);
    }
  };

  if (loading) {
    return (
      <div className="docs-page docs-loading">
        <div className="docs-spinner" />
        <p>Cargando matriz documental...</p>
      </div>
    );
  }

  return (
    <div className="docs-page">
      {/* === HEADER === */}
      <div className="aud-hero">
        <div className="aud-hero-content">
          <span className="aud-hero-badge">
            <svg width="6" height="6" viewBox="0 0 6 6" fill="none"><circle cx="3" cy="3" r="3" fill="#818cf8"/></svg>
            {isAuditor ? 'Verificación Documental' : 'Gestión Documental'}
          </span>
          <h1 className="aud-hero-title">Gestión Documental</h1>
          <p className="aud-hero-subtitle">
            {providerName} · {catalog.length} documentos requeridos — Resolución 3100 de 2019
          </p>
        </div>
        <div className="aud-hero-actions">
          <button className="aud-hero-btn" onClick={loadData}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/>
            </svg>
            Refrescar
          </button>
        </div>
        <div className="aud-hero-orb" />
      </div>

      {/* === KPI SUMMARY === */}
      {summary && (
        <section className="docs-kpis">
          {/* Card principal */}
          <div className="kpi-card kpi-main">
            <div className="kpi-main-header">
              <div className="kpi-main-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <polyline points="9 15 11 17 15 13"/>
                </svg>
              </div>
              <div>
                <div className="kpi-main-title">Cumplimiento Documental</div>
                <div className="kpi-main-sub">Resolución 3100 de 2019</div>
              </div>
            </div>
            <div
              className="kpi-value-big"
              style={{
                color: summary.compliance_percentage >= 80 ? '#10b981'
                  : summary.compliance_percentage >= 50 ? '#f59e0b' : '#ef4444',
              }}
            >
              {Math.round(summary.compliance_percentage)}%
            </div>
            <div className="kpi-bar">
              <div
                className="kpi-bar-fill"
                style={{
                  width: `${summary.compliance_percentage}%`,
                  background: summary.compliance_percentage >= 80
                    ? 'linear-gradient(90deg,#10b981,#34d399)'
                    : summary.compliance_percentage >= 50
                    ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
                    : 'linear-gradient(90deg,#ef4444,#f87171)',
                }}
              />
            </div>
            <div className="kpi-main-footer">
              <span className="kpi-main-count">{summary.compliant_count} de {summary.total_required}</span>
              <span className="kpi-main-count-label">documentos conformes</span>
            </div>
          </div>

          {/* Conformes */}
          <div className="kpi-card kpi-stat kpi-stat-green">
            <div className="kpi-stat-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div className="kpi-stat-value">{summary.compliant_count}</div>
            <div className="kpi-stat-label">Conformes</div>
            <div className="kpi-stat-sub">de {summary.total_required} requeridos</div>
          </div>

          {/* Vencidos */}
          <div className="kpi-card kpi-stat kpi-stat-red">
            <div className="kpi-stat-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div className="kpi-stat-value">{summary.expired_count}</div>
            <div className="kpi-stat-label">Vencidos</div>
            <div className="kpi-stat-sub">requieren acción</div>
          </div>

          {/* Próx. a vencer */}
          <div className="kpi-card kpi-stat kpi-stat-orange">
            <div className="kpi-stat-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div className="kpi-stat-value">{summary.expiring_soon_count}</div>
            <div className="kpi-stat-label">Próx. a vencer</div>
            <div className="kpi-stat-sub">en los próximos 30 días</div>
          </div>

          {/* Pendientes */}
          <div className="kpi-card kpi-stat kpi-stat-indigo">
            <div className="kpi-stat-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div className="kpi-stat-value">{summary.pending_count}</div>
            <div className="kpi-stat-label">Pendientes</div>
            <div className="kpi-stat-sub">sin cargar aún</div>
          </div>
        </section>
      )}

      {/* === ALERTA DOCUMENTOS FALTANTES === */}
      {missing.length > 0 && (
        <div className="docs-alert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div>
            <strong>{missing.length} documentos obligatorios faltantes</strong>
            <div className="docs-alert-hint">
              {isAuditor ? 'El prestador aún no ha cargado estos documentos obligatorios' : 'Debes cargarlos para completar tu habilitación'}
            </div>
          </div>
        </div>
      )}

      {/* === FILTROS === */}
      <section className="docs-filters">
        <div className="search-wrapper">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por código, nombre o categoría..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="docs-search"
          />
        </div>
        <div className="chip-group">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`chip ${selectedCategory === cat ? 'chip-active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === 'all' ? 'Todas' : cat}
            </button>
          ))}
        </div>
      </section>

      {/* === TARJETAS DE DOCUMENTOS === */}
      {filteredCatalog.length === 0 ? (
        <div className="prov-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <h3>Sin resultados</h3>
          <p>No se encontraron documentos con los filtros aplicados</p>
        </div>
      ) : (
        <div className="prov-grid docs-grid">
          {filteredCatalog.map((item) => {
            const doc = documentsByCatalogId.get(item.id);
            const status = (doc?.computed_status || doc?.status || 'pending') as string;
            const accentColor = status === 'compliant'
              ? 'linear-gradient(180deg,#10b981,#34d399)'
              : status === 'expired' || status === 'rejected'
              ? 'linear-gradient(180deg,#ef4444,#f87171)'
              : status === 'under_review' || status === 'expiring_soon'
              ? 'linear-gradient(180deg,#f59e0b,#fbbf24)'
              : 'linear-gradient(180deg,#94a3b8,#cbd5e1)';
            const statusClass = status === 'compliant' ? 'prov-status-active'
              : status === 'expired' || status === 'rejected' ? 'docs-status-danger'
              : status === 'under_review' || status === 'expiring_soon' ? 'docs-status-warn'
              : 'prov-status-inactive';

            return (
              <div key={item.id} className={`prov-card docs-card${!doc ? ' docs-card-missing' : ''}`}>
                <div className="prov-card-accent" style={{ background: accentColor }} />

                <div className="prov-card-top">
                  <div className="prov-card-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                  </div>
                  <span className={`prov-status ${statusClass}`} style={{ color: STATUS_COLORS[status] || '#6b778c' }}>
                    <span className="prov-status-dot" style={{ background: STATUS_COLORS[status] || '#6b778c' }} />
                    {STATUS_LABELS[status] || status}
                  </span>
                </div>

                <div className="docs-card-code">{item.code}</div>
                <div className="prov-card-name docs-card-name">{item.name}</div>

                <div className="docs-card-badges">
                  {item.is_mandatory && <span className="docs-badge-mandatory">Obligatorio</span>}
                  {doc?.external_url && <span className="docs-badge-drive">Drive</span>}
                  {doc && doc.validation_notes && (
                    <span className="docs-badge-notes" title={doc.validation_notes}>Con observaciones</span>
                  )}
                </div>

                <div className="prov-card-info">
                  <div className="prov-info-row">
                    <span className="prov-info-label">Categoría</span>
                    <span className="prov-info-value assm-truncate">{item.category}</span>
                  </div>
                  <div className="prov-info-row">
                    <span className="prov-info-label">Vigencia</span>
                    <span className="prov-info-value">
                      {doc?.expiry_date ? formatDate(doc.expiry_date) : doc ? 'Sin vencimiento' : '—'}
                    </span>
                  </div>
                  <div className="prov-info-row">
                    <span className="prov-info-label">Versión</span>
                    <span className="prov-info-value prov-mono">{doc ? `v${doc.version}` : '—'}</span>
                  </div>
                </div>

                <div className="prov-card-actions">
                  {doc && doc.external_url && (
                    <a
                      className="prov-btn-edit docs-btn-action"
                      href={doc.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Ver en Google Drive"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                      Ver en Drive
                    </a>
                  )}
                  {doc && !doc.external_url && doc.original_filename && (
                    <button
                      className="prov-btn-edit docs-btn-action"
                      title="Descargar"
                      onClick={() => handleDownload(doc.id, doc.original_filename!)}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Descargar
                    </button>
                  )}
                  {/* Botón subir — solo para prestador */}
                  {!isAuditor && can('documents', 'create') && (
                    <button
                      className="docs-btn-upload docs-btn-action"
                      title={doc ? 'Actualizar versión' : 'Subir'}
                      onClick={() => setUploadModal(item)}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      {doc ? 'Actualizar' : 'Subir'}
                    </button>
                  )}
                  {/* Botón validar — solo para auditor */}
                  {isAuditor && doc && (
                    <button
                      className="docs-btn-validate docs-btn-action"
                      title="Validar documento"
                      onClick={() => setValidateModal({ doc, item })}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Validar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* === MODAL SUBIR DOCUMENTO (prestador) === */}
      {uploadModal && (
        <div className="modal-overlay" onClick={resetUploadModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h3>Adjuntar Documento</h3>
              <button className="modal-close" onClick={resetUploadModal}>×</button>
            </header>
            <div className="modal-body">
              <div className="modal-doc-info">
                <div className="modal-code">{uploadModal.code}</div>
                <div className="modal-doc-name">{uploadModal.name}</div>
                <div className="modal-doc-cat">{uploadModal.category}</div>
              </div>

              {/* Toggle Archivo / Drive */}
              <div className="docs-upload-tabs">
                <button
                  type="button"
                  className={`docs-upload-tab${uploadMode === 'file' ? ' docs-upload-tab-active' : ''}`}
                  onClick={() => setUploadMode('file')}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  Subir archivo
                </button>
                <button
                  type="button"
                  className={`docs-upload-tab${uploadMode === 'drive' ? ' docs-upload-tab-active' : ''}`}
                  onClick={() => setUploadMode('drive')}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  Enlace de Drive
                </button>
              </div>

              {uploadMode === 'file' ? (
                <form onSubmit={handleUpload}>
                  <div className="field">
                    <label>Archivo</label>
                    <input
                      type="file"
                      name="file"
                      required
                      accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
                      onChange={handleFileChange}
                    />
                    {fileError
                      ? <small className="docs-file-error">{fileError}</small>
                      : <small>PDF, imágenes o documentos Office. Máximo 5MB.</small>
                    }
                  </div>
                  <div className="field-row">
                    <div className="field">
                      <label>Fecha de emisión</label>
                      <input type="date" name="issue_date" />
                    </div>
                    <div className="field">
                      <label>Fecha de vencimiento</label>
                      <input type="date" name="expiry_date" />
                      {uploadModal.expiry_months && (
                        <small>Auto-calculada si no se proporciona (+{uploadModal.expiry_months} meses)</small>
                      )}
                    </div>
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={resetUploadModal}>Cancelar</button>
                    <button type="submit" className="btn-primary" disabled={uploading || !!fileError}>
                      {uploading ? 'Subiendo...' : 'Subir documento'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleLinkDrive}>
                  <div className="field">
                    <label>Enlace de Google Drive</label>
                    <input
                      type="url"
                      value={driveUrl}
                      onChange={(e) => setDriveUrl(e.target.value)}
                      placeholder="https://drive.google.com/file/d/..."
                      required
                      className="docs-drive-input"
                    />
                    <small>Pega el enlace compartido del archivo en Google Drive o Google Docs.</small>
                  </div>
                  <div className="field-row">
                    <div className="field">
                      <label>Fecha de emisión</label>
                      <input type="date" name="issue_date" />
                    </div>
                    <div className="field">
                      <label>Fecha de vencimiento</label>
                      <input type="date" name="expiry_date" />
                      {uploadModal.expiry_months && (
                        <small>Auto-calculada si no se proporciona (+{uploadModal.expiry_months} meses)</small>
                      )}
                    </div>
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={resetUploadModal}>Cancelar</button>
                    <button type="submit" className="btn-primary" disabled={uploading || !driveUrl.trim()}>
                      {uploading ? 'Guardando...' : 'Guardar enlace'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* === MODAL VALIDAR DOCUMENTO (auditor) === */}
      {validateModal && (
        <div className="modal-overlay" onClick={() => setValidateModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h3>Validar Documento</h3>
              <button className="modal-close" onClick={() => setValidateModal(null)}>×</button>
            </header>
            <div className="modal-body">
              <div className="modal-doc-info">
                <div className="modal-code">{validateModal.item.code}</div>
                <div className="modal-doc-name">{validateModal.item.name}</div>
                <div className="modal-doc-cat">{validateModal.item.category}</div>
                <div className="docs-validate-meta">
                  <span>Archivo: <strong>{validateModal.doc.original_filename}</strong></span>
                  {validateModal.doc.expiry_date && (
                    <span>Vencimiento: <strong>{formatDate(validateModal.doc.expiry_date)}</strong></span>
                  )}
                  <span>Versión: <strong>v{validateModal.doc.version}</strong></span>
                </div>
              </div>
              <form onSubmit={handleValidate}>
                <div className="field">
                  <label>Estado de validación</label>
                  <select name="status" defaultValue={validateModal.doc.status} required>
                    <option value="compliant">✅ Conforme</option>
                    <option value="under_review">⏳ En revisión</option>
                    <option value="rejected">❌ Rechazado</option>
                    <option value="pending">⚪ Pendiente</option>
                  </select>
                </div>
                <div className="field">
                  <label>Observaciones / Hallazgos</label>
                  <textarea
                    name="notes"
                    rows={3}
                    placeholder="Escribe observaciones o hallazgos sobre este documento..."
                    defaultValue={validateModal.doc.validation_notes || ''}
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setValidateModal(null)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" disabled={validating}>
                    {validating ? 'Guardando...' : 'Guardar validación'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* === TOAST === */}
      {toast && (
        <div className={`docs-toast docs-toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
