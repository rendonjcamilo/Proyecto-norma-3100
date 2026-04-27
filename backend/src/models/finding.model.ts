/**
 * Finding & Corrective Action Data Model
 */

import { Pool } from 'pg';

export interface Finding {
  id: string;
  provider_id: string;
  location_id?: string;
  finding_number: string;
  criterion_id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category_id?: string;
  service_id?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'rejected';
  source: 'audit' | 'assessment' | 'external_report' | 'internal';
  found_date: Date;
  due_date?: Date;
  resolved_date?: Date;
  evidence?: Record<string, any>;
  hallazgo_description?: string;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
}

export interface CorrectiveAction {
  id: string;
  finding_id: string;
  action_number: string;
  title: string;
  description: string;
  assigned_to?: string;
  assigned_date: Date;
  due_date: Date;
  completion_date?: Date;
  status: 'open' | 'in_progress' | 'completed' | 'closed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  evidence?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
}

export interface ActionStatusHistory {
  id: string;
  action_id: string;
  old_status?: string;
  new_status: string;
  changed_by?: string;
  changed_at: Date;
  reason?: string;
  created_at: Date;
}

export interface ActionEvidence {
  id: string;
  action_id: string;
  filename: string;
  file_path: string;
  file_size: number;
  file_type?: string;
  content_hash?: string;
  uploaded_by?: string;
  uploaded_at: Date;
  created_at: Date;
}

export interface ActionComment {
  id: string;
  action_id: string;
  user_id: string;
  content: string;
  mentions?: string[];
  created_at: Date;
  updated_at: Date;
}

export interface EscalationAlert {
  id: string;
  action_id?: string;
  finding_id?: string;
  assessment_id?: string;
  alert_type: 'deadline_warning' | 'overdue' | 'critical';
  days_offset: number;
  created_at: Date;
  triggered_at?: Date;
  acknowledged_at?: Date;
  acknowledged_by?: string;
  is_active: boolean;
}

export class FindingModel {
  constructor(private pool: Pool) {}

  // ===== FINDINGS =====

