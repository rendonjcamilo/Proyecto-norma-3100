/**
 * Findings List Component
 * Displays findings in a filterable table with status and severity color coding
 */

import React, { useState, useEffect } from 'react';
import { formatDate } from '@/utils/dateFormat';
import './FindingsList.css';

interface Finding {
  id: string;
  finding_number: string;
  title: string;
  description: string;
  service_id?: string;
  standard_id?: string;
  status: 'abierta' | 'en_revision' | 'asignada' | 'en_progreso' | 'cerrada';
  severity: 'crítica' | 'alta' | 'media' | 'baja' | 'pendiente';
  risk_score: number;
  assigned_to?: string;
  created_date: Date;
  closed_date?: Date;
}

interface FindingsListProps {
  providerId?: string;
  onSelectFinding: (finding: Finding) => void;
  onCreateAction?: (finding: Finding) => void;
}

/**
 * Findings List Component
 */
export const FindingsList: React.FC<FindingsListProps> = ({
  providerId,
  onSelectFinding,
  onCreateAction,
}) => {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '' as string,
    severity: '' as string,
    service_id: '' as string,
    standard_id: '' as string,
  });
  const [total, setTotal] = useState(0);
  const [limit] = useState(25);
  const [offset, setOffset] = useState(0);

  // Load findings
  useEffect(() => {
    loadFindings();
  }, [filters, limit, offset, providerId]);

  const loadFindings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.status) params.append('status', filters.status);
      if (filters.severity) params.append('severity', filters.severity);
      if (filters.service_id) params.append('service_id', filters.service_id);
      if (filters.standard_id) params.append('standard_id', filters.standard_id);
      if (providerId) params.append('provider_id', providerId);

      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      const response = await fetch(`/api/findings?${params.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (response.ok) {
        const data = await response.json();
        setFindings(data.findings || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Error loading findings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters({ ...filters, [field]: value });
    setOffset(0); // Reset pagination
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'abierta':
        return 'status-open';
      case 'asignada':
        return 'status-assigned';
      case 'en_progreso':
        return 'status-in-progress';
      case 'cerrada':
        return 'status-closed';
      default:
        return 'status-default';
    }
  };

  const getSeverityColor = (severity: string): string => {
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
      en_revision: 'En Revisión',
      asignada: 'Asignada',
      en_progreso: 'En Progreso',
      cerrada: 'Cerrada',
    };
    return labels[status] || status;
  };

  const getSeverityLabel = (severity: string): string => {
    const labels: Record<string, string> = {
      crítica: 'Crítica',
      alta: 'Alta',
      media: 'Media',
      baja: 'Baja',
      pendiente: 'Pendiente',
    };
    return labels[severity] || severity;
  };

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="findings-list-container">
      <div className="findings-header">
        <h2>Hallazgos</h2>
        <p className="subtitle">Gestión de hallazgos y acciones correctivas</p>
      </div>

      {/* Filters */}
      <div className="findings-filters">
        <div className="filter-group">
          <label htmlFor="status-filter">Estado</label>
          <select
            id="status-filter"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="filter-select"
          >
            <option value="">Todos los estados</option>
            <option value="abierta">Abierta</option>
            <option value="en_revision">En Revisión</option>
            <option value="asignada">Asignada</option>
            <option value="en_progreso">En Progreso</option>
            <option value="cerrada">Cerrada</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="severity-filter">Severidad</label>
          <select
            id="severity-filter"
            value={filters.severity}
            onChange={(e) => handleFilterChange('severity', e.target.value)}
            className="filter-select"
          >
            <option value="">Todas las severidades</option>
            <option value="crítica">Crítica</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
            <option value="pendiente">Pendiente</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="service-filter">Servicio</label>
          <select
            id="service-filter"
            value={filters.service_id}
            onChange={(e) => handleFilterChange('service_id', e.target.value)}
            className="filter-select"
          >
            <option value="">Todos los servicios</option>
            <option value="service-1">Servicios Ambulatorios</option>
            <option value="service-2">Servicios de Hospitalización</option>
            <option value="service-3">Unidad de Cuidados Intensivos</option>
          </select>
        </div>
      </div>

      {/* Findings Table */}
      {loading ? (
        <div className="loading">Cargando hallazgos...</div>
      ) : findings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h3 className="empty-state-title">Sin hallazgos</h3>
          <p className="empty-state-desc">No se encontraron hallazgos con los criterios seleccionados.</p>
        </div>
      ) : (
        <>
          <div className="findings-table-wrapper">
            <table className="findings-table">
              <thead>
                <tr>
                  <th className="col-number">No.</th>
                  <th className="col-title">Hallazgo</th>
                  <th className="col-service">Servicio</th>
                  <th className="col-status">Estado</th>
                  <th className="col-severity">Severidad</th>
                  <th className="col-risk">Riesgo</th>
                  <th className="col-assigned">Asignado a</th>
                  <th className="col-date">Fecha Creación</th>
                  <th className="col-actions">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {findings.map((finding) => (
                  <tr key={finding.id} className="finding-row">
                    <td className="col-number">{finding.finding_number}</td>
                    <td className="col-title">
                      <div className="finding-title-cell">
                        <strong>{finding.title}</strong>
                        <p className="finding-description">{finding.description.substring(0, 50)}...</p>
                      </div>
                    </td>
                    <td className="col-service">{finding.service_id || '—'}</td>
                    <td className="col-status">
                      <span className={`status-badge ${getStatusColor(finding.status)}`}>
                        {getStatusLabel(finding.status)}
                      </span>
                    </td>
                    <td className="col-severity">
                      <span className={`severity-badge ${getSeverityColor(finding.severity)}`}>
                        {getSeverityLabel(finding.severity)}
                      </span>
                    </td>
                    <td className="col-risk">
                      <div className="risk-score">
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
                        <span className="risk-text">{finding.risk_score}</span>
                      </div>
                    </td>
                    <td className="col-assigned">{finding.assigned_to || '—'}</td>
                    <td className="col-date">
                      {formatDate(finding.created_date)}
                    </td>
                    <td className="col-actions">
                      <div className="action-buttons">
                        <button
                          className="btn-icon btn-view"
                          onClick={() => onSelectFinding(finding)}
                          title="Ver detalles"
                        >
                          👁
                        </button>
                        {onCreateAction && finding.status === 'abierta' && (
                          <button
                            className="btn-icon btn-action"
                            onClick={() => onCreateAction(finding)}
                            title="Crear acción correctiva"
                          >
                            ➕
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <button
              className="btn-pagination"
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
            >
              ← Anterior
            </button>
            <span className="pagination-info">
              Página {currentPage} de {totalPages} ({total} total)
            </span>
            <button
              className="btn-pagination"
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total}
            >
              Siguiente →
            </button>
          </div>
        </>
      )}
    </div>
  );
};
