import { Router, Request, Response } from 'express';
import {
  generateAccessToken,
  generateRefreshToken,
  validateToken,
  decodeToken,
  isTokenExpired,
} from '../services/jwt.service.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { logger } from '../utils/logger.js';

const router = Router();

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
