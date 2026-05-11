/**
 * Providers Page — Gestión de prestadores de salud
 */

import React, { useEffect, useState } from 'react';
import { providersApi, usersApi, repsApi, servicesApi, providerServicesApi, User, HealthService } from '../services/api';
import './Pages.css';

/**
 * Extrae el primer número móvil colombiano de un string de teléfono del REPS.
 * Solo retorna número si es móvil (10 dígitos, empieza por 3) — candidato a WhatsApp.
 * Los números fijos (locales) no son WhatsApp y se descartan.
 */
const extractMobileNumber = (rawPhone: string | undefined): string => {
  if (!rawPhone) return '';
  // Separar por delimitadores comunes: / - , ; |
  const parts = rawPhone.split(/[/\-,;|]/);
  for (const part of parts) {
    const digits = part.replace(/\D/g, '');
    // Móvil colombiano: 10 dígitos empezando por 3
    if (digits.length === 10 && digits.startsWith('3')) {
      return digits;
    }
    // Formato internacional +57 3xx: 12 dígitos empezando por 57 3
    if (digits.length === 12 && digits.startsWith('573')) {
      return digits.slice(2);
    }
  }
  // No se encontró número móvil → no autocompletar
  return '';
};

interface Provider {
  id: string;
  legal_name: string;
  rut: string;
  city: string;
  department: string;
  address?: string;
  status: 'active' | 'inactive' | 'suspended' | 'revoked';
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  suspended: 'Suspendido',
};

const STATUS_COLORS: Record<string, string> = {
  active: '#00875a',
  inactive: '#6b778c',
  suspended: '#de350b',
};


interface FormData {
  rut: string;
  legal_name: string;
  address: string;
  city: string;
  department: string;
  email: string;
  phone: string;
  nombre_sede: string;
  codigo_habilitacion: string;
  tipo_prestador: string;
  auditor_id: string;
  habilitacion_fecha_vencimiento: string;
}

const INITIAL_FORM: FormData = {
  rut: '',
  legal_name: '',
  address: '',
  city: '',
  department: '',
  email: '',
  phone: '',
  nombre_sede: '',
  codigo_habilitacion: '',
  tipo_prestador: '',
  auditor_id: '',
  habilitacion_fecha_vencimiento: '',
};

interface Department {
  id: number;
  name: string;
  code: string;
}

interface Municipality {
  id: number;
  name: string;
}

// Default departments (Colombian departments)
const DEFAULT_DEPARTMENTS: Department[] = [
  { id: 1, code: 'ANT', name: 'Antioquia' },
  { id: 2, code: 'BOL', name: 'Bolívar' },
  { id: 3, code: 'BOY', name: 'Boyacá' },
  { id: 4, code: 'CAL', name: 'Cauca' },
  { id: 5, code: 'CAQ', name: 'Caquetá' },
  { id: 6, code: 'COR', name: 'Córdoba' },
  { id: 7, code: 'CUN', name: 'Cundinamarca' },
  { id: 8, code: 'CHO', name: 'Chocó' },
  { id: 9, code: 'GUA', name: 'Guainia' },
  { id: 10, code: 'GUC', name: 'Guaviare' },
  { id: 11, code: 'HUI', name: 'Huila' },
  { id: 12, code: 'LAG', name: 'La Guajira' },
  { id: 13, code: 'MAG', name: 'Magdalena' },
  { id: 14, code: 'MET', name: 'Meta' },
  { id: 15, code: 'NAR', name: 'Nariño' },
  { id: 16, code: 'NSA', name: 'Norte de Santander' },
  { id: 17, code: 'PUT', name: 'Putumayo' },
  { id: 18, code: 'QUI', name: 'Quindío' },
  { id: 19, code: 'RIS', name: 'Risaralda' },
  { id: 20, code: 'SAP', name: 'San Andrés y Providencia' },
  { id: 21, code: 'SAN', name: 'Santander' },
  { id: 22, code: 'SUC', name: 'Sucre' },
  { id: 23, code: 'TOL', name: 'Tolima' },
  { id: 24, code: 'VAC', name: 'Valle del Cauca' },
  { id: 25, code: 'VAU', name: 'Vaupés' },
  { id: 26, code: 'VIC', name: 'Vichada' },
  { id: 27, code: 'DC', name: 'Distrito Capital (Bogotá)' },
];

