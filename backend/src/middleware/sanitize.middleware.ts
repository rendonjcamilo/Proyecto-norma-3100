/**
 * Input Sanitization Middleware
 * Prevents XSS, SQL injection patterns and data tampering
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Recursively sanitize object by removing dangerous characters
 */
const sanitizeValue = (value: unknown): unknown => {
  if (typeof value === 'string') {
    return value
      // Remove null bytes
      .replace(/\0/g, '')
      // Remove common XSS vectors
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      // Skip prototype pollution attempts
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      sanitized[key] = sanitizeValue(val);
    }
    return sanitized;
  }
  return value;
};

/**
 * Sanitize request body, query params and URL params
 */
export const sanitizeInputs = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    // Mutate in place since req.query is read-only in Express 5
    const sanitized = sanitizeValue(req.query) as Record<string, unknown>;
    Object.keys(req.query).forEach(key => delete (req.query as Record<string, unknown>)[key]);
    Object.assign(req.query, sanitized);
  }
  if (req.params && typeof req.params === 'object') {
    const sanitized = sanitizeValue(req.params) as Record<string, unknown>;
    Object.assign(req.params, sanitized);
  }
  next();
};

/**
 * Validate UUID format in route params to prevent injection
 */
export const validateUuidParam = (paramName: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return (req: Request, res: Response, next: NextFunction): void => {
    const value = req.params[paramName];
    if (!value || !uuidRegex.test(value)) {
      res.status(400).json({
        error: 'Invalid Parameter',
        message: `El parámetro '${paramName}' debe ser un UUID válido`,
      });
      return;
    }
    next();
  };
};
