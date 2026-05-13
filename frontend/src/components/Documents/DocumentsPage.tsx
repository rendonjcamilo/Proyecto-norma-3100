/**
 * Documents Page - Documentary Matrix
 * Professional interface for managing provider documents (Norma 3100)
 */

import React, { useEffect, useMemo, useState } from 'react';
import { documentsApi, downloadBlob } from '../../services/api';
import { useRolePermission } from '../../hooks/useRolePermission';
import { formatDate } from '@/utils/dateFormat';
import './DocumentsPage.css';
import '../../pages/Pages.css';

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
  filename: string;
  original_filename: string;
  mime_type: string;
  file_size_bytes: number;
  status: 'pending' | 'compliant' | 'expired' | 'rejected' | 'under_review';
  issue_date?: string;
  expiry_date?: string;
  version: number;
  document_name?: string;
  document_category?: string;
  computed_status?: string;
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
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const { can } = useRolePermission();

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [catalogRes, docsRes] = await Promise.all([
        documentsApi.getCatalog(),
        documentsApi.listByProvider(providerId),
      ]);
      setCatalog((catalogRes.data || []) as unknown as DocumentCatalogItem[]);
      setDocuments((docsRes.data || []) as unknown as ProviderDocument[]);
      setSummary(null);
      setMissing([]);
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

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!uploadModal) return;
    const form = event.currentTarget;
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

  const handleDownload = async (docId: string, originalName: string) => {
    try {
      const fileBlob = await documentsApi.download(docId);
      downloadBlob(fileBlob, originalName);
    } catch {
      showToast('error', 'Error al descargar el documento');
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
            Gestión Documental
          </span>
          <h1 className="aud-hero-title">Matriz Documental</h1>
          <p className="aud-hero-subtitle">{providerName} · {catalog.length} documentos en catálogo Norma 3100</p>
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
          <div className="kpi-card kpi-main">
            <div className="kpi-label">Cumplimiento Documental</div>
            <div className="kpi-value-big" style={{ color: summary.compliance_percentage >= 80 ? '#00875a' : summary.compliance_percentage >= 50 ? '#ff8b00' : '#de350b' }}>
              {Math.round(summary.compliance_percentage)}%
            </div>
            <div className="kpi-bar">
              <div
                className="kpi-bar-fill"
                style={{
                  width: `${summary.compliance_percentage}%`,
                  background: summary.compliance_percentage >= 80 ? '#00875a' : summary.compliance_percentage >= 50 ? '#ff8b00' : '#de350b',
                }}
              />
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Conformes</div>
            <div className="kpi-value" style={{ color: '#00875a' }}>
              {summary.compliant_count}
            </div>
            <div className="kpi-sublabel">de {summary.total_required} requeridos</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Vencidos</div>
            <div className="kpi-value" style={{ color: '#de350b' }}>
              {summary.expired_count}
            </div>
            <div className="kpi-sublabel">requieren acción</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Próx. a vencer</div>
            <div className="kpi-value" style={{ color: '#ff8b00' }}>
              {summary.expiring_soon_count}
            </div>
            <div className="kpi-sublabel">en 30 días</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Pendientes</div>
            <div className="kpi-value" style={{ color: '#6b778c' }}>
              {summary.pending_count}
            </div>
            <div className="kpi-sublabel">sin cargar</div>
          </div>
        </section>
      )}

      {/* === MISSING ALERT === */}
      {missing.length > 0 && (
        <div className="docs-alert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div>
            <strong>{missing.length} documentos obligatorios faltantes</strong>
            <div className="docs-alert-hint">Revisa el catálogo abajo para cargarlos</div>
          </div>
        </div>
      )}

      {/* === FILTERS === */}
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

      {/* === DOCUMENT CARDS === */}
      {filteredCatalog.length === 0 ? (
        <div className="prov-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          <h3>Sin resultados</h3>
          <p>No se encontraron documentos con los filtros aplicados</p>
        </div>
      ) : (
        <div className="prov-grid docs-grid">
          {filteredCatalog.map((item) => {
            const doc = documentsByCatalogId.get(item.id);
            const status = (doc?.computed_status || doc?.status || 'pending') as string;
            const accentColor = status === 'compliant' ? 'linear-gradient(180deg,#10b981,#34d399)'
              : status === 'expired' || status === 'rejected' ? 'linear-gradient(180deg,#ef4444,#f87171)'
              : status === 'under_review' || status === 'expiring_soon' ? 'linear-gradient(180deg,#f59e0b,#fbbf24)'
              : 'linear-gradient(180deg,#94a3b8,#cbd5e1)';
            const statusClass = status === 'compliant' ? 'prov-status-active'
              : status === 'expired' || status === 'rejected' ? 'docs-status-danger'
              : status === 'under_review' || status === 'expiring_soon' ? 'docs-status-warn'
              : 'prov-status-inactive';
            return (
              <div key={item.id} className={`prov-card docs-card${!doc ? ' docs-card-missing' : ''}`}>
                {/* Accent bar */}
                <div className="prov-card-accent" style={{ background: accentColor }} />

                {/* Top row */}
                <div className="prov-card-top">
                  <div className="prov-card-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                  </div>
                  <span className={`prov-status ${statusClass}`}>
                    <span className="prov-status-dot" />
                    {STATUS_LABELS[status] || status}
                  </span>
                </div>

                {/* Code + name */}
                <div className="docs-card-code">{item.code}</div>
                <div className="prov-card-name docs-card-name">{item.name}</div>

                {/* Badges */}
                <div className="docs-card-badges">
                  {item.is_mandatory && <span className="docs-badge-mandatory">Obligatorio</span>}
                </div>

                {/* Info rows */}
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

                {/* Actions */}
                <div className="prov-card-actions">
                  {doc && (
                    <button
                      className="prov-btn-edit docs-btn-action"
                      title="Descargar"
                      onClick={() => handleDownload(doc.id, doc.original_filename)}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Descargar
                    </button>
                  )}
                  {can('documents', 'create') && (
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
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* === UPLOAD MODAL === */}
      {uploadModal && (
        <div className="modal-overlay" onClick={() => setUploadModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h3>Subir Documento</h3>
              <button className="modal-close" onClick={() => setUploadModal(null)}>
                ×
              </button>
            </header>
            <div className="modal-body">
              <div className="modal-doc-info">
                <div className="modal-code">{uploadModal.code}</div>
                <div className="modal-doc-name">{uploadModal.name}</div>
                <div className="modal-doc-cat">{uploadModal.category}</div>
              </div>
              <form onSubmit={handleUpload}>
                <div className="field">
                  <label>Archivo</label>
                  <input
                    type="file"
                    name="file"
                    required
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
                  />
                  <small>PDF, imágenes o Office. Máximo 50MB.</small>
                </div>
                <div className="field-row">
                  <div className="field">
                    <label>Fecha de emisión</label>
                    <input type="date" name="issue_date" />
                  </div>
                  <div className="field">
                    <label>Fecha de vencimiento</label>
                    <input
                      type="date"
                      name="expiry_date"
                      placeholder={uploadModal.expiry_months ? 'Auto-calculada' : 'Opcional'}
                    />
                    {uploadModal.expiry_months && (
                      <small>Si no se proporciona, se calcula automáticamente (+{uploadModal.expiry_months} meses)</small>
                    )}
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setUploadModal(null)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" disabled={uploading}>
                    {uploading ? 'Subiendo...' : 'Subir documento'}
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
