import bcrypt from 'bcrypt';
import { logger } from '../utils/logger.js';

// Bcrypt configuration
export const BCRYPT_COST_FACTOR = 13;
const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 128;

// Common weak passwords blocklist
const WEAK_PASSWORDS = new Set([
  'password', 'admin', '123456', 'qwerty', 'letmein',
  'welcome', 'password123', 'admin123', 'test', 'test123',
  '11111111', '1234567890', 'password1', 'admin@123',
]);

/**
 * Password validation result
 */
export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate password against complexity policy
 * Requirements:
 * - Minimum 12 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 digit
 * - At least 1 special character (!@#$%^&*)
 */
export function validatePasswordPolicy(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (!password) {
    return { valid: false, errors: ['Password is required'] };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    errors.push(`Password must not exceed ${MAX_PASSWORD_LENGTH} characters`);
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter (A-Z)');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter (a-z)');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one digit (0-9)');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&* etc.)');
  }

  if (WEAK_PASSWORDS.has(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a stronger password');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Hash a password using bcrypt with cost factor 13
 * Produces 250-500ms hash time on standard hardware
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const validation = validatePasswordPolicy(password);
    if (!validation.valid) {
      throw new Error(`Invalid password: ${validation.errors.join('; ')}`);
    }

    const startTime = Date.now();
    const hash = await bcrypt.hash(password, BCRYPT_COST_FACTOR);
    const duration = Date.now() - startTime;

    logger.debug({ duration: `${duration}ms` }, 'Password hashed');

    // Log warning if hash time is outside expected range
    if (duration < 200 || duration > 600) {
      logger.warn(
        { duration: `${duration}ms`, cost: BCRYPT_COST_FACTOR },
        'Password hash time outside expected range (250-500ms)'
      );
    }

    return hash;
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ error }, 'Password hashing failed');
    throw err;
  }
}

/**
 * Compare plaintext password against hash using bcrypt (timing-safe)
 */
export async function comparePassword(plainPassword: string, hash: string): Promise<boolean> {
  try {
    const startTime = Date.now();
    const matches = await bcrypt.compare(plainPassword, hash);
    const duration = Date.now() - startTime;

    logger.debug({ duration: `${duration}ms`, match: matches }, 'Password compared');

    return matches;
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ error }, 'Password comparison failed');
    throw err;
  }
}

/**
 * Check if password is in history (prevent reuse)
 * Compares plaintext against array of old hashes
 */
export async function checkPasswordHistory(
  newPassword: string,
  oldPasswordHashes: string[]
): Promise<boolean> {
  if (!oldPasswordHashes || oldPasswordHashes.length === 0) {
    return false; // No history, not a reuse
  }

  try {
    for (const oldHash of oldPasswordHashes) {
      const isReused = await comparePassword(newPassword, oldHash);
      if (isReused) {
        logger.warn({}, 'Password reuse detected');
        return true; // Password was reused
      }
    }
    return false; // Password is not in history
  } catch (err) {
    logger.error({ error: err instanceof Error ? err.message : err }, 'Password history check failed');
    throw err;
  }
}

/**
 * Generate password policy requirements description
 * Useful for showing to users on registration/password change forms
 */
export function getPasswordPolicyDescription(): {
  minLength: number;
  maxLength: number;
  requirements: string[];
} {
  return {
    minLength: MIN_PASSWORD_LENGTH,
    maxLength: MAX_PASSWORD_LENGTH,
    requirements: [
      `Minimum ${MIN_PASSWORD_LENGTH} characters`,
      'At least 1 uppercase letter (A-Z)',
      'At least 1 lowercase letter (a-z)',
      'At least 1 digit (0-9)',
      'At least 1 special character (!@#$%^&*)',
    ],
  };
}
