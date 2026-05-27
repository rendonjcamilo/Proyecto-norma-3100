/**
 * Anexo4Service — Verificación Estándar de Historia Clínica y Registros Asistenciales
 * Implementa el formulario Anexo N° 4 (Res. 1439/2002 + 3100/2019)
 * como formulario independiente (no ligado a un prestador).
 */

import { Pool } from 'pg';
import PDFDocument from 'pdfkit';

// ─── Criterios: CONTENIDOS MÍNIMOS DE IDENTIFICACIÓN ─────────────────────────
export const CRITERIOS_IDENTIFICACION = [
  { key: 'nombres_apellidos',      label: 'Nombres y apellidos completos' },
  { key: 'estado_civil',           label: 'Estado Civil' },
  { key: 'documento_identidad',    label: 'Documento de Identidad' },
  { key: 'fecha_nacimiento',       label: 'Fecha de Nacimiento' },
  { key: 'edad',                   label: 'Edad' },
  { key: 'sexo',                   label: 'Sexo' },
  { key: 'ocupacion',              label: 'Ocupación' },
  { key: 'direccion_domicilio',    label: 'Dirección del Domicilio' },
  { key: 'telefono_domicilio',     label: 'Teléfono del Domicilio' },
  { key: 'lugar_residencia',       label: 'Lugar de Residencia' },
  { key: 'nombre_acompanante',     label: 'Nombre del Acompañante' },
  { key: 'telefono_acompanante',   label: 'Teléfono del Acompañante' },
  { key: 'nombre_responsable',     label: 'Nombre de la Persona Responsable' },
  { key: 'telefono_responsable',   label: 'Teléfono de la Persona Responsable' },
  { key: 'parentesco_responsable', label: 'Parentesco de la Persona Responsable' },
  { key: 'aseguradora',            label: 'Aseguradora' },
  { key: 'tipo_vinculacion',       label: 'Tipo de Vinculación' },
  { key: 'consentimiento_informado', label: 'Consentimiento Informado' },
  { key: 'anexos',                 label: 'Anexos' },
] as const;

export type CriterioKey = (typeof CRITERIOS_IDENTIFICACION)[number]['key'];
export type EstadoCriterio = 'C' | 'NC' | null;

export interface HCRegistro {
  numero_hc: string;
  nombre_usuario: string;
  criterios: Partial<Record<CriterioKey, EstadoCriterio>>;
}

export interface Anexo4Verificacion {
  id: string;
  servicio: string;
  fecha: string;
  auditor_id: string | null;
  auditor_nombre?: string | null;
  registros: HCRegistro[];
  observaciones: string | null;
  assessment_id: string | null;
  created_at: string;
  updated_at: string;
}

export class Anexo4Service {
  constructor(private pool: Pool) {}

  async list(limit = 50): Promise<Anexo4Verificacion[]> {
    const { rows } = await this.pool.query<Anexo4Verificacion>(
      `SELECT a.*,
              COALESCE(u.first_name || ' ' || u.last_name, 'Auditor') AS auditor_nombre
       FROM   anexo4_verificaciones a
       LEFT JOIN users u ON u.id = a.auditor_id
       ORDER BY a.fecha DESC, a.created_at DESC
       LIMIT $1`,
      [limit],
    );
    return rows;
  }

  async getById(id: string): Promise<Anexo4Verificacion | null> {
    const { rows } = await this.pool.query<Anexo4Verificacion>(
      `SELECT a.*,
              COALESCE(u.first_name || ' ' || u.last_name, 'Auditor') AS auditor_nombre
       FROM   anexo4_verificaciones a
       LEFT JOIN users u ON u.id = a.auditor_id
       WHERE  a.id = $1`,
      [id],
    );
    return rows[0] ?? null;
  }

