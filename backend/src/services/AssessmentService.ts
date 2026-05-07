/**
 * Assessment Execution Service
 * Implements Norma 3100 assessment execution with:
 * - Assessment CRUD operations
 * - Compliance calculation (cumplimiento %)
 * - Semáforo color determination (verde/naranja/rojo)
 * - Auto-generated hallazgos (findings) from NC criteria
 * - Per-standard compliance breakdown
 * - Assessment locking after submission
 */

import { Pool } from 'pg';
import { logger } from '../utils/logger.js';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface AssessmentResponse {
  criterionId: string;
  status: 'C' | 'NC' | 'NA';
  description?: string;
  comments?: string;
  evidenceFileIds?: string[];
  respondedDate: Date;
  respondedBy: string;
}

export interface AssessmentMetrics {
  totalCriteria: number;
  cumple: number;
  noCumple: number;
  noAplica: number;
  compliancePercent: number;
  semaforo: 'verde' | 'naranja' | 'rojo';
  hallazgosCount?: number;
  perStandardMetrics?: Array<{
    standardId: string;
    standardCode: string;
    standardName: string;
    totalCriteria: number;
    cumple: number;
    noCumple: number;
    noAplica: number;
    compliancePercent: number;
  }>;
}

export interface Assessment {
  id: string;
  providerId: string;
  locationId?: string;
  serviceId: string;
  questionnaireId: string;
  assessmentVersion: 'initial' | 'year4' | 'annual' | 'pre-novelty';
  status: 'draft' | 'in_progress' | 'submitted' | 'locked';
  startedDate: Date;
  startedBy: string;
  submittedDate?: Date;
  submittedBy?: string;
  compliancePercent: number;
  semaforo: 'verde' | 'naranja' | 'rojo';
  hallazgosGenerated: boolean;
  responses?: AssessmentResponse[];
  metrics?: AssessmentMetrics;
}

export interface Hallazgo {
  id: string;
  assessmentId: string;
  criterionId: string;
  status: 'open' | 'in_progress' | 'closed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  findingDescription: string;
  evidenceLinks?: string[];
  createdAt: Date;
}

// ============================================================
// ASSESSMENT SERVICE
// ============================================================

export class AssessmentService {
  constructor(private pool: Pool) {}

  /**
   * Create assessment instance
   * Loads published questionnaire for the service
   */
  async createAssessment(
    providerId: string,
    locationId: string | null,
    serviceId: string,
    assessmentVersion: 'initial' | 'year4' | 'annual' | 'pre-novelty',
    userId: string,
    title?: string
  ): Promise<Assessment> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Find published master questionnaire for version
      // Master questionnaire (service_id IS NULL) contains all 7 standards + 512 criteria
      const questionnaireQuery = `
        SELECT id, total_criteria
        FROM questionnaires
        WHERE version_type = $1 AND status = 'published' AND service_id IS NULL
        LIMIT 1
      `;

      const qResult = await client.query(questionnaireQuery, [assessmentVersion]);

      if (qResult.rows.length === 0) {
        throw new Error(
          `No published questionnaire found for version ${assessmentVersion}`
        );
      }

      const questionnaireId = qResult.rows[0].id;
      const totalCriteria = qResult.rows[0].total_criteria;

      // 2. Create assessment instance
      // Note: version is determined by questionnaire.version_type, not stored here
      const assessmentQuery = `
        INSERT INTO assessments
          (provider_id, location_id, service_id, questionnaire_id, status, created_by, title, assessment_version)
        VALUES ($1, $2, $3, $4, 'draft', $5, $6, $7)
        RETURNING
          id, provider_id, location_id, service_id, questionnaire_id, version,
          status, created_by, compliance_pct, created_at, title, assessment_version
      `;

      const aResult = await client.query(assessmentQuery, [
        providerId,
        locationId,
        serviceId,
        questionnaireId,
        userId,
        title || null,
        assessmentVersion,
      ]);

      const assessment = aResult.rows[0];

