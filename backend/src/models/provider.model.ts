/**
 * Provider Data Model
 * Represents healthcare organizations in the Norma 3100 compliance system
 */

import { Pool, QueryResult } from 'pg';

export interface Provider {
  id: string;
  rut: string;
  legal_name: string;
  trade_name?: string;
  legal_entity_type: string;
  address: string;
  city: string;
  department: string;
  country: string;
  status: 'active' | 'suspended' | 'revoked' | 'pending';
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
  parent_id?: string;
}

export interface Location {
  id: string;
  provider_id: string;
  address: string;
  city: string;
  department: string;
  country: string;
  location_type: 'main' | 'branch' | 'satellite';
  status: 'active' | 'inactive' | 'closed';
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
}

export interface Service {
  id: string;
  code: string;
  name: string;
  category: string;
  description?: string;
  status: 'available' | 'discontinued' | 'suspended';
  created_at: Date;
  updated_at: Date;
}

export interface ServiceMapping {
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
}

export class ProviderModel {
  constructor(private pool: Pool) {}

  /**
   * Get all providers with role-based filtering
   */
  async getProviders(
    role?: string,
    user_id?: string,
    filters?: {
      status?: string;
      city?: string;
      created_after?: Date;
      created_before?: Date;
      search?: string;
    }
  ): Promise<Provider[]> {
    let query = 'SELECT * FROM providers WHERE 1=1';
    const params: any[] = [];

    // Role-based filtering
    if (role === 'provider_admin' && user_id) {
      query += ` AND created_by = $${params.length + 1}`;
      params.push(user_id);
    } else if (role === 'auditor') {
      // Auditors see assigned providers (via user provider_id)
      query += ` AND id IN (SELECT provider_id FROM users WHERE id = $${params.length + 1})`;
      params.push(user_id);
    }
    // super_admin sees all (no filter)

    // Additional filters
    if (filters?.status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(filters.status);
    }

    if (filters?.city) {
      query += ` AND city ILIKE $${params.length + 1}`;
      params.push(`%${filters.city}%`);
    }

    if (filters?.created_after) {
      query += ` AND created_at >= $${params.length + 1}`;
      params.push(filters.created_after);
    }

    if (filters?.created_before) {
      query += ` AND created_at <= $${params.length + 1}`;
      params.push(filters.created_before);
    }

    if (filters?.search) {
      query += ` AND (rut ILIKE $${params.length + 1} OR legal_name ILIKE $${params.length + 1})`;
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  /**
   * Get provider by ID
   */
  async getProviderById(id: string): Promise<Provider | null> {
    const result = await this.pool.query(
      'SELECT * FROM providers WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Get provider by RUT
   */
  async getProviderByRUT(rut: string): Promise<Provider | null> {
    const result = await this.pool.query(
      'SELECT * FROM providers WHERE rut = $1',
      [rut]
    );
    return result.rows[0] || null;
  }

  /**
   * Create a new provider
   */
  async createProvider(data: Omit<Provider, 'id' | 'created_at' | 'updated_at'>): Promise<Provider> {
    const query = `
      INSERT INTO providers (rut, legal_name, trade_name, legal_entity_type, address, city, department, country, status, created_by, updated_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      data.rut,
      data.legal_name,
      data.trade_name || null,
      data.legal_entity_type,
      data.address,
      data.city,
      data.department,
      data.country,
      data.status,
      data.created_by || null,
      data.updated_by || null,
    ]);

    return result.rows[0];
  }

  /**
   * Update provider
   */
  async updateProvider(id: string, data: Partial<Provider>): Promise<Provider> {
    const fields: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (!['id', 'created_at', 'updated_at', 'created_by'].includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        params.push(value);
        paramCount++;
      }
    });

    fields.push(`updated_at = NOW()`);
    params.push(id);

    const query = `
      UPDATE providers
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.pool.query(query, params);
    return result.rows[0];
  }

  /**
   * Update provider status
   */
  async updateProviderStatus(id: string, status: string, updated_by?: string): Promise<Provider> {
    const result = await this.pool.query(
      `UPDATE providers
       SET status = $1, updated_at = NOW(), updated_by = $3
       WHERE id = $2
       RETURNING *`,
      [status, id, updated_by || null]
    );

    if (result.rows.length === 0) {
      throw new Error(`Provider ${id} not found`);
    }

    return result.rows[0];
  }

  /**
   * Soft delete provider (archive)
   */
  async archiveProvider(id: string, updated_by?: string): Promise<Provider> {
    const result = await this.pool.query(
      `UPDATE providers
       SET status = 'revoked', updated_at = NOW(), updated_by = $2
       WHERE id = $1
       RETURNING *`,
      [id, updated_by || null]
    );

    if (result.rows.length === 0) {
      throw new Error(`Provider ${id} not found`);
    }

    return result.rows[0];
  }

  /**
   * Get provider locations
   */
  async getLocations(provider_id: string): Promise<Location[]> {
    const result = await this.pool.query(
      'SELECT * FROM locations WHERE provider_id = $1 ORDER BY created_at',
      [provider_id]
    );
    return result.rows;
  }

  /**
   * Get location by ID
   */
  async getLocationById(location_id: string): Promise<Location | null> {
    const result = await this.pool.query(
      'SELECT * FROM locations WHERE id = $1',
      [location_id]
    );
    return result.rows[0] || null;
  }

  /**
   * Create location
   */
  async createLocation(data: Omit<Location, 'id' | 'created_at' | 'updated_at'>): Promise<Location> {
    const query = `
      INSERT INTO locations (provider_id, address, city, department, country, location_type, status, metadata, created_by, updated_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      data.provider_id,
      data.address,
      data.city,
      data.department,
      data.country,
      data.location_type,
      data.status,
      data.metadata ? JSON.stringify(data.metadata) : '{}',
      data.created_by || null,
      data.updated_by || null,
    ]);

    return result.rows[0];
  }

  /**
   * Update location
   */
  async updateLocation(id: string, data: Partial<Location>): Promise<Location> {
    const fields: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (!['id', 'created_at', 'updated_at', 'created_by', 'provider_id'].includes(key)) {
        if (key === 'metadata') {
          fields.push(`${key} = $${paramCount}`);
          params.push(JSON.stringify(value || {}));
        } else {
          fields.push(`${key} = $${paramCount}`);
          params.push(value);
        }
        paramCount++;
      }
    });

    fields.push(`updated_at = NOW()`);
    params.push(id);

    const query = `
      UPDATE locations
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.pool.query(query, params);
    return result.rows[0];
  }

  /**
   * Get provider services
   */
  async getProviderServices(provider_id: string, location_id?: string): Promise<Service[]> {
    let query = `
      SELECT DISTINCT s.* FROM services s
      JOIN services_enabled se ON s.id = se.service_id
      WHERE se.provider_id = $1 AND se.status = 'active'
    `;
    const params: any[] = [provider_id];

    if (location_id) {
      query += ` AND se.location_id = $2`;
      params.push(location_id);
    }

    query += ' ORDER BY s.category, s.name';

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  /**
   * Assign service to location
   */
  async assignServiceToLocation(
    provider_id: string,
    service_id: string,
    location_id: string,
    created_by?: string
  ): Promise<ServiceMapping> {
    const query = `
      INSERT INTO services_enabled (provider_id, service_id, location_id, enabled_from, status, created_by)
      VALUES ($1, $2, $3, CURRENT_DATE, 'active', $4)
      ON CONFLICT (provider_id, service_id, location_id) DO UPDATE SET status = 'active', created_at = NOW()
      RETURNING *
    `;

    const result = await this.pool.query(query, [provider_id, service_id, location_id, created_by || null]);
    return result.rows[0];
  }

  /**
   * Unassign service from location
   */
  async unassignServiceFromLocation(provider_id: string, service_id: string, location_id: string): Promise<void> {
    await this.pool.query(
      `UPDATE services_enabled
       SET status = 'inactive', enabled_until = CURRENT_DATE
       WHERE provider_id = $1 AND service_id = $2 AND location_id = $3`,
      [provider_id, service_id, location_id]
    );
  }
}
