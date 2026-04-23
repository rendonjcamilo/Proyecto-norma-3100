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
export type UserRole = 'super_admin' | 'auditor' | 'provider_admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  provider_id?: string;
  first_name?: string;
  last_name?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Provider {
  id: string;
  rut: string;
  legal_name: string;
  address?: string;
  city: string;
  department: string;
  status: string;
}

export interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
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
  provider_name?: string;
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
const del  = <T>(path: string)                       => request<T>('DELETE', path);
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

  forgotPassword: (email: string) =>
    post<{ message: string }>('/auth/forgot-password', { email }),

  resetPassword: (token: string, userId: string, newPassword: string) =>
    post<{ message: string }>('/auth/reset-password', { token, userId, newPassword }),
};

// ─────────────────────────────────────────────
// USUARIOS (USERS)
// ─────────────────────────────────────────────

export const usersApi = {
  list: () =>
    get<{ data: User[]; total: number }>('/api/users'),

  create: (payload: { email: string; password: string; confirm_password: string; role?: UserRole; provider_id?: string; first_name?: string; last_name?: string }) =>
    post<{ data: User }>('/api/users', payload),

  update: (id: string, payload: { first_name?: string; last_name?: string; role?: UserRole; provider_id?: string }) =>
    request<{ data: User }>('PUT', `/api/users/${id}`, payload),

  delete: (id: string) =>
    request<{ success: boolean; message: string }>('DELETE', `/api/users/${id}`),
};

// ─────────────────────────────────────────────
// PROVEEDORES
// ─────────────────────────────────────────────

export const providersApi = {
  list: () =>
    get<{ data: Provider[]; total: number }>('/api/providers'),

  getMyProviders: () =>
    get<{ providers: Provider[] }>('/api/providers'),

  getById: (id: string) =>
    get<{ data: Provider }>(`/api/providers/${id}`),

  create: (payload: Partial<Provider> & {
    admin_email?: string;
    admin_password?: string;
    admin_first_name?: string;
    admin_last_name?: string;
  }) =>
    post<{ data: { provider: Provider; admin: AdminUser } }>('/api/providers', payload),

  update: (id: string, payload: Partial<Provider>) =>
    put<{ data: Provider }>(`/api/providers/${id}`, payload),

  delete: (id: string) =>
    request<{ success: boolean }>('DELETE', `/api/providers/${id}`),

  assignAuditor: (providerId: string, auditorId: string) =>
    post<{ message: string }>(`/api/providers/${providerId}/assign-auditor`, { auditorId }),

  getAuditorProviders: (auditorId: string) =>
    get<{ auditor_id: string; count: number; providers: Provider[] }>(`/api/auditors/${auditorId}/providers`),

  getAuditorMetrics: (auditorId: string) =>
    get<{ pendingEvaluations: number; criticalFindings: number; avgComplianceRate: number; actionsRequired: number }>(`/api/auditors/${auditorId}/metrics`),

  removeAuditorFromProvider: (providerId: string, auditorId: string) =>
    request<{ success: boolean }>('DELETE', `/api/providers/${providerId}/auditors/${auditorId}`),
};

// ─────────────────────────────────────────────
// HALLAZGOS (FINDINGS)
// ─────────────────────────────────────────────

