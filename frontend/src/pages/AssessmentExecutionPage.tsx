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
import { AnexoCuatroEmbed } from '../components/Assessment/AnexoCuatroEmbed';
import {
  assessmentsApi,
  questionnairesApi,
  anexo4Api,
  type Assessment,
  type AssessmentResponse,
  type QuestionnaireCriterion,
  type Anexo4Verificacion,
} from '../services/api';

// ─── Tipos internos del formulario ───────────────────────────────────────────

interface Criterion {
  id: string;
  code: string;
  number?: string;
  name: string;
  description: string;
  evidenceRequirement: string;
  complexity: 'simple' | 'medium' | 'complex';
  ncHint?: string;
  is_section_header?: boolean;
  sort_order?: number;
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
        // Usar standard_code del backend si está disponible; fallback a extracción por código
        code: (c as any).standard_code ?? extractStandardCode(c.code),
        name: c.standard_name,
        isTransversal: c.is_transversal,
        criteria: [],
      });
    }
    // Usar 'name' y 'description' del backend; si no existen (flujo mock), usar 'text' como fallback
    const rawName = (c as any).name || (c as any).text || 'Sin nombre';
    const rawDesc = (c as any).description || (c as any).text || '';
    const nameNorm = rawName.trim();
    const descNorm = rawDesc.trim();
    // name puede estar truncado con "..." literal en la BD (seeding cortó a 250 chars).
    // Si description empieza con el prefijo del name (sin los "..."), son el mismo criterio.
    const namePrefix = nameNorm.endsWith('...') ? nameNorm.slice(0, -3) : nameNorm;
    const isRedundant = descNorm.startsWith(namePrefix) || nameNorm.startsWith(descNorm) || descNorm === nameNorm;
    const name = isRedundant ? (descNorm.length >= nameNorm.length ? descNorm : nameNorm) : rawName;
    const description = isRedundant ? '' : rawDesc;

    standardMap.get(c.standard_id)!.criteria.push({
      id: c.id,
      code: c.code,
      number: (c as any).number || undefined,
      name,
      description,
      evidenceRequirement: c.evidence_requirement || '',
      complexity: c.complexity,
      ncHint: c.nc_hint || undefined,
      is_section_header: (c as any).is_section_header === true,
      sort_order: (c as any).sort_order ?? undefined,
    });
  }

  // Ordenar criterios dentro de cada estándar por sort_order si está disponible
  for (const standard of standardMap.values()) {
    const hasSortOrder = standard.criteria.some(c => c.sort_order != null);
    if (hasSortOrder) {
      standard.criteria.sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999));
    }
  }

  // TH=1, INF=2, DOT=3, MD=4, PP=5, HCR=6, INT=7
  // Aplica tanto a transversales (TSTH, TSINF…) como a específicos (APH_TH, APH_INF…)
  // MED = alias de MD (SF_MED), HC = alias de HCR (SF_HC) — Excel usa esas abreviaturas
  const DOMAIN_ORDER: Record<string, number> = {
    TH: 1, INF: 2, DOT: 3, MD: 4, MED: 4, PP: 5, HCR: 6, HC: 6, INT: 7,
  };
  const getDomainSuffix = (code: string): string => {
    const underscoreIdx = code.lastIndexOf('_');
    if (underscoreIdx !== -1) return code.slice(underscoreIdx + 1);
    if (code.startsWith('TS')) return code.slice(2);
    return code;
  };
  return Array.from(standardMap.values()).sort((a, b) => {
    const orderA = DOMAIN_ORDER[getDomainSuffix(a.code)] ?? 99;
    const orderB = DOMAIN_ORDER[getDomainSuffix(b.code)] ?? 99;
    if (orderA !== orderB) return orderA - orderB;
    // Mismo dominio: transversales primero
    if (a.isTransversal !== b.isTransversal) return a.isTransversal ? -1 : 1;
    return 0;
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
  const [activeTab, setActiveTab] = useState<'assessment' | 'hc'>('assessment');
  const [hcVerificacion, setHcVerificacion] = useState<Anexo4Verificacion | null>(null);

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
        setInitialResponses(mapBackendResponses(assessmentData.responses));

        // 2. Cargar criterios desde el assessment (incluye transversales + específicos del servicio)
        const hasServiceId = assessmentData.service_id || assessmentData.serviceId;
        try {
          const questionsRes = await assessmentsApi.getQuestions(id);
          const grouped = groupCriteriaByStandard(questionsRes.data.criteria);
          setStandards(grouped);
        } catch (questionsErr) {
          // Si el assessment tiene servicio, el fallback omitiría criterios específicos → propagar error
          if (hasServiceId) {
            throw new Error(
              'No se pudieron cargar los criterios del servicio. Por favor recarga la página.'
            );
          }
          // Fallback solo para assessments sin servicio (solo 7 estándares transversales)
          if (assessmentData.questionnaire && assessmentData.questionnaire.criteria) {
            const grouped = groupCriteriaByStandard(assessmentData.questionnaire.criteria);
            setStandards(grouped);
          } else if (assessmentData.questionnaire_id || assessmentData.questionnaireId) {
            const qid = assessmentData.questionnaire_id ?? assessmentData.questionnaireId;
            const questionnaireRes = await questionnairesApi.getById(qid);
            const grouped = groupCriteriaByStandard(questionnaireRes.data.criteria);
            setStandards(grouped);
          }
        }
        // 3. Verificar si hay una Verificación H.C. (Anexo 4) vinculada
        try {
          const hcRes = await anexo4Api.getByAssessmentId(id);
          if (hcRes.data) {
            setHcVerificacion(hcRes.data);
          }
        } catch {
          // Sin HC vinculada — no es error bloqueante
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al cargar la evaluación';
        console.error('[AssessmentExecutionPage] Error loading:', err);
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
        compliance_percent: (result.data as any).compliancePercent ?? result.data.compliance_percent,
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

      {/* Tabs — solo si hay Verificación H.C. vinculada */}
      {hcVerificacion && (
        <div style={styles.tabBar}>
          <button
            style={{ ...styles.tabBtn, ...(activeTab === 'assessment' ? styles.tabBtnActive : {}) }}
            onClick={() => setActiveTab('assessment')}
          >
            📋 Evaluación
          </button>
          <button
            style={{ ...styles.tabBtn, ...(activeTab === 'hc' ? styles.tabBtnActive : {}) }}
            onClick={() => setActiveTab('hc')}
          >
            🏥 Verificación H.C.
          </button>
        </div>
      )}

      {/* Formulario principal */}
      {activeTab === 'assessment' && (
        <AssessmentForm
          assessment={{
            id: assessment.id,
            providerId: assessment.provider_id,
            serviceId: assessment.service_id,
            serviceName: assessment.service_name ?? undefined,
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
      )}

      {/* Tab Verificación Historia Clínica */}
      {activeTab === 'hc' && hcVerificacion && (
        <AnexoCuatroEmbed
          verificacionId={hcVerificacion.id}
          readOnly={isReadOnly}
          onUpdated={(updated) => setHcVerificacion(updated)}
        />
      )}
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
  tabBar: {
    display: 'flex',
    gap: 4,
    marginBottom: 20,
    borderBottom: '2px solid #e5e7eb',
    paddingBottom: 0,
  },
  tabBtn: {
    padding: '8px 20px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    color: '#6b7280',
    borderBottom: '2px solid transparent',
    marginBottom: '-2px',
    borderRadius: '4px 4px 0 0',
    transition: 'color 0.15s, border-color 0.15s',
  },
  tabBtnActive: {
    color: '#6255A0',
    borderBottom: '2px solid #6255A0',
    fontWeight: 600,
  },
};
