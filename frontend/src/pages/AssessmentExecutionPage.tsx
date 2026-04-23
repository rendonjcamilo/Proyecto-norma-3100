/**
 * AssessmentExecutionPage
 * Página de ejecución de autoevaluación Norma 3100.
 * Carga el assessment y su cuestionario desde el backend,
 * agrupa criterios por los 7 estándares transversales (+ específicos del servicio),
 * y presenta AssessmentForm conectado a la API real.
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import AssessmentForm from '../components/Assessment/AssessmentForm';
import {
  assessmentsApi,
  questionnairesApi,
  type Assessment,
  type AssessmentResponse,
  type QuestionnaireCriterion,
} from '../services/api';

// ─── Tipos internos del formulario ───────────────────────────────────────────

interface Criterion {
  id: string;
  code: string;
  name: string;
  description: string;
  evidenceRequirement: string;
  complexity: 'simple' | 'medium' | 'complex';
}

interface Standard {
  id: string;
  code: string;
  name: string;
  isTransversal: boolean;
  criteria: Criterion[];
}

interface FormResponse {
  criterionId: string;
  status: 'C' | 'NC' | 'NA';
  description?: string;
  comments?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extrae el código de estándar desde el código del criterio (ej: "TSTH-001" → "TSTH") */
function extractStandardCode(criterionCode: string): string {
  const match = criterionCode.match(/^([A-Z]+)-/);
  return match ? match[1] : criterionCode.split('-')[0];
}

/** Transforma la lista plana de criterios en estándares agrupados */
function groupCriteriaByStandard(criteria: QuestionnaireCriterion[]): Standard[] {
  console.log(`[groupCriteriaByStandard] Recibiendo ${criteria.length} criterios`);
  const criteriaIds = criteria.map(c => c.id);
  const duplicates = criteriaIds.filter((id, idx) => criteriaIds.indexOf(id) !== idx);
  if (duplicates.length > 0) {
    console.warn(`[groupCriteriaByStandard] Criterios duplicados encontrados:`, duplicates);
  }

  const standardIds = criteria.map(c => c.standard_id);
  const uniqueStandardIds = new Set(standardIds);
  console.log(`[groupCriteriaByStandard] Standards únicos: ${uniqueStandardIds.size}, Criterios por standard:`,
    Array.from(uniqueStandardIds).map(sid => ({
      standard_id: sid,
      count: standardIds.filter(id => id === sid).length
    }))
  );

  const standardMap = new Map<string, Standard>();

  for (const c of criteria) {
    if (!standardMap.has(c.standard_id)) {
      standardMap.set(c.standard_id, {
        id: c.standard_id,
        code: extractStandardCode(c.code),
        name: c.standard_name,
        isTransversal: c.is_transversal,
        criteria: [],
      });
    }
    // Usar 'name' y 'description' del backend; si no existen (flujo mock), usar 'text' como fallback
    const name = (c as any).name || (c as any).text || 'Sin nombre';
    const description = (c as any).description || (c as any).text || '';

    standardMap.get(c.standard_id)!.criteria.push({
      id: c.id,
      code: c.code,
      name,
      description,
      evidenceRequirement: c.evidence_requirement || '',
      complexity: c.complexity,
    });
  }

  // Transversales primero, luego específicos; dentro de cada grupo ordenar por código
  return Array.from(standardMap.values()).sort((a, b) => {
    if (a.isTransversal !== b.isTransversal) return a.isTransversal ? -1 : 1;
    return a.code.localeCompare(b.code);
  });
}

/** Mapea respuestas del backend al formato del formulario */
function mapBackendResponses(
  backendResponses: AssessmentResponse[] | Record<string, any> | undefined
): FormResponse[] {
  if (!backendResponses) return [];

  // Si es un array, convertir directamente
  if (Array.isArray(backendResponses)) {
    return backendResponses.map((r) => ({
      criterionId: r.criterionId,
      status: r.status,
      description: r.description,
      comments: r.comments,
    }));
  }

  // Si es un Record (objeto), está vacío
  return [];
}

// ─── Componente ──────────────────────────────────────────────────────────────

const VERSION_LABELS: Record<string, string> = {
  initial: 'Autoevaluación Inicial',
  year4: 'Evaluación a los 4 Años',
  annual: 'Evaluación Anual',
  'pre-novelty': 'Pre-Novedad',
};

