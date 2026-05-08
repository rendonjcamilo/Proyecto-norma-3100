import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import {
  generateAccessToken,
  generateRefreshToken,
  generateTempToken,
  validateToken,
  decodeToken,
  isTokenExpired,
} from '../services/jwt.service.js';
import { validatePasswordPolicy, comparePassword, hashPassword } from '../services/password.service.js';
import { UserService } from '../services/user.service.js';
import { PasswordRecoveryService } from '../services/password-recovery.service.js';
import { authMiddleware, revokeToken } from '../middleware/auth.middleware.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Initialize services with database pool
let userService: UserService;
let passwordRecoveryService: PasswordRecoveryService;
let dbPool: Pool;

export function setUserService(pool: Pool) {
  userService = new UserService(pool);
  passwordRecoveryService = new PasswordRecoveryService(pool);
  dbPool = pool;
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
      logger.warn({ email }, 'Login attempt with incorrect password');
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
      return;
    }

    // Convert role from DB format (ADMIN, AUDITOR, PROVIDER_ADMIN) to API format (super_admin, auditor, provider_admin)
    const roleMap: { [key: string]: string } = {
      'ADMIN': 'super_admin',
      'AUDITOR': 'auditor',
      'PROVIDER_ADMIN': 'provider_admin',
    };
    const apiRole = roleMap[user.role] || user.role.toLowerCase();

    // Si el usuario debe cambiar su contraseña, emitir token temporal (15 min, solo para /auth/change-password)
    if (user.must_change_password) {
      const tempToken = generateTempToken(user.id);
      logger.info({ user_id: user.id, email }, 'Login requires password change');
      res.status(200).json({
        requiresPasswordChange: true,
        temp_token: tempToken,
        user: { id: user.id, email: user.email, role: apiRole },
      });
      return;
    }

    // Generate tokens using converted role (lowercase snake_case)
    const accessToken = generateAccessToken(user.id, apiRole, user.provider_id);
    const refreshToken = generateRefreshToken(user.id);

    logger.info({ user_id: user.id, email }, 'User logged in successfully');

    // Refresh token en cookie HttpOnly — no expuesto a JavaScript del cliente
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 días en ms
      path: '/auth',
    });

    res.status(200).json({
      access_token: accessToken,
      expires_in: 3600,
      token_type: 'Bearer',
      user: {
        id: user.id,
        email: user.email,
        role: apiRole,
        first_name: user.first_name,
        last_name: user.last_name,
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
 * Rota el refresh token y emite un nuevo access token con el rol correcto del usuario.
 * Lee el refresh token exclusivamente desde la cookie HttpOnly.
 */
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    // Leer exclusivamente desde cookie HttpOnly
    const cookieHeader = req.headers.cookie || '';
    const cookieMatch = cookieHeader.match(/(?:^|;\s*)refresh_token=([^;]+)/);
    let refresh_token: string | undefined;
    if (cookieMatch) {
      try { refresh_token = decodeURIComponent(cookieMatch[1]); } catch { /* cookie malformada */ }
    }

    if (!refresh_token) {
      res.status(400).json({ error: 'Bad Request', message: 'Refresh token es requerido' });
      return;
    }

    if (isTokenExpired(refresh_token)) {
      res.status(401).json({ error: 'Unauthorized', message: 'El refresh token ha expirado' });
      return;
    }

    const result = validateToken(refresh_token);
    if (!result.valid) {
      res.status(401).json({ error: 'Unauthorized', message: 'Refresh token inválido' });
      return;
    }

    const claims = result.claims;
    if (!claims || !('type' in claims) || claims.type !== 'refresh') {
      res.status(401).json({ error: 'Unauthorized', message: 'Tipo de token inválido' });
      return;
    }

    const user_id = claims.user_id;
    const oldJti = claims.jti;
    const oldExp = new Date(claims.exp * 1000);

    // Obtener rol real del usuario desde la BD
    const userResult = await dbPool.query(
      `SELECT r.name AS role_name, u.provider_id
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1 AND u.status = 'active'`,
      [user_id],
    );

    if (userResult.rows.length === 0) {
      res.status(401).json({ error: 'Unauthorized', message: 'Usuario no encontrado o inactivo' });
      return;
    }

    const { role_name, provider_id } = userResult.rows[0];
    const roleMap: Record<string, string> = { ADMIN: 'super_admin', AUDITOR: 'auditor', PROVIDER_ADMIN: 'provider_admin' };
    const role = roleMap[role_name] || role_name.toLowerCase();

    // Revocar el refresh token anterior para rotación real
    await revokeToken(oldJti, user_id, oldExp);

    const newAccessToken = generateAccessToken(user_id, role, provider_id || '');
    const newRefreshToken = generateRefreshToken(user_id);

    logger.info({ user_id, role }, 'Tokens refreshed');

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 14 * 24 * 60 * 60 * 1000,
      path: '/auth',
    });

    res.status(200).json({
      access_token: newAccessToken,
      expires_in: 3600,
      token_type: 'Bearer',
    });
  } catch (err) {
    logger.error({ error: err instanceof Error ? err.message : err }, 'Refresh token error');
    res.status(500).json({ error: 'Internal Server Error', message: 'Error al renovar el token' });
  }
});

