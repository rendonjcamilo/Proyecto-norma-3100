import { validateToken } from '../services/jwt.service.js';
import { logger } from '../utils/logger.js';
/**
 * Middleware to verify JWT token from Authorization header
 * Expects: Authorization: Bearer <token>
 * In development mode, allows requests without token
 */
export function authMiddleware(req, res, next) {
    // In development, bypass authentication
    if (process.env.NODE_ENV === 'development') {
        req.user = {
            user_id: '550e8400-e29b-41d4-a716-446655440000',
            role: 'super_admin',
            provider_id: '550e8400-e29b-41d4-a716-446655440001',
            jti: 'dev-jti',
        };
        logger.debug({ path: req.path }, 'Development mode: auth bypassed');
        next();
        return;
    }
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Missing or invalid Authorization header',
            });
            return;
        }
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        const result = validateToken(token);
        if (!result.valid) {
            res.status(401).json({
                error: 'Unauthorized',
                message: result.error || 'Invalid token',
            });
            return;
        }
        // Ensure it's not a refresh token (those should be in cookies)
        if ('type' in result.claims && result.claims.type === 'refresh') {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid token type',
            });
            return;
        }
        // Attach user claims to request
        req.user = {
            user_id: result.claims.user_id,
            role: result.claims.role || 'unknown',
            provider_id: result.claims.provider_id || '',
            jti: result.claims.jti,
        };
        logger.debug({ user_id: req.user.user_id, path: req.path }, 'Auth middleware: token verified');
        next();
    }
    catch (err) {
        logger.error({ error: err instanceof Error ? err.message : err }, 'Auth middleware error');
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Authentication check failed',
        });
    }
}
/**
 * Middleware to verify optional token (does not reject if missing)
 * Useful for endpoints that have different behavior for authenticated users
 */
export function optionalAuthMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            next();
            return;
        }
        const token = authHeader.substring(7);
        const result = validateToken(token);
        if (result.valid && (!('type' in result.claims) || result.claims.type !== 'refresh')) {
            req.user = {
                user_id: result.claims.user_id,
                role: result.claims.role || 'unknown',
                provider_id: result.claims.provider_id || '',
                jti: result.claims.jti,
            };
        }
        next();
    }
    catch (err) {
        logger.error({ error: err instanceof Error ? err.message : err }, 'Optional auth middleware error');
        next();
    }
}
