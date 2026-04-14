/**
 * AssessmentExecutionPage
 * Página de ejecución de autoevaluación Norma 3100.
 * Carga el assessment y su cuestionario desde el backend,
 * agrupa criterios por los 7 estándares transversales (+ específicos del servicio),
 * y presenta AssessmentForm conectado a la API real.
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    standardMap.get(c.standard_id)!.criteria.push({
      id: c.id,
      code: c.code,
      name: c.name,
      description: c.description,
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
  backendResponses: AssessmentResponse[] | undefined
): FormResponse[] {
  if (!backendResponses) return [];
  return backendResponses.map((r) => ({
    criterionId: r.criterionId,
    status: r.status,
    description: r.description,
    comments: r.comments,
  }));
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

        // 1. Cargar assessment con respuestas existentes
        const assessmentRes = await assessmentsApi.getById(id);
        const assessmentData = assessmentRes.data;
        setAssessment(assessmentData);
        setInitialResponses(mapBackendResponses(assessmentData.responses));

        // 2. Cargar cuestionario con criterios agrupados por estándar
        const questionnaireId = assessmentData.questionnaire_id;
        const questionnaireRes = await questionnairesApi.getById(questionnaireId);
        const grouped = groupCriteriaByStandard(questionnaireRes.data.criteria);
        setStandards(grouped);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al cargar la evaluación';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const handleSave = async (responses: FormResponse[]) => {
    if (!id) return;
    await assessmentsApi.saveResponses(
      id,
      responses.map((r) => ({
        criterionId: r.criterionId,
        status: r.status,
        description: r.description,
        comments: r.comments,
      }))
    );
  };

  const handleSubmit = async () => {
    if (!id) return;
    await assessmentsApi.submit(id);
    setSubmitSuccess(true);
    setTimeout(() => navigate('/assessments'), 2000);
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
      <div style={styles.centered}>
        <p style={{ color: '#de350b', marginBottom: 16 }}>Error: {error}</p>
        <button style={styles.backBtn} onClick={() => navigate('/assessments')}>
          ← Volver a Evaluaciones
        </button>
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
