/**
 * EvaluationService
 * Implements Norma 3100 assessment questionnaire builder with:
 * - 7 estándares transversales (applicable to all services)
 * - N estándares específicos per service (5-25 per service)
 * - Questionnaire versioning (initial, year4, annual, pre-novelty)
 * - Conditional logic for criteria
 * - Risk scoring and compliance calculation
 */

import { Pool } from 'pg';
import { logger } from '../utils/logger.js';

export interface EvaluationStandard {
  id: string;
  code: string;
  name: string;
  description: string;
  is_transversal: boolean;
  service_id?: string;
  category: string;
  created_at: Date;
}

export interface EvaluationCriterion {
  id: string;
  code: string;
  number: string;
  name: string;
  description: string;
  evidence_requirement: string;
  complexity: 'simple' | 'medium' | 'complex';
  standard_id: string;
  service_id: string;
  is_mandatory: boolean;
  created_at: Date;
}

export interface Questionnaire {
  id: string;
  name: string;
  service_id: string;
  version: 'initial' | 'year4' | 'annual' | 'pre-novelty';
  status: 'draft' | 'published' | 'archived';
  total_criteria: number;
  created_by: string;
  created_at: Date;
  published_at?: Date;
}

export interface QuestionnaireDetail extends Questionnaire {
  standards: Array<{
    id: string;
    code: string;
    name: string;
    description: string;
    is_transversal: boolean;
    criteria: EvaluationCriterion[];
  }>;
}

export interface ConditionalLogic {
  id: string;
  criterion_id: string;
  dependent_criterion_id: string;
  condition_type: 'if_not_compliant' | 'if_compliant';
  description: string;
}

export interface AssessmentResponse {
  id: string;
  assessment_id: string;
  criterion_id: string;
  value: 'C' | 'NC' | 'NA'; // Compliant, Non-compliant, Not Applicable
  notes?: string;
  evidence_references?: string[];
  answered_by: string;
  answered_at: Date;
}

export class EvaluationService {
  constructor(private pool: Pool) {}

  /**
   * Load all criteria for a service
   * Returns 40-80 criteria: 7 transversales + service-specific
   */
  async loadCriteria(serviceId: string): Promise<EvaluationCriterion[]> {
    const query = `
      SELECT
        ec.id, ec.code, ec.number, ec.name, ec.description,
        ec.evidence_requirement, ec.complexity, ec.standard_id, ec.service_id,
        ec.is_mandatory, ec.created_at
      FROM evaluation_criteria ec
      WHERE ec.service_id = $1
      ORDER BY ec.code
    `;

    const result = await this.pool.query(query, [serviceId]);
    return result.rows;
  }

  /**
   * Create a questionnaire snapshot with all applicable criteria
   * version: initial | year4 | annual | pre-novelty
   */
  async createQuestionnaire(
    serviceId: string,
    version: 'initial' | 'year4' | 'annual' | 'pre-novelty',
    createdBy: string
  ): Promise<Questionnaire> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Verify service exists
      const serviceCheck = await client.query(
        'SELECT id, name FROM services WHERE id = $1',
        [serviceId]
      );

      if (serviceCheck.rows.length === 0) {
        throw new Error(`Service ${serviceId} not found`);
      }

      const serviceName = serviceCheck.rows[0].name;

      // Check for duplicate questionnaire (same service + version)
      const dupCheck = await client.query(
        'SELECT id FROM questionnaires WHERE service_id = $1 AND version_type = $2 AND status != $3',
        [serviceId, version, 'archived']
      );

      if (dupCheck.rows.length > 0) {
        throw new Error(
          `Questionnaire for service ${serviceName} version ${version} already exists`
        );
      }

      // Create questionnaire record
      const questResult = await client.query(
        `INSERT INTO questionnaires
         (name, service_id, version_type, status, created_by, total_criteria)
         VALUES ($1, $2, $3, $4, $5, 0)
         RETURNING id, name, service_id, version_type as version, status, total_criteria, created_by, created_at`,
        [
          `${serviceName} - ${version} Assessment`,
          serviceId,
          version,
          'published',
          createdBy,
        ]
      );

