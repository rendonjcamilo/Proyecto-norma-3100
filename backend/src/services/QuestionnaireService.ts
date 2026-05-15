/**
 * QuestionnaireService
 * Implements Norma 3100 questionnaire management with:
 * - Questionnaire CRUD operations
 * - Template loading (7 transversales + service-specific criteria)
 * - Questionnaire versioning (initial, year4, annual, pre-novelty)
 * - Criteria management (add/edit/remove)
 * - Event sourcing for audit trail
 */

import { Pool, PoolClient } from 'pg';
import { logger } from '../utils/logger.js';

export interface Questionnaire {
  id: string;
  service_id: string;
  version_type: 'initial' | 'year4' | 'annual' | 'pre-novelty';
  name: string;
  status: 'draft' | 'published' | 'archived';
  total_criteria: number;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  published_at?: Date;
}

export interface QuestionnaireDetail extends Questionnaire {
  criteria: Array<{
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
  }>;
}

export interface EvaluationCriterion {
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

export interface ServiceTemplate {
  standards: Array<{
    id: string;
    code: string;
    name: string;
    description: string;
    is_transversal: boolean;
    criteria: EvaluationCriterion[];
  }>;
  total_criteria: number;
  service_id: string;
  service_name: string;
}

export class QuestionnaireService {
  constructor(private pool: Pool) {}

  /**
   * Create a new questionnaire for a service
   */
  async createQuestionnaire(
    serviceId: string | null,
    versionType: 'initial' | 'year4' | 'annual' | 'pre-novelty',
    createdBy: string,
    name?: string
  ): Promise<Questionnaire> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      let serviceName: string;

      if (serviceId) {
        // Verify service exists
        const serviceCheck = await client.query(
          'SELECT id, name FROM services WHERE id = $1',
          [serviceId]
        );
        if (serviceCheck.rows.length === 0) {
          throw new Error(`Service ${serviceId} not found`);
        }
        serviceName = serviceCheck.rows[0].name;
      } else {
        serviceName = 'Maestro';
      }

      const questionnaireTitle = name || `Cuestionario ${serviceName} - ${versionType}`;

      // Check for duplicate questionnaire (same service + version, not archived)
      const dupCheck = await client.query(
        `SELECT id FROM questionnaires
         WHERE version_type = $1 AND status != 'archived'
           AND (service_id = $2 OR (service_id IS NULL AND $2::uuid IS NULL))`,
        [versionType, serviceId]
      );

      if (dupCheck.rows.length > 0) {
        throw new Error(
          `Questionnaire for service ${serviceName} version ${versionType} already exists`
        );
      }

      // Load template criteria for this service
      const criteria = await this.loadTemplateForService(client, serviceId);

      // Create questionnaire
      const questResult = await client.query(
        `INSERT INTO questionnaires
         (name, service_id, version_type, status, created_by, total_criteria)
         VALUES ($1, $2, $3, 'draft', $4, $5)
         RETURNING id, service_id, version_type, name, status, total_criteria, created_by, created_at, updated_at`,
        [questionnaireTitle, serviceId, versionType, createdBy, criteria.length]
      );

      const questionnaire = questResult.rows[0];

