/**
 * Documents API Routes
 * Documentary Matrix management endpoints for Norma 3100 compliance
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { rbacMiddleware } from '../middleware/role.middleware.js';
import { uploadLimiter } from '../middleware/rate-limit.middleware.js';
import { validateUuidParam } from '../middleware/sanitize.middleware.js';
import { DocumentService, LinkExternalDocumentInput } from '../services/DocumentService.js';
import { EventStore } from '../modules/events/EventStore.js';
import { DocumentStatus } from '../models/document.model.js';
import { logger } from '../utils/logger.js';

// Multer config: memory storage (files held in RAM before persistence)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Permite super_admin y auditor acceder a cualquier prestador.
// provider_admin solo puede acceder a su propio prestador.
function requireProviderAccess(req: Request, res: Response, next: (err?: unknown) => void): void {
  const user = req.user;
  if (!user) { res.status(401).json({ error: 'No autenticado' }); return; }
  if (user.role === 'super_admin' || user.role === 'auditor') { next(); return; }
  if (user.role === 'provider_admin') {
    if (req.params.providerId && req.params.providerId !== user.provider_id) {
      res.status(403).json({ error: 'Sin acceso a este prestador' }); return;
    }
    next(); return;
  }
  res.status(403).json({ error: 'Acceso denegado' });
}

export function createDocumentsRouter(pool: Pool, eventStore: EventStore): Router {
  const router = Router();
  const service = new DocumentService(pool, eventStore);

  // === CATALOG ENDPOINTS ===

  /**
   * GET /api/documents/catalog
   * List all document catalog items (optionally filtered)
   */
  router.get('/documents/catalog', authMiddleware, async (req: Request, res: Response) => {
    try {
      const category = typeof req.query.category === 'string' ? req.query.category : undefined;
      const mandatory = req.query.mandatory === 'true' ? true : req.query.mandatory === 'false' ? false : undefined;
      const catalog = await service.getCatalog({ category, mandatory });
      res.json({ data: catalog, total: catalog.length });
    } catch (err) {
      logger.error({ msg: 'Failed to fetch catalog', error: err });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * GET /api/documents/catalog/categories
   * List distinct categories
   */
  router.get('/documents/catalog/categories', authMiddleware, async (_req: Request, res: Response) => {
    try {
      const categories = await service.getCategories();
      res.json({ data: categories });
    } catch (err) {
      logger.error({ msg: 'Failed to fetch categories', error: err });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // === PROVIDER DOCUMENT ENDPOINTS ===

  /**
   * POST /api/providers/:providerId/documents
   * Upload a new document for a provider
   */
  router.post(
    '/providers/:providerId/documents',
    authMiddleware,
    uploadLimiter,
    rbacMiddleware(['super_admin', 'auditor', 'provider_admin']),
    validateUuidParam('providerId'),
    requireProviderAccess,
    upload.single('file'),
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'Archivo no proporcionado' });
        }
        const { document_catalog_id, location_id, issue_date, expiry_date } = req.body;
        if (!document_catalog_id) {
          return res.status(400).json({ error: 'document_catalog_id es requerido' });
        }

        // Sanitizar nombre de archivo: solo caracteres seguros, sin path traversal
        const safeFilename = req.file.originalname
          .replace(/[^a-zA-Z0-9._\-À-ɏ\s]/g, '_')
          .replace(/\.{2,}/g, '_')
          .substring(0, 255);

        const document = await service.uploadDocument({
          provider_id: req.params.providerId,
          document_catalog_id,
          location_id,
          file_buffer: req.file.buffer,
          original_filename: safeFilename,
          mime_type: req.file.mimetype,
          issue_date: issue_date ? new Date(issue_date) : undefined,
          expiry_date: expiry_date ? new Date(expiry_date) : undefined,
          uploaded_by: req.user?.user_id || 'system',
        });

        res.status(201).json({ data: document });
      } catch (err) {
        logger.error({ msg: 'Failed to upload document', error: err });
        const message = err instanceof Error ? err.message : 'Internal server error';
        res.status(400).json({ error: message });
      }
    }
  );

  /**
   * POST /api/providers/:providerId/documents/mark-compliant
   * Marcar documento como conforme sin subir archivo (para verificaciones presenciales)
   * Body: { document_catalog_id }
   */
  router.post(
    '/providers/:providerId/documents/mark-compliant',
    authMiddleware,
    rbacMiddleware(['super_admin', 'auditor']),
    validateUuidParam('providerId'),
    requireProviderAccess,
    async (req: Request, res: Response) => {
      try {
        const { document_catalog_id } = req.body;
        if (!document_catalog_id) {
          return res.status(400).json({ error: 'document_catalog_id es requerido' });
        }
        const document = await service.markCompliantWithoutFile({
          provider_id: req.params.providerId,
          document_catalog_id,
          uploaded_by: req.user?.user_id || 'system',
        });
        res.status(201).json({ data: document });
      } catch (err) {
        logger.error({ msg: 'Failed to mark document compliant', error: err });
        const message = err instanceof Error ? err.message : 'Internal server error';
        res.status(400).json({ error: message });
      }
    }
  );

  /**
   * POST /api/providers/:providerId/documents/link
   * Vincular documento externo desde OneDrive (sin subir archivo)
   * Body: { document_catalog_id, external_url, issue_date?, expiry_date? }
   */
  router.post(
    '/providers/:providerId/documents/link',
    authMiddleware,
    rbacMiddleware(['super_admin', 'auditor', 'provider_admin']),
    validateUuidParam('providerId'),
    requireProviderAccess,
    async (req: Request, res: Response) => {
      try {
        const { document_catalog_id, external_url, issue_date, expiry_date } = req.body as {
          document_catalog_id?: string;
          external_url?: string;
          issue_date?: string;
          expiry_date?: string;
        };
        if (!document_catalog_id) {
          return res.status(400).json({ error: 'document_catalog_id es requerido' });
        }
        if (!external_url || typeof external_url !== 'string' || !external_url.trim()) {
          return res.status(400).json({ error: 'external_url es requerido' });
        }

        const input: LinkExternalDocumentInput = {
          provider_id: req.params.providerId,
          document_catalog_id,
          external_url: external_url.trim(),
          issue_date: issue_date ? new Date(issue_date) : undefined,
          expiry_date: expiry_date ? new Date(expiry_date) : undefined,
          uploaded_by: req.user?.user_id || 'system',
        };

        const document = await service.linkExternalDocument(input);
        res.status(201).json({ data: document });
      } catch (err) {
        logger.error({ msg: 'Failed to link external document', error: err });
        const message = err instanceof Error ? err.message : 'Internal server error';
        res.status(400).json({ error: message });
      }
    }
  );

  /**
   * GET /api/providers/:providerId/documents
   * List latest version of each document for a provider
   */
  router.get(
    '/providers/:providerId/documents',
    authMiddleware,
    validateUuidParam('providerId'),
    requireProviderAccess,
    async (req: Request, res: Response) => {
      try {
        const docs = await service.getProviderDocuments(req.params.providerId);
        res.json({ data: docs, total: docs.length });
      } catch (err) {
        logger.error({ msg: 'Failed to fetch provider documents', error: err });
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  );

  /**
   * GET /api/providers/:providerId/documents/compliance
   * Get compliance summary for provider
   */
  router.get(
    '/providers/:providerId/documents/compliance',
    authMiddleware,
    validateUuidParam('providerId'),
    requireProviderAccess,
    async (req: Request, res: Response) => {
      try {
        const summary = await service.getComplianceSummary(req.params.providerId);
        if (!summary) {
          return res.status(404).json({ error: 'Provider not found' });
        }
        res.json({ data: summary });
      } catch (err) {
        logger.error({ msg: 'Failed to fetch compliance summary', error: err });
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  );

  /**
   * GET /api/providers/:providerId/documents/missing
   * List mandatory documents not yet uploaded
   */
  router.get(
    '/providers/:providerId/documents/missing',
    authMiddleware,
    validateUuidParam('providerId'),
    requireProviderAccess,
    async (req: Request, res: Response) => {
      try {
        const missing = await service.getMissingDocuments(req.params.providerId);
        res.json({ data: missing, total: missing.length });
      } catch (err) {
        logger.error({ msg: 'Failed to fetch missing documents', error: err });
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  );

  /**
   * GET /api/providers/:providerId/documents/:catalogId/history
   * Get full version history for a specific document
   */
  router.get(
    '/providers/:providerId/documents/:catalogId/history',
    authMiddleware,
    validateUuidParam('providerId'),
    validateUuidParam('catalogId'),
    requireProviderAccess,
    async (req: Request, res: Response) => {
      try {
        const history = await service.getVersionHistory(req.params.providerId, req.params.catalogId);
        res.json({ data: history, total: history.length });
      } catch (err) {
        logger.error({ msg: 'Failed to fetch version history', error: err });
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  );

  /**
   * GET /api/documents/:documentId/download
   * Download document file
   */
  router.get(
    '/documents/:documentId/download',
    authMiddleware,
    validateUuidParam('documentId'),
    async (req: Request, res: Response) => {
      try {
        const user = req.user!;
        if (user.role === 'provider_admin') {
          const { rows } = await pool.query(
            'SELECT provider_id FROM provider_documents WHERE id = $1',
            [req.params.documentId]
          );
          if (!rows.length || rows[0].provider_id !== user.provider_id) {
            return res.status(403).json({ error: 'Sin acceso a este documento' });
          }
        }
        const file = await service.retrieveFile(req.params.documentId);
        if (!file) {
          return res.status(404).json({ error: 'Document not found' });
        }
        res.setHeader('Content-Type', file.mime_type);
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${encodeURIComponent(file.filename)}"`
        );
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.send(file.buffer);
      } catch (err) {
        logger.error({ msg: 'Failed to download document', error: err });
        const message = err instanceof Error ? err.message : 'Internal server error';
        res.status(500).json({ error: message });
      }
    }
  );

  /**
   * PATCH /api/documents/:documentId/validate
   * Validate a document (auditor only)
   */
  router.patch(
    '/documents/:documentId/validate',
    authMiddleware,
    rbacMiddleware(['super_admin', 'auditor']),
    validateUuidParam('documentId'),
    async (req: Request, res: Response) => {
      try {
        const { status, notes } = req.body;
        const validStatuses: DocumentStatus[] = ['compliant', 'rejected', 'under_review', 'pending'];
        if (!status || !validStatuses.includes(status)) {
          return res.status(400).json({
            error: `status debe ser uno de: ${validStatuses.join(', ')}`,
          });
        }
        const result = await service.validateProviderDocument(
          req.params.documentId,
          status,
          notes,
          req.user?.user_id || 'system'
        );
        if (!result) {
          return res.status(404).json({ error: 'Document not found' });
        }
        res.json({ data: result });
      } catch (err) {
        logger.error({ msg: 'Failed to validate document', error: err });
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  );

  /**
   * GET /api/documents/expiring
   * List documents expiring soon (days ahead configurable)
   */
  router.get(
    '/documents/expiring',
    authMiddleware,
    rbacMiddleware(['super_admin', 'auditor']),
    async (req: Request, res: Response) => {
      try {
        const daysAhead = req.query.days ? parseInt(req.query.days as string, 10) : 30;
        if (isNaN(daysAhead) || daysAhead < 0 || daysAhead > 365) {
          return res.status(400).json({ error: 'days debe estar entre 0 y 365' });
        }
        const expiring = await service.getExpiringDocuments(daysAhead);
        res.json({ data: expiring, total: expiring.length });
      } catch (err) {
        logger.error({ msg: 'Failed to fetch expiring documents', error: err });
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  );

  return router;
}
