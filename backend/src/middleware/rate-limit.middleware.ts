/**
 * Rate Limiting Middleware
 * Protects endpoints from brute-force and abuse
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../utils/logger.js';

// Standard API rate limiter: 1000 requests / 15 minutes per IP (increased for development)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Has excedido el límite de peticiones. Intenta de nuevo en 15 minutos.',
    retryAfter: '15 minutes',
  },
  handler: (req: Request, res: Response, _next, options) => {
    logger.warn({
      msg: 'Rate limit exceeded',
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    res.status(options.statusCode).json(options.message);
  },
});

// Strict rate limiter for authentication endpoints: 5 attempts / 15 min
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    error: 'Too Many Login Attempts',
    message: 'Demasiados intentos de autenticación. Intenta de nuevo en 15 minutos.',
    retryAfter: '15 minutes',
  },
  handler: (req: Request, res: Response, _next, options) => {
    logger.warn({
      msg: 'Auth rate limit exceeded - possible brute force',
      ip: req.ip,
      path: req.path,
      userAgent: req.get('user-agent'),
    });
    res.status(options.statusCode).json(options.message);
  },
});

// Strict limiter for file uploads: 20 uploads / hour
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Upload Limit Exceeded',
    message: 'Has excedido el límite de subidas por hora.',
    retryAfter: '1 hour',
  },
});

// Webhook limiter: 500 / 15 min (providers may burst)
export const webhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => false, // Use default IP detection
  message: {
    error: 'Webhook Rate Limit Exceeded',
    message: 'Webhook rate limit exceeded',
  },
});

// Report generation limiter: 10 / 5 min (expensive operation)
export const reportLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Report Generation Limit',
    message: 'Has excedido el límite de generación de reportes. Intenta en 5 minutos.',
    retryAfter: '5 minutes',
  },
});
