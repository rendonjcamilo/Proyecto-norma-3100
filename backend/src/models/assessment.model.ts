/**
 * Assessment Data Model
 * Represents questionnaires, assessments, and their responses
 */

import { Pool } from 'pg';

export interface Questionnaire {
  id: string;
  name: string;
  description?: string;
  version: number;
  status: 'draft' | 'published' | 'archived';
  created_by?: string;
  created_at: Date;
  updated_at: Date;
  published_at?: Date;
}

export interface QuestionnaireSection {
  id: string;
  questionnaire_id: string;
  title: string;
  description?: string;
  section_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface Question {
  id: string;
  section_id: string;
  question_text: string;
  question_type: 'checkbox' | 'radio' | 'text' | 'scale';
  question_order: number;
  is_required: boolean;
  conditional_on?: string;
  conditional_value?: string;
  risk_weight: number;
  created_at: Date;
  updated_at: Date;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  option_value: string;
  option_order: number;
  created_at: Date;
}

export interface Assessment {
  id: string;
  questionnaire_id: string;
  provider_id: string;
  location_id?: string;
  service_id?: string;
  version: number;
  status: 'draft' | 'submitted' | 'reviewed' | 'closed';
  assigned_date: Date;
  deadline?: Date;
  submitted_at?: Date;
  risk_score: number;
  compliance_pct: number;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface AssessmentResponse {
  id: string;
  assessment_id: string;
  question_id: string;
  response_value?: string;
  response_type?: string;
  answered_at?: Date;
  updated_at: Date;
  answered_by?: string;
}

export class AssessmentModel {
  constructor(private pool: Pool) {}

  // ===== QUESTIONNAIRE OPERATIONS =====

  async createQuestionnaire(
    data: Omit<Questionnaire, 'id' | 'created_at' | 'updated_at' | 'version'>
  ): Promise<Questionnaire> {
    const query = `
      INSERT INTO questionnaires (name, description, status, created_by, version)
      VALUES ($1, $2, $3, $4, 1)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      data.name,
      data.description || null,
      data.status,
      data.created_by || null,
    ]);

    return result.rows[0];
  }

  async getQuestionnaires(filters?: { status?: string; search?: string }): Promise<Questionnaire[]> {
    let query = 'SELECT * FROM questionnaires WHERE 1=1';
    const params: any[] = [];

    if (filters?.status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(filters.status);
    }

    if (filters?.search) {
      query += ` AND name ILIKE $${params.length + 1}`;
      params.push(`%${filters.search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async getQuestionnaireById(id: string): Promise<Questionnaire | null> {
    const result = await this.pool.query(
      'SELECT * FROM questionnaires WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async updateQuestionnaire(id: string, data: Partial<Questionnaire>): Promise<Questionnaire> {
    const fields: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (!['id', 'created_at', 'created_by', 'version'].includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        params.push(value);
        paramCount++;
      }
    });

    fields.push('updated_at = NOW()');
    params.push(id);

    const query = `
      UPDATE questionnaires
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.pool.query(query, params);
    return result.rows[0];
  }

  async publishQuestionnaire(id: string): Promise<Questionnaire> {
    // Increment version and set published status
    const query = `
      UPDATE questionnaires
      SET status = 'published', version = version + 1, published_at = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await this.pool.query(query, [id]);
    if (result.rows.length === 0) {
      throw new Error(`Questionnaire ${id} not found`);
    }

    return result.rows[0];
  }

  // ===== QUESTIONNAIRE SECTIONS =====

  async createSection(data: Omit<QuestionnaireSection, 'id' | 'created_at' | 'updated_at'>): Promise<QuestionnaireSection> {
    const query = `
      INSERT INTO questionnaire_sections (questionnaire_id, title, description, section_order)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      data.questionnaire_id,
      data.title,
      data.description || null,
      data.section_order,
    ]);

    return result.rows[0];
  }

  async getSectionsByQuestionnaire(questionnaire_id: string): Promise<QuestionnaireSection[]> {
    const result = await this.pool.query(
      'SELECT * FROM questionnaire_sections WHERE questionnaire_id = $1 ORDER BY section_order',
      [questionnaire_id]
    );
    return result.rows;
  }

  // ===== QUESTIONS =====

  async createQuestion(data: Omit<Question, 'id' | 'created_at' | 'updated_at'>): Promise<Question> {
    const query = `
      INSERT INTO questions (section_id, question_text, question_type, question_order, is_required, conditional_on, conditional_value, risk_weight)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      data.section_id,
      data.question_text,
      data.question_type,
      data.question_order,
      data.is_required,
      data.conditional_on || null,
      data.conditional_value || null,
      data.risk_weight || 1,
    ]);