  async createFinding(
    data: Omit<Finding, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Finding> {
    const query = `
      INSERT INTO findings (
        provider_id, location_id, finding_number, criterion_id, title, description,
        severity, category_id, service_id, status, source, found_date, due_date,
        hallazgo_description, evidence, created_by, updated_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      data.provider_id,
      data.location_id || null,
      data.finding_number,
      data.criterion_id,
      data.title,
      data.description,
      data.severity,
      data.category_id || null,
      data.service_id || null,
      data.status || 'open',
      data.source,
      data.found_date,
      data.due_date || null,
      data.hallazgo_description || null,
      data.evidence ? JSON.stringify(data.evidence) : '{}',
      data.created_by || null,
      data.updated_by || null,
    ]);

    return result.rows[0];
  }

  async getFindings(filters?: {
    provider_id?: string;
    severity?: string;
    status?: string;
    category_id?: string;
    created_after?: Date;
    created_before?: Date;
    search?: string;
  }): Promise<Finding[]> {
    let query = 'SELECT * FROM findings WHERE 1=1';
    const params: any[] = [];

    if (filters?.provider_id) {
      query += ` AND provider_id = $${params.length + 1}`;
      params.push(filters.provider_id);
    }

    if (filters?.severity) {
      query += ` AND severity = $${params.length + 1}`;
      params.push(filters.severity);
    }

    if (filters?.status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(filters.status);
    }

    if (filters?.category_id) {
      query += ` AND category_id = $${params.length + 1}`;
      params.push(filters.category_id);
    }

    if (filters?.created_after) {
      query += ` AND created_at >= $${params.length + 1}`;
      params.push(filters.created_after);
    }

    if (filters?.created_before) {
      query += ` AND created_at <= $${params.length + 1}`;
      params.push(filters.created_before);
    }

    if (filters?.search) {
      query += ` AND (title ILIKE $${params.length + 1} OR description ILIKE $${params.length + 1})`;
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async getFindingById(id: string): Promise<Finding | null> {
    const result = await this.pool.query(
      'SELECT * FROM findings WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async updateFinding(id: string, data: Partial<Finding>): Promise<Finding> {
    const fields: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (!['id', 'created_at', 'created_by', 'finding_number'].includes(key)) {
        if (key === 'evidence') {
          fields.push(`${key} = $${paramCount}`);
          params.push(JSON.stringify(value || {}));
        } else {
          fields.push(`${key} = $${paramCount}`);
          params.push(value);
        }
        paramCount++;
      }
    });

    fields.push('updated_at = NOW()');
    params.push(id);

    const query = `
      UPDATE findings
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.pool.query(query, params);
    return result.rows[0];
  }

  async updateFindingStatus(id: string, status: string, updated_by?: string): Promise<Finding> {
    const result = await this.pool.query(
      `UPDATE findings
       SET status = $1, updated_at = NOW(), updated_by = $3
       WHERE id = $2
       RETURNING *`,
      [status, id, updated_by || null]
    );

    if (result.rows.length === 0) {
      throw new Error(`Finding ${id} not found`);
    }

    return result.rows[0];
  }

  async recordFindingStatusHistory(
    finding_id: string,
    old_status: string,
    new_status: string,
    changed_by?: string,
    reason?: string
  ): Promise<ActionStatusHistory> {
    const query = `
      INSERT INTO finding_status_history (finding_id, old_status, new_status, changed_by, reason)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await this.pool.query(query, [finding_id, old_status, new_status, changed_by || null, reason || null]);
    return result.rows[0];
  }

  // ===== CORRECTIVE ACTIONS =====

  async createCorrectiveAction(
    data: Omit<CorrectiveAction, 'id' | 'created_at' | 'updated_at'>
  ): Promise<CorrectiveAction> {
    const query = `
      INSERT INTO corrective_actions (
        finding_id, action_number, title, description, assigned_to, assigned_date,
        due_date, status, priority, evidence, created_by, updated_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      data.finding_id,
      data.action_number,
      data.title,
      data.description,
      data.assigned_to || null,
      data.assigned_date,
      data.due_date,
      data.status || 'open',
      data.priority || 'medium',
      data.evidence ? JSON.stringify(data.evidence) : '{}',
      data.created_by || null,
      data.updated_by || null,
    ]);

    return result.rows[0];
  }