      const questionnaire = questResult.rows[0];

      // Load all criteria for this service (7 transversales + specific)
      const criteria = await client.query(
        `SELECT id FROM evaluation_criteria
         WHERE service_id = $1
         ORDER BY code`,
        [serviceId]
      );

      // Link criteria to questionnaire
      for (const criterion of criteria.rows) {
        await client.query(
          `INSERT INTO questionnaire_criteria
           (questionnaire_id, criterion_id)
           VALUES ($1, $2)`,
          [questionnaire.id, criterion.id]
        );
      }

      // Update total criteria count
      await client.query(
        'UPDATE questionnaires SET total_criteria = $1, published_at = NOW() WHERE id = $2',
        [criteria.rows.length, questionnaire.id]
      );

      questionnaire.total_criteria = criteria.rows.length;
      questionnaire.published_at = new Date();

      await client.query('COMMIT');

      logger.info({
        msg: 'Questionnaire created',
        questionnaire_id: questionnaire.id,
        service_id: serviceId,
        version,
        total_criteria: criteria.rows.length,
      });

      return questionnaire;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get full questionnaire with all criteria and standards
   */
  async getQuestionnaire(questionnaireId: string): Promise<QuestionnaireDetail | null> {
    const query = `
      SELECT
        q.id, q.name, q.service_id, q.version_type as version, q.status,
        q.total_criteria, q.created_by, q.created_at, q.published_at
      FROM questionnaires q
      WHERE q.id = $1
    `;

    const result = await this.pool.query(query, [questionnaireId]);
    if (result.rows.length === 0) {
      return null;
    }

    const questionnaire = result.rows[0];

    // Get all standards for the service
    const standardsQuery = `
      SELECT DISTINCT
        es.id, es.code, es.name, es.description, es.is_transversal
      FROM evaluation_standards es
      WHERE es.service_id = $1 OR es.is_transversal = true
      ORDER BY es.is_transversal DESC, es.code
    `;

    const standardsResult = await this.pool.query(standardsQuery, [
      questionnaire.service_id,
    ]);

    // For each standard, get its criteria
    const standards = await Promise.all(
      standardsResult.rows.map(async (std) => {
        const criteriaQuery = `
          SELECT
            ec.id, ec.code, ec.number, ec.name, ec.description,
            ec.evidence_requirement, ec.complexity, ec.standard_id, ec.service_id,
            ec.is_mandatory, ec.created_at
          FROM evaluation_criteria ec
          WHERE ec.standard_id = $1 AND ec.service_id = $2
          ORDER BY ec.number
        `;

        const criteriaResult = await this.pool.query(criteriaQuery, [
          std.id,
          questionnaire.service_id,
        ]);

        return {
          ...std,
          criteria: criteriaResult.rows,
        };
      })
    );

    return {
      ...questionnaire,
      standards,
    };
  }

  /**
   * Get all questionnaires for a service (all versions)
   */
  async getQuestionnairesByService(serviceId: string): Promise<Questionnaire[]> {
    const query = `
      SELECT
        id, name, service_id, version_type as version, status,
        total_criteria, created_by, created_at, published_at
      FROM questionnaires
      WHERE service_id = $1
      ORDER BY version_type, created_at DESC
    `;

    const result = await this.pool.query(query, [serviceId]);
    return result.rows;
  }

  /**
   * Resolve conditional logic for a criterion
   * Returns dependent criteria that should be shown if this criterion is marked as NC
   */
  async resolveConditionalLogic(
    criterionId: string,
    status: 'C' | 'NC' | 'NA'
  ): Promise<EvaluationCriterion[]> {
    if (status !== 'NC') {
      return [];
    }

    const query = `
      SELECT DISTINCT
        ec.id, ec.code, ec.number, ec.name, ec.description,
        ec.evidence_requirement, ec.complexity, ec.standard_id, ec.service_id,
        ec.is_mandatory, ec.created_at
      FROM evaluation_criteria ec
      INNER JOIN criteria_conditional_logic ccl
        ON ec.id = ccl.dependent_criterion_id
      WHERE ccl.criterion_id = $1 AND ccl.condition_type = 'if_not_compliant'
    `;

    const result = await this.pool.query(query, [criterionId]);
    return result.rows;
  }

