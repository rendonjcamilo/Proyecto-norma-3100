/**
 * Findings Page — Hallazgos y acciones correctivas
 * Features: detalles, edición, cambio de estado, acciones correctivas
 */

import React, { useEffect, useState } from 'react';
import { findingsApi, type Finding } from '../services/api';
import { useRolePermission } from '../hooks/useRolePermission';
import { useProvider } from '../context/ProviderContext';
import { formatDate } from '@/utils/dateFormat';
import './Pages.css';

interface FindingsPageProps {
  providerId: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#dc2626',
  high: '#d97706',
  medium: '#f59e0b',
  low: '#059669',
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
        setFindings(res.findings || []);
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
      setFindingActions(res.actions || []);
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
      setFindings(res.findings || []);
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
      setFindings(res.findings || []);
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
      setFindings(res.findings || []);
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
      setFindings(res.findings || []);
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
      setFindingActions(res.actions || []);
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
            <svg width="6" height="6" viewBox="0 0 6 6" fill="none"><circle cx="3" cy="3" r="3" fill="#A78BFA"/></svg>
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

      {/* Filtro de severidad */}
      <div className="fnd-filter-bar">
        <span className="fnd-filter-label">Severidad</span>
        <select
          className="fnd-filter-select"
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
        >
          <option value="all">Todas</option>
          <option value="critical">Crítica</option>
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Baja</option>
        </select>
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

      {/* Findings grid */}
      <div className="prov-grid">
        {filtered.length === 0 && (
          <div className="prov-empty" style={{ gridColumn: '1/-1' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ opacity: 0.3 }}>
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3>Sin hallazgos</h3>
            <p>No se encontraron hallazgos con este filtro</p>
          </div>
        )}
        {filtered.map((f) => (
          <div key={f.id} className="prov-card" onClick={() => openDetail(f)} style={{ cursor: 'pointer' }}>
            <div className="prov-card-accent" style={{ background: SEVERITY_COLORS[f.severity] }} />
            <div className="prov-card-top">
              <div className="prov-card-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <span className="prov-status" style={{ background: `${SEVERITY_COLORS[f.severity]}18`, color: SEVERITY_COLORS[f.severity] }}>
                <span className="prov-status-dot" style={{ background: SEVERITY_COLORS[f.severity] }} />
                {SEVERITY_LABELS[f.severity] || f.severity.toUpperCase()}
              </span>
            </div>
            <div className="prov-card-name">{f.title}</div>
            <div className="prov-card-info">
              <div className="prov-info-row">
                <span className="prov-info-label">Estado</span>
                <span className="prov-info-value" style={{ color: f.status === 'closed' || f.status === 'resolved' ? '#059669' : f.status === 'in_progress' ? '#8B5CF6' : '#64748b' }}>
                  {STATUS_LABELS[f.status]}
                </span>
              </div>
              <div className="prov-info-row">
                <span className="prov-info-label">Riesgo</span>
                <span className="prov-info-value prov-mono" style={{ color: f.risk_score >= 70 ? '#dc2626' : f.risk_score >= 40 ? '#d97706' : '#059669' }}>
                  {f.risk_score}
                </span>
              </div>
              {f.due_date && (
                <div className="prov-info-row">
                  <span className="prov-info-label">Vence</span>
                  <span className="prov-info-value">{formatDate(f.due_date)}</span>
                </div>
              )}
              <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.45 }}>
                {f.description.length > 90 ? f.description.substring(0, 90) + '…' : f.description}
              </p>
            </div>
            <div className="prov-card-actions">
              <button className="prov-btn-edit assm-btn-full" onClick={(e) => { e.stopPropagation(); openDetail(f); }}>
                Ver detalles →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: Detalles de hallazgo */}
      {showDetailModal && selectedFinding && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-box modal-box-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedFinding.title}</h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {can('findings', 'edit') && (
                  <button
                    className="modal-btn-cancel"
                    style={{ fontSize: '13px', padding: '6px 14px' }}
                    onClick={() => openEdit(selectedFinding)}
                  >
                    Editar
                  </button>
                )}
                <button className="modal-close" onClick={() => setShowDetailModal(false)}>×</button>
              </div>
            </div>

