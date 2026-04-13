/**
 * Historia Clínica y Registros — Routes
 * Estándar TSHCR — Resolución 3100 de 2019, Capítulo 11
 * Resolución 1995 de 1999 — 15 campos mínimos de identificación
 *
 * Endpoints:
 *   POST   /api/providers/:providerId/historia-clinica/verificaciones
 *   GET    /api/providers/:providerId/historia-clinica/verificaciones
 *   GET    /api/providers/:providerId/historia-clinica/verificaciones/:id
 *   GET    /api/providers/:providerId/historia-clinica/resumen
 *   GET    /api/providers/:providerId/historia-clinica/campos-minimos
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { body, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { rbacMiddleware } from '../middleware/role.middleware.js';
import { validateUuidParam } from '../middleware/sanitize.middleware.js';
import { HistoriaClinicaService } from '../services/HistoriaClinicaService.js';
import { logger } from '../utils/logger.js';

const camposBooleans = [
  'campo01NombreCompleto', 'campo02EstadoCivil', 'campo03DocumentoIdentidad',
  'campo04FechaNacimiento', 'campo05Edad', 'campo06Sexo', 'campo07Ocupacion',
  'campo08DireccionResidencia', 'campo09TelefonoResidencia',
  'campo10MunicipioResidencia', 'campo11AcompananteNombreTelefono',
  'campo12ResponsableNombreTelefonoParentesco',
  'campo13EntidadAseguradora', 'campo14TipoVinculacion',
  'campo15ConsentimientoInformado',
];

export function createHistoriaClinicaRouter(pool: Pool): Router {
  const router = Router();
  const service = new HistoriaClinicaService(pool);

  /**
   * POST /api/providers/:providerId/historia-clinica/verificaciones
   * Registra una nueva verificación de historias clínicas
   */
  router.post(
    '/providers/:providerId/historia-clinica/verificaciones',
    authMiddleware,
    rbacMiddleware(['super_admin', 'auditor']),
    validateUuidParam('providerId'),
    [
      body('totalHcRevisadas')
        .isInt({ min: 1 }).withMessage('totalHcRevisadas debe ser un entero positivo'),
      body('totalHcConformes')
        .isInt({ min: 0 }).withMessage('totalHcConformes debe ser un entero ≥ 0'),
      body('campos').isObject().withMessage('campos es requerido y debe ser un objeto'),
      ...camposBooleans.map((c) =>
        body(`campos.${c}`).optional().isBoolean()
          .withMessage(`campos.${c} debe ser booleano`)
      ),
      body('hallazgosIdentificados').optional().isArray(),
      body('hallazgosIdentificados.*.campo').optional().isString(),
      body('hallazgosIdentificados.*.descripcion').optional().isString(),
      body('hallazgosIdentificados.*.hcCount').optional().isInt({ min: 0 }),
      body('fechaVerificacion').optional().isISO8601(),
      body('assessmentId').optional().isUUID(),
    ],
    async (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      try {
        const registro = await service.registrarVerificacion({
          ...req.body,
          providerId: req.params.providerId,
          verificadoPor: req.user?.user_id || 'system',
        });

        res.status(201).json({
          message: 'Verificación de historia clínica registrada correctamente',
          data: registro,
        });
      } catch (err) {
        logger.error({ msg: 'Error registrando verificación HC', error: err });
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    }
  );

  /**
   * GET /api/providers/:providerId/historia-clinica/verificaciones
   * Lista verificaciones de historia clínica del prestador
   */
  router.get(
    '/providers/:providerId/historia-clinica/verificaciones',
    authMiddleware,
    rbacMiddleware(['super_admin', 'auditor', 'provider_admin']),
    validateUuidParam('providerId'),
    async (req: Request, res: Response) => {
      try {
        const limit = Math.min(parseInt((req.query.limit as string) || '20'), 100);
        const verificaciones = await service.listByProvider(req.params.providerId, limit);
        res.json({ data: verificaciones, total: verificaciones.length });
      } catch (err) {
        logger.error({ msg: 'Error listando verificaciones HC', error: err });
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    }
  );

  /**
   * GET /api/providers/:providerId/historia-clinica/verificaciones/:id
   * Obtiene una verificación específica por ID
   */
  router.get(
    '/providers/:providerId/historia-clinica/verificaciones/:id',
    authMiddleware,
    rbacMiddleware(['super_admin', 'auditor', 'provider_admin']),
    validateUuidParam('providerId'),
    validateUuidParam('id'),
    async (req: Request, res: Response) => {
      try {
        const verificacion = await service.getById(req.params.id);
        if (!verificacion || verificacion.provider_id !== req.params.providerId) {
          return res.status(404).json({ error: 'Verificación no encontrada' });
        }
        res.json({ data: verificacion });
      } catch (err) {
        logger.error({ msg: 'Error fetching verificación HC', error: err });
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    }
  );

  /**
   * GET /api/providers/:providerId/historia-clinica/resumen
   * Resumen de cumplimiento TSHCR para el prestador
   */
  router.get(
    '/providers/:providerId/historia-clinica/resumen',
    authMiddleware,
    rbacMiddleware(['super_admin', 'auditor', 'provider_admin']),
    validateUuidParam('providerId'),
    async (req: Request, res: Response) => {
      try {
        const resumen = await service.resumenTSHCR(req.params.providerId);
        res.json({ data: resumen });
      } catch (err) {
        logger.error({ msg: 'Error fetching resumen TSHCR', error: err });
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    }
  );

  /**
   * GET /api/providers/:providerId/historia-clinica/campos-minimos
   * Detalle de los 15 campos mínimos con estado de la última verificación
   */
  router.get(
    '/providers/:providerId/historia-clinica/campos-minimos',
    authMiddleware,
    rbacMiddleware(['super_admin', 'auditor', 'provider_admin']),
    validateUuidParam('providerId'),
    async (req: Request, res: Response) => {
      try {
        const detalle = await service.detalle15Campos(req.params.providerId);
        if (!detalle) {
          return res.status(404).json({
            error: 'No hay verificaciones registradas para este prestador',
            hint: 'Registre al menos una verificación de historia clínica',
          });
        }
        const cumplidos = detalle.filter((d) => d.cumple).length;
        res.json({
          data: detalle,
          resumen: {
            totalCampos: 15,
            camposCumplidos: cumplidos,
            camposFaltantes: 15 - cumplidos,
            cumplimiento: `${cumplidos}/15`,
          },
        });
      } catch (err) {
        logger.error({ msg: 'Error fetching campos mínimos HC', error: err });
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    }
  );

  return router;
}
