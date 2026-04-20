import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword, validatePasswordPolicy } from './password.service.js';
import { logger } from '../utils/logger.js';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: string;
  provider_id: string | null;
  first_name?: string;
  last_name?: string;
  status: 'active' | 'inactive' | 'suspended' | 'deleted';
  password_history: string[];
  failed_login_attempts: number;
  locked_until: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * User Service - handles user CRUD and authentication operations
 */
export class UserService {
  constructor(private pool: Pool) {}

  /**
   * Register a new user
   */
  async registerUser(data: {
    email: string;
    password: string;
    provider_id?: string | null;
    first_name?: string;
    last_name?: string;
  }): Promise<User> {
    const client = await this.pool.connect();

    try {
      // Validate email format
      if (!this.isValidEmail(data.email)) {
        throw new Error('Invalid email format');
      }

      // Check if email already exists
      const existingUser = await this.getUserByEmail(data.email);
      if (existingUser) {
        throw new Error('Email already registered');
      }

      // Validate password policy
      const passwordValidation = validatePasswordPolicy(data.password);
      if (!passwordValidation.valid) {
        throw new Error(`Invalid password: ${passwordValidation.errors.join('; ')}`);
      }

      // Verify provider exists (only if provider_id is set)
      if (data.provider_id) {
        const providerResult = await client.query(
          'SELECT id FROM providers WHERE id = $1',
          [data.provider_id]
        );
        if (providerResult.rows.length === 0) {
          throw new Error('Provider not found');
        }
      }

      // Hash password
      const passwordHash = await hashPassword(data.password);

      // Get the provider_admin role_id from database
      const roleResult = await client.query(
        `SELECT id FROM roles WHERE name = $1`,
        ['provider_admin']
      );
      const roleId = roleResult.rows.length > 0 ? roleResult.rows[0].id : null;

      // Create user
      const userId = uuidv4();
      const now = new Date();

      const result = await client.query(
        `INSERT INTO users (
          id, email, password_hash, first_name, last_name, provider_id,
          role_id, status, password_changed_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, email, first_name, last_name, provider_id, role_id, status, created_at, updated_at`,
        [
          userId,
          data.email,
          passwordHash,
          data.first_name || '',
          data.last_name || '',
          data.provider_id || null,
          roleId,
          'active',
          now,
          now,
          now,
        ]
      );

      const user = result.rows[0];

      logger.info({ user_id: userId, email: data.email }, 'User registered');

      return {
        id: user.id,
        email: user.email,
        password_hash: passwordHash,
        role: 'provider_admin',
        provider_id: user.provider_id,
        first_name: user.first_name,
        last_name: user.last_name,
        status: user.status,
        password_history: [],
        failed_login_attempts: 0,
        locked_until: null,
        created_at: user.created_at,
        updated_at: user.updated_at,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const result = await this.pool.query(
        `SELECT u.id, u.email, u.password_hash, u.provider_id, u.first_name, u.last_name, u.status,
                u.created_at, u.updated_at, r.name AS role
         FROM users u
         LEFT JOIN roles r ON u.role_id = r.id
         WHERE LOWER(u.email) = LOWER($1)`,
        [email]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        email: row.email,
        password_hash: row.password_hash,
        role: row.role || 'provider_admin',
        provider_id: row.provider_id,
        first_name: row.first_name,
        last_name: row.last_name,
        status: row.status,
        password_history: [],
        failed_login_attempts: 0,
        locked_until: null,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    } catch (err) {
      logger.error({ error: err instanceof Error ? err.message : err }, 'Error fetching user by email');
      throw err;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    try {
      const result = await this.pool.query(
        `SELECT u.id, u.email, u.password_hash, u.provider_id, u.first_name, u.last_name, u.status,
                u.created_at, u.updated_at, r.name AS role
         FROM users u
         LEFT JOIN roles r ON u.role_id = r.id
         WHERE u.id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        email: row.email,
        password_hash: row.password_hash,
        role: row.role || 'provider_admin',
        provider_id: row.provider_id,
        first_name: row.first_name,
        last_name: row.last_name,
        status: row.status,
        password_history: [],
        failed_login_attempts: 0,
        locked_until: null,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    } catch (err) {
      logger.error({ error: err instanceof Error ? err.message : err }, 'Error fetching user by ID');
      throw err;
    }
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, newPassword: string): Promise<void> {
    try {
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Validate password policy
      const validation = validatePasswordPolicy(newPassword);
      if (!validation.valid) {
        throw new Error(`Invalid password: ${validation.errors.join('; ')}`);
      }

      // Hash new password
      const newHash = await hashPassword(newPassword);

      const now = new Date();
      await this.pool.query(
        `UPDATE users SET password_hash = $1, password_changed_at = $2, updated_at = $3 WHERE id = $4`,
        [newHash, now, now, userId]
      );

      logger.info({ user_id: userId }, 'User password updated');
    } catch (err) {
      logger.error({ error: err instanceof Error ? err.message : err }, 'Error updating password');
      throw err;
    }
  }

  /**
   * Update user status
   */
  async updateUserStatus(userId: string, status: 'active' | 'inactive' | 'suspended' | 'deleted'): Promise<void> {
    try {
      const now = new Date();
      await this.pool.query(
        'UPDATE users SET status = $1, updated_at = $2 WHERE id = $3',
        [status, now, userId]
      );

      logger.info({ user_id: userId, status }, 'User status updated');
    } catch (err) {
      logger.error({ error: err instanceof Error ? err.message : err }, 'Error updating user status');
      throw err;
    }
  }

  /**
   * Delete a user by ID
   */
  async deleteUser(userId: string): Promise<void> {
    const result = await this.pool.query(
      'DELETE FROM users WHERE id = $1',
      [userId]
    );

    if (result.rowCount === 0) {
      throw new Error('User not found');
    }

    logger.info({ userId }, 'User deleted');
  }

  /**
   * Update a user by ID
   */
  async updateUser(userId: string, data: {
    first_name?: string;
    last_name?: string;
    role?: string;
    provider_id?: string;
  }): Promise<User> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.first_name !== undefined) {
      updates.push(`first_name = $${paramCount++}`);
      values.push(data.first_name || null);
    }
    if (data.last_name !== undefined) {
      updates.push(`last_name = $${paramCount++}`);
      values.push(data.last_name || null);
    }
    if (data.role !== undefined) {
      // Map API role format to DB role format
      const roleMap: { [key: string]: string } = {
        'super_admin': 'ADMIN',
        'auditor': 'AUDITOR',
        'provider_admin': 'PROVIDER_ADMIN',
      };
      const dbRoleName = roleMap[data.role] || data.role.toUpperCase();

      // Get role_id from roles table
      const roleResult = await this.pool.query(
        `SELECT id FROM roles WHERE UPPER(name) = $1`,
        [dbRoleName]
      );
      const roleId = roleResult.rows.length > 0 ? roleResult.rows[0].id : null;
      updates.push(`role_id = $${paramCount++}`);
      values.push(roleId);
    }
    if (data.provider_id !== undefined) {
      updates.push(`provider_id = $${paramCount++}`);
      values.push(data.provider_id || null);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    updates.push(`updated_at = $${paramCount++}`);
    values.push(new Date());
    values.push(userId);

    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, first_name, last_name, provider_id, role_id, status, created_at, updated_at
    `;

    const result = await this.pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const row = result.rows[0];

    // Get the role name and convert to API format
    let roleName = 'provider_admin';
    if (row.role_id) {
      const roleResult = await this.pool.query(
        `SELECT name FROM roles WHERE id = $1`,
        [row.role_id]
      );
      if (roleResult.rows.length > 0) {
        const dbRoleName = roleResult.rows[0].name;
        // Map DB role format back to API format
        const reverseRoleMap: { [key: string]: string } = {
          'ADMIN': 'super_admin',
          'AUDITOR': 'auditor',
          'PROVIDER_ADMIN': 'provider_admin',
        };
        roleName = reverseRoleMap[dbRoleName] || dbRoleName.toLowerCase();
      }
    }

    logger.info({ userId }, 'User updated');
    return {
      id: row.id,
      email: row.email,
      password_hash: '',
      role: roleName,
      provider_id: row.provider_id,
      first_name: row.first_name,
      last_name: row.last_name,
      status: row.status,
      password_history: [],
      failed_login_attempts: 0,
      locked_until: null,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
