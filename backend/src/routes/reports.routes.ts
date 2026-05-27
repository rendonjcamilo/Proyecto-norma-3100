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

/** Verifica que un provider_admin solo acceda a su propio prestador */
async function assertProviderAccess(
  pool: Pool,
  userId: string,
  role: string,
  providerId: string,
  res: Response
): Promise<boolean> {
  if (role === 'provider_admin') {
    const r = await pool.query<{ provider_id: string }>(
      'SELECT provider_id FROM users WHERE id = $1',
      [userId]
    );
    if (r.rows[0]?.provider_id !== providerId) {
      res.status(403).json({ error: 'Acceso denegado' });
      return false;
    }
  }
  return true;
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
        if (!await assertProviderAccess(pool, req.user!.user_id, req.user!.role, req.params.providerId, res)) {return;}
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
        if (!await assertProviderAccess(pool, req.user!.user_id, req.user!.role, req.params.providerId, res)) {return;}
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
        if (!await assertProviderAccess(pool, req.user!.user_id, req.user!.role, req.params.providerId, res)) {return;}
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
   * GET /api/providers/:providerId/reports/auditoria.docx
   * Genera el Informe de Auditoría oficial en formato Word (.docx)
   * Query param: ?assessmentId=UUID (opcional)
   */
  router.get(
    '/providers/:providerId/reports/auditoria.docx',
    authMiddleware,
    reportLimiter,
    rbacMiddleware(['super_admin', 'auditor']),
    validateUuidParam('providerId'),
    async (req: Request, res: Response) => {
      try {
        const generatedBy = req.user?.user_id || 'system';
        const assessmentId = req.query.assessmentId as string | undefined;

        const buffer = await service.generateAuditReportDocx(
          req.params.providerId,
          generatedBy,
          assessmentId
        );

        const providerResult = await pool.query<{ legal_name: string }>(
          'SELECT legal_name FROM providers WHERE id = $1',
          [req.params.providerId]
        );
        const providerName = providerResult.rows[0]?.legal_name || 'prestador';
        const filename = safeFilename(providerName + '_auditoria', 'docx');

        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        );
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', buffer.length.toString());
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', 'private, no-store');

        logger.info({
          msg: 'Audit report DOCX generated',
          provider_id: req.params.providerId,
          assessment_id: assessmentId,
          size_bytes: buffer.length,
          user: generatedBy,
        });

        res.send(buffer);
      } catch (err) {
        logger.error({ msg: 'Failed to generate audit report DOCX', error: err });
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
   * Get global metrics for super_admin dashboard (real data from database)
   */
  router.get(
    '/reports/global-summary',
    authMiddleware,
    rbacMiddleware(['super_admin']),
    async (req: Request, res: Response) => {
      try {
        // 1. Count total active providers
        const providersResult = await pool.query<{ count: string }>(
          'SELECT COUNT(*) as count FROM providers WHERE status = $1',
          ['active']
        );
        const totalProviders = parseInt(providersResult.rows[0]?.count || '0', 10);

        // 2. Count total active auditors
        const auditorsResult = await pool.query<{ count: string }>(
          'SELECT COUNT(*) as count FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE LOWER(r.name) = $1 AND u.status = $2',
          ['auditor', 'active']
        );
        const totalAuditors = parseInt(auditorsResult.rows[0]?.count || '0', 10);

        // 3. Count assessments in progress (draft or submitted status)
        const assessmentsResult = await pool.query<{ count: string }>(
          'SELECT COUNT(*) as count FROM assessments WHERE status IN ($1, $2, $3)',
          ['draft', 'in_progress', 'submitted']
        );
        const assessmentsInProgress = parseInt(assessmentsResult.rows[0]?.count || '0', 10);

        // 4. Count critical findings that are open or in progress
        const findingsResult = await pool.query<{ count: string }>(
          'SELECT COUNT(*) as count FROM findings WHERE severity = $1 AND status IN ($2, $3)',
          ['critical', 'open', 'in_progress']
        );
        const criticalFindings = parseInt(findingsResult.rows[0]?.count || '0', 10);

        // 5. Calculate average compliance rate (from completed/submitted assessments only)
        const complianceResult = await pool.query<{ avg: number | null }>(
          'SELECT AVG(CAST(compliance_pct AS FLOAT)) as avg FROM assessments WHERE status IN ($1, $2) AND compliance_pct > 0',
          ['submitted', 'reviewed']
        );
        const avgComplianceRate = complianceResult.rows[0]?.avg ? Math.round(complianceResult.rows[0].avg * 10) / 10 : 0;

        res.json({
          totalProviders,
          totalAuditors,
          assessmentsInProgress,
          criticalFindings,
          avgComplianceRate,
        });
      } catch (err) {
        logger.error({ msg: 'Failed to get global summary', error: err instanceof Error ? err.message : String(err) });
        res.status(500).json({ error: 'Failed to get global summary' });
      }
    }
  );

  /**
   * GET /api/providers/:providerId/reports/dashboard-summary
   * Get provider dashboard metrics (real data for provider_admin dashboard)
   */
  router.get(
    '/providers/:providerId/reports/dashboard-summary',
    authMiddleware,
    rbacMiddleware(['provider_admin', 'auditor', 'super_admin']),
    async (req: Request, res: Response) => {
      try {
        const { providerId } = req.params;
        if (!await assertProviderAccess(pool, req.user!.user_id, req.user!.role, providerId, res)) {return;}

        // 1. Count open findings
        const openFindingsResult = await pool.query<{ count: string }>(
          'SELECT COUNT(*) as count FROM findings WHERE provider_id = $1 AND status IN ($2, $3)',
          [providerId, 'open', 'abierta']
        );
        const openFindings = parseInt(openFindingsResult.rows[0]?.count || '0', 10);

        // 2. Count in-progress findings
        const inProgressResult = await pool.query<{ count: string }>(
          'SELECT COUNT(*) as count FROM findings WHERE provider_id = $1 AND status IN ($2, $3)',
          [providerId, 'in_progress', 'en_proceso']
        );
        const inProgressFindings = parseInt(inProgressResult.rows[0]?.count || '0', 10);

        // 3. Count resolved findings
        const resolvedResult = await pool.query<{ count: string }>(
          'SELECT COUNT(*) as count FROM findings WHERE provider_id = $1 AND status IN ($2, $3)',
          [providerId, 'resolved', 'cerrada']
        );
        const resolvedFindings = parseInt(resolvedResult.rows[0]?.count || '0', 10);

        // 4. Get latest assessment compliance rate
        const complianceResult = await pool.query<{ compliance_pct: number }>(
          'SELECT COALESCE(MAX(compliance_pct), 0) as compliance_pct FROM assessments WHERE provider_id = $1 AND status != $2',
          [providerId, 'draft']
        );
        const complianceRate = complianceResult.rows[0]?.compliance_pct || 0;

        res.json({
          compliance_rate: Math.round(complianceRate),
          open_findings: openFindings,
          in_progress_findings: inProgressFindings,
          resolved_findings: resolvedFindings,
          pending_actions: Math.max(0, openFindings - inProgressFindings),
          document_compliance: 0,
        });
      } catch (err) {
        logger.error({ msg: 'Failed to get provider dashboard summary', error: err instanceof Error ? err.message : String(err) });
        res.status(500).json({ error: 'Failed to get provider dashboard summary' });
      }
    }
  );

  return router;
}