export const ProvidersPage: React.FC = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [auditors, setAuditors] = useState<User[]>([]);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Provider | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [repsSearchCode, setRepsSearchCode] = useState('');
  const [repsSearching, setRepsSearching] = useState(false);
  const [repsFound, setRepsFound] = useState<{ nombre: string; identificacion: string; telefono: string; codigo_prestador: string; sede: string; servicios_count: number; servicios_matched: number } | null>(null);
  const [repsError, setRepsError] = useState<string | null>(null);
  const [allServices, setAllServices] = useState<HealthService[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [servicesSearch, setServicesSearch] = useState('');
  const [loadingServices, setLoadingServices] = useState(false);
  const [repsServiciosCodigos, setRepsServiciosCodigos] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [providersRes, usersRes] = await Promise.all([
          providersApi.list(),
          usersApi.list(),
        ]);
        setProviders((providersRes.data || []) as Provider[]);
        // Filtrar solo auditores
        const auditorsList = (usersRes.data || []).filter((u) => u.role === 'auditor');
        setAuditors(auditorsList);
        // Usar departamentos por defecto
        setDepartments(DEFAULT_DEPARTMENTS);
      } catch {
        console.error('Failed to load providers or auditors');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = providers.filter((p) => {
    // Excluir prestadores eliminados (revoked)
    if (p.status === 'revoked') return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.legal_name.toLowerCase().includes(q) ||
      p.rut.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q)
    );
  });

  const handleCreate = async () => {
    // Validar campos obligatorios del prestador
    if (!formData.rut.trim()) {
      setCreateError('RUT es obligatorio');
      return;
    }
    if (!formData.legal_name.trim()) {
      setCreateError('Nombre legal es obligatorio');
      return;
    }
    if (!formData.address.trim()) {
      setCreateError('Dirección es obligatoria');
      return;
    }
    if (!formData.city.trim()) {
      setCreateError('Ciudad es obligatoria');
      return;
    }
    if (!formData.habilitacion_fecha_vencimiento) {
      setCreateError('La fecha de vencimiento de habilitación es obligatoria');
      return;
    }

    setCreating(true);
    setCreateError(null);

    try {
      // Crear prestador + admin en un solo paso
      const createRes = await providersApi.create({
        rut: formData.rut.trim(),
        legal_name: formData.legal_name.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        department: formData.department.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        nombre_sede: formData.nombre_sede.trim() || undefined,
        codigo_habilitacion: formData.codigo_habilitacion.trim() || undefined,
        legal_entity_type: formData.tipo_prestador.trim() || undefined,
        habilitacion_fecha_vencimiento: formData.habilitacion_fecha_vencimiento || undefined,
        serviceIds: selectedServiceIds.length > 0 ? selectedServiceIds : undefined,
      } as any);

      const newProviderId = (createRes.data as any).provider.id;

      // Asignar el auditor al prestador creado
      if (formData.auditor_id) {
        await providersApi.assignAuditor(newProviderId, formData.auditor_id);
      }

      // Recargar lista de prestadores
      const providersRes = await providersApi.list();
      setProviders((providersRes.data || []) as Provider[]);

      // Cerrar modal y limpiar form
      setShowModal(false);
      setFormData(INITIAL_FORM);

      // Mensaje de éxito
      setSuccessMessage('Prestador creado exitosamente');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear prestador';
      setCreateError(message);
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = async () => {
    if (!editingId || !formData.legal_name.trim() || !formData.city.trim()) {
      setCreateError('Por favor completa los campos obligatorios');
      return;
    }
    if (!formData.habilitacion_fecha_vencimiento) {
      setCreateError('La fecha de vencimiento de habilitación es obligatoria');
      return;
    }

    setCreating(true);
    setCreateError(null);

    try {
      await providersApi.update(editingId, {
        legal_name: formData.legal_name.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        department: formData.department.trim(),
        habilitacion_fecha_vencimiento: formData.habilitacion_fecha_vencimiento || null,
      } as any);

      // Asignar el auditor si se seleccionó
      if (formData.auditor_id) {
        await providersApi.assignAuditor(editingId, formData.auditor_id);
      }

      // Guardar servicios habilitados
      await providerServicesApi.setForProvider(editingId, selectedServiceIds);

      // Recargar lista
      const providersRes = await providersApi.list();
      setProviders((providersRes.data || []) as Provider[]);

      setShowModal(false);
      setEditingId(null);
      setFormData(INITIAL_FORM);

      // Mensaje de éxito
      setSuccessMessage('Prestador actualizado correctamente');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar prestador';
      setCreateError(message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    setCreateError(null);

    try {
      await providersApi.delete(deleteTarget.id);

      // Recargar lista
      const providersRes = await providersApi.list();
      setProviders((providersRes.data || []) as Provider[]);

      setShowDeleteConfirm(false);
      setDeleteTarget(null);

      // Mensaje de éxito
      setSuccessMessage('Prestador eliminado exitosamente');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar prestador';
      setCreateError(message);
      console.error('Error al eliminar prestador:', err);
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = (provider: Provider) => {
    setEditingId(provider.id);
    const rawDate = (provider as any).habilitacion_fecha_vencimiento;
    const fechaVencimiento = rawDate ? rawDate.substring(0, 10) : '';
    setFormData({
      rut: provider.rut,
      legal_name: provider.legal_name,
      address: provider.address || '',
      city: provider.city,
      department: provider.department,
      email: (provider as any).email || '',
      phone: (provider as any).phone || '',
      nombre_sede: (provider as any).nombre_sede || '',
      codigo_habilitacion: (provider as any).codigo_habilitacion || '',
      tipo_prestador: (provider as any).legal_entity_type || '',
      auditor_id: '',
      habilitacion_fecha_vencimiento: fechaVencimiento,
    });
    setCreateError(null);
    setServicesSearch('');
    loadServices(provider.id);
    setShowModal(true);
  };

  const openDeleteConfirm = (provider: Provider) => {
    setDeleteTarget(provider);
    setShowDeleteConfirm(true);
  };

  const handleRepsSearch = async () => {
    if (!repsSearchCode.trim()) return;
    setRepsSearching(true);
    setRepsFound(null);
    setRepsError(null);
    try {
      const res = await repsApi.consultar(repsSearchCode.trim());
      if (res.data?.found && res.data.data) {
        const d = res.data.data;
        const mobileNumber = extractMobileNumber(d.telefono);
        // Cruzar servicios REPS con servicios del sistema por código oficial
        const repsCodigos = new Set((d.servicios_habilitados || []).map((s) => s.codigo));
        const matchedIds = allServices.filter((s) => repsCodigos.has(s.code)).map((s) => s.id);
        setRepsServiciosCodigos(repsCodigos);
        if (matchedIds.length > 0) setSelectedServiceIds(matchedIds);

        setRepsFound({ nombre: d.nombre_prestador, identificacion: d.nit, telefono: mobileNumber ? `${mobileNumber} (WhatsApp)` : (d.telefono ? `${d.telefono} (solo fijo, no WhatsApp)` : ''), codigo_prestador: d.codigo_habilitacion, sede: d.nombre_sede || '', servicios_count: d.servicios_habilitados?.length || 0, servicios_matched: matchedIds.length });
        // Autocompletar campos del formulario directamente desde REPS
        setFormData((prev) => ({
          ...prev,
          legal_name: d.nombre_prestador,
          rut: d.nit,
          address: d.direccion || prev.address,
          department: d.departamento,
          city: d.municipio,
          email: d.email || prev.email,
          phone: extractMobileNumber(d.telefono) || prev.phone,
          nombre_sede: d.nombre_sede || prev.nombre_sede,
          codigo_habilitacion: d.codigo_habilitacion || prev.codigo_habilitacion,
          tipo_prestador: d.tipo_prestador || prev.tipo_prestador,
        }));
      } else {
        setRepsError('No se encontró el prestador en REPS. Verifique el código de habilitación o NIT.');
      }
    } catch {
      setRepsError('Error al consultar REPS. Intente nuevamente.');
    } finally {
      setRepsSearching(false);
    }
  };

  const loadServices = async (providerId?: string) => {
    setLoadingServices(true);
    try {
      const res = await servicesApi.getAll({ status: 'available' });
      setAllServices(res.data || []);
      if (providerId) {
        const provRes = await providerServicesApi.getForProvider(providerId);
        setSelectedServiceIds((provRes.data || []).map((s) => s.id));
      } else {
        setSelectedServiceIds([]);
      }
    } catch {
      console.error('Failed to load services');
    } finally {
      setLoadingServices(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container page-loading">
        <div className="page-spinner" />
        <p>Cargando prestadores...</p>
      </div>
    );
  }

  return (
    <div className="page-container aud-page">
      <div className="aud-hero">
        <div className="aud-hero-content">
          <span className="aud-hero-badge">
            <svg width="6" height="6" viewBox="0 0 6 6" fill="none"><circle cx="3" cy="3" r="3" fill="#A78BFA"/></svg>
            Gestión de Prestadores
          </span>
          <h1 className="aud-hero-title">Prestadores de Salud</h1>
          <p className="aud-hero-subtitle">Administración y seguimiento de prestadores habilitados</p>
        </div>
        <div className="aud-hero-actions">
          <button
            className="aud-hero-btn"
            onClick={() => {
              setEditingId(null);
              setFormData(INITIAL_FORM);
              setCreateError(null);
              setRepsSearchCode('');
              setRepsFound(null);
              setRepsError(null);
              setRepsServiciosCodigos(new Set());
              setServicesSearch('');
              loadServices();
              setShowModal(true);
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nuevo Prestador
          </button>
        </div>
        <div className="aud-hero-orb" />
      </div>

      {/* Search */}
      <div className="search-section">
        <div className="search-wrapper-page">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre, RUT o ciudad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="page-search"
          />
        </div>
        <span className="search-count">{filtered.length} prestadores</span>
      </div>

      {/* Providers grid */}
      {filtered.length === 0 ? (
        <div className="prov-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <h3>Sin resultados</h3>
          <p>No se encontraron prestadores con ese criterio de búsqueda</p>
        </div>
      ) : (
        <div className="prov-grid">
          {filtered.map((p) => (
            <div key={p.id} className="prov-card">
              {/* Accent bar */}
              <div className="prov-card-accent" />

              {/* Top row: icon + status */}
              <div className="prov-card-top">
                <div className="prov-card-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </div>
                <span className={`prov-status prov-status-${p.status}`}>
                  <span className="prov-status-dot" />
                  {STATUS_LABELS[p.status] || p.status}
                </span>
              </div>

              {/* Name */}
              <div className="prov-card-name">{p.legal_name}</div>

              {/* Info rows */}
              <div className="prov-card-info">
                <div className="prov-info-row">
                  <span className="prov-info-label">RUT</span>
                  <span className="prov-info-value prov-mono">{p.rut}</span>
                </div>
                <div className="prov-info-row">
                  <span className="prov-info-label">Ciudad</span>
                  <span className="prov-info-value">{p.city}</span>
                </div>
                <div className="prov-info-row">
                  <span className="prov-info-label">Departamento</span>
                  <span className="prov-info-value">{p.department}</span>
                </div>
                <div className="prov-info-row">
                  <span className="prov-info-label">Registro</span>
                  <span className="prov-info-value">
                    {new Date(p.created_at).toLocaleDateString('es-CO')}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="prov-card-actions">
                <button className="prov-btn-edit" onClick={() => openEditModal(p)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Editar
                </button>
                <button className="prov-btn-delete" onClick={() => openDeleteConfirm(p)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6"/>
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !creating && setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Editar prestador' : 'Crear nuevo prestador'}</h2>
              <button
                className="modal-close"
                onClick={() => !creating && setShowModal(false)}
                disabled={creating}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {createError && <div className="modal-error">{createError}</div>}

              {/* Búsqueda en REPS — solo al crear */}
              {!editingId && (
                <div style={{ marginBottom: '24px', padding: '16px', background: '#f0f4ff', border: '1px solid #c7d2fe', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 600, color: '#3730a3', marginBottom: '10px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    Buscar en REPS
                  </div>
                  <p style={{ fontSize: '13px', color: '#4338ca', marginBottom: '12px' }}>
                    Ingresa el código de habilitación o NIT para autocompletar los datos del prestador.
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Código de habilitación o NIT"
                      value={repsSearchCode}
                      onChange={(e) => setRepsSearchCode(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRepsSearch()}
                      disabled={repsSearching || creating}
                      style={{ flex: 1, padding: '8px 12px', border: '1px solid #a5b4fc', borderRadius: '6px', fontSize: '14px' }}
                    />
                    <button
                      type="button"
                      onClick={handleRepsSearch}
                      disabled={repsSearching || creating || !repsSearchCode.trim()}
                      style={{ padding: '8px 16px', background: '#7C3AED', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer', whiteSpace: 'nowrap', opacity: (!repsSearchCode.trim() || repsSearching) ? 0.6 : 1 }}
                    >
                      {repsSearching ? 'Buscando...' : 'Buscar'}
                    </button>
                  </div>
                  {repsError && (
                    <p style={{ marginTop: '8px', fontSize: '13px', color: '#dc2626' }}>{repsError}</p>
                  )}
                  {repsFound && (
                    <div style={{ marginTop: '10px', padding: '10px 14px', background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: '6px', fontSize: '13px', color: '#065f46' }}>
                      <div style={{ fontWeight: 600, marginBottom: '6px' }}>✓ Datos cargados: {repsFound.nombre}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
                        <span><strong>Identificación:</strong> {repsFound.identificacion || '—'}</span>
                        <span><strong>Teléfono:</strong> {repsFound.telefono || '—'}</span>
                        <span><strong>Código de prestador:</strong> {repsFound.codigo_prestador || '—'}</span>
                        <span><strong>Sede:</strong> {repsFound.sede || '—'}</span>
                      </div>
                      {repsFound.servicios_count > 0 && (
                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #a7f3d0', fontSize: '12px' }}>
                          <strong>Servicios habilitados REPS:</strong> {repsFound.servicios_count} reportados en REPS
                          {repsFound.servicios_matched > 0
                            ? ` — ${repsFound.servicios_matched} preseleccionados abajo`
                            : ' — ninguno coincide con servicios registrados en el sistema'}
                        </div>
                      )}
                      {repsFound.servicios_count === 0 && (
                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #a7f3d0', fontSize: '12px', color: '#6b7280' }}>
                          Sin servicios habilitados reportados en REPS
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="dashboard-form-group">
                <label htmlFor="rut">Identificación *</label>
                <input
                  id="rut"
                  type="text"
                  placeholder="Ej: 900123456-7"
                  value={formData.rut}
                  onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                  disabled={creating}
                />
                <small style={{ color: '#6b778c', marginTop: '4px' }}>
                  NIT o número de identificación del prestador
                </small>
              </div>

              <div className="dashboard-form-group">
                <label htmlFor="phone">Número de teléfono</label>
                <input
                  id="phone"
                  type="text"
                  placeholder="Se autocompleta desde REPS o ingresa manualmente"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={creating}
                />
              </div>

              <div className="dashboard-form-group">
                <label htmlFor="codigo_habilitacion">Código de prestador</label>
                <input
                  id="codigo_habilitacion"
                  type="text"
                  placeholder="Se autocompleta desde REPS o ingresa manualmente"
                  value={formData.codigo_habilitacion}
                  onChange={(e) => setFormData({ ...formData, codigo_habilitacion: e.target.value })}
                  disabled={creating}
                />
              </div>

              <div className="dashboard-form-group">
                <label htmlFor="habilitacion_fecha_vencimiento">
                  Fecha de vencimiento de habilitación <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  id="habilitacion_fecha_vencimiento"
                  type="date"
                  value={formData.habilitacion_fecha_vencimiento}
                  onChange={(e) => setFormData({ ...formData, habilitacion_fecha_vencimiento: e.target.value })}
                  disabled={creating}
                  required
                />
                <small style={{ color: '#6b778c', marginTop: '4px' }}>
                  Obligatorio. El sistema enviará alertas automáticas 30, 15 y 7 días antes del vencimiento, y el día en que vence.
                </small>
              </div>

              <div className="dashboard-form-group">
                <label htmlFor="nombre_sede">Sede</label>
                <input
                  id="nombre_sede"
                  type="text"
                  placeholder="Se autocompleta desde REPS o ingresa manualmente"
                  value={formData.nombre_sede}
                  onChange={(e) => setFormData({ ...formData, nombre_sede: e.target.value })}
                  disabled={creating}
                />
              </div>

              <div className="dashboard-form-group">
                <label htmlFor="legal_name">Nombre Legal *</label>
                <input
                  id="legal_name"
                  type="text"
                  placeholder="Ej: Hospital Central de Medellín"
                  value={formData.legal_name}
                  onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                  disabled={creating}
                />
              </div>

              <div className="dashboard-form-group">
                <label htmlFor="email">Correo Electrónico</label>
                <input
                  id="email"
                  type="email"
                  placeholder="Ej: contacto@hospital.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={creating}
                />
              </div>

              <div className="dashboard-form-group">
                <label htmlFor="address">Dirección *</label>
                <input
                  id="address"
                  type="text"
                  placeholder="Ej: Carrera 50 # 50-60"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  disabled={creating}
                />
              </div>

              <div className="dashboard-form-group">
                <label htmlFor="department">Departamento *</label>
                <input
                  id="department"
                  type="text"
                  placeholder="Se autocompleta desde REPS o ingresa manualmente"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  disabled={creating}
                />
              </div>

              <div className="dashboard-form-group">
                <label htmlFor="city">Ciudad *</label>
                <input
                  id="city"
                  type="text"
                  placeholder="Se autocompleta desde REPS o ingresa manualmente"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  disabled={creating}
                />
              </div>

              <div className="dashboard-form-group">
                <label htmlFor="tipo_prestador">Clase de prestador</label>
                <input
                  id="tipo_prestador"
                  type="text"
                  placeholder="Se autocompleta desde REPS o ingresa manualmente"
                  value={formData.tipo_prestador}
                  onChange={(e) => setFormData({ ...formData, tipo_prestador: e.target.value })}
                  disabled={creating}
                />
              </div>

              {!editingId && (
                <div className="dashboard-form-group">
                  <div style={{
                    padding: '12px',
                    background: '#e3f2fd',
                    borderLeft: '4px solid #0066cc',
                    borderRadius: '4px',
                    color: '#333',
                  }}>
                    <p style={{ margin: 0, fontSize: '14px' }}>
                      ✓ Te asignarás automáticamente como auditor de este prestador al crearlo.
                    </p>
                  </div>
                </div>
              )}

              {editingId && (
                <div className="dashboard-form-group">
                  <label htmlFor="auditor_id">Auditor Adicional (opcional)</label>
                  <select
                    id="auditor_id"
                    value={formData.auditor_id}
                    onChange={(e) => setFormData({ ...formData, auditor_id: e.target.value })}
                    disabled={creating}
                  >
                    <option value="">-- Asignar otro auditor --</option>
                    {auditors.map((auditor) => (
                      <option key={auditor.id} value={auditor.id}>
                        {auditor.first_name} {auditor.last_name} ({auditor.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Servicios habilitados */}
              <div style={{ borderTop: '1px solid #e0e0e0', marginTop: '24px', paddingTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '20px' }}>🏥</span>
                  <div>
                    <div style={{ fontWeight: 600, color: '#333', fontSize: '14px' }}>Servicios Habilitados</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Selecciona los servicios de salud habilitados para este prestador</div>
                  </div>
                </div>

                {selectedServiceIds.length > 0 && (
                  <div style={{ marginBottom: '10px', fontSize: '13px', color: '#7C3AED', fontWeight: 600 }}>
                    {selectedServiceIds.length} servicio{selectedServiceIds.length !== 1 ? 's' : ''} seleccionado{selectedServiceIds.length !== 1 ? 's' : ''}
                    {repsServiciosCodigos.size > 0 && (
                      <span style={{ marginLeft: '8px', fontSize: '11px', background: '#dbeafe', color: '#1d4ed8', padding: '2px 7px', borderRadius: '10px', fontWeight: 600 }}>
                        {selectedServiceIds.filter((id) => repsServiciosCodigos.has(allServices.find((s) => s.id === id)?.code || '')).length} desde REPS
                      </span>
                    )}
                  </div>
                )}

                <input
                  type="text"
                  placeholder="Filtrar servicios..."
                  value={servicesSearch}
                  onChange={(e) => setServicesSearch(e.target.value)}
                  disabled={creating || loadingServices}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', marginBottom: '10px', boxSizing: 'border-box' }}
                />

                {loadingServices ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#888', fontSize: '14px' }}>Cargando servicios...</div>
                ) : (
                  <div style={{ maxHeight: '260px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                    {(() => {
                      const filtered2 = allServices.filter(
                        (s) => !servicesSearch || s.name.toLowerCase().includes(servicesSearch.toLowerCase()) || s.category.toLowerCase().includes(servicesSearch.toLowerCase())
                      );
                      const grouped = filtered2.reduce((acc, s) => {
                        if (!acc[s.category]) acc[s.category] = [];
                        acc[s.category].push(s);
                        return acc;
                      }, {} as Record<string, HealthService[]>);
                      const categories = Object.keys(grouped).sort();
                      if (categories.length === 0) return (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '13px' }}>Sin resultados</div>
                      );
                      return categories.map((cat) => (
                        <div key={cat}>
                          <div style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 700, color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#f8f9ff', borderBottom: '1px solid #e8eaff', position: 'sticky', top: 0 }}>
                            {cat}
                          </div>
                          {grouped[cat].map((service) => {
                            const isFromReps = repsServiciosCodigos.has(service.code);
                            return (
                              <label
                                key={service.id}
                                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', cursor: 'pointer', fontSize: '13px', color: '#1a1a2e', borderBottom: '1px solid #f3f4f6', background: isFromReps ? '#eff6ff' : undefined }}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedServiceIds.includes(service.id)}
                                  onChange={(e) => {
                                    setSelectedServiceIds((prev) =>
                                      e.target.checked ? [...prev, service.id] : prev.filter((id) => id !== service.id)
                                    );
                                  }}
                                  disabled={creating}
                                  style={{ accentColor: '#8B5CF6', width: '15px', height: '15px', flexShrink: 0 }}
                                />
                                <span style={{ flex: 1 }}>{service.name}</span>
                                {isFromReps && (
                                  <span style={{ fontSize: '10px', background: '#1d4ed8', color: '#fff', padding: '1px 6px', borderRadius: '8px', fontWeight: 700, flexShrink: 0 }}>REPS</span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>

            </div>

            <div className="modal-footer">
              <button
                className="modal-btn-cancel"
                onClick={() => setShowModal(false)}
                disabled={creating}
              >
                Cancelar
              </button>
              <button
                className="modal-btn-primary"
                onClick={editingId ? handleEdit : handleCreate}
                disabled={creating}
              >
                {creating ? (
                  <>
                    <span className="spinner-small" />
                    {editingId ? 'Actualizando...' : 'Creando...'}
                  </>
                ) : editingId ? (
                  'Actualizar Prestador'
                ) : (
                  'Crear Prestador'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && deleteTarget && (
        <div className="modal-overlay" onClick={() => !deleting && setShowDeleteConfirm(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Eliminar prestador</h2>
              <button
                className="modal-close"
                onClick={() => !deleting && setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {createError && <div className="modal-error">{createError}</div>}
              <p style={{ marginBottom: '16px', color: '#333' }}>
                ¿Está seguro de que desea eliminar a <strong>{deleteTarget.legal_name}</strong>?
              </p>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '0' }}>
                Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="modal-footer">
              <button
                className="modal-btn-cancel"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                className="modal-btn-primary"
                style={{ background: '#dc3545' }}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <span className="spinner-small" />
                    Eliminando...
                  </>
                ) : (
                  'Eliminar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {successMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#00875a',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'slideIn 0.3s ease-out',
        }}>
          <span style={{ fontSize: '20px' }}>✅</span>
          <span style={{ fontWeight: '500' }}>{successMessage}</span>
        </div>
      )}
    </div>
  );
};
