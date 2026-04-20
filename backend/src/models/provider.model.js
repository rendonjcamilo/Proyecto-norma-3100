/**
 * Provider Data Model
 * Represents healthcare organizations in the Norma 3100 compliance system
 */
export class ProviderModel {
    constructor(pool) {
        this.pool = pool;
    }
    /**
     * Get all providers with role-based filtering
     */
    async getProviders(role, user_id, filters) {
        let query = 'SELECT * FROM providers WHERE 1=1';
        const params = [];
        // Role-based filtering
        if (role === 'provider_admin' && user_id) {
            query += ` AND created_by = $${params.length + 1}`;
            params.push(user_id);
        }
        else if (role === 'auditor') {
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
    async getProviderById(id) {
        const result = await this.pool.query('SELECT * FROM providers WHERE id = $1', [id]);
        return result.rows[0] || null;
    }
    /**
     * Get provider by RUT
     */
    async getProviderByRUT(rut) {
        const result = await this.pool.query('SELECT * FROM providers WHERE rut = $1', [rut]);
        return result.rows[0] || null;
    }
    /**
     * Create a new provider
     */
    async createProvider(data) {
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
    async updateProvider(id, data) {
        const fields = [];
        const params = [];
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
    async updateProviderStatus(id, status, updated_by) {
        const result = await this.pool.query(`UPDATE providers
       SET status = $1, updated_at = NOW(), updated_by = $3
       WHERE id = $2
       RETURNING *`, [status, id, updated_by || null]);
        if (result.rows.length === 0) {
            throw new Error(`Provider ${id} not found`);
        }
        return result.rows[0];
    }
    /**
     * Soft delete provider (archive)
     */
    async archiveProvider(id, updated_by) {
        const result = await this.pool.query(`UPDATE providers
       SET status = 'revoked', updated_at = NOW(), updated_by = $2
       WHERE id = $1
       RETURNING *`, [id, updated_by || null]);
        if (result.rows.length === 0) {
            throw new Error(`Provider ${id} not found`);
        }
        return result.rows[0];
    }
    /**
     * Get provider locations
     */
    async getLocations(provider_id) {
        const result = await this.pool.query('SELECT * FROM locations WHERE provider_id = $1 ORDER BY created_at', [provider_id]);
        return result.rows;
    }
    /**
     * Get location by ID
     */
    async getLocationById(location_id) {
        const result = await this.pool.query('SELECT * FROM locations WHERE id = $1', [location_id]);
        return result.rows[0] || null;
    }
    /**
     * Create location
     */
    async createLocation(data) {
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
    async updateLocation(id, data) {
        const fields = [];
        const params = [];
        let paramCount = 1;
        Object.entries(data).forEach(([key, value]) => {
            if (!['id', 'created_at', 'updated_at', 'created_by', 'provider_id'].includes(key)) {
                if (key === 'metadata') {
                    fields.push(`${key} = $${paramCount}`);
                    params.push(JSON.stringify(value || {}));
                }
                else {
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
    async getProviderServices(provider_id, location_id) {
        let query = `
      SELECT DISTINCT s.* FROM services s
      JOIN services_enabled se ON s.id = se.service_id
      WHERE se.provider_id = $1 AND se.status = 'active'
    `;
        const params = [provider_id];
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
    async assignServiceToLocation(provider_id, service_id, location_id, created_by) {
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
    async unassignServiceFromLocation(provider_id, service_id, location_id) {
        await this.pool.query(`UPDATE services_enabled
       SET status = 'inactive', enabled_until = CURRENT_DATE
       WHERE provider_id = $1 AND service_id = $2 AND location_id = $3`, [provider_id, service_id, location_id]);
    }
}
