/**
 * Documents Page - Documentary Matrix
 * Professional interface for managing provider documents (Norma 3100)
 */

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './DocumentsPage.css';

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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

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

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [catalogRes, docsRes, summaryRes, missingRes] = await Promise.all([
        axios.get(`/api/documents/catalog`),
        axios.get(`/api/providers/${providerId}/documents`),
        axios.get(`/api/providers/${providerId}/documents/compliance`).catch(() => ({ data: { data: null } })),
        axios.get(`/api/providers/${providerId}/documents/missing`),
      ]);
      setCatalog(catalogRes.data.data || []);
      setDocuments(docsRes.data.data || []);
      setSummary(summaryRes.data.data || null);
      setMissing(missingRes.data.data || []);
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
      await axios.post(`/api/providers/${providerId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast('success', `Documento "${uploadModal.name}" subido correctamente`);
      setUploadModal(null);
      await loadData();
    } catch (err) {
      const msg = axios.isAxiosError(err) && err.response?.data?.error
        ? err.response.data.error
        : 'Error al subir el documento';
      showToast('error', msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (docId: string, originalName: string) => {
    try {
      const res = await axios.get(`/api/documents/${docId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = originalName;
      a.click();
      window.URL.revokeObjectURL(url);
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
      <header className="docs-header">
        <div>
          <h1 className="docs-title">Matriz Documental</h1>
          <p className="docs-subtitle">
            {providerName} · {catalog.length} documentos en catálogo Norma 3100
          </p>
        </div>
        <button className="docs-btn-primary" onClick={loadData}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
          </svg>
          Refrescar
        </button>
      </header>

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

      {/* === TABLE === */}
      <section className="docs-table-wrapper">
        <table className="docs-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Documento</th>
              <th>Categoría</th>
              <th>Estado</th>
              <th>Vigencia</th>
              <th>Versión</th>
              <th className="th-actions">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredCatalog.map((item) => {
              const doc = documentsByCatalogId.get(item.id);
              const status = (doc?.computed_status || doc?.status || 'pending') as string;
              return (
                <tr key={item.id} className={!doc ? 'row-missing' : ''}>
                  <td className="cell-code">{item.code}</td>
                  <td className="cell-name">
                    <div>{item.name}</div>
                    {item.is_mandatory && <span className="badge-mandatory">Obligatorio</span>}
                  </td>
                  <td className="cell-muted">{item.category}</td>
                  <td>
                    <span
                      className="status-pill"
                      style={{
                        background: `${STATUS_COLORS[status] || '#6b778c'}15`,
                        color: STATUS_COLORS[status] || '#6b778c',
                      }}
                    >
                      {STATUS_LABELS[status] || status}
                    </span>
                  </td>
                  <td className="cell-muted">
                    {doc?.expiry_date ? formatDate(doc.expiry_date) : doc ? 'Sin vencimiento' : '—'}
                  </td>
                  <td className="cell-muted">{doc ? `v${doc.version}` : '—'}</td>
                  <td className="cell-actions">
                    {doc && (
                      <button
                        className="btn-icon"
                        title="Descargar"
                        onClick={() => handleDownload(doc.id, doc.original_filename)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </button>
                    )}
                    <button
                      className="btn-icon btn-upload"
                      title={doc ? 'Actualizar (nueva versión)' : 'Subir'}
                      onClick={() => setUploadModal(item)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredCatalog.length === 0 && (
              <tr>
                <td colSpan={7} className="cell-empty">
                  Sin resultados para los filtros aplicados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

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
