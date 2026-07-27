/**
 * Structure Routes — solo lectura, pantalla "Estructura de Servicios"
 * Expone la jerarquía real Grupo de servicio -> Servicio -> Capitulo (agrupador) -> Criterio,
 * mas la rama aparte de los 512 criterios transversales (7 estandares, sin relacion con
 * grupo/servicio). Construida para que un usuario no-tecnico (auditor/super_admin) pueda ver
 * por si mismo como esta conectado todo, sin depender de que un desarrollador lo explique.
 * Ver CONTEXT.md seccion "Agrupador" para el detalle de la jerarquia de 4 niveles.
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { rbacMiddleware } from '../middleware/role.middleware.js';
import { logger } from '../utils/logger.js';
import { standardOrderCaseSql } from '../config/standard-order.config.js';
import { SERVICE_CATEGORY_ORDER as CATEGORY_ORDER } from '../config/category-order.config.js';

// Capitulos sin un unico servicio padre en service_chapter_mapping (por diseño, ver
// 2026-07-24-create-service-chapter-mapping.sql). Se muestran repetidos bajo cada servicio al
// que aplican en vez de forzarlos a un solo padre -- decision del usuario, grill-with-docs
// 2026-07-24. No se persiste en BD, es solo para esta vista.
const CATEGORY_WIDE_CHAPTERS = new Set(['CEE', 'QRG']);
// LAB-CAL (Res. 1619) se ancla bajo el mismo servicio que el capitulo LAB (706 Laboratorio Clinico).
const LAB_CAL_ANCHOR_CODE = '706';

interface ChapterRow {
  service_id: string;
  chapter_id: string;
  chapter_code: string;
  chapter_name: string;
  confidence: string;
  note: string | null;
  criteria_count: number;
}

export function createStructureRouter(pool: Pool): Router {
  const router = Router();

  /**
   * GET /api/structure/tree
   * Jerarquia completa Grupo -> Servicio -> Capitulo, liviana (sin texto de criterios,
   * solo conteo). El texto de cada criterio se pide aparte, bajo demanda, al expandir un
   * capitulo (GET /api/structure/capitulo/:id/criteria).
   */
  router.get('/structure/tree', authMiddleware, rbacMiddleware(['super_admin', 'auditor']), async (_req: Request, res: Response) => {
    try {
      const serviciosResult = await pool.query<{ id: string; code: string; name: string; category: string }>(
        `SELECT id, code, name, category FROM services WHERE type = 'reps_service' ORDER BY name`
      );

      const mappingResult = await pool.query<ChapterRow>(
        `SELECT
           m.service_id,
           c.id AS chapter_id,
           c.code AS chapter_code,
           c.name AS chapter_name,
           m.confidence,
           m.note,
           (SELECT count(*) FROM evaluation_criteria ec WHERE ec.service_id = c.id)::int AS criteria_count
         FROM service_chapter_mapping m
         JOIN services c ON c.id = m.chapter_id
         ORDER BY c.code`
      );

      // Capitulos de categoria completa (CEE, QRG) -- no tienen fila en service_chapter_mapping.
      const categoryWideResult = await pool.query<{ id: string; code: string; name: string; category: string; criteria_count: number }>(
        `SELECT s.id, s.code, s.name, s.category,
                (SELECT count(*) FROM evaluation_criteria ec WHERE ec.service_id = s.id)::int AS criteria_count
         FROM services s WHERE s.type = 'compliance_chapter' AND s.code = ANY($1::text[])`,
        [Array.from(CATEGORY_WIDE_CHAPTERS)]
      );

      const labCalResult = await pool.query<{ id: string; code: string; name: string; criteria_count: number }>(
        `SELECT s.id, s.code, s.name,
                (SELECT count(*) FROM evaluation_criteria ec WHERE ec.service_id = s.id)::int AS criteria_count
         FROM services s WHERE s.type = 'compliance_chapter' AND s.code = 'LAB-CAL'`
      );

      // Agrupar capitulos mapeados por service_id
      const chaptersByService = new Map<string, ChapterRow[]>();
      for (const row of mappingResult.rows) {
        if (!chaptersByService.has(row.service_id)) chaptersByService.set(row.service_id, []);
        chaptersByService.get(row.service_id)!.push(row);
      }

      const servicios = serviciosResult.rows.map((s) => {
        const capitulos = [...(chaptersByService.get(s.id) || []).map((c) => ({
          id: c.chapter_id,
          code: c.chapter_code,
          name: c.chapter_name,
          confidence: c.confidence,
          note: c.note,
          criteria_count: c.criteria_count,
          categoryWide: false,
        }))];

        for (const cw of categoryWideResult.rows) {
          if (cw.category === s.category) {
            capitulos.push({
              id: cw.id,
              code: cw.code,
              name: cw.name,
              confidence: 'category_wide',
              note: `Aplica a todos los servicios de "${cw.category}", no a un servicio único`,
              criteria_count: cw.criteria_count,
              categoryWide: true,
            });
          }
        }

        if (s.code === LAB_CAL_ANCHOR_CODE) {
          for (const lc of labCalResult.rows) {
            capitulos.push({
              id: lc.id,
              code: lc.code,
              name: lc.name,
              confidence: 'other_regulation',
              note: 'Resolución 1619 (calidad de laboratorios) — no es Resolución 3100',
              criteria_count: lc.criteria_count,
              categoryWide: false,
            });
          }
        }

        return { id: s.id, code: s.code, name: s.name, capitulos };
      });

      const serviciosByCategory = new Map<string, typeof servicios>();
      for (const s of servicios) {
        const cat = serviciosResult.rows.find((r) => r.id === s.id)!.category;
        if (!serviciosByCategory.has(cat)) serviciosByCategory.set(cat, []);
        serviciosByCategory.get(cat)!.push(s);
      }

      const grupos = CATEGORY_ORDER
        .filter((cat) => serviciosByCategory.has(cat))
        .map((cat) => ({ category: cat, servicios: serviciosByCategory.get(cat) || [] }));

      res.status(200).json({ data: grupos });
    } catch (error) {
      logger.error({ msg: 'Error fetching structure tree', error: (error as Error).message });
      res.status(500).json({ error: 'Failed to fetch structure tree' });
    }
  });

  /**
   * GET /api/structure/capitulo/:id/criteria
   * Texto completo de los criterios de un capitulo especifico -- carga bajo demanda.
   */
  router.get('/structure/capitulo/:id/criteria', authMiddleware, rbacMiddleware(['super_admin', 'auditor']), async (req: Request, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT id, number, name, is_section_header
         FROM evaluation_criteria
         WHERE service_id = $1
         ORDER BY number`,
        [req.params.id]
      );
      res.status(200).json({ data: result.rows });
    } catch (error) {
      logger.error({ msg: 'Error fetching capitulo criteria', error: (error as Error).message });
      res.status(500).json({ error: 'Failed to fetch capitulo criteria' });
    }
  });

  /**
   * GET /api/structure/transversal
   * Rama aparte: 7 estandares -> 512 criterios transversales (service_id IS NULL), sin
   * relacion con grupo/servicio -- aplican a TODOS los servicios por igual.
   */
  router.get('/structure/transversal', authMiddleware, rbacMiddleware(['super_admin', 'auditor']), async (_req: Request, res: Response) => {
    try {
      const standardsResult = await pool.query<{ id: string; code: string; name: string }>(
        `SELECT id, code, name FROM evaluation_standards WHERE service_id IS NULL
         ORDER BY ${standardOrderCaseSql('code')}`
      );
      const criteriaResult = await pool.query<{ id: string; standard_id: string; number: string; name: string; is_section_header: boolean }>(
        `SELECT id, standard_id, number, name, is_section_header
         FROM evaluation_criteria WHERE service_id IS NULL ORDER BY standard_id, number`
      );

      const criteriaByStandard = new Map<string, typeof criteriaResult.rows>();
      for (const c of criteriaResult.rows) {
        if (!criteriaByStandard.has(c.standard_id)) criteriaByStandard.set(c.standard_id, []);
        criteriaByStandard.get(c.standard_id)!.push(c);
      }

      const estandares = standardsResult.rows.map((s) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        criterios: criteriaByStandard.get(s.id) || [],
      }));

      res.status(200).json({ data: estandares });
    } catch (error) {
      logger.error({ msg: 'Error fetching transversal structure', error: (error as Error).message });
      res.status(500).json({ error: 'Failed to fetch transversal structure' });
    }
  });

  return router;
}
