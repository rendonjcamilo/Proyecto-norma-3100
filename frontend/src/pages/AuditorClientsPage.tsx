/**
 * AuditorClientsPage — Agenda personal de prestadores del auditor
 * CRUD completo: crear, editar, eliminar. Persiste en BD real.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { auditorClientsApi, AuditorClientData, AuditorClientInput } from '../services/api';
import { MUNICIPIOS_POR_DEPARTAMENTO } from '../data/municipiosColombia';
import './Pages.css';

const DEPARTAMENTOS = Object.keys(MUNICIPIOS_POR_DEPARTAMENTO).sort();

const TIPOS_PRESTADOR = [
  'Profesional Independiente',
  'Institución Prestadora de Servicios de Salud',
  'Transporte Especial de Pacientes',
  'Objeto Social Diferente al de Salud',
];

const EMPTY_FORM: AuditorClientInput = {
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
  habilitacion_fecha_vencimiento: '',
  notes: '',
};

export const AuditorClientsPage: React.FC = () => {
  const [clients, setClients] = useState<AuditorClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AuditorClientData | null>(null);
  const [form, setForm] = useState<AuditorClientInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AuditorClientData | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const loadClients = async () => {
    try {
      setLoading(true);
      const res = await auditorClientsApi.list();
      setClients((res.data || []) as unknown as AuditorClientData[]);
    } catch {
      showToast('error', 'Error al cargar los clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadClients(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter(c =>
      c.legal_name.toLowerCase().includes(q) ||
      (c.rut || '').toLowerCase().includes(q) ||
      (c.city || '').toLowerCase().includes(q) ||
      (c.codigo_habilitacion || '').toLowerCase().includes(q)
    );
  }, [clients, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (client: AuditorClientData) => {
    setEditing(client);
    setForm({
      rut: client.rut || '',
      legal_name: client.legal_name,
      address: client.address || '',
      city: client.city || '',
      department: client.department || '',
      email: client.email || '',
      phone: client.phone || '',
      nombre_sede: client.nombre_sede || '',
      codigo_habilitacion: client.codigo_habilitacion || '',
      tipo_prestador: client.tipo_prestador || '',
      habilitacion_fecha_vencimiento: client.habilitacion_fecha_vencimiento
        ? client.habilitacion_fecha_vencimiento.split('T')[0]
        : '',
      notes: client.notes || '',
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.legal_name.trim()) { setFormError('El nombre es obligatorio'); return; }
    try {
      setSaving(true);
      setFormError(null);
      if (editing) {
        await auditorClientsApi.update(editing.id, form);
        showToast('success', 'Cliente actualizado');
      } else {
        await auditorClientsApi.create(form);
        showToast('success', 'Cliente creado');
      }
      setShowModal(false);
      await loadClients();
    } catch {
      setFormError('Error al guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await auditorClientsApi.delete(deleteTarget.id);
      showToast('success', `"${deleteTarget.legal_name}" eliminado`);
      setDeleteTarget(null);
      await loadClients();
    } catch {
      showToast('error', 'Error al eliminar el cliente');
    } finally {
      setDeleting(false);
    }
  };

  const municipios = form.department ? (MUNICIPIOS_POR_DEPARTAMENTO[form.department] ?? []) : [];

  if (loading) {
    return (
      <div className="page-loading">
        <div className="page-spinner" />
        <p>Cargando clientes...</p>
      </div>
    );
  }

  return (
    <div className="page-root">
      {/* HEADER */}
      <div className="aud-hero">
        <div className="aud-hero-content">
          <span className="aud-hero-badge">
            <svg width="6" height="6" viewBox="0 0 6 6" fill="none"><circle cx="3" cy="3" r="3" fill="#818cf8"/></svg>
            Agenda personal
          </span>
          <h1 className="aud-hero-title">Mis Clientes</h1>
          <p className="aud-hero-subtitle">
            {clients.length} prestador{clients.length !== 1 ? 'es' : ''} registrado{clients.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="aud-hero-actions">
          <button className="aud-hero-btn-primary" onClick={openCreate}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo cliente
          </button>
        </div>
        <div className="aud-hero-orb" />
      </div>

      {/* BÚSQUEDA */}
      <div className="prov-search-bar">
        <div className="prov-search-input-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre, NIT, ciudad o código..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="prov-search-input"
          />
        </div>
      </div>

      {/* LISTA */}
      {filtered.length === 0 ? (
        <div className="prov-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <h3>{search ? 'Sin resultados' : 'Sin clientes aún'}</h3>
          <p>{search ? 'No hay clientes que coincidan con la búsqueda' : 'Agrega tu primer prestador recurrente'}</p>
          {!search && (
            <button className="prov-btn-add" onClick={openCreate}>Agregar cliente</button>
          )}
        </div>
      ) : (
        <div className="prov-grid">
          {filtered.map(c => (
            <div key={c.id} className="prov-card">
              <div className="prov-card-accent" style={{ background: 'linear-gradient(180deg,#818cf8,#6366f1)' }} />
              <div className="prov-card-top">
                <div className="prov-card-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                {c.habilitacion_fecha_vencimiento && (
                  <span className="prov-status prov-status-active" style={{ color: '#818cf8', fontSize: '11px' }}>
                    <span className="prov-status-dot" style={{ background: '#818cf8' }} />
                    Vence {new Date(c.habilitacion_fecha_vencimiento).toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' })}
                  </span>
                )}
              </div>

              <div className="prov-card-name">{c.legal_name}</div>
              {c.rut && <div className="prov-card-rut">NIT: {c.rut}</div>}

              <div className="prov-card-info">
                {c.city && (
                  <div className="prov-info-row">
                    <span className="prov-info-label">Ciudad</span>
                    <span className="prov-info-value">{c.city}{c.department ? `, ${c.department}` : ''}</span>
                  </div>
                )}
                {c.phone && (
                  <div className="prov-info-row">
                    <span className="prov-info-label">Teléfono</span>
                    <span className="prov-info-value">{c.phone}</span>
                  </div>
                )}
                {c.email && (
                  <div className="prov-info-row">
                    <span className="prov-info-label">Email</span>
                    <span className="prov-info-value assm-truncate">{c.email}</span>
                  </div>
                )}
                {c.codigo_habilitacion && (
                  <div className="prov-info-row">
                    <span className="prov-info-label">Cód. habilitación</span>
                    <span className="prov-info-value prov-mono">{c.codigo_habilitacion}</span>
                  </div>
                )}
                {c.tipo_prestador && (
                  <div className="prov-info-row">
                    <span className="prov-info-label">Tipo</span>
                    <span className="prov-info-value assm-truncate">{c.tipo_prestador}</span>
                  </div>
                )}
                {c.notes && (
                  <div className="prov-info-row">
                    <span className="prov-info-label">Notas</span>
                    <span className="prov-info-value assm-truncate">{c.notes}</span>
                  </div>
                )}
              </div>

              <div className="prov-card-actions">
                <button className="prov-btn-edit" onClick={() => openEdit(c)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Editar
                </button>
                <button className="prov-btn-delete" onClick={() => setDeleteTarget(c)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6"/><path d="M14 11v6"/>
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL CREAR / EDITAR */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <header className="modal-header">
              <h3>{editing ? 'Editar cliente' : 'Nuevo cliente'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </header>
            <div className="modal-body">
              <form onSubmit={handleSave}>
                <div className="field-row">
                  <div className="field">
                    <label>Nombre / Razón social *</label>
                    <input
                      type="text"
                      placeholder="Ej: Clínica El Rosario S.A.S"
                      value={form.legal_name}
                      onChange={e => setForm({ ...form, legal_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="field">
                    <label>Identificación (NIT / CC)</label>
                    <input
                      type="text"
                      placeholder="Ej: 900123456-7"
                      value={form.rut}
                      onChange={e => setForm({ ...form, rut: e.target.value })}
                    />
                  </div>
                </div>

                <div className="field-row">
                  <div className="field">
                    <label>Nombre sede</label>
                    <input
                      type="text"
                      placeholder="Ej: Sede Principal"
                      value={form.nombre_sede}
                      onChange={e => setForm({ ...form, nombre_sede: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label>Código de habilitación</label>
                    <input
                      type="text"
                      placeholder="Ej: 110010000101"
                      value={form.codigo_habilitacion}
                      onChange={e => setForm({ ...form, codigo_habilitacion: e.target.value })}
                    />
                  </div>
                </div>

                <div className="field-row">
                  <div className="field">
                    <label>Departamento</label>
                    <select
                      value={form.department}
                      onChange={e => setForm({ ...form, department: e.target.value, city: '' })}
                    >
                      <option value="">— Selecciona —</option>
                      {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label>Ciudad / Municipio</label>
                    <select
                      value={form.city}
                      onChange={e => setForm({ ...form, city: e.target.value })}
                      disabled={!form.department}
                    >
                      <option value="">— Selecciona —</option>
                      {municipios.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                <div className="field">
                  <label>Dirección</label>
                  <input
                    type="text"
                    placeholder="Ej: Calle 50 # 23-45"
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                  />
                </div>

                <div className="field-row">
                  <div className="field">
                    <label>Teléfono</label>
                    <input
                      type="text"
                      placeholder="Ej: 3001234567"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label>Email</label>
                    <input
                      type="email"
                      placeholder="Ej: contacto@clinica.com"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="field-row">
                  <div className="field">
                    <label>Clase de prestador</label>
                    <select
                      value={form.tipo_prestador}
                      onChange={e => setForm({ ...form, tipo_prestador: e.target.value })}
                    >
                      <option value="">— Selecciona —</option>
                      {TIPOS_PRESTADOR.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label>Fecha vencimiento habilitación</label>
                    <input
                      type="date"
                      value={form.habilitacion_fecha_vencimiento}
                      onChange={e => setForm({ ...form, habilitacion_fecha_vencimiento: e.target.value })}
                    />
                  </div>
                </div>

                <div className="field">
                  <label>Notas</label>
                  <textarea
                    rows={3}
                    placeholder="Observaciones personales sobre este prestador..."
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                  />
                </div>

                {formError && <p className="form-error">{formError}</p>}

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" disabled={saving}>
                    {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear cliente'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR ELIMINACIÓN */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <header className="modal-header">
              <h3>Eliminar cliente</h3>
              <button className="modal-close" onClick={() => setDeleteTarget(null)}>×</button>
            </header>
            <div className="modal-body">
              <p>¿Estás seguro de eliminar a <strong>{deleteTarget.legal_name}</strong>? Esta acción no se puede deshacer.</p>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Cancelar</button>
                <button className="btn-danger" onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className={`docs-toast docs-toast-${toast.type}`}>{toast.msg}</div>
      )}
    </div>
  );
};

export default AuditorClientsPage;