            <div className="modal-body">
              {/* Severidad + Estado */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <span style={{ background: `${SEVERITY_COLORS[selectedFinding.severity]}15`, color: SEVERITY_COLORS[selectedFinding.severity], padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  {SEVERITY_LABELS[selectedFinding.severity]}
                </span>
                <span style={{ background: (selectedFinding.status === 'closed' || selectedFinding.status === 'resolved') ? 'rgba(5,150,105,0.1)' : 'rgba(100,116,139,0.1)', color: (selectedFinding.status === 'closed' || selectedFinding.status === 'resolved') ? '#059669' : '#64748b', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>
                  {STATUS_LABELS[selectedFinding.status]}
                </span>
              </div>
              <p style={{ margin: '0 0 20px', color: '#475569', lineHeight: '1.6', fontSize: '14px', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
                {selectedFinding.description}
              </p>

              {/* Cambiar estado */}
              {can('findings', 'edit') && (
                <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
                  <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cambiar Estado</p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {STATUS_ORDER.map((status) => (
                      <button
                        key={status}
                        onClick={() => handleChangeStatus(selectedFinding, status)}
                        style={{
                          padding: '6px 14px',
                          border: selectedFinding.status === status ? 'none' : '1px solid #e2e8f0',
                          borderRadius: '6px',
                          background: selectedFinding.status === status ? '#8B5CF6' : '#fff',
                          color: selectedFinding.status === status ? '#fff' : '#475569',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 600,
                          transition: 'all 0.15s',
                        }}
                      >
                        {STATUS_LABELS[status]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Riesgo + Vencimiento */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px' }}>
                  <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Riesgo</p>
                  <p style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: 800, color: selectedFinding.risk_score >= 70 ? '#dc2626' : selectedFinding.risk_score >= 40 ? '#d97706' : '#059669' }}>
                    {selectedFinding.risk_score}
                  </p>
                </div>
                {selectedFinding.due_date && (
                  <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px' }}>
                    <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Vencimiento</p>
                    <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                      {formatDate(selectedFinding.due_date)}
                    </p>
                  </div>
                )}
              </div>

              {/* Acciones correctivas */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                    Acciones Correctivas <span style={{ color: '#8B5CF6' }}>({findingActions.length})</span>
                  </p>
                  {can('findings', 'create') && (
                    <button
                      className="modal-btn-primary"
                      style={{ padding: '5px 12px', fontSize: '12px', boxShadow: 'none' }}
                      onClick={() => setShowActionModal(true)}
                    >
                      + Agregar
                    </button>
                  )}
                </div>
                {findingActions.length === 0 ? (
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>Sin acciones correctivas registradas</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {findingActions.map((action) => (
                      <div key={action.id} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', fontSize: '13px' }}>
                        <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#0f172a' }}>{action.title}</p>
                        <p style={{ margin: '0 0 4px', color: '#64748b' }}>{action.description}</p>
                        {action.due_date && (
                          <span style={{ color: '#94a3b8', fontSize: '12px' }}>Vence: {formatDate(action.due_date)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              {can('findings', 'delete') && (
                <button className="modal-btn-danger" style={{ marginRight: 'auto' }} onClick={() => handleDelete(selectedFinding)}>
                  Eliminar
                </button>
              )}
              <button className="modal-btn-cancel" onClick={() => setShowDetailModal(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Editar hallazgo */}
      {showEditModal && selectedFinding && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar Hallazgo</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)} disabled={isSubmitting}>×</button>
            </div>
            <div className="modal-body">
              <form id="edit-finding-form" onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }}>
                <div className="form-group">
                  <label>Título</label>
                  <input type="text" required value={editFormData.title} onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Descripción</label>
                  <textarea required value={editFormData.description} onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Severidad</label>
                  <select value={editFormData.severity} onChange={(e) => setEditFormData({ ...editFormData, severity: e.target.value as any })}>
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                    <option value="critical">Crítica</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <select value={editFormData.status} onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}>
                    <option value="open">Abierto</option>
                    <option value="in_progress">En Progreso</option>
                    <option value="resolved">Resuelto</option>
                    <option value="closed">Cerrado</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Fecha de Vencimiento</label>
                  <input type="date" value={editFormData.due_date} onChange={(e) => setEditFormData({ ...editFormData, due_date: e.target.value })} />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="modal-btn-cancel" onClick={() => setShowEditModal(false)} disabled={isSubmitting}>Cancelar</button>
              <button className="modal-btn-primary" form="edit-finding-form" type="submit" disabled={isSubmitting}>
                {isSubmitting ? <><span className="spinner-small" /> Guardando...</> : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Crear acción correctiva */}
      {showActionModal && selectedFinding && (
        <div className="modal-overlay" onClick={() => setShowActionModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nueva Acción Correctiva</h2>
              <button className="modal-close" onClick={() => setShowActionModal(false)} disabled={isSubmitting}>×</button>
            </div>
            <div className="modal-body">
              <form id="action-form" onSubmit={handleCreateAction}>
                <div className="form-group">
                  <label>Título</label>
                  <input type="text" required placeholder="Descripción breve de la acción" value={actionFormData.title} onChange={(e) => setActionFormData({ ...actionFormData, title: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Descripción</label>
                  <textarea required placeholder="Detalles de la acción correctiva" value={actionFormData.description} onChange={(e) => setActionFormData({ ...actionFormData, description: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Prioridad</label>
                  <select value={actionFormData.priority} onChange={(e) => setActionFormData({ ...actionFormData, priority: e.target.value })}>
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Fecha de Vencimiento</label>
                  <input type="date" value={actionFormData.due_date} onChange={(e) => setActionFormData({ ...actionFormData, due_date: e.target.value })} />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="modal-btn-cancel" onClick={() => setShowActionModal(false)} disabled={isSubmitting}>Cancelar</button>
              <button className="modal-btn-primary" form="action-form" type="submit" disabled={isSubmitting}>
                {isSubmitting ? <><span className="spinner-small" /> Creando...</> : 'Crear Acción'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Crear hallazgo */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nuevo Hallazgo</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)} disabled={isSubmitting}>×</button>
            </div>
            <div className="modal-body">
              {/* Prestador seleccionado */}
              <div style={{ marginBottom: '16px', padding: '10px 14px', background: 'rgba(98,85,160,0.06)', border: '1px solid rgba(98,85,160,0.2)', borderRadius: '8px', fontSize: '13px' }}>
                <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Para prestador</span>
                <p style={{ margin: '3px 0 0', fontWeight: 700, color: '#8B5CF6' }}>
                  {selectedProvider?.legalName || 'No seleccionado'}
                </p>
              </div>

              <form id="create-finding-form" onSubmit={handleCreateFinding}>
                {availableProviders.length > 1 && (
                  <div className="form-group">
                    <label>Cambiar prestador</label>
                    <select value={selectedProviderForCreation} onChange={(e) => setSelectedProviderForCreation(e.target.value)}>
                      {availableProviders.map((p) => (
                        <option key={p.id} value={p.id}>{p.legalName}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label>Título</label>
                  <input type="text" required placeholder="Descripción breve del hallazgo" value={createFormData.title} onChange={(e) => setCreateFormData({ ...createFormData, title: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Descripción</label>
                  <textarea required placeholder="Detalles del hallazgo" value={createFormData.description} onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Severidad</label>
                  <select value={createFormData.severity} onChange={(e) => setCreateFormData({ ...createFormData, severity: e.target.value as any })}>
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                    <option value="critical">Crítica</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Fecha de Vencimiento</label>
                  <input type="date" required value={createFormData.due_date} onChange={(e) => setCreateFormData({ ...createFormData, due_date: e.target.value })} />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="modal-btn-cancel" onClick={() => setShowCreateModal(false)} disabled={isSubmitting}>Cancelar</button>
              <button className="modal-btn-primary" form="create-finding-form" type="submit" disabled={isSubmitting}>
                {isSubmitting ? <><span className="spinner-small" /> Creando...</> : 'Crear Hallazgo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};