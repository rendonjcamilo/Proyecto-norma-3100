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

const getRoleLabel = (role: UserRole): string => ROLE_LABELS[role] || role;

export function UsersPage(): JSX.Element {
  const [users, setUsers] = useState<User[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirm_password: '',
    role: 'provider_admin' as UserRole,
    provider_id: '',
    first_name: '',
    last_name: '',
  });

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

  const handleCreateUser = async () => {
    // Validation
    if (!formData.email || !formData.password) {
      setCreateError('Email and password are required');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setCreateError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setCreateError('Password must be at least 8 characters');
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
    return <div className={styles.container}><div className={styles.loading}>Cargando usuarios...</div></div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Gestión de Usuarios</h1>
          <p>Crear y administrar usuarios con diferentes roles</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className={styles.btnCreate}>
          + Crear Usuario
        </button>
      </div>

      {error && <div className={styles.alert}>{error}</div>}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Email</th>
              <th>Nombre</th>
              <th>Rol</th>
              <th>Prestador</th>
              <th>Estado</th>
              <th>Creado</th>
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
                  <td><span className={`${styles.badge} ${styles[`badge-${user.role}`]}`}>{getRoleLabel(user.role)}</span></td>
                  <td>
                    {user.provider_id
                      ? providers.find(p => p.id === user.provider_id)?.legal_name || user.provider_id
                      : '—'}
                  </td>
                  <td><span className={`${styles.badge} ${styles[`badge-${user.status}`]}`}>{user.status}</span></td>
                  <td>{new Date(user.created_at).toLocaleDateString('es-CO')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal para crear usuario */}
      {showCreateModal && (
        <>
          <div className={styles.overlay} onClick={() => setShowCreateModal(false)} />
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Crear nuevo usuario</h2>
              <button className={styles.closeBtn} onClick={() => setShowCreateModal(false)}>×</button>
            </div>

            <div className={styles.modalContent}>
              <div className={styles.formGroup}>
                <label>Email *</label>
                <input
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={creatingUser}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Nombre</label>
                  <input
                    type="text"
                    placeholder="Juan"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    disabled={creatingUser}
                  />
                </div>
                <div className={styles.formGroup}>
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

              <div className={styles.formGroup}>
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
                <div className={styles.formGroup}>
                  <label>Prestador *</label>
                  <select
                    value={formData.provider_id}
                    onChange={(e) => setFormData({ ...formData, provider_id: e.target.value })}
                    disabled={creatingUser}
                  >
                    <option value="">Seleccionar prestador...</option>
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.legal_name} ({p.rut})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Contraseña *</label>
                  <input
                    type="password"
                    placeholder="Mín. 8 caracteres"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    disabled={creatingUser}
                  />
                </div>
                <div className={styles.formGroup}>
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

              {createError && <div className={styles.formError}>{createError}</div>}
            </div>

            <div className={styles.modalActions}>
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={creatingUser}
                className={styles.btnSecondary}
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
        </>
      )}
    </div>
  );
}

export default UsersPage;
