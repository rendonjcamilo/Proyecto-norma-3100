/**
 * Finding Detail Component
 * Shows full finding information with actions and event timeline
 */

import React, { useState, useEffect } from 'react';
import { formatDate, formatDateTime } from '@/utils/dateFormat';
import './FindingDetail.css';

interface Finding {
  id: string;
  finding_number: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  risk_score: number;
  assigned_to?: string;
  created_date: Date;
  closed_date?: Date;
}

interface Action {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  deadline: Date;
  completion_percentage: number;
}

interface Event {
  id: string;
  event_type: string;
  data: Record<string, any>;
  user_id?: string;
  created_at: Date;
}

interface FindingDetailProps {
  findingId: string;
  onClose: () => void;
  onCreateAction?: (finding: Finding) => void;
}

/**
 * Finding Detail Component
 */
export const FindingDetail: React.FC<FindingDetailProps> = ({
  findingId,
  onClose,
  onCreateAction,
}) => {
  const [finding, setFinding] = useState<Finding | null>(null);
  const [actions, setActions] = useState<Action[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'details' | 'actions' | 'timeline'>('details');

  useEffect(() => {
    loadFindingDetail();
  }, [findingId]);

  const loadFindingDetail = async () => {
    try {
      setLoading(true);

      const response = await fetch(`/api/findings/${findingId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (response.ok) {
        const data = await response.json();
        setFinding(data.finding);
        setActions(data.actions || []);
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('Error loading finding detail:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="finding-detail-container">
        <div className="loading">Cargando detalles...</div>
      </div>
    );
  }

  if (!finding) {
    return (
      <div className="finding-detail-container">
        <div className="error">Hallazgo no encontrado</div>
      </div>
    );
  }

  const getSeverityBadgeClass = (severity: string): string => {
    switch (severity) {
      case 'crítica':
        return 'severity-critical';
      case 'alta':
        return 'severity-high';
      case 'media':
        return 'severity-medium';
      case 'baja':
        return 'severity-low';
      default:
        return 'severity-pending';
    }
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      abierta: 'Abierta',
      asignada: 'Asignada',
      en_progreso: 'En Progreso',
      cerrada: 'Cerrada',
    };
    return labels[status] || status;
  };

  const getEventIcon = (eventType: string): string => {
    switch (eventType) {
      case 'finding.created':
        return '✓';
      case 'finding.assigned':
        return '👤';
      case 'finding.status_changed':
        return '↻';
      case 'action.created':
        return '✚';
      case 'followup.completed':
        return '✅';
      default:
        return '•';
    }
  };

  const getEventLabel = (eventType: string): string => {
    const labels: Record<string, string> = {
      'finding.created': 'Hallazgo creado',
      'finding.assigned': 'Asignado',
      'finding.status_changed': 'Estado modificado',
      'finding.severity_set': 'Severidad establecida',
      'action.created': 'Acción creada',
      'action.status_changed': 'Estado de acción modificado',
      'followup.completed': 'Seguimiento completado',
      'finding.closed': 'Hallazgo cerrado',
    };
    return labels[eventType] || eventType;
  };

  return (
    <div className="finding-detail-container">
      <div className="detail-header">
        <div className="header-content">
          <button className="btn-back" onClick={onClose}>
            ← Volver
          </button>
          <div className="header-title">
            <h2>{finding.title}</h2>
            <span className="finding-number">{finding.finding_number}</span>
          </div>
          <div className="header-badges">
            <span className={`badge severity-badge ${getSeverityBadgeClass(finding.severity)}`}>
              {finding.severity.charAt(0).toUpperCase() + finding.severity.slice(1)}
            </span>
            <span className="badge status-badge">{getStatusLabel(finding.status)}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="detail-tabs">
        <button
          className={`tab ${selectedTab === 'details' ? 'active' : ''}`}
          onClick={() => setSelectedTab('details')}
        >
          Detalles
        </button>
        <button
          className={`tab ${selectedTab === 'actions' ? 'active' : ''}`}
          onClick={() => setSelectedTab('actions')}
        >
          Acciones ({actions.length})
        </button>
        <button
          className={`tab ${selectedTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setSelectedTab('timeline')}
        >
          Historial
        </button>
      </div>

      {/* Tab Content */}
      <div className="detail-content">
        {selectedTab === 'details' && (
          <div className="details-tab">
            <div className="detail-section">
              <h3>Información del Hallazgo</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Número</label>
                  <p>{finding.finding_number}</p>
                </div>
                <div className="detail-item">
                  <label>Estado</label>
                  <p>{getStatusLabel(finding.status)}</p>
                </div>
                <div className="detail-item">
                  <label>Severidad</label>
                  <p>{finding.severity}</p>
                </div>
                <div className="detail-item">
                  <label>Puntuación de Riesgo</label>
                  <p>
                    <div className="risk-bar">
                      <div
                        className="risk-fill"
                        style={{
                          width: `${finding.risk_score}%`,
                          backgroundColor:
                            finding.risk_score >= 80 ? '#dc3545' :
                            finding.risk_score >= 60 ? '#ff9800' :
                            '#4caf50',
                        }}
                      />
                    </div>
                    {finding.risk_score}%
                  </p>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h3>Descripción</h3>
              <p className="description-text">{finding.description}</p>
            </div>

            <div className="detail-section">
              <h3>Cronología</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Fecha de Creación</label>
                  <p>{formatDate(finding.created_date)}</p>
                </div>
                {finding.closed_date && (
                  <div className="detail-item">
                    <label>Fecha de Cierre</label>
                    <p>{formatDate(finding.closed_date)}</p>
                  </div>
                )}
              </div>
            </div>

            {onCreateAction && finding.status === 'abierta' && (
              <div className="detail-actions">
                <button
                  className="btn-primary"
                  onClick={() => onCreateAction(finding)}
                >
                  Crear Acción Correctiva
                </button>
              </div>
            )}
          </div>
        )}

        {selectedTab === 'actions' && (
          <div className="actions-tab">
            {actions.length === 0 ? (
              <div className="empty-state">
                <p>No hay acciones correctivas asignadas a este hallazgo.</p>
              </div>
            ) : (
              <div className="actions-list">
                {actions.map((action) => (
                  <div key={action.id} className="action-card">
                    <div className="action-header">
                      <h4>{action.title}</h4>
                      <span className={`priority-badge priority-${action.priority}`}>
                        {action.priority}
                      </span>
                    </div>
                    <p className="action-description">{action.description}</p>
                    <div className="action-meta">
                      <div className="meta-item">
                        <label>Estado</label>
                        <span>{action.status}</span>
                      </div>
                      <div className="meta-item">
                        <label>Progreso</label>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${action.completion_percentage}%` }} />
                        </div>
                        <span>{action.completion_percentage}%</span>
                      </div>
                      <div className="meta-item">
                        <label>Plazo</label>
                        <span>{formatDate(action.deadline)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedTab === 'timeline' && (
          <div className="timeline-tab">
            {events.length === 0 ? (
              <div className="empty-state">
                <p>No hay eventos registrados.</p>
              </div>
            ) : (
              <div className="timeline">
                {events.map((event) => (
                  <div key={event.id} className="timeline-item">
                    <div className="timeline-icon">{getEventIcon(event.event_type)}</div>
                    <div className="timeline-content">
                      <h4>{getEventLabel(event.event_type)}</h4>
                      <p className="event-time">
                        {formatDateTime(event.created_at)}
                      </p>
                      {Object.keys(event.data).length > 0 && (
                        <pre className="event-data">{JSON.stringify(event.data, null, 2)}</pre>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
