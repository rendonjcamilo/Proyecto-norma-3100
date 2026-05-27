/**
 * Finding & Corrective Action Management Service
 * Handles findings lifecycle, status workflows, and corrective action planning
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

// ============================================================
// INTERFACES
// ============================================================

export interface Finding {
  id: string;
  provider_id: string;
  location_id?: string;
  assessment_id?: string;
  assessment_response_id?: string;
  criterion_id: string;
  service_id?: string;
  standard_id?: string;
  finding_number: string;
  title: string;
  description: string;
  severity: 'crítica' | 'alta' | 'media' | 'baja' | 'pendiente';
  status: 'abierta' | 'en_revision' | 'asignada' | 'en_progreso' | 'cerrada';
  risk_score: number;
  assigned_to?: string;
  created_date: Date;
  created_by?: string;
  closed_date?: Date;
  closed_by?: string;
}

export interface CorrectiveAction {
  id: string;
  finding_id: string;
  title: string;
  description: string;
  responsible_user_id?: string;
  assigned_to?: string;
  start_date?: Date;
  deadline: Date;
  due_date?: Date;
  priority: 'crítica' | 'alta' | 'media' | 'baja';
  status: 'abierta' | 'en_progreso' | 'cerrada';
  completion_percentage: number;
  created_date: Date;
  created_by?: string;
}

export interface ActionFollowup {
  id: string;
  action_id: string;
  step_number: number;
  step_name: 'Planificación' | 'Diseño' | 'Implementación' | 'Pruebas' | 'Validación' | 'Cierre';
  description?: string;
  status: 'pendiente' | 'en_progreso' | 'completado';
  due_date?: Date;
  completion_percentage: number;
  evidence_attachment?: string;
  completed_date?: Date;
  completed_by?: string;
  comments?: string;
  created_at: Date;
  updated_at: Date;
}

export interface FindingEvent {
  id: string;
  finding_id: string;
  event_type: string;
  data: Record<string, any>;
  user_id?: string;
  created_at: Date;
}

// ============================================================
// FINDING SERVICE
// ============================================================

export class FindingService {
  constructor(private pool: Pool) {}

  // ===== FINDING CRUD =====

  /**
   * Create a finding (typically from assessment)
   */
  async createFinding(
    data: Partial<Finding> & {
      provider_id: string;
      criterion_id: string;
      title: string;
      description: string;
      created_by?: string;
    }
  ): Promise<Finding> {
    const id = uuidv4();
    const finding_number = `HALL-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const query = `
      INSERT INTO findings (
        id, provider_id, location_id, assessment_id, assessment_response_id,
        criterion_id, service_id, standard_id,
        finding_number, title, description,
        severity, status, risk_score,
        created_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP)
      RETURNING *;
    `;

    const values = [
      id,
      data.provider_id,
      data.location_id || null,
      data.assessment_id || null,
      data.assessment_response_id || null,
      data.criterion_id,
      data.service_id || null,
      data.standard_id || null,
      finding_number,
      data.title,
      data.description,
      data.severity || 'pendiente',
      data.status || 'abierta',
      data.risk_score || 0,
      data.created_by || null,
    ];

    try {
      const result = await this.pool.query(query, values);
      logger.info({
        msg: 'Finding created',
        finding_id: id,
        provider_id: data.provider_id,
      });
      return this.formatFinding(result.rows[0]);
    } catch (err) {
      logger.error({
        msg: 'Error creating finding',
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  /**
   * Get finding by ID with related actions
   */
  async getFindingById(id: string): Promise<Finding | null> {
    const query = `SELECT * FROM findings WHERE id = $1;`;

    try {
      const result = await this.pool.query(query, [id]);
      return result.rows.length > 0 ? this.formatFinding(result.rows[0]) : null;
    } catch (err) {
      logger.error({ msg: 'Error fetching finding', error: err instanceof Error ? err.message : String(err) });
      throw err;
    }
  }

  /**
   * List findings with filters
   */
  async listFindings(filters: {
    status?: string;
    severity?: string;
    service_id?: string;
    provider_id?: string;
    standard_id?: string;
    assigned_to?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ findings: Finding[]; total: number }> {
    let query = 'SELECT * FROM findings WHERE 1=1';
    const values: any[] = [];
    let paramCount = 1;

    if (filters.status) {
      query += ` AND status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    if (filters.severity) {
      query += ` AND severity = $${paramCount}`;
      values.push(filters.severity);
      paramCount++;
    }

    if (filters.service_id) {
      query += ` AND service_id = $${paramCount}`;
      values.push(filters.service_id);
      paramCount++;
    }

    if (filters.provider_id) {
      query += ` AND provider_id = $${paramCount}`;
      values.push(filters.provider_id);
      paramCount++;
    }

    if (filters.standard_id) {
      query += ` AND standard_id = $${paramCount}`;
      values.push(filters.standard_id);
      paramCount++;
    }

    if (filters.assigned_to) {
      query += ` AND assigned_to = $${paramCount}`;
      values.push(filters.assigned_to);
      paramCount++;
    }

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
    const countResult = await this.pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count, 10);

    // Add ordering and pagination
    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ` LIMIT $${paramCount}`;
      values.push(filters.limit);
      paramCount++;
    }

    if (filters.offset) {
      query += ` OFFSET $${paramCount}`;
      values.push(filters.offset);
      paramCount++;
    }

    try {
      const result = await this.pool.query(query, values);
      return {
        findings: result.rows.map((row) => this.formatFinding(row)),
        total,
      };
    } catch (err) {
      logger.error({ msg: 'Error listing findings', error: err instanceof Error ? err.message : String(err) });
      throw err;
    }
  }

  /**
   * Update finding status and/or assignment
   */
  async updateFinding(
    id: string,
    updates: {
      status?: string;
      severity?: string;
      risk_score?: number;
      assigned_to?: string;
      updated_by?: string;
    }
  ): Promise<Finding> {
    let query = 'UPDATE findings SET ';
    const values: any[] = [];
    let paramCount = 1;

    if (updates.status !== undefined) {
      query += `status = $${paramCount}, `;
      values.push(updates.status);
      paramCount++;
    }

    if (updates.severity !== undefined) {
      query += `severity = $${paramCount}, `;
      values.push(updates.severity);
      paramCount++;
    }

    if (updates.risk_score !== undefined) {
      query += `risk_score = $${paramCount}, `;
      values.push(updates.risk_score);
      paramCount++;
    }

    if (updates.assigned_to !== undefined) {
      query += `assigned_to = $${paramCount}, `;
      values.push(updates.assigned_to);
      paramCount++;
    }

    query += `updated_at = CURRENT_TIMESTAMP, updated_by = $${paramCount}`;
    values.push(updates.updated_by || null);
    paramCount++;

    query += ` WHERE id = $${paramCount} RETURNING *;`;
    values.push(id);

    try {
      const result = await this.pool.query(query, values);
      if (result.rows.length === 0) {
        throw new Error('Finding not found');
      }
      logger.info({ msg: 'Finding updated', finding_id: id });
      return this.formatFinding(result.rows[0]);
    } catch (err) {
      logger.error({ msg: 'Error updating finding', error: err instanceof Error ? err.message : String(err) });
      throw err;
    }
  }

  /**
   * Assign finding to responsible person
   */
  async assignFinding(
    id: string,
    assignedTo: string,
    assignedBy?: string
  ): Promise<Finding> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Update finding
      const query = `
        UPDATE findings
        SET assigned_to = $1, status = 'asignada', updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *;
      `;

      const result = await client.query(query, [assignedTo, id]);

      if (result.rows.length === 0) {
        throw new Error('Finding not found');
      }

      // Record assignment
      const assignmentId = uuidv4();
      await client.query(
        `INSERT INTO finding_assignments (id, finding_id, assigned_to_user_id, assigned_by_user_id, is_current)
         VALUES ($1, $2, $3, $4, TRUE)`,
        [assignmentId, id, assignedTo, assignedBy || null]
      );

      // Emit event
      await this.createFindingEvent(id, 'finding.assigned', { assigned_to: assignedTo }, assignedBy, client);

      await client.query('COMMIT');
      logger.info({ msg: 'Finding assigned', finding_id: id, assigned_to: assignedTo });
      return this.formatFinding(result.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error({ msg: 'Error assigning finding', error: err instanceof Error ? err.message : String(err) });
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Auto-close finding when all actions are complete
   */
  async tryCloseFinding(findingId: string, closedBy?: string): Promise<Finding | null> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Check if all actions for this finding are closed
      const actionsCheck = await client.query(
        `SELECT COUNT(*) as total, COUNT(CASE WHEN status = 'cerrada' THEN 1 END) as closed
         FROM corrective_actions WHERE finding_id = $1 AND status != 'cerrada'`,
        [findingId]
      );

      const { total, closed } = actionsCheck.rows[0];

      if (total === '0' || parseInt(total, 10) === parseInt(closed, 10)) {
        // All actions are closed, close the finding
        const query = `
          UPDATE findings
          SET status = 'cerrada', closed_date = CURRENT_TIMESTAMP, closed_by = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING *;
        `;

        const result = await client.query(query, [closedBy || null, findingId]);

        if (result.rows.length > 0) {
          // Record closure
          await client.query(
            `INSERT INTO finding_closures (id, finding_id, closed_by, actions_closed_count)
             VALUES ($1, $2, $3, $4)`,
            [uuidv4(), findingId, closedBy || null, parseInt(closed, 10)]
          );

          // Emit event
          await this.createFindingEvent(findingId, 'finding.closed', { closed_by: closedBy }, closedBy);

          await client.query('COMMIT');
          logger.info({ msg: 'Finding closed', finding_id: findingId });
          return this.formatFinding(result.rows[0]);
        }
      }

      await client.query('COMMIT');
      return null;
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error({ msg: 'Error closing finding', error: err instanceof Error ? err.message : String(err) });
      throw err;
    } finally {
      client.release();
    }
  }

  // ===== CORRECTIVE ACTIONS =====

  /**
   * Create corrective action for finding
   */
  async createCorrectiveAction(data: {
    finding_id: string;
    title: string;
    description: string;
    responsible_user_id?: string;
    deadline: Date;
    priority?: 'crítica' | 'alta' | 'media' | 'baja';
    created_by?: string;
  }): Promise<CorrectiveAction> {
    const id = uuidv4();

    const query = `
      INSERT INTO corrective_actions (
        id, finding_id, action_number, title, description,
        responsible_user_id, assigned_to, due_date, deadline: deadline,
        priority, status, completion_percentage,
        created_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $7, $8, 'abierta', 0, $9, CURRENT_TIMESTAMP)
      RETURNING *;
    `;

    // Generate action number
    const actionNumber = `ACC-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const values = [
      id,
      data.finding_id,
      actionNumber,
      data.title,
      data.description,
      data.responsible_user_id || null,
      data.deadline,
      data.priority || 'media',
      data.created_by || null,
    ];

    try {
      const result = await this.pool.query(query, values);
      logger.info({
        msg: 'Corrective action created',
        action_id: id,
        finding_id: data.finding_id,
      });
      return this.formatAction(result.rows[0]);
    } catch (err) {
      logger.error({
        msg: 'Error creating corrective action',
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  /**
   * Get corrective action by ID
   */
  async getCorrectiveActionById(id: string): Promise<CorrectiveAction | null> {
    const query = `SELECT * FROM corrective_actions WHERE id = $1;`;

    try {
      const result = await this.pool.query(query, [id]);
      return result.rows.length > 0 ? this.formatAction(result.rows[0]) : null;
    } catch (err) {
      logger.error({ msg: 'Error fetching action', error: err instanceof Error ? err.message : String(err) });
      throw err;
    }
  }

  /**
   * Get all actions for a finding
   */
  async getActionsForFinding(findingId: string): Promise<CorrectiveAction[]> {
    const query = `SELECT * FROM corrective_actions WHERE finding_id = $1 ORDER BY created_at DESC;`;

    try {
      const result = await this.pool.query(query, [findingId]);
      return result.rows.map((row) => this.formatAction(row));
    } catch (err) {
      logger.error({
        msg: 'Error fetching actions for finding',
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  /**
   * Update corrective action
   */
  async updateCorrectiveAction(
    id: string,
    updates: {
      title?: string;
      description?: string;
      responsible_user_id?: string;
      deadline?: Date;
      priority?: string;
      status?: string;
      completion_percentage?: number;
      updated_by?: string;
    }
  ): Promise<CorrectiveAction> {
    let query = 'UPDATE corrective_actions SET ';
    const values: any[] = [];
    let paramCount = 1;

    if (updates.title !== undefined) {
      query += `title = $${paramCount}, `;
      values.push(updates.title);
      paramCount++;
    }

    if (updates.description !== undefined) {
      query += `description = $${paramCount}, `;
      values.push(updates.description);
      paramCount++;
    }

    if (updates.responsible_user_id !== undefined) {
      query += `responsible_user_id = $${paramCount}, `;
      values.push(updates.responsible_user_id);
      paramCount++;
    }

    if (updates.deadline !== undefined) {
      query += `due_date = $${paramCount}, `;
      values.push(updates.deadline);
      paramCount++;
    }

    if (updates.priority !== undefined) {
      query += `priority = $${paramCount}, `;
      values.push(updates.priority);
      paramCount++;
    }

    if (updates.status !== undefined) {
      query += `status = $${paramCount}, `;
      values.push(updates.status);
      paramCount++;
    }

    if (updates.completion_percentage !== undefined) {
      query += `completion_percentage = $${paramCount}, `;
      values.push(updates.completion_percentage);
      paramCount++;
    }

    query += `updated_at = CURRENT_TIMESTAMP, updated_by = $${paramCount}`;
    values.push(updates.updated_by || null);
    paramCount++;

    query += ` WHERE id = $${paramCount} RETURNING *;`;
    values.push(id);

    try {
      const result = await this.pool.query(query, values);
      if (result.rows.length === 0) {
        throw new Error('Action not found');
      }
      logger.info({ msg: 'Action updated', action_id: id });
      return this.formatAction(result.rows[0]);
    } catch (err) {
      logger.error({ msg: 'Error updating action', error: err instanceof Error ? err.message : String(err) });
      throw err;
    }
  }

  // ===== ACTION FOLLOW-UPS =====

  /**
   * Create or update action follow-up step
   */
  async upsertFollowup(data: {
    action_id: string;
    step_number: number;
    step_name: string;
    description?: string;
    due_date?: Date;
    completion_percentage?: number;
    evidence_attachment?: string;
    comments?: string;
    status?: string;
    completed_by?: string;
  }): Promise<ActionFollowup> {
    const id = uuidv4();
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Try to insert, if exists update
      const query = `
        INSERT INTO action_followups (
          id, action_id, step_number, step_name, description,
          due_date, completion_percentage, evidence_attachment,
          comments, status, completed_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (action_id, step_number) DO UPDATE SET
          description = COALESCE($5, action_followups.description),
          due_date = COALESCE($6, action_followups.due_date),
          completion_percentage = COALESCE($7, action_followups.completion_percentage),
          evidence_attachment = COALESCE($8, action_followups.evidence_attachment),
          comments = COALESCE($9, action_followups.comments),
          status = COALESCE($10, action_followups.status),
          completed_by = COALESCE($11, action_followups.completed_by),
          updated_at = CURRENT_TIMESTAMP
        RETURNING *;
      `;

      const values = [
        id,
        data.action_id,
        data.step_number,
        data.step_name,
        data.description || null,
        data.due_date || null,
        data.completion_percentage || 0,
        data.evidence_attachment || null,
        data.comments || null,
        data.status || 'pendiente',
        data.completed_by || null,
      ];

      const result = await client.query(query, values);

      // Auto-update action completion percentage if all followups completed
      await this.updateActionCompletionPercentage(data.action_id, client);

      // Emit event if step completed
      if (data.status === 'completado') {
        await this.createFindingEvent(
          null,
          'followup.completed',
          {
            action_id: data.action_id,
            step_number: data.step_number,
            completion_percentage: data.completion_percentage,
          },
          data.completed_by
        );
      }

      await client.query('COMMIT');
      logger.info({
        msg: 'Follow-up updated',
        action_id: data.action_id,
        step_number: data.step_number,
      });
      return this.formatFollowup(result.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error({
        msg: 'Error updating follow-up',
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Get all follow-ups for action
   */
  async getFollowupsForAction(actionId: string): Promise<ActionFollowup[]> {
    const query = `SELECT * FROM action_followups WHERE action_id = $1 ORDER BY step_number ASC;`;

    try {
      const result = await this.pool.query(query, [actionId]);
      return result.rows.map((row) => this.formatFollowup(row));
    } catch (err) {
      logger.error({
        msg: 'Error fetching follow-ups',
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  /**
   * Update action completion percentage based on follow-ups
   */
  private async updateActionCompletionPercentage(
    actionId: string,
    client?: any
  ): Promise<void> {
    const queryClient = client || this.pool;

    try {
      const result = await queryClient.query(
        `SELECT AVG(completion_percentage) as avg_completion FROM action_followups WHERE action_id = $1`,
        [actionId]
      );

      const avgCompletion = result.rows[0]?.avg_completion || 0;

      await queryClient.query(
        `UPDATE corrective_actions SET completion_percentage = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [Math.round(avgCompletion), actionId]
      );

      // If completion is 100%, auto-close action
      if (Math.round(avgCompletion) === 100) {
        await queryClient.query(
          `UPDATE corrective_actions SET status = 'cerrada', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [actionId]
        );
      }
    } catch (err) {
      logger.error({
        msg: 'Error updating action completion',
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // ===== EVENT SOURCING =====

  /**
   * Create a finding event
   */
  async createFindingEvent(
    findingId: string | null,
    eventType: string,
    data: Record<string, any>,
    userId?: string,
    client?: any
  ): Promise<FindingEvent> {
    const queryClient = client || this.pool;
    const id = uuidv4();

    const query = `
      INSERT INTO finding_events (id, finding_id, event_type, data, user_id, created_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      RETURNING *;
    `;

    const values = [id, findingId || null, eventType, JSON.stringify(data), userId || null];

    try {
      const result = await queryClient.query(query, values);
      return this.formatEvent(result.rows[0]);
    } catch (err) {
      logger.error({
        msg: 'Error creating finding event',
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  /**
   * Get events for finding
   */
  async getFindingEvents(findingId: string): Promise<FindingEvent[]> {
    const query = `
      SELECT * FROM finding_events
      WHERE finding_id = $1
      ORDER BY created_at DESC;
    `;

    try {
      const result = await this.pool.query(query, [findingId]);
      return result.rows.map((row) => this.formatEvent(row));
    } catch (err) {
      logger.error({
        msg: 'Error fetching events',
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  // ===== STATISTICS & REPORTING =====

  /**
   * Get findings summary statistics
   */
  async getFindingsSummary(): Promise<Record<string, any>> {
    const query = `
      SELECT
        COUNT(*) as total_findings,
        COUNT(CASE WHEN status = 'abierta' THEN 1 END) as open_findings,
        COUNT(CASE WHEN status = 'en_progreso' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'cerrada' THEN 1 END) as closed,
        COUNT(CASE WHEN assigned_to IS NOT NULL THEN 1 END) as assigned,
        AVG(CAST(risk_score AS DECIMAL)) as avg_risk_score
      FROM findings;
    `;

    try {
      const result = await this.pool.query(query);
      return result.rows[0] || {};
    } catch (err) {
      logger.error({
        msg: 'Error getting findings summary',
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  /**
   * Get actions dashboard
   */
  async getActionsDashboard(): Promise<Record<string, any>> {
    const query = `
      SELECT
        COUNT(*) as total_actions,
        COUNT(CASE WHEN status = 'abierta' THEN 1 END) as open_actions,
        COUNT(CASE WHEN status = 'en_progreso' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'cerrada' THEN 1 END) as closed_actions,
        COUNT(CASE WHEN due_date < CURRENT_TIMESTAMP AND status != 'cerrada' THEN 1 END) as overdue_actions,
        AVG(CAST(completion_percentage AS DECIMAL)) as avg_completion,
        MAX(due_date) as latest_deadline
      FROM corrective_actions;
    `;

    try {
      const result = await this.pool.query(query);
      return result.rows[0] || {};
    } catch (err) {
      logger.error({
        msg: 'Error getting actions dashboard',
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  // ===== FORMATTERS =====

  private formatFinding(row: any): Finding {
    return {
      id: row.id,
      provider_id: row.provider_id,
      location_id: row.location_id,
      assessment_id: row.assessment_id,
      assessment_response_id: row.assessment_response_id,
      criterion_id: row.criterion_id,
      service_id: row.service_id,
      standard_id: row.standard_id,
      finding_number: row.finding_number,
      title: row.title,
      description: row.description,
      severity: row.severity,
      status: row.status,
      risk_score: row.risk_score,
      assigned_to: row.assigned_to,
      created_date: row.created_at,
      created_by: row.created_by,
      closed_date: row.closed_date,
      closed_by: row.closed_by,
    };
  }

  private formatAction(row: any): CorrectiveAction {
    return {
      id: row.id,
      finding_id: row.finding_id,
      title: row.title,
      description: row.description,
      responsible_user_id: row.responsible_user_id,
      assigned_to: row.assigned_to,
      start_date: row.start_date,
      deadline: row.due_date || row.deadline,
      due_date: row.due_date,
      priority: row.priority,
      status: row.status,
      completion_percentage: row.completion_percentage,
      created_date: row.created_at,
      created_by: row.created_by,
    };
  }

  private formatFollowup(row: any): ActionFollowup {
    return {
      id: row.id,
      action_id: row.action_id,
      step_number: row.step_number,
      step_name: row.step_name,
      description: row.description,
      status: row.status,
      due_date: row.due_date,
      completion_percentage: row.completion_percentage,
      evidence_attachment: row.evidence_attachment,
      completed_date: row.completed_date,
      completed_by: row.completed_by,
      comments: row.comments,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private formatEvent(row: any): FindingEvent {
    return {
      id: row.id,
      finding_id: row.finding_id,
      event_type: row.event_type,
      data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
      user_id: row.user_id,
      created_at: row.created_at,
    };
  }
}
