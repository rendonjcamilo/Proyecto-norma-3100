import { Pool } from 'pg';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

const RECOVERY_TOKEN_LENGTH = 64; // 64-char hex string = 48 random bytes
const RECOVERY_TOKEN_EXPIRY_MINUTES = 60; // 1 hour

/**
 * Password Recovery Service - handles password reset tokens and recovery flow
 */
export class PasswordRecoveryService {
  constructor(private pool: Pool) {}

  /**
   * Generate a cryptographically secure recovery token
   */
  generateRecoveryToken(): string {
    return crypto.randomBytes(Math.ceil(RECOVERY_TOKEN_LENGTH / 2)).toString('hex').slice(0, RECOVERY_TOKEN_LENGTH);
  }

  /**
   * Hash token using SHA-256 (tokens hashed before storage)
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Create password recovery token for user
   */
  async createRecoveryToken(userId: string): Promise<{ token: string; expiresAt: Date }> {
    const client = await this.pool.connect();

    try {
      const plainToken = this.generateRecoveryToken();
      const tokenHash = this.hashToken(plainToken);
      const expiresAt = new Date(Date.now() + RECOVERY_TOKEN_EXPIRY_MINUTES * 60 * 1000);
      const now = new Date();

      // Create recovery token record
      await client.query(
        `INSERT INTO password_recovery_tokens (id, user_id, token_hash, used, created_at, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [uuidv4(), userId, tokenHash, false, now, expiresAt]
      );

      logger.info({ user_id: userId }, 'Recovery token created');

      return { token: plainToken, expiresAt };
    } finally {
      client.release();
    }
  }

  /**
   * Validate recovery token (check expiry and usage)
   */
  async validateRecoveryToken(token: string, userId: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const tokenHash = this.hashToken(token);
      const now = new Date();

      const result = await this.pool.query(
        `SELECT id, used, expires_at FROM password_recovery_tokens
         WHERE user_id = $1 AND token_hash = $2`,
        [userId, tokenHash]
      );

      if (result.rows.length === 0) {
        return { valid: false, error: 'Token not found' };
      }

      const tokenRecord = result.rows[0];

      if (tokenRecord.used) {
        return { valid: false, error: 'Token already used' };
      }

      if (now > tokenRecord.expires_at) {
        return { valid: false, error: 'Token expired' };
      }

      return { valid: true };
    } catch (err) {
      logger.error({ error: err instanceof Error ? err.message : err }, 'Token validation error');
      throw err;
    }
  }

  /**
   * Consume (mark as used) recovery token
   */
  async consumeRecoveryToken(token: string, userId: string): Promise<void> {
    try {
      const tokenHash = this.hashToken(token);
      const now = new Date();

      await this.pool.query(
        `UPDATE password_recovery_tokens SET used = true, used_at = $1
         WHERE user_id = $2 AND token_hash = $3`,
        [now, userId, tokenHash]
      );

      logger.info({ user_id: userId }, 'Recovery token consumed');
    } catch (err) {
      logger.error({ error: err instanceof Error ? err.message : err }, 'Token consumption error');
      throw err;
    }
  }

  /**
   * Clean up expired tokens (maintenance job)
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const now = new Date();
      const result = await this.pool.query(
        'DELETE FROM password_recovery_tokens WHERE expires_at < $1',
        [now]
      );

      logger.info({ deletedCount: result.rowCount }, 'Expired tokens cleaned up');

      return result.rowCount || 0;
    } catch (err) {
      logger.error({ error: err instanceof Error ? err.message : err }, 'Token cleanup error');
      throw err;
    }
  }
}
