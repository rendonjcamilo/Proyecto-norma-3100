import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validateUuidParam } from '../middleware/sanitize.middleware.js';
import { AuditorClientService } from '../services/AuditorClientService.js';
import { logger } from '../utils/logger.js';

export function createAuditorClientsRouter(pool: Pool): Router {
  const router = Router();
  const service = new AuditorClientService(pool);

  // Todos los endpoints requieren rol auditor o super_admin
  router.use(authMiddleware, requireRole(['auditor', 'super_admin']));

  /** GET /api/auditor/clients */
  router.get('/auditor/clients', async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const clients = await service.list(userId);
      res.json({ data: clients, total: clients.length });
    } catch (err) {
      logger.error({ msg: 'Error listando clientes del auditor', error: err });
      res.status(500).json({ error: 'Error interno' });
    }
  });

  /** POST /api/auditor/clients */
  router.post('/auditor/clients', async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { legal_name } = req.body;
      if (!legal_name?.trim()) {
        return res.status(400).json({ error: 'El nombre del prestador es obligatorio' });
      }
      const client = await service.create(userId, req.body);
      res.status(201).json({ data: client });
    } catch (err) {
      logger.error({ msg: 'Error creando cliente del auditor', error: err });
      res.status(500).json({ error: 'Error interno' });
    }
  });

  /** PUT /api/auditor/clients/:id */
  router.put('/auditor/clients/:id', validateUuidParam('id'), async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { legal_name } = req.body;
      if (!legal_name?.trim()) {
        return res.status(400).json({ error: 'El nombre del prestador es obligatorio' });
      }
      const client = await service.update(userId, req.params.id, req.body);
      if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
      res.json({ data: client });
    } catch (err) {
      logger.error({ msg: 'Error actualizando cliente del auditor', error: err });
      res.status(500).json({ error: 'Error interno' });
    }
  });

  /** DELETE /api/auditor/clients/:id */
  router.delete('/auditor/clients/:id', validateUuidParam('id'), async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const deleted = await service.delete(userId, req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Cliente no encontrado' });
      res.status(204).send();
    } catch (err) {
      logger.error({ msg: 'Error eliminando cliente del auditor', error: err });
      res.status(500).json({ error: 'Error interno' });
    }
  });

  return router;
}
