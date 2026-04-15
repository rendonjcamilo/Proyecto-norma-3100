/**
 * Assessment Generator Page
 * Allows users to create evaluations using the Norma 3100 JSON model
 * No database required - works entirely with the JSON model
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '@services/api';
import { useAuth } from '@hooks/useAuth';
import styles from './AssessmentGeneratorPage.module.css';

interface Service {
  code: string;
  name: string;
  groupName: string;
  totalCriteria: number;
}

interface QuestionnaireQuestion {
  id: string;
  code: string;
  number: string;
  text: string;
  standardCode: string;
  standardName: string;
  isTransversal: boolean;
  complexity: string;
  isMandatory: boolean;
}

interface Questionnaire {
  id: string;
  name: string;
  serviceCode: string;
  serviceName: string;
  versionType: 'initial' | 'year4' | 'annual' | 'pre-novelty';
  status: 'draft' | 'published';
  totalCriteria: number;
  criteria: QuestionnaireQuestion[];
}

export function AssessmentGeneratorPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState<'service' | 'version' | 'assessment'>(
    'service'
  );
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [assessmentVersion, setAssessmentVersion] = useState<
    'initial' | 'year4' | 'annual' | 'pre-novelty'
  >('initial');
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [responses, setResponses] = useState<Record<string, 'C' | 'NC' | 'NA'>>({});
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load services on mount
  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/norma3100/services');
      const data = await response.json();
      setServices(data.services || []);
    } catch (err: any) {
      setError('Error cargando servicios: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    setStep('version');
  };

  const handleSelectVersion = async () => {
    if (!selectedService) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/norma3100/questionnaires/${selectedService.code}/${assessmentVersion}`
      );
      const data = await response.json();
      setQuestionnaire(data.questionnaire);

      // Initialize responses
      const initialResponses: Record<string, 'C' | 'NC' | 'NA'> = {};
      data.questionnaire.criteria.forEach((criterion: QuestionnaireQuestion) => {
        initialResponses[criterion.id] = 'NA';
      });
      setResponses(initialResponses);

      setStep('assessment');
    } catch (err: any) {
      setError('Error cargando cuestionario: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = (criterionId: string, value: 'C' | 'NC' | 'NA') => {
    setResponses({
      ...responses,
      [criterionId]: value,
    });
  };

  const handleCalculateMetrics = async () => {
    if (!questionnaire) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/norma3100/assessments/mock/responses`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceCode: selectedService?.code,
          responses,
          criteria: questionnaire.criteria,
        }),
      });

      if (!response.ok) {
        throw new Error('Error calculando métricas');
      }

      const data = await response.json();
      setMetrics(data.assessment.metrics);
    } catch (err: any) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!questionnaire || !metrics) return;

    try {
      setLoading(true);
      const assessment = {
        id: 'mock-' + Date.now(),
        serviceName: selectedService?.name,
        version: assessmentVersion,
        responses,
        metrics,
        submittedDate: new Date(),
      };

      // Save to localStorage for persistence
      localStorage.setItem(
        'lastAssessment',
        JSON.stringify(assessment)
      );

      navigate(`/assessments/result/${assessment.id}`, {
        state: { assessment },
      });
    } catch (err: any) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'assessment') {
      setStep('version');
      setQuestionnaire(null);
      setResponses({});
      setMetrics(null);
    } else if (step === 'version') {
      setStep('service');
      setSelectedService(null);
      setAssessmentVersion('initial');
    }
  };

  // ===== RENDER: Step 1 - Select Service =====
  if (step === 'service') {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Generar Nueva Evaluación</h1>
          <p>Selecciona el servicio de salud a evaluar</p>
        </div>

        {error && (
          <div className={styles.alert + ' ' + styles.alertError}>{error}</div>
        )}

        <div className={styles.servicesGrid}>
          {loading ? (
            <p>Cargando servicios...</p>
          ) : services.length === 0 ? (
            <p>No hay servicios disponibles</p>
          ) : (
            services.map((service) => (
              <div
                key={service.code}
                className={styles.serviceCard}
                onClick={() => handleSelectService(service)}
              >
                <h3>{service.name}</h3>
                <p className={styles.groupName}>{service.groupName}</p>
                <p className={styles.criteriaCount}>
                  {service.totalCriteria} criterios
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // ===== RENDER: Step 2 - Select Version =====
  if (step === 'version') {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Seleccionar Versión de Evaluación</h1>
          <p>
            Servicio: <strong>{selectedService?.name}</strong>
          </p>
        </div>

        <div className={styles.versionSelector}>
          <label>
            <input
              type="radio"
              name="version"
              value="initial"
              checked={assessmentVersion === 'initial'}
              onChange={(e) => setAssessmentVersion(e.target.value as any)}
            />
            <strong>Evaluación Inicial</strong>
            <span>Primera evaluación del servicio</span>
          </label>

          <label>
            <input
              type="radio"
              name="version"
              value="annual"
              checked={assessmentVersion === 'annual'}
              onChange={(e) => setAssessmentVersion(e.target.value as any)}
            />
            <strong>Evaluación Anual</strong>
            <span>Seguimiento anual del cumplimiento</span>
          </label>

          <label>
            <input
              type="radio"
              name="version"
              value="year4"
              checked={assessmentVersion === 'year4'}
              onChange={(e) => setAssessmentVersion(e.target.value as any)}
            />
            <strong>Evaluación Año 4</strong>
            <span>Evaluación especial del cuarto año</span>
          </label>

          <label>
            <input
              type="radio"
              name="version"
              value="pre-novelty"
              checked={assessmentVersion === 'pre-novelty'}
              onChange={(e) => setAssessmentVersion(e.target.value as any)}
            />
            <strong>Pre-Novedad</strong>
            <span>Antes de habilitar nuevos servicios</span>
          </label>
        </div>

        <div className={styles.actions}>
          <button className={styles.btnSecondary} onClick={handleBack}>
            Atrás
          </button>
          <button
            className={styles.btnPrimary}
            onClick={handleSelectVersion}
            disabled={loading}
          >
            {loading ? 'Cargando...' : 'Continuar'}
          </button>
        </div>
      </div>
    );
  }

  // ===== RENDER: Step 3 - Assessment Form =====
  if (step === 'assessment' && questionnaire) {
    // Group criteria by standard
    const groupedByCriteria = questionnaire.criteria.reduce(
      (acc, criterion) => {
        if (!acc[criterion.standardCode]) {
          acc[criterion.standardCode] = {
            standardName: criterion.standardName,
            isTransversal: criterion.isTransversal,
            criteria: [],
          };
        }
        acc[criterion.standardCode].criteria.push(criterion);
        return acc;
      },
      {} as Record<
        string,
        {
          standardName: string;
          isTransversal: boolean;
          criteria: QuestionnaireQuestion[];
        }
      >
    );

    const compliancePercent = metrics
      ? Math.round(metrics.compliancePercent * 100) / 100
      : 0;
    const semaforoColor =
      metrics?.semaforo || 'rojo';

    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>{questionnaire.name}</h1>
          <p>
            Total de criterios: <strong>{questionnaire.totalCriteria}</strong>
          </p>
        </div>

        {error && (
          <div className={styles.alert + ' ' + styles.alertError}>{error}</div>
        )}

        {/* Metrics Summary */}
        {metrics && (
          <div className={styles.metricsSummary}>
            <div className={styles.complianceGauge}>
              <div
                className={`${styles.semaforo} ${styles['semaforo-' + semaforoColor]}`}
              ></div>
              <p className={styles.compliancePercent}>{compliancePercent}%</p>
              <p className={styles.semaforoLabel}>
                {semaforoColor === 'verde'
                  ? 'Cumple'
                  : semaforoColor === 'naranja'
                    ? 'Parcial'
                    : 'No Cumple'}
              </p>
            </div>

            <div className={styles.metricsDetails}>
              <div className={styles.metricItem}>
                <span>Conforme:</span>
                <strong className={styles.conforme}>{metrics.cumple}</strong>
              </div>
              <div className={styles.metricItem}>
                <span>No Conforme:</span>
                <strong className={styles.noConforme}>{metrics.noCumple}</strong>
              </div>
              <div className={styles.metricItem}>
                <span>No Aplica:</span>
                <strong className={styles.noAplica}>{metrics.noAplica}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Questionnaire Form */}
        <form className={styles.questionnaire}>
          {Object.entries(groupedByCriteria).map(
            ([standardCode, { standardName, isTransversal, criteria }]) => (
              <fieldset key={standardCode} className={styles.standardSection}>
                <legend className={styles.standardLegend}>
                  <span className={styles.standardName}>{standardName}</span>
                  {isTransversal && (
                    <span className={styles.badge}>Transversal</span>
                  )}
                </legend>

                <div className={styles.criteriaList}>
                  {criteria.map((criterion) => (
                    <div key={criterion.id} className={styles.criterionItem}>
                      <div className={styles.criterionText}>
                        <p className={styles.criterionNumber}>
                          {criterion.code}
                        </p>
                        <p className={styles.criterionDescription}>
                          {criterion.text}
                        </p>
                      </div>

                      <div className={styles.responseOptions}>
                        <label className={styles.optionLabel}>
                          <input
                            type="radio"
                            name={`criterion-${criterion.id}`}
                            value="C"
                            checked={responses[criterion.id] === 'C'}
                            onChange={(e) =>
                              handleResponse(criterion.id, e.target.value as 'C')
                            }
                          />
                          <span className={styles.optionText}>Cumple</span>
                        </label>

                        <label className={styles.optionLabel}>
                          <input
                            type="radio"
                            name={`criterion-${criterion.id}`}
                            value="NC"
                            checked={responses[criterion.id] === 'NC'}
                            onChange={(e) =>
                              handleResponse(criterion.id, e.target.value as 'NC')
                            }
                          />
                          <span className={styles.optionText}>No Cumple</span>
                        </label>

                        <label className={styles.optionLabel}>
                          <input
                            type="radio"
                            name={`criterion-${criterion.id}`}
                            value="NA"
                            checked={responses[criterion.id] === 'NA'}
                            onChange={(e) =>
                              handleResponse(criterion.id, e.target.value as 'NA')
                            }
                          />
                          <span className={styles.optionText}>No Aplica</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </fieldset>
            )
          )}
        </form>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.btnSecondary} onClick={handleBack}>
            Atrás
          </button>
          <button
            className={styles.btnSecondary}
            onClick={handleCalculateMetrics}
            disabled={loading}
          >
            {loading ? 'Calculando...' : 'Calcular Métricas'}
          </button>
          {metrics && (
            <button
              className={styles.btnPrimary}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar Evaluación'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
