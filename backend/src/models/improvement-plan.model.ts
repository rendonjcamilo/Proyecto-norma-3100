import { Pool, QueryResult } from 'pg';

export interface ImprovementPlanItem {
  id: string;
  assessment_id: string;
  finding_id?: string | null;
  numero: number;
  estandar: string;
  criterio: string;
  hallazgo_encontrado: string;
  actividad_mejora?: string | null;
  responsable?: string | null;
  fecha_inicio?: Date | null;
  fecha_terminacion?: Date | null;
  fecha_ejecucion?: Date | null;
  observaciones?: string | null;
  seguimiento_1?: string | null;
  seguimiento_2?: string | null;
  seguimiento_3?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface UpdateImprovementPlanItem {
  actividad_mejora?: string;
  responsable?: string;
  fecha_inicio?: string;
  fecha_terminacion?: string;
  fecha_ejecucion?: string;
  observaciones?: string;
  seguimiento_1?: string;
  seguimiento_2?: string;
  seguimiento_3?: string;
}

export class ImprovementPlanModel {
  constructor(private pool: Pool) {}

  async getByAssessment(assessmentId: string): Promise<ImprovementPlanItem[]> {
    const result: QueryResult<ImprovementPlanItem> = await this.pool.query(
      `SELECT * FROM improvement_plan_items
       WHERE assessment_id = $1
       ORDER BY numero ASC`,
      [assessmentId]
    );
    return result.rows;
  }

  async bulkCreate(items: Omit<ImprovementPlanItem, 'id' | 'created_at' | 'updated_at'>[]): Promise<ImprovementPlanItem[]> {
    if (items.length === 0) return [];
    const created: ImprovementPlanItem[] = [];
    for (const item of items) {
      const result: QueryResult<ImprovementPlanItem> = await this.pool.query(
        `INSERT INTO improvement_plan_items
          (assessment_id, finding_id, numero, estandar, criterio, hallazgo_encontrado)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING
         RETURNING *`,
        [item.assessment_id, item.finding_id ?? null, item.numero, item.estandar, item.criterio, item.hallazgo_encontrado]
      );
      if (result.rows[0]) created.push(result.rows[0]);
    }
    return created;
  }

  async updateItem(id: string, updates: UpdateImprovementPlanItem): Promise<ImprovementPlanItem | null> {
    const fields: string[] = [];
    const params: unknown[] = [];

    if (updates.actividad_mejora !== undefined) { params.push(updates.actividad_mejora); fields.push(`actividad_mejora = $${params.length}`); }
    if (updates.responsable !== undefined) { params.push(updates.responsable); fields.push(`responsable = $${params.length}`); }
    if (updates.fecha_inicio !== undefined) { params.push(updates.fecha_inicio || null); fields.push(`fecha_inicio = $${params.length}`); }
    if (updates.fecha_terminacion !== undefined) { params.push(updates.fecha_terminacion || null); fields.push(`fecha_terminacion = $${params.length}`); }
    if (updates.fecha_ejecucion !== undefined) { params.push(updates.fecha_ejecucion || null); fields.push(`fecha_ejecucion = $${params.length}`); }
    if (updates.observaciones !== undefined) { params.push(updates.observaciones); fields.push(`observaciones = $${params.length}`); }
    if (updates.seguimiento_1 !== undefined) { params.push(updates.seguimiento_1); fields.push(`seguimiento_1 = $${params.length}`); }
    if (updates.seguimiento_2 !== undefined) { params.push(updates.seguimiento_2); fields.push(`seguimiento_2 = $${params.length}`); }
    if (updates.seguimiento_3 !== undefined) { params.push(updates.seguimiento_3); fields.push(`seguimiento_3 = $${params.length}`); }

    if (fields.length === 0) return null;

    fields.push(`updated_at = NOW()`);
    params.push(id);

    const result: QueryResult<ImprovementPlanItem> = await this.pool.query(
      `UPDATE improvement_plan_items SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );
    return result.rows[0] || null;
  }

  async countByAssessment(assessmentId: string): Promise<number> {
    const result = await this.pool.query<{ count: string }>(
      'SELECT COUNT(*) FROM improvement_plan_items WHERE assessment_id = $1',
      [assessmentId]
    );
    return parseInt(result.rows[0].count, 10);
  }
}
