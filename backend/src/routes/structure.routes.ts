/**
 * Structure Routes — solo lectura, pantalla "Estructura de Servicios"
 *
 * Expone la estructura de auditoria tal como esta en el archivo fuente de la Resolucion 3100:
 * Grupo (11.1 a 11.6) -> Servicio -> Criterio. Nada mas.
 *
 * Los 157 servicios REPS (Anestesia, Cardiologia, Optometria...) NO aparecen aqui: ese es el
 * catalogo de habilitacion del prestador, no la estructura de auditoria. Ver
 * config/norma3100-structure.config.ts.
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { rbacMiddleware } from '../middleware/role.middleware.js';
import { logger } from '../utils/logger.js';
import { NORMA_3100_STRUCTURE, OTRA_NORMATIVA } from '../config/norma3100-structure.config.js';

interface CountRow {
  code: string;
  id: string;
  name: string;
  criteria_count: number;
  header_count: number;
}

export function createStructureRouter(pool: Pool): Router {
  const router = Router();

  /**
   * GET /api/structure/tree
   * Grupo -> Servicio, con conteos. El texto de los criterios se pide aparte al expandir
   * (GET /api/structure/servicio/:kind/:id/criteria).
   */
  router.get('/structure/tree', authMiddleware, rbacMiddleware(['super_admin', 'auditor']), async (_req: Request, res: Response) => {
    try {
      // Servicios de 11.2 a 11.6: sus criterios cuelgan de services.id
      const chapters = await pool.query<CountRow>(
        `SELECT s.code, s.id, s.name,
                count(*) FILTER (WHERE ec.status = 'active' AND COALESCE(ec.is_section_header, false) = false)::int AS criteria_count,
                count(*) FILTER (WHERE ec.status = 'active' AND COALESCE(ec.is_section_header, false) = true)::int AS header_count
         FROM services s
         LEFT JOIN evaluation_criteria ec ON ec.service_id = s.id
         WHERE s.type = 'compliance_chapter'
         GROUP BY s.code, s.id, s.name`
      );

      // Estandares transversales de 11.1: sus criterios cuelgan de evaluation_standards.id
      const standards = await pool.query<CountRow>(
        `SELECT es.code, es.id, es.name,
                count(*) FILTER (WHERE ec.status = 'active' AND COALESCE(ec.is_section_header, false) = false)::int AS criteria_count,
                count(*) FILTER (WHERE ec.status = 'active' AND COALESCE(ec.is_section_header, false) = true)::int AS header_count
         FROM evaluation_standards es
         LEFT JOIN evaluation_criteria ec ON ec.standard_id = es.id AND ec.service_id IS NULL
         WHERE es.service_id IS NULL
         GROUP BY es.code, es.id, es.name`
      );

      const byCode = new Map<string, CountRow>();
      for (const r of chapters.rows) byCode.set(r.code, r);
      for (const r of standards.rows) byCode.set(r.code, r);

      const grupos = NORMA_3100_STRUCTURE.map((g) => {
        const servicios = g.servicios.map((sv) => {
          const row = byCode.get(sv.code);
          return {
            norm: sv.norm,
            code: sv.code,
            id: row?.id ?? null,
            name: row?.name ?? sv.code,
            kind: g.transversal ? 'standard' : 'chapter',
            criteria_count: row?.criteria_count ?? 0,
            header_count: row?.header_count ?? 0,
            missing: !row,
          };
        });
        return {
          norm: g.norm,
          name: g.name,
          transversal: g.transversal,
          criteria_total: servicios.reduce((a, s) => a + s.criteria_count, 0),
          servicios,
        };
      });

      // Codigos presentes en la BD que no pertenecen a la Res. 3100 -- se listan aparte para que
      // nadie los confunda con estructura normativa.
      const otras = chapters.rows
        .filter((r) => OTRA_NORMATIVA[r.code])
        .map((r) => ({
          code: r.code,
          id: r.id,
          name: r.name,
          kind: 'chapter',
          note: OTRA_NORMATIVA[r.code],
          criteria_count: r.criteria_count,
          header_count: r.header_count,
        }));

      res.status(200).json({ data: grupos, otraNormativa: otras });
    } catch (error) {
      logger.error({ msg: 'Error fetching structure tree', error: (error as Error).message });
      res.status(500).json({ error: 'Failed to fetch structure tree' });
    }
  });

  /**
   * GET /api/structure/servicio/:kind/:id/criteria
   * Criterios de un servicio. `kind` es 'chapter' (11.2-11.6, criterios por service_id) o
   * 'standard' (11.1, criterios transversales por standard_id).
   * Se ordena por sort_order/code, igual que el formulario de auditoria -- la columna `number`
   * no es fiable para ordenar.
   */
  router.get('/structure/servicio/:kind/:id/criteria', authMiddleware, rbacMiddleware(['super_admin', 'auditor']), async (req: Request, res: Response) => {
    try {
      const { kind, id } = req.params;
      if (kind !== 'chapter' && kind !== 'standard') {
        res.status(400).json({ error: 'kind debe ser chapter o standard' });
        return;
      }

      const where = kind === 'chapter'
        ? 'service_id = $1'
        : 'standard_id = $1 AND service_id IS NULL';

      const result = await pool.query(
        `SELECT id, number, name, is_section_header
         FROM evaluation_criteria
         WHERE ${where} AND status = 'active'
         ORDER BY COALESCE(sort_order, 9999), code`,
        [id]
      );
      res.status(200).json({ data: result.rows });
    } catch (error) {
      logger.error({ msg: 'Error fetching criteria', error: (error as Error).message });
      res.status(500).json({ error: 'Failed to fetch criteria' });
    }
  });

  return router;
}