/**
 * GET /auth/verify
 * Endpoint de diagnóstico — deshabilitado en producción.
 */
router.get('/verify', authMiddleware, (req: Request, res: Response): void => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ error: 'Not Found' });
    return;
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(400).json({ error: 'Bad Request', message: 'Missing Authorization header' });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = decodeToken(token);

    if (!decoded) {
      res.status(400).json({ error: 'Bad Request', message: 'Unable to decode token' });
      return;
    }

    res.status(200).json({ valid: true, claims: decoded, user: req.user });
  } catch (err) {
    logger.error({ error: err instanceof Error ? err.message : err }, 'Verify token error');
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to verify token' });
  }
});

/**
 * POST /auth/logout
 * Invalida el access token actual y limpia la cookie de refresh token.
 */
router.post('/logout', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;

    // Revocar el access token actual
    const expiresAt = new Date((Date.now() / 1000 + 3600) * 1000); // TTL máximo del access token
    await revokeToken(user.jti, user.user_id, expiresAt);

    // Limpiar cookie de refresh token
    res.clearCookie('refresh_token', { path: '/auth' });

    logger.info({ user_id: user.user_id }, 'User logged out');
    res.status(200).json({ message: 'Sesión cerrada exitosamente' });
  } catch (err) {
    logger.error({ error: err instanceof Error ? err.message : err }, 'Logout error');
    res.status(500).json({ error: 'Internal Server Error', message: 'Error al cerrar sesión' });
  }
});

/**
 * POST /auth/dev-login
 * Desarrollo únicamente: genera un JWT firmado real para un usuario mock sin credenciales.
 * Deshabilitado completamente en producción.
 * Body: { email, role }
 */
router.post('/dev-login', async (req: Request, res: Response): Promise<void> => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ error: 'Not Found' });
    return;
  }

  const { email, role } = req.body;
  const validRoles = ['super_admin', 'auditor', 'provider_admin'];

  if (!email || !role || !validRoles.includes(role)) {
    res.status(400).json({ error: 'Bad Request', message: 'email y role válido son requeridos' });
    return;
  }

  const devUserIds: Record<string, string> = {
    super_admin: '550e8400-e29b-41d4-a716-446655440000',
    auditor:     '7a3dba1a-0fb1-4c22-ab6c-67695a6f5813',
    provider_admin: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  };
  const devProviderIds: Record<string, string> = {
    super_admin:    '',
    auditor:        '7a3dba1a-0fb1-4c22-ab6c-67695a6f5813',
    provider_admin: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  };

  const user_id = devUserIds[role];
  const provider_id = devProviderIds[role];

  const accessToken = generateAccessToken(user_id, role, provider_id);
  const refreshToken = generateRefreshToken(user_id);

  logger.warn({ email, role }, 'Dev login usado — solo disponible fuera de producción');

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: false, // development only
    sameSite: 'strict',
    maxAge: 14 * 24 * 60 * 60 * 1000,
    path: '/auth',
  });

  res.status(200).json({
    access_token: accessToken,
    expires_in: 3600,
    token_type: 'Bearer',
    user: {
      id: user_id,
      email,
      role,
      first_name: 'Dev',
      last_name: role,
      provider_id,
    },
  });
});

