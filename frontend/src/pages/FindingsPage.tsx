/**
 * Findings Page — Hallazgos y acciones correctivas
 * Features: detalles, edición, cambio de estado, acciones correctivas
 */

import React, { useEffect, useState } from 'react';
import { findingsApi, type Finding } from '../services/api';
import { useRolePermission } from '../hooks/useRolePermission';
import { useProvider } from '../context/ProviderContext';
import './Pages.css';

interface FindingsPageProps {
  providerId: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#de350b',
  high: '#ff8b00',
  medium: '#ffab00',
  low: '#36b37e',
};

const SEVERITY_LABELS: Record<string, string> = {
  critical: 'CRÍTICO',
  high: 'ALTO',
  medium: 'MEDIO',
  low: 'BAJO',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Abierto',
  in_progress: 'En Progreso',
  resolved: 'Resuelto',
  closed: 'Cerrado',
};

const STATUS_ORDER = ['open', 'in_progress', 'resolved', 'closed'];

export const FindingsPage: React.FC<FindingsPageProps> = ({ providerId }) => {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);

  // Estado de selección
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [findingActions, setFindingActions] = useState<any[]>([]);

  // Formularios
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    title: '',
    description: '',
    severity: 'high' as const,
    due_date: '',
  });

  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    severity: 'high' as const,
    due_date: '',
    status: 'open' as const,
  });

  const [actionFormData, setActionFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium',
  });

  const { can } = useRolePermission();
  const { availableProviders, selectedProvider } = useProvider();

  // Estado para selector de prestador en modal
  const [selectedProviderForCreation, setSelectedProviderForCreation] = useState<string>(providerId);

  // Cargar hallazgos
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await findingsApi.listByProvider(providerId);
        setFindings(res.data || []);
      } catch {
        console.error('Failed to load findings');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [providerId]);

  // Filtrar hallazgos
  const filtered = findings.filter((f) => {
    const statusMatch = statusFilter === 'all' || f.status === statusFilter;
    const severityMatch = severityFilter === 'all' || f.severity === severityFilter;
    return statusMatch && severityMatch;
  });

  const counts = {
    all: findings.length,
    open: findings.filter((f) => f.status === 'open').length,
    in_progress: findings.filter((f) => f.status === 'in_progress').length,
    resolved: findings.filter((f) => f.status === 'resolved').length,
    closed: findings.filter((f) => f.status === 'closed').length,
  };

  // Abrir detalles de hallazgo
  const openDetail = async (finding: Finding) => {
    setSelectedFinding(finding);
    try {
      const res = await findingsApi.getById(finding.id);
      setFindingActions(res.data?.actions || []);
    } catch (err) {
      console.error('Failed to load finding details:', err);
      setFindingActions([]);
    }
    setShowDetailModal(true);
  };

  // Abrir edición
  const openEdit = (finding: Finding) => {
    setSelectedFinding(finding);
    setEditFormData({
      title: finding.title,
      description: finding.description,
      severity: finding.severity as any,
      due_date: finding.due_date ? new Date(finding.due_date).toISOString().split('T')[0] : '',
      status: finding.status as any,
    });
    setShowDetailModal(false);
    setShowEditModal(true);
  };

  // Guardar cambios en hallazgo
  const handleSaveEdit = async () => {
    if (!selectedFinding) return;
    try {
      setIsSubmitting(true);
      await findingsApi.update(selectedFinding.id, {
        title: editFormData.title,
        description: editFormData.description,
        severity: editFormData.severity,
        due_date: editFormData.due_date,
        status: editFormData.status,
      });
      setShowEditModal(false);
      const res = await findingsApi.listByProvider(providerId);
      setFindings(res.data || []);
    } catch (error) {
      console.error('Error updating finding:', error);
      alert('Error al actualizar el hallazgo');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cambiar estado rápidamente
  const handleChangeStatus = async (finding: Finding, newStatus: string) => {
    try {
      await findingsApi.update(finding.id, { status: newStatus as any });
      const res = await findingsApi.listByProvider(providerId);
      setFindings(res.data || []);
      if (selectedFinding?.id === finding.id) {
        setSelectedFinding({ ...finding, status: newStatus as any });
      }
    } catch (error) {
      console.error('Error changing status:', error);
      alert('Error al cambiar el estado');
    }
  };

  // Eliminar hallazgo
  const handleDelete = async (finding: Finding) => {
    if (!window.confirm(`¿Eliminar el hallazgo "${finding.title}"?`)) return;
    try {
      await findingsApi.delete(finding.id);
      setShowDetailModal(false);
      const res = await findingsApi.listByProvider(providerId);
      setFindings(res.data || []);
    } catch (error) {
      console.error('Error deleting finding:', error);
      alert('Error al eliminar el hallazgo');
    }
  };

  // Crear nuevo hallazgo
  const handleCreateFinding = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await findingsApi.create({
        providerId: selectedProviderForCreation,
        title: createFormData.title,
        description: createFormData.description,
        severity: createFormData.severity,
        dueDate: createFormData.due_date,
      });
      setShowCreateModal(false);
      setCreateFormData({ title: '', description: '', severity: 'high', due_date: '' });
      const res = await findingsApi.listByProvider(providerId);
      setFindings(res.data || []);
    } catch (error) {
      console.error('Error creating finding:', error);
      alert('Error al crear el hallazgo');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Crear acción correctiva
  const handleCreateAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFinding) return;
    try {
      setIsSubmitting(true);
      await findingsApi.createAction(selectedFinding.id, {
        title: actionFormData.title,
        description: actionFormData.description,
        due_date: actionFormData.due_date,
        priority: actionFormData.priority,
      });
      setActionFormData({ title: '', description: '', due_date: '', priority: 'medium' });
      setShowActionModal(false);
      // Recargar acciones
      const res = await findingsApi.getById(selectedFinding.id);
      setFindingActions(res.data?.actions || []);
    } catch (error) {
      console.error('Error creating action:', error);
      alert('Error al crear la acción correctiva');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container page-loading">
        <div className="page-spinner" />
        <p>Cargando hallazgos...</p>
      </div>
    );
  }

  return (
    <div className="page-container aud-page">
      <div className="aud-hero">
        <div className="aud-hero-content">
          <span className="aud-hero-badge">
            <svg width="6" height="6" viewBox="0 0 6 6" fill="none"><circle cx="3" cy="3" r="3" fill="#818cf8"/></svg>
            Gestión de Cumplimiento
          </span>
          <h1 className="aud-hero-title">Hallazgos</h1>
          <p className="aud-hero-subtitle">Registro y seguimiento de no conformidades y oportunidades de mejora</p>
        </div>
        {can('findings', 'create') && (
          <div className="aud-hero-actions">
            <button className="aud-hero-btn" onClick={() => setShowCreateModal(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Nuevo Hallazgo
            </button>
          </div>
        )}
        <div className="aud-hero-orb" />
      </div>

      {/* Filtros */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: '#666' }}>Estado</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            <option value="all">Todos</option>
            <option value="open">Abierto</option>
            <option value="in_progress">En Progreso</option>
            <option value="resolved">Resuelto</option>
            <option value="closed">Cerrado</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: '#666' }}>Severidad</label>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            <option value="all">Todas</option>
            <option value="critical">Crítica</option>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
          </select>
        </div>
      </div>

      {/* Status tabs */}
      <div className="page-tabs">
        {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map((s) => (
          <button
            key={s}
            className={`page-tab ${statusFilter === s ? 'page-tab-active' : ''}`}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'all' ? 'Todos' : STATUS_LABELS[s]}
            <span className="tab-count">{counts[s]}</span>
          </button>
        ))}
      </div>

      {/* Findings list */}
      <div className="card-list">
        {filtered.length === 0 && (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="empty-icon">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>No se encontraron hallazgos con este filtro</p>
          </div>
        )}
        {filtered.map((f) => (
          <div
            key={f.id}
            className="finding-card"
            onClick={() => openDetail(f)}
            style={{ cursor: 'pointer' }}
          >
            <div className="finding-card-header">
              <span
                className="severity-badge"
                style={{
                  background: `${SEVERITY_COLORS[f.severity]}15`,
                  color: SEVERITY_COLORS[f.severity],
                }}
              >
                {SEVERITY_LABELS[f.severity] || f.severity.toUpperCase()}
              </span>
              <span
                className="status-badge"
                style={{
                  background: f.status === 'closed' || f.status === 'resolved' ? '#e3fcef' : '#f4f5f7',
                  color: f.status === 'closed' || f.status === 'resolved' ? '#00875a' : '#42526e',
                }}
              >
                {STATUS_LABELS[f.status]}
              </span>
            </div>
            <h3 className="finding-card-title">{f.title}</h3>
            <p className="finding-card-desc">{f.description}</p>
            <div className="finding-card-footer">
              <div className="risk-indicator">
                <span className="risk-label">Riesgo</span>
                <span
                  className="risk-value"
                  style={{
                    color: f.risk_score >= 70 ? '#de350b' : f.risk_score >= 40 ? '#ff8b00' : '#00875a',
                  }}
                >
                  {f.risk_score}
                </span>
              </div>
              {f.due_date && (
                <div className="due-date">
                  Vence: {new Date(f.due_date).toLocaleDateString('es-CO')}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: Detalles de hallazgo */}
      {showDetailModal && selectedFinding && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowDetailModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '700px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
              <h2 style={{ marginTop: 0, marginBottom: 0, fontSize: '20px' }}>{selectedFinding.title}</h2>
              {can('findings', 'edit') && (
                <button
                  onClick={() => openEdit(selectedFinding)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Editar
                </button>
              )}
            </div>

            <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <span
                  style={{
                    background: `${SEVERITY_COLORS[selectedFinding.severity]}15`,
                    color: SEVERITY_COLORS[selectedFinding.severity],
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {SEVERITY_LABELS[selectedFinding.severity]}
                </span>
                <span
                  style={{
                    background: selectedFinding.status === 'closed' || selectedFinding.status === 'resolved' ? '#e3fcef' : '#f4f5f7',
                    color: selectedFinding.status === 'closed' || selectedFinding.status === 'resolved' ? '#00875a' : '#42526e',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {STATUS_LABELS[selectedFinding.status]}
                </span>
              </div>
              <p style={{ margin: 0, color: '#666', lineHeight: '1.6' }}>{selectedFinding.description}</p>
            </div>

            {/* Cambiar estado */}
            {can('findings', 'edit') && (
              <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>Cambiar Estado</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {STATUS_ORDER.map((status) => (
                    <button
                      key={status}
                      onClick={() => handleChangeStatus(selectedFinding, status)}
                      style={{
                        padding: '6px 12px',
                        border: selectedFinding.status === status ? 'none' : '1px solid #ddd',
                        borderRadius: '4px',
                        background: selectedFinding.status === status ? '#0052cc' : 'white',
                        color: selectedFinding.status === status ? 'white' : '#333',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 500,
                      }}
                    >
                      {STATUS_LABELS[status]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Información adicional */}
            <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                <div>
                  <span style={{ color: '#666' }}>Riesgo</span>
                  <p style={{ margin: '4px 0 0 0', fontWeight: 600 }}>{selectedFinding.risk_score}</p>
                </div>
                {selectedFinding.due_date && (
                  <div>
                    <span style={{ color: '#666' }}>Vencimiento</span>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 600 }}>
                      {new Date(selectedFinding.due_date).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Acciones correctivas */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Acciones Correctivas ({findingActions.length})</h3>
                {can('findings', 'create') && (
                  <button
                    onClick={() => setShowActionModal(true)}
                    style={{
                      padding: '6px 12px',
                      border: 'none',
                      borderRadius: '4px',
                      background: '#0052cc',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    + Agregar
                  </button>
                )}
              </div>
              {findingActions.length === 0 ? (
                <p style={{ margin: 0, color: '#999', fontSize: '12px' }}>Sin acciones correctivas</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {findingActions.map((action) => (
                    <div
                      key={action.id}
                      style={{
                        padding: '10px',
                        border: '1px solid #eee',
                        borderRadius: '4px',
                        background: '#f9f9f9',
                        fontSize: '12px',
                      }}
                    >
                      <p style={{ margin: '0 0 4px 0', fontWeight: 600 }}>{action.title}</p>
                      <p style={{ margin: '0 0 4px 0', color: '#666' }}>{action.description}</p>
                      <div style={{ color: '#999' }}>
                        {action.due_date && `Vence: ${new Date(action.due_date).toLocaleDateString('es-CO')}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              {can('findings', 'delete') && (
                <button
                  onClick={() => handleDelete(selectedFinding)}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #de350b',
                    borderRadius: '4px',
                    background: 'white',
                    color: '#de350b',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  Eliminar
                </button>
              )}
              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Editar hallazgo */}
      {showEditModal && selectedFinding && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
          }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, marginBottom: '16px', fontSize: '20px' }}>Editar Hallazgo</h2>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Título</label>
                <input
                  type="text"
                  required
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Descripción</label>
                <textarea
                  required
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    minHeight: '80px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Severidad</label>
                <select
                  value={editFormData.severity}
                  onChange={(e) => setEditFormData({ ...editFormData, severity: e.target.value as any })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                  <option value="critical">Crítica</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Estado</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="open">Abierto</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="resolved">Resuelto</option>
                  <option value="closed">Cerrado</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Fecha de Vencimiento</label>
                <input
                  type="date"
                  value={editFormData.due_date}
                  onChange={(e) => setEditFormData({ ...editFormData, due_date: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '4px',
                    background: '#0052cc',
                    color: 'white',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    opacity: isSubmitting ? 0.6 : 1,
                  }}
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Crear acción correctiva */}
      {showActionModal && selectedFinding && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
          }}
          onClick={() => setShowActionModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, marginBottom: '16px', fontSize: '20px' }}>Nueva Acción Correctiva</h2>

            <form onSubmit={handleCreateAction}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Título</label>
                <input
                  type="text"
                  required
                  value={actionFormData.title}
                  onChange={(e) => setActionFormData({ ...actionFormData, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                  placeholder="Descripción breve de la acción"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Descripción</label>
                <textarea
                  required
                  value={actionFormData.description}
                  onChange={(e) => setActionFormData({ ...actionFormData, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    minHeight: '80px',
                    boxSizing: 'border-box',
                  }}
                  placeholder="Detalles de la acción correctiva"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Prioridad</label>
                <select
                  value={actionFormData.priority}
                  onChange={(e) => setActionFormData({ ...actionFormData, priority: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Fecha de Vencimiento</label>
                <input
                  type="date"
                  value={actionFormData.due_date}
                  onChange={(e) => setActionFormData({ ...actionFormData, due_date: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowActionModal(false)}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '4px',
                    background: '#0052cc',
                    color: 'white',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    opacity: isSubmitting ? 0.6 : 1,
                  }}
                >
                  {isSubmitting ? 'Creando...' : 'Crear Acción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Crear hallazgo */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, marginBottom: '16px', fontSize: '20px' }}>Nuevo Hallazgo</h2>

            {/* Mostrar prestador seleccionado */}
            <div style={{ marginBottom: '16px', padding: '12px', background: '#f0f5ff', borderRadius: '4px', fontSize: '13px' }}>
              <span style={{ color: '#666' }}>Para prestador:</span>
              <p style={{ margin: '4px 0 0 0', fontWeight: 600, color: '#0052cc' }}>
                {selectedProvider?.legalName || 'No seleccionado'}
              </p>
            </div>

            {/* Si hay múltiples prestadores, permitir seleccionar */}
            {availableProviders.length > 1 && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500, fontSize: '13px' }}>Cambiar prestador</label>
                <select
                  value={selectedProviderForCreation}
                  onChange={(e) => setSelectedProviderForCreation(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                >
                  {availableProviders.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.legalName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <form onSubmit={handleCreateFinding}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Título</label>
                <input
                  type="text"
                  required
                  value={createFormData.title}
                  onChange={(e) => setCreateFormData({ ...createFormData, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                  placeholder="Descripción breve del hallazgo"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Descripción</label>
                <textarea
                  required
                  value={createFormData.description}
                  onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    minHeight: '80px',
                    boxSizing: 'border-box',
                  }}
                  placeholder="Detalles del hallazgo"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Severidad</label>
                <select
                  value={createFormData.severity}
                  onChange={(e) => setCreateFormData({ ...createFormData, severity: e.target.value as any })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                  <option value="critical">Crítica</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Fecha de Vencimiento</label>
                <input
                  type="date"
                  required
                  value={createFormData.due_date}
                  onChange={(e) => setCreateFormData({ ...createFormData, due_date: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '4px',
                    background: '#0052cc',
                    color: 'white',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    opacity: isSubmitting ? 0.6 : 1,
                  }}
                >
                  {isSubmitting ? 'Creando...' : 'Crear Hallazgo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
