import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword, validatePasswordPolicy, checkPasswordHistory } from './password.service.js';
import { logger } from '../utils/logger.js';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: string;
  provider_id: string;
  first_name?: string;
  last_name?: string;
  status: 'active' | 'inactive';
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
    provider_id: string;
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

      // Create user
      const userId = uuidv4();
      const now = new Date();

      const result = await client.query(
        `INSERT INTO users (
          id, email, password_hash, role, provider_id, first_name, last_name,
          status, password_history, failed_login_attempts, locked_until, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id, email, role, provider_id, first_name, last_name, status,
                  password_history, failed_login_attempts, locked_until, created_at, updated_at`,
        [
          userId,
          data.email,
          passwordHash,
          'provider_admin',
          data.provider_id,
          data.first_name || null,
          data.last_name || null,
          'active',
          null, // password_history - use DB default
          0,
          null,
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
        role: user.role,
        provider_id: user.provider_id,
        first_name: user.first_name,
        last_name: user.last_name,
        status: user.status,
        password_history: JSON.parse(user.password_history),
        failed_login_attempts: user.failed_login_attempts,
        locked_until: user.locked_until,
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
        `SELECT id, email, password_hash, role, provider_id, first_name, last_name, status,
                password_history, failed_login_attempts, locked_until, created_at, updated_at
         FROM users WHERE email = $1`,
        [email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        email: row.email,
        password_hash: row.password_hash,
        role: row.role,
        provider_id: row.provider_id,
        first_name: row.first_name,
        last_name: row.last_name,
        status: row.status,
        password_history: JSON.parse(row.password_history),
        failed_login_attempts: row.failed_login_attempts,
        locked_until: row.locked_until,
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
        `SELECT id, email, password_hash, role, provider_id, first_name, last_name, status,
                password_history, failed_login_attempts, locked_until, created_at, updated_at
         FROM users WHERE id = $1`,
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
        role: row.role,
        provider_id: row.provider_id,
        first_name: row.first_name,
        last_name: row.last_name,
        status: row.status,
        password_history: JSON.parse(row.password_history),
        failed_login_attempts: row.failed_login_attempts,
        locked_until: row.locked_until,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    } catch (err) {
      logger.error({ error: err instanceof Error ? err.message : err }, 'Error fetching user by ID');
      throw err;
    }
  }

  /**
   * Update user password (and password history)
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

      // Check password history
      const isReused = await checkPasswordHistory(newPassword, user.password_history);
      if (isReused) {
        throw new Error('Cannot reuse password within last 5 changes');
      }

      // Hash new password
      const newHash = await hashPassword(newPassword);

      // Update password history (keep last 5)
      const updatedHistory = [user.password_hash, ...user.password_history.slice(0, 4)];

      const now = new Date();
      await this.pool.query(
        `UPDATE users SET password_hash = $1, password_history = $2, updated_at = $3 WHERE id = $4`,
        [newHash, JSON.stringify(updatedHistory), now, userId]
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
  async updateUserStatus(userId: string, status: 'active' | 'inactive'): Promise<void> {
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
   * Record failed login attempt
   */
  async recordFailedAttempt(userId: string): Promise<void> {
    try {
      const now = new Date();
      await this.pool.query(
        'UPDATE users SET failed_login_attempts = failed_login_attempts + 1, updated_at = $1 WHERE id = $2',
        [now, userId]
      );
    } catch (err) {
      logger.error({ error: err instanceof Error ? err.message : err }, 'Error recording failed attempt');
      throw err;
    }
  }

  /**
   * Clear failed login attempts and lock
   */
  async clearFailedAttempts(userId: string): Promise<void> {
    try {
      const now = new Date();
      await this.pool.query(
        'UPDATE users SET failed_login_attempts = 0, locked_until = NULL, updated_at = $1 WHERE id = $2',
        [now, userId]
      );
    } catch (err) {
      logger.error({ error: err instanceof Error ? err.message : err }, 'Error clearing failed attempts');
      throw err;
    }
  }

  /**
   * Lock user account after brute-force attempts
   */
  async lockUser(userId: string, lockDurationMinutes: number = 30): Promise<void> {
    try {
      const lockedUntil = new Date(Date.now() + lockDurationMinutes * 60 * 1000);
      const now = new Date();

      await this.pool.query(
        'UPDATE users SET locked_until = $1, updated_at = $2 WHERE id = $3',
        [lockedUntil, now, userId]
      );

      logger.warn({ user_id: userId, lockedUntil }, 'User account locked');
    } catch (err) {
      logger.error({ error: err instanceof Error ? err.message : err }, 'Error locking user');
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
      updates.push(`role = $${paramCount++}`);
      values.push(data.role);
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
      RETURNING id, email, role, provider_id, first_name, last_name, status, created_at, updated_at
    `;

    const result = await this.pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    logger.info({ userId }, 'User updated');
    return result.rows[0];
  }

  /**
   * Check if user account is locked
   */
  isAccountLocked(user: User): boolean {
    if (!user.locked_until) {
      return false;
    }

    const now = new Date();
    if (now < user.locked_until) {
      return true;
    }

    // Lock has expired, but we'll let the caller decide whether to auto-unlock
    return false;
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