/**
 * POST /auth/forgot-password
 * Solicita recuperación de contraseña por email
 * Body: { email }
 */
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Bad Request', message: 'El correo electrónico es requerido' });
      return;
    }

    // Siempre responder OK para no revelar si el email existe (seguridad)
    const genericResponse = {
      message: 'Si el correo existe en el sistema, recibirás las instrucciones para restablecer tu contraseña.',
    };

    const user = await userService.getUserByEmail(email);
    if (!user) {
      logger.warn({ email }, 'forgot-password: email not found (silenced)');
      res.status(200).json(genericResponse);
      return;
    }

    if (user.status !== 'active') {
      logger.warn({ email }, 'forgot-password: inactive user (silenced)');
      res.status(200).json(genericResponse);
      return;
    }

    // Crear token de recuperación
    const { token, expiresAt } = await passwordRecoveryService.createRecoveryToken(user.id);

    // Construir enlace de reset
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${token}&uid=${user.id}`;

    // Intentar enviar email si el proveedor está configurado
    const emailProvider = process.env.EMAIL_PROVIDER;
    if (emailProvider && emailProvider !== 'none') {
      try {
        const firstName = user.first_name || user.email.split('@')[0];
        const result = await dbPool.query(
          `SELECT id FROM email_templates WHERE name = 'password-reset' AND is_active = true LIMIT 1`
        );
        if (result.rows.length > 0) {
          // Insertar entrega de email en cola (patrón multichannel existente)
          await dbPool.query(
            `INSERT INTO email_deliveries (id, recipient_email, recipient_name, template_name, variables, status, created_at, updated_at)
             VALUES (gen_random_uuid(), $1, $2, 'password-reset', $3::jsonb, 'pending', NOW(), NOW())`,
            [user.email, firstName, JSON.stringify({ name: firstName, reset_link: resetLink, expiry_minutes: '60' })]
          );
        }
      } catch (emailErr) {
        logger.error({ error: emailErr instanceof Error ? emailErr.message : emailErr }, 'Error al encolar email de recuperación');
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      logger.info({ email, expiresAt }, '🔑 Password reset link generated (dev)');
    }

    res.status(200).json(genericResponse);
  } catch (err) {
    logger.error({ error: err instanceof Error ? err.message : err }, 'forgot-password error');
    res.status(500).json({ error: 'Internal Server Error', message: 'Error al procesar la solicitud' });
  }
});

/**
 * POST /auth/reset-password
 * Restablece la contraseña usando el token de recuperación
 * Body: { token, userId, newPassword }
 */
router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, userId, newPassword } = req.body;

    if (!token || !userId || !newPassword) {
      res.status(400).json({ error: 'Bad Request', message: 'Token, userId y nueva contraseña son requeridos' });
      return;
    }

    // Validar política de contraseña
    const passwordValidation = validatePasswordPolicy(newPassword);
    if (!passwordValidation.valid) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'La contraseña no cumple los requisitos mínimos de seguridad',
        details: passwordValidation.errors,
      });
      return;
    }

    // Validar token
    const validation = await passwordRecoveryService.validateRecoveryToken(token, userId);
    if (!validation.valid) {
      res.status(400).json({
        error: 'Bad Request',
        message: validation.error === 'Token expired'
          ? 'El enlace ha vencido. Solicita uno nuevo.'
          : 'El enlace no es válido o ya fue utilizado.',
      });
      return;
    }

    // Hash de la nueva contraseña
    const newHash = await hashPassword(newPassword);

    // Actualizar contraseña en BD
    await dbPool.query(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [newHash, userId]
    );

    // Marcar token como usado
    await passwordRecoveryService.consumeRecoveryToken(token, userId);

    logger.info({ userId }, 'Password reset successfully');

    res.status(200).json({ message: 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión.' });
  } catch (err) {
    logger.error({ error: err instanceof Error ? err.message : err }, 'reset-password error');
    res.status(500).json({ error: 'Internal Server Error', message: 'Error al restablecer la contraseña' });
  }
});

/**
 * POST /auth/change-password
 * Cambia la contraseña usando el token temporal emitido en el primer login.
 * Body: { temp_token, new_password, confirm_password }
 */
router.post('/change-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { temp_token, new_password, confirm_password } = req.body;

    if (!temp_token || !new_password || !confirm_password) {
      res.status(400).json({ error: 'Bad Request', message: 'temp_token, new_password y confirm_password son requeridos' });
      return;
    }

    if (new_password !== confirm_password) {
      res.status(400).json({ error: 'Bad Request', message: 'Las contraseñas no coinciden' });
      return;
    }

    // Validar token temporal
    const validation = validateToken(temp_token);
    if (!validation.valid || !validation.claims) {
      res.status(401).json({ error: 'Unauthorized', message: 'Token inválido o expirado' });
      return;
    }

    if ((validation.claims as any).purpose !== 'password_change') {
      res.status(401).json({ error: 'Unauthorized', message: 'Token no válido para este endpoint' });
      return;
    }

    const userId = validation.claims.user_id;

    // Validar política de contraseña
    const passwordValidation = validatePasswordPolicy(new_password);
    if (!passwordValidation.valid) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'La contraseña no cumple los requisitos de seguridad',
        details: passwordValidation.errors,
      });
      return;
    }

    // Hash y actualizar contraseña, desactivar flag
    const newHash = await hashPassword(new_password);
    await dbPool.query(
      `UPDATE users SET password_hash = $1, must_change_password = FALSE, updated_at = NOW() WHERE id = $2`,
      [newHash, userId]
    );

    // Obtener datos del usuario para emitir tokens completos
    const userResult = await dbPool.query(
      `SELECT u.id, u.email, u.provider_id, u.first_name, u.last_name, r.name AS role
       FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ error: 'Not Found', message: 'Usuario no encontrado' });
      return;
    }

    const user = userResult.rows[0];
    const roleMap: { [key: string]: string } = { ADMIN: 'super_admin', AUDITOR: 'auditor', PROVIDER_ADMIN: 'provider_admin' };
    const apiRole = roleMap[user.role] || (user.role || 'provider_admin').toLowerCase();

    const accessToken = generateAccessToken(user.id, apiRole, user.provider_id);
    const refreshToken = generateRefreshToken(user.id);

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 14 * 24 * 60 * 60 * 1000,
      path: '/auth',
    });

    logger.info({ user_id: userId }, 'Password changed on first login');

    res.status(200).json({
      access_token: accessToken,
      expires_in: 3600,
      token_type: 'Bearer',
      user: { id: user.id, email: user.email, role: apiRole, first_name: user.first_name, last_name: user.last_name, provider_id: user.provider_id },
    });
  } catch (err) {
    logger.error({ error: err instanceof Error ? err.message : err }, 'change-password error');
    res.status(500).json({ error: 'Internal Server Error', message: 'Error al cambiar la contraseña' });
  }
});

export default router;