  async getCorrectiveActions(filters?: {
    finding_id?: string;
    status?: string;
    assigned_to?: string;
    due_after?: Date;
    due_before?: Date;
    search?: string;
  }): Promise<CorrectiveAction[]> {
    let query = 'SELECT * FROM corrective_actions WHERE 1=1';
    const params: any[] = [];

    if (filters?.finding_id) {
      query += ` AND finding_id = $${params.length + 1}`;
      params.push(filters.finding_id);
    }

    if (filters?.status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(filters.status);
    }

    if (filters?.assigned_to) {
      query += ` AND assigned_to = $${params.length + 1}`;
      params.push(filters.assigned_to);
    }

    if (filters?.due_after) {
      query += ` AND due_date >= $${params.length + 1}`;
      params.push(filters.due_after);
    }

    if (filters?.due_before) {
      query += ` AND due_date <= $${params.length + 1}`;
      params.push(filters.due_before);
    }

    if (filters?.search) {
      query += ` AND (title ILIKE $${params.length + 1} OR description ILIKE $${params.length + 1})`;
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY due_date ASC, created_at DESC';

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async getCorrectiveActionById(id: string): Promise<CorrectiveAction | null> {
    const result = await this.pool.query(
      'SELECT * FROM corrective_actions WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async updateCorrectiveAction(id: string, data: Partial<CorrectiveAction>): Promise<CorrectiveAction> {
    const fields: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (!['id', 'created_at', 'created_by', 'finding_id', 'action_number'].includes(key)) {
        if (key === 'evidence') {
          fields.push(`${key} = $${paramCount}`);
          params.push(JSON.stringify(value || {}));
        } else {
          fields.push(`${key} = $${paramCount}`);
          params.push(value);
        }
        paramCount++;
      }
    });

    fields.push('updated_at = NOW()');
    params.push(id);

    const query = `
      UPDATE corrective_actions
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.pool.query(query, params);
    return result.rows[0];
  }

  async updateCorrectiveActionStatus(
    id: string,
    status: string,
    updated_by?: string,
    reason?: string
  ): Promise<CorrectiveAction> {
    // Get old status first
    const oldAction = await this.getCorrectiveActionById(id);
    if (!oldAction) {throw new Error(`Action ${id} not found`);}

    // Record status history
    await this.recordActionStatusHistory(id, oldAction.status, status, updated_by, reason);

    // Update the action
    const result = await this.pool.query(
      `UPDATE corrective_actions
       SET status = $1, updated_at = NOW(), updated_by = $3
       WHERE id = $2
       RETURNING *`,
      [status, id, updated_by || null]
    );

    return result.rows[0];
  }

  async recordActionStatusHistory(
    action_id: string,
    old_status: string,
    new_status: string,
    changed_by?: string,
    reason?: string
  ): Promise<ActionStatusHistory> {
    const query = `
      INSERT INTO action_status_history (action_id, old_status, new_status, changed_by, reason)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await this.pool.query(query, [action_id, old_status, new_status, changed_by || null, reason || null]);
    return result.rows[0];
  }

  // ===== ACTION EVIDENCE =====

  async uploadEvidence(data: Omit<ActionEvidence, 'id' | 'created_at'>): Promise<ActionEvidence> {
    const query = `
      INSERT INTO action_evidence (action_id, filename, file_path, file_size, file_type, content_hash, uploaded_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      data.action_id,
      data.filename,
      data.file_path,
      data.file_size,
      data.file_type || null,
      data.content_hash || null,
      data.uploaded_by || null,
    ]);

    return result.rows[0];
  }

  async getEvidenceByAction(action_id: string): Promise<ActionEvidence[]> {
    const result = await this.pool.query(
      'SELECT * FROM action_evidence WHERE action_id = $1 ORDER BY uploaded_at DESC',
      [action_id]
    );
    return result.rows;
  }

  // ===== ACTION COMMENTS =====

  async addComment(data: Omit<ActionComment, 'id' | 'created_at' | 'updated_at'>): Promise<ActionComment> {
    const query = `
      INSERT INTO action_comments (action_id, user_id, content, mentions)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      data.action_id,
      data.user_id,
      data.content,
      data.mentions ? JSON.stringify(data.mentions) : '[]',
    ]);

    return result.rows[0];
  }

  async getCommentsByAction(action_id: string): Promise<ActionComment[]> {
    const result = await this.pool.query(
      'SELECT * FROM action_comments WHERE action_id = $1 ORDER BY created_at ASC',
      [action_id]
    );

    return result.rows.map((row) => ({
      ...row,
      mentions: typeof row.mentions === 'string' ? JSON.parse(row.mentions) : row.mentions,
    }));
  }

  // ===== ESCALATION ALERTS =====

  async createEscalationAlert(data: Omit<EscalationAlert, 'id' | 'created_at'>): Promise<EscalationAlert> {
    const query = `
      INSERT INTO escalation_alerts (action_id, finding_id, assessment_id, alert_type, days_offset, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      data.action_id || null,
      data.finding_id || null,
      data.assessment_id || null,
      data.alert_type,
      data.days_offset,
      data.is_active !== undefined ? data.is_active : true,
    ]);

    return result.rows[0];
  }

  async getActiveEscalationAlerts(): Promise<EscalationAlert[]> {
    const result = await this.pool.query(
      `SELECT * FROM escalation_alerts
       WHERE is_active = TRUE AND triggered_at IS NULL
       ORDER BY created_at ASC`
    );

    return result.rows;
  }

  async triggerEscalationAlert(id: string): Promise<EscalationAlert> {
    const result = await this.pool.query(
      `UPDATE escalation_alerts
       SET triggered_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    return result.rows[0];
  }

  async acknowledgeEscalationAlert(id: string, acknowledged_by?: string): Promise<EscalationAlert> {
    const result = await this.pool.query(
      `UPDATE escalation_alerts
       SET acknowledged_at = NOW(), acknowledged_by = $2, is_active = FALSE
       WHERE id = $1
       RETURNING *`,
      [id, acknowledged_by || null]
    );

    return result.rows[0];
  }
}
