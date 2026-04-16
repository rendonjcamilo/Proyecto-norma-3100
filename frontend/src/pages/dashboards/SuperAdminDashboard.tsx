/**
 * Super Admin Dashboard
 * Global metrics and quick access for system administration
 */

import './dashboards.css';
import React, { useState, useEffect } from 'react';
import { reportsApi, providersApi } from '@services/api';

interface GlobalSummary {
  totalProviders: number;
  totalAuditors: number;
  assessmentsInProgress: number;
  criticalFindings: number;
  avgComplianceRate: number;
}

interface NewProvider {
  rut: string;
  legal_name: string;
  address: string;
  city: string;
  department: string;
}

export function SuperAdminDashboard(): JSX.Element {
  const [summary, setSummary] = useState<GlobalSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingProvider, setCreatingProvider] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [formData, setFormData] = useState<NewProvider>({
    rut: '',
    legal_name: '',
    address: '',
    city: '',
    department: '',
  });

  useEffect(() => {
    fetchGlobalSummary();
  }, []);

  const fetchGlobalSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportsApi.getGlobalSummary();
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading summary');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProvider = async () => {
    if (!formData.rut || !formData.legal_name) {
      setCreateError('RUT y nombre legal son requeridos');
      return;
    }

    try {
      setCreatingProvider(true);
      setCreateError(null);
      await providersApi.create(formData);
      setShowCreateModal(false);
      setFormData({ rut: '', legal_name: '', address: '', city: '', department: '' });
      await fetchGlobalSummary();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Error creando prestador');
    } finally {
      setCreatingProvider(false);
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Cargando métricas globales...</div>;
  }

  if (error) {
    return <div className="dashboard-error">Error: {error}</div>;
  }

  return (
    <div className="dashboard super-admin-dashboard">
      <div className="dashboard-header super-admin-header">
        <h1>Panel de administración</h1>
        <button onClick={fetchGlobalSummary} className="btn-refresh">
          Actualizar
        </button>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Prestadores Registrados</div>
          <div className="kpi-value">{summary?.totalProviders || 0}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Auditores Activos</div>
          <div className="kpi-value">{summary?.totalAuditors || 0}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Evaluaciones en Curso</div>
          <div className="kpi-value">{summary?.assessmentsInProgress || 0}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Hallazgos Críticos</div>
          <div className="kpi-value critical">{summary?.criticalFindings || 0}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Cumplimiento Promedio</div>
          <div className="kpi-value">{summary?.avgComplianceRate || 0}%</div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Accesos Rápidos de Administración</h2>
        <div className="quick-access-grid">
          <button
            onClick={() => setShowCreateModal(true)}
            className="quick-access-card"
            style={{ cursor: 'pointer', border: 'none', background: 'none', padding: 0 }}
          >
            <div className="card-icon">➕</div>
            <div className="card-label">Crear Prestador de Salud</div>
          </button>

          <a href="/providers" className="quick-access-card">
            <div className="card-icon">🏥</div>
            <div className="card-label">Prestadores de Salud</div>
          </a>

          <a href="/questionnaires" className="quick-access-card">
            <div className="card-icon">📋</div>
            <div className="card-label">Cuestionarios</div>
          </a>

          <a href="/users" className="quick-access-card">
            <div className="card-icon">👥</div>
            <div className="card-label">Gestionar Usuarios</div>
          </a>

          <a href="/reports" className="quick-access-card">
            <div className="card-icon">📊</div>
            <div className="card-label">Reportes Globales</div>
          </a>
        </div>
      </div>

      {/* Modal para crear prestador */}
      {showCreateModal && (
        <>
          <div
            className="modal-overlay"
            onClick={() => setShowCreateModal(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
          >
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'white',
                padding: '24px',
                borderRadius: '8px',
                maxWidth: '500px',
                width: '90%',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              }}
            >
              <h2 style={{ marginTop: 0 }}>Crear Prestador de Salud</h2>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
                  RUT *
                </label>
                <input
                  type="text"
                  placeholder="Ej: 860123456"
                  value={formData.rut}
                  onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
                  Nombre Legal *
                </label>
                <input
                  type="text"
                  placeholder="Hospital San José"
                  value={formData.legal_name}
                  onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
                  Dirección
                </label>
                <input
                  type="text"
                  placeholder="Calle 1 # 2-3"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
                  Ciudad
                </label>
                <input
                  type="text"
                  placeholder="Bogotá"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
                  Departamento
                </label>
                <input
                  type="text"
                  placeholder="Cundinamarca"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {createError && (
                <div style={{ color: '#d32f2f', marginBottom: '16px', fontSize: '14px' }}>
                  {createError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowCreateModal(false)}
                  disabled={creatingProvider}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    background: 'white',
                    cursor: creatingProvider ? 'not-allowed' : 'pointer',
                    opacity: creatingProvider ? 0.6 : 1,
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateProvider}
                  disabled={creatingProvider}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '4px',
                    background: '#0052cc',
                    color: 'white',
                    cursor: creatingProvider ? 'not-allowed' : 'pointer',
                    opacity: creatingProvider ? 0.6 : 1,
                  }}
                >
                  {creatingProvider ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
