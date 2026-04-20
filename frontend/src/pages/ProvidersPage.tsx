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
  status: 'active' | 'inactive' | 'suspended';
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
  auditor_id: string;
}

const INITIAL_FORM: FormData = {
  rut: '',
  legal_name: '',
  address: '',
  city: '',
  department: '',
  auditor_id: '',
};

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Provider | null>(null);
  const [deleting, setDeleting] = useState(false);

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
      } catch {
        console.error('Failed to load providers or auditors');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = providers.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.legal_name.toLowerCase().includes(q) ||
      p.rut.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q)
    );
  });

  const handleCreate = async () => {
    // Validar campos obligatorios
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
    if (!formData.auditor_id.trim()) {
      setCreateError('Auditor es obligatorio');
      return;
    }

    setCreating(true);
    setCreateError(null);

    try {
      // 1. Crear el prestador
      const createRes = await providersApi.create({
        rut: formData.rut.trim(),
        legal_name: formData.legal_name.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        department: formData.department.trim(),
      });

      const newProviderId = createRes.data.id;

      // 2. Asignar el auditor (obligatorio)
      await providersApi.assignAuditor(newProviderId, formData.auditor_id);

      // 3. Recargar lista de prestadores
      const providersRes = await providersApi.list();
      setProviders((providersRes.data || []) as Provider[]);

      // 4. Cerrar modal y limpiar form
      setShowModal(false);
      setFormData(INITIAL_FORM);

      // Mensaje de éxito
      alert('✅ Prestador creado correctamente');
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

      // Recargar lista
      const providersRes = await providersApi.list();
      setProviders((providersRes.data || []) as Provider[]);

      setShowModal(false);
      setEditingId(null);
      setFormData(INITIAL_FORM);

      // Mensaje de éxito
      alert('✅ Prestador actualizado correctamente');
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

    try {
      await providersApi.delete(deleteTarget.id);

      // Recargar lista
      const providersRes = await providersApi.list();
      setProviders((providersRes.data || []) as Provider[]);

      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    } catch (err) {
      console.error('Error al eliminar prestador:', err);
      // Mostrar error pero mantener el modal abierto para reintentar
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
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Prestadores</h1>
          <p className="page-subtitle">
            Gestión de prestadores de servicios de salud registrados
          </p>
        </div>
        <button
          className="page-btn-primary"
          onClick={() => {
            setEditingId(null);
            setFormData(INITIAL_FORM);
            setCreateError(null);
            setShowModal(true);
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nuevo Prestador
        </button>
      </header>

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

      {/* Providers table */}
      <div className="page-table-wrapper">
        <table className="page-table">
          <thead>
            <tr>
              <th>Razón Social</th>
              <th>RUT</th>
              <th>Ciudad</th>
              <th>Departamento</th>
              <th>Estado</th>
              <th>Registro</th>
              <th style={{ textAlign: 'center', width: '140px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td className="cell-bold">{p.legal_name}</td>
                <td className="cell-code">{p.rut}</td>
                <td>{p.city}</td>
                <td>{p.department}</td>
                <td>
                  <span
                    className="status-badge"
                    style={{
                      background: `${STATUS_COLORS[p.status] || '#6b778c'}15`,
                      color: STATUS_COLORS[p.status] || '#6b778c',
                    }}
                  >
                    {STATUS_LABELS[p.status] || p.status}
                  </span>
                </td>
                <td className="cell-muted">
                  {new Date(p.created_at).toLocaleDateString('es-CO')}
                </td>
                <td style={{ textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button
                    onClick={() => openEditModal(p)}
                    style={{
                      padding: '6px 10px',
                      fontSize: '12px',
                      background: '#0066cc',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => openDeleteConfirm(p)}
                    style={{
                      padding: '6px 10px',
                      fontSize: '12px',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="cell-empty">
                  Sin resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
                <label htmlFor="city">Ciudad *</label>
                <input
                  id="city"
                  type="text"
                  placeholder="Ej: Medellín"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  disabled={creating}
                />
              </div>

              <div className="dashboard-form-group">
                <label htmlFor="department">Departamento</label>
                <input
                  id="department"
                  type="text"
                  placeholder="Ej: Antioquia"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  disabled={creating}
                />
              </div>

              <div className="dashboard-form-group">
                <label htmlFor="auditor_id">Asignar Auditor *</label>
                <select
                  id="auditor_id"
                  value={formData.auditor_id}
                  onChange={(e) => setFormData({ ...formData, auditor_id: e.target.value })}
                  disabled={creating}
                >
                  <option value="">-- Seleccionar auditor --</option>
                  {auditors.map((auditor) => (
                    <option key={auditor.id} value={auditor.id}>
                      {auditor.first_name} {auditor.last_name} ({auditor.email})
                    </option>
                  ))}
                </select>
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
    </div>
  );
};
