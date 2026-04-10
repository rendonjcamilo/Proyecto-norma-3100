import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import {
  generateAccessToken,
  generateRefreshToken,
  validateToken,
  decodeToken,
  isTokenExpired,
} from '../services/jwt.service.js';
import { validatePasswordPolicy, comparePassword } from '../services/password.service.js';
import { UserService } from '../services/user.service.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Initialize UserService with database pool
// Note: In production, this should be dependency-injected
let userService: UserService;
export function setUserService(pool: Pool) {
  userService = new UserService(pool);
}

/**
 * POST /auth/register
 * Register a new user
 * Body: { email, password, confirm_password, provider_id, first_name?, last_name? }
 * Response: { user_id, email, role, created_at } or error
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, confirm_password, provider_id, first_name, last_name } = req.body;

    // Validate input
    if (!email || !password || !confirm_password || !provider_id) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Email, password, confirm_password, and provider_id are required',
      });
      return;
    }

    if (password !== confirm_password) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Passwords do not match',
      });
      return;
    }

    // Validate password policy
    const passwordValidation = validatePasswordPolicy(password);
    if (!passwordValidation.valid) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Password does not meet complexity requirements',
        details: passwordValidation.errors,
      });
      return;
    }

    // Register user
    const user = await userService.registerUser({
      email,
      password,
      provider_id,
      first_name,
      last_name,
    });

    // TODO: Send welcome email

    logger.info({ user_id: user.id, email }, 'User registered successfully');

    res.status(201).json({
      user_id: user.id,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      message: 'User registered successfully',
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';

    if (error.includes('already registered')) {
      res.status(409).json({
        error: 'Conflict',
        message: 'Email already registered',
      });
    } else if (error.includes('Provider not found')) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid provider ID',
      });
    } else if (error.includes('Invalid password')) {
      res.status(400).json({
        error: 'Bad Request',
        message: error,
      });
    } else {
      logger.error({ error }, 'Registration error');
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to register user',
      });
    }
  }
});

/**
 * POST /auth/login
 * Login user and return JWT tokens
 * Body: { email, password, remember_me? }
 * Response: { access_token, refresh_token, expires_in, user } or error
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Email and password are required',
      });
      return;
    }

    // Get user by email
    const user = await userService.getUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists
      logger.warn({ email }, 'Login attempt with non-existent email');
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
      return;
    }

    // Check if account is locked
    if (userService.isAccountLocked(user)) {
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Account is temporarily locked due to too many failed attempts',
      });
      return;
    }

    // Check if user is active
    if (user.status !== 'active') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Account is not active',
      });
      return;
    }

    // Compare password
    const passwordMatches = await comparePassword(password, user.password_hash);
    if (!passwordMatches) {
      // Record failed attempt
      await userService.recordFailedAttempt(user.id);

      // Check if should lock account (5 failed attempts)
      const updatedUser = await userService.getUserById(user.id);
      if (updatedUser && updatedUser.failed_login_attempts >= 5) {
        await userService.lockUser(user.id);
      }

      logger.warn({ email }, 'Login attempt with incorrect password');
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
      return;
    }

    // Clear failed attempts on successful login
    await userService.clearFailedAttempts(user.id);

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.role, user.provider_id);
    const refreshToken = generateRefreshToken(user.id);

    // TODO: Create session in Redis

    logger.info({ user_id: user.id, email }, 'User logged in successfully');

    res.status(200).json({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 3600,
      token_type: 'Bearer',
      user: {
        user_id: user.id,
        email: user.email,
        role: user.role,
        provider_id: user.provider_id,
      },
    });
  } catch (err) {
    logger.error({ error: err instanceof Error ? err.message : err }, 'Login error');
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Login failed',
    });
  }
});

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 * Body: { refresh_token }
 * Response: { access_token, refresh_token, expires_in }
 */
router.post('/refresh', (req: Request, res: Response): void => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Refresh token is required',
      });
      return;
    }

    // Validate refresh token
    const result = validateToken(refresh_token);
    if (!result.valid) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired refresh token',
      });
      return;
    }

    const claims = result.claims;
    if (!claims || ('type' in claims && claims.type !== 'refresh')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token type',
      });
      return;
    }

    // Check if token is expired
    if (isTokenExpired(refresh_token)) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Refresh token has expired',
      });
      return;
    }

    const user_id = claims.user_id;

    // TODO: In production, mark old refresh token as used in database
    // For now, we're implementing the basic rotation mechanism
    // Old token JTI should be added to Redis revocation set by the session service

    // Decode to get role and provider_id (refresh token doesn't have these)
    // In a real scenario, we'd fetch from database
    // For now, we'll need to reconstruct from a session or add to refresh token
    const role = 'provider_admin'; // Placeholder - will be fetched from DB in real implementation
    const provider_id = ''; // Placeholder - will be fetched from DB in real implementation

    // Generate new tokens
    const newAccessToken = generateAccessToken(user_id, role, provider_id);
    const newRefreshToken = generateRefreshToken(user_id);

    logger.info({ user_id }, 'Tokens refreshed');

    res.status(200).json({
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      expires_in: 3600,
      token_type: 'Bearer',
    });
  } catch (err) {
    logger.error({ error: err instanceof Error ? err.message : err }, 'Refresh token error');
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to refresh token',
    });
  }
});

/**
 * GET /auth/verify
 * Verify the provided access token (debug endpoint)
 * Headers: Authorization: Bearer <token>
 * Response: { valid, claims } or { valid, error }
 */
router.get('/verify', authMiddleware, (req: Request, res: Response): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Missing Authorization header',
      });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = decodeToken(token);

    if (!decoded) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Unable to decode token',
      });
      return;
    }

    res.status(200).json({
      valid: true,
      claims: decoded,
      user: req.user,
    });
  } catch (err) {
    logger.error({ error: err instanceof Error ? err.message : err }, 'Verify token error');
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to verify token',
    });
  }
});

/**
 * POST /auth/logout
 * Logout user and revoke tokens
 * Headers: Authorization: Bearer <token>
 */
router.post('/logout', authMiddleware, (req: Request, res: Response): void => {
  try {
    const user_id = req.user?.user_id;

    // TODO: In production:
    // 1. Add token JTI to Redis revocation set
    // 2. Clear session from Redis
    // 3. Log audit event

    logger.info({ user_id }, 'User logged out');

    res.status(200).json({
      message: 'Logged out successfully',
    });
  } catch (err) {
    logger.error({ error: err instanceof Error ? err.message : err }, 'Logout error');
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to logout',
    });
  }
});

export default router;
