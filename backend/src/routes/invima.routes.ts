/**
 * INVIMA Registry Routes — Resolución 3100 / Estándar TSMD
 * Endpoints para consulta automática, gestión de registros y alertas INVIMA
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { InvimaService } from '../services/InvimaService.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { rbacMiddleware } from '../middleware/role.middleware.js';
import { logger } from '../utils/logger.js';

export function createInvimaRouter(pool: Pool): Router {
  const router = Router();
  const invimaService = new InvimaService(pool);

  // ─── LOOKUP: Consulta automática por número de registro ───

  /**
   * GET /api/invima/lookup/:numeroRegistro
   * Busca en cache local → datos.gov.co → devuelve datos del registro
   * Rol: super_admin, auditor, provider_admin
   */
  router.get(
    '/invima/lookup/:numeroRegistro',
    authMiddleware,
    rbacMiddleware(['super_admin', 'auditor', 'provider_admin']),
    async (req: Request, res: Response) => {
      try {
        const { numeroRegistro } = req.params;
        const userId = (req as any).user?.id || (req as any).userId;

        if (!numeroRegistro || numeroRegistro.trim().length < 3) {
          return res.status(400).json({ error: 'Número de registro debe tener al menos 3 caracteres' });
        }

        const result = await invimaService.lookupRegistro(numeroRegistro, userId);

        logger.info({
          msg: 'INVIMA lookup',
          numero: numeroRegistro,
          found: result.found,
          source: result.source,
          cached: result.cached,
        });

        res.json({ data: result });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error in INVIMA lookup', error: msg });
        res.status(500).json({ error: msg });
      }
    }
  );

  // ─── REGISTROS CRUD ───

  /**
   * GET /api/invima/registros/search?q=...
   * Buscar registros en cache local
   */
  router.get(
    '/invima/registros/search',
    authMiddleware,
    rbacMiddleware(['super_admin', 'auditor', 'provider_admin']),
    async (req: Request, res: Response) => {
      try {
        const q = (req.query.q as string) || '';
        const limit = parseInt(req.query.limit as string, 10) || 20;

        if (q.length < 2) {
          return res.status(400).json({ error: 'Búsqueda requiere al menos 2 caracteres' });
        }

        const registros = await invimaService.searchRegistros(q, limit);
        res.json({ data: registros, total: registros.length });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        res.status(500).json({ error: msg });
      }
    }
  );

  /**
   * POST /api/invima/registros
   * Crear/actualizar un registro manualmente
   */
  router.post(
    '/invima/registros',
    authMiddleware,
    rbacMiddleware(['super_admin', 'auditor']),
    async (req: Request, res: Response) => {
      try {
        const { numeroRegistro, ...data } = req.body;

        if (!numeroRegistro) {
          return res.status(400).json({ error: 'numeroRegistro es requerido' });
        }

        const registro = await invimaService.upsertRegistro({
          numero_registro: numeroRegistro.trim().toUpperCase(),
          tipo_registro: data.tipoRegistro,
          estado: data.estado,
          nombre_producto: data.nombreProducto,
          categoria: data.categoria,
          principios_activos: data.principiosActivos,
          presentaciones_autorizadas: data.presentacionesAutorizadas,
          clasificacion_riesgo: data.clasificacionRiesgo,
          titular_registro: data.titularRegistro,
          titular_fabricante: data.titularFabricante,
          titular_importador: data.titularImportador,
          pais_origen: data.paisOrigen,
          fecha_emision: data.fechaEmision,
          fecha_vencimiento: data.fechaVencimiento,
          fuente_datos: 'manual',
          observaciones: data.observaciones,
        });

        res.status(201).json({ data: registro, message: 'Registro INVIMA guardado' });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        res.status(500).json({ error: msg });
      }
    }
  );

  // ─── PROVIDER ITEMS (Inventario por proveedor) ───

  /**
   * GET /api/providers/:providerId/invima/items
   * Listar medicamentos/dispositivos del proveedor con datos INVIMA
   */
  router.get(
    '/providers/:providerId/invima/items',
    authMiddleware,
    rbacMiddleware(['super_admin', 'auditor', 'provider_admin']),
    async (req: Request, res: Response) => {
      try {
        const { providerId } = req.params;
        const { semaforo, categoria, activo } = req.query;

        const items = await invimaService.listProviderItems(providerId, {
          semaforo: semaforo as string,
          categoria: categoria as string,
          activo: activo !== undefined ? activo === 'true' : undefined,
        });

        res.json({ data: items, total: items.length });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        res.status(500).json({ error: msg });
      }
    }
  );

  /**
   * POST /api/providers/:providerId/invima/items
   * Agregar medicamento/dispositivo al inventario del proveedor
   */
  router.post(
    '/providers/:providerId/invima/items',
    authMiddleware,
    rbacMiddleware(['super_admin', 'auditor', 'provider_admin']),
    async (req: Request, res: Response) => {
      try {
        const { providerId } = req.params;
        const { registroId, nombreComercial, loteActual, cantidadDisponible,
                ubicacionAlmacenamiento, condicionesAlmacenamiento, fechaVencimientoLote } = req.body;

        if (!registroId) {
          return res.status(400).json({ error: 'registroId (ID del registro INVIMA) es requerido' });
        }

        const item = await invimaService.addItemToProvider(providerId, registroId, {
          nombreComercial,
          loteActual,
          cantidadDisponible,
          ubicacionAlmacenamiento,
          condicionesAlmacenamiento,
          fechaVencimientoLote,
        });

        res.status(201).json({ data: item, message: 'Item agregado al inventario' });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        res.status(500).json({ error: msg });
      }
    }
  );

  /**
   * DELETE /api/providers/:providerId/invima/items/:itemId
   * Desactivar un item del inventario
   */
  router.delete(
    '/providers/:providerId/invima/items/:itemId',
    authMiddleware,
    rbacMiddleware(['super_admin', 'auditor']),
    async (req: Request, res: Response) => {
      try {
        const { itemId } = req.params;
        const motivo = (req.body.motivo as string) || 'Desactivado por el usuario';

        await invimaService.deactivateItem(itemId, motivo);
        res.json({ message: 'Item desactivado' });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        res.status(500).json({ error: msg });
      }
    }
  );

  // ─── RESUMEN TSMD ───

  /**
   * GET /api/providers/:providerId/invima/resumen
   * Resumen de cumplimiento TSMD del proveedor
   */
  router.get(
    '/providers/:providerId/invima/resumen',
    authMiddleware,
    rbacMiddleware(['super_admin', 'auditor', 'provider_admin']),
    async (req: Request, res: Response) => {
      try {
        const { providerId } = req.params;
        const summary = await invimaService.getProviderSummary(providerId);
        res.json({ data: summary });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        res.status(500).json({ error: msg });
      }
    }
  );

  /**
   * GET /api/providers/:providerId/invima/por-vencer
   * Items próximos a vencer (semáforo)
   */
  router.get(
    '/providers/:providerId/invima/por-vencer',
    authMiddleware,
    rbacMiddleware(['super_admin', 'auditor', 'provider_admin']),
    async (req: Request, res: Response) => {
      try {
        const { providerId } = req.params;
        const dias = parseInt(req.query.dias as string, 10) || 90;
        const items = await invimaService.getItemsPorVencer(providerId, dias);
        res.json({ data: items, total: items.length });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        res.status(500).json({ error: msg });
      }
    }
  );

  // ─── ALERTAS INVIMA ───

  /**
   * GET /api/invima/alertas
   * Listar alertas de farmacovigilancia/tecnovigilancia
   */
  router.get(
    '/invima/alertas',
    authMiddleware,
    rbacMiddleware(['super_admin', 'auditor', 'provider_admin']),
    async (req: Request, res: Response) => {
      try {
        const { tipo, numero, sinRevisar, limit } = req.query;
        const alertas = await invimaService.listAlertas(
          {
            tipo: tipo as string,
            numeroRegistro: numero as string,
            sinRevisar: sinRevisar === 'true',
          },
          parseInt(limit as string, 10) || 50
        );
        res.json({ data: alertas, total: alertas.length });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        res.status(500).json({ error: msg });
      }
    }
  );

  /**
   * POST /api/invima/alertas
   * Registrar una nueva alerta INVIMA
   */
  router.post(
    '/invima/alertas',
    authMiddleware,
    rbacMiddleware(['super_admin', 'auditor']),
    async (req: Request, res: Response) => {
      try {
        const { numeroRegistro, tipoAlerta, titulo, descripcion, severidad, fechaAlerta, fuente } = req.body;

        if (!tipoAlerta || !titulo || !fechaAlerta) {
          return res.status(400).json({ error: 'tipoAlerta, titulo y fechaAlerta son requeridos' });
        }

        const alerta = await invimaService.createAlerta({
          numeroRegistro,
          tipoAlerta,
          titulo,
          descripcion,
          severidad,
          fechaAlerta,
          fuente,
        });

        res.status(201).json({ data: alerta, message: 'Alerta registrada' });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        res.status(500).json({ error: msg });
      }
    }
  );

  /**
   * PUT /api/invima/alertas/:id/revisar
   * Marcar alerta como revisada
   */
  router.put(
    '/invima/alertas/:id/revisar',
    authMiddleware,
    rbacMiddleware(['super_admin', 'auditor']),
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const userId = (req as any).user?.id || (req as any).userId;
        const { accionTomada } = req.body;

        if (!accionTomada) {
          return res.status(400).json({ error: 'accionTomada es requerida' });
        }

        await invimaService.marcarAlertaRevisada(id, userId, accionTomada);
        res.json({ message: 'Alerta marcada como revisada' });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        res.status(500).json({ error: msg });
      }
    }
  );

  // ─── EXPORTAR CSV ───

  /**
   * GET /api/providers/:providerId/invima/export.csv
   * Exportar inventario INVIMA a CSV
   */
  router.get(
    '/providers/:providerId/invima/export.csv',
    authMiddleware,
    rbacMiddleware(['super_admin', 'auditor', 'provider_admin']),
    async (req: Request, res: Response) => {
      try {
        const { providerId } = req.params;
        const items = await invimaService.listProviderItems(providerId, {});

        const headers = ['Registro INVIMA', 'Producto', 'Nombre Comercial', 'Lote', 'Cantidad', 'Venc. Lote', 'Venc. Registro', 'Estado', 'Semáforo'];
        const rows = items.map((i: any) => [
          i.numero_registro || '',
          i.nombre_producto || '',
          i.nombre_comercial || '',
          i.lote_actual || '',
          i.cantidad_disponible || '',
          i.fecha_vencimiento_lote || '',
          i.vencimiento_registro || '',
          i.estado_registro || '',
          i.semaforo || '',
        ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));

        const csv = [headers.join(','), ...rows].join('\n');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="invima-${providerId}.csv"`);
        res.send('\uFEFF' + csv); // BOM para Excel
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ msg: 'Error exporting INVIMA CSV', error: msg });
        res.status(500).json({ error: msg });
      }
    }
  );

  return router;
}
