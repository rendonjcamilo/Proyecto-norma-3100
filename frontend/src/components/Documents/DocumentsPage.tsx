/**
 * Documents Page - Matriz Documental
 * Vista para prestador: subir documentos (máx 5MB)
 * Vista para auditor: revisar, descargar y validar documentos del prestador
 */

import React, { useEffect, useMemo, useState } from 'react';
import { documentsApi, downloadBlob } from '../../services/api';
import { openOneDrivePicker } from '../../services/onedrivePicker';
import { openGoogleDrivePicker } from '../../services/googleDrivePicker';
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
  status: 'pending' | 'compliant' | 'expired' | 'rejected' | 'under_review' | 'not_applicable';
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
  not_applicable_count: number;
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
  not_applicable: 'No aplica',
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#6b778c',
  compliant: '#00875a',
  expired: '#de350b',
  rejected: '#de350b',
  under_review: '#ff8b00',
  expiring_soon: '#ff8b00',
  not_applicable: '#94a3b8',
};

export const DocumentsPage: React.FC<DocumentsPageProps> = ({ providerId, providerName }) => {
  const [catalog, setCatalog] = useState<DocumentCatalogItem[]>([]);
  const [documents, setDocuments] = useState<ProviderDocument[]>([]);
  const [summary, setSummary] = useState<ComplianceSummary | null>(null);
  const [_missing, setMissing] = useState<DocumentCatalogItem[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadModal, setUploadModal] = useState<DocumentCatalogItem | null>(null);
  const [validateModal, setValidateModal] = useState<{ doc: ProviderDocument; item: DocumentCatalogItem } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadMode, setUploadMode] = useState<'file' | 'drive'>('file');
  const [driveUrl, setDriveUrl] = useState('');
  const [pickerLoading, setPickerLoading] = useState(false);
  const [googlePickerLoading, setGooglePickerLoading] = useState(false);
  const [driveFile, setDriveFile] = useState<File | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [providerType, setProviderType] = useState<'ips' | 'independiente'>('independiente');
  const { can } = useRolePermission();
  const { user } = useAuth();

  const isAuditor = user?.role === 'auditor' || user?.role === 'super_admin';

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async (type?: 'ips' | 'independiente') => {
    if (!providerId) return;
    const currentType = type ?? providerType;
    try {
      setLoading(true);
      const [catalogRes, docsRes, summaryRes, missingRes] = await Promise.all([
        documentsApi.getCatalog(currentType),
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
  }, [providerId, providerType]);

  const CATEGORY_ORDER = providerType === 'ips'
    ? [
        'Talento Humano',
        'Historia Clínica y Registros',
        'Dotación y Mantenimiento',
        'Medicamentos, DM e Insumos',
        'Procesos Prioritarios',
        'Infraestructura',
        'Interdependencia de Servicios',
        'Condiciones Técnico-Administrativas',
        'Suficiencia Patrimonial',
        'Concepto Sanitario',
        'Reportes Obligatorios',
        'PAMEC',
      ]
    : [
        'Talento Humano',
        'Historia Clínica y Registros',
        'Dotación',
        'Medicamentos, Dispositivos e Insumos',
        'Procesos Prioritarios',
        'Infraestructura',
      ];

  const categories = useMemo(() => {
    const set = new Set(catalog.map((c) => c.category));
    return Array.from(set).sort((a, b) => {
      const ia = CATEGORY_ORDER.indexOf(a);
      const ib = CATEGORY_ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }, [catalog]);

  // Inicializar expandedCategories con la primera categoría al cargar
  useEffect(() => {
    if (categories.length > 0 && expandedCategories.size === 0) {
      setExpandedCategories(new Set([categories[0]]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  const documentsByCatalogId = useMemo(() => {
    const map = new Map<string, ProviderDocument>();
    documents.forEach((d) => map.set(d.document_catalog_id, d));
    return map;
  }, [documents]);

  const catalogByCategory = useMemo(() => {
    const map = new Map<string, DocumentCatalogItem[]>();
    const q = searchQuery.toLowerCase();
    catalog.forEach((item) => {
      if (q) {
        const match = item.code.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q);
        if (!match) { return; }
      }
      const list = map.get(item.category) || [];
      list.push(item);
      map.set(item.category, list);
    });
    return map;
  }, [catalog, searchQuery]);

  const complianceByCategory = useMemo(() => {
    const map = new Map<string, { compliant: number; total: number }>();
    catalog.forEach((item) => {
      const prev = map.get(item.category) || { compliant: 0, total: 0 };
      const doc = documentsByCatalogId.get(item.id);
      const status = doc?.computed_status || doc?.status || 'pending';
      map.set(item.category, {
        total: prev.total + 1,
        compliant: prev.compliant + (status === 'compliant' ? 1 : 0),
      });
    });
    return map;
  }, [catalog, documentsByCatalogId]);

  const filteredCatalog = useMemo(() => {
    if (!searchQuery) { return catalog; }
    const q = searchQuery.toLowerCase();
    return catalog.filter((item) =>
      item.code.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  }, [catalog, searchQuery]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) { next.delete(cat); } else { next.add(cat); }
      return next;
    });
  };

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
    const file = driveFile || fileInput?.files?.[0];

    if (!file) {
      showToast('error', 'Debes seleccionar un archivo');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      showToast('error', `El archivo supera el límite de 5MB (actual: ${(file.size / 1024 / 1024).toFixed(1)}MB)`);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_catalog_id', uploadModal.id);
    const issueDateEl = form.querySelector<HTMLInputElement>('input[name="issue_date"]');
    const expiryDateEl = form.querySelector<HTMLInputElement>('input[name="expiry_date"]');
    if (issueDateEl?.value) formData.append('issue_date', issueDateEl.value);
    if (expiryDateEl?.value) formData.append('expiry_date', expiryDateEl.value);

    try {
      setUploading(true);
      await documentsApi.upload(providerId, formData);
      showToast('success', `Documento "${uploadModal.name}" subido correctamente`);
      setUploadModal(null);
      setDriveFile(null);
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
    const allowedHosts = [
      'onedrive.live.com', '1drv.ms', 'sharepoint.com', 'onedrive.com',
      'drive.google.com', 'docs.google.com', 'sheets.google.com', 'slides.google.com',
    ];
    const isAllowed = allowedHosts.some(h => host === h || host.endsWith('.' + h));
    if (!isAllowed) {
      showToast('error', 'Solo se aceptan enlaces de Google Drive, OneDrive o SharePoint');
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
      showToast('success', `Documento "${uploadModal.name}" enlazado correctamente`);
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

  const handleToggleNotApplicable = async (item: DocumentCatalogItem, doc: ProviderDocument | undefined) => {
    try {
      await documentsApi.toggleNotApplicable(providerId, item.id);
      const isNow = doc?.status !== 'not_applicable';
      showToast('success', isNow ? `"${item.name}" marcado como No Aplica` : `"${item.name}" revertido a Pendiente`);
      await loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar estado';
      showToast('error', msg);
    }
  };

  const handleOpenGoogleDrivePicker = async () => {
    setGooglePickerLoading(true);
    try {
      const file = await openGoogleDrivePicker();
      if (file) {
        if (file.size > MAX_FILE_SIZE) {
          showToast('error', `El archivo supera el límite de 5MB (actual: ${(file.size / 1024 / 1024).toFixed(1)}MB)`);
          return;
        }
        setDriveFile(file);
        setFileError(null);
        showToast('success', `"${file.name}" listo para subir`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al abrir Google Drive';
      showToast('error', msg);
    } finally {
      setGooglePickerLoading(false);
    }
  };

  const handleOpenOneDrivePicker = async () => {
    setPickerLoading(true);
    try {
      const file = await openOneDrivePicker();
      if (file) {
        setDriveUrl(file.url);
        showToast('success', `"${file.name}" seleccionado desde OneDrive`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al abrir OneDrive';
      showToast('error', msg);
    } finally {
      setPickerLoading(false);
    }
  };

  const resetUploadModal = () => {
    setUploadModal(null);
    setFileError(null);
    setDriveUrl('');
    setDriveFile(null);
    setUploadMode('file');
  };

  const handleQuickToggle = async (item: DocumentCatalogItem, doc: ProviderDocument | undefined) => {
    if (isAuditor) {
      try {
        if (!doc) {
          // Sin archivo: crear registro conforme directamente
          await documentsApi.markCompliant(providerId, item.id);
          showToast('success', `"${item.name}" marcado como conforme`);
        } else {
          const newStatus = doc.status === 'compliant' ? 'pending' : 'compliant';
          await documentsApi.validate(doc.id, newStatus as 'compliant' | 'pending', undefined);
          showToast('success', newStatus === 'compliant' ? `"${item.name}" marcado como conforme` : `"${item.name}" marcado como pendiente`);
        }
        await loadData();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al actualizar el estado';
        showToast('error', msg);
      }
      return;
    }
    setUploadModal(item);
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
          <button className="aud-hero-btn" onClick={() => loadData()}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/>
            </svg>
            Refrescar
          </button>
        </div>
        <div className="aud-hero-orb" />
      </div>

      {/* === SELECTOR TIPO DE PRESTADOR === */}
      <div className="docs-provider-type-selector">
        <span className="docs-provider-type-label">Tipo de prestador:</span>
        <div className="docs-provider-type-options">
          <label className={`docs-provider-type-option${providerType === 'independiente' ? ' active' : ''}`}>
            <input
              type="radio"
              name="providerType"
              value="independiente"
              checked={providerType === 'independiente'}
              onChange={() => {
                setProviderType('independiente');
                setExpandedCategories(new Set());
              }}
            />
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            Profesional Independiente
            <span className="docs-provider-type-count">79 docs</span>
          </label>
          <label className={`docs-provider-type-option${providerType === 'ips' ? ' active' : ''}`}>
            <input
              type="radio"
              name="providerType"
              value="ips"
              checked={providerType === 'ips'}
              onChange={() => {
                setProviderType('ips');
                setExpandedCategories(new Set());
              }}
            />
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-4 0v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
            </svg>
            IPS
            <span className="docs-provider-type-count">108 docs</span>
          </label>
        </div>
      </div>

      {/* === KPI SUMMARY === */}
      {summary && (
        <section className="docs-kpis">
          {/* Card principal — layout horizontal */}
          <div className="kpi-card kpi-main">
            <div className="kpi-main-left">
              <div className="kpi-main-title">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <polyline points="9 15 11 17 15 13"/>
                </svg>
                Cumplimiento Documental
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
                {' '}documentos conformes
              </div>
            </div>
            <div className="kpi-main-right">
              <div
                className="kpi-value-big"
                style={{
                  color: summary.compliance_percentage >= 80 ? '#34d399'
                    : summary.compliance_percentage >= 50 ? '#fbbf24' : '#f87171',
                }}
              >
                {Math.round(summary.compliance_percentage)}%
              </div>
              <div className="kpi-main-sub">Res. 3100/2019</div>
            </div>
          </div>

          {/* Conformes */}
          <div className="kpi-card kpi-stat kpi-stat-green">
            <div className="kpi-stat-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div className="kpi-stat-body">
              <div className="kpi-stat-value">{summary.compliant_count}</div>
              <div className="kpi-stat-label">Conformes</div>
              <div className="kpi-stat-sub">de {summary.total_required} requeridos</div>
            </div>
          </div>

          {/* Vencidos */}
          <div className="kpi-card kpi-stat kpi-stat-red">
            <div className="kpi-stat-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div className="kpi-stat-body">
              <div className="kpi-stat-value">{summary.expired_count}</div>
              <div className="kpi-stat-label">Vencidos</div>
              <div className="kpi-stat-sub">requieren acción</div>
            </div>
          </div>

          {/* Próx. a vencer */}
          <div className="kpi-card kpi-stat kpi-stat-orange">
            <div className="kpi-stat-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div className="kpi-stat-body">
              <div className="kpi-stat-value">{summary.expiring_soon_count}</div>
              <div className="kpi-stat-label">Próx. vencer</div>
              <div className="kpi-stat-sub">próximos 30 días</div>
            </div>
          </div>

          {/* No Aplica */}
          {(summary.not_applicable_count || 0) > 0 && (
            <div className="kpi-card kpi-stat kpi-stat-na">
              <div className="kpi-stat-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                </svg>
              </div>
              <div className="kpi-stat-body">
                <div className="kpi-stat-value">{summary.not_applicable_count}</div>
                <div className="kpi-stat-label">No Aplica</div>
                <div className="kpi-stat-sub">excluidos del cálculo</div>
              </div>
            </div>
          )}

          {/* Pendientes */}
          <div className="kpi-card kpi-stat kpi-stat-indigo">
            <div className="kpi-stat-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div className="kpi-stat-body">
              <div className="kpi-stat-value">{
                (summary.total_required - (summary.not_applicable_count || 0))
                - summary.compliant_count
                - summary.expired_count
                - summary.expiring_soon_count
                - summary.rejected_count
              }</div>
              <div className="kpi-stat-label">Pendientes</div>
              <div className="kpi-stat-sub">sin gestionar</div>
            </div>
          </div>
        </section>
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
            placeholder="Buscar por código o nombre de documento..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="docs-search"
          />
        </div>

        <div className="docs-view-toggle">
          <button
            className={`docs-view-btn${viewMode === 'grid' ? ' docs-view-btn-active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Vista cuadrícula"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
          </button>
          <button
            className={`docs-view-btn${viewMode === 'list' ? ' docs-view-btn-active' : ''}`}
            onClick={() => setViewMode('list')}
            title="Vista lista"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </button>
        </div>
      </section>

      {/* === ACORDEÓN DE CATEGORÍAS === */}
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
        <div className="docs-accordion">
          {categories.map((cat) => {
            const catItems = (searchQuery ? (catalogByCategory.get(cat) || []) : catalog.filter(i => i.category === cat));
            if (catItems.length === 0) { return null; }
            const isExpanded = expandedCategories.has(cat) || !!searchQuery;
            const compliance = complianceByCategory.get(cat) || { compliant: 0, total: 0 };
            const pct = compliance.total > 0 ? Math.round((compliance.compliant / compliance.total) * 100) : 0;
            const barColor = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';

            return (
              <div key={cat} className={`docs-cat-group${isExpanded ? ' docs-cat-group-open' : ''}`}>
                {/* Encabezado de categoría */}
                <button
                  className="docs-cat-header"
                  onClick={() => toggleCategory(cat)}
                  type="button"
                >
                  <div className="docs-cat-header-left">
                    <svg
                      className="docs-cat-chevron"
                      style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                      width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                    >
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                    <span className="docs-cat-name">{cat}</span>
                    <span className="docs-cat-count">{catItems.length} documentos</span>
                  </div>
                  <div className="docs-cat-header-right">
                    <div className="docs-cat-progress">
                      <div className="docs-cat-progress-bar">
                        <div className="docs-cat-progress-fill" style={{ width: `${pct}%`, background: barColor }} />
                      </div>
                      <span className="docs-cat-pct" style={{ color: barColor }}>{pct}%</span>
                    </div>
                    <span className="docs-cat-stat">{compliance.compliant}/{compliance.total} conformes</span>
                  </div>
                </button>

                {/* Contenido de la categoría */}
                {isExpanded && (
                  viewMode === 'grid' ? (
                    <div className="prov-grid docs-grid docs-cat-body">
                      {catItems.map((item) => {
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
                  <button
                    className={`docs-check-btn${status === 'compliant' ? ' docs-check-ok' : status === 'rejected' || status === 'expired' ? ' docs-check-no' : status === 'under_review' || status === 'expiring_soon' ? ' docs-check-warn' : ' docs-check-empty'}`}
                    onClick={() => handleQuickToggle(item, doc)}
                    title={status === 'compliant' ? 'Conforme — clic para revertir' : !doc ? 'Sin documento — clic para subir' : 'Clic para marcar conforme'}
                  >
                    {status === 'compliant' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                    {(status === 'rejected' || status === 'expired') && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    )}
                    {(status === 'under_review' || status === 'expiring_soon') && (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    )}
                    {(status === 'pending' || !doc) && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    )}
                  </button>
                  <span className={`prov-status ${statusClass}`} style={{ color: STATUS_COLORS[status] || '#6b778c' }}>
                    <span className="prov-status-dot" style={{ background: STATUS_COLORS[status] || '#6b778c' }} />
                    {STATUS_LABELS[status] || status}
                  </span>
                </div>
                <div className="docs-card-code">{item.code}</div>
                <div className="prov-card-name docs-card-name">{item.name}</div>
                <div className="docs-card-badges">
                  {item.is_mandatory && <span className="docs-badge-mandatory">Obligatorio</span>}
                  {doc?.external_url && <span className="docs-badge-drive">OneDrive</span>}
                  {doc?.validation_notes && <span className="docs-badge-notes" title={doc.validation_notes}>Con observaciones</span>}
                </div>
                <div className="prov-card-info">
                  <div className="prov-info-row">
                    <span className="prov-info-label">Categoría</span>
                    <span className="prov-info-value assm-truncate">{item.category}</span>
                  </div>
                  <div className="prov-info-row">
                    <span className="prov-info-label">Vigencia</span>
                    <span className="prov-info-value">{doc?.expiry_date ? formatDate(doc.expiry_date) : doc ? 'Sin vencimiento' : '—'}</span>
                  </div>
                  <div className="prov-info-row">
                    <span className="prov-info-label">Versión</span>
                    <span className="prov-info-value prov-mono">{doc ? `v${doc.version}` : '—'}</span>
                  </div>
                </div>
                <div className="prov-card-actions">
                  {doc?.external_url && (
                    <a className="prov-btn-edit docs-btn-action" href={doc.external_url} target="_blank" rel="noopener noreferrer" title="Ver en OneDrive">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                      Ver en OneDrive
                    </a>
                  )}
                  {doc && !doc.external_url && doc.original_filename && (
                    <button className="prov-btn-edit docs-btn-action" title="Descargar" onClick={() => handleDownload(doc.id, doc.original_filename!)}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Descargar
                    </button>
                  )}
                  {can('documents', 'create') && (
                    <button className="docs-btn-upload docs-btn-action" title={doc ? 'Actualizar versión' : 'Subir documento'} onClick={() => setUploadModal(item)}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      {doc ? 'Actualizar' : 'Subir'}
                    </button>
                  )}
                  {isAuditor && doc && (
                    <button className="docs-btn-validate docs-btn-action" title="Validar documento" onClick={() => setValidateModal({ doc, item })}>
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
                  ) : (
                    /* ── VISTA LISTA ── */
                    <div className="docs-list-wrapper docs-cat-body">
                      <table className="docs-list-table">
                        <thead>
                          <tr>
                            <th style={{ width: 44 }}></th>
                            <th>Código</th>
                            <th>Documento</th>
                            <th>Estado</th>
                            <th>Vigencia</th>
                            <th>Ver.</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {catItems.map((item) => {
                const doc = documentsByCatalogId.get(item.id);
                const status = (doc?.computed_status || doc?.status || 'pending') as string;
                const statusClass = status === 'compliant' ? 'prov-status-active'
                  : status === 'expired' || status === 'rejected' ? 'docs-status-danger'
                  : status === 'under_review' || status === 'expiring_soon' ? 'docs-status-warn'
                  : 'prov-status-inactive';

                return (
                  <tr key={item.id} className={!doc ? 'docs-list-row-missing' : ''}>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className={`docs-check-btn${status === 'compliant' ? ' docs-check-ok' : status === 'rejected' || status === 'expired' ? ' docs-check-no' : status === 'under_review' || status === 'expiring_soon' ? ' docs-check-warn' : status === 'not_applicable' ? ' docs-check-na' : ' docs-check-empty'}`}
                        onClick={() => status !== 'not_applicable' && handleQuickToggle(item, doc)}
                        title={status === 'not_applicable' ? 'No aplica' : status === 'compliant' ? 'Conforme — clic para revertir' : !doc ? 'Sin documento — clic para subir' : 'Clic para marcar conforme'}
                      >
                        {status === 'compliant' && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                        {(status === 'rejected' || status === 'expired') && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        )}
                        {(status === 'under_review' || status === 'expiring_soon') && (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        )}
                        {(status === 'pending' || !doc) && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        )}
                        {status === 'not_applicable' && (
                          <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '-0.5px' }}>N/A</span>
                        )}
                      </button>
                    </td>
                    <td>
                      <span className="docs-list-code">{item.code}</span>
                    </td>
                    <td>
                      <div className="docs-list-name">{item.name}</div>
                      <div className="docs-list-badges">
                        {item.is_mandatory && <span className="docs-badge-mandatory">Obligatorio</span>}
                        {doc?.external_url && <span className="docs-badge-drive">OneDrive</span>}
                        {doc?.validation_notes && <span className="docs-badge-notes" title={doc.validation_notes}>Observaciones</span>}
                      </div>
                    </td>
                    <td>
                      <span className={`prov-status ${statusClass}`} style={{ color: STATUS_COLORS[status] || '#6b778c' }}>
                        <span className="prov-status-dot" style={{ background: STATUS_COLORS[status] || '#6b778c' }} />
                        {STATUS_LABELS[status] || status}
                      </span>
                    </td>
                    <td className="docs-list-date">
                      {doc?.expiry_date ? formatDate(doc.expiry_date) : doc ? '—' : '—'}
                    </td>
                    <td className="docs-list-ver">
                      {doc ? `v${doc.version}` : '—'}
                    </td>
                    <td>
                      <div className="docs-list-actions">
                        {doc?.external_url && (
                          <a className="docs-list-btn docs-list-btn-icon" href={doc.external_url} target="_blank" rel="noopener noreferrer" title="Ver en OneDrive">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                            </svg>
                          </a>
                        )}
                        {doc && !doc.external_url && doc.original_filename && (
                          <button className="docs-list-btn docs-list-btn-icon" title="Descargar" onClick={() => handleDownload(doc.id, doc.original_filename!)}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                          </button>
                        )}
                        {can('documents', 'create') && (
                          <button className="docs-list-btn docs-list-btn-icon docs-list-btn-upload" title={doc ? 'Actualizar versión' : 'Subir documento'} onClick={() => setUploadModal(item)}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                            </svg>
                          </button>
                        )}
                        {isAuditor && doc && (
                          <button className="docs-list-btn docs-list-btn-icon docs-list-btn-validate" title="Validar documento" onClick={() => setValidateModal({ doc, item })}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          </button>
                        )}
                        {isAuditor && (
                          <button
                            className={`docs-list-btn docs-list-btn-na${status === 'not_applicable' ? ' docs-list-btn-na-active' : ''}`}
                            title={status === 'not_applicable' ? 'Revertir a Pendiente' : 'Marcar como No Aplica'}
                            onClick={() => handleToggleNotApplicable(item, doc)}
                          >
                            N/A
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                )}
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

              {/* Toggle Archivo / OneDrive */}
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
                  Enlace de OneDrive
                </button>
              </div>

              {uploadMode === 'file' ? (
                <form onSubmit={handleUpload}>
                  <div className="field">
                    <label>Archivo</label>
                    <button
                      type="button"
                      className="docs-gdrive-picker-btn"
                      onClick={handleOpenGoogleDrivePicker}
                      disabled={googlePickerLoading || uploading}
                    >
                      <svg width="18" height="18" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                        <path d="M43.65 25L29.9 1.2C28.55 2 27.4 3.1 26.6 4.5L1.2 48.5A9 9 0 0 0 0 53h27.5z" fill="#00ac47"/>
                        <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75L86.1 57.5c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 11.5z" fill="#ea4335"/>
                        <path d="M43.65 25L57.4 1.2A9 9 0 0 0 53.65 0H33.65a9 9 0 0 0-3.75.8z" fill="#00832d"/>
                        <path d="M59.8 53H87.3a9 9 0 0 0-1.2-4.5L60.7 4.5a9 9 0 0 0-3.3-3.3L43.65 25z" fill="#2684fc"/>
                        <path d="M27.5 53l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h51c1.6 0 3.15-.45 4.5-1.2L59.8 53z" fill="#ffba00"/>
                      </svg>
                      {googlePickerLoading ? 'Descargando desde Drive...' : 'Seleccionar desde Google Drive'}
                    </button>

                    {driveFile ? (
                      <div className="docs-selected-file">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>{driveFile.name} ({(driveFile.size / 1024).toFixed(0)} KB)</span>
                        <button type="button" className="docs-clear-file" onClick={() => setDriveFile(null)}>×</button>
                      </div>
                    ) : (
                      <>
                        <div className="docs-drive-divider"><span>o selecciona desde tu computador</span></div>
                        <input
                          type="file"
                          name="file"
                          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
                          onChange={handleFileChange}
                        />
                        {fileError
                          ? <small className="docs-file-error">{fileError}</small>
                          : <small>PDF, imágenes o documentos Office. Máximo 5MB.</small>
                        }
                      </>
                    )}
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
                    <button type="submit" className="btn-primary" disabled={uploading || !!fileError || googlePickerLoading}>
                      {uploading ? 'Subiendo...' : 'Subir documento'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleLinkDrive}>
                  <div className="field">
                    <label>Seleccionar archivo desde OneDrive</label>
                    <button
                      type="button"
                      className="docs-onedrive-picker-btn"
                      onClick={handleOpenOneDrivePicker}
                      disabled={pickerLoading}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 15a4 4 0 0 0 4 4h9a5 5 0 1 0-4.9-6H7a4 4 0 0 0-4 4z"/>
                      </svg>
                      {pickerLoading ? 'Abriendo OneDrive...' : 'Seleccionar desde OneDrive'}
                    </button>
                    {driveUrl && (
                      <div className="docs-selected-file">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="20 6 9 17 4 12"/></svg>
                        <a href={driveUrl} target="_blank" rel="noopener noreferrer">{driveUrl.slice(0, 55)}…</a>
                      </div>
                    )}
                    <input type="hidden" value={driveUrl} required />
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
