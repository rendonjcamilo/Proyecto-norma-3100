/**
 * Assessment Result Page
 * Displays the results of an assessment including:
 * - Compliance metrics
 * - Semáforo color
 * - Findings (hallazgos)
 * - Breakdown by standard
 */

import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import styles from './AssessmentResultPage.module.css';

interface AssessmentResult {
  id: string;
  serviceName: string;
  version: string;
  metrics: {
    compliancePercent: number;
    semaforo: 'verde' | 'naranja' | 'rojo';
    cumple: number;
    noCumple: number;
    noAplica: number;
    complianceByStandard: Array<{
      code: string;
      name: string;
      compliancePercent: number;
      cumple: number;
      noCumple: number;
      noAplica: number;
      totalCriteria: number;
    }>;
  };
  hallazgos: Array<{
    id: string;
    criterionCode: string;
    criterionText: string;
    standardCode: string;
    severity: 'baja' | 'media' | 'alta' | 'crítica';
    findingDescription: string;
  }>;
  submittedDate: Date;
}

export function AssessmentResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: _id } = useParams();
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to get assessment from location state first
    if (location.state?.assessment) {
      setAssessment(location.state.assessment);
      setLoading(false);
    } else {
      // Try to load from localStorage
      const saved = localStorage.getItem('lastAssessment');
      if (saved) {
        setAssessment(JSON.parse(saved));
        setLoading(false);
      } else {
        setLoading(false);
      }
    }
  }, [location.state]);

  if (loading) {
    return <div className={styles.container}>Cargando...</div>;
  }

  if (!assessment) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Evaluación no encontrada</h2>
          <button
            className={styles.btnPrimary}
            onClick={() => navigate('/assessments/new')}
          >
            Crear Nueva Evaluación
          </button>
        </div>
      </div>
    );
  }

  const { metrics, hallazgos } = assessment;
  const getSemaforoLabel = (color: string) => {
    const labels: Record<string, string> = {
      verde: 'Cumple ✓',
      naranja: 'Cumplimiento Parcial',
      rojo: 'No Cumple',
    };
    return labels[color] || color;
  };

  const getSeverityLabel = (severity: string) => {
    const labels: Record<string, string> = {
      baja: 'Baja',
      media: 'Media',
      alta: 'Alta',
      crítica: 'Crítica',
    };
    return labels[severity] || severity;
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1>Resultado de la Evaluación</h1>
        <p>Servicio: {assessment.serviceName}</p>
        <p>Versión: {assessment.version}</p>
      </div>

      {/* Semáforo & Compliance */}
      <div className={styles.summaryCard}>
        <div className={styles.semaforoSection}>
          <div className={styles.semaforoContainer}>
            <div
              className={`${styles.semaforo} ${styles['semaforo-' + metrics.semaforo]}`}
            ></div>
            <p className={styles.semaforoLabel}>
              {getSemaforoLabel(metrics.semaforo)}
            </p>
          </div>
          <p className={styles.compliancePercent}>
            {Math.round(metrics.compliancePercent * 100) / 100}%
          </p>
        </div>

        <div className={styles.metricsGrid}>
          <div className={styles.metricBox}>
            <span className={styles.metricLabel}>Conforme</span>
            <span className={`${styles.metricValue} ${styles.conforme}`}>
              {metrics.cumple}
            </span>
          </div>
          <div className={styles.metricBox}>
            <span className={styles.metricLabel}>No Conforme</span>
            <span className={`${styles.metricValue} ${styles.noConforme}`}>
              {metrics.noCumple}
            </span>
          </div>
          <div className={styles.metricBox}>
            <span className={styles.metricLabel}>No Aplica</span>
            <span className={`${styles.metricValue} ${styles.noAplica}`}>
              {metrics.noAplica}
            </span>
          </div>
        </div>
      </div>

      {/* Compliance by Standard */}
      <div className={styles.section}>
        <h2>Cumplimiento por Estándar</h2>
        <div className={styles.standardsList}>
          {metrics.complianceByStandard.map((standard) => {
            // -1 = sin criterios aplicables (todo NA) — no se evalúa
            const isNA = standard.compliancePercent === -1;
            const color = isNA
              ? 'na'
              : standard.compliancePercent >= 80
                ? 'verde'
                : standard.compliancePercent >= 50
                  ? 'naranja'
                  : 'rojo';

            return (
              <div key={standard.code} className={styles.standardItem}>
                <div className={styles.standardHeader}>
                  <h3>{standard.name}</h3>
                  <span className={`${styles.badge} ${styles['badge-' + color]}`}>
                    {isNA ? 'N/A' : `${Math.round(standard.compliancePercent * 100) / 100}%`}
                  </span>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={`${styles.progress} ${styles['progress-' + color]}`}
                    style={{
                      width: isNA ? '0%' : `${Math.min(standard.compliancePercent, 100)}%`,
                    }}
                  ></div>
                </div>
                <div className={styles.standardStats}>
                  <span>✓ {standard.cumple}</span>
                  <span>✗ {standard.noCumple}</span>
                  <span>— {standard.noAplica} {isNA && <em style={{ fontSize: '0.75em', color: '#94a3b8' }}>(no aplica)</em>}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Findings */}
      {hallazgos && hallazgos.length > 0 && (
        <div className={styles.section}>
          <h2>Hallazgos Identificados</h2>
          <p className={styles.hallazgosCount}>
            Total: {hallazgos.length} inconformidades
          </p>

          <div className={styles.hallazgosList}>
            {hallazgos.map((hallazgo) => (
              <div
                key={hallazgo.id}
                className={`${styles.hallazgoItem} ${styles['severity-' + hallazgo.severity]}`}
              >
                <div className={styles.hallazgoHeader}>
                  <span className={styles.severityBadge}>
                    {getSeverityLabel(hallazgo.severity)}
                  </span>
                  <span className={styles.criterionCode}>
                    {hallazgo.criterionCode}
                  </span>
                </div>
                <p className={styles.hallazgoDescription}>
                  {hallazgo.findingDescription}
                </p>
                <p className={styles.hallazgoText}>{hallazgo.criterionText}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Findings */}
      {(!hallazgos || hallazgos.length === 0) && metrics.noCumple === 0 && (
        <div className={styles.successMessage}>
          <p>✓ Congratulations! No inconsistencies found.</p>
        </div>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        <button
          className={styles.btnSecondary}
          onClick={() => navigate('/assessments/new')}
        >
          Nueva Evaluación
        </button>
        <button
          className={styles.btnPrimary}
          onClick={() => window.print()}
        >
          Descargar Reporte
        </button>
      </div>
    </div>
  );
}
