/**
 * API Client — Norma 3100 Compliance System
 * Cliente centralizado para todos los endpoints del backend (http://localhost:3001)
 * Gestiona automáticamente el token JWT desde localStorage.
 */

// En dev, Vite proxea /api → localhost:3001, por lo que la variable no es necesaria.
// En prod (Railway), VITE_API_URL debe definirse con la URL absoluta del backend.
const BASE_URL = import.meta.env.VITE_API_URL || '';

// ─────────────────────────────────────────────
// TIPOS BASE
// ─────────────────────────────────────────────

export type Semaforo = 'verde' | 'naranja' | 'rojo';
// TODO: el backend retorna valores en dos idiomas según el endpoint/versión.
// Normalizar a inglés en el backend y eliminar los valores en español de estos tipos.
export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'critica' | 'alta' | 'media' | 'baja';
export type FindingStatus = 'open' | 'in_progress' | 'resolved' | 'closed' | 'abierta' | 'en_proceso' | 'cerrada';
export type UserRole = 'super_admin' | 'auditor' | 'provider_admin' | 'viewer';

export interface Provider {
  id: string;
  rut: string;
  legal_name: string;
  city: string;
  department: string;
  status: string;
}

export interface Finding {
  id: string;
  provider_id: string;
  title: string;
  description: string;
  severity: FindingSeverity;
  status: FindingStatus;
  risk_score: number;
  due_date: string;
  criterion_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Assessment {
  id: string;
  provider_id: string;
  service_id: string;
  questionnaire_id: string;
  assessment_version: 'initial' | 'year4' | 'annual' | 'pre-novelty';
  status: 'draft' | 'in_progress' | 'submitted' | 'locked' | 'completed' | 'archived';
  compliance_percent: number;
  compliance_percentage?: number; // TODO: unificar con compliance_percent — distintos endpoints usan nombres distintos
  semaforo?: Semaforo;
  started_date?: string;
  submitted_date?: string;
  title?: string;
  type?: string;
  created_at: string;
  updated_at: string;
}

export interface AssessmentResponse {
  criterionId: string;
  status: 'C' | 'NC' | 'NA';
  description?: string;
  comments?: string;
  evidenceFileIds?: string[];
}

export interface AssessmentMetrics {
  totalCriteria: number;
  cumple: number;
  noCumple: number;
  noAplica: number;
  compliancePercent: number;
  semaforo: Semaforo;
  perStandardMetrics?: Array<{
    standardCode: string;
    standardName: string;
    totalCriteria: number;
    cumple: number;
    noCumple: number;
    noAplica: number;
    compliancePercent: number;
  }>;
}

export interface Document {
  id: string;
  provider_id: string;
  code: string;
  name: string;
  category: string;
  standard_reference: string;
  is_mandatory: boolean;
  status: 'vigente' | 'vencido' | 'pendiente' | 'no_aplica';
  expiry_date?: string;
  file_url?: string;
  uploaded_at?: string;
}

export interface SuficienciaPatrimonial {
  id: string;
  provider_id: string;
  periodo_fiscal: string;
  cumple_suficiencia: boolean;
  estados_financieros_estado: string;
  poliza_rc_estado: string;
  poliza_rc_vigencia_hasta?: string;
  declaracion_renta_estado: string;
  certificacion_bancaria_estado: string;
  razon_solvencia?: number;
  nivel_endeudamiento?: number;
  observaciones?: string;
  updated_at: string;
}

export interface HCVerificacion {
  id: string;
  provider_id: string;
  fecha_verificacion: string;
  total_hc_revisadas: number;
  total_hc_conformes: number;
  porcentaje_conformidad: number;
  campos_minimos_cumplidos: number;
  hallazgos_identificados: Array<{ campo: string; descripcion: string; hcCount: number }>;
}

/** Refleja ComplianceReportData del backend (ReportService.ts) */
export interface ComplianceSummary {
  provider: {
    id: string;
    legal_name: string;
    rut: string;
    city: string;
    department: string;
  };
  generatedAt: string;
  generatedBy: string;
  metrics: {
    totalFindings: number;
    openFindings: number;
    inProgressFindings: number;
    resolvedFindings: number;
    closedFindings: number;
    overdueFindings: number;
    averageRiskScore: number;
    compliancePercentage: number;
  };
  documentCompliance?: {
    totalRequired: number;
    compliantCount: number;
    expiredCount: number;
    pendingCount: number;
    compliancePercentage: number;
  };
  topFindings: Array<{
    title: string;
    severity: string;
    riskScore: number;
    status: string;
    daysOverdue: number;
  }>;
}

export interface AuditReportData {
  provider: Provider;
  fechaInforme: string;
  estandares: Array<{
    codigo: string;
    nombre: string;
    totalCriterios: number;
    cumple: number;
    noCumple: number;
    noAplica: number;
    porcentajeCumplimiento: number;
    semaforo: Semaforo;
    hallazgos: Array<{ criterio: string; descripcion: string; tipo: string; severidad: string }>;
  }>;
  resumenCondiciones: {
    condicion1CumpleTecnicoAdministrativa: boolean | null;
    condicion2CumpleSuficienciaPatrimonial: boolean | null;
    condicion3PorcentajeCapacidadTecnologica: number;
  };
  conceptoHabilitacion: 'habilitado' | 'no_habilitado' | 'habilitado_condicionado' | 'pendiente';
}

// ─────────────────────────────────────────────
// CLIENTE HTTP
// ─────────────────────────────────────────────

function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
  options: { blob?: boolean; formData?: boolean } = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    // Para blob y formData no se envía Content-Type: el browser lo gestiona (multipart boundary)
    ...(!options.blob && !options.formData ? { 'Content-Type': 'application/json' } : {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: options.formData ? (body as FormData) : JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try { const e = await res.json(); msg = e.error || e.message || msg; } catch { /* ignore */ }
    throw new Error(msg);
  }

  if (options.blob) return res.blob() as unknown as T;
  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

const get  = <T>(path: string)                       => request<T>('GET',    path);
const post = <T>(path: string, body: unknown)        => request<T>('POST',   path, body);
const put  = <T>(path: string, body: unknown)        => request<T>('PUT',    path, body);
const blob = (path: string)                          => request<Blob>('GET', path, undefined, { blob: true });

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    post<{ access_token: string; user: { id: string; email: string; role: UserRole; first_name: string; last_name: string; provider_id: string } }>(
      '/auth/login', { email, password }
    ),

  logout: () => post<void>('/auth/logout', {}),
};

// ─────────────────────────────────────────────
// PROVEEDORES
// ─────────────────────────────────────────────

export const providersApi = {
  list: () =>
    get<{ data: Provider[]; total: number }>('/api/providers'),

  getById: (id: string) =>
    get<{ data: Provider }>(`/api/providers/${id}`),

  create: (payload: Partial<Provider>) =>
    post<{ data: Provider }>('/api/providers', payload),

  update: (id: string, payload: Partial<Provider>) =>
    put<{ data: Provider }>(`/api/providers/${id}`, payload),
};

// ─────────────────────────────────────────────
// HALLAZGOS (FINDINGS)
// ─────────────────────────────────────────────

export const findingsApi = {
  listByProvider: (providerId: string, params?: { status?: string; severity?: string; limit?: number; offset?: number }) => {
    const qs = params
      ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString()
      : '';
    return get<{ data: Finding[]; total: number }>(`/api/providers/${providerId}/findings${qs}`);
  },

  getById: (id: string) =>
    get<{ data: Finding }>(`/api/findings/${id}`),

  create: (payload: { providerId: string; title: string; description: string; severity: FindingSeverity; dueDate: string; criterionId?: string }) =>
    post<{ data: Finding }>('/api/findings', payload),

  updateStatus: (id: string, status: FindingStatus, notes?: string) =>
    put<{ data: Finding }>(`/api/findings/${id}/status`, { status, notes }),

  getRiskScore: (id: string) =>
    get<{ data: { score: number; trend: string } }>(`/api/findings/${id}/risk`),
};

// ─────────────────────────────────────────────
// EVALUACIONES (ASSESSMENTS)
// ─────────────────────────────────────────────

export const assessmentsApi = {
  listByProvider: (providerId: string) =>
    get<{ data: Assessment[]; total: number }>(`/api/providers/${providerId}/assessments`),

  getById: (id: string) =>
    get<{ data: Assessment & { responses?: AssessmentResponse[]; metrics?: AssessmentMetrics } }>(`/api/assessments/${id}`),

  create: (payload: { providerId: string; serviceId: string; questionnaireId: string; assessmentVersion: string }) =>
    post<{ data: Assessment }>('/api/assessments', payload),

  saveResponses: (assessmentId: string, responses: AssessmentResponse[]) =>
    put<{ data: Assessment & { metrics: AssessmentMetrics } }>(`/api/assessments/${assessmentId}`, { responses }),

  submit: (assessmentId: string) =>
    post<{ data: Assessment & { metrics: AssessmentMetrics } }>(`/api/assessments/${assessmentId}/submit`, {}),

  getMetrics: (assessmentId: string) =>
    get<{ data: AssessmentMetrics }>(`/api/assessments/${assessmentId}/metrics`),
};

// ─────────────────────────────────────────────
// SERVICIOS DE SALUD
// ─────────────────────────────────────────────

export interface HealthService {
  id: string;
  code: string;
  name: string;
  category: string;
  status: string;
}

export const servicesApi = {
  getAll: (params?: { category?: string; status?: string; search?: string }) => {
    const qs = params
      ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString()
      : '';
    return get<{ data: HealthService[]; count: number; categories: string[] }>(`/api/services${qs}`);
  },
};

// ─────────────────────────────────────────────
// CUESTIONARIOS
// ─────────────────────────────────────────────

export interface QuestionnaireCriterion {
  id: string;
  code: string;
  number: string;
  name: string;
  description: string;
  evidence_requirement?: string;
  complexity: 'simple' | 'medium' | 'complex';
  standard_id: string;
  standard_name: string;
  is_transversal: boolean;
  is_mandatory: boolean;
}

export interface QuestionnaireDetail {
  id: string;
  service_id: string;
  version_type: string;
  name: string;
  status: string;
  total_criteria: number;
  criteria: QuestionnaireCriterion[];
}

export const questionnairesApi = {
  getById: (id: string) =>
    get<{ data: QuestionnaireDetail }>(`/api/questions/${id}`),
};

// ─────────────────────────────────────────────
// DOCUMENTOS
// ─────────────────────────────────────────────

export const documentsApi = {
  getCatalog: () =>
    get<{ data: Array<{ code: string; name: string; category: string; standard_reference: string; is_mandatory: boolean; expiry_months: number | null }> }>(
      '/api/documents/catalog'
    ),

  listByProvider: (providerId: string) =>
    get<{ data: Document[]; total: number }>(`/api/providers/${providerId}/documents`),

  download: (docId: string) =>
    blob(`/api/documents/${docId}/download`),

  upload: (providerId: string, formData: FormData) =>
    request<{ data: Document }>('POST', `/api/providers/${providerId}/documents`, formData, { formData: true }),
};

// ─────────────────────────────────────────────
// REPORTES
// ─────────────────────────────────────────────

export const reportsApi = {
  getSummary: (providerId: string) =>
    get<{ data: ComplianceSummary }>(`/api/providers/${providerId}/reports/summary`),

  downloadCompliancePdf: (providerId: string) =>
    blob(`/api/providers/${providerId}/reports/compliance.pdf`),

  downloadComplianceExcel: (providerId: string) =>
    blob(`/api/providers/${providerId}/reports/compliance.xlsx`),

  getAuditReportData: (providerId: string, assessmentId?: string) => {
    const qs = assessmentId ? `?assessmentId=${assessmentId}` : '';
    return get<{ data: AuditReportData }>(`/api/providers/${providerId}/reports/auditoria/datos${qs}`);
  },

  downloadAuditReportPdf: (providerId: string, assessmentId?: string) => {
    const qs = assessmentId ? `?assessmentId=${assessmentId}` : '';
    return blob(`/api/providers/${providerId}/reports/auditoria.pdf${qs}`);
  },
};

// ─────────────────────────────────────────────
// SUFICIENCIA PATRIMONIAL (Condición 2)
// ─────────────────────────────────────────────

export const suficienciaApi = {
  getLatest: (providerId: string, periodo?: string) => {
    const qs = periodo ? `?periodo=${periodo}` : '';
    return get<{ data: SuficienciaPatrimonial }>(`/api/providers/${providerId}/suficiencia-patrimonial${qs}`);
  },

  getHistorial: (providerId: string) =>
    get<{ data: SuficienciaPatrimonial[]; total: number }>(`/api/providers/${providerId}/suficiencia-patrimonial/historial`),

  getResumen: (providerId: string) =>
    get<{ data: { cumple: boolean; periodo: string | null; documentos: Array<{ nombre: string; estado: string }>; indicadores: { razonSolvencia: number | null; nivelEndeudamiento: number | null } } }>(
      `/api/providers/${providerId}/suficiencia-patrimonial/resumen`
    ),

  verificarPoliza: (providerId: string) =>
    get<{ data: { estado: string; diasRestantes: number | null; vencimiento: string | null } }>(
      `/api/providers/${providerId}/suficiencia-patrimonial/poliza-vigencia`
    ),

  upsert: (providerId: string, payload: Partial<SuficienciaPatrimonial> & { periodoFiscal: string }) =>
    post<{ data: SuficienciaPatrimonial; message: string }>(`/api/providers/${providerId}/suficiencia-patrimonial`, payload),
};

// ─────────────────────────────────────────────
// HISTORIA CLÍNICA (Estándar TSHCR)
// ─────────────────────────────────────────────

export const historiaClinicaApi = {
  getVerificaciones: (providerId: string, limit = 20) =>
    get<{ data: HCVerificacion[]; total: number }>(`/api/providers/${providerId}/historia-clinica/verificaciones?limit=${limit}`),

  getVerificacion: (providerId: string, id: string) =>
    get<{ data: HCVerificacion }>(`/api/providers/${providerId}/historia-clinica/verificaciones/${id}`),

  registrar: (providerId: string, payload: {
    totalHcRevisadas: number;
    totalHcConformes: number;
    campos: Record<string, boolean>;
    hallazgosIdentificados?: Array<{ campo: string; descripcion: string; hcCount: number }>;
    observaciones?: string;
    assessmentId?: string;
  }) =>
    post<{ data: HCVerificacion; message: string }>(`/api/providers/${providerId}/historia-clinica/verificaciones`, payload),

  getResumen: (providerId: string) =>
    get<{ data: { totalVerificaciones: number; ultimaVerificacion: string | null; porcentajeConformidadPromedio: number; camposConFallaFrecuente: string[]; totalHallazgos: number; cumpleTSHCR: boolean } }>(
      `/api/providers/${providerId}/historia-clinica/resumen`
    ),

  getCamposMinimos: (providerId: string) =>
    get<{ data: Array<{ numero: number; campo: string; nombre: string; cumple: boolean }>; resumen: { totalCampos: number; camposCumplidos: number; camposFaltantes: number; cumplimiento: string } }>(
      `/api/providers/${providerId}/historia-clinica/campos-minimos`
    ),
};

// ─────────────────────────────────────────────
// INVIMA (Estándar TSMD)
// ─────────────────────────────────────────────

export interface InvimaRegistro {
  id: string;
  numero_registro: string;
  tipo_registro: string | null;
  estado: string;
  nombre_producto: string | null;
  categoria: string | null;
  principios_activos: string | null;
  presentaciones_autorizadas: string | null;
  clasificacion_riesgo: string | null;
  titular_registro: string | null;
  titular_fabricante: string | null;
  titular_importador: string | null;
  pais_origen: string | null;
  fecha_emision: string | null;
  fecha_vencimiento: string | null;
  fuente_datos: string;
  ultima_consulta: string;
}

export interface InvimaLookupResult {
  found: boolean;
  source: string;
  cached: boolean;
  data: InvimaRegistro | null;
  error?: string;
}

export interface ProviderInvimaItem {
  id: string;
  provider_id: string;
  invima_registro_id: string;
  nombre_comercial: string | null;
  lote_actual: string | null;
  cantidad_disponible: number | null;
  ubicacion_almacenamiento: string | null;
  condiciones_almacenamiento: string | null;
  fecha_vencimiento_lote: string | null;
  semaforo: string;
  activo: boolean;
  numero_registro?: string;
  nombre_producto?: string;
  estado_registro?: string;
  categoria?: string;
}

export interface InvimaSummary {
  totalItems: number;
  itemsVerde: number;
  itemsNaranja: number;
  itemsAmarillo: number;
  itemsRojo: number;
  registrosVigentes: number;
  registrosNoVigentes: number;
  proximoVencimiento: string | null;
  porcentajeCumplimientoTsmd: number;
}

export const invimaApi = {
  lookup: (numeroRegistro: string) =>
    get<{ data: InvimaLookupResult }>(`/api/invima/lookup/${encodeURIComponent(numeroRegistro)}`),

  search: (q: string, limit = 20) =>
    get<{ data: InvimaRegistro[]; total: number }>(`/api/invima/registros/search?q=${encodeURIComponent(q)}&limit=${limit}`),

  createRegistro: (payload: Record<string, unknown>) =>
    post<{ data: InvimaRegistro; message: string }>('/api/invima/registros', payload),

  listProviderItems: (providerId: string, filters?: { semaforo?: string; categoria?: string }) => {
    const qs = filters
      ? '?' + new URLSearchParams(Object.entries(filters).filter(([, v]) => v).map(([k, v]) => [k, String(v)])).toString()
      : '';
    return get<{ data: ProviderInvimaItem[]; total: number }>(`/api/providers/${providerId}/invima/items${qs}`);
  },

  addProviderItem: (providerId: string, payload: Record<string, unknown>) =>
    post<{ data: ProviderInvimaItem; message: string }>(`/api/providers/${providerId}/invima/items`, payload),

  getResumen: (providerId: string) =>
    get<{ data: InvimaSummary }>(`/api/providers/${providerId}/invima/resumen`),

  getPorVencer: (providerId: string, dias = 90) =>
    get<{ data: ProviderInvimaItem[]; total: number }>(`/api/providers/${providerId}/invima/por-vencer?dias=${dias}`),
};

// ─────────────────────────────────────────────
// UTILIDADES
// ─────────────────────────────────────────────

/** Descarga un Blob como archivo en el navegador */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  try {
    a.click();
  } finally {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
