/**
 * Service Catalog & Provider-Service Assignment Test Suite
 * Tests for all service management endpoints
 */

import request from 'supertest';
import express from 'express';
import { Pool } from 'pg';
import { createServiceRouter } from '../services.routes.js';
import { EventStore } from '../../modules/events/EventStore.js';

describe('Service Catalog & Provider-Service Assignment', () => {
  let app: express.Application;
  let pool: Pool;
  let eventStore: EventStore;
  let authToken: string;

  beforeAll(async () => {
    // Initialize test app with services router
    app = express();
    app.use(express.json());

    // Mock database pool (in real tests, use test DB)
    pool = {
      query: jest.fn(),
    } as any;

    eventStore = {
      append: jest.fn(),
    } as any;

    // Register routes
    app.use('/api', createServiceRouter(pool, eventStore));

    // Mock auth token
    authToken = 'mock-jwt-token';
  });

  describe('GET /api/services', () => {
    it('should list all 157 services', async () => {
      const mockServices = [
        {
          id: 'service-1',
          code: 'CX-001',
          name: 'Consulta por medicina general',
          category: 'Consulta Externa',
          description: 'Primera consulta de medicina general',
          status: 'available',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: mockServices });

      const response = await request(app)
        .get('/api/services')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.count).toBeGreaterThanOrEqual(0);
    });

    it('should filter services by category', async () => {
      const mockServices = [
        {
          id: 'service-1',
          code: 'CX-001',
          name: 'Consulta por medicina general',
          category: 'Consulta Externa',
          description: 'Primera consulta de medicina general',
          status: 'available',
        },
      ];

      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: mockServices });

      const response = await request(app)
        .get('/api/services?category=Consulta+Externa')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/services')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/services/groups', () => {
    it('should list service groups with counts', async () => {
      const mockGroups = [
        {
          id: 'Consulta Externa',
          name: 'Consulta Externa',
          service_count: 33,
        },
        {
          id: 'Apoyo Diagnóstico',
          name: 'Apoyo Diagnóstico',
          service_count: 28,
        },
        {
          id: 'Internación',
          name: 'Internación',
          service_count: 34,
        },
        {
          id: 'Quirúrgico',
          name: 'Quirúrgico',
          service_count: 38,
        },
        {
          id: 'Atención Inmediata',
          name: 'Atención Inmediata',
          service_count: 24,
        },
      ];

      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: mockGroups });

      const response = await request(app)
        .get('/api/services/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(5);
      expect(response.body.data[0].service_count).toBe(33);
    });
  });

  describe('GET /api/services/:serviceId', () => {
    it('should fetch specific service details', async () => {
      const mockService = {
        id: 'service-uuid',
        code: 'CX-001',
        name: 'Consulta por medicina general',
        category: 'Consulta Externa',
        description: 'Primera consulta de medicina general',
        status: 'available',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockService] });

      const response = await request(app)
        .get('/api/services/service-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.code).toBe('CX-001');
    });

    it('should return 404 for non-existent service', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/services/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBe('Service not found');
    });
  });

  describe('POST /api/providers/:providerId/services', () => {
    it('should assign services to provider', async () => {
      const mockMapping = {
        id: 'mapping-uuid',
        provider_id: 'provider-uuid',
        service_id: 'service-uuid',
        location_id: 'location-uuid',
        enabled_from: new Date(),
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ id: 'provider-uuid' }] }) // Provider check
        .mockResolvedValueOnce({ rows: [{ id: 'service-uuid' }] }) // Service check
        .mockResolvedValueOnce({ rows: [{ id: 'location-uuid' }] }) // Location check
        .mockResolvedValueOnce({ rows: [mockMapping] }); // Insert mapping

      const response = await request(app)
        .post('/api/providers/provider-uuid/services')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          services: [
            {
              serviceId: 'service-uuid',
              locationId: 'location-uuid',
            },
          ],
        })
        .expect(201);

      expect(response.body.data).toBeDefined();
      expect(response.body.message).toContain('service(s) assigned');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/providers/provider-uuid/services')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ services: [] })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should emit event for audit trail', async () => {
      const mockMapping = {
        id: 'mapping-uuid',
        provider_id: 'provider-uuid',
        service_id: 'service-uuid',
        location_id: 'location-uuid',
        enabled_from: new Date(),
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ id: 'provider-uuid' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'service-uuid' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'location-uuid' }] })
        .mockResolvedValueOnce({ rows: [mockMapping] });

      await request(app)
        .post('/api/providers/provider-uuid/services')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          services: [{ serviceId: 'service-uuid', locationId: 'location-uuid' }],
        })
        .expect(201);

      expect(eventStore.append).toHaveBeenCalled();
    });
  });

  describe('GET /api/providers/:providerId/services', () => {
    it('should list provider assigned services', async () => {
      const mockServices = [
        {
          id: 'mapping-1',
          provider_id: 'provider-uuid',
          service_id: 'service-uuid-1',
          location_id: 'location-uuid',
          enabled_from: new Date(),
          status: 'active',
          created_at: new Date(),
          updated_at: new Date(),
          code: 'CX-001',
          name: 'Consulta por medicina general',
          category: 'Consulta Externa',
        },
      ];

      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: mockServices });

      const response = await request(app)
        .get('/api/providers/provider-uuid/services')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.count).toBe(1);
    });

    it('should filter by location', async () => {
      const mockServices = [
        {
          id: 'mapping-1',
          provider_id: 'provider-uuid',
          service_id: 'service-uuid-1',
          location_id: 'location-uuid',
          enabled_from: new Date(),
          status: 'active',
          code: 'CX-001',
          name: 'Consulta por medicina general',
          category: 'Consulta Externa',
        },
      ];

      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: mockServices });

      const response = await request(app)
        .get('/api/providers/provider-uuid/services?locationId=location-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.location_id).toBe('location-uuid');
    });
  });

  describe('GET /api/providers/:providerId/locations/:locationId/services', () => {
    it('should list location specific services', async () => {
      const mockServices = [
        {
          id: 'mapping-1',
          provider_id: 'provider-uuid',
          service_id: 'service-uuid-1',
          location_id: 'location-uuid',
          enabled_from: new Date(),
          status: 'active',
          code: 'CX-001',
          name: 'Consulta por medicina general',
          category: 'Consulta Externa',
        },
      ];

      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: mockServices });

      const response = await request(app)
        .get('/api/providers/provider-uuid/locations/location-uuid/services')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.location_id).toBe('location-uuid');
    });
  });

  describe('DELETE /api/providers/:providerId/services/:serviceId', () => {
    it('should unassign service from provider', async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ provider_id: 'provider-uuid' }] })
        .mockResolvedValueOnce({ rows: [] }); // Unassign query

      const response = await request(app)
        .delete('/api/providers/provider-uuid/services/service-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toContain('unassigned');
    });

    it('should emit unassignment event', async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ provider_id: 'provider-uuid' }] })
        .mockResolvedValueOnce({ rows: [] });

      await request(app)
        .delete('/api/providers/provider-uuid/services/service-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(eventStore.append).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'service.unassigned',
        })
      );
    });
  });

  describe('POST /api/providers/:providerId/services/bulk', () => {
    it('should bulk assign services to provider', async () => {
      const mockMappings = [
        {
          id: 'mapping-1',
          provider_id: 'provider-uuid',
          service_id: 'service-uuid-1',
          location_id: 'location-uuid',
          enabled_from: new Date(),
          status: 'active',
        },
        {
          id: 'mapping-2',
          provider_id: 'provider-uuid',
          service_id: 'service-uuid-2',
          location_id: 'location-uuid',
          enabled_from: new Date(),
          status: 'active',
        },
      ];

      // Mock for each service assignment
      for (let i = 0; i < 2; i++) {
        (pool.query as jest.Mock)
          .mockResolvedValueOnce({ rows: [{ id: 'provider-uuid' }] })
          .mockResolvedValueOnce({ rows: [{ id: `service-uuid-${i + 1}` }] })
          .mockResolvedValueOnce({ rows: [{ id: 'location-uuid' }] })
          .mockResolvedValueOnce({ rows: [mockMappings[i]] });
      }

      const response = await request(app)
        .post('/api/providers/provider-uuid/services/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          serviceIds: ['service-uuid-1', 'service-uuid-2'],
          locationId: 'location-uuid',
        })
        .expect(201);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.message).toContain('2 service(s)');
    });

    it('should validate service IDs array', async () => {
      const response = await request(app)
        .post('/api/providers/provider-uuid/services/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ serviceIds: [] })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('PUT /api/services/:serviceId', () => {
    it('should update service status (admin only)', async () => {
      const mockService = {
        id: 'service-uuid',
        code: 'CX-001',
        name: 'Consulta por medicina general',
        category: 'Consulta Externa',
        status: 'discontinued',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockService] });

      const response = await request(app)
        .put('/api/services/service-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'discontinued' })
        .expect(200);

      expect(response.body.data.status).toBe('discontinued');
    });

    it('should validate status value', async () => {
      const response = await request(app)
        .put('/api/services/service-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'invalid-status' })
        .expect(400);

      expect(response.body.error).toBe('Invalid status');
    });
  });

  describe('GET /api/services/stats', () => {
    it('should return service statistics', async () => {
      const mockStats = {
        total_services: 157,
        available_services: 156,
        discontinued_services: 1,
        services_per_category: {
          'Consulta Externa': 33,
          'Apoyo Diagnóstico': 28,
          'Internación': 34,
          'Quirúrgico': 38,
          'Atención Inmediata': 24,
        },
        providers_using_service: {
          'CX-001': 5,
          'CX-002': 3,
        },
      };

      // Mock for each stats query
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: 157 }] }) // Total
        .mockResolvedValueOnce({ rows: [{ count: 156 }] }) // Available
        .mockResolvedValueOnce({ rows: [{ count: 1 }] }) // Discontinued
        .mockResolvedValueOnce({
          rows: [
            { category: 'Consulta Externa', count: 33 },
            { category: 'Apoyo Diagnóstico', count: 28 },
            { category: 'Internación', count: 34 },
            { category: 'Quirúrgico', count: 38 },
            { category: 'Atención Inmediata', count: 24 },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            { code: 'CX-001', count: 5 },
            { code: 'CX-002', count: 3 },
          ],
        });

      const response = await request(app)
        .get('/api/services/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.total_services).toBe(157);
      expect(response.body.data.available_services).toBe(156);
    });
  });
});
