/**
 * Report Service
 * Generates compliance reports in PDF and Excel formats
 */

import { Pool } from 'pg';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
  VerticalAlign,
  ImageRun,
  Header,
  ShadingType,
  HorizontalPositionRelativeFrom,
  VerticalPositionRelativeFrom,
  TextWrappingType,
} from 'docx';
import sharp from 'sharp';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ASSETS_DIR = path.join(__dirname, '../assets');

export interface ComplianceReportData {
  provider: {
    id: string;
    legal_name: string;
    rut: string;
    city: string;
    department: string;
  };
  generatedAt: Date;
  generatedBy: string;
  metrics: {
    totalFindings: number;
    openFindings: number;
    inProgressFindings: number;
    resolvedFindings: number;
    closedFindings: number;
    overdueFindings: number;
    averageRiskScore: number;
    compliancePercentage: number;
  };
  documentCompliance?: {
    totalRequired: number;
    compliantCount: number;
    expiredCount: number;
    pendingCount: number;
    compliancePercentage: number;
  };
  topFindings: Array<{
    title: string;
    severity: string;
    riskScore: number;
    status: string;
    daysOverdue: number;
  }>;
}

const COLORS = {
  primary: '#0052cc',
  success: '#00875a',
  warning: '#ff8b00',
  danger: '#de350b',
  text: '#172b4d',
  muted: '#6b778c',
  border: '#dfe1e6',
  bg: '#f4f5f7',
};

export class ReportService {
  constructor(private pool: Pool) {}

  /**
   * Gather compliance data for a provider
   */
  async gatherProviderData(providerId: string, generatedBy: string): Promise<ComplianceReportData> {
    const providerResult = await this.pool.query<{
      id: string;
      legal_name: string;
      rut: string;
      city: string;
      department: string;
    }>('SELECT id, legal_name, rut, city, department FROM providers WHERE id = $1', [providerId]);

    if (providerResult.rows.length === 0) {
      throw new Error('Provider not found');
    }

    const provider = providerResult.rows[0];

    // Findings metrics
    const findingsResult = await this.pool.query<{
      total: string;
      open: string;
      in_progress: string;
      resolved: string;
      closed: string;
      overdue: string;
      avg_risk: string;
    }>(
      `SELECT
        COUNT(*)::text as total,
        COUNT(*) FILTER (WHERE status = 'open')::text as open,
        COUNT(*) FILTER (WHERE status = 'in_progress')::text as in_progress,
        COUNT(*) FILTER (WHERE status = 'resolved')::text as resolved,
        COUNT(*) FILTER (WHERE status = 'closed')::text as closed,
        COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status NOT IN ('closed','resolved'))::text as overdue,
        COALESCE(AVG(risk_score), 0)::text as avg_risk
       FROM findings WHERE provider_id = $1`,
      [providerId]
    ).catch(() => ({ rows: [{ total: '0', open: '0', in_progress: '0', resolved: '0', closed: '0', overdue: '0', avg_risk: '0' }] }));

    const m = findingsResult.rows[0];
    const total = parseInt(m.total) || 0;
    const resolved = parseInt(m.resolved) || 0;
    const closed = parseInt(m.closed) || 0;

    // Porcentaje de cumplimiento real desde la evaluación más reciente del prestador
    const assessmentPctResult = await this.pool.query<{ compliance_pct: string }>(
      `SELECT COALESCE(MAX(compliance_pct), 0)::text AS compliance_pct
       FROM assessments
       WHERE provider_id = $1 AND status NOT IN ('draft')`,
      [providerId]
    ).catch(() => ({ rows: [{ compliance_pct: '0' }] }));
    const compliancePercentage = parseFloat(assessmentPctResult.rows[0]?.compliance_pct) || 0;

    // Top findings
    const topResult = await this.pool.query<{
      title: string;
      severity: string;
      risk_score: string;
      status: string;
      days_overdue: string;
    }>(
      `SELECT title, severity, COALESCE(risk_score, 0)::text as risk_score, status,
        GREATEST(0, (CURRENT_DATE - due_date))::text as days_overdue
       FROM findings
       WHERE provider_id = $1 AND status NOT IN ('closed')
       ORDER BY COALESCE(risk_score, 0) DESC
       LIMIT 10`,
      [providerId]
    ).catch(() => ({ rows: [] }));

    // Document compliance (optional)
    let docCompliance;
    try {
      const docResult = await this.pool.query(
        'SELECT * FROM provider_document_compliance WHERE provider_id = $1',
        [providerId]
      );
      if (docResult.rows.length > 0) {
        const d = docResult.rows[0];
        docCompliance = {
          totalRequired: parseInt(d.total_required) || 0,
          compliantCount: parseInt(d.compliant_count) || 0,
          expiredCount: parseInt(d.expired_count) || 0,
          pendingCount: parseInt(d.pending_count) || 0,
          compliancePercentage: parseFloat(d.compliance_percentage) || 0,
        };
      }
    } catch {
      // Schema may not be migrated yet
    }

    return {
      provider,
      generatedAt: new Date(),
      generatedBy,
      metrics: {
        totalFindings: total,
        openFindings: parseInt(m.open) || 0,
        inProgressFindings: parseInt(m.in_progress) || 0,
        resolvedFindings: resolved,
        closedFindings: closed,
        overdueFindings: parseInt(m.overdue) || 0,
        averageRiskScore: parseFloat(m.avg_risk) || 0,
        compliancePercentage,
      },
      documentCompliance: docCompliance,
      topFindings: (topResult.rows || []).map(r => ({
        title: r.title,
        severity: r.severity,
        riskScore: parseFloat(r.risk_score) || 0,
        status: r.status,
        daysOverdue: parseInt(r.days_overdue) || 0,
      })),
    };
  }

