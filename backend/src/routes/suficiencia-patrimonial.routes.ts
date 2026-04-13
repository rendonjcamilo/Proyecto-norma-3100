/**
 * Suficiencia Patrimonial y Financiera — Routes
 * Condición 2 de habilitación — Resolución 3100 de 2019, Capítulo 9
 *
 * Endpoints:
 *   GET    /api/providers/:providerId/suficiencia-patrimonial
 *   POST   /api/providers/:providerId/suficiencia-patrimonial
 *   GET    /api/providers/:providerId/suficiencia-patrimonial/poliza-vigencia
 *   GET    /api/providers/:providerId/suficiencia-patrimonial/resumen
 *   GET    /api/providers/:providerId/suficiencia-patrimonial/historial
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { body, query as queryVal, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { rbacMiddleware } from '../middleware/role.middleware.js';
import { validateUuidParam } from '../middleware/sanitize.middleware.js';
import { SuficienciaPatrimonialService } from '../services/SuficienciaPatrimonialService.js';
import { logger } from '../utils/logger.js';

const ESTADOS_VALIDOS = ['vigente', 'vencido', 'pendiente', 'no_aplica'] as const;

const validateEstadoDoc = (field: string) =>
  body(field).optional().isIn(ESTADOS_VALIDOS).withMessage(`${field} debe ser: vigente, vencido, pendiente o no_aplica`);

export function createSuficienciaPatrimonialRouter(pool: Pool): Router {
  const router = Router();
  const service = new SuficienciaPatrimonialService(pool);

  /**
   * GET /api/providers/:providerId/suficiencia-patrimonial
   * Obtiene el registro más reciente o el de un período específico
   */
  router.get(
    '/providers/:providerId/suficiencia-patrimonial',
    authMiddleware,
    rbacMiddleware(['super_admin', 'auditor', 'provider_admin']),
    validateUuidParam('providerId'),
    async (req: Request, res: Response) => {
      try {
        const { periodo } = req.query as { periodo?: string };
        const registro = await service.getByProvider(req.params.providerId, periodo);

        if (!registro) {
          return res.status(404).json({
            error: 'No se encontró registro de suficiencia patrimonial para este prestador',
            hint: 'Use POST para crear el primer registro',
          });
        }

        res.json({ data: registro });
      } catch (err) {
        logger.error({ msg: 'Error fetching suficiencia patrimonial', error: err });
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    }
  );

  /**
   * POST /api/providers/:providerId/suficiencia-patrimonial
   * Crea o actualiza el registro de suficiencia patrimonial
   */
  router.post(
    '/providers/:providerId/suficiencia-patrimonial',
    authMiddleware,
    rbacMiddleware(['super_admin', 'auditor']),
    validateUuidParam('providerId'),
    [
      body('periodoFiscal')
        .notEmpty().withMessage('periodoFiscal es requerido')
        .matches(/^\d{4}$/).withMessage('periodoFiscal debe ser un año (ej. 2024)'),
      body('patrimonioNeto').optional().isNumeric(),
      body('activoTotal').optional().isNumeric(),
      body('pasivoTotal').optional().isNumeric(),
      body('ingresosOperacionales').optional().isNumeric(),
      body('utilidadNeta').optional().isNumeric(),
      body('polizaRcVigenciaDesde').optional().isISO8601().toDate(),
      body('polizaRcVigenciaHasta').optional().isISO8601().toDate(),
      body('polizaRcValorAsegurado').optional().isNumeric(),
      body('estadosFinancierosRevsorFirma').optional().isBoolean(),
      validateEstadoDoc('estadosFinancierosEstado'),
      validateEstadoDoc('polizaRcEstado'),
      validateEstadoDoc('declaracionRentaEstado'),
      validateEstadoDoc('certificacionBancariaEstado'),
    ],
    async (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      try {
        const registro = await service.upsert({
          ...req.body,
          providerId: req.params.providerId,
          verificadoPor: req.user?.user_id || 'system',
        });

        res.status(200).json({
          message: 'Registro de suficiencia patrimonial guardado correctamente',
          data: registro,
        });
      } catch (err) {
        logger.error({ msg: 'Error upserting suficiencia patrimonial', error: err });
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    }
  );

  /**
   * GET /api/providers/:providerId/suficiencia-patrimonial/poliza-vigencia
   * Verifica la vigencia de la póliza RC y retorna días restantes
   */
  router.get(
    '/providers/:providerId/suficiencia-patrimonial/poliza-vigencia',
    authMiddleware,
    rbacMiddleware(['super_admin', 'auditor', 'provider_admin']),
    validateUuidParam('providerId'),
    async (req: Request, res: Response) => {
      try {
        const vigencia = await service.verificarVigenciaPoliza(req.params.providerId);
        res.json({ data: vigencia });
      } catch (err) {
        logger.error({ msg: 'Error verificando vigencia de póliza', error: err });
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    }
  );

  /**
   * GET /api/providers/:providerId/suficiencia-patrimonial/resumen
   * Resumen ejecutivo de la Condición 2 para el dashboard
   */
  router.get(
    '/providers/:providerId/suficiencia-patrimonial/resumen',
    authMiddleware,
    rbacMiddleware(['super_admin', 'auditor', 'provider_admin']),
    validateUuidParam('providerId'),
    async (req: Request, res: Response) => {
      try {
        const resumen = await service.resumenCondicion2(req.params.providerId);
        res.json({ data: resumen });
      } catch (err) {
        logger.error({ msg: 'Error fetching resumen condicion 2', error: err });
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    }
  );

  /**
   * GET /api/providers/:providerId/suficiencia-patrimonial/historial
   * Lista todos los períodos evaluados
   */
  router.get(
    '/providers/:providerId/suficiencia-patrimonial/historial',
    authMiddleware,
    rbacMiddleware(['super_admin', 'auditor', 'provider_admin']),
    validateUuidParam('providerId'),
    async (req: Request, res: Response) => {
      try {
        const historial = await service.listByProvider(req.params.providerId);
        res.json({ data: historial, total: historial.length });
      } catch (err) {
        logger.error({ msg: 'Error fetching historial suficiencia', error: err });
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    }
  );

  return router;
}