      // Link all template criteria to this questionnaire
      for (const criterion of criteria) {
        await client.query(
          `INSERT INTO questionnaire_criteria (questionnaire_id, criterion_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [questionnaire.id, criterion.id]
        );
      }

      await client.query('COMMIT');

      logger.info({
        msg: 'Questionnaire created',
        questionnaire_id: questionnaire.id,
        service_id: serviceId,
        version_type: versionType,
        total_criteria: criteria.length,
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
   * Get questionnaire with all its criteria
   */
  async getQuestionnaire(questionnaireId: string): Promise<QuestionnaireDetail | null> {
    const query = `
      SELECT
        q.id, q.service_id, q.version_type, q.name, q.status,
        q.total_criteria, q.created_by, q.created_at, q.updated_at, q.published_at
      FROM questionnaires q
      WHERE q.id = $1
    `;

    const result = await this.pool.query(query, [questionnaireId]);
    if (result.rows.length === 0) {
      return null;
    }

    const questionnaire = result.rows[0];

    // Get all criteria linked to this questionnaire
    const criteriaQuery = `
      SELECT
        ec.id, ec.code, ec.number, ec.name, ec.description,
        ec.evidence_requirement, ec.complexity, ec.standard_id,
        es.name as standard_name, es.is_transversal, ec.is_mandatory,
        ec.nc_hint, ec.is_section_header, ec.sort_order
      FROM questionnaire_criteria qc
      INNER JOIN evaluation_criteria ec ON qc.criterion_id = ec.id
      INNER JOIN evaluation_standards es ON ec.standard_id = es.id
      WHERE qc.questionnaire_id = $1
      ORDER BY CASE es.code
        WHEN 'TSTH'  THEN 1
        WHEN 'TSINF' THEN 2
        WHEN 'TSDOT' THEN 3
        WHEN 'TSMD'  THEN 4
        WHEN 'TSPP'  THEN 5
        WHEN 'TSHCR' THEN 6
        WHEN 'TSINT' THEN 7
        ELSE 8
      END,
      CASE WHEN es.code ~ '^IDX_NI_' THEN 1 ELSE 0 END,
      es.code,
      COALESCE(ec.sort_order, 9999),
      ec.code
    `;

    const criteriaResult = await this.pool.query(criteriaQuery, [questionnaireId]);

    return {
      ...questionnaire,
      criteria: criteriaResult.rows,
    };
  }

  /**
   * List all questionnaires (optionally filtered)
   */
  async listQuestionnaires(filters?: {
    serviceId?: string;
    status?: string;
    versionType?: string;
  }): Promise<Questionnaire[]> {
    let query = `
      SELECT
        id, service_id, version_type, name, status, total_criteria,
        created_by, created_at, updated_at, published_at
      FROM questionnaires
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.serviceId) {
      query += ` AND service_id = $${paramIndex++}`;
      params.push(filters.serviceId);
    }

    if (filters?.status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters?.versionType) {
      query += ` AND version_type = $${paramIndex++}`;
      params.push(filters.versionType);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  /**
   * Update questionnaire metadata
   */
  async updateQuestionnaire(
    questionnaireId: string,
    updates: Partial<{ name: string; status: string }>,
    updatedBy: string
  ): Promise<Questionnaire> {
    const updateFields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      params.push(updates.name);
    }

    if (updates.status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      params.push(updates.status);
    }

    if (updateFields.length === 0) {
      throw new Error('No updates provided');
    }

    params.push(questionnaireId);

    const query = `
      UPDATE questionnaires
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING id, service_id, version_type, name, status, total_criteria,
                created_by, created_at, updated_at, published_at
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
   * Publish questionnaire (mark as ready for use)
   */
  async publishQuestionnaire(questionnaireId: string, publishedBy: string): Promise<Questionnaire> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Obtener info del cuestionario a publicar
      const infoResult = await client.query(
        'SELECT version_type, service_id FROM questionnaires WHERE id = $1',
        [questionnaireId]
      );
      if (infoResult.rows.length === 0) {
        throw new Error(`Questionnaire ${questionnaireId} not found`);
      }
      const { version_type, service_id } = infoResult.rows[0];

      // Archivar cualquier cuestionario published del mismo version_type y service_id
      await client.query(
        `UPDATE questionnaires
         SET status = 'archived', updated_at = NOW()
         WHERE version_type = $1
           AND status = 'published'
           AND id != $2
           AND (service_id = $3 OR (service_id IS NULL AND $3::uuid IS NULL))`,
        [version_type, questionnaireId, service_id]
      );

      // Publicar el nuevo
      const result = await client.query(
        `UPDATE questionnaires
         SET status = 'published', published_at = NOW(), updated_at = NOW()
         WHERE id = $1
         RETURNING id, service_id, version_type, name, status, total_criteria,
                   created_by, created_at, updated_at, published_at`,
        [questionnaireId]
      );

      await client.query('COMMIT');

      const published = result.rows[0];

      logger.info({
        msg: 'Questionnaire published',
        questionnaire_id: questionnaireId,
        published_by: publishedBy,
      });

      return published;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Soft delete questionnaire (archive it)
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
   * Add a criterion to a questionnaire
   */
  async addCriterionToQuestionnaire(
    questionnaireId: string,
    criterionId: string
  ): Promise<void> {
    // Verify criterion exists
    const criterionCheck = await this.pool.query(
      'SELECT id FROM evaluation_criteria WHERE id = $1',
      [criterionId]
    );

    if (criterionCheck.rows.length === 0) {
      throw new Error(`Criterion ${criterionId} not found`);
    }

    // Add to questionnaire
    await this.pool.query(
      `INSERT INTO questionnaire_criteria (questionnaire_id, criterion_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [questionnaireId, criterionId]
    );

    // Update total criteria count
    const countResult = await this.pool.query(
      `SELECT COUNT(*) as count FROM questionnaire_criteria WHERE questionnaire_id = $1`,
      [questionnaireId]
    );

    const totalCriteria = parseInt(countResult.rows[0].count, 10);

    await this.pool.query(
      'UPDATE questionnaires SET total_criteria = $1, updated_at = NOW() WHERE id = $2',
      [totalCriteria, questionnaireId]
    );

    logger.info({
      msg: 'Criterion added to questionnaire',
      questionnaire_id: questionnaireId,
      criterion_id: criterionId,
    });
  }

  /**
   * Remove a criterion from a questionnaire
   */
  async removeCriterionFromQuestionnaire(
    questionnaireId: string,
    criterionId: string
  ): Promise<void> {
    await this.pool.query(
      `DELETE FROM questionnaire_criteria
       WHERE questionnaire_id = $1 AND criterion_id = $2`,
      [questionnaireId, criterionId]
    );

    // Update total criteria count
    const countResult = await this.pool.query(
      `SELECT COUNT(*) as count FROM questionnaire_criteria WHERE questionnaire_id = $1`,
      [questionnaireId]
    );

    const totalCriteria = parseInt(countResult.rows[0].count, 10);

    await this.pool.query(
      'UPDATE questionnaires SET total_criteria = $1, updated_at = NOW() WHERE id = $2',
      [totalCriteria, questionnaireId]
    );

    logger.info({
      msg: 'Criterion removed from questionnaire',
      questionnaire_id: questionnaireId,
      criterion_id: criterionId,
    });
  }

  /**
   * Get service template: 7 transversales + service-specific criteria
   * Returns all applicable criteria for a service (40-80 criteria)
   */
  async getServiceTemplate(serviceId: string): Promise<ServiceTemplate> {
    // Verify service exists
    const serviceCheck = await this.pool.query(
      'SELECT id, name FROM services WHERE id = $1',
      [serviceId]
    );

    if (serviceCheck.rows.length === 0) {
      throw new Error(`Service ${serviceId} not found`);
    }

    const serviceName = serviceCheck.rows[0].name;

    // Get all standards for this service (transversales + specific)
    const standardsQuery = `
      SELECT DISTINCT
        es.id, es.code, es.name, es.description, es.is_transversal
      FROM evaluation_standards es
      WHERE es.is_transversal = true
         OR es.service_id = $1
      ORDER BY CASE es.code
        WHEN 'TSTH'  THEN 1
        WHEN 'TSINF' THEN 2
        WHEN 'TSDOT' THEN 3
        WHEN 'TSMD'  THEN 4
        WHEN 'TSPP'  THEN 5
        WHEN 'TSHCR' THEN 6
        WHEN 'TSINT' THEN 7
        ELSE 8
      END,
      CASE WHEN es.code ~ '^IDX_NI_' THEN 1 ELSE 0 END,
      es.code
    `;

    const standardsResult = await this.pool.query(standardsQuery, [serviceId]);

    // For each standard, get its criteria
    const standards = await Promise.all(
      standardsResult.rows.map(async (std) => {
        const criteriaQuery = `
          SELECT
            ec.id, ec.code, ec.number, ec.name, ec.description,
            ec.evidence_requirement, ec.complexity, ec.standard_id,
            es.name as standard_name, es.is_transversal, ec.is_mandatory,
            ec.nc_hint, ec.is_section_header, ec.sort_order
          FROM evaluation_criteria ec
          INNER JOIN evaluation_standards es ON ec.standard_id = es.id
          WHERE ec.standard_id = $1 AND ec.service_id = $2 AND ec.status = 'active'
          ORDER BY COALESCE(ec.sort_order, 9999), ec.code
        `;

        const criteriaResult = await this.pool.query(criteriaQuery, [std.id, serviceId]);

        return {
          id: std.id,
          code: std.code,
          name: std.name,
          description: std.description,
          is_transversal: std.is_transversal,
          criteria: criteriaResult.rows,
        };
      })
    );

    // Count total criteria
    const totalCriteria = standards.reduce((sum, std) => sum + std.criteria.length, 0);

    return {
      standards,
      total_criteria: totalCriteria,
      service_id: serviceId,
      service_name: serviceName,
    };
  }

  /**
   * Private helper: Load template criteria for a service from database
   */
  private async loadTemplateForService(client: PoolClient, serviceId: string | null): Promise<any[]> {
    let query: string;
    let params: any[];

    if (serviceId) {
      // Cuestionario de servicio: transversales + criterios específicos del servicio
      query = `
        SELECT DISTINCT ec.id
        FROM evaluation_criteria ec
        INNER JOIN evaluation_standards es ON ec.standard_id = es.id
        WHERE (es.is_transversal = true OR ec.service_id = $1)
          AND ec.status = 'active'
        ORDER BY ec.id
      `;
      params = [serviceId];
    } else {
      // Cuestionario maestro: solo los 512 criterios transversales
      query = `
        SELECT ec.id
        FROM evaluation_criteria ec
        INNER JOIN evaluation_standards es ON ec.standard_id = es.id
        WHERE es.is_transversal = true AND ec.status = 'active'
        ORDER BY ec.id
      `;
      params = [];
    }

    const result = await client.query(query, params);
    return result.rows;
  }

  /**
   * Get questionnaire versions for a service
   */
  async getQuestionnaireVersions(serviceId: string): Promise<Questionnaire[]> {
    const query = `
      SELECT
        id, service_id, version_type, name, status, total_criteria,
        created_by, created_at, updated_at, published_at
      FROM questionnaires
      WHERE service_id = $1
      ORDER BY version_type, created_at DESC
    `;

    const result = await this.pool.query(query, [serviceId]);
    return result.rows;
  }

  /**
   * Create a new version of questionnaire (copy from existing)
   */
  async createVersionFromExisting(
    sourceQuestionnaireId: string,
    newVersionType: 'initial' | 'year4' | 'annual' | 'pre-novelty',
    createdBy: string
  ): Promise<Questionnaire> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Get source questionnaire
      const sourceQuery = await client.query(
        `SELECT id, service_id, name FROM questionnaires WHERE id = $1`,
        [sourceQuestionnaireId]
      );

      if (sourceQuery.rows.length === 0) {
        throw new Error(`Source questionnaire ${sourceQuestionnaireId} not found`);
      }

      const source = sourceQuery.rows[0];

      // Create new questionnaire
      const newName = `${source.name.split(' - ')[0]} - ${newVersionType}`;

      const newQuestResult = await client.query(
        `INSERT INTO questionnaires
         (name, service_id, version_type, status, created_by, total_criteria)
         SELECT $1, service_id, $2, 'draft', $3, total_criteria
         FROM questionnaires
         WHERE id = $4
         RETURNING id, service_id, version_type, name, status, total_criteria, created_by, created_at, updated_at`,
        [newName, newVersionType, createdBy, sourceQuestionnaireId]
      );

      const newQuestionnaire = newQuestResult.rows[0];

      // Copy all criteria from source
      await client.query(
        `INSERT INTO questionnaire_criteria (questionnaire_id, criterion_id)
         SELECT $1, criterion_id FROM questionnaire_criteria WHERE questionnaire_id = $2`,
        [newQuestionnaire.id, sourceQuestionnaireId]
      );

      await client.query('COMMIT');

      logger.info({
        msg: 'Questionnaire version created from existing',
        source_id: sourceQuestionnaireId,
        new_id: newQuestionnaire.id,
        version_type: newVersionType,
      });

      return newQuestionnaire;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