  /**
   * Update questionnaire (admin only, creates new version)
   */
  async updateQuestionnaire(
    questionnaireId: string,
    updates: Partial<Questionnaire>,
    updatedBy: string
  ): Promise<Questionnaire> {
    const updateFields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (updates.status) {
      updateFields.push(`status = $${paramIndex++}`);
      params.push(updates.status);
    }

    if (updates.name) {
      updateFields.push(`name = $${paramIndex++}`);
      params.push(updates.name);
    }

    params.push(questionnaireId);

    const query = `
      UPDATE questionnaires
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING id, name, service_id, version_type as version, status,
                total_criteria, created_by, created_at, published_at
    `;

    const result = await this.pool.query(query, params);

    if (result.rows.length === 0) {
      throw new Error(`Questionnaire ${questionnaireId} not found`);
    }

    logger.info({
      msg: 'Questionnaire updated',
      questionnaire_id: questionnaireId,
      updated_by: updatedBy,
    });

    return result.rows[0];
  }

  /**
   * Soft delete questionnaire (archive)
   */
  async deleteQuestionnaire(questionnaireId: string): Promise<void> {
    const query = `
      UPDATE questionnaires
      SET status = 'archived', updated_at = NOW()
      WHERE id = $1
    `;

    await this.pool.query(query, [questionnaireId]);

    logger.info({
      msg: 'Questionnaire archived',
      questionnaire_id: questionnaireId,
    });
  }

  /**
   * List all criteria for a service with standard hierarchy
   */
  async listCriteriaByStandard(
    serviceId: string
  ): Promise<
    Array<{
      standard: EvaluationStandard;
      criteria: EvaluationCriterion[];
    }>
  > {
    // Get all standards for service (7 transversales + specific)
    const standardsQuery = `
      SELECT DISTINCT
        es.id, es.code, es.name, es.description, es.is_transversal, es.service_id,
        es.category, es.created_at
      FROM evaluation_standards es
      WHERE es.service_id = $1 OR es.is_transversal = true
      ORDER BY es.is_transversal DESC, es.code
    `;

    const standardsResult = await this.pool.query(standardsQuery, [serviceId]);

    // For each standard, get criteria
    const result = await Promise.all(
      standardsResult.rows.map(async (standard) => {
        const criteriaQuery = `
          SELECT
            id, code, number, name, description, evidence_requirement,
            complexity, standard_id, service_id, is_mandatory, created_at
          FROM evaluation_criteria
          WHERE standard_id = $1 AND service_id = $2
          ORDER BY number
        `;

        const criteriaResult = await this.pool.query(criteriaQuery, [
          standard.id,
          serviceId,
        ]);

        return {
          standard,
          criteria: criteriaResult.rows,
        };
      })
    );

    return result;
  }

  /**
   * Calculate compliance percentage from responses
   * Compliance % = (C / (C + NC)) * 100
   */
  calculateCompliance(responses: AssessmentResponse[]): number {
    const compliant = responses.filter((r) => r.value === 'C').length;
    const nonCompliant = responses.filter((r) => r.value === 'NC').length;

    if (compliant + nonCompliant === 0) {
      return 0;
    }

    return Math.round((compliant / (compliant + nonCompliant)) * 100);
  }

  /**
   * Get semáforo status based on compliance percentage
   * Verde: ≥80%, Naranja: 50-79%, Rojo: <50%
   */
  getSemaforoStatus(compliancePct: number): 'verde' | 'naranja' | 'rojo' {
    if (compliancePct >= 80) return 'verde';
    if (compliancePct >= 50) return 'naranja';
    return 'rojo';
  }
}
