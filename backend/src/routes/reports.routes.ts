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

  /**
   * GET /api/providers/:providerId/reports/auditoria.pdf
   * Genera el Informe de Auditoría oficial según Resolución 3100 de 2019
   * Organizado por estándares: TSTH · TSINF · TSDOT · TSMD · TSPP · TSHCR · TSINT
   * Query param: ?assessmentId=UUID (opcional — si no se pasa usa hallazgos abiertos)
   */
  router.get(
    '/providers/:providerId/reports/auditoria.pdf',
    authMiddleware,
    reportLimiter,
    rbacMiddleware(['super_admin', 'auditor']),
    validateUuidParam('providerId'),
    async (req: Request, res: Response) => {
      try {
        const generatedBy = req.user?.user_id || 'system';
        const assessmentId = req.query.assessmentId as string | undefined;

        const buffer = await service.generateAuditReportPdf(
          req.params.providerId,
          generatedBy,
          assessmentId
        );

        const providerResult = await pool.query<{ legal_name: string }>(
          'SELECT legal_name FROM providers WHERE id = $1',
          [req.params.providerId]
        );
        const providerName = providerResult.rows[0]?.legal_name || 'prestador';
        const filename = safeFilename(providerName + '_auditoria', 'pdf');

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', buffer.length.toString());
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', 'private, no-store');

        logger.info({
          msg: 'Audit report PDF generated',
          provider_id: req.params.providerId,
          assessment_id: assessmentId,
          size_bytes: buffer.length,
          user: generatedBy,
        });

        res.send(buffer);
      } catch (err) {
        logger.error({ msg: 'Failed to generate audit report PDF', error: err });
        const message = err instanceof Error ? err.message : 'Internal server error';
        const status = message.includes('not found') ? 404 : 500;
        res.status(status).json({ error: message });
      }
    }
  );

  /**
   * GET /api/providers/:providerId/reports/auditoria/datos
   * Devuelve los datos del informe de auditoría en JSON (para previsualización)
   */
  router.get(
    '/providers/:providerId/reports/auditoria/datos',
    authMiddleware,
    rbacMiddleware(['super_admin', 'auditor']),
    validateUuidParam('providerId'),
    async (req: Request, res: Response) => {
      try {
        const assessmentId = req.query.assessmentId as string | undefined;
        const data = await service.gatherAuditReportData(req.params.providerId, assessmentId);
        res.json({ data });
      } catch (err) {
        logger.error({ msg: 'Failed to gather audit report data', error: err });
        const message = err instanceof Error ? err.message : 'Internal server error';
        const status = message.includes('not found') ? 404 : 500;
        res.status(status).json({ error: message });
      }
    }
  );

  /**
   * GET /api/reports/global-summary
   * Get global metrics for super_admin dashboard
   */
  router.get(
    '/reports/global-summary',
    authMiddleware,
    rbacMiddleware(['super_admin']),
    async (req: Request, res: Response) => {
      try {
        // Total providers
        const providersResult = await pool.query<{ total: string }>(
          "SELECT COUNT(*) as total FROM providers WHERE status = 'active'"
        );
        const totalProviders = parseInt(providersResult.rows[0]?.total || '0', 10);

        // Total auditors
        const auditorsResult = await pool.query<{ total: string }>(
          "SELECT COUNT(DISTINCT id) as total FROM users WHERE role = 'auditor'"
        );
        const totalAuditors = parseInt(auditorsResult.rows[0]?.total || '0', 10);

        // Assessments in progress
        const assessmentsResult = await pool.query<{ total: string }>(
          "SELECT COUNT(*) as total FROM assessments WHERE status IN ('draft', 'in_progress')"
        );
        const assessmentsInProgress = parseInt(assessmentsResult.rows[0]?.total || '0', 10);

        // Critical findings
        const criticalFindingsResult = await pool.query<{ total: string }>(
          "SELECT COUNT(*) as total FROM findings WHERE severity IN ('critical', 'critica') AND status IN ('open', 'abierta', 'in_progress', 'en_proceso')"
        );
        const criticalFindings = parseInt(criticalFindingsResult.rows[0]?.total || '0', 10);

        // Average compliance rate (across all assessments)
        const complianceResult = await pool.query<{ avg: string | null }>(
          'SELECT AVG(COALESCE(compliance_percent, compliance_percentage)) as avg FROM assessments WHERE compliance_percent IS NOT NULL OR compliance_percentage IS NOT NULL'
        );
        const avgComplianceRate = complianceResult.rows[0]?.avg ? parseFloat(complianceResult.rows[0].avg) : 0;

        res.json({
          totalProviders,
          totalAuditors,
          assessmentsInProgress,
          criticalFindings,
          avgComplianceRate: Math.round(avgComplianceRate * 10) / 10,
        });
      } catch (err) {
        logger.error({ msg: 'Failed to get global summary', error: err });
        res.status(500).json({ error: 'Failed to get global summary' });
      }
    }
  );

  return router;
}
