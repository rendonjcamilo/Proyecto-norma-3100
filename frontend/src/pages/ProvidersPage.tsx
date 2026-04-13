/**
 * Providers Page — Gestión de prestadores de salud
 */

import React, { useEffect, useState } from 'react';
import { providersApi } from '../services/api';
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

export const ProvidersPage: React.FC = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await providersApi.list();
        setProviders((res.data || []) as Provider[]);
      } catch {
        console.error('Failed to load providers');
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
        <button className="page-btn-primary">
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
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="cell-empty">
                  Sin resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