  /**
   * Generate PDF compliance report
   */
  async generatePdfReport(providerId: string, generatedBy: string): Promise<Buffer> {
    const data = await this.gatherProviderData(providerId, generatedBy);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'LETTER',
          margin: 50,
          info: {
            Title: `Reporte de Cumplimiento - ${data.provider.legal_name}`,
            Author: 'Sistema Norma 3100',
            Subject: 'Reporte de Cumplimiento Norma 3100',
            Keywords: 'compliance, norma 3100, healthcare',
            CreationDate: data.generatedAt,
          },
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        this.renderPdfContent(doc, data);
        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  private renderPdfContent(doc: PDFKit.PDFDocument, data: ComplianceReportData): void {
    const pageWidth = doc.page.width - 100;

    // === HEADER ===
    doc
      .fillColor(COLORS.primary)
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('Reporte de Cumplimiento', 50, 50);

    doc
      .fillColor(COLORS.muted)
      .fontSize(12)
      .font('Helvetica')
      .text('Norma 3100 de 2019 - Ministerio de Salud de Colombia', 50, 80);

    // Horizontal rule
    doc
      .moveTo(50, 105)
      .lineTo(50 + pageWidth, 105)
      .strokeColor(COLORS.border)
      .lineWidth(1)
      .stroke();

    // === PROVIDER INFO ===
    let y = 125;
    doc.fillColor(COLORS.text).fontSize(14).font('Helvetica-Bold').text('Información del Prestador', 50, y);
    y += 22;
    doc.fontSize(10).font('Helvetica');
    doc.text(`Razón Social: ${data.provider.legal_name}`, 50, y);
    y += 15;
    doc.text(`RUT: ${data.provider.rut}`, 50, y);
    y += 15;
    doc.text(`Ubicación: ${data.provider.city}, ${data.provider.department}`, 50, y);
    y += 15;
    doc.text(`Fecha de Generación: ${data.generatedAt.toLocaleString('es-CO')}`, 50, y);
    y += 15;
    doc.text(`Generado por: ${data.generatedBy}`, 50, y);
    y += 30;

    // === COMPLIANCE METRICS ===
    doc.fillColor(COLORS.text).fontSize(14).font('Helvetica-Bold').text('Métricas de Cumplimiento', 50, y);
    y += 25;

    // Big compliance percentage box
    const pct = Math.round(data.metrics.compliancePercentage);
    const pctColor = pct >= 80 ? COLORS.success : pct >= 50 ? COLORS.warning : COLORS.danger;

    doc.rect(50, y, pageWidth, 60).fillAndStroke(COLORS.bg, COLORS.border);
    doc
      .fillColor(pctColor)
      .fontSize(36)
      .font('Helvetica-Bold')
      .text(`${pct}%`, 70, y + 12);
    doc
      .fillColor(COLORS.text)
      .fontSize(11)
      .font('Helvetica')
      .text('Cumplimiento General', 160, y + 18);
    doc
      .fillColor(COLORS.muted)
      .fontSize(9)
      .text(
        pct >= 80 ? 'Cumplimiento Alto' : pct >= 50 ? 'Cumplimiento Parcial' : 'Cumplimiento Bajo',
        160,
        y + 35
      );

    // Risk score on the right
    doc
      .fillColor(COLORS.text)
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('Riesgo Promedio', 380, y + 18);
    doc
      .fontSize(24)
      .text(Math.round(data.metrics.averageRiskScore).toString(), 380, y + 32);
    doc
      .fillColor(COLORS.muted)
      .fontSize(9)
      .font('Helvetica')
      .text('/100', 420, y + 45);

    y += 80;

    // === FINDINGS BREAKDOWN ===
    doc.fillColor(COLORS.text).fontSize(14).font('Helvetica-Bold').text('Estado de Hallazgos', 50, y);
    y += 25;

    const breakdown = [
      { label: 'Total', value: data.metrics.totalFindings, color: COLORS.primary },
      { label: 'Abiertos', value: data.metrics.openFindings, color: COLORS.danger },
      { label: 'En Progreso', value: data.metrics.inProgressFindings, color: COLORS.primary },
      { label: 'Resueltos', value: data.metrics.resolvedFindings, color: COLORS.success },
      { label: 'Cerrados', value: data.metrics.closedFindings, color: COLORS.muted },
      { label: 'Vencidos', value: data.metrics.overdueFindings, color: COLORS.warning },
    ];

    const cardW = (pageWidth - 25) / 6;
    breakdown.forEach((item, idx) => {
      const x = 50 + idx * (cardW + 5);
      doc.rect(x, y, cardW, 55).fillAndStroke(COLORS.bg, COLORS.border);
      doc
        .fillColor(item.color)
        .fontSize(18)
        .font('Helvetica-Bold')
        .text(item.value.toString(), x, y + 8, { width: cardW, align: 'center' });
      doc
        .fillColor(COLORS.muted)
        .fontSize(8)
        .font('Helvetica')
        .text(item.label, x, y + 35, { width: cardW, align: 'center' });
    });

    y += 75;

    // === DOCUMENT COMPLIANCE (if available) ===
    if (data.documentCompliance) {
      doc.fillColor(COLORS.text).fontSize(14).font('Helvetica-Bold').text('Matriz Documental', 50, y);
      y += 25;
      const dc = data.documentCompliance;
      doc.fontSize(10).font('Helvetica').fillColor(COLORS.text);
      doc.text(`Documentos requeridos: ${dc.totalRequired}`, 50, y);
      y += 14;
      doc.fillColor(COLORS.success).text(`Conformes: ${dc.compliantCount}`, 50, y);
      y += 14;
      doc.fillColor(COLORS.danger).text(`Vencidos: ${dc.expiredCount}`, 50, y);
      y += 14;
      doc.fillColor(COLORS.muted).text(`Pendientes: ${dc.pendingCount}`, 50, y);
      y += 14;
      doc
        .fillColor(COLORS.primary)
        .font('Helvetica-Bold')
        .text(`Cumplimiento documental: ${Math.round(dc.compliancePercentage)}%`, 50, y);
      y += 25;
    }

    // === TOP FINDINGS ===
    if (data.topFindings.length > 0) {
      if (y > 650) {
        doc.addPage();
        y = 50;
      }
      doc
        .fillColor(COLORS.text)
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Hallazgos Prioritarios', 50, y);
      y += 25;

      // Table header
      doc.rect(50, y, pageWidth, 20).fill(COLORS.primary);
      doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
      doc.text('Hallazgo', 55, y + 6, { width: 280 });
      doc.text('Severidad', 340, y + 6, { width: 70 });
      doc.text('Riesgo', 415, y + 6, { width: 50 });
      doc.text('Estado', 470, y + 6, { width: 80 });
      y += 20;

      data.topFindings.forEach((f, idx) => {
        if (y > 720) {
          doc.addPage();
          y = 50;
        }
        const bg = idx % 2 === 0 ? '#ffffff' : COLORS.bg;
        doc.rect(50, y, pageWidth, 22).fill(bg);
        doc.fillColor(COLORS.text).fontSize(9).font('Helvetica');
        const title = f.title.length > 55 ? f.title.substring(0, 55) + '...' : f.title;
        doc.text(title, 55, y + 6, { width: 280 });

        const sevColor =
          f.severity === 'critical' ? COLORS.danger : f.severity === 'high' ? COLORS.warning : COLORS.muted;
        doc.fillColor(sevColor).font('Helvetica-Bold').text(f.severity.toUpperCase(), 340, y + 6);
        doc.fillColor(COLORS.text).font('Helvetica').text(Math.round(f.riskScore).toString(), 415, y + 6);
        doc.text(f.status, 470, y + 6, { width: 80 });
        y += 22;
      });
    }

    // === FOOTER ===
    const footerY = doc.page.height - 60;
    doc
      .moveTo(50, footerY)
      .lineTo(50 + pageWidth, footerY)
      .strokeColor(COLORS.border)
      .lineWidth(0.5)
      .stroke();
    doc
      .fillColor(COLORS.muted)
      .fontSize(8)
      .font('Helvetica')
      .text(
        `Generado el ${data.generatedAt.toLocaleString('es-CO')} · Sistema de Gestión Norma 3100 · Página ${doc.bufferedPageRange().start + doc.bufferedPageRange().count}`,
        50,
        footerY + 10,
        { width: pageWidth, align: 'center' }
      );
  }

  // ============================================================
  // INFORME DE AUDITORÍA OFICIAL — Resolución 3100 de 2019
  // Organizado por los 7 estándares transversales
  // ============================================================

  /**
   * Recopila datos para el informe de auditoría oficial por estándares
   */
  async gatherAuditReportData(providerId: string, assessmentId?: string): Promise<{
    provider: ComplianceReportData['provider'];
    servicio: { codigo: string; nombre: string } | null;
    fechaInforme: Date;
    estandares: Array<{
      codigo: string;
      nombre: string;
      totalCriterios: number;
      cumple: number;
      noCumple: number;
      noAplica: number;
      porcentajeCumplimiento: number; // -1 = sin criterios aplicables (todo NA)
      semaforo: 'verde' | 'naranja' | 'rojo' | 'na';
      hallazgos: Array<{ criterio: string; descripcion: string; tipo: string; severidad: string }>;
    }>;
    resumenCondiciones: {
      condicion1CumpleTecnicoAdministrativa: boolean | null;
      condicion2CumpleSuficienciaPatrimonial: boolean | null;
      condicion3PorcentajeCapacidadTecnologica: number;
    };
    conceptoHabilitacion: 'habilitado' | 'no_habilitado' | 'habilitado_condicionado' | 'pendiente';
  }> {
    const provResult = await this.pool.query<ComplianceReportData['provider']>(
      'SELECT id, legal_name, rut, city, department FROM providers WHERE id = $1',
      [providerId]
    );
    if (provResult.rows.length === 0) {throw new Error('Provider not found');}
    const provider = provResult.rows[0];

    // Obtener servicio asociado al assessment
    let servicio: { codigo: string; nombre: string } | null = null;
    if (assessmentId) {
      const svcResult = await this.pool.query<{ code: string; name: string }>(
        `SELECT s.code, s.name FROM assessments a
         JOIN services s ON s.id = a.service_id
         WHERE a.id = $1 AND a.service_id IS NOT NULL`,
        [assessmentId]
      ).catch(() => ({ rows: [] as { code: string; name: string }[] }));
      if (svcResult.rows.length > 0) {
        servicio = { codigo: svcResult.rows[0].code, nombre: svcResult.rows[0].name };
      }
    }

    // Obtener los 7 estándares transversales — solo el que tiene criterios reales
    const estandaresResult = await this.pool.query<{
      id: string; code: string; name: string;
    }>(
      `SELECT es.id, es.code, es.name
       FROM evaluation_standards es
       WHERE es.is_transversal = TRUE
         AND EXISTS (
           SELECT 1 FROM evaluation_criteria ec WHERE ec.standard_id = es.id
         )
       ORDER BY CASE es.code
         WHEN 'TSTH'  THEN 1
         WHEN 'TSINF' THEN 2
         WHEN 'TSDOT' THEN 3
         WHEN 'TSMD'  THEN 4
         WHEN 'TSPP'  THEN 5
         WHEN 'TSHCR' THEN 6
         WHEN 'TSINT' THEN 7
         ELSE 8
       END`,
    ).catch(() => ({ rows: [] }));

    const estandares = [];

    for (const est of estandaresResult.rows) {
      // Métricas por estándar (si hay assessment)
      let metricas = { cumple: 0, noCumple: 0, noAplica: 0, total: 0 };

      if (assessmentId) {
        const mResult = await this.pool.query<{
          cumple: string; no_cumple: string; no_aplica: string; total: string;
        }>(
          `SELECT
            COUNT(*) FILTER (WHERE acr.response_status = 'C')::text AS cumple,
            COUNT(*) FILTER (WHERE acr.response_status = 'NC')::text AS no_cumple,
            COUNT(*) FILTER (WHERE acr.response_status = 'NA')::text AS no_aplica,
            COUNT(*)::text AS total
           FROM assessment_responses_detailed acr
           JOIN evaluation_criteria ec ON ec.id = acr.criterion_id
           WHERE acr.assessment_id = $1 AND ec.standard_id = $2`,
          [assessmentId, est.id]
        ).catch(() => ({ rows: [] }));

        if (mResult.rows.length > 0) {
          const r = mResult.rows[0];
          metricas = {
            cumple: parseInt(r.cumple) || 0,
            noCumple: parseInt(r.no_cumple) || 0,
            noAplica: parseInt(r.no_aplica) || 0,
            total: parseInt(r.total) || 0,
          };
        }
      } else {
        // Sin assessment: contar hallazgos abiertos de este estándar
        const hResult = await this.pool.query<{ total: string }>(
          `SELECT COUNT(*)::text AS total FROM findings f
           WHERE f.provider_id = $1 AND f.status NOT IN ('cerrada', 'closed')`,
          [providerId]
        ).catch(() => ({ rows: [{ total: '0' }] }));
        metricas.noCumple = parseInt(hResult.rows[0]?.total) || 0;
      }

      const aplicables = metricas.cumple + metricas.noCumple;
      // -1 indica "sin criterios aplicables" (todo NA) — no se evalúa
      const pct = aplicables > 0 ? Math.round((metricas.cumple / aplicables) * 100) : -1;
      const semaforo: 'verde' | 'naranja' | 'rojo' | 'na' =
        pct === -1 ? 'na' : pct >= 80 ? 'verde' : pct >= 50 ? 'naranja' : 'rojo';

      // Hallazgos NC de este estándar — usa el texto negado de la respuesta si existe
      const hallazgosResult = await this.pool.query<{
        title: string; criterion_code: string; severity: string; status: string;
      }>(
        `SELECT
                COALESCE(
                  NULLIF(acr.description, ''),
                  CASE
                    WHEN ec.code IS NOT NULL AND ec.name IS NOT NULL THEN ec.name
                    ELSE COALESCE(NULLIF(f.title, ''), f.description, '')
                  END
                ) AS title,
                COALESCE(ec.code, '') AS criterion_code,
                f.severity, f.status
         FROM findings f
         LEFT JOIN evaluation_criteria ec ON ec.id = f.criterion_id
         LEFT JOIN evaluation_standards es ON es.id = ec.standard_id
         LEFT JOIN assessment_responses_detailed acr ON acr.id = f.assessment_response_id
         WHERE f.provider_id = $1
           AND es.code = $2
           AND f.status NOT IN ('cerrada', 'closed')
         ORDER BY f.severity DESC, ec.code
         LIMIT 20`,
        [providerId, est.code]
      ).catch(() => ({ rows: [] }));

      estandares.push({
        codigo: est.code,
        nombre: est.name,
        totalCriterios: metricas.total || metricas.cumple + metricas.noCumple + metricas.noAplica,
        cumple: metricas.cumple,
        noCumple: metricas.noCumple,
        noAplica: metricas.noAplica,
        porcentajeCumplimiento: pct,
        semaforo,
        hallazgos: hallazgosResult.rows.map(h => ({
          criterio: h.criterion_code,
          descripcion: h.title.replace(/^\d+(\.\d+)*\.\s*/, ''),
          tipo: 'no_conformidad',
          severidad: h.severity || 'media',
        })),
      });
    }

    // Condición 2: suficiencia patrimonial
    const sp2 = await this.pool.query<{ cumple_suficiencia: boolean }>(
      `SELECT cumple_suficiencia FROM suficiencia_patrimonial
       WHERE provider_id = $1 ORDER BY periodo_fiscal DESC LIMIT 1`,
      [providerId]
    ).catch(() => ({ rows: [] }));

    const totalHallazgosAbiertos = estandares.reduce((s, e) => s + e.noCumple, 0);
    const totalCumple = estandares.reduce((s, e) => s + e.cumple, 0);
    // Fórmula Norma 3100: solo criterios aplicables (C + NC), NA no entra en el denominador
    const totalAplicables = estandares.reduce((s, e) => s + e.cumple + e.noCumple, 0);
    const pctGlobal = totalAplicables > 0 ? Math.round((totalCumple / totalAplicables) * 100) : 0;

    const condicion2Cumple = sp2.rows[0]?.cumple_suficiencia ?? null;
    const conceptoHabilitacion =
      pctGlobal >= 80 && condicion2Cumple !== false
        ? 'habilitado'
        : pctGlobal >= 60
        ? 'habilitado_condicionado'
        : 'no_habilitado';

    return {
      provider,
      servicio,
      fechaInforme: new Date(),
      estandares,
      resumenCondiciones: {
        condicion1CumpleTecnicoAdministrativa: null, // Requires manual verification
        condicion2CumpleSuficienciaPatrimonial: condicion2Cumple,
        condicion3PorcentajeCapacidadTecnologica: pctGlobal,
      },
      conceptoHabilitacion,
    };
  }

  /**
   * Genera el PDF del Informe de Auditoría oficial según Res. 3100
   * Estructura: portada → condiciones habilitación → resultado por estándar → hallazgos → concepto
   */
  async generateAuditReportPdf(providerId: string, generatedBy: string, assessmentId?: string): Promise<Buffer> {
    const data = await this.gatherAuditReportData(providerId, assessmentId);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'LETTER',
          margin: 50,
          info: {
            Title: `Informe de Auditoría — ${data.provider.legal_name}`,
            Author: generatedBy,
            Subject: 'Informe de Verificación de Condiciones de Habilitación — Resolución 3100 de 2019',
            CreationDate: data.fechaInforme,
          },
        });

