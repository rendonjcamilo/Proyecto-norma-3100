import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import {
  generateAccessToken,
  generateRefreshToken,
  validateToken,
  decodeToken,
  isTokenExpired,
} from '../services/jwt.service.js';
import { validatePasswordPolicy, comparePassword, hashPassword } from '../services/password.service.js';
import { UserService } from '../services/user.service.js';
import { PasswordRecoveryService } from '../services/password-recovery.service.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
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

    // Generate tokens using converted role (lowercase snake_case)
    const accessToken = generateAccessToken(user.id, apiRole, user.provider_id);
    const refreshToken = generateRefreshToken(user.id);

    // TODO: Create session in Redis

    logger.info({ user_id: user.id, email }, 'User logged in successfully');

    res.status(200).json({
      access_token: accessToken,
      refresh_token: refreshToken,
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

  res.status(200).json({
    access_token: accessToken,
    refresh_token: refreshToken,
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

export default router;
