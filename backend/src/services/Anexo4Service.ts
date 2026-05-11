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

  async create(data: {
    servicio: string;
    fecha: string;
    auditor_id: string;
    registros: HCRegistro[];
    observaciones?: string | null;
  }): Promise<Anexo4Verificacion> {
    const { rows } = await this.pool.query<Anexo4Verificacion>(
      `INSERT INTO anexo4_verificaciones
         (servicio, fecha, auditor_id, registros, observaciones)
       VALUES ($1, $2, $3, $4::jsonb, $5)
       RETURNING *`,
      [
        data.servicio,
        data.fecha,
        data.auditor_id,
        JSON.stringify(data.registros),
        data.observaciones ?? null,
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

  // ─── PDF (landscape A4) ──────────────────────────────────────────────────────
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
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const registros = v.registros.slice(0, 10);
      const nHC = registros.length || 1;

      // Colores
      const C_HEADER  = '#1a237e';
      const C_SEC     = '#3949ab';
      const C_ALT     = '#f0f4ff';
      const C_C_BG    = '#dcfce7';
      const C_NC_BG   = '#fee2e2';
      const C_C_TXT   = '#15803d';
      const C_NC_TXT  = '#b91c1c';
      const C_BORDER  = '#c5cae9';

      // Dimensiones
      const PAGE_W   = 841.89 - 56;  // A4 landscape - márgenes
      const CRIT_W   = 205;
      const HC_W     = (PAGE_W - CRIT_W) / nHC;
      const SUB_W    = HC_W / 2;
      const ROW_H    = 17;
      const HEAD1_H  = 20;
      const HEAD2_H  = 13;
      const SEC_H    = 13;
      let x0 = 28;
      let y  = 28;

      // ── Título ────────────────────────────────────────────────────────────────
      doc.font('Helvetica-Bold').fontSize(10).fillColor(C_HEADER)
        .text('VERIFICACIÓN ESTÁNDAR DE HISTORIA CLÍNICA Y REGISTROS ASISTENCIALES', x0, y, { width: PAGE_W, align: 'center' });
      y += 13;
      doc.fontSize(9)
        .text('ANEXO N° 4', x0, y, { width: PAGE_W, align: 'center' });
      y += 16;

      // Formatear fecha de forma segura independiente del tipo que devuelva pg (string o Date)
      const [fYear, fMonth, fDay] = String(v.fecha).substring(0, 10).split('-');
      const fechaLabel = `${fDay}/${fMonth}/${fYear}`;

      doc.font('Helvetica').fontSize(8).fillColor('#222')
        .text(`SERVICIO: ${v.servicio}`, x0, y, { continued: true })
        .text(`          FECHA: ${fechaLabel}`, { align: 'right', width: PAGE_W });
      y += 14;

      // ── Fila 1 encabezado: CRITERIOS | N°HC 1…n ───────────────────────────
      doc.rect(x0, y, CRIT_W, HEAD1_H).fill(C_HEADER);
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#fff')
        .text('CRITERIOS', x0, y + (HEAD1_H - 7) / 2, { width: CRIT_W, align: 'center' });

      registros.forEach((reg, i) => {
        const hx = x0 + CRIT_W + i * HC_W;
        doc.rect(hx, y, HC_W, HEAD1_H).fill(C_HEADER).stroke(C_BORDER);
        const numLabel = `N° H.C. ${reg.numero_hc || (i + 1)}`;
        doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#fff')
          .text(numLabel, hx + 1, y + 2, { width: HC_W - 2, align: 'center' });
        const nombre = (reg.nombre_usuario || '').substring(0, 22);
        doc.font('Helvetica').fontSize(5.5).fillColor('#c5cae9')
          .text(nombre, hx + 1, y + 11, { width: HC_W - 2, align: 'center' });
      });
      y += HEAD1_H;

      // ── Fila 2 sub-encabezado: C / NC ────────────────────────────────────
      doc.rect(x0, y, CRIT_W, HEAD2_H).fill('#283593');
      registros.forEach((_, i) => {
        const hx = x0 + CRIT_W + i * HC_W;
        doc.rect(hx,           y, SUB_W, HEAD2_H).fill('#c5cae9').stroke(C_BORDER);
        doc.rect(hx + SUB_W,  y, SUB_W, HEAD2_H).fill('#ffcdd2').stroke(C_BORDER);
        doc.font('Helvetica-Bold').fontSize(7).fillColor('#1a237e')
          .text('C',  hx,          y + 3, { width: SUB_W, align: 'center' });
        doc.font('Helvetica-Bold').fontSize(7).fillColor('#b71c1c')
          .text('NC', hx + SUB_W, y + 3, { width: SUB_W, align: 'center' });
      });
      y += HEAD2_H;

      // ── Encabezado de sección ───────────────────────────────────────────────
      doc.rect(x0, y, PAGE_W, SEC_H).fill(C_SEC);
      doc.font('Helvetica-Bold').fontSize(7).fillColor('#fff')
        .text('CONTENIDOS MÍNIMOS DE IDENTIFICACIÓN', x0 + 4, y + 3, { width: PAGE_W - 8 });
      y += SEC_H;

      // ── Filas de criterios ───────────────────────────────────────────────────
      CRITERIOS_IDENTIFICACION.forEach((crit, ci) => {
        const rowBg = ci % 2 === 0 ? '#fff' : C_ALT;

        // Celda criterio
        doc.rect(x0, y, CRIT_W, ROW_H).fill(rowBg).stroke(C_BORDER);
        doc.font('Helvetica').fontSize(6.8).fillColor('#111')
          .text(crit.label, x0 + 4, y + (ROW_H - 7) / 2, { width: CRIT_W - 8 });

        // Celdas C / NC por cada HC
        registros.forEach((reg, i) => {
          const hx  = x0 + CRIT_W + i * HC_W;
          const val = reg.criterios?.[crit.key] ?? null;

          // C
          doc.rect(hx, y, SUB_W, ROW_H)
            .fill(val === 'C' ? C_C_BG : rowBg).stroke(C_BORDER);
          if (val === 'C') {
            doc.font('Helvetica-Bold').fontSize(9).fillColor(C_C_TXT)
              .text('✓', hx, y + (ROW_H - 9) / 2, { width: SUB_W, align: 'center' });
          }

          // NC
          doc.rect(hx + SUB_W, y, SUB_W, ROW_H)
            .fill(val === 'NC' ? C_NC_BG : rowBg).stroke(C_BORDER);
          if (val === 'NC') {
            doc.font('Helvetica-Bold').fontSize(9).fillColor(C_NC_TXT)
              .text('✗', hx + SUB_W, y + (ROW_H - 9) / 2, { width: SUB_W, align: 'center' });
          }
        });

        y += ROW_H;
      });

      // ── Observaciones ────────────────────────────────────────────────────────
      if (v.observaciones) {
        y += 10;
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#333')
          .text('Observaciones: ', x0, y, { continued: true })
          .font('Helvetica').text(v.observaciones, { width: PAGE_W });
      }

      // ── Resumen numérico ─────────────────────────────────────────────────────
      y += 14;
      const total = CRITERIOS_IDENTIFICACION.length * nHC;
      let totalC = 0, totalNC = 0;
      registros.forEach(reg => {
        CRITERIOS_IDENTIFICACION.forEach(c => {
          const val = reg.criterios?.[c.key];
          if (val === 'C')  totalC++;
          if (val === 'NC') totalNC++;
        });
      });
      const pct = total > 0 ? Math.round((totalC / total) * 100) : 0;
      doc.font('Helvetica').fontSize(7.5).fillColor('#444')
        .text(`Resumen: ${totalC} conformes · ${totalNC} no conformes · ${total - totalC - totalNC} sin evaluar · Cumplimiento: ${pct}%`, x0, y, { width: PAGE_W, align: 'right' });

      // ── Pie de página ────────────────────────────────────────────────────────
      const footerY = 595.28 - 28 - 10;
      doc.font('Helvetica').fontSize(6).fillColor('#aaa')
        .text(
          `HabilitaPro — Anexo 4 Verificación H.C. · Generado el ${new Date().toLocaleDateString('es-CO')}`,
          x0, footerY, { width: PAGE_W, align: 'center' },
        );

      doc.end();
    });
  }
}
