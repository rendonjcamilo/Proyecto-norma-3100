/**
 * Users Management Page
 * For super_admin to create and manage users with different roles
 */

import React, { useState, useEffect } from 'react';
import { usersApi, providersApi, User, Provider, UserRole } from '@services/api';
import styles from './UsersPage.module.css';

const VALID_ROLES: UserRole[] = ['super_admin', 'auditor', 'provider_admin'];

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Administrador',
  auditor: 'Auditor',
  provider_admin: 'Prestador de Servicio',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  suspended: 'Suspendido',
  pending: 'Pendiente',
};

const getRoleLabel = (role: UserRole): string => ROLE_LABELS[role] || role;

const getStatusLabel = (status: string): string => STATUS_LABELS[status] || status;

const getPasswordRequirements = (password: string) => ({
  length: password.length >= 12,
  uppercase: /[A-Z]/.test(password),
  lowercase: /[a-z]/.test(password),
  special: /[!@#$%^&*]/.test(password),
});

const isPasswordValid = (password: string) => {
  const reqs = getPasswordRequirements(password);
  return reqs.length && reqs.uppercase && reqs.lowercase && reqs.special;
};

export function UsersPage(): JSX.Element {
  const [users, setUsers] = useState<User[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    first_name: '',
    last_name: '',
    role: 'provider_admin' as UserRole,
    provider_id: '',
  });

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirm_password: '',
    role: 'provider_admin' as UserRole,
    provider_id: '',
    first_name: '',
    last_name: '',
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchProviders();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await usersApi.list();
      setUsers(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading users');
    } finally {
      setLoading(false);
    }
  };

  const fetchProviders = async () => {
    try {
      const data = await providersApi.list();
      setProviders(data.data);
    } catch (err) {
      console.error('Error loading providers:', err);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      role: user.role as UserRole,
      provider_id: user.provider_id || '',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    try {
      setCreatingUser(true);
      setCreateError(null);
      const updated = await usersApi.update(editingUser.id, editFormData);
      setUsers(users.map(u => u.id === editingUser.id ? updated.data : u));
      setShowEditModal(false);
      setEditingUser(null);
      setSuccessMessage('Cambios guardados exitosamente');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Error al actualizar usuario');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    setDeleting(true);
    setError(null);

    try {
      await usersApi.delete(userToDelete.id);
      setUsers(users.filter(u => u.id !== userToDelete.id));
      setShowDeleteConfirm(false);
      setUserToDelete(null);
      setSuccessMessage('Usuario eliminado exitosamente');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar usuario');
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateUser = async () => {
    // Validation
    if (!formData.email || !formData.password) {
      setCreateError('Email and password are required');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setCreateError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 12) {
      setCreateError('Contraseña debe tener mínimo 12 caracteres');
      return;
    }

    if (!/[A-Z]/.test(formData.password)) {
      setCreateError('Contraseña debe contener al menos una mayúscula');
      return;
    }

    if (!/[a-z]/.test(formData.password)) {
      setCreateError('Contraseña debe contener al menos una minúscula');
      return;
    }

    if (!/[!@#$%^&*]/.test(formData.password)) {
      setCreateError('Contraseña debe contener al menos un carácter especial (!@#$%^&*)');
      return;
    }

    if (formData.role === 'provider_admin' && !formData.provider_id) {
      setCreateError(`Provider is required for role '${formData.role}'`);
      return;
    }

    try {
      setCreatingUser(true);
      setCreateError(null);
      const newUser = await usersApi.create({
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirm_password,
        role: formData.role,
        provider_id: formData.provider_id || undefined,
        first_name: formData.first_name,
        last_name: formData.last_name,
      });

      setUsers([...users, newUser.data]);
      setShowCreateModal(false);
      setFormData({
        email: '',
        password: '',
        confirm_password: '',
        role: 'provider_admin',
        provider_id: '',
        first_name: '',
        last_name: '',
      });
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Error creating user');
    } finally {
      setCreatingUser(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div style={{ padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          <div style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>Cargando usuarios...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="admin-dashboard">
        <div style={{ padding: '32px', maxWidth: '1600px', margin: '0 auto' }}>
        <div className="dashboard-header">
          <h1 className="dashboard-title">Gestión de Usuarios</h1>
          <p className="dashboard-subtitle">Crear y administrar usuarios con diferentes roles</p>
        </div>

        <div className="dashboard-toolbar">
          <div style={{ flex: 1 }}></div>
          <div className="dashboard-actions">
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = '/api/users/export-excel';
                link.download = 'usuarios.xlsx';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="btn-dashboard btn-dashboard-secondary"
              title="Descargar usuarios en Excel"
            >
              📊 Excel
            </button>
            <button onClick={() => setShowCreateModal(true)} className="btn-dashboard btn-dashboard-primary">
              + Crear Usuario
            </button>
          </div>
        </div>

        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', marginBottom: 'var(--space-6)', color: '#991b1b', fontSize: '13px' }}>{error}</div>}

        <div className="dashboard-table-container">
          <table className="dashboard-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Nombre</th>
              <th>Rol</th>
              <th>Prestador</th>
              <th>Estado</th>
              <th>Creado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyState}>
                  No hay usuarios registrados
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>{user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : '—'}</td>
                  <td><span style={{ display: 'inline-block', padding: '4px 12px', fontSize: '11px', fontWeight: '700', borderRadius: '9999px', letterSpacing: '0.06em', textTransform: 'uppercase', background: 'var(--brand-primary)', color: 'white' }}>{getRoleLabel(user.role)}</span></td>
                  <td className="dashboard-table-cell-muted">
                    {user.provider_id
                      ? providers.find(p => p.id === user.provider_id)?.legal_name || user.provider_id
                      : '—'}
                  </td>
                  <td><span style={{ display: 'inline-block', padding: '4px 12px', fontSize: '11px', fontWeight: '700', borderRadius: '9999px', letterSpacing: '0.06em', textTransform: 'uppercase', background: user.status === 'active' ? '#dcfce7' : '#fee2e2', color: user.status === 'active' ? '#166534' : '#991b1b' }}>{getStatusLabel(user.status)}</span></td>
                  <td>{new Date(user.created_at).toLocaleDateString('es-CO')}</td>
                  <td style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleEditUser(user)}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", opacity: 0.7, transition: "all 0.2s" }}
                      title="Editar usuario"
                      disabled={loading}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user)}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", opacity: 0.7, transition: "all 0.2s" }}
                      title="Eliminar usuario"
                      disabled={loading || deleting}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal para crear usuario */}
      {showCreateModal && (
        <div className="dashboard-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="dashboard-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dashboard-modal-header">
              <h2>Crear nuevo usuario</h2>
              <button className="dashboard-modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>

            <div className="dashboard-modal-body">
              <div className="dashboard-form-group">
                <label>Email *</label>
                <input
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={creatingUser}
                />
              </div>

              <div style={{ display: "flex", gap: "var(--space-4)" }}>
                <div className="dashboard-form-group">
                  <label>Nombre</label>
                  <input
                    type="text"
                    placeholder="Juan"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    disabled={creatingUser}
                  />
                </div>
                <div className="dashboard-form-group">
                  <label>Apellido</label>
                  <input
                    type="text"
                    placeholder="Pérez"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    disabled={creatingUser}
                  />
                </div>
              </div>

              <div className="dashboard-form-group">
                <label>Rol *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole, provider_id: '' })}
                  disabled={creatingUser}
                >
                  <option value="provider_admin">Prestador de Servicio</option>
                  <option value="auditor">Auditor</option>
                  <option value="super_admin">Administrador</option>
                </select>
              </div>

              {formData.role === 'provider_admin' && (
                <div className="dashboard-form-group">
                  <label>Prestador *</label>
                  <select
                    value={formData.provider_id}
                    onChange={(e) => setFormData({ ...formData, provider_id: e.target.value })}
                    disabled={creatingUser}
                  >
                    <option value="">Seleccionar prestador...</option>
                    {(providers || []).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.legal_name} ({p.rut})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: "flex", gap: "var(--space-4)" }}>
                <div className="dashboard-form-group">
                  <label>Contraseña *</label>
                  <input
                    type="password"
                    placeholder="Mín. 12 caracteres (mayús, minús, símbolo)"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    disabled={creatingUser}
                  />
                  {formData.password && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b778c' }}>
                      <div style={{ color: getPasswordRequirements(formData.password).length ? '#00875a' : '#de350b' }}>
                        {getPasswordRequirements(formData.password).length ? '✓' : '✗'} 12+ caracteres
                      </div>
                      <div style={{ color: getPasswordRequirements(formData.password).uppercase ? '#00875a' : '#de350b' }}>
                        {getPasswordRequirements(formData.password).uppercase ? '✓' : '✗'} Mayúscula (A-Z)
                      </div>
                      <div style={{ color: getPasswordRequirements(formData.password).lowercase ? '#00875a' : '#de350b' }}>
                        {getPasswordRequirements(formData.password).lowercase ? '✓' : '✗'} Minúscula (a-z)
                      </div>
                      <div style={{ color: getPasswordRequirements(formData.password).special ? '#00875a' : '#de350b' }}>
                        {getPasswordRequirements(formData.password).special ? '✓' : '✗'} Símbolo (!@#$%^&*)
                      </div>
                    </div>
                  )}
                </div>
                <div className="dashboard-form-group">
                  <label>Confirmar Contraseña *</label>
                  <input
                    type="password"
                    placeholder="Repetir contraseña"
                    value={formData.confirm_password}
                    onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                    disabled={creatingUser}
                  />
                </div>
              </div>

              {createError && <div style={{ fontSize: "12px", color: "var(--color-danger)", marginTop: "var(--space-2)" }}>{createError}</div>}
            </div>

            <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end", padding: "var(--space-6)", borderTop: "1px solid var(--border-default)", background: "var(--neutral-50)" }}>
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={creatingUser}
                className="btn-dashboard btn-dashboard-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateUser}
                disabled={creatingUser}
                className={styles.btnPrimary}
              >
                {creatingUser ? 'Creando...' : 'Crear Usuario'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar usuario */}
      {showEditModal && editingUser && (
        <div className="dashboard-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="dashboard-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dashboard-modal-header">
              <h2>Editar usuario</h2>
              <button className="dashboard-modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>

            <div className="dashboard-modal-body">
              {createError && <div style={{ fontSize: "12px", color: "var(--color-danger)", marginTop: "var(--space-2)" }}>{createError}</div>}

              <div className="dashboard-form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={editingUser.email}
                  disabled
                  style={{ backgroundColor: '#f8fafc', color: '#94a3b8' }}
                />
              </div>

              <div style={{ display: "flex", gap: "var(--space-4)" }}>
                <div className="dashboard-form-group">
                  <label>Nombre</label>
                  <input
                    type="text"
                    value={editFormData.first_name}
                    onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                    disabled={creatingUser}
                  />
                </div>
                <div className="dashboard-form-group">
                  <label>Apellido</label>
                  <input
                    type="text"
                    value={editFormData.last_name}
                    onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                    disabled={creatingUser}
                  />
                </div>
              </div>

              <div className="dashboard-form-group">
                <label>Rol</label>
                <select
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as UserRole, provider_id: '' })}
                  disabled={creatingUser}
                >
                  <option value="provider_admin">Prestador de Servicio</option>
                  <option value="auditor">Auditor</option>
                  <option value="super_admin">Administrador</option>
                </select>
              </div>

              {editFormData.role === 'provider_admin' && (
                <div className="dashboard-form-group">
                  <label>Prestador</label>
                  <select
                    value={editFormData.provider_id}
                    onChange={(e) => setEditFormData({ ...editFormData, provider_id: e.target.value })}
                    disabled={creatingUser}
                  >
                    <option value="">Seleccionar prestador...</option>
                    {(providers || []).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.legal_name} ({p.rut})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end", padding: "var(--space-6)", borderTop: "1px solid var(--border-default)", background: "var(--neutral-50)" }}>
              <button
                onClick={() => setShowEditModal(false)}
                disabled={creatingUser}
                className="btn-dashboard btn-dashboard-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={creatingUser}
                className={styles.btnPrimary}
              >
                {creatingUser ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && userToDelete && (
        <div className="dashboard-modal-overlay" onClick={() => !deleting && setShowDeleteConfirm(false)}>
          <div className="dashboard-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="dashboard-modal-header">
              <h2>Eliminar usuario</h2>
              <button
                className="dashboard-modal-close"
                onClick={() => !deleting && setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                ×
              </button>
            </div>

            <div className="dashboard-modal-body">
              {error && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  padding: '12px',
                  marginBottom: '16px',
                  color: '#991b1b',
                  fontSize: '13px',
                }}>
                  {error}
                </div>
              )}
              <p style={{ marginBottom: '16px', color: '#333' }}>
                ¿Está seguro de que desea eliminar al usuario <strong>{userToDelete.email}</strong>?
              </p>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '0' }}>
                Esta acción no se puede deshacer.
              </p>
            </div>

            <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end", padding: "var(--space-6)", borderTop: "1px solid var(--border-default)", background: "var(--neutral-50)" }}>
              <button
                onClick={() => !deleting && setShowDeleteConfirm(false)}
                disabled={deleting}
                className="btn-dashboard btn-dashboard-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteUser}
                disabled={deleting}
                style={{
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.6 : 1,
                  fontSize: '14px',
                  fontWeight: '600',
                }}
              >
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
      </div>

      {/* Toast de éxito - Fuera del admin-dashboard para que sea visible */}
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
    </>
  );
}

export default UsersPage;
