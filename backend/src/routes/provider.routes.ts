/**
 * Provider Management API Routes
 * Handles provider CRUD, locations, service assignments, and bulk imports
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { rbacMiddleware } from '../middleware/role.middleware.js';
import { ProviderModel } from '../models/provider.model.js';
import { EventStore } from '../modules/events/EventStore.js';
import { validatePasswordPolicy, hashPassword } from '../services/password.service.js';
import { logger } from '../utils/logger.js';

export function createProviderRouter(pool: Pool, eventStore: EventStore): Router {
  const router = Router();
  const providerModel = new ProviderModel(pool);

  // ===== PROVIDER CRUD =====

  /**
   * POST /api/providers
   * Create a new provider
   * Only super_admin can create providers
   */
  router.post(
    '/providers',
    authMiddleware,
    rbacMiddleware(['super_admin']),
    async (req: Request, res: Response) => {
      try {
        const {
          rut,
          legal_name,
          trade_name,
          legal_entity_type,
          address,
          city,
          department,
          country,
          status,
          admin_email,
          admin_password,
          admin_first_name,
          admin_last_name,
        } = req.body;

        // Validate required provider fields
        if (!rut || !legal_name || !address || !city) {
          return res.status(400).json({ error: 'Missing required provider fields' });
        }

        // Validate required admin fields
        if (!admin_email || !admin_password || !admin_first_name || !admin_last_name) {
          return res.status(400).json({ error: 'Admin data (email, password, first_name, last_name) is required' });
        }

        // Validate email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(admin_email)) {
          return res.status(400).json({ error: 'Invalid admin email format' });
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

        // Validate password policy
        const passwordValidation = validatePasswordPolicy(admin_password);
        if (!passwordValidation.valid) {
          return res.status(400).json({
            error: `Invalid password: ${passwordValidation.errors.join('; ')}`,
          });
        }

        // Check if admin email already exists
        const existingUser = await pool.query(
          'SELECT id FROM users WHERE email = $1',
          [admin_email.toLowerCase()]
        );
        if (existingUser.rows.length > 0) {
          return res.status(409).json({ error: 'Email already registered' });
        }

        const user = (req as any).user;
        const client = await pool.connect();

        try {
          await client.query('BEGIN');

          // 1. Create provider
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
            created_by: /^[0-9a-f-]{36}$/.test(user?.user_id || '') ? user.user_id : null,
          });

          // 2. Create admin user for the provider
          const adminUserId = uuidv4();
          const passwordHash = await hashPassword(admin_password);
          const now = new Date();

          await client.query(
            `INSERT INTO users (
              id, email, password_hash, role, provider_id, first_name, last_name,
              status, password_history, failed_login_attempts, locked_until, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
              adminUserId,
              admin_email.toLowerCase(),
              passwordHash,
              'provider_admin',
              provider.id,
              admin_first_name,
              admin_last_name,
              'active',
              '[]',
              0,
              null,
              now,
              now,
            ]
          );

          // Commit transaction
          await client.query('COMMIT');

          // Emit events
          await eventStore.append({
            aggregateId: provider.id,
            aggregateType: 'provider',
            eventType: 'provider.created',
            payload: provider as any,
            userId: user?.user_id,
          });

          logger.info({
            msg: 'Provider created with admin user',
            provider_id: provider.id,
            rut: provider.rut,
            admin_id: adminUserId,
            admin_email,
            userId: user?.user_id,
            role: user?.role,
          });

          res.status(201).json({
            data: {
              provider,
              admin: {
                id: adminUserId,
                email: admin_email,
                first_name: admin_first_name,
                last_name: admin_last_name,
                role: 'provider_admin',
              },
            },
          });
        } catch (transactionErr) {
          await client.query('ROLLBACK');
          throw transactionErr;
        } finally {
          client.release();
        }
      } catch (err) {
        logger.error({ msg: 'Error creating provider', error: err instanceof Error ? err.message : String(err) });
        res.status(500).json({ error: 'Failed to create provider' });
      }
    }
  );

  /**
   * GET /api/providers
   * List providers with filters
   * super_admin sees all, auditor sees their assigned, provider_admin sees only their own
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

        let providers: any[] = [];

        if (role === 'super_admin') {
          // Super admin sees all providers
          providers = await providerModel.getProviders(role, user?.user_id, filters);
        } else if (role === 'auditor') {
          // Auditor sees only their assigned providers
          const result = await pool.query(
            `SELECT p.* FROM providers p
             INNER JOIN auditor_providers ap ON p.id = ap.provider_id
             WHERE ap.auditor_id = $1`,
            [user?.user_id]
          );
          providers = result.rows;
        } else if (role === 'provider_admin') {
          // Provider admin sees only their own provider
          const result = await pool.query(
            `SELECT * FROM providers WHERE id = $1`,
            [user?.provider_id]
          );
          providers = result.rows;
        }

        res.json({
          count: providers.length,
          data: providers,
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
   * RBAC: provider_admin (own), auditor (assigned), super_admin (all)
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

        if (user.role === 'provider_admin') {
          if (user.provider_id !== provider.id) {
            return res.status(403).json({ error: 'Access denied' });
          }
        }

        if (user.role === 'auditor') {
          const result = await pool.query(
            'SELECT 1 FROM auditor_providers WHERE auditor_id = $1 AND provider_id = $2',
            [user.user_id || user.id, provider.id]
          );

          if (result.rows.length === 0) {
            return res.status(403).json({
              error: 'Access denied',
              message: 'You are not assigned to audit this provider',
            });
          }
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
   * RBAC: provider_admin (own only), super_admin (any)
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
        if (user.role === 'provider_admin' && user.provider_id !== provider.id) {
          return res.status(403).json({ error: 'Access denied' });
        }

        // Validate required fields if provided
        if (req.body.address !== undefined && !req.body.address?.trim()) {
          return res.status(400).json({ error: 'Address cannot be empty' });
        }
        if (req.body.city !== undefined && !req.body.city?.trim()) {
          return res.status(400).json({ error: 'City cannot be empty' });
        }
        if (req.body.legal_name !== undefined && !req.body.legal_name?.trim()) {
          return res.status(400).json({ error: 'Legal name cannot be empty' });
        }

        const oldProvider = { ...provider };

        // Update provider
        const updated = await providerModel.updateProvider(req.params.id, {
          ...req.body,
          updated_by: user.user_id,
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
          userId: user.user_id,
        });

        logger.info({
          msg: 'Provider updated',
          provider_id: updated.id,
          userId: user.user_id,
        });

        res.json({ data: updated });
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
        if (user.role === 'provider_admin' && provider.created_by !== user.user_id) {
          return res.status(403).json({ error: 'Access denied' });
        }

        // Archive provider
        const archived = await providerModel.archiveProvider(req.params.id, user.user_id);

        // Emit event
        await eventStore.append({
          aggregateId: archived.id,
          aggregateType: 'provider',
          eventType: 'provider.archived',
          payload: archived as any,
          userId: user.user_id,
        });

        logger.info({
          msg: 'Provider archived',
          provider_id: archived.id,
          userId: user.user_id,
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

        const updated = await providerModel.updateProviderStatus(req.params.id, status, (req as any).user?.user_id);

        // Emit event
        await eventStore.append({
          aggregateId: updated.id,
          aggregateType: 'provider',
          eventType: 'provider.status_changed',
          payload: {
            old_status: provider.status,
            new_status: status,
          },
          userId: (req as any).user?.user_id,
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
        if (user.role === 'provider_admin' && provider.created_by !== user.user_id) {
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
          created_by: user.user_id,
        });

        // Emit event
        await eventStore.append({
          aggregateId: location.id,
          aggregateType: 'location',
          eventType: 'location.created',
          payload: location as any,
          userId: user.user_id,
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
        if (user.role === 'provider_admin' && provider.created_by !== user.user_id) {
          return res.status(403).json({ error: 'Access denied' });
        }

        const updated = await providerModel.updateLocation(req.params.location_id, {
          ...req.body,
          updated_by: user.user_id,
        });

        // Emit event
        await eventStore.append({
          aggregateId: updated.id,
          aggregateType: 'location',
          eventType: 'location.updated',
          payload: updated as any,
          userId: user.user_id,
        });

        res.json(updated);
      } catch (err) {
        logger.error({ msg: 'Error updating location', error: err instanceof Error ? err.message : String(err) });
        res.status(500).json({ error: 'Failed to update location' });
      }
    }
  );

  // ===== AUDITOR-PROVIDER MANAGEMENT =====

  /**
   * POST /api/providers/:providerId/assign-auditor
   * Assign an auditor to a provider (super_admin only)
   */
  router.post(
    '/providers/:providerId/assign-auditor',
    authMiddleware,
    rbacMiddleware(['super_admin']),
    async (req: Request, res: Response) => {
      try {
        const { auditorId } = req.body;

        if (!auditorId) {
          return res.status(400).json({ error: 'auditorId is required' });
        }

        const user = (req as any).user;

        // Verify provider exists
        const provider = await providerModel.getProviderById(req.params.providerId);
        if (!provider) {
          return res.status(404).json({ error: 'Provider not found' });
        }

        // Verify auditor exists
        const auditorResult = await pool.query(
          `SELECT id FROM users WHERE id = $1 AND role = 'auditor'`,
          [auditorId]
        );
        if (auditorResult.rows.length === 0) {
          return res.status(404).json({ error: 'Auditor not found' });
        }

        // Assign auditor to provider
        await pool.query(
          `INSERT INTO auditor_providers (auditor_id, provider_id, assigned_by)
           VALUES ($1, $2, $3)
           ON CONFLICT (auditor_id, provider_id) DO NOTHING`,
          [auditorId, req.params.providerId, user?.user_id]
        );

        logger.info({
          msg: 'Auditor assigned to provider',
          provider_id: req.params.providerId,
          auditor_id: auditorId,
          assigned_by: user?.user_id,
        });

        res.json({ success: true, message: 'Auditor assigned to provider' });
      } catch (err) {
        logger.error({
          msg: 'Error assigning auditor to provider',
          error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'Failed to assign auditor' });
      }
    }
  );

  /**
   * DELETE /api/providers/:providerId/auditors/:auditorId
   * Remove auditor from provider (super_admin only)
   */
  router.delete(
    '/providers/:providerId/auditors/:auditorId',
    authMiddleware,
    rbacMiddleware(['super_admin']),
    async (req: Request, res: Response) => {
      try {
        const user = (req as any).user;

        // Verify provider exists
        const provider = await providerModel.getProviderById(req.params.providerId);
        if (!provider) {
          return res.status(404).json({ error: 'Provider not found' });
        }

        // Remove auditor from provider
        const result = await pool.query(
          `DELETE FROM auditor_providers
           WHERE auditor_id = $1 AND provider_id = $2
           RETURNING *`,
          [req.params.auditorId, req.params.providerId]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Auditor not assigned to this provider' });
        }

        logger.info({
          msg: 'Auditor removed from provider',
          provider_id: req.params.providerId,
          auditor_id: req.params.auditorId,
          removed_by: user?.user_id,
        });

        res.json({ success: true, message: 'Auditor removed from provider' });
      } catch (err) {
        logger.error({
          msg: 'Error removing auditor from provider',
          error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'Failed to remove auditor' });
      }
    }
  );

  /**
   * GET /api/providers/:providerId/auditors
   * List auditors assigned to a provider
   */
  router.get(
    '/providers/:providerId/auditors',
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        // Verify provider exists
        const provider = await providerModel.getProviderById(req.params.providerId);
        if (!provider) {
          return res.status(404).json({ error: 'Provider not found' });
        }

        const result = await pool.query(
          `SELECT u.id, u.email, u.first_name, u.last_name, ap.assigned_at, ap.assigned_by
           FROM users u
           INNER JOIN auditor_providers ap ON u.id = ap.auditor_id
           WHERE ap.provider_id = $1
           ORDER BY ap.assigned_at DESC`,
          [req.params.providerId]
        );

        res.json({
          provider_id: req.params.providerId,
          count: result.rows.length,
          auditors: result.rows,
        });
      } catch (err) {
        logger.error({
          msg: 'Error fetching auditors for provider',
          error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'Failed to fetch auditors' });
      }
    }
  );

  /**
   * GET /api/auditors/:auditorId/providers
   * List providers assigned to an auditor
   */
  router.get(
    '/auditors/:auditorId/providers',
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        // Verify auditor exists
        const auditorResult = await pool.query(
          `SELECT id FROM users WHERE id = $1 AND role = 'auditor'`,
          [req.params.auditorId]
        );
        if (auditorResult.rows.length === 0) {
          return res.status(404).json({ error: 'Auditor not found' });
        }

        // Get all providers assigned to this auditor
        const result = await pool.query(
          `SELECT p.id, p.legal_name, p.rut, p.city, p.department, p.status, ap.assigned_at, ap.assigned_by
           FROM providers p
           INNER JOIN auditor_providers ap ON p.id = ap.provider_id
           WHERE ap.auditor_id = $1
           ORDER BY p.legal_name ASC`,
          [req.params.auditorId]
        );

        res.json({
          auditor_id: req.params.auditorId,
          count: result.rows.length,
          providers: result.rows,
        });
      } catch (err) {
        logger.error({
          msg: 'Error fetching providers for auditor',
          error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'Failed to fetch providers' });
      }
    }
  );

  return router;
}