export const AssessmentExecutionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [standards, setStandards] = useState<Standard[]>([]);
  const [initialResponses, setInitialResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Intentar cargar desde route state primero (datos pasados en navigate)
        let assessmentData: any = (location.state as any)?.assessment;

        // 2. Si no está en route state, intentar desde localStorage
        if (!assessmentData) {
          const storedAssessment = localStorage.getItem('lastAssessment');
          if (storedAssessment) {
            try {
              const parsed = JSON.parse(storedAssessment);
              if (parsed.id === id) {
                assessmentData = parsed;
              }
            } catch (parseErr) {
              // Si no se puede parsear, intenta desde backend
            }
          }
        }

        // Si no está en localStorage, intenta desde backend
        if (!assessmentData) {
          try {
            const assessmentRes = await assessmentsApi.getById(id);
            assessmentData = assessmentRes.data;
          } catch (backendErr) {
            // Si tampoco en backend, mostrar error
            throw new Error('No se encontró la evaluación');
          }
        }

        setAssessment(assessmentData);
        setInitialResponses(mapBackendResponses(assessment.responses));

        // 2. Si viene del JSON model, construir standards desde criterios del questionnaire
        if (assessment.questionnaire && assessment.questionnaire.criteria) {
          const grouped = groupCriteriaByStandard(assessment.questionnaire.criteria);
          setStandards(grouped);
        } else if (assessment.questionnaireId) {
          // Si tiene questionnaireId pero no los criterios, cargar desde backend
          const questionnaireRes = await questionnairesApi.getById(assessment.questionnaireId);
          const grouped = groupCriteriaByStandard(questionnaireRes.data.criteria);
          setStandards(grouped);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al cargar la evaluación';
        console.error('[AssessmentExecutionPage] Error loading:', err);
        console.error('[AssessmentExecutionPage] assessmentData:', assessmentData);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, location.state]);

  const handleSave = async (responses: FormResponse[]) => {
    if (!id || !assessment) return;

    try {
      // Guardar en backend via API
      const apiResponses = responses.map((r) => ({
        criterionId: r.criterionId,
        status: r.status,
        description: r.description,
        comments: r.comments,
      }));

      const result = await assessmentsApi.saveResponses(id, apiResponses);

      // Actualizar estado local con la respuesta del backend
      setAssessment({
        ...assessment,
        compliance_percent: result.data.compliance_percent,
        semaforo: result.data.semaforo,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar';
      setError(msg);
    }
  };

  const handleSubmit = async () => {
    if (!id || !assessment) return;

    try {
      setError(null);

      // Enviar al backend via API
      await assessmentsApi.submit(id);

      // Actualizar estado local con la respuesta del backend
      setAssessment({
        ...assessment,
        status: 'submitted',
        submitted_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      setSubmitSuccess(true);
      setTimeout(() => navigate('/assessments'), 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al enviar evaluación';
      setError(msg);
    }
  };

  // ── Estados de carga / error ──────────────────────────────────────────────

  if (loading) {
    return (
      <div style={styles.centered}>
        <div style={styles.spinner} />
        <p style={{ color: '#6b778c', marginTop: 12 }}>Cargando evaluación…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.errorContainer}>
          <div style={styles.errorIcon}>⚠️</div>
          <h2 style={styles.errorTitle}>Error al cargar</h2>
          <p style={styles.errorMessage}>{error}</p>
          <button style={styles.btnError} onClick={() => navigate('/assessments')}>
            ← Volver a Evaluaciones
          </button>
        </div>
      </div>
    );
  }

  if (!assessment) return null;

  const isReadOnly = assessment.status === 'submitted' || assessment.status === 'locked';

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={styles.page}>
      {/* Barra de navegación superior */}
      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={() => navigate('/assessments')}>
          ← Volver
        </button>
        <div style={styles.topBarInfo}>
          <span style={styles.versionBadge}>
            {VERSION_LABELS[assessment.assessment_version] ?? assessment.assessment_version}
          </span>
          {isReadOnly && (
            <span style={styles.lockedBadge}>Evaluación enviada — solo lectura</span>
          )}
        </div>
      </div>

      {/* Mensaje de éxito al enviar */}
      {submitSuccess && (
        <div style={styles.successBanner}>
          ✅ Evaluación enviada correctamente. Redirigiendo…
        </div>
      )}

      {/* Formulario principal */}
      <AssessmentForm
        assessment={{
          id: assessment.id,
          providerId: assessment.provider_id,
          serviceId: assessment.service_id,
          questionnaireId: assessment.questionnaire_id,
          assessmentVersion: assessment.assessment_version,
          status: (assessment.status as 'in_progress' | 'submitted' | 'locked') ?? 'in_progress',
          startedDate: assessment.started_date ?? assessment.created_at,
          compliancePercent: assessment.compliance_percent ?? 0,
          semaforo: assessment.semaforo ?? 'rojo',
        }}
        questionnaiireData={{ standards }}
        initialResponses={initialResponses}
        onSave={isReadOnly ? undefined : handleSave}
        onSubmit={isReadOnly ? undefined : handleSubmit}
        readOnly={isReadOnly}
      />
    </div>
  );
};

// ─── Estilos inline mínimos ───────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 900,
    margin: '0 auto',
    padding: '24px 16px',
  },
  centered: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    padding: '40px 24px',
    background: '#fef2f2',
    borderRadius: '8px',
    border: '1px solid #fecaca',
    marginTop: '24px',
  },
  errorIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  errorTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#991b1b',
    marginBottom: '8px',
    textAlign: 'center' as const,
  },
  errorMessage: {
    color: '#7f1d1d',
    textAlign: 'center' as const,
    marginBottom: '24px',
    maxWidth: '500px',
    lineHeight: '1.5',
  },
  btnError: {
    padding: '8px 16px',
    background: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background 0.2s ease',
  },
  spinner: {
    width: 36,
    height: 36,
    border: '3px solid #e0e0e0',
    borderTopColor: '#0052cc',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  topBarInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginLeft: 'auto',
  },
  backBtn: {
    padding: '6px 14px',
    border: '1px solid #dfe1e6',
    borderRadius: 4,
    background: 'white',
    cursor: 'pointer',
    fontSize: 14,
    color: '#42526e',
  },
  versionBadge: {
    padding: '4px 10px',
    background: '#e3f2fd',
    color: '#0052cc',
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 600,
  },
  lockedBadge: {
    padding: '4px 10px',
    background: '#fff3e0',
    color: '#974f0c',
    borderRadius: 12,
    fontSize: 13,
  },
  successBanner: {
    padding: '12px 16px',
    background: '#e3fcef',
    color: '#006644',
    borderRadius: 6,
    marginBottom: 20,
    fontWeight: 500,
  },
};
