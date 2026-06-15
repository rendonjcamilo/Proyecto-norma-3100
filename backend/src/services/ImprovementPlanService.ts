import { Pool } from 'pg';
import { ImprovementPlanModel, ImprovementPlanItem, UpdateImprovementPlanItem } from '../models/improvement-plan.model.js';

export class ImprovementPlanService {
  private model: ImprovementPlanModel;

  constructor(pool: Pool) {
    this.model = new ImprovementPlanModel(pool);
  }

  async getByAssessment(assessmentId: string): Promise<ImprovementPlanItem[]> {
    return this.model.getByAssessment(assessmentId);
  }

  /**
   * Genera automáticamente ítems del plan de mejora a partir de los hallazgos NC
   * de una evaluación. Idempotente: solo crea si no existen aún.
   */
  async generateFromFindings(assessmentId: string, pool: Pool): Promise<ImprovementPlanItem[]> {
    const existing = await this.model.countByAssessment(assessmentId);
    if (existing > 0) return this.model.getByAssessment(assessmentId);

    // Obtener hallazgos NC con info de estándar y criterio
    const findingsResult = await pool.query<{
      id: string;
      title: string;
      description: string;
      standard_name: string;
      criterion_name: string;
      criterion_code: string;
    }>(
      `SELECT
         f.id,
         f.title,
         f.description,
         COALESCE(es.name, es2.name, 'Sin estándar') AS standard_name,
         COALESCE(ec.name, f.title)                   AS criterion_name,
         COALESCE(ec.code, '')                        AS criterion_code
       FROM findings f
       LEFT JOIN evaluation_criteria   ec  ON ec.id  = f.criterion_id
       LEFT JOIN evaluation_standards  es  ON es.id  = f.standard_id
       LEFT JOIN evaluation_standards  es2 ON es2.id = ec.standard_id
       WHERE f.assessment_id = $1
         AND f.status != 'cerrada'
       ORDER BY COALESCE(es.name, es2.name) NULLS LAST, ec.code NULLS LAST`,
      [assessmentId]
    );

    if (findingsResult.rows.length === 0) return [];

    const items = findingsResult.rows.map((row, index) => ({
      assessment_id: assessmentId,
      finding_id: row.id,
      numero: index + 1,
      estandar: row.standard_name,
      criterio: row.criterion_code ? `${row.criterion_code} — ${row.criterion_name}` : row.criterion_name,
      hallazgo_encontrado: row.description || row.title,
    }));

    return this.model.bulkCreate(items);
  }

  async forceRegenerate(assessmentId: string, pool: Pool): Promise<ImprovementPlanItem[]> {
    await this.model.deleteByAssessment(assessmentId);
    return this.generateFromFindings(assessmentId, pool);
  }

  async updateItem(id: string, updates: UpdateImprovementPlanItem): Promise<ImprovementPlanItem | null> {
    return this.model.updateItem(id, updates);
  }
}
