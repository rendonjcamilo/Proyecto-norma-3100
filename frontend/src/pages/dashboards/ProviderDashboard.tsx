import './ProviderDashboard.css';
import React, { useState, useEffect, useCallback } from 'react';
import { useProvider } from '@context/ProviderContext';
import { reportsApi } from '@services/api';

interface ComplianceMetrics {
  compliance_rate: number;
  open_findings: number;
  in_progress_findings: number;
  resolved_findings: number;
  pending_actions: number;
}

export function ProviderDashboard(): JSX.Element {
  const { selectedProvider } = useProvider();
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMetrics = useCallback(async () => {
    if (!selectedProvider) return;
    try {
      setLoading(true);
      const data = await reportsApi.getDashboardSummary(selectedProvider.id);
      setMetrics({
        compliance_rate: data.compliance_rate ?? 0,
        open_findings: data.open_findings ?? 0,
        in_progress_findings: data.in_progress_findings ?? 0,
        resolved_findings: data.resolved_findings ?? 0,
        pending_actions: data.pending_actions ?? 0,
      });
    } catch {
      setMetrics({ compliance_rate: 0, open_findings: 0, in_progress_findings: 0, resolved_findings: 0, pending_actions: 0 });
    } finally {
      setLoading(false);
    }
  }, [selectedProvider]);

  useEffect(() => {
    if (selectedProvider) loadMetrics();
  }, [selectedProvider, loadMetrics]);

  if (!selectedProvider) {
    return <div className="pdb-root"><div className="pdb-state">No hay prestador seleccionado</div></div>;
  }
  if (loading || !metrics) {
    return <div className="pdb-root"><div className="pdb-state">Cargando dashboard...</div></div>;
  }

  const rate = metrics.compliance_rate;
  const semaforo = rate >= 80 ? 'verde' : rate >= 50 ? 'naranja' : 'rojo';
  const semaforoLabel = semaforo === 'verde' ? '✓ Cumplimiento alto' : semaforo === 'naranja' ? '⚠ Cumplimiento parcial' : '✗ Cumplimiento bajo';

  return (
    <div className="pdb-root">

      {/* ── Hero Banner ────────────────────────────────────────── */}
      <div className="pdb-hero">
        <div className="pdb-hero-orb pdb-hero-orb-1" />
        <div className="pdb-hero-orb pdb-hero-orb-2" />

        <div className="pdb-hero-content">
          <span className="pdb-hero-badge">
            <svg width="6" height="6" viewBox="0 0 6 6" fill="none">
              <circle cx="3" cy="3" r="3" fill="#10b981" />
            </svg>
            Autoevaluación · Resolución 3100
          </span>
          <h1 className="pdb-hero-title">{selectedProvider.legalName}</h1>
          <p className="pdb-hero-subtitle">
            RUT: {selectedProvider.rut} · {selectedProvider.city}, {selectedProvider.department}
          </p>
        </div>

        <button className="pdb-refresh-btn" onClick={loadMetrics}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
          Actualizar
        </button>
      </div>

      {/* ── KPI Strip ──────────────────────────────────────────── */}
      <div className="pdb-kpi-strip">

        {/* Cumplimiento — color dinámico según semáforo */}
        <div className={`pdb-kpi-card pdb-kpi-${semaforo}`}>
          <div className="pdb-kpi-glow" />
          <div className="pdb-kpi-icon-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="pdb-kpi-body">
            <div className="pdb-kpi-value">{rate.toFixed(1)}%</div>
            <div className="pdb-kpi-label">Cumplimiento General</div>
            <div className="pdb-kpi-semaforo">{semaforoLabel}</div>
          </div>
        </div>

        {/* Hallazgos Abiertos */}
        <div className="pdb-kpi-card pdb-kpi-rose">
          <div className="pdb-kpi-glow" />
          <div className="pdb-kpi-icon-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
          <div className="pdb-kpi-body">
            <div className="pdb-kpi-value">{metrics.open_findings}</div>
            <div className="pdb-kpi-label">Hallazgos Abiertos</div>
          </div>
        </div>

        {/* En Progreso */}
        <div className="pdb-kpi-card pdb-kpi-amber">
          <div className="pdb-kpi-glow" />
          <div className="pdb-kpi-icon-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="pdb-kpi-body">
            <div className="pdb-kpi-value">{metrics.in_progress_findings}</div>
            <div className="pdb-kpi-label">En Progreso</div>
          </div>
        </div>

        {/* Acciones Pendientes */}
        <div className="pdb-kpi-card pdb-kpi-indigo">
          <div className="pdb-kpi-glow" />
          <div className="pdb-kpi-icon-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="pdb-kpi-body">
            <div className="pdb-kpi-value">{metrics.pending_actions}</div>
            <div className="pdb-kpi-label">Acciones Pendientes</div>
          </div>
        </div>
      </div>

      {/* ── Acciones Rápidas ───────────────────────────────────── */}
      <div className="pdb-section">
        <div className="pdb-section-header">
          <div className="pdb-section-dot" />
          <h2>Acciones Rápidas</h2>
        </div>

        <div className="pdb-nav-grid">
          <a href="/assessments" className="pdb-nav-card">
            <div className="pdb-nav-icon pdb-nav-icon-indigo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 11 12 14 22 4" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
            </div>
            <div className="pdb-nav-body">
              <div className="pdb-nav-title">Evaluaciones</div>
              <div className="pdb-nav-hint">Iniciar y completar autoevaluaciones</div>
            </div>
            <svg className="pdb-nav-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </a>

          <a href="/findings" className="pdb-nav-card">
            <div className="pdb-nav-icon pdb-nav-icon-rose">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <div className="pdb-nav-body">
              <div className="pdb-nav-title">Hallazgos</div>
              <div className="pdb-nav-hint">Revisar y gestionar inconformidades</div>
            </div>
            <svg className="pdb-nav-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </a>

          <a href="/reports" className="pdb-nav-card">
            <div className="pdb-nav-icon pdb-nav-icon-cyan">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div className="pdb-nav-body">
              <div className="pdb-nav-title">Reportes</div>
              <div className="pdb-nav-hint">Descargar reportes de cumplimiento</div>
            </div>
            <svg className="pdb-nav-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </a>

          <a href="/documents" className="pdb-nav-card">
            <div className="pdb-nav-icon pdb-nav-icon-emerald">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 22h14a2 2 0 002-2V7.5L14.5 2H6a2 2 0 00-2 2v4" />
                <polyline points="14 2 14 8 20 8" />
                <path d="M2 15h10M9 12l3 3-3 3" />
              </svg>
            </div>
            <div className="pdb-nav-body">
              <div className="pdb-nav-title">Documentos</div>
              <div className="pdb-nav-hint">Gestionar documentos requeridos</div>
            </div>
            <svg className="pdb-nav-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </a>
        </div>
      </div>

    </div>
  );
}

export default ProviderDashboard;
