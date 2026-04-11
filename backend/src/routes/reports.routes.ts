/**
 * Reports API Routes
 * Compliance report generation endpoints (PDF and Excel)
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { rbacMiddleware } from '../middleware/role.middleware.js';
import { reportLimiter } from '../middleware/rate-limit.middleware.js';
import { validateUuidParam } from '../middleware/sanitize.middleware.js';
import { ReportService } from '../services/ReportService.js';
import { logger } from '../utils/logger.js';

/**
 * Build a safe filename from a provider name
 */
function safeFilename(name: string, ext: string): string {
  const slug = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase()
    .substring(0, 60);
  const date = new Date().toISOString().split('T')[0];
  return `reporte_cumplimiento_${slug || 'prestador'}_${date}.${ext}`;
}

export function createReportsRouter(pool: Pool): Router {
  const router = Router();
  const service = new ReportService(pool);

  /**
   * GET /api/providers/:providerId/reports/compliance.pdf
   * Generate a PDF compliance report for a provider
   */
  router.get(
    '/providers/:providerId/reports/compliance.pdf',
    authMiddleware,
    reportLimiter,
    rbacMiddleware(['super_admin', 'auditor', 'provider_admin']),
    validateUuidParam('providerId'),
    async (req: Request, res: Response) => {
      try {
        const generatedBy = req.user?.user_id || 'system';
        const buffer = await service.generatePdfReport(req.params.providerId, generatedBy);

        // Fetch provider name for filename
        const providerResult = await pool.query<{ legal_name: string }>(
          'SELECT legal_name FROM providers WHERE id = $1',
          [req.params.providerId]
        );
        const providerName = providerResult.rows[0]?.legal_name || 'prestador';
        const filename = safeFilename(providerName, 'pdf');

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', buffer.length.toString());
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', 'private, no-store');

        logger.info({
          msg: 'PDF report generated',
          provider_id: req.params.providerId,
          size_bytes: buffer.length,
          user: generatedBy,
        });

        res.send(buffer);
      } catch (err) {
        logger.error({ msg: 'Failed to generate PDF report', error: err });
        const message = err instanceof Error ? err.message : 'Internal server error';
        const status = message.includes('not found') ? 404 : 500;
        res.status(status).json({ error: message });
      }
    }
  );

  /**
   * GET /api/providers/:providerId/reports/compliance.xlsx
   * Generate an Excel compliance report for a provider
   */
  router.get(
    '/providers/:providerId/reports/compliance.xlsx',
    authMiddleware,
    reportLimiter,
    rbacMiddleware(['super_admin', 'auditor', 'provider_admin']),
    validateUuidParam('providerId'),
    async (req: Request, res: Response) => {
      try {
        const generatedBy = req.user?.user_id || 'system';
        const buffer = await service.generateExcelReport(req.params.providerId, generatedBy);

        const providerResult = await pool.query<{ legal_name: string }>(
          'SELECT legal_name FROM providers WHERE id = $1',
          [req.params.providerId]
        );
        const providerName = providerResult.rows[0]?.legal_name || 'prestador';
        const filename = safeFilename(providerName, 'xlsx');

        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', buffer.length.toString());
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', 'private, no-store');

        logger.info({
          msg: 'Excel report generated',
          provider_id: req.params.providerId,
          size_bytes: buffer.length,
          user: generatedBy,
        });

        res.send(buffer);
      } catch (err) {
        logger.error({ msg: 'Failed to generate Excel report', error: err });
        const message = err instanceof Error ? err.message : 'Internal server error';
        const status = message.includes('not found') ? 404 : 500;
        res.status(status).json({ error: message });
      }
    }
  );

  /**
   * GET /api/providers/:providerId/reports/summary
   * Get raw compliance data as JSON (useful for preview before download)
   */
  router.get(
    '/providers/:providerId/reports/summary',
    authMiddleware,
    rbacMiddleware(['super_admin', 'auditor', 'provider_admin']),
    validateUuidParam('providerId'),
    async (req: Request, res: Response) => {
      try {
        const generatedBy = req.user?.user_id || 'system';
        const data = await service.gatherProviderData(req.params.providerId, generatedBy);
        res.json({ data });
      } catch (err) {
        logger.error({ msg: 'Failed to generate report summary', error: err });
        const message = err instanceof Error ? err.message : 'Internal server error';
        const status = message.includes('not found') ? 404 : 500;
        res.status(status).json({ error: message });
      }
    }
  );

  return router;
}
