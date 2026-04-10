/**
 * Provider Management API Routes
 * Handles provider CRUD, locations, service assignments, and bulk imports
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { rbacMiddleware } from '../middleware/role.middleware.js';
import { ProviderModel } from '../models/provider.model.js';
import { EventStore } from '../modules/events/EventStore.js';
import { logger } from '../utils/logger.js';

export function createProviderRouter(pool: Pool, eventStore: EventStore): Router {
  const router = Router();
  const providerModel = new ProviderModel(pool);

  // ===== PROVIDER CRUD =====

  /**
   * POST /api/providers
   * Create a new provider
   */
  router.post(
    '/providers',
    authMiddleware,
    rbacMiddleware(['super_admin', 'provider_admin']),
    async (req: Request, res: Response) => {
      try {
        const { rut, legal_name, trade_name, legal_entity_type, address, city, department, country, status } =
          req.body;

        // Validate required fields
        if (!rut || !legal_name || !address || !city) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check for duplicate RUT
        const existing = await providerModel.getProviderByRUT(rut);
        if (existing) {
          return res.status(409).json({ error: 'Provider with this RUT already exists' });
        }

        // Validate Colombian RUT format (basic)
        if (!/^\d{5,13}(-\d)?$/.test(rut)) {
          return res.status(400).json({ error: 'Invalid RUT format' });
        }

        // Create provider
        const provider = await providerModel.createProvider({
          rut,
          legal_name,
          trade_name,
          legal_entity_type: legal_entity_type || 'healthcare_organization',
          address,
          city,
          department,
          country: country || 'Colombia',
          status: status || 'active',
          created_by: (req as any).user?.id,
        });

        // Emit event
        await eventStore.append({
          aggregateId: provider.id,
          aggregateType: 'provider',
          eventType: 'provider.created',
          payload: provider as any,
          userId: (req as any).user?.id,
        });

        logger.info({
          msg: 'Provider created',
          provider_id: provider.id,
          rut: provider.rut,
          userId: (req as any).user?.id,
        });

        res.status(201).json(provider);
      } catch (err) {
        logger.error({ msg: 'Error creating provider', error: err instanceof Error ? err.message : String(err) });
        res.status(500).json({ error: 'Failed to create provider' });
      }
    }
  );

  /**
   * GET /api/providers
   * List providers with filters
   */
  router.get(
    '/providers',
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const user = (req as any).user;
        const role = user?.role;

        const filters = {
          status: req.query.status as string,
          city: req.query.city as string,
          search: req.query.search as string,
          created_after: req.query.created_after ? new Date(req.query.created_after as string) : undefined,
          created_before: req.query.created_before ? new Date(req.query.created_before as string) : undefined,
        };

        const providers = await providerModel.getProviders(role, user?.id, filters);

        res.json({
          count: providers.length,
          providers,
        });
      } catch (err) {
        logger.error({ msg: 'Error fetching providers', error: err instanceof Error ? err.message : String(err) });
        res.status(500).json({ error: 'Failed to fetch providers' });
      }
    }
  );

  /**
   * GET /api/providers/:id
   * Get provider by ID
   */
  router.get(
    '/providers/:id',
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const provider = await providerModel.getProviderById(req.params.id);

        if (!provider) {
          return res.status(404).json({ error: 'Provider not found' });
        }

        // Check RBAC: provider_admin can only see own, auditor sees assigned
        const user = (req as any).user;
        if (user.role === 'provider_admin' && provider.created_by !== user.id) {
          return res.status(403).json({ error: 'Access denied' });
        }

        // Get related data
        const locations = await providerModel.getLocations(provider.id);

        res.json({
          ...provider,
          locations,
        });
      } catch (err) {
        logger.error({ msg: 'Error fetching provider', error: err instanceof Error ? err.message : String(err) });
        res.status(500).json({ error: 'Failed to fetch provider' });
      }
    }
  );

  /**
   * PUT /api/providers/:id
   * Update provider
   */
  router.put(
    '/providers/:id',
    authMiddleware,
    rbacMiddleware(['super_admin', 'provider_admin']),
    async (req: Request, res: Response) => {
      try {
        const provider = await providerModel.getProviderById(req.params.id);

        if (!provider) {
          return res.status(404).json({ error: 'Provider not found' });
        }

        // Check RBAC
        const user = (req as any).user;
        if (user.role === 'provider_admin' && provider.created_by !== user.id) {
          return res.status(403).json({ error: 'Access denied' });
        }

        const oldProvider = { ...provider };

        // Update provider
        const updated = await providerModel.updateProvider(req.params.id, {
          ...req.body,
          updated_by: user.id,
        });

        // Emit event
        await eventStore.append({
          aggregateId: updated.id,
          aggregateType: 'provider',
          eventType: 'provider.updated',
          payload: {
            before: oldProvider,
            after: updated,
          },
          userId: user.id,
        });

        logger.info({
          msg: 'Provider updated',
          provider_id: updated.id,
          userId: user.id,
        });

        res.json(updated);
      } catch (err) {
        logger.error({ msg: 'Error updating provider', error: err instanceof Error ? err.message : String(err) });
        res.status(500).json({ error: 'Failed to update provider' });
      }
    }
  );

  /**
   * DELETE /api/providers/:id
   * Soft delete provider (archive)
   */
  router.delete(
    '/providers/:id',
    authMiddleware,
    rbacMiddleware(['super_admin', 'provider_admin']),
    async (req: Request, res: Response) => {
      try {
        const provider = await providerModel.getProviderById(req.params.id);

        if (!provider) {
          return res.status(404).json({ error: 'Provider not found' });
        }

        // Check RBAC
        const user = (req as any).user;
        if (user.role === 'provider_admin' && provider.created_by !== user.id) {
          return res.status(403).json({ error: 'Access denied' });
        }

        // Archive provider
        const archived = await providerModel.archiveProvider(req.params.id, user.id);

        // Emit event
        await eventStore.append({
          aggregateId: archived.id,
          aggregateType: 'provider',
          eventType: 'provider.archived',
          payload: archived as any,
          userId: user.id,
        });

        logger.info({
          msg: 'Provider archived',
          provider_id: archived.id,
          userId: user.id,
        });

        res.json({ success: true, provider: archived });
      } catch (err) {
        logger.error({ msg: 'Error deleting provider', error: err instanceof Error ? err.message : String(err) });
        res.status(500).json({ error: 'Failed to delete provider' });
      }
    }
  );

  /**
   * PUT /api/providers/:id/status
   * Change provider status
   */
  router.put(
    '/providers/:id/status',
    authMiddleware,
    rbacMiddleware(['super_admin']),
    async (req: Request, res: Response) => {
      try {
        const { status } = req.body;

        if (!status || !['active', 'suspended', 'revoked'].includes(status)) {
          return res.status(400).json({ error: 'Invalid status' });
        }

        const provider = await providerModel.getProviderById(req.params.id);
        if (!provider) {
          return res.status(404).json({ error: 'Provider not found' });
        }

        const updated = await providerModel.updateProviderStatus(req.params.id, status, (req as any).user?.id);

        // Emit event
        await eventStore.append({
          aggregateId: updated.id,
          aggregateType: 'provider',
          eventType: 'provider.status_changed',
          payload: {
            old_status: provider.status,
            new_status: status,
          },
          userId: (req as any).user?.id,
        });

        logger.info({
          msg: 'Provider status changed',
          provider_id: updated.id,
          new_status: status,
        });

        res.json(updated);
      } catch (err) {
        logger.error({ msg: 'Error updating status', error: err instanceof Error ? err.message : String(err) });
        res.status(500).json({ error: 'Failed to update status' });
      }
    }
  );

  // ===== LOCATION MANAGEMENT =====

  /**
   * POST /api/providers/:id/locations
   * Create location for provider
   */
  router.post(
    '/providers/:id/locations',
    authMiddleware,
    rbacMiddleware(['super_admin', 'provider_admin']),
    async (req: Request, res: Response) => {
      try {
        const { address, city, department, location_type } = req.body;

        if (!address || !city || !location_type) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const provider = await providerModel.getProviderById(req.params.id);
        if (!provider) {
          return res.status(404).json({ error: 'Provider not found' });
        }

        // Check RBAC
        const user = (req as any).user;
        if (user.role === 'provider_admin' && provider.created_by !== user.id) {
          return res.status(403).json({ error: 'Access denied' });
        }

        const location = await providerModel.createLocation({
          provider_id: req.params.id,
          address,
          city,
          department: department || provider.department,
          country: provider.country,
          location_type: location_type || 'branch',
          status: 'active',
          created_by: user.id,
        });

        // Emit event
        await eventStore.append({
          aggregateId: location.id,
          aggregateType: 'location',
          eventType: 'location.created',
          payload: location as any,
          userId: user.id,
        });

        logger.info({
          msg: 'Location created',
          location_id: location.id,
          provider_id: req.params.id,
        });

        res.status(201).json(location);
      } catch (err) {
        logger.error({ msg: 'Error creating location', error: err instanceof Error ? err.message : String(err) });
        res.status(500).json({ error: 'Failed to create location' });
      }
    }
  );

  /**
   * GET /api/providers/:id/locations
   * List locations for provider
   */
  router.get(
    '/providers/:id/locations',
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const provider = await providerModel.getProviderById(req.params.id);
        if (!provider) {
          return res.status(404).json({ error: 'Provider not found' });
        }

        const locations = await providerModel.getLocations(req.params.id);

        res.json({
          provider_id: req.params.id,
          count: locations.length,
          locations,
        });
      } catch (err) {
        logger.error({ msg: 'Error fetching locations', error: err instanceof Error ? err.message : String(err) });
        res.status(500).json({ error: 'Failed to fetch locations' });
      }
    }
  );

  /**
   * PUT /api/providers/:provider_id/locations/:location_id
   * Update location
   */
  router.put(
    '/providers/:provider_id/locations/:location_id',
    authMiddleware,
    rbacMiddleware(['super_admin', 'provider_admin']),
    async (req: Request, res: Response) => {
      try {
        const location = await providerModel.getLocationById(req.params.location_id);
        if (!location) {
          return res.status(404).json({ error: 'Location not found' });
        }

        const provider = await providerModel.getProviderById(location.provider_id);
        if (!provider) {
          return res.status(404).json({ error: 'Provider not found' });
        }

        // Check RBAC
        const user = (req as any).user;
        if (user.role === 'provider_admin' && provider.created_by !== user.id) {
          return res.status(403).json({ error: 'Access denied' });
        }

        const updated = await providerModel.updateLocation(req.params.location_id, {
          ...req.body,
          updated_by: user.id,
        });

        // Emit event
        await eventStore.append({
          aggregateId: updated.id,
          aggregateType: 'location',
          eventType: 'location.updated',
          payload: updated as any,
          userId: user.id,
        });

        res.json(updated);
      } catch (err) {
        logger.error({ msg: 'Error updating location', error: err instanceof Error ? err.message : String(err) });
        res.status(500).json({ error: 'Failed to update location' });
      }
    }
  );

  return router;
}