  async getByAssessmentId(assessmentId: string): Promise<Anexo4Verificacion | null> {
    const { rows } = await this.pool.query<Anexo4Verificacion>(
      `SELECT a.*,
              COALESCE(u.first_name || ' ' || u.last_name, 'Auditor') AS auditor_nombre
       FROM   anexo4_verificaciones a
       LEFT JOIN users u ON u.id = a.auditor_id
       WHERE  a.assessment_id = $1
       ORDER BY a.created_at DESC
       LIMIT 1`,
      [assessmentId],
    );
    return rows[0] ?? null;
  }

  async create(data: {
    servicio: string;
    fecha: string;
    auditor_id: string;
    registros: HCRegistro[];
    observaciones?: string | null;
    assessment_id?: string | null;
  }): Promise<Anexo4Verificacion> {
    const { rows } = await this.pool.query<Anexo4Verificacion>(
      `INSERT INTO anexo4_verificaciones
         (servicio, fecha, auditor_id, registros, observaciones, assessment_id)
       VALUES ($1, $2, $3, $4::jsonb, $5, $6)
       RETURNING *`,
      [
        data.servicio,
        data.fecha,
        data.auditor_id,
        JSON.stringify(data.registros),
        data.observaciones ?? null,
        data.assessment_id ?? null,
      ],
    );
    return rows[0];
  }