      // 3. Create initial assessment metrics record
      const metricsQuery = `
        INSERT INTO assessment_metrics
          (assessment_id, total_criteria, cumple_count, no_cumple_count, no_aplica_count, compliance_percent, semaforo_color)
        VALUES ($1, $2, 0, 0, 0, 0, 'rojo')
      `;

      await client.query(metricsQuery, [assessment.id, totalCriteria]);

      // 4. Pre-poblar todas las respuestas con NA por defecto
      // Así el usuario parte de 512/512 y solo edita lo que necesite
      await client.query(`
        INSERT INTO assessment_responses_detailed
          (assessment_id, criterion_id, response_status, description, comments, responded_by)
        SELECT $1, qc.criterion_id, 'NA', '', '', $3
        FROM questionnaire_criteria qc
        WHERE qc.questionnaire_id = $2
        ON CONFLICT DO NOTHING
      `, [assessment.id, questionnaireId, userId]);

      // 5. Actualizar métricas iniciales: todos en NA
      await client.query(`
        UPDATE assessment_metrics
        SET no_aplica_count = $2,
            compliance_percent = 0,
            semaforo_color = 'rojo'
        WHERE assessment_id = $1
      `, [assessment.id, totalCriteria]);

      // 6. Actualizar compliance_pct en assessments
      await client.query(`
        UPDATE assessments SET compliance_pct = 0 WHERE id = $1
      `, [assessment.id]);

      await client.query('COMMIT');

      logger.info({
        msg: 'Assessment created',
        assessment_id: assessment.id,
        service_id: serviceId,
        assessment_version: assessmentVersion,
        total_criteria: totalCriteria,
      });

