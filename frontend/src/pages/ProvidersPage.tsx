/**
 * Providers Page — Gestión de prestadores de salud
 */

import React, { useEffect, useState } from 'react';
import { providersApi, usersApi, User } from '../services/api';
import './Pages.css';

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

/**
 * Helper para validar fortaleza de contraseña
 */
const checkPasswordStrength = (password: string) => {
  const checks = {
    hasMinLength: password.length >= 12,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasSpecial: /[!@#$%^&*()_\-+=\[\]{};:'",.<>?/\\|`~]/.test(password),
  };
  const passedCount = Object.values(checks).filter(Boolean).length;
  return { checks, strength: passedCount };
};

interface FormData {
  rut: string;
  legal_name: string;
  address: string;
  city: string;
  department: string;
  auditor_id: string;
  admin_first_name: string;
  admin_last_name: string;
  admin_email: string;
  admin_password: string;
}

const INITIAL_FORM: FormData = {
  rut: '',
  legal_name: '',
  address: '',
  city: '',
  department: '',
  auditor_id: '',
  admin_first_name: '',
  admin_last_name: '',
  admin_email: '',
  admin_password: '',
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

    // Validar campos obligatorios del administrador
    if (!formData.admin_first_name.trim()) {
      setCreateError('Nombre del administrador es obligatorio');
      return;
    }
    if (!formData.admin_last_name.trim()) {
      setCreateError('Apellido del administrador es obligatorio');
      return;
    }
    if (!formData.admin_email.trim()) {
      setCreateError('Email del administrador es obligatorio');
      return;
    }
    if (!formData.admin_password.trim()) {
      setCreateError('Contraseña del administrador es obligatoria');
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
        admin_email: formData.admin_email.trim(),
        admin_password: formData.admin_password,
        admin_first_name: formData.admin_first_name.trim(),
        admin_last_name: formData.admin_last_name.trim(),
      });

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
      setSuccessMessage('Prestador creado y administrador configurado');
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

    setCreating(true);
    setCreateError(null);

    try {
      await providersApi.update(editingId, {
        legal_name: formData.legal_name.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        department: formData.department.trim(),
      });

      // Asignar el auditor si se seleccionó
      if (formData.auditor_id) {
        await providersApi.assignAuditor(editingId, formData.auditor_id);
      }

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
    setFormData({
      rut: provider.rut,
      legal_name: provider.legal_name,
      address: provider.address || '',
      city: provider.city,
      department: provider.department,
      auditor_id: '',
      admin_first_name: '',
      admin_last_name: '',
      admin_email: '',
      admin_password: '',
    });
    setCreateError(null);
    setShowModal(true);
  };

  const openDeleteConfirm = (provider: Provider) => {
    setDeleteTarget(provider);
    setShowDeleteConfirm(true);
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
            <svg width="6" height="6" viewBox="0 0 6 6" fill="none"><circle cx="3" cy="3" r="3" fill="#818cf8"/></svg>
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

              <div className="dashboard-form-group">
                <label htmlFor="rut">RUT *</label>
                <input
                  id="rut"
                  type="text"
                  placeholder="Ej: 900123456-7"
                  value={formData.rut}
                  onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                  disabled={creating}
                />
                <small style={{ color: '#6b778c', marginTop: '4px' }}>
                  Formato: 10-11 dígitos + guion + 1 dígito de verificación
                </small>
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
                <select
                  id="department"
                  value={formData.department}
                  onChange={(e) => {
                    const newDept = e.target.value;
                    setFormData({ ...formData, department: newDept, city: '' });
                    // Fetch municipalities for selected department
                    if (newDept) {
                      fetch(`/api/municipalities?department=${encodeURIComponent(newDept)}`)
                        .then((r) => r.json())
                        .then((data) => setMunicipalities(Array.isArray(data) ? data : []))
                        .catch((err) => {
                          console.error('Error loading municipalities:', err);
                          setMunicipalities([]);
                        });
                    }
                  }}
                  disabled={creating}
                >
                  <option value="">-- Seleccionar departamento --</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.name}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="dashboard-form-group">
                <label htmlFor="city">Ciudad *</label>
                <select
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  disabled={creating || !formData.department}
                >
                  <option value="">-- Seleccionar ciudad --</option>
                  {municipalities.map((mun) => (
                    <option key={mun.id} value={mun.name}>
                      {mun.name}
                    </option>
                  ))}
                </select>
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

              {/* Admin section - only show on create, not on edit */}
              {!editingId && (
                <>
                  <div style={{
                    borderTop: '1px solid #e0e0e0',
                    margin: '24px 0',
                    paddingTop: '20px',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '16px',
                      color: '#333',
                      fontWeight: '600',
                    }}>
                      <span style={{ fontSize: '20px' }}>👤</span>
                      <span>Administrador del Prestador</span>
                    </div>
                  </div>

                  <div className="dashboard-form-group">
                    <label htmlFor="admin_first_name">Nombre *</label>
                    <input
                      id="admin_first_name"
                      type="text"
                      placeholder="Ej: Juan"
                      value={formData.admin_first_name}
                      onChange={(e) => setFormData({ ...formData, admin_first_name: e.target.value })}
                      disabled={creating}
                    />
                  </div>

                  <div className="dashboard-form-group">
                    <label htmlFor="admin_last_name">Apellido *</label>
                    <input
                      id="admin_last_name"
                      type="text"
                      placeholder="Ej: Pérez"
                      value={formData.admin_last_name}
                      onChange={(e) => setFormData({ ...formData, admin_last_name: e.target.value })}
                      disabled={creating}
                    />
                  </div>

                  <div className="dashboard-form-group">
                    <label htmlFor="admin_email">Email *</label>
                    <input
                      id="admin_email"
                      type="email"
                      placeholder="Ej: admin@hospital.com"
                      value={formData.admin_email}
                      onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                      disabled={creating}
                    />
                  </div>

                  <div className="dashboard-form-group">
                    <label htmlFor="admin_password">Contraseña *</label>
                    <input
                      id="admin_password"
                      type="password"
                      placeholder="Mínimo 12 caracteres"
                      value={formData.admin_password}
                      onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                      disabled={creating}
                    />
                    {formData.admin_password && (
                      <div style={{ marginTop: '12px' }}>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: '500' }}>
                          Requisitos de contraseña:
                        </div>
                        {(() => {
                          const { checks } = checkPasswordStrength(formData.admin_password);
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '13px',
                                color: checks.hasMinLength ? '#00875a' : '#999',
                              }}>
                                <span>{checks.hasMinLength ? '✓' : '○'}</span> Mínimo 12 caracteres
                              </div>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '13px',
                                color: checks.hasUppercase ? '#00875a' : '#999',
                              }}>
                                <span>{checks.hasUppercase ? '✓' : '○'}</span> Una mayúscula
                              </div>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '13px',
                                color: checks.hasLowercase ? '#00875a' : '#999',
                              }}>
                                <span>{checks.hasLowercase ? '✓' : '○'}</span> Una minúscula
                              </div>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '13px',
                                color: checks.hasSpecial ? '#00875a' : '#999',
                              }}>
                                <span>{checks.hasSpecial ? '✓' : '○'}</span> Un carácter especial
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </>
              )}
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