        const chunks: Buffer[] = [];
        doc.on('data', (c: Buffer) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const W = doc.page.width - 100;

        // ── PORTADA ──────────────────────────────────────────────
        doc.fillColor(COLORS.primary).rect(50, 50, W, 6).fill();
        doc.moveDown(2);

        doc.fillColor(COLORS.primary).fontSize(20).font('Helvetica-Bold')
          .text('INFORME DE AUDITORÍA DE HABILITACIÓN', 50, 80, { align: 'center', width: W });
        doc.fillColor(COLORS.muted).fontSize(11).font('Helvetica')
          .text('Resolución 3100 de 2019 — Ministerio de Salud y Protección Social', 50, 108, { align: 'center', width: W });

        doc.fillColor(COLORS.border).rect(50, 135, W, 1).fill();

        let y = 160;
        const info = [
          ['Prestador:', data.provider.legal_name],
          ['NIT/RUT:', data.provider.rut],
          ['Municipio:', `${data.provider.city}, ${data.provider.department}`],
          ...(data.servicio ? [['Servicio Habilitado:', `[${data.servicio.codigo}] ${data.servicio.nombre}`]] : []),
          ['Fecha del Informe:', data.fechaInforme.toLocaleDateString('es-CO')],
          ['Generado por:', generatedBy],
        ];
        info.forEach(([label, val]) => {
          doc.fillColor(COLORS.text).fontSize(10).font('Helvetica-Bold').text(label, 50, y);
          doc.font('Helvetica').text(val, 200, y);
          y += 18;
        });

        // Concepto de habilitación — semáforo visual
        y += 15;
        const conceptoColor =
          data.conceptoHabilitacion === 'habilitado' ? COLORS.success :
          data.conceptoHabilitacion === 'habilitado_condicionado' ? COLORS.warning : COLORS.danger;
        const conceptoLabel =
          data.conceptoHabilitacion === 'habilitado' ? 'HABILITADO' :
          data.conceptoHabilitacion === 'habilitado_condicionado' ? 'HABILITADO CON CONDICIONAMIENTOS' : 'NO HABILITADO';

        doc.rect(50, y, W, 50).fill(conceptoColor + '22');
        doc.rect(50, y, 6, 50).fill(conceptoColor);
        doc.fillColor(conceptoColor).fontSize(18).font('Helvetica-Bold')
          .text(conceptoLabel, 70, y + 15, { width: W - 30 });
        doc.fillColor(COLORS.muted).fontSize(9).font('Helvetica')
          .text(`Porcentaje global de cumplimiento Condición 3: ${data.resumenCondiciones.condicion3PorcentajeCapacidadTecnologica}%`, 70, y + 35, { width: W - 30 });

        // ── 3 CONDICIONES DE HABILITACIÓN ────────────────────────
        doc.addPage();
        y = 50;
        doc.fillColor(COLORS.primary).fontSize(14).font('Helvetica-Bold')
          .text('1. CONDICIONES DE HABILITACIÓN', 50, y);
        y += 25;

        const condiciones = [
          {
            numero: '1.1',
            nombre: 'Capacidad Técnico-Administrativa (Cap. 8, Res. 3100/2019)',
            cumple: data.resumenCondiciones.condicion1CumpleTecnicoAdministrativa,
            detalle: 'Acreditación jurídica, uso de suelo, REPS activo, manual de procesos y PAMEC.',
          },
          {
            numero: '1.2',
            nombre: 'Suficiencia Patrimonial y Financiera (Cap. 9, Res. 3100/2019)',
            cumple: data.resumenCondiciones.condicion2CumpleSuficienciaPatrimonial,
            detalle: 'Estados financieros, póliza RC, declaración de renta, certificación bancaria.',
          },
          {
            numero: '1.3',
            nombre: 'Capacidad Tecnológica y Científica (Cap. 11, Res. 3100/2019)',
            cumple: data.resumenCondiciones.condicion3PorcentajeCapacidadTecnologica >= 80,
            detalle: `7 estándares transversales evaluados. Cumplimiento global: ${data.resumenCondiciones.condicion3PorcentajeCapacidadTecnologica}%`,
          },
        ];

        condiciones.forEach((c) => {
          const cumpleStr = c.cumple === null ? 'PENDIENTE' : c.cumple ? 'CUMPLE' : 'NO CUMPLE';
          const bgColor = c.cumple === null ? COLORS.bg : c.cumple ? '#E3FCEF' : '#FFEBE6';
          const txColor = c.cumple === null ? COLORS.muted : c.cumple ? COLORS.success : COLORS.danger;

          doc.rect(50, y, W, 52).fill(bgColor);
          doc.fillColor(COLORS.text).fontSize(10).font('Helvetica-Bold').text(`${c.numero} ${c.nombre}`, 58, y + 8, { width: W - 100 });
          doc.fillColor(COLORS.muted).fontSize(9).font('Helvetica').text(c.detalle, 58, y + 24, { width: W - 100 });
          doc.fillColor(txColor).fontSize(11).font('Helvetica-Bold').text(cumpleStr, W - 30, y + 18, { align: 'right' });
          y += 60;
        });

        // ── RESULTADOS POR ESTÁNDAR ──────────────────────────────
        y += 10;
        doc.fillColor(COLORS.primary).fontSize(14).font('Helvetica-Bold')
          .text('2. RESULTADOS POR ESTÁNDAR TRANSVERSAL', 50, y);
        y += 25;

        // Tabla encabezado
        doc.rect(50, y, W, 20).fill(COLORS.primary);
        doc.fillColor('#fff').fontSize(9).font('Helvetica-Bold');
        doc.text('Estándar', 58, y + 6, { width: 200 });
        doc.text('C', 268, y + 6, { width: 30, align: 'center' });
        doc.text('NC', 305, y + 6, { width: 30, align: 'center' });
        doc.text('% Cumpl.', 348, y + 6, { width: 60, align: 'center' });
        doc.text('Semáforo', 414, y + 6, { width: 70, align: 'center' });
        y += 20;

        data.estandares.forEach((est, idx) => {
          if (y > 700) { doc.addPage(); y = 50; }
          const bg = idx % 2 === 0 ? '#ffffff' : COLORS.bg;
          doc.rect(50, y, W, 24).fill(bg);

          const esNA = est.semaforo === 'na';
          const semColor = est.semaforo === 'verde' ? COLORS.success :
            est.semaforo === 'naranja' ? COLORS.warning :
            est.semaforo === 'na' ? COLORS.muted : COLORS.danger;

          doc.fillColor(COLORS.text).fontSize(9).font('Helvetica-Bold')
            .text(`${est.codigo} — ${est.nombre}`, 58, y + 7, { width: 200 });
          doc.font('Helvetica').fillColor(COLORS.success).text(est.cumple.toString(), 268, y + 7, { width: 30, align: 'center' });
          doc.fillColor(COLORS.danger).text(est.noCumple.toString(), 305, y + 7, { width: 30, align: 'center' });
          doc.fillColor(COLORS.text).font('Helvetica-Bold').text(esNA ? 'N/A' : `${est.porcentajeCumplimiento}%`, 348, y + 7, { width: 60, align: 'center' });
          doc.fillColor(semColor).text(esNA ? 'NO APLICA' : est.semaforo.toUpperCase(), 414, y + 7, { width: 70, align: 'center' });
          y += 24;
        });

        // ── HALLAZGOS POR ESTÁNDAR ───────────────────────────────
        doc.addPage();
        y = 50;
        doc.fillColor(COLORS.primary).fontSize(14).font('Helvetica-Bold')
          .text('3. HALLAZGOS IDENTIFICADOS POR ESTÁNDAR', 50, y);
        y += 20;

        data.estandares.forEach((est) => {
          if (est.hallazgos.length === 0) {return;}
          if (y > 650) { doc.addPage(); y = 50; }

          doc.fillColor(COLORS.text).fontSize(11).font('Helvetica-Bold')
            .text(`${est.codigo} — ${est.nombre}`, 50, y);
          y += 16;

          est.hallazgos.forEach((h, i) => {
            if (y > 700) { doc.addPage(); y = 50; }
            const sevColor = h.severidad === 'critica' || h.severidad === 'critical' ? COLORS.danger :
              h.severidad === 'alta' || h.severidad === 'high' ? COLORS.warning : COLORS.muted;

            doc.fontSize(9).font('Helvetica').fillColor(COLORS.muted)
              .text(`${i + 1}.`, 58, y);
            doc.fillColor(COLORS.text).text(h.descripcion, 72, y, { width: W - 130 });
            doc.fillColor(sevColor).font('Helvetica-Bold')
              .text(h.severidad.toUpperCase(), W - 40, y, { width: 80, align: 'right' });
            y += 16;
          });

          y += 8;
        });

        // ── FIRMAS ───────────────────────────────────────────────
        if (y > 650) { doc.addPage(); y = 50; }
        y += 20;
        doc.fillColor(COLORS.border).rect(50, y, W, 1).fill();
        y += 20;

        doc.fillColor(COLORS.text).fontSize(10).font('Helvetica-Bold').text('FIRMAS', 50, y);
        y += 20;

        // Firma auditor (única firma requerida)
        doc.rect(50, y + 30, W, 1).fill(COLORS.text);
        doc.fontSize(8).font('Helvetica').fillColor(COLORS.muted)
          .text('Firma del Auditor Líder', 50, y + 34, { width: W, align: 'center' });

        // ── PIE DE PÁGINA ────────────────────────────────────────
        const footerY = doc.page.height - 50;
        doc.fillColor(COLORS.muted).fontSize(7).font('Helvetica')
          .text(
            `Informe generado el ${data.fechaInforme.toLocaleString('es-CO')} · Sistema de Gestión Norma 3100 · Resolución 3100 de 2019`,
            50, footerY, { width: W, align: 'center' }
          );

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Genera el DOCX del Informe de Auditoría oficial según Res. 3100 (MODELO 2023)
   * Estructura: encabezado narrativo → datos prestador → introducción → estándares+hallazgos → concepto → firmas
   */
  async generateAuditReportDocx(providerId: string, generatedBy: string, assessmentId?: string): Promise<Buffer> {
    const data = await this.gatherAuditReportData(providerId, assessmentId);

    // Fecha formateada en español colombiano
    const fechaObj = data.fechaInforme;
    const dia = fechaObj.getDate();
    const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    const mes = meses[fechaObj.getMonth()];
    const anio = fechaObj.getFullYear();
    const deptFormatted = data.provider.department
      ? data.provider.department.charAt(0).toUpperCase() + data.provider.department.slice(1).toLowerCase()
      : '';

    // Leer imágenes de assets
    const letterheadPath = path.join(ASSETS_DIR, 'letterhead.jpeg');
    const signaturePath = path.join(ASSETS_DIR, 'signature.jpeg');
    // Reducir opacidad del membrete al 35% para que no tape el texto del informe
    let letterheadBuf: Buffer | null = null;
    if (fs.existsSync(letterheadPath)) {
      const rawJpeg = fs.readFileSync(letterheadPath);
      const meta = await sharp(rawJpeg).metadata();
      const w = meta.width!;
      const h = meta.height!;
      // Máscara de un solo canal rellena con 89 (35% de 255) → reduce alpha a 35%
      const alphaMask = Buffer.alloc(w * h, 89);
      letterheadBuf = await sharp(rawJpeg)
        .ensureAlpha()
        .composite([{ input: alphaMask, raw: { width: w, height: h, channels: 1 }, blend: 'dest-in' }])
        .png()
        .toBuffer();
    }
    const signatureBuf = fs.existsSync(signaturePath) ? fs.readFileSync(signaturePath) : null;

    // Helper: párrafo con fuente Arial, tamaño en half-points, alineación justificada por defecto
    const p = (text: string, opts: {
      bold?: boolean; size?: number; color?: string;
      alignment?: string; spaceBefore?: number; spaceAfter?: number;
    } = {}) =>
      new Paragraph({
        alignment: (opts.alignment ?? AlignmentType.BOTH) as any,
        spacing: { before: opts.spaceBefore ?? 0, after: opts.spaceAfter ?? 120 },
        children: [
          new TextRun({
            text,
            font: 'Arial',
            size: opts.size ?? 24,
            bold: opts.bold ?? false,
            color: opts.color ?? '000000',
          }),
        ],
      });

    const labelCell = (text: string) =>
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text, font: 'Arial', size: 24, bold: true, color: '000000' })],
            spacing: { before: 60, after: 60 },
          }),
        ],
      });

    const valueCell = (text: string) =>
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text, font: 'Arial', size: 24, color: '000000' })],
            spacing: { before: 60, after: 60 },
          }),
        ],
      });

    // ── HEADER: vacío (el membrete se mueve al body para que behindDocument funcione) ──
    const headerChildren: any[] = [];

    // ── FONDO DE PÁGINA: membrete colocado en el body como primer hijo ───────────────
    // Word no aplica behindDocument correctamente para imágenes flotantes en headers
    // cuando cubren el área del body. Colocarlo en el body sí respeta el z-order.
    const bgParagraph: any[] = [];
    if (letterheadBuf) {
      bgParagraph.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: letterheadBuf,
              type: 'png',
              transformation: { width: 815, height: 1055 },
              floating: {
                horizontalPosition: {
                  relative: HorizontalPositionRelativeFrom.PAGE,
                  offset: 0,
                },
                verticalPosition: {
                  relative: VerticalPositionRelativeFrom.PAGE,
                  offset: 0,
                },
                behindDocument: true,
                wrap: { type: TextWrappingType.NONE },
              },
            } as any),
          ],
        })
      );
    }

    // ── CONTENIDO PRINCIPAL ──────────────────────────────────────────
    const children: any[] = [
      ...bgParagraph,

      // Título principal
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 240 },
        children: [
          new TextRun({
            text: 'INFORME DE AUDITORÍA EN HABILITACIÓN',
            font: 'Arial',
            size: 24,
            bold: true,
            color: '000000',
          }),
        ],
      }),

      // Párrafo introductorio
      p(
        `En el Municipio de ${data.provider.city} (${deptFormatted}) el día ${dia} de ${mes} de ${anio}, se realizó auditoría del Cumplimiento de las Condiciones del Sistema Único de Habilitación conforme a lo previsto en el Decreto 1011 de 2006, Resolución 3100 de 2019 y demás normatividad aplicable vigente.`,
        { spaceAfter: 240 }
      ),

      // ── DATOS DEL PRESTADOR ─────────────────────────────────────
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [labelCell('Nombre o razón social del prestador'), valueCell(data.provider.legal_name)] }),
          new TableRow({ children: [labelCell('Cédula de ciudadanía / NIT'), valueCell(data.provider.rut)] }),
          new TableRow({ children: [labelCell('Municipio'), valueCell(`${data.provider.city} (${deptFormatted})`)] }),
          ...(data.servicio
            ? [new TableRow({ children: [labelCell('Servicio'), valueCell(`${data.servicio.nombre}`)] })]
            : []),
        ],
      }),

      p('', { spaceAfter: 120 }),

      // Introducción hallazgos
      p('A continuación, se relacionan solamente los criterios incumplidos o hallazgos:', { spaceAfter: 200 }),

      // ── CONDICIONES TÉCNICO-CIENTÍFICAS ─────────────────────────
      p('CONDICIONES TÉCNICO-CIENTÍFICAS:', { bold: true, spaceAfter: 160 }),

      // Estándares con hallazgos
      ...data.estandares.flatMap((est) => {
        const paras: any[] = [
          p(`ESTÁNDAR DE ${est.nombre.toUpperCase()}:`, { bold: true, spaceBefore: 160, spaceAfter: 100 }),
        ];

        if (est.hallazgos.length > 0) {
          paras.push(p('Hallazgos:', { bold: true, spaceAfter: 80 }));
          est.hallazgos.forEach((h) => {
            paras.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { before: 0, after: 100 },
                children: [new TextRun({ text: h.descripcion, font: 'Arial', size: 24, color: '000000' })],
              })
            );
          });
        } else {
          paras.push(p('Todo se cumple en este estándar.', { spaceAfter: 100 }));
        }

        return paras;
      }),

      p('', { spaceAfter: 200 }),

      // ── TABLA DE RESULTADOS POR ESTÁNDAR ────────────────────────
      p('RESULTADOS POR ESTÁNDAR', { bold: true, spaceBefore: 200, spaceAfter: 160 }),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({ shading: { fill: '33CCCC', type: ShadingType.CLEAR, color: 'auto' }, children: [new Paragraph({ children: [new TextRun({ text: 'Estándar', font: 'Arial', size: 24, bold: true, color: 'FFFFFF' })] })] }),
              new TableCell({ shading: { fill: '33CCCC', type: ShadingType.CLEAR, color: 'auto' }, children: [new Paragraph({ children: [new TextRun({ text: 'C', font: 'Arial', size: 24, bold: true, color: 'FFFFFF' })] })] }),
              new TableCell({ shading: { fill: '33CCCC', type: ShadingType.CLEAR, color: 'auto' }, children: [new Paragraph({ children: [new TextRun({ text: 'NC', font: 'Arial', size: 24, bold: true, color: 'FFFFFF' })] })] }),
              new TableCell({ shading: { fill: '33CCCC', type: ShadingType.CLEAR, color: 'auto' }, children: [new Paragraph({ children: [new TextRun({ text: '% Cumpl.', font: 'Arial', size: 24, bold: true, color: 'FFFFFF' })] })] }),
              new TableCell({ shading: { fill: '33CCCC', type: ShadingType.CLEAR, color: 'auto' }, children: [new Paragraph({ children: [new TextRun({ text: 'Semáforo', font: 'Arial', size: 24, bold: true, color: 'FFFFFF' })] })] }),
            ],
          }),
          ...data.estandares.map((est) =>
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${est.codigo} — ${est.nombre}`, font: 'Arial', size: 24, color: '000000' })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: est.cumple.toString(), font: 'Arial', size: 24, color: '000000' })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: est.noCumple.toString(), font: 'Arial', size: 24, color: '000000' })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: est.semaforo === 'na' ? 'N/A' : `${est.porcentajeCumplimiento}%`, font: 'Arial', size: 24, color: '000000' })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: est.semaforo === 'verde' ? 'VERDE' : est.semaforo === 'naranja' ? 'NARANJA' : est.semaforo === 'na' ? 'NO APLICA' : 'ROJO', font: 'Arial', size: 24, color: est.semaforo === 'verde' ? '007000' : est.semaforo === 'naranja' ? 'E06000' : est.semaforo === 'na' ? '666666' : 'CC0000' })] })] }),
              ],
            })
          ),
          // Fila de TOTALES — % calculado según Res. 3100: C / (C + NC), NA no pondera
          (() => {
            const totalC = data.estandares.reduce((s, e) => s + e.cumple, 0);
            const totalNC = data.estandares.reduce((s, e) => s + e.noCumple, 0);
            const pct = data.resumenCondiciones.condicion3PorcentajeCapacidadTecnologica;
            const semaforoColor = pct >= 80 ? '007000' : pct >= 50 ? 'E06000' : 'CC0000';
            const semaforoLabel = pct >= 80 ? 'VERDE' : pct >= 50 ? 'NARANJA' : 'ROJO';
            return new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'TOTAL GENERAL', font: 'Arial', size: 24, bold: true, color: '000000' })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: totalC.toString(), font: 'Arial', size: 24, bold: true, color: '000000' })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: totalNC.toString(), font: 'Arial', size: 24, bold: true, color: '000000' })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${pct}%`, font: 'Arial', size: 24, bold: true, color: '000000' })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: semaforoLabel, font: 'Arial', size: 24, bold: true, color: semaforoColor })] })] }),
              ],
            });
          })(),
        ],
      }),

      p('', { spaceAfter: 200 }),

      // ── FIRMA DEL AUDITOR ────────────────────────────────────────
      p('', { spaceAfter: 240 }),

      // Imagen de firma (si existe)
      ...(signatureBuf ? [
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 0, after: 60 },
          children: [
            new ImageRun({
              data: signatureBuf,
              type: 'jpeg',
              transformation: { width: 180, height: 75 },
            } as any),
          ],
        }),
      ] : []),

      // Bloque profesional
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 0, after: 60 },
        children: [
          new TextRun({ text: 'Profesional que realizó la Auditoría:', font: 'Arial', size: 24, bold: true, color: '000000' }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 0, after: 60 },
        children: [new TextRun({ text: 'Dra. Adriana Perdomo M.', font: 'Arial', size: 24, bold: false, color: '000000' })],
      }),
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 0, after: 60 },
        children: [new TextRun({ text: 'Especialista en Auditoría en Salud', font: 'Arial', size: 24, color: '000000' })],
      }),
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 0, after: 360 },
        children: [new TextRun({ text: 'Verificadora en habilitación.', font: 'Arial', size: 24, color: '000000' })],
      }),

      // ── FRASE FINAL ──────────────────────────────────────────────
      new Paragraph({
        alignment: AlignmentType.BOTH,
        spacing: { before: 120, after: 0 },
        children: [
          new TextRun({ text: '\u00AB', font: 'Arial', size: 24, bold: true, color: '33CCCC' }),
          new TextRun({ text: 'El desconocimiento de la norma, no lo exime de su cumplimiento', font: 'Arial', size: 24, bold: true, color: '000000' }),
          new TextRun({ text: '\u00BB', font: 'Arial', size: 24, bold: true, color: '33CCCC' }),
        ],
      }),
    ];

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: { top: 1417, right: 1701, bottom: 1417, left: 1701 },
            },
          },
          headers: {
            default: new Header({ children: headerChildren }),
          },
          children,
        },
      ],
    });

    return Packer.toBuffer(doc);
  }

  /**
   * Generate Excel workbook report
   */
  async generateExcelReport(providerId: string, generatedBy: string): Promise<Buffer> {
    const data = await this.gatherProviderData(providerId, generatedBy);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema Norma 3100';
    workbook.created = data.generatedAt;
    workbook.modified = data.generatedAt;
    workbook.lastPrinted = data.generatedAt;

    // === SUMMARY SHEET ===
    const summary = workbook.addWorksheet('Resumen Ejecutivo', {
      properties: { tabColor: { argb: 'FF0052CC' } },
    });

    summary.columns = [
      { width: 35 },
      { width: 40 },
    ];

    // Title
    summary.mergeCells('A1:B1');
    const titleCell = summary.getCell('A1');
    titleCell.value = 'Reporte de Cumplimiento Norma 3100';
    titleCell.font = { size: 16, bold: true, color: { argb: 'FF0052CC' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    summary.getRow(1).height = 28;

    // Provider info
    summary.addRow([]);
    summary.addRow(['Razón Social', data.provider.legal_name]);
    summary.addRow(['RUT', data.provider.rut]);
    summary.addRow(['Ciudad', data.provider.city]);
    summary.addRow(['Departamento', data.provider.department]);
    summary.addRow(['Fecha de Generación', data.generatedAt.toLocaleString('es-CO')]);
    summary.addRow(['Generado por', data.generatedBy]);
    summary.addRow([]);

    // Metrics header
    const metricsHeaderRow = summary.addRow(['MÉTRICAS DE CUMPLIMIENTO', '']);
    metricsHeaderRow.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    metricsHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0052CC' },
    };
    summary.mergeCells(`A${metricsHeaderRow.number}:B${metricsHeaderRow.number}`);
    metricsHeaderRow.alignment = { horizontal: 'center' };

    summary.addRow(['Total de Hallazgos', data.metrics.totalFindings]);
    summary.addRow(['Hallazgos Abiertos', data.metrics.openFindings]);
    summary.addRow(['En Progreso', data.metrics.inProgressFindings]);
    summary.addRow(['Resueltos', data.metrics.resolvedFindings]);
    summary.addRow(['Cerrados', data.metrics.closedFindings]);
    summary.addRow(['Vencidos', data.metrics.overdueFindings]);
    summary.addRow(['Riesgo Promedio (0-100)', Math.round(data.metrics.averageRiskScore)]);

    const complianceRow = summary.addRow([
      'Cumplimiento General',
      `${Math.round(data.metrics.compliancePercentage)}%`,
    ]);
    complianceRow.font = { bold: true, size: 12 };
    const pct = data.metrics.compliancePercentage;
    complianceRow.getCell(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: pct >= 80 ? 'FFE3FCEF' : pct >= 50 ? 'FFFFF0B3' : 'FFFFEBE6' },
    };

    // Document compliance (if available)
    if (data.documentCompliance) {
      summary.addRow([]);
      const docHeaderRow = summary.addRow(['MATRIZ DOCUMENTAL', '']);
      docHeaderRow.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
      docHeaderRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF00875A' },
      };
      summary.mergeCells(`A${docHeaderRow.number}:B${docHeaderRow.number}`);
      docHeaderRow.alignment = { horizontal: 'center' };

      const dc = data.documentCompliance;
      summary.addRow(['Documentos requeridos', dc.totalRequired]);
      summary.addRow(['Conformes', dc.compliantCount]);
      summary.addRow(['Vencidos', dc.expiredCount]);
      summary.addRow(['Pendientes', dc.pendingCount]);
      summary.addRow(['Cumplimiento documental', `${Math.round(dc.compliancePercentage)}%`]);
    }

    // Style all rows
    summary.eachRow((row, rowNumber) => {
      if (rowNumber >= 3) {
        row.getCell(1).font = row.getCell(1).font || { bold: false };
        row.getCell(1).alignment = { vertical: 'middle' };
        row.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };
      }
    });

    // === FINDINGS SHEET ===
    const findingsSheet = workbook.addWorksheet('Hallazgos', {
      properties: { tabColor: { argb: 'FFDE350B' } },
    });

    findingsSheet.columns = [
      { header: '#', key: 'idx', width: 5 },
      { header: 'Hallazgo', key: 'title', width: 60 },
      { header: 'Severidad', key: 'severity', width: 12 },
      { header: 'Riesgo', key: 'risk', width: 10 },
      { header: 'Estado', key: 'status', width: 15 },
      { header: 'Días Vencido', key: 'overdue', width: 14 },
    ];

    const headerRow = findingsSheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0052CC' },
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 22;

    data.topFindings.forEach((f, idx) => {
      const row = findingsSheet.addRow({
        idx: idx + 1,
        title: f.title,
        severity: f.severity.toUpperCase(),
        risk: Math.round(f.riskScore),
        status: f.status,
        overdue: f.daysOverdue,
      });

      const sevCell = row.getCell('severity');
      const sevColor =
        f.severity === 'critical'
          ? 'FFFFEBE6'
          : f.severity === 'high'
          ? 'FFFFF0B3'
          : 'FFDEEBFF';
      sevCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sevColor } };
      sevCell.font = { bold: true };

      if (f.daysOverdue > 0) {
        row.getCell('overdue').font = { bold: true, color: { argb: 'FFDE350B' } };
      }
    });

    findingsSheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 6 },
    };

    // === METADATA SHEET ===
    const metaSheet = workbook.addWorksheet('Metadatos');
    metaSheet.columns = [{ width: 25 }, { width: 50 }];
    metaSheet.addRow(['Sistema', 'Norma 3100 Compliance Management']);
    metaSheet.addRow(['Versión', '1.0.0']);
    metaSheet.addRow(['Fecha', data.generatedAt.toISOString()]);
    metaSheet.addRow(['Generado por', data.generatedBy]);
    metaSheet.addRow(['Prestador', data.provider.legal_name]);
    metaSheet.addRow(['ID Prestador', data.provider.id]);

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    const buffer = Buffer.from(arrayBuffer as ArrayBuffer);
    logger.info({
      msg: 'Excel report generated',
      provider_id: providerId,
      size_bytes: buffer.length,
    });
    return buffer;
  }
}