export const findingsApi = {
  listByProvider: (providerId: string, params?: { status?: string; severity?: string; limit?: number; offset?: number }) => {
    const allParams = { provider_id: providerId, ...params };
    const qs = '?' + new URLSearchParams(Object.entries(allParams).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString();
    return get<{ count: number; findings: Finding[] }>(`/api/findings${qs}`);
  },

  getById: (id: string) =>
    get<Finding & { actions?: any[] }>(`/api/findings/${id}`),

  create: (payload: { providerId: string; title: string; description: string; severity: FindingSeverity; dueDate: string; criterionId?: string }) =>
    post<{ data: Finding }>('/api/findings', payload),

  update: (id: string, payload: { title?: string; description?: string; severity?: FindingSeverity; due_date?: string; status?: FindingStatus }) =>
    put<{ data: Finding }>(`/api/findings/${id}`, payload),

  delete: (id: string) =>
    request<{ success: boolean }>('DELETE', `/api/findings/${id}`),

  updateStatus: (id: string, status: FindingStatus, notes?: string) =>
    put<{ data: Finding }>(`/api/findings/${id}/status`, { status, notes }),

  getRiskScore: (id: string) =>
    get<{ data: { score: number; trend: string } }>(`/api/findings/${id}/risk`),

  // Corrective Actions
  createAction: (findingId: string, payload: { title: string; description: string; assigned_to?: string; due_date?: string; priority?: string }) =>
    post<{ data: any }>(`/api/findings/${findingId}/actions`, payload),

  listActions: (params?: { finding_id?: string; status?: string; assigned_to?: string }) => {
    const qs = params
      ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString()
      : '';
    return get<{ data: any[]; total: number }>(`/api/actions${qs}`);
  },

  updateAction: (actionId: string, payload: { status?: string; title?: string; description?: string; due_date?: string }) =>
    put<{ data: any }>(`/api/actions/${actionId}`, payload),

  deleteAction: (actionId: string) =>
    request<{ success: boolean }>('DELETE', `/api/actions/${actionId}`),
};

// ─────────────────────────────────────────────
// EVALUACIONES (ASSESSMENTS)
// ─────────────────────────────────────────────

export const assessmentsApi = {
  listByProvider: (providerId: string) =>
    get<{ data: Assessment[]; total: number }>(`/api/assessments?providerId=${providerId}`),

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

  delete: (assessmentId: string) =>
    del<{ message: string }>(`/api/assessments/${assessmentId}`),
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

export interface Questionnaire {
  id: string;
  service_id: string;
  service_name?: string;
  version_type: 'initial' | 'year4' | 'annual' | 'pre-novelty';
  name?: string;
  status: 'draft' | 'published' | 'archived';
  total_criteria: number;
  created_at: string;
  updated_at: string;
}

export const questionnairesApi = {
  list: (params?: { serviceId?: string; status?: string; versionType?: string }) => {
    const qs = params
      ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString()
      : '';
    return get<{ data: Questionnaire[]; count: number }>(`/api/questions${qs}`);
  },

  getById: (id: string) =>
    get<{ data: QuestionnaireDetail }>(`/api/questions/${id}`),

  create: (payload: { serviceId: string; versionType: 'initial' | 'year4' | 'annual' | 'pre-novelty'; name?: string }) =>
    post<{ data: Questionnaire }>('/api/questions', payload),

  update: (id: string, payload: { name?: string; status?: string }) =>
    put<{ data: Questionnaire }>(`/api/questions/${id}`, payload),

  delete: (id: string) =>
    request<{ message: string }>('DELETE', `/api/questions/${id}`),
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

  getDashboardSummary: (providerId: string) =>
    get<{ compliance_rate: number; open_findings: number; in_progress_findings: number; resolved_findings: number; pending_actions: number; document_compliance: number }>(
      `/api/providers/${providerId}/reports/dashboard-summary`
    ),

  getGlobalSummary: () =>
    get<{ totalProviders: number; totalAuditors: number; assessmentsInProgress: number; criticalFindings: number; avgComplianceRate: number }>(
      '/api/reports/global-summary'
    ),

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

  downloadAuditReportDocx: (providerId: string, assessmentId?: string) => {
    const qs = assessmentId ? `?assessmentId=${assessmentId}` : '';
    return blob(`/api/providers/${providerId}/reports/auditoria.docx${qs}`);
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
  vencimiento_registro?: string;
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

export interface InvimaAlerta {
  id: string;
  numero_registro: string;
  tipo_alerta: 'farmacovigilancia' | 'tecnovigilancia' | 'retiro_mercado' | 'suspension' | 'otro';
  descripcion: string;
  fecha_alerta: string;
  revisada: boolean;
  revisada_por?: string;
  accion_tomada?: string;
  created_at: string;
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

  deleteProviderItem: (providerId: string, itemId: string) =>
    del<{ message: string }>(`/api/providers/${providerId}/invima/items/${itemId}`),

  getResumen: (providerId: string) =>
    get<{ data: InvimaSummary }>(`/api/providers/${providerId}/invima/resumen`),

  getPorVencer: (providerId: string, dias = 90) =>
    get<{ data: ProviderInvimaItem[]; total: number }>(`/api/providers/${providerId}/invima/por-vencer?dias=${dias}`),

  listAlertas: (filters?: { tipo?: string; sinRevisar?: boolean }) => {
    const qs = filters ? '?' + new URLSearchParams(Object.entries(filters).filter(([, v]) => v).map(([k, v]) => [k, String(v)])).toString() : '';
    return get<{ data: InvimaAlerta[]; total: number }>(`/api/invima/alertas${qs}`);
  },

  createAlerta: (payload: { numeroRegistro: string; tipoAlerta: string; descripcion: string }) =>
    post<{ data: InvimaAlerta }>('/api/invima/alertas', payload),

  marcarAlertaRevisada: (id: string, accionTomada: string) =>
    put<{ data: InvimaAlerta }>(`/api/invima/alertas/${id}/revisar`, { accionTomada }),

  exportCsv: (providerId: string) =>
    blob(`/api/providers/${providerId}/invima/export.csv`),
};

// ─────────────────────────────────────────────
// REPS (Registro Especial de Prestadores)
// ─────────────────────────────────────────────

export interface RepsRegistroData {
  codigo_habilitacion: string;
  nombre_prestador: string;
  nit: string;
  municipio: string;
  departamento: string;
  tipo_prestador: string;
  nivel_atencion: string;
  estado_habilitacion: 'habilitado' | 'deshabilitado' | 'en_tramite' | 'suspendido' | 'sin_verificar';
  fecha_habilitacion?: string;
  servicios_habilitados: Array<{ codigo: string; nombre: string; desde?: string; hasta?: string }>;
  capacidad_instalada?: Record<string, number>;
  sanciones?: Array<{ tipo: string; fecha: string; descripcion: string }>;
  novedades?: Array<{ tipo: string; fecha: string; descripcion: string }>;
}

export interface RepsConsultaResult {
  found: boolean;
  source: string;
  data: RepsRegistroData | null;
  error?: string;
}

export interface RepsVerificacion {
  id: string;
  provider_id: string;
  fecha_consulta: string;
  consultado_por?: string;
  reps_codigo_habilitacion: string;
  reps_nombre_prestador: string;
  reps_nit: string;
  reps_municipio: string;
  reps_departamento: string;
  reps_tipo_prestador: string;
  reps_nivel_atencion: string;
  estado_habilitacion: string;
  fecha_habilitacion?: string;
  servicios_habilitados: Array<{ codigo: string; nombre: string; desde?: string; hasta?: string }>;
  capacidad_instalada?: Record<string, number>;
  diferencias_encontradas: Array<{ campo: string; valor_reps: string; valor_declarado: string }>;
  tiene_diferencias: boolean;
  sanciones?: Array<{ tipo: string; fecha: string; descripcion: string }>;
  novedades?: Array<{ tipo: string; fecha: string; descripcion: string }>;
  observaciones?: string;
  created_at: string;
}

export interface RepsResumen {
  estado_habilitacion: string;
  ultima_verificacion: string | null;
  dias_desde_verificacion: number | null;
  tiene_diferencias: boolean;
  tiene_sanciones: boolean;
  servicios_habilitados_count: number;
}

export const repsApi = {
  consultar: (codigoHabilitacion: string) =>
    get<{ data: RepsConsultaResult }>(`/api/reps/consultar/${encodeURIComponent(codigoHabilitacion)}`),

  getUltimaVerificacion: (providerId: string) =>
    get<{ data: RepsVerificacion | null }>(`/api/providers/${providerId}/reps/ultima`),

  getHistorial: (providerId: string) =>
    get<{ data: RepsVerificacion[]; total: number }>(`/api/providers/${providerId}/reps/historial`),

  registrar: (providerId: string, datosReps: RepsRegistroData) =>
    post<{ data: RepsVerificacion; message: string }>(`/api/providers/${providerId}/reps/verificaciones`, { datosReps }),

  getResumen: (providerId: string) =>
    get<{ data: RepsResumen }>(`/api/providers/${providerId}/reps/resumen`),
};

// ─────────────────────────────────────────────
// NOTIFICACIONES
// ─────────────────────────────────────────────

export interface EmailTemplate {
  id: string;
  template_name: string;
  subject: string;
  html_body: string;
  variables?: string[];
  is_active: boolean;
}

export interface SmsTemplate {
  id: string;
  template_name: string;
  message_template: string;
  max_length: number;
  variables?: string[];
  is_active: boolean;
}

export const notificationsApi = {
  getEmailTemplates: () =>
    get<{ templates: EmailTemplate[] }>('/api/multichannel/email/templates'),

  getSmsTemplates: () =>
    get<{ templates: SmsTemplate[] }>('/api/multichannel/sms/templates'),

  sendToProvider: (payload: {
    providerId: string;
    templateName: string;
    channel: 'email' | 'sms';
    variables?: Record<string, string>;
  }) =>
    post<{ sent: number; deliveryIds: string[] }>('/api/multichannel/auditor/send', payload),
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
