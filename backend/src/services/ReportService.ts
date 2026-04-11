/**
 * Report Service
 * Generates compliance reports in PDF and Excel formats
 */

import { Pool } from 'pg';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { logger } from '../utils/logger.js';

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
    const compliancePercentage = total > 0 ? ((resolved + closed) / total) * 100 : 0;

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
      topFindings: topResult.rows.map(r => ({
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
