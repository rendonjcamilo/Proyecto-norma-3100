/**
 * Service Catalog Management API Routes
 * Handles service catalog queries, provider-service assignments, and service management
 * Norma 3100 service taxonomy: 157 services across 5 groups
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { rbacMiddleware } from '../middleware/role.middleware.js';
import { ServiceService } from '../services/ServiceService.js';
import { EventStore } from '../modules/events/EventStore.js';
import { logger } from '../utils/logger.js';

export function createServiceRouter(pool: Pool, eventStore: EventStore): Router {
  const router = Router();
  const serviceService = new ServiceService(pool);

  // ===== SERVICE CATALOG QUERIES =====

  /**
   * GET /api/services
   * List all 157 services in the catalog with optional filters
   * Response: Array of services with code, name, category, description, status
   */
  router.get('/services', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { category, status, search } = req.query;

      const services = await serviceService.getAllServices({
        category: category as string,
        status: status as string,
        search: search as string,
      });

      res.status(200).json({
        data: services,
        count: services.length,
        categories: [...new Set(services.map(s => s.category))],
      });
    } catch (error) {
      logger.error({ msg: 'Error fetching services', error: (error as Error).message });
      res.status(500).json({ error: 'Failed to fetch services' });
    }
  });

  /**
   * GET /api/services/groups
   * List service groups (5 groups per Norma 3100) with service counts
   */
  router.get('/services/groups', authMiddleware, async (req: Request, res: Response) => {
    try {
      const groups = await serviceService.getServiceGroups();

      res.status(200).json({
        data: groups,
        count: groups.length,
      });
    } catch (error) {
      logger.error({ msg: 'Error fetching service groups', error: (error as Error).message });
      res.status(500).json({ error: 'Failed to fetch service groups' });
    }
  });

  /**
   * GET /api/services/:serviceId
   * Get specific service details
   */
  router.get('/services/:serviceId', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { serviceId } = req.params;

      const service = await serviceService.getServiceById(serviceId);
      if (!service) {
        return res.status(404).json({ error: 'Service not found' });
      }

      res.status(200).json({ data: service });
    } catch (error) {
      logger.error({ msg: 'Error fetching service', error: (error as Error).message });
      res.status(500).json({ error: 'Failed to fetch service' });
    }
  });

  /**
   * GET /api/services/stats
   * Service catalog statistics (total count, per group, provider distribution)
   */
  router.get('/services/stats', authMiddleware, async (req: Request, res: Response) => {
    try {
      const stats = await serviceService.getServiceStatistics();

      res.status(200).json({ data: stats });
    } catch (error) {
      logger.error({ msg: 'Error fetching service stats', error: (error as Error).message });
      res.status(500).json({ error: 'Failed to fetch service statistics' });
    }
  });

  /**
   * PUT /api/services/:serviceId
   * Update service availability status (admin only)
   * Payload: { status: 'available' | 'discontinued' | 'suspended' }
   */
  router.put(
    '/services/:serviceId',
    authMiddleware,
    rbacMiddleware(['super_admin']),
    async (req: Request, res: Response) => {
      try {
        const { serviceId } = req.params;
        const { status } = req.body;
        const userId = (req as any).userId;

        if (!status || !['available', 'discontinued', 'suspended'].includes(status)) {
          return res.status(400).json({ error: 'Invalid status' });
        }

        const service = await serviceService.updateServiceStatus(serviceId, status, userId);

        // Emit event for audit trail
        await eventStore.append({
          aggregateId: serviceId,
          aggregateType: 'Service',
          eventType: 'service.status_changed',
          payload: {
            service_code: service.code,
            service_name: service.name,
            old_status: 'unknown',
            new_status: status,
          },
          metadata: {
            userId,
            timestamp: new Date(),
            source: 'service.routes',
          },
        });

        res.status(200).json({
          message: 'Service status updated',
          data: service,
        });
      } catch (error) {
        logger.error({ msg: 'Error updating service', error: (error as Error).message });
        res.status(500).json({ error: 'Failed to update service' });
      }
    }
  );

  // ===== PROVIDER-SERVICE ASSIGNMENT =====

  /**
   * POST /api/providers/:providerId/services
   * Assign services to provider/location
   * Payload: { services: [{ serviceId, locationId? }] }
   * RBAC: provider_admin can assign own services, auditor read-only, super_admin can assign any
   */
  router.post(
    '/providers/:providerId/services',
    authMiddleware,
    rbacMiddleware(['super_admin']),
    async (req: Request, res: Response) => {
      try {
        const { providerId } = req.params;
        const { services } = req.body;
        const userId = (req as any).userId;
        const userRole = (req as any).userRole;

        // Validate role access
        if (userRole === 'provider_admin') {
          // Check if provider_admin owns this provider
          const userResult = await pool.query(
            'SELECT provider_id FROM users WHERE id = $1',
            [userId]
          );
          if (userResult.rows[0]?.provider_id !== providerId) {
            return res.status(403).json({ error: 'Access denied: not authorized for this provider' });
          }
        }

        if (!services || !Array.isArray(services)) {
          return res.status(400).json({ error: 'Services array required' });
        }

        const results = [];

        for (const { serviceId, locationId } of services) {
          if (!serviceId) {
            return res.status(400).json({ error: 'Service ID required for each service' });
          }

          const mapping = await serviceService.assignServiceToProvider(
            providerId,
            serviceId,
            locationId,
            userId
          );

          // Emit event for audit trail
          await eventStore.append({
            aggregateId: providerId,
            aggregateType: 'Provider',
            eventType: 'service.assigned',
            payload: {
              provider_id: providerId,
              service_id: serviceId,
              location_id: locationId,
              assigned_by: userId,
            },
            metadata: {
              userId,
              timestamp: new Date(),
              source: 'service.routes',
            },
          });

          results.push(mapping);
        }

        res.status(201).json({
          message: `${results.length} service(s) assigned to provider`,
          data: results,
        });
      } catch (error) {
        logger.error({ msg: 'Error assigning services', error: (error as Error).message });
        res.status(500).json({ error: (error as Error).message });
      }
    }
  );

  /**
   * GET /api/providers/:providerId/services
   * Get services assigned to provider (with optional location filter)
   * Query: ?locationId=xxx&category=xxx&status=active
   */
  router.get(
    '/providers/:providerId/services',
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const { providerId } = req.params;
        const { locationId, category, status } = req.query;
        const userRole = (req as any).userRole;
        const userId = (req as any).userId;

        // Role-based access control
        if (userRole === 'provider_admin') {
          const userResult = await pool.query(
            'SELECT provider_id FROM users WHERE id = $1',
            [userId]
          );
          if (userResult.rows[0]?.provider_id !== providerId) {
            return res.status(403).json({ error: 'Access denied' });
          }
        }

        const services = await serviceService.getProviderServices(
          providerId,
          locationId as string,
          {
            status: status as string,
            category: category as string,
          }
        );

        res.status(200).json({
          data: services,
          count: services.length,
          provider_id: providerId,
          location_id: locationId || null,
        });
      } catch (error) {
        logger.error({ msg: 'Error fetching provider services', error: (error as Error).message });
        res.status(500).json({ error: 'Failed to fetch provider services' });
      }
    }
  );

  /**
   * GET /api/providers/:providerId/locations/:locationId/services
   * Get services assigned to specific provider location
   */
  router.get(
    '/providers/:providerId/locations/:locationId/services',
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const { providerId, locationId } = req.params;
        const userRole = (req as any).userRole;
        const userId = (req as any).userId;

        // Role-based access control
        if (userRole === 'provider_admin') {
          const userResult = await pool.query(
            'SELECT provider_id FROM users WHERE id = $1',
            [userId]
          );
          if (userResult.rows[0]?.provider_id !== providerId) {
            return res.status(403).json({ error: 'Access denied' });
          }
        }

        const services = await serviceService.getLocationServices(providerId, locationId);

        res.status(200).json({
          data: services,
          count: services.length,
          provider_id: providerId,
          location_id: locationId,
        });
      } catch (error) {
        logger.error({ msg: 'Error fetching location services', error: (error as Error).message });
        res.status(500).json({ error: 'Failed to fetch location services' });
      }
    }
  );

  /**
   * DELETE /api/providers/:providerId/services/:serviceId
   * Unassign service from provider (soft delete - marks as inactive)
   * Query: ?locationId=xxx (optional, to unassign from specific location)
   */
  router.delete(
    '/providers/:providerId/services/:serviceId',
    authMiddleware,
    rbacMiddleware(['super_admin']),
    async (req: Request, res: Response) => {
      try {
        const { providerId, serviceId } = req.params;
        const { locationId } = req.query;
        const userId = (req as any).userId;
        const userRole = (req as any).userRole;

        // Validate role access
        if (userRole === 'provider_admin') {
          const userResult = await pool.query(
            'SELECT provider_id FROM users WHERE id = $1',
            [userId]
          );
          if (userResult.rows[0]?.provider_id !== providerId) {
            return res.status(403).json({ error: 'Access denied' });
          }
        }

        await serviceService.unassignServiceFromProvider(
          providerId,
          serviceId,
          locationId as string
        );

        // Emit event for audit trail
        await eventStore.append({
          aggregateId: providerId,
          aggregateType: 'Provider',
          eventType: 'service.unassigned',
          payload: {
            provider_id: providerId,
            service_id: serviceId,
            location_id: locationId,
            unassigned_by: userId,
          },
          metadata: {
            userId,
            timestamp: new Date(),
            source: 'service.routes',
          },
        });

        res.status(200).json({
          message: 'Service unassigned from provider',
        });
      } catch (error) {
        logger.error({ msg: 'Error unassigning service', error: (error as Error).message });
        res.status(500).json({ error: 'Failed to unassign service' });
      }
    }
  );

  /**
   * POST /api/providers/:providerId/services/bulk
   * Bulk assign services to provider
   * Payload: { serviceIds: [uuid1, uuid2, ...], locationId? }
   */
  router.post(
    '/providers/:providerId/services/bulk',
    authMiddleware,
    rbacMiddleware(['super_admin']),
    async (req: Request, res: Response) => {
      try {
        const { providerId } = req.params;
        const { serviceIds, locationId } = req.body;
        const userId = (req as any).userId;
        const userRole = (req as any).userRole;

        // Validate role access
        if (userRole === 'provider_admin') {
          const userResult = await pool.query(
            'SELECT provider_id FROM users WHERE id = $1',
            [userId]
          );
          if (userResult.rows[0]?.provider_id !== providerId) {
            return res.status(403).json({ error: 'Access denied' });
          }
        }

        if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
          return res.status(400).json({ error: 'Service IDs array required' });
        }

        const results = await serviceService.bulkAssignServices(
          providerId,
          serviceIds,
          locationId,
          userId
        );

        // Emit event for audit trail
        await eventStore.append({
          aggregateId: providerId,
          aggregateType: 'Provider',
          eventType: 'services.bulk_assigned',
          payload: {
            provider_id: providerId,
            service_count: results.length,
            location_id: locationId,
            assigned_by: userId,
          },
          metadata: {
            userId,
            timestamp: new Date(),
            source: 'service.routes',
          },
        });

        res.status(201).json({
          message: `${results.length} service(s) assigned to provider`,
          data: results,
        });
      } catch (error) {
        logger.error({ msg: 'Error bulk assigning services', error: (error as Error).message });
        res.status(500).json({ error: (error as Error).message });
      }
    }
  );

  return router;
}
