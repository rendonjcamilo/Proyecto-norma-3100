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
          <button className="page-btn-primary">
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
    </div>
  );
};
