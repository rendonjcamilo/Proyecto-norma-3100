/**
 * Service Management Service
 * Handles Norma 3100 service catalog operations and provider-service assignments
 */

import { Pool, QueryResult } from 'pg';

export interface ServiceCatalogItem {
  id: string;
  code: string;
  name: string;
  category: string;
  description?: string;
  complexity?: string;
  standard_count?: number;
  status: 'available' | 'discontinued' | 'suspended';
  created_at: Date;
  updated_at: Date;
}

export interface ServiceGroup {
  id: string;
  name: string;
  description?: string;
  service_count: number;
}

export interface ProviderServiceMapping {
  id: string;
  provider_id: string;
  service_id: string;
  location_id?: string;
  enabled_from: Date;
  enabled_until?: Date;
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  service?: ServiceCatalogItem;
}

export class ServiceService {
  constructor(private pool: Pool) {}

  /**
   * Get all services in the catalog
   */
  async getAllServices(filters?: {
    category?: string;
    status?: string;
    search?: string;
  }): Promise<ServiceCatalogItem[]> {
    let query = 'SELECT * FROM services WHERE 1=1';
    const params: any[] = [];

    if (filters?.category) {
      query += ` AND category = $${params.length + 1}`;
      params.push(filters.category);
    }

    if (filters?.status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(filters.status);
    }

    if (filters?.search) {
      query += ` AND (name ILIKE $${params.length + 1} OR code ILIKE $${params.length + 1})`;
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY category, code';

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  /**
   * Get service by ID
   */
  async getServiceById(serviceId: string): Promise<ServiceCatalogItem | null> {
    const result = await this.pool.query(
      'SELECT * FROM services WHERE id = $1',
      [serviceId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get service by code
   */
  async getServiceByCode(code: string): Promise<ServiceCatalogItem | null> {
    const result = await this.pool.query(
      'SELECT * FROM services WHERE code = $1',
      [code]
    );
    return result.rows[0] || null;
  }

  /**
   * Get service groups with counts
   */
  async getServiceGroups(): Promise<ServiceGroup[]> {
    const result = await this.pool.query(`
      SELECT
        category as id,
        category as name,
        COUNT(*) as service_count
      FROM services
      WHERE status = 'available'
      GROUP BY category
      ORDER BY category
    `);
    return result.rows;
  }

  /**
   * Get services by category/group
   */
  async getServicesByCategory(category: string): Promise<ServiceCatalogItem[]> {
    const result = await this.pool.query(
      `SELECT * FROM services
       WHERE category = $1
       ORDER BY code`,
      [category]
    );
    return result.rows;
  }

  /**
   * Update service status (availability)
   */
  async updateServiceStatus(
    serviceId: string,
    status: 'available' | 'discontinued' | 'suspended',
    updatedBy?: string
  ): Promise<ServiceCatalogItem> {
    const result = await this.pool.query(
      `UPDATE services
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, serviceId]
    );

    if (!result.rows[0]) {
      throw new Error('Service not found');
    }

    return result.rows[0];
  }

  /**
   * Assign service to provider location
   */
  async assignServiceToProvider(
    providerId: string,
    serviceId: string,
    locationId?: string,
    createdBy?: string
  ): Promise<ProviderServiceMapping> {
    // Verify provider exists
    const providerResult = await this.pool.query(
      'SELECT id FROM providers WHERE id = $1',
      [providerId]
    );
    if (!providerResult.rows[0]) {
      throw new Error('Provider not found');
    }

    // Verify service exists
    const serviceResult = await this.pool.query(
      'SELECT id FROM services WHERE id = $1',
      [serviceId]
    );
    if (!serviceResult.rows[0]) {
      throw new Error('Service not found');
    }

    // Verify location exists if provided
    if (locationId) {
      const locationResult = await this.pool.query(
        'SELECT id FROM locations WHERE id = $1 AND provider_id = $2',
        [locationId, providerId]
      );
      if (!locationResult.rows[0]) {
        throw new Error('Location not found for this provider');
      }
    }

    // Insert or update service assignment
    const query = `
      INSERT INTO services_enabled (provider_id, service_id, location_id, enabled_from, status, created_by)
      VALUES ($1, $2, $3, CURRENT_DATE, 'active', $4)
      ON CONFLICT (provider_id, service_id, location_id)
      DO UPDATE SET status = 'active', updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const result = await this.pool.query(query, [providerId, serviceId, locationId || null, createdBy || null]);
    return result.rows[0];
  }

  /**
   * Unassign service from provider location
   */
  async unassignServiceFromProvider(
    providerId: string,
    serviceId: string,
    locationId?: string
  ): Promise<void> {
    const query = `
      UPDATE services_enabled
      SET status = 'inactive', enabled_until = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP
      WHERE provider_id = $1 AND service_id = $2 AND location_id = $3
    `;

    await this.pool.query(query, [providerId, serviceId, locationId || null]);
  }

  /**
   * Get provider's assigned services
   */
  async getProviderServices(
    providerId: string,
    locationId?: string,
    filters?: {
      status?: string;
      category?: string;
    }
  ): Promise<ProviderServiceMapping[]> {
    let query = `
      SELECT
        se.*,
        s.id as service_id,
        s.code,
        s.name,
        s.category,
        s.description,
        s.status as service_status
      FROM services_enabled se
      JOIN services s ON se.service_id = s.id
      WHERE se.provider_id = $1
    `;
    const params: any[] = [providerId];

    if (locationId) {
      query += ` AND se.location_id = $${params.length + 1}`;
      params.push(locationId);
    }

    if (filters?.status) {
      query += ` AND se.status = $${params.length + 1}`;
      params.push(filters.status);
    }

    if (filters?.category) {
      query += ` AND s.category = $${params.length + 1}`;
      params.push(filters.category);
    }

    query += ' ORDER BY s.category, s.code';

    const result = await this.pool.query(query, params);
    return result.rows.map(row => ({
      ...row,
      service: {
        id: row.service_id,
        code: row.code,
        name: row.name,
        category: row.category,
        description: row.description,
        status: row.service_status,
        created_at: row.created_at,
        updated_at: row.updated_at,
      },
    }));
  }

  /**
   * Get location's assigned services
   */
  async getLocationServices(
    providerId: string,
    locationId: string
  ): Promise<ProviderServiceMapping[]> {
    return this.getProviderServices(providerId, locationId);
  }

  /**
   * Count services assigned to provider
   */
  async countProviderServices(providerId: string, locationId?: string): Promise<number> {
    let query = 'SELECT COUNT(*) as count FROM services_enabled WHERE provider_id = $1 AND status = \'active\'';
    const params: any[] = [providerId];

    if (locationId) {
      query += ` AND location_id = $${params.length + 1}`;
      params.push(locationId);
    }

    const result = await this.pool.query(query, params);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Bulk assign services to provider
   */
  async bulkAssignServices(
    providerId: string,
    serviceIds: string[],
    locationId?: string,
    createdBy?: string
  ): Promise<ProviderServiceMapping[]> {
    if (!serviceIds || serviceIds.length === 0) {
      return [];
    }

    const results: ProviderServiceMapping[] = [];

    for (const serviceId of serviceIds) {
      try {
        const mapping = await this.assignServiceToProvider(
          providerId,
          serviceId,
          locationId,
          createdBy
        );
        results.push(mapping);
      } catch (error) {
        // Log error but continue with next service
        console.error(`Failed to assign service ${serviceId}:`, error);
      }
    }

    return results;
  }

  /**
   * Get service statistics
   */
  async getServiceStatistics(): Promise<{
    total_services: number;
    available_services: number;
    discontinued_services: number;
    services_per_category: Record<string, number>;
    providers_using_service: Record<string, number>;
  }> {
    // Total services
    const totalResult = await this.pool.query('SELECT COUNT(*) as count FROM services');
    const total_services = parseInt(totalResult.rows[0].count, 10);

    // Available services
    const availableResult = await this.pool.query(
      "SELECT COUNT(*) as count FROM services WHERE status = 'available'"
    );
    const available_services = parseInt(availableResult.rows[0].count, 10);

    // Discontinued services
    const discontinuedResult = await this.pool.query(
      "SELECT COUNT(*) as count FROM services WHERE status = 'discontinued'"
    );
    const discontinued_services = parseInt(discontinuedResult.rows[0].count, 10);

    // Services per category
    const categoryResult = await this.pool.query(`
      SELECT category, COUNT(*) as count FROM services GROUP BY category
    `);
    const services_per_category: Record<string, number> = {};
    categoryResult.rows.forEach(row => {
      services_per_category[row.category] = parseInt(row.count, 10);
    });

    // Providers using each service
    const providersResult = await this.pool.query(`
      SELECT s.code, COUNT(DISTINCT se.provider_id) as count
      FROM services s
      LEFT JOIN services_enabled se ON s.id = se.service_id AND se.status = 'active'
      GROUP BY s.id, s.code
    `);
    const providers_using_service: Record<string, number> = {};
    providersResult.rows.forEach(row => {
      providers_using_service[row.code] = parseInt(row.count, 10);
    });

    return {
      total_services,
      available_services,
      discontinued_services,
      services_per_category,
      providers_using_service,
    };
  }

  /**
   * Verify service assignment
   */
  async verifyServiceAssignment(
    providerId: string,
    serviceId: string,
    locationId?: string
  ): Promise<boolean> {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM services_enabled
        WHERE provider_id = $1 AND service_id = $2
        AND location_id = $3 AND status = 'active'
      ) as exists
    `;

    const result = await this.pool.query(query, [providerId, serviceId, locationId || null]);
    return result.rows[0].exists;
  }
}