  async update(
    id: string,
    data: {
      servicio?: string;
      fecha?: string;
      registros?: HCRegistro[];
      observaciones?: string | null;
    },
  ): Promise<Anexo4Verificacion | null> {
    const sets: string[] = ['updated_at = NOW()'];
    const params: unknown[] = [];
    let p = 1;

    if (data.servicio !== undefined)     { sets.push(`servicio = $${p++}`);           params.push(data.servicio); }
    if (data.fecha !== undefined)        { sets.push(`fecha = $${p++}`);              params.push(data.fecha); }
    if (data.registros !== undefined)    { sets.push(`registros = $${p++}::jsonb`);   params.push(JSON.stringify(data.registros)); }
    if (data.observaciones !== undefined){ sets.push(`observaciones = $${p++}`);      params.push(data.observaciones); }

    params.push(id);
    const { rows } = await this.pool.query<Anexo4Verificacion>(
      `UPDATE anexo4_verificaciones SET ${sets.join(', ')} WHERE id = $${p} RETURNING *`,
      params,
    );
    return rows[0] ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      'DELETE FROM anexo4_verificaciones WHERE id = $1',
      [id],
    );
    return (rowCount ?? 0) > 0;
  }

  // ─── PDF (landscape A4) — estilo formulario oficial blanco/negro ─────────────
  generatePdf(v: Anexo4Verificacion): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({
        layout: 'landscape',
        size: 'A4',
        margins: { top: 28, bottom: 28, left: 28, right: 28 },
        autoFirstPage: true,
      });

      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end',  () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const registros = v.registros.slice(0, 10);
      const nHC = registros.length || 1;

      // Paleta: blanco/negro, sin colores — estilo formulario oficial
      const BLK    = '#000000';
      const WHITE  = '#ffffff';
      const LGRAY  = '#f0f0f0';  // fondo de cabeceras y sección
      const ALT    = '#f8f8f8';  // filas alternas (apenas perceptible)
      const MARK   = '#e0e0e0';  // fondo de celda marcada

      // Dimensiones — landscape A4 con márgenes 28
      const PAGE_W  = 841.89 - 56;
      const CRIT_W  = 200;
      const HC_W    = (PAGE_W - CRIT_W) / nHC;
      const SUB_W   = HC_W / 2;
      const ROW_H   = 16;
      // Tres sub-filas en la cabecera de la tabla; CRITERIOS abarca las tres
      const H_NUM   = 18;   // fila N° H.C.
      const H_NOM   = 13;   // fila nombre usuario
      const H_CNC   = 12;   // fila C / NC
      const H_TOT   = H_NUM + H_NOM + H_CNC;
      const SEC_H   = 14;
      const x0 = 28;
      let   y  = 28;

      // ── Bloque de título (bordeado) ───────────────────────────────────────────
      const TITLE_H = 40;
      doc.lineWidth(0.8)
        .rect(x0, y, PAGE_W, TITLE_H).stroke(BLK);
      doc.font('Helvetica-Bold').fontSize(10).fillColor(BLK)
        .text('VERIFICACIÓN ESTÁNDAR DE HISTORIA CLÍNICA Y REGISTROS ASISTENCIALES',
              x0, y + 7, { width: PAGE_W, align: 'center' });
      doc.font('Helvetica-Bold').fontSize(9).fillColor(BLK)
        .text('ANEXO N° 4', x0, y + 21, { width: PAGE_W, align: 'center' });
      y += TITLE_H;

      // ── Línea SERVICIO / FECHA (bordeada, dentro del bloque) ─────────────────
      const INFO_H = 16;
      doc.lineWidth(0.8).rect(x0, y, PAGE_W, INFO_H).stroke(BLK);

      // pg puede retornar DATE como objeto Date o string; normalizamos a "YYYY-MM-DD"
      const fechaIso = v.fecha instanceof Date
        ? v.fecha.toISOString().substring(0, 10)
        : String(v.fecha).substring(0, 10);
      const [fYear, fMonth, fDay] = fechaIso.split('-');
      const fechaLabel = `${fDay}/${fMonth}/${fYear}`;

      doc.font('Helvetica-Bold').fontSize(8).fillColor(BLK)
        .text('SERVICIO: ', x0 + 6, y + 4, { continued: true });
      doc.font('Helvetica').fillColor(BLK)
        .text(v.servicio, { continued: true });
      doc.font('Helvetica-Bold')
        .text('    FECHA: ', { continued: true });
      doc.font('Helvetica')
        .text(fechaLabel, { align: 'right', width: PAGE_W - 12 });
      y += INFO_H;

      // ── Cabecera de tabla ─────────────────────────────────────────────────────
      // Celda CRITERIOS — abarca las 3 sub-filas de cabecera
      doc.lineWidth(0.5)
        .rect(x0, y, CRIT_W, H_TOT).fillAndStroke(LGRAY, BLK);
      doc.font('Helvetica-Bold').fontSize(8).fillColor(BLK)
        .text('CRITERIOS', x0, y + (H_TOT - 8) / 2, { width: CRIT_W, align: 'center' });

      // Sub-fila 1: N° H.C.
      registros.forEach((reg, i) => {
        const hx = x0 + CRIT_W + i * HC_W;
        doc.rect(hx, y, HC_W, H_NUM).fillAndStroke(LGRAY, BLK);
        doc.font('Helvetica-Bold').fontSize(7).fillColor(BLK)
          .text(`N° H.C. ${reg.numero_hc || (i + 1)}`,
                hx + 2, y + (H_NUM - 7) / 2, { width: HC_W - 4, align: 'center' });
      });

      // Sub-fila 2: nombre usuario
      registros.forEach((reg, i) => {
        const hx = x0 + CRIT_W + i * HC_W;
        const hy = y + H_NUM;
        doc.rect(hx, hy, HC_W, H_NOM).fillAndStroke(WHITE, BLK);
        const nombre = (reg.nombre_usuario || '').substring(0, 24);
        doc.font('Helvetica').fontSize(6).fillColor(BLK)
          .text(nombre, hx + 2, hy + (H_NOM - 6) / 2, { width: HC_W - 4, align: 'center' });
      });

      // Sub-fila 3: C / NC
      registros.forEach((_, i) => {
        const hx = x0 + CRIT_W + i * HC_W;
        const hy = y + H_NUM + H_NOM;
        doc.rect(hx,          hy, SUB_W, H_CNC).fillAndStroke(LGRAY, BLK);
        doc.rect(hx + SUB_W, hy, SUB_W, H_CNC).fillAndStroke(LGRAY, BLK);
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor(BLK)
          .text('C',  hx,          hy + (H_CNC - 7.5) / 2, { width: SUB_W, align: 'center' });
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor(BLK)
          .text('NC', hx + SUB_W, hy + (H_CNC - 7.5) / 2, { width: SUB_W, align: 'center' });
      });
      y += H_TOT;

      // ── Fila de sección ───────────────────────────────────────────────────────
      doc.rect(x0, y, PAGE_W, SEC_H).fillAndStroke(LGRAY, BLK);
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(BLK)
        .text('CONTENIDOS MÍNIMOS DE IDENTIFICACIÓN',
              x0 + 6, y + (SEC_H - 7.5) / 2, { width: PAGE_W - 12 });
      y += SEC_H;

      // ── Filas de criterios ────────────────────────────────────────────────────
      CRITERIOS_IDENTIFICACION.forEach((crit, ci) => {
        const rowBg = ci % 2 === 0 ? WHITE : ALT;

        // Celda del criterio (columna izquierda)
        doc.rect(x0, y, CRIT_W, ROW_H).fillAndStroke(rowBg, BLK);
        doc.font('Helvetica').fontSize(6.8).fillColor(BLK)
          .text(crit.label, x0 + 5, y + (ROW_H - 7) / 2, { width: CRIT_W - 10 });

        // Celdas C / NC para cada HC
        registros.forEach((reg, i) => {
          const hx  = x0 + CRIT_W + i * HC_W;
          const val = reg.criterios?.[crit.key] ?? null;

          // C
          doc.rect(hx, y, SUB_W, ROW_H)
            .fillAndStroke(val === 'C' ? MARK : rowBg, BLK);
          if (val === 'C') {
            doc.font('Helvetica-Bold').fontSize(9).fillColor(BLK)
              .text('✓', hx, y + (ROW_H - 9) / 2, { width: SUB_W, align: 'center' });
          }

          // NC
          doc.rect(hx + SUB_W, y, SUB_W, ROW_H)
            .fillAndStroke(val === 'NC' ? MARK : rowBg, BLK);
          if (val === 'NC') {
            doc.font('Helvetica-Bold').fontSize(9).fillColor(BLK)
              .text('✗', hx + SUB_W, y + (ROW_H - 9) / 2, { width: SUB_W, align: 'center' });
          }
        });

        y += ROW_H;
      });

      // ── Observaciones ─────────────────────────────────────────────────────────
      if (v.observaciones) {
        y += 8;
        doc.font('Helvetica-Bold').fontSize(8).fillColor(BLK)
          .text('Observaciones: ', x0, y, { continued: true });
        doc.font('Helvetica').fillColor(BLK)
          .text(v.observaciones, { width: PAGE_W });
        y += 12;
      } else {
        y += 8;
      }

      // ── Resumen numérico ──────────────────────────────────────────────────────
      const total = CRITERIOS_IDENTIFICACION.length * nHC;
      let totalC = 0, totalNC = 0;
      registros.forEach(reg => {
        CRITERIOS_IDENTIFICACION.forEach(c => {
          const val = reg.criterios?.[c.key];
          if (val === 'C')  {totalC++;}
          if (val === 'NC') {totalNC++;}
        });
      });
      const pct = total > 0 ? Math.round((totalC / total) * 100) : 0;
      doc.font('Helvetica').fontSize(7.5).fillColor(BLK)
        .text(
          `Resumen: ${totalC} conformes · ${totalNC} no conformes · ${total - totalC - totalNC} sin evaluar · Cumplimiento: ${pct}%`,
          x0, y, { width: PAGE_W, align: 'right' },
        );

      // ── Pie de página ─────────────────────────────────────────────────────────
      const footerY = 595.28 - 28 - 10;
      const generadoEn = new Date().toLocaleString('es-CO', {
        timeZone: 'America/Bogota',
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
      doc.font('Helvetica').fontSize(6).fillColor('#888888')
        .text(
          `HabilitaPro · Anexo N° 4 — Verificación Historia Clínica · Generado: ${generadoEn} (hora Colombia)`,
          x0, footerY, { width: PAGE_W, align: 'center' },
        );

      doc.end();
    });
  }
}
