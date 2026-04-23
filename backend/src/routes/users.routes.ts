import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { UserService } from '../services/user.service.js';
import { logger } from '../utils/logger.js';
import ExcelJS from 'exceljs';

export function createUsersRouter(pool: Pool): Router {
  const router = Router();
  const userService = new UserService(pool);

  /**
   * GET /api/users
   * List all users (super_admin and auditor)
   * Auditor can list to find auditors for notifications
   */
  router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;

      // Allow super_admin and auditor to list users
      if (user?.role !== 'super_admin' && user?.role !== 'auditor') {
        res.status(403).json({ error: 'Forbidden', message: 'Only super_admin and auditor can list users' });
        return;
      }

      const result = await pool.query(`
        SELECT
          u.id, u.email, LOWER(r.name) AS role, u.provider_id, u.first_name, u.last_name,
          u.status, u.created_at, u.updated_at
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        ORDER BY u.created_at DESC
      `);

      res.json({ data: result.rows, total: result.rows.length });
    } catch (err) {
      logger.error({ error: err instanceof Error ? err.message : String(err) }, 'Error listing users');
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  /**
   * POST /api/users
   * Create a new user with role
   * super_admin can create: super_admin, auditor
   * auditor can create: provider_admin
   * Body: { email, password, confirm_password, role, provider_id?, first_name?, last_name? }
   */
  router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;

      // Allow super_admin and auditor to create users
      if (user?.role !== 'super_admin' && user?.role !== 'auditor') {
        res.status(403).json({ error: 'Forbidden', message: 'Only super_admin and auditor can create users' });
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

      // Determine which roles the current user can create
      let allowedRoles: string[] = [];
      if (user?.role === 'super_admin') {
        allowedRoles = ['super_admin', 'auditor'];
      } else if (user?.role === 'auditor') {
        allowedRoles = ['provider_admin'];
      }

      // Validate role
      const validRoles = ['super_admin', 'auditor', 'provider_admin'];
      if (role && !validRoles.includes(role)) {
        res.status(400).json({
          error: 'Bad Request',
          message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
        });
        return;
      }

      // Check if user has permission to create this role
      if (role && !allowedRoles.includes(role)) {
        res.status(403).json({
          error: 'Forbidden',
          message: `Your role (${user?.role}) cannot create users with role '${role}'. Allowed roles: ${allowedRoles.join(', ')}`,
        });
        return;
      }

      // If role is provider_admin, provider_id is required
      if (role === 'provider_admin' && !provider_id) {
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
        // Map API role format to DB role format
        const roleMap: { [key: string]: string } = {
          'super_admin': 'ADMIN',
          'auditor': 'AUDITOR',
          'provider_admin': 'PROVIDER_ADMIN',
        };
        const dbRoleName = roleMap[role] || role.toUpperCase();

        // Get role_id from roles table
        const roleResult = await pool.query(
          'SELECT id FROM roles WHERE UPPER(name) = $1',
          [dbRoleName]
        );
        if (roleResult.rows.length > 0) {
          await pool.query(
            'UPDATE users SET role_id = $1 WHERE id = $2',
            [roleResult.rows[0].id, newUser.id]
          );
        }
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

  /**
   * PUT /api/users/:id
   * Update a user (super_admin only)
   */
  router.put('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { first_name, last_name, role, provider_id } = req.body;

      // Only super_admin can update users
      if (user?.role !== 'super_admin') {
        res.status(403).json({ error: 'Forbidden', message: 'Only super_admin can update users' });
        return;
      }

      // If changing role, validate it's an allowed role for super_admin
      if (role && role !== 'provider_admin' && !['super_admin', 'auditor'].includes(role)) {
        res.status(403).json({
          error: 'Forbidden',
          message: `Super_admin can only update users to roles: super_admin, auditor. Cannot change to '${role}'`,
        });
        return;
      }

      const updatedUser = await userService.updateUser(id, { first_name, last_name, role, provider_id });

      logger.info({ updated_user_id: id, admin_id: user?.user_id }, 'User updated by super_admin');
      res.json({
        data: {
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role,
          provider_id: updatedUser.provider_id,
          first_name: updatedUser.first_name,
          last_name: updatedUser.last_name,
          status: updatedUser.status,
          created_at: updatedUser.created_at,
          updated_at: updatedUser.updated_at,
        },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);

      if (errorMessage.includes('User not found')) {
        res.status(404).json({ error: 'Not Found', message: 'User not found' });
      } else {
        logger.error({ error: errorMessage }, 'Error updating user');
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  });

  /**
   * DELETE /api/users/:id
   * Delete a user (super_admin only)
   */
  router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const { id } = req.params;

      // Only super_admin can delete users
      if (user?.role !== 'super_admin') {
        res.status(403).json({ error: 'Forbidden', message: 'Only super_admin can delete users' });
        return;
      }

      // Prevent deleting yourself
      if (user?.user_id === id) {
        res.status(400).json({ error: 'Bad Request', message: 'Cannot delete your own account' });
        return;
      }

      await userService.deleteUser(id);

      logger.info({ deleted_user_id: id, admin_id: user?.user_id }, 'User deleted by super_admin');
      res.json({ success: true, message: 'User deleted successfully' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);

      if (errorMessage.includes('User not found')) {
        res.status(404).json({ error: 'Not Found', message: 'User not found' });
      } else {
        logger.error({ error: errorMessage }, 'Error deleting user');
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  });

  /**
   * GET /api/users/export/excel
   * Export all users to Excel (super_admin only)
   */
  /**
   * GET /api/users/export/excel
   * Export all users to Excel (super_admin only)
   */
  router.get('/export-excel', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;

      // Only super_admin can export
      if (user?.role !== 'super_admin') {
        res.status(403).json({ error: 'Forbidden', message: 'Only super_admin can export users' });
        return;
      }

      // Fetch all users
      const result = await pool.query(`
        SELECT
          u.id, u.email, LOWER(r.name) AS role, u.provider_id, u.first_name, u.last_name,
          u.status, u.created_at, u.updated_at
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        ORDER BY u.created_at DESC
      `);

      // Create workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Usuarios');

      // Add headers
      worksheet.columns = [
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Nombre', key: 'first_name', width: 15 },
        { header: 'Apellido', key: 'last_name', width: 15 },
        { header: 'Rol', key: 'role', width: 20 },
        { header: 'Prestador ID', key: 'provider_id', width: 36 },
        { header: 'Estado', key: 'status', width: 12 },
        { header: 'Creado', key: 'created_at', width: 20 },
        { header: 'Actualizado', key: 'updated_at', width: 20 },
      ];

      // Style header row
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0052CC' },
      };

      // Add data rows
      result.rows.forEach((row) => {
        worksheet.addRow({
          email: row.email,
          first_name: row.first_name || '—',
          last_name: row.last_name || '—',
          role: row.role,
          provider_id: row.provider_id || '—',
          status: row.status,
          created_at: new Date(row.created_at).toLocaleDateString('es-CO'),
          updated_at: row.updated_at ? new Date(row.updated_at).toLocaleDateString('es-CO') : '—',
        });
      });

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();

      // Send file
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="usuarios.xlsx"');
      res.send(buffer);

      logger.info({ admin_id: user?.user_id, total_users: result.rows.length }, 'Users exported to Excel');
    } catch (err) {
      logger.error({ error: err instanceof Error ? err.message : String(err) }, 'Error exporting users');
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  return router;
}
