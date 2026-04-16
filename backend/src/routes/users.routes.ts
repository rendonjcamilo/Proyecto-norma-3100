import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { UserService } from '../services/user.service.js';
import { logger } from '../utils/logger.js';

export function createUsersRouter(pool: Pool): Router {
  const router = Router();
  const userService = new UserService(pool);

  /**
   * GET /api/users
   * List all users (super_admin only)
   */
  router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;

      // Only super_admin can list users
      if (user?.role !== 'super_admin') {
        res.status(403).json({ error: 'Forbidden', message: 'Only super_admin can list users' });
        return;
      }

      const result = await pool.query(`
        SELECT
          id, email, role, provider_id, first_name, last_name,
          status, created_at, updated_at
        FROM users
        ORDER BY created_at DESC
      `);

      res.json({ data: result.rows, total: result.rows.length });
    } catch (err) {
      logger.error({ error: err instanceof Error ? err.message : String(err) }, 'Error listing users');
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  /**
   * POST /api/users
   * Create a new user with role (super_admin only)
   * Body: { email, password, confirm_password, role, provider_id?, first_name?, last_name? }
   */
  router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;

      // Only super_admin can create users
      if (user?.role !== 'super_admin') {
        res.status(403).json({ error: 'Forbidden', message: 'Only super_admin can create users' });
        return;
      }

      const { email, password, confirm_password, role, provider_id, first_name, last_name } = req.body;

      // Validate input
      if (!email || !password || !confirm_password) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Email and password are required',
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

      // Validate role
      const validRoles = ['super_admin', 'auditor', 'provider_admin', 'viewer'];
      if (role && !validRoles.includes(role)) {
        res.status(400).json({
          error: 'Bad Request',
          message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
        });
        return;
      }

      // If role is provider_admin or viewer, provider_id is required
      if ((role === 'provider_admin' || role === 'viewer') && !provider_id) {
        res.status(400).json({
          error: 'Bad Request',
          message: `provider_id is required for role '${role}'`,
        });
        return;
      }

      // Create user with custom role
      const newUser = await userService.registerUser({
        email,
        password,
        provider_id: provider_id || null,
        first_name,
        last_name,
      });

      // If a different role was specified, update it
      if (role && role !== 'provider_admin') {
        await pool.query(
          'UPDATE users SET role = $1 WHERE id = $2',
          [role, newUser.id]
        );
      }

      logger.info({ user_id: newUser.id, email, role }, 'New user created by super_admin');

      res.status(201).json({
        data: {
          id: newUser.id,
          email: newUser.email,
          role: role || 'provider_admin',
          provider_id,
          first_name,
          last_name,
          status: 'active',
          created_at: newUser.created_at,
        },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);

      if (errorMessage.includes('Email already registered')) {
        res.status(409).json({ error: 'Conflict', message: 'Email already registered' });
      } else if (errorMessage.includes('Provider not found')) {
        res.status(404).json({ error: 'Not Found', message: 'Provider not found' });
      } else {
        logger.error({ error: errorMessage }, 'Error creating user');
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  });

  return router;
}
