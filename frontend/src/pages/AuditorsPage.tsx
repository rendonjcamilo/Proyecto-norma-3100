/**
 * Auditors Page — Gestión de auditores y sus prestadores asignados
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
  status: 'active' | 'inactive' | 'suspended' | 'revoked';
}

interface Auditor extends User {
  assigned_count?: number;
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  suspended: 'Suspendido',
  revoked: 'Eliminado',
};

const STATUS_COLORS: Record<string, string> = {
  active: '#00875a',
  inactive: '#6b778c',
  suspended: '#de350b',
  revoked: '#de350b',
};

export const AuditorsPage: React.FC = () => {
  const [auditors, setAuditors] = useState<Auditor[]>([]);
  const [allProviders, setAllProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAuditor, setSelectedAuditor] = useState<Auditor | null>(null);
  const [assignedProviders, setAssignedProviders] = useState<Provider[]>([]);
  const [availableProviders, setAvailableProviders] = useState<Provider[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedToAdd, setSelectedToAdd] = useState<string[]>([]);

  // Load auditors and all providers
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [usersRes, providersRes] = await Promise.all([
          usersApi.list(),
          providersApi.list(),
        ]);

        // Filter only auditors
        const auditorsList = (usersRes.data || []).filter((u) => u.role === 'auditor');
        setAuditors(auditorsList);

        // Filter active providers (exclude revoked)
        const activeProviders = (providersRes.data || []).filter((p: any) => p.status !== 'revoked');
        setAllProviders(activeProviders);
      } catch {
        console.error('Failed to load auditors or providers');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Filter auditors by search
  const filteredAuditors = auditors.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.email?.toLowerCase().includes(q) ||
      a.first_name?.toLowerCase().includes(q) ||
      a.last_name?.toLowerCase().includes(q)
    );
  });

  // Load providers for selected auditor
  const openAuditorModal = async (auditor: Auditor) => {
    setSelectedAuditor(auditor);
    setLoadingProviders(true);
    setSelectedToAdd([]);

    try {
      const res = await providersApi.getAuditorProviders(auditor.id);
      const assigned = res.data?.providers || [];
      setAssignedProviders(assigned);

      // Calculate available providers
      const assignedIds = new Set(assigned.map((p: any) => p.id));
      const available = allProviders.filter((p) => !assignedIds.has(p.id));
      setAvailableProviders(available);
    } catch {
      console.error('Failed to load auditor providers');
    } finally {
      setLoadingProviders(false);
      setShowModal(true);
    }
  };

  // Add selected providers to auditor
  const handleAddProviders = async () => {
    if (selectedToAdd.length === 0 || !selectedAuditor) return;

    setLoadingProviders(true);

    try {
      // Assign each selected provider to the auditor
      await Promise.all(
        selectedToAdd.map((providerId) =>
          providersApi.assignAuditor(providerId, selectedAuditor.id)
        )
      );

      // Reload providers for this auditor
      const res = await providersApi.getAuditorProviders(selectedAuditor.id);
      const assigned = res.data?.providers || [];
      setAssignedProviders(assigned);

      // Recalculate available
      const assignedIds = new Set(assigned.map((p: any) => p.id));
      const available = allProviders.filter((p) => !assignedIds.has(p.id));
      setAvailableProviders(available);

      setSelectedToAdd([]);
      setSuccessMessage(`${selectedToAdd.length} prestador(es) asignado(s)`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Error assigning providers:', err);
    } finally {
      setLoadingProviders(false);
    }
  };

  // Remove provider from auditor
  const handleRemoveProvider = async (providerId: string) => {
    if (!selectedAuditor) return;

    setLoadingProviders(true);

    try {
      await providersApi.removeAuditorFromProvider(providerId, selectedAuditor.id);

      // Reload providers for this auditor
      const res = await providersApi.getAuditorProviders(selectedAuditor.id);
      const assigned = res.data?.providers || [];
      setAssignedProviders(assigned);

      // Recalculate available
      const assignedIds = new Set(assigned.map((p: any) => p.id));
      const available = allProviders.filter((p) => !assignedIds.has(p.id));
      setAvailableProviders(available);

      setSuccessMessage('Prestador removido exitosamente');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Error removing provider:', err);
    } finally {
      setLoadingProviders(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container page-loading">
        <div className="page-spinner" />
        <p>Cargando auditores...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Auditores</h1>
          <p className="page-subtitle">
            Gestión de auditores y prestadores asignados
          </p>
        </div>
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
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="page-search"
          />
        </div>
        <span className="search-count">{filteredAuditors.length} auditores</span>
      </div>

      {/* Auditors table */}
      <div className="page-table-wrapper">
        <table className="page-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Prestadores Asignados</th>
              <th style={{ textAlign: 'center', width: '120px' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {filteredAuditors.map((a) => (
              <tr key={a.id}>
                <td className="cell-bold">{a.first_name} {a.last_name}</td>
                <td className="cell-code">{a.email}</td>
                <td style={{ textAlign: 'center' }}>
                  <span style={{
                    background: '#0066cc20',
                    color: '#0066cc',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    {a.assigned_count || 0}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button
                    onClick={() => openAuditorModal(a)}
                    style={{
                      padding: '6px 14px',
                      fontSize: '12px',
                      background: '#0066cc',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Gestionar
                  </button>
                </td>
              </tr>
            ))}
            {filteredAuditors.length === 0 && (
              <tr>
                <td colSpan={4} className="cell-empty">
                  Sin resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal para gestionar prestadores */}
      {showModal && selectedAuditor && (
        <div className="modal-overlay" onClick={() => !loadingProviders && setShowModal(false)}>
          <div className="modal-box" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Gestionar prestadores — {selectedAuditor.first_name} {selectedAuditor.last_name}</h2>
              <button
                className="modal-close"
                onClick={() => !loadingProviders && setShowModal(false)}
                disabled={loadingProviders}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {/* Prestadores asignados */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#333' }}>
                  Prestadores Asignados ({assignedProviders.length})
                </h3>
                {assignedProviders.length === 0 ? (
                  <p style={{ color: '#666', fontSize: '13px' }}>Sin prestadores asignados</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {assignedProviders.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 12px',
                          background: '#f5f5f5',
                          borderRadius: '6px',
                          fontSize: '13px',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: '500', color: '#333' }}>{p.legal_name}</div>
                          <div style={{ color: '#666', fontSize: '12px' }}>{p.rut}</div>
                        </div>
                        <button
                          onClick={() => handleRemoveProvider(p.id)}
                          disabled={loadingProviders}
                          style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                          }}
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Prestadores disponibles */}
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#333' }}>
                  Prestadores Disponibles ({availableProviders.length})
                </h3>
                {availableProviders.length === 0 ? (
                  <p style={{ color: '#666', fontSize: '13px' }}>Todos los prestadores están asignados</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {availableProviders.map((p) => (
                      <label
                        key={p.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '10px 12px',
                          background: '#fafafa',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedToAdd.includes(p.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedToAdd([...selectedToAdd, p.id]);
                            } else {
                              setSelectedToAdd(selectedToAdd.filter((id) => id !== p.id));
                            }
                          }}
                          disabled={loadingProviders}
                          style={{ marginRight: '10px', cursor: 'pointer' }}
                        />
                        <div>
                          <div style={{ fontWeight: '500', color: '#333' }}>{p.legal_name}</div>
                          <div style={{ color: '#666', fontSize: '12px' }}>{p.rut} • {p.city}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="modal-btn-cancel"
                onClick={() => setShowModal(false)}
                disabled={loadingProviders}
              >
                Cerrar
              </button>
              {selectedToAdd.length > 0 && (
                <button
                  className="modal-btn-primary"
                  onClick={handleAddProviders}
                  disabled={loadingProviders}
                >
                  {loadingProviders ? (
                    <>
                      <span className="spinner-small" />
                      Asignando...
                    </>
                  ) : (
                    `Asignar ${selectedToAdd.length}`
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {successMessage && (
        <div
          style={{
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
          }}
        >
          <span style={{ fontSize: '20px' }}>✅</span>
          <span style={{ fontWeight: '500' }}>{successMessage}</span>
        </div>
      )}
    </div>
  );
};
