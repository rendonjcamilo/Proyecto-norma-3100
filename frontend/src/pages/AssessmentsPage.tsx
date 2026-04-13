/**
 * Assessments Page — Evaluaciones de cumplimiento
 */

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRolePermission } from '../hooks/useRolePermission';
import './Pages.css';

interface Assessment {
  id: string;
  title: string;
  type: string;
  status: 'draft' | 'in_progress' | 'completed' | 'archived';
  compliance_percentage: number;
  created_at: string;
  updated_at: string;
}

interface AssessmentsPageProps {
  providerId: string;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  in_progress: 'En Progreso',
  completed: 'Completada',
  archived: 'Archivada',
};

const STATUS_COLORS: Record<string, string> = {
  draft: '#6b778c',
  in_progress: '#0052cc',
  completed: '#00875a',
  archived: '#42526e',
};

export const AssessmentsPage: React.FC<AssessmentsPageProps> = ({ providerId }) => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'Auditoría Interna',
  });
  const { can } = useRolePermission();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/assessments`, {
          params: { provider_id: providerId },
        });
        setAssessments(res.data.data || res.data || []);
      } catch {
        console.error('Failed to load assessments');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [providerId]);

  if (loading) {
    return (
      <div className="page-container page-loading">
        <div className="page-spinner" />
        <p>Cargando evaluaciones...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Evaluaciones</h1>
          <p className="page-subtitle">
            Autoevaluaciones de cumplimiento según Norma 3100 de 2019
          </p>
        </div>
        {can('assessments', 'create') && (
          <button className="page-btn-primary" onClick={() => setShowCreateModal(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nueva Evaluación
          </button>
        )}
      </header>

      {assessments.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="empty-icon">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3>Sin evaluaciones</h3>
          <p>Crea tu primera autoevaluación para comenzar el seguimiento de cumplimiento</p>
        </div>
      ) : (
        <div className="card-grid">
          {assessments.map((a) => (
            <div key={a.id} className="assessment-card">
              <div className="assessment-card-header">
                <span
                  className="status-badge"
                  style={{
                    background: `${STATUS_COLORS[a.status]}15`,
                    color: STATUS_COLORS[a.status],
                  }}
                >
                  {STATUS_LABELS[a.status]}
                </span>
                <span className="card-type">{a.type}</span>
              </div>
              <h3 className="card-title">{a.title}</h3>
              <div className="compliance-bar-container">
                <div className="compliance-bar-label">
                  <span>Cumplimiento</span>
                  <span style={{
                    fontWeight: 700,
                    color: a.compliance_percentage >= 80 ? '#00875a' : a.compliance_percentage >= 50 ? '#ff8b00' : '#de350b',
                  }}>
                    {Math.round(a.compliance_percentage)}%
                  </span>
                </div>
                <div className="compliance-bar">
                  <div
                    className="compliance-bar-fill"
                    style={{
                      width: `${a.compliance_percentage}%`,
                      background: a.compliance_percentage >= 80 ? '#00875a' : a.compliance_percentage >= 50 ? '#ff8b00' : '#de350b',
                    }}
                  />
                </div>
              </div>
              <div className="card-date">
                Actualizado: {new Date(a.updated_at).toLocaleDateString('es-CO')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Assessment Modal */}
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
            <h2 style={{ marginTop: 0, marginBottom: '16px', fontSize: '20px' }}>Nueva Evaluación</h2>

            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                setIsSubmitting(true);
                await axios.post(`/api/assessments`, {
                  ...formData,
                  provider_id: providerId,
                  status: 'draft',
                  compliance_percentage: 0,
                });
                setShowCreateModal(false);
                setFormData({ title: '', type: 'Auditoría Interna' });
                const res = await axios.get(`/api/assessments`, { params: { provider_id: providerId } });
                setAssessments(res.data.data || []);
              } catch (error) {
                console.error('Error creating assessment:', error);
                alert('Error al crear la evaluación');
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
                  placeholder="Ej: Evaluación Norma 3100 2026"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Tipo de Evaluación</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="Auditoría Interna">Auditoría Interna</option>
                  <option value="Auditoría Externa">Auditoría Externa</option>
                  <option value="Autoevaluación">Autoevaluación</option>
                  <option value="Evaluación de Seguimiento">Evaluación de Seguimiento</option>
                </select>
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
                  {isSubmitting ? 'Creando...' : 'Crear Evaluación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