      return {
        id: assessment.id,
        providerId: assessment.provider_id,
        locationId: assessment.location_id,
        serviceId: assessment.service_id,
        questionnaireId: assessment.questionnaire_id,
        assessmentVersion: assessment.assessment_version,
        status: assessment.status,
        startedDate: assessment.started_date,
        startedBy: assessment.started_by,
        compliancePercent: assessment.compliance_percent,
        semaforo: assessment.semaforo_color,
        hallazgosGenerated: assessment.hallazgos_generated,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get assessment by ID with all responses and metrics
   */
  async getAssessment(assessmentId: string): Promise<Assessment | null> {
    // Fetch assessment with questionnaire version info
    const query = `
      SELECT
        a.id,
        a.provider_id,
        a.location_id,
        a.service_id,
        a.questionnaire_id,
        COALESCE(q.version_type, 'initial') AS assessment_version,
        a.status,
        a.assigned_date AS started_date,
        a.created_by AS started_by,
        a.submitted_at AS submitted_date,
        a.compliance_pct AS compliance_percent
      FROM assessments a
      LEFT JOIN questionnaires q ON a.questionnaire_id = q.id
      WHERE a.id = $1
    `;

    const result = await this.pool.query(query, [assessmentId]);

    if (result.rows.length === 0) {
      return null;
    }

    const assessment = result.rows[0];

    // Fetch all responses for this assessment
    const responsesQuery = `
      SELECT criterion_id, response_status, description, comments, evidence_file_ids
      FROM assessment_responses_detailed
      WHERE assessment_id = $1
      ORDER BY criterion_id
    `;
    const responsesResult = await this.pool.query(responsesQuery, [assessmentId]);
    const responses = responsesResult.rows.map(row => ({
      criterionId: row.criterion_id,
      status: row.response_status,
      description: row.description,
      comments: row.comments,
      evidenceFileIds: row.evidence_file_ids,
    }));

    // Map semáforo based on compliance percentage
    let semaforo: 'verde' | 'naranja' | 'rojo' = 'naranja';
    const compliancePct = parseFloat(assessment.compliance_percent) || 0;
    if (compliancePct >= 80) {
      semaforo = 'verde';
    } else if (compliancePct < 50) {
      semaforo = 'rojo';
    }

    return {
      id: assessment.id,
      providerId: assessment.provider_id,
      locationId: assessment.location_id,
      serviceId: assessment.service_id,
      questionnaireId: assessment.questionnaire_id,
      assessmentVersion: assessment.assessment_version,
      status: assessment.status,
      startedDate: assessment.started_date,
      startedBy: assessment.started_by,
      submittedDate: assessment.submitted_date,
      submittedBy: null,
      compliancePercent: compliancePct,
      semaforo: semaforo,
      hallazgosGenerated: false,
      responses: responses,
    };
  }

  /**
   * Record response(s) for assessment criteria
   * Supports single and batch updates
   * Recalculates compliance % and semáforo in real-time
   */
  async recordResponses(
    assessmentId: string,
    responses: AssessmentResponse[],
    userId: string
  ): Promise<Assessment | null> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Verify assessment exists
      const assessmentQuery = `
        SELECT status FROM assessments WHERE id = $1
      `;

      const aResult = await client.query(assessmentQuery, [assessmentId]);

      if (aResult.rows.length === 0) {
        throw new Error(`Assessment ${assessmentId} not found`);
      }

      // Allow recording responses on draft assessments only
      if (!['draft', 'submitted'].includes(aResult.rows[0].status)) {
        throw new Error('Assessment is locked and cannot be modified');
      }

      // 2. Save responses to criterion response table
      for (const response of responses) {
        const responseQuery = `
          INSERT INTO assessment_responses_detailed
            (assessment_id, criterion_id, response_status, description, comments,
             evidence_file_ids, responded_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (assessment_id, criterion_id)
          DO UPDATE SET
            response_status = $3,
            description = $4,
            comments = $5,
            evidence_file_ids = $6,
            responded_by = $7,
            updated_at = NOW()
        `;

        await client.query(responseQuery, [
          assessmentId,
          response.criterionId,
          response.status,
          response.description || null,
          response.comments || null,
          JSON.stringify(response.evidenceFileIds || []),
          userId,
        ]);
      }

      // 3. Recalculate compliance and semáforo
      const metrics = await this.calculateCompliance(assessmentId, client);

      // 4. Update assessment with new metrics
      const updateQuery = `
        UPDATE assessments
        SET
          compliance_pct = $2,
          updated_at = NOW()
        WHERE id = $1
        RETURNING
          id, provider_id, location_id, service_id, questionnaire_id,
          status, assigned_date, created_by, submitted_at, compliance_pct
      `;

      const updResult = await client.query(updateQuery, [
        assessmentId,
        metrics.compliancePercent,
      ]);

      await client.query('COMMIT');

      const assessment = updResult.rows[0];
      return this.getAssessment(assessmentId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Submit assessment for completion
   * - Marks as submitted (locked)
   * - Auto-generates hallazgos from NC criteria
   * - Emits audit events
   * - Cannot be modified after submission
   */
  async submitAssessment(assessmentId: string, userId: string): Promise<Assessment | null> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Verify assessment exists and is in draft
      const assessmentQuery = `
        SELECT
          id, provider_id, service_id, questionnaire_id
        FROM assessments
        WHERE id = $1 AND status = 'draft'
      `;

      const aResult = await client.query(assessmentQuery, [assessmentId]);

      if (aResult.rows.length === 0) {
        throw new Error('Assessment not found or already submitted');
      }

      const assessment = aResult.rows[0];

      // 2. Mark assessment as submitted
      const submitQuery = `
        UPDATE assessments
        SET
          status = 'submitted',
          submitted_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
        RETURNING id, provider_id, location_id, service_id, questionnaire_id,
          status, assigned_date, created_by, submitted_at, compliance_pct
      `;

      const submitResult = await client.query(submitQuery, [assessmentId]);

      // 3. Auto-generate hallazgos from NC criteria
      const hallazgos = await this.generateHallazgos(assessmentId, assessment.service_id, userId, client);

      // 4. Log the submission
      logger.info({
        msg: 'Assessment submitted',
        assessment_id: assessmentId,
        hallazgos_count: hallazgos.length,
      });

      await client.query('COMMIT');

      return this.getAssessment(assessmentId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Calculate compliance percentage and semáforo color
   * Formula: Cumplimiento = (C / (C + NC)) × 100
   * Only C and NC count; NA excluded
   * Semáforo: Verde ≥80%, Naranja 50-79%, Rojo <50%
   */
  async calculateCompliance(assessmentId: string, client?: any): Promise<AssessmentMetrics> {
    const pool = client || this.pool;

    // Fetch all responses for assessment
    const responsesQuery = `
      SELECT response_status, criterion_id
      FROM assessment_responses_detailed
      WHERE assessment_id = $1
    `;

    const responsesResult = await pool.query(responsesQuery, [assessmentId]);
    const responses = responsesResult.rows;

    // Count responses
    const cumple = responses.filter((r: any) => r.response_status === 'C').length;
    const noCumple = responses.filter((r: any) => r.response_status === 'NC').length;
    const noAplica = responses.filter((r: any) => r.response_status === 'NA').length;

    // Calculate compliance percentage
    const denominator = cumple + noCumple;
    const compliancePercent = denominator > 0 ? Math.round((cumple / denominator) * 100) : 0;

    // Determine semáforo color
    let semaforo: 'verde' | 'naranja' | 'rojo' = 'rojo';
    if (compliancePercent >= 80) {
      semaforo = 'verde';
    } else if (compliancePercent >= 50) {
      semaforo = 'naranja';
    }

    // Fetch assessment to get total criteria count
    const assessmentQuery = `
      SELECT q.total_criteria
      FROM assessments a
      JOIN questionnaires q ON a.questionnaire_id = q.id
      WHERE a.id = $1
    `;

    const assessmentResult = await pool.query(assessmentQuery, [assessmentId]);
    const totalCriteria = assessmentResult.rows[0]?.total_criteria || 0;

    // Calculate per-standard metrics
    const perStandardQuery = `
      SELECT
        es.id as standard_id,
        es.code as standard_code,
        es.name as standard_name,
        COUNT(ec.id) as total_in_standard,
        SUM(CASE WHEN acr.response_status = 'C' THEN 1 ELSE 0 END) as cumple_in_standard,
        SUM(CASE WHEN acr.response_status = 'NC' THEN 1 ELSE 0 END) as noCumple_in_standard,
        SUM(CASE WHEN acr.response_status = 'NA' THEN 1 ELSE 0 END) as noAplica_in_standard
      FROM evaluation_standards es
      LEFT JOIN evaluation_criteria ec ON es.id = ec.standard_id
      LEFT JOIN assessment_responses_detailed acr ON ec.id = acr.criterion_id AND acr.assessment_id = $1
      WHERE ec.service_id = (SELECT service_id FROM assessments WHERE id = $1)
      GROUP BY es.id, es.code, es.name
      ORDER BY es.code
    `;

    const perStandardResult = await pool.query(perStandardQuery, [assessmentId]);

    const perStandardMetrics = perStandardResult.rows.map((row: any) => {
      const cumpleStandard = row.cumple_in_standard || 0;
      const noCumpleStandard = row.nocumple_in_standard || 0;
      const noAplicaStandard = row.noapplica_in_standard || 0;
      const denomStandard = cumpleStandard + noCumpleStandard;
      const complianceStandard = denomStandard > 0
        ? Math.round((cumpleStandard / denomStandard) * 100)
        : 0;

      return {
        standardId: row.standard_id,
        standardCode: row.standard_code,
        standardName: row.standard_name,
        totalCriteria: row.total_in_standard || 0,
        cumple: cumpleStandard,
        noCumple: noCumpleStandard,
        noAplica: noAplicaStandard,
        compliancePercent: complianceStandard,
      };
    });

    // Update metrics in database
    const updateMetricsQuery = `
      UPDATE assessment_metrics
      SET
        cumple_count = $2,
        no_cumple_count = $3,
        no_aplica_count = $4,
        compliance_percent = $5,
        semaforo_color = $6,
        per_standard_metrics = $7,
        updated_at = NOW()
      WHERE assessment_id = $1
    `;

    await pool.query(updateMetricsQuery, [
      assessmentId,
      cumple,
      noCumple,
      noAplica,
      compliancePercent,
      semaforo,
      JSON.stringify(perStandardMetrics),
    ]);

    return {
      totalCriteria,
      cumple,
      noCumple,
      noAplica,
      compliancePercent,
      semaforo,
      perStandardMetrics,
    };
  }

  /**
   * Generate hallazgos (findings) from NC criteria
   * Auto-creates finding with:
   * - severity: auto-calculated from standard criticality + service complexity
   * - status: "abierta" (open)
   * - source: assessment response
   */
  async generateHallazgos(
    assessmentId: string,
    serviceId: string,
    userId: string,
    client: any
  ): Promise<Hallazgo[]> {
    // 1. Get all NC responses
    const ncResponsesQuery = `
      SELECT
        acr.id as response_id,
        acr.criterion_id,
        acr.description,
        acr.comments,
        ec.code as criterion_code,
        ec.name as criterion_name,
        ec.complexity,
        es.is_transversal
      FROM assessment_responses_detailed acr
      JOIN evaluation_criteria ec ON acr.criterion_id = ec.id
      JOIN evaluation_standards es ON ec.standard_id = es.id
      WHERE acr.assessment_id = $1 AND acr.response_status = 'NC'
      ORDER BY ec.code
    `;

    const ncResult = await client.query(ncResponsesQuery, [assessmentId]);
    const ncResponses = ncResult.rows;

    const hallazgos: Hallazgo[] = [];

    for (const ncResponse of ncResponses) {
      // 2. Determine severity
      // - Transversales = higher base weight (media/alta)
      // - Complex criteria = higher severity
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';

      if (ncResponse.is_transversal) {
        severity = ncResponse.complexity === 'complex' ? 'critical' : 'high';
      } else {
        severity = ncResponse.complexity === 'complex' ? 'high' : 'medium';
      }

      // 3. Create finding
      const hallazgoQuery = `
        INSERT INTO findings
          (assessment_id, assessment_response_id, criterion_id, finding_type, status, severity,
           title, description, evidence_references, provider_id, service_id, source)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING
          id, assessment_id, criterion_id, status, severity, title, description
      `;

      const fullTitle = `${ncResponse.criterion_code}: ${ncResponse.criterion_name}`;
      const hallazgoTitle = fullTitle.length > 255 ? fullTitle.substring(0, 252) + '...' : fullTitle;
      const hallazgoDescription = `Observación: ${ncResponse.description || 'No especificada'}${ncResponse.comments ? `\nComentarios: ${ncResponse.comments}` : ''}`;

      const finding = await client.query(hallazgoQuery, [
        assessmentId,
        ncResponse.response_id,
        ncResponse.criterion_id,
        'assessment',
        'open',
        severity,
        hallazgoTitle,
        hallazgoDescription,
        JSON.stringify([]),
        (await client.query('SELECT provider_id FROM assessments WHERE id = $1', [assessmentId]))
          .rows[0].provider_id,
        serviceId,
        'assessment',
      ]);

      if (finding.rows.length > 0) {
        const f = finding.rows[0];
        hallazgos.push({
          id: f.id,
          assessmentId: f.assessment_id,
          criterionId: f.criterion_id,
          status: f.status,
          severity: f.severity,
          findingDescription: f.description,
          createdAt: new Date(),
        });
      }
    }

    logger.info({
      msg: 'Hallazgos generated',
      assessment_id: assessmentId,
      hallazgos_count: hallazgos.length,
    });

    return hallazgos;
  }

  /**
   * List assessments with optional filters
   */
  async listAssessments(filters: {
    providerId?: string;
    serviceId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ assessments: Assessment[]; total: number }> {
    let query = `
      SELECT
        a.id, a.provider_id, a.location_id, a.service_id, a.questionnaire_id,
        COALESCE(a.assessment_version, q.version_type, 'initial') AS assessment_version,
        a.status, a.assigned_date, a.created_by,
        a.submitted_at, a.compliance_pct, a.semaforo_color,
        a.hallazgos_generated, a.created_at, a.updated_at,
        p.legal_name AS provider_name
      FROM assessments a
      LEFT JOIN questionnaires q ON a.questionnaire_id = q.id
      LEFT JOIN providers p ON a.provider_id = p.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 1;

    if (filters.providerId) {
      query += ` AND a.provider_id = $${paramCount}`;
      params.push(filters.providerId);
      paramCount++;
    }

    if (filters.serviceId) {
      query += ` AND a.service_id = $${paramCount}`;
      params.push(filters.serviceId);
      paramCount++;
    }

    if (filters.status) {
      query += ` AND a.status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters.startDate) {
      query += ` AND a.started_date >= $${paramCount}`;
      params.push(filters.startDate);
      paramCount++;
    }

    if (filters.endDate) {
      query += ` AND a.started_date <= $${paramCount}`;
      params.push(filters.endDate);
      paramCount++;
    }

    // Get total count before pagination
    const countQuery = query.replace(/SELECT.*FROM/i, 'SELECT COUNT(*) as count FROM');
    const countResult = await this.pool.query(countQuery, params);
    const total = countResult.rows[0]?.count || 0;

    // Add ordering and pagination
    query += ` ORDER BY a.started_date DESC`;

    if (filters.limit) {
      query += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
      paramCount++;
    }

    if (filters.offset) {
      query += ` OFFSET $${paramCount}`;
      params.push(filters.offset);
      paramCount++;
    }

    const result = await this.pool.query(query, params);

    const assessments = result.rows.map((row) => ({
      id: row.id,
      provider_id: row.provider_id,
      provider_name: row.provider_name,
      location_id: row.location_id,
      service_id: row.service_id,
      questionnaire_id: row.questionnaire_id,
      assessment_version: row.assessment_version,
      status: row.status,
      started_date: row.assigned_date,
      submitted_date: row.submitted_at,
      compliance_percent: parseFloat(row.compliance_pct) || 0,
      semaforo: row.semaforo_color,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    return { assessments, total };
  }

  /**
   * Get assessment metrics
   */
  async getMetrics(assessmentId: string): Promise<AssessmentMetrics | null> {
    const query = `
      SELECT
        total_criteria, cumple_count, no_cumple_count, no_aplica_count,
        compliance_percent, semaforo_color, per_standard_metrics
      FROM assessment_metrics
      WHERE assessment_id = $1
    `;

    const result = await this.pool.query(query, [assessmentId]);

    if (result.rows.length === 0) {
      return null;
    }

    const m = result.rows[0];

    return {
      totalCriteria: m.total_criteria,
      cumple: m.cumple_count,
      noCumple: m.no_cumple_count,
      noAplica: m.no_aplica_count,
      compliancePercent: m.compliance_percent,
      semaforo: m.semaforo_color,
      perStandardMetrics: m.per_standard_metrics,
    };
  }

  /**
   * Get provider assessment summary (latest version compliance per service)
   */
  async getProviderSummary(providerId: string): Promise<any[]> {
    const query = `
      SELECT DISTINCT ON (s.id)
        s.id as service_id,
        s.code as service_code,
        s.name as service_name,
        a.status,
        a.compliance_percent,
        a.semaforo_color,
        a.version AS assessment_version,
        a.submitted_date
      FROM assessments a
      JOIN services s ON a.service_id = s.id
      WHERE a.provider_id = $1
      ORDER BY s.id, a.submitted_date DESC
    `;

    const result = await this.pool.query(query, [providerId]);

    return result.rows.map((row) => ({
      serviceId: row.service_id,
      serviceCode: row.service_code,
      serviceName: row.service_name,
      status: row.status,
      compliancePercent: row.compliance_percent,
      semaforo: row.semaforo_color,
      assessmentVersion: row.assessment_version,
      submittedDate: row.submitted_date,
    }));
  }
}
