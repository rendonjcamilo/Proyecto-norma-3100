/**
 * Findings Page — Hallazgos y acciones correctivas
 * Integrates existing Findings components with API data
 */

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRolePermission } from '../hooks/useRolePermission';
import './Pages.css';

interface Finding {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  risk_score: number;
  due_date: string;
  created_at: string;
}

interface FindingsPageProps {
  providerId: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#de350b',
  high: '#ff8b00',
  medium: '#ffab00',
  low: '#36b37e',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Abierto',
  in_progress: 'En Progreso',
  resolved: 'Resuelto',
  closed: 'Cerrado',
};

export const FindingsPage: React.FC<FindingsPageProps> = ({ providerId }) => {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'high' as const,
    due_date: '',
  });
  const { can } = useRolePermission();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/findings`, {
          params: { provider_id: providerId },
        });
        setFindings(res.data.data || res.data || []);
      } catch {
        console.error('Failed to load findings');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [providerId]);

  const filtered = findings.filter(
    (f) => filter === 'all' || f.status === filter
  );

  const counts = {
    all: findings.length,
    open: findings.filter((f) => f.status === 'open').length,
    in_progress: findings.filter((f) => f.status === 'in_progress').length,
    resolved: findings.filter((f) => f.status === 'resolved').length,
    closed: findings.filter((f) => f.status === 'closed').length,
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
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Hallazgos</h1>
          <p className="page-subtitle">
            Seguimiento y gestión de hallazgos de cumplimiento Norma 3100
          </p>
        </div>
        {can('findings', 'create') && (
          <button className="page-btn-primary" onClick={() => setShowCreateModal(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nuevo Hallazgo
          </button>
        )}
      </header>

      {/* Status filter tabs */}
      <div className="page-tabs">
        {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map((s) => (
          <button
            key={s}
            className={`page-tab ${filter === s ? 'page-tab-active' : ''}`}
            onClick={() => setFilter(s)}
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
          <div key={f.id} className="finding-card">
            <div className="finding-card-header">
              <span
                className="severity-badge"
                style={{
                  background: `${SEVERITY_COLORS[f.severity]}15`,
                  color: SEVERITY_COLORS[f.severity],
                }}
              >
                {f.severity.toUpperCase()}
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

      {/* Create Finding Modal */}
      {showCreateModal && (
        <div style={{
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
        }} onClick={() => setShowCreateModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0, marginBottom: '16px', fontSize: '20px' }}>Nuevo Hallazgo</h2>

            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                setIsSubmitting(true);
                await axios.post(`/api/findings`, {
                  ...formData,
                  provider_id: providerId,
                });
                setShowCreateModal(false);
                setFormData({ title: '', description: '', severity: 'high', due_date: '' });
                const res = await axios.get(`/api/findings`, { params: { provider_id: providerId } });
                setFindings(res.data.data || []);
              } catch (error) {
                console.error('Error creating finding:', error);
                alert('Error al crear el hallazgo');
              } finally {
                setIsSubmitting(false);
              }
            }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Título</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    minHeight: '80px',
                  }}
                  placeholder="Detalles del hallazgo"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Severidad</label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
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
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
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
