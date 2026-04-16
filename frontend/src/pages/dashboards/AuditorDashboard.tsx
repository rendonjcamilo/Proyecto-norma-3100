/**
 * Auditor Dashboard
 * Manage assigned providers and review pending evaluations
 */

import './dashboards.css';
import React, { useState, useEffect } from 'react';
import { providersApi, assessmentsApi } from '@services/api';

interface ProviderWithMetrics {
  id: string;
  legal_name: string;
  rut: string;
  compliance_rate?: number;
  pending_validations?: number;
}

export function AuditorDashboard(): JSX.Element {
  const [providers, setProviders] = useState<ProviderWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [creatingProvider, setCreatingProvider] = useState(false);
  const [formData, setFormData] = useState({
    rut: '',
    legal_name: '',
    address: '',
    city: '',
    department: '',
  });

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await providersApi.getMyProviders();
      setProviders(response.providers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading providers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreatingProvider(true);
      await providersApi.create(formData);
      setFormData({ rut: '', legal_name: '', address: '', city: '', department: '' });
      setShowAddProvider(false);
      loadProviders();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error creating provider');
    } finally {
      setCreatingProvider(false);
    }
  };

  const getComplianceColor = (rate?: number) => {
    if (!rate) return 'gray';
    if (rate >= 80) return 'green';
    if (rate >= 50) return 'orange';
    return 'red';
  };

  const getComplianceLabel = (rate?: number) => {
    if (!rate) return 'Sin evaluar';
    if (rate >= 80) return '✓ Conforme';
    if (rate >= 50) return '⚠ Parcial';
    return '✗ No conforme';
  };

  if (loading) {
    return <div className="dashboard-loading">Cargando sus prestadores...</div>;
  }

  if (error) {
    return <div className="dashboard-error">Error: {error}</div>;
  }

  return (
    <div className="dashboard auditor-dashboard">
      <div className="dashboard-header">
        <h1>Mis Prestadores</h1>
        <button
          onClick={() => setShowAddProvider(true)}
          className="btn btn-primary"
        >
          + Agregar Prestador
        </button>
      </div>

      {showAddProvider && (
        <div className="modal-backdrop" onClick={() => setShowAddProvider(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Crear Nuevo Prestador</h2>
            <form onSubmit={handleCreateProvider} className="provider-form">
              <div className="form-group">
                <label>RUT *</label>
                <input
                  type="text"
                  placeholder="Ej: 860.123.456-7"
                  value={formData.rut}
                  onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nombre Legal *</label>
                <input
                  type="text"
                  placeholder="Nombre completo del prestador"
                  value={formData.legal_name}
                  onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Dirección *</label>
                <input
                  type="text"
                  placeholder="Dirección completa"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Ciudad *</label>
                <input
                  type="text"
                  placeholder="Ciudad"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Departamento</label>
                <input
                  type="text"
                  placeholder="Departamento"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowAddProvider(false)} className="btn btn-outline">
                  Cancelar
                </button>
                <button type="submit" disabled={creatingProvider} className="btn btn-primary">
                  {creatingProvider ? 'Creando...' : 'Crear Prestador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {providers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏥</div>
          <h2>Sin prestadores asignados</h2>
          <p>Cree o solicite que le asignen prestadores para comenzar</p>
          <button
            onClick={() => setShowAddProvider(true)}
            className="btn btn-primary"
          >
            Crear Prestador
          </button>
        </div>
      ) : (
        <div className="providers-grid">
          {providers.map(provider => (
            <div key={provider.id} className="provider-card">
              <div className="provider-header">
                <h3>{provider.legal_name}</h3>
                <span className={`compliance-badge ${getComplianceColor(provider.compliance_rate)}`}>
                  {getComplianceLabel(provider.compliance_rate)}
                </span>
              </div>

              <div className="provider-info">
                <div className="info-row">
                  <span className="label">RUT:</span>
                  <span className="value">{provider.rut}</span>
                </div>

                <div className="info-row">
                  <span className="label">Cumplimiento:</span>
                  <span className="value">
                    {provider.compliance_rate?.toFixed(1) || 'N/A'}%
                  </span>
                </div>

                <div className="info-row">
                  <span className="label">Evaluaciones pendientes de validar:</span>
                  <span className="value badge-warning">
                    {provider.pending_validations || 0}
                  </span>
                </div>
              </div>

              <div className="provider-actions">
                <a href={`/providers/${provider.id}`} className="btn btn-outline">
                  Ver Detalles
                </a>
                <a href={`/assessments?provider=${provider.id}`} className="btn btn-outline">
                  Evaluaciones
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