    return result.rows[0];
  }

  async getQuestionsBySection(section_id: string): Promise<Question[]> {
    const result = await this.pool.query(
      'SELECT * FROM questions WHERE section_id = $1 ORDER BY question_order',
      [section_id]
    );
    return result.rows;
  }

  async updateQuestion(id: string, data: Partial<Question>): Promise<Question> {
    const fields: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (!['id', 'created_at', 'section_id'].includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        params.push(value);
        paramCount++;
      }
    });

    fields.push('updated_at = NOW()');
    params.push(id);

    const query = `
      UPDATE questions
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.pool.query(query, params);
    return result.rows[0];
  }

  async deleteQuestion(id: string): Promise<void> {
    await this.pool.query('DELETE FROM questions WHERE id = $1', [id]);
  }

  // ===== QUESTION OPTIONS =====

  async createQuestionOption(data: Omit<QuestionOption, 'id' | 'created_at'>): Promise<QuestionOption> {
    const query = `
      INSERT INTO question_options (question_id, option_text, option_value, option_order)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      data.question_id,
      data.option_text,
      data.option_value,
      data.option_order,
    ]);

    return result.rows[0];
  }

  async getOptionsByQuestion(question_id: string): Promise<QuestionOption[]> {
    const result = await this.pool.query(
      'SELECT * FROM question_options WHERE question_id = $1 ORDER BY option_order',
      [question_id]
    );
    return result.rows;
  }

  // ===== ASSESSMENTS =====

  async createAssessment(
    data: Omit<Assessment, 'id' | 'created_at' | 'updated_at' | 'version' | 'risk_score' | 'compliance_pct'>
  ): Promise<Assessment> {
    const query = `
      INSERT INTO assessments (questionnaire_id, provider_id, location_id, service_id, status, assigned_date, deadline, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      data.questionnaire_id,
      data.provider_id,
      data.location_id || null,
      data.service_id || null,
      data.status || 'draft',
      data.assigned_date,
      data.deadline || null,
      data.created_by || null,
    ]);

    return result.rows[0];
  }

  async getAssessments(filters?: {
    provider_id?: string;
    location_id?: string;
    status?: string;
    created_after?: Date;
    created_before?: Date;
  }): Promise<Assessment[]> {
    let query = 'SELECT * FROM assessments WHERE 1=1';
    const params: any[] = [];

    if (filters?.provider_id) {
      query += ` AND provider_id = $${params.length + 1}`;
      params.push(filters.provider_id);
    }

    if (filters?.location_id) {
      query += ` AND location_id = $${params.length + 1}`;
      params.push(filters.location_id);
    }

    if (filters?.status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(filters.status);
    }

    if (filters?.created_after) {
      query += ` AND created_at >= $${params.length + 1}`;
      params.push(filters.created_after);
    }

    if (filters?.created_before) {
      query += ` AND created_at <= $${params.length + 1}`;
      params.push(filters.created_before);
    }

    query += ' ORDER BY created_at DESC';

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async getAssessmentById(id: string): Promise<Assessment | null> {
    const result = await this.pool.query(
      'SELECT * FROM assessments WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async updateAssessment(id: string, data: Partial<Assessment>): Promise<Assessment> {
    const fields: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (!['id', 'created_at', 'created_by', 'questionnaire_id', 'provider_id'].includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        params.push(value);
        paramCount++;
      }
    });

    fields.push('updated_at = NOW()');
    params.push(id);

    const query = `
      UPDATE assessments
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.pool.query(query, params);
    return result.rows[0];
  }

  async submitAssessment(id: string, risk_score: number, compliance_pct: number): Promise<Assessment> {
    const query = `
      UPDATE assessments
      SET status = 'submitted', submitted_at = NOW(), risk_score = $2, compliance_pct = $3, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await this.pool.query(query, [id, risk_score, compliance_pct]);
    if (result.rows.length === 0) {
      throw new Error(`Assessment ${id} not found`);
    }

    return result.rows[0];
  }

  // ===== ASSESSMENT RESPONSES =====

  async saveResponse(data: Omit<AssessmentResponse, 'id' | 'updated_at'>): Promise<AssessmentResponse> {
    const query = `
      INSERT INTO assessment_responses (assessment_id, question_id, response_value, response_type, answered_at, answered_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (assessment_id, question_id) DO UPDATE
      SET response_value = EXCLUDED.response_value, response_type = EXCLUDED.response_type, answered_at = EXCLUDED.answered_at, updated_at = NOW()
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      data.assessment_id,
      data.question_id,
      data.response_value || null,
      data.response_type || null,
      data.answered_at || new Date(),
      data.answered_by || null,
    ]);

    return result.rows[0];
  }

  async getResponsesByAssessment(assessment_id: string): Promise<AssessmentResponse[]> {
    const result = await this.pool.query(
      'SELECT * FROM assessment_responses WHERE assessment_id = $1',
      [assessment_id]
    );
    return result.rows;
  }

  async getResponseByAssessmentQuestion(assessment_id: string, question_id: string): Promise<AssessmentResponse | null> {
    const result = await this.pool.query(
      'SELECT * FROM assessment_responses WHERE assessment_id = $1 AND question_id = $2',
      [assessment_id, question_id]
    );
    return result.rows[0] || null;
  }

  /**
   * Calculate compliance percentage for an assessment
   * Formula: (C / (C + NC)) * 100
   * Where C = Cumple, NC = No Cumple
   */
  async calculateCompliancePercentage(assessment_id: string): Promise<number> {
    // Get all questions for this assessment
    const assessment = await this.getAssessmentById(assessment_id);
    if (!assessment) {throw new Error('Assessment not found');}

    const responses = await this.getResponsesByAssessment(assessment_id);

    let cCount = 0;
    let ncCount = 0;

    responses.forEach((response) => {
      if (response.response_value === 'C' || response.response_value === 'cumple') {
        cCount++;
      } else if (response.response_value === 'NC' || response.response_value === 'no_cumple') {
        ncCount++;
      }
    });

    if (cCount + ncCount === 0) {
      return 0;
    }

    return Math.round((cCount / (cCount + ncCount)) * 100);
  }

  /**
   * Calculate risk score for an assessment
   * Sum of risk weights for critical responses
   */
  async calculateRiskScore(assessment_id: string): Promise<number> {
    const query = `
      SELECT SUM(CASE
        WHEN ar.response_value IN ('NC', 'no_cumple', 'false', '0') THEN q.risk_weight * 10
        ELSE 0
      END) as total_risk
      FROM assessment_responses ar
      JOIN questions q ON ar.question_id = q.id
      WHERE ar.assessment_id = $1
    `;

    const result = await this.pool.query(query, [assessment_id]);
    const total_risk = result.rows[0]?.total_risk || 0;

    // Scale to 0-100
    return Math.min(100, Math.round(total_risk / 10));
  }
}
