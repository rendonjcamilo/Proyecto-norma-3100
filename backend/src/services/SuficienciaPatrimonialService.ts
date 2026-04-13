/**
 * SuficienciaPatrimonialService
 * Gestión de la Condición 2 de habilitación: Suficiencia Patrimonial y Financiera
 * Resolución 3100 de 2019 — Capítulo 9
 */

import { Pool } from 'pg';
import { logger } from '../utils/logger.js';

// ============================================================
// TIPOS
// ============================================================

export type EstadoDocumento = 'vigente' | 'vencido' | 'pendiente' | 'no_aplica';

export interface SuficienciaPatrimonialInput {
  providerId: string;
  periodoFiscal: string;
  fechaVerificacion?: string;

  // Indicadores financieros
  patrimonioNeto?: number;
  activoTotal?: number;
  pasivoTotal?: number;
  ingresosOperacionales?: number;
  utilidadNeta?: number;

  // Documentos
  estadosFinancierosEstado?: EstadoDocumento;
  estadosFinancierosRevsorFirma?: boolean;
  estadosFinancierosF?: string;

  polizaRcEstado?: EstadoDocumento;
  polizaRcNumero?: string;
  polizaRcAseguradora?: string;
  polizaRcVigenciaDesde?: string;
  polizaRcVigenciaHasta?: string;
  polizaRcValorAsegurado?: number;

  declaracionRentaEstado?: EstadoDocumento;
  declaracionRentaPeriodo?: string;

  certificacionBancariaEstado?: EstadoDocumento;
  certificacionBancariaBanco?: string;
  certificacionBancariaFecha?: string;

  observaciones?: string;
  verificadoPor: string;
}

export interface SuficienciaPatrimonialRow {
  id: string;
  provider_id: string;
  periodo_fiscal: string;
  fecha_verificacion: string;
  patrimonio_neto: number | null;
  activo_total: number | null;
  pasivo_total: number | null;
  ingresos_operacionales: number | null;
  utilidad_neta: number | null;
  razon_corriente: number | null;
  nivel_endeudamiento: number | null;
  razon_solvencia: number | null;
  estados_financieros_estado: EstadoDocumento;
  estados_financieros_fecha: string | null;
  estados_financieros_revisor_firma: boolean;
  poliza_rc_estado: EstadoDocumento;
  poliza_rc_numero: string | null;
  poliza_rc_aseguradora: string | null;
  poliza_rc_vigencia_desde: string | null;
  poliza_rc_vigencia_hasta: string | null;
  poliza_rc_valor_asegurado: number | null;
  declaracion_renta_estado: EstadoDocumento;
  declaracion_renta_periodo: string | null;
  certificacion_bancaria_estado: EstadoDocumento;
  certificacion_bancaria_banco: string | null;
  certificacion_bancaria_fecha: string | null;
  cumple_suficiencia: boolean;
  observaciones: string | null;
  verificado_por: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// SERVICIO
// ============================================================

export class SuficienciaPatrimonialService {
  constructor(private pool: Pool) {}

  /**
   * Crea o actualiza el registro de suficiencia patrimonial para un prestador y período
   */
  async upsert(input: SuficienciaPatrimonialInput): Promise<SuficienciaPatrimonialRow> {
    const {
      providerId,
      periodoFiscal,
      fechaVerificacion = new Date().toISOString().split('T')[0],
      patrimonioNeto,
      activoTotal,
      pasivoTotal,
      ingresosOperacionales,
      utilidadNeta,
      estadosFinancierosEstado = 'pendiente',
      estadosFinancierosRevsorFirma = false,
      estadosFinancierosF,
      polizaRcEstado = 'pendiente',
      polizaRcNumero,
      polizaRcAseguradora,
      polizaRcVigenciaDesde,
      polizaRcVigenciaHasta,
      polizaRcValorAsegurado,
      declaracionRentaEstado = 'pendiente',
      declaracionRentaPeriodo,
      certificacionBancariaEstado = 'pendiente',
      certificacionBancariaBanco,
      certificacionBancariaFecha,
      observaciones,
      verificadoPor,
    } = input;

    // Calcular razones financieras
    let razonSolvencia: number | null = null;
    let nivelEndeudamiento: number | null = null;
    if (activoTotal && activoTotal > 0) {
      if (patrimonioNeto !== undefined) razonSolvencia = Number((patrimonioNeto / activoTotal).toFixed(4));
      if (pasivoTotal !== undefined) nivelEndeudamiento = Number((pasivoTotal / activoTotal).toFixed(4));
    }

    // Determinar si cumple la condición
    const polizaVigente = polizaRcEstado === 'vigente';
    const estadosVigentes = estadosFinancierosEstado === 'vigente';
    const cumpleSuficiencia =
      estadosVigentes &&
      estadosFinancierosRevsorFirma &&
      polizaVigente &&
      declaracionRentaEstado === 'vigente' &&
      certificacionBancariaEstado === 'vigente';

    const result = await this.pool.query<SuficienciaPatrimonialRow>(
      `INSERT INTO suficiencia_patrimonial (
        provider_id, periodo_fiscal, fecha_verificacion,
        patrimonio_neto, activo_total, pasivo_total,
        ingresos_operacionales, utilidad_neta,
        razon_solvencia, nivel_endeudamiento,
        estados_financieros_estado, estados_financieros_fecha, estados_financieros_revisor_firma,
        poliza_rc_estado, poliza_rc_numero, poliza_rc_aseguradora,
        poliza_rc_vigencia_desde, poliza_rc_vigencia_hasta, poliza_rc_valor_asegurado,
        declaracion_renta_estado, declaracion_renta_periodo,
        certificacion_bancaria_estado, certificacion_bancaria_banco, certificacion_bancaria_fecha,
        cumple_suficiencia, observaciones, verificado_por
      ) VALUES (
        $1, $2, $3,
        $4, $5, $6,
        $7, $8,
        $9, $10,
        $11, $12, $13,
        $14, $15, $16,
        $17, $18, $19,
        $20, $21,
        $22, $23, $24,
        $25, $26, $27
      )
      ON CONFLICT (provider_id, periodo_fiscal)
      DO UPDATE SET
        fecha_verificacion         = EXCLUDED.fecha_verificacion,
        patrimonio_neto            = EXCLUDED.patrimonio_neto,
        activo_total               = EXCLUDED.activo_total,
        pasivo_total               = EXCLUDED.pasivo_total,
        ingresos_operacionales     = EXCLUDED.ingresos_operacionales,
        utilidad_neta              = EXCLUDED.utilidad_neta,
        razon_solvencia            = EXCLUDED.razon_solvencia,
        nivel_endeudamiento        = EXCLUDED.nivel_endeudamiento,
        estados_financieros_estado = EXCLUDED.estados_financieros_estado,
        estados_financieros_fecha  = EXCLUDED.estados_financieros_fecha,
        estados_financieros_revisor_firma = EXCLUDED.estados_financieros_revisor_firma,
        poliza_rc_estado           = EXCLUDED.poliza_rc_estado,
        poliza_rc_numero           = EXCLUDED.poliza_rc_numero,
        poliza_rc_aseguradora      = EXCLUDED.poliza_rc_aseguradora,
        poliza_rc_vigencia_desde   = EXCLUDED.poliza_rc_vigencia_desde,
        poliza_rc_vigencia_hasta   = EXCLUDED.poliza_rc_vigencia_hasta,
        poliza_rc_valor_asegurado  = EXCLUDED.poliza_rc_valor_asegurado,
        declaracion_renta_estado   = EXCLUDED.declaracion_renta_estado,
        declaracion_renta_periodo  = EXCLUDED.declaracion_renta_periodo,
        certificacion_bancaria_estado = EXCLUDED.certificacion_bancaria_estado,
        certificacion_bancaria_banco  = EXCLUDED.certificacion_bancaria_banco,
        certificacion_bancaria_fecha  = EXCLUDED.certificacion_bancaria_fecha,
        cumple_suficiencia         = EXCLUDED.cumple_suficiencia,
        observaciones              = EXCLUDED.observaciones,
        verificado_por             = EXCLUDED.verificado_por,
        updated_at                 = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        providerId, periodoFiscal, fechaVerificacion,
        patrimonioNeto ?? null, activoTotal ?? null, pasivoTotal ?? null,
        ingresosOperacionales ?? null, utilidadNeta ?? null,
        razonSolvencia, nivelEndeudamiento,
        estadosFinancierosEstado, estadosFinancierosF ?? null, estadosFinancierosRevsorFirma,
        polizaRcEstado, polizaRcNumero ?? null, polizaRcAseguradora ?? null,
        polizaRcVigenciaDesde ?? null, polizaRcVigenciaHasta ?? null, polizaRcValorAsegurado ?? null,
        declaracionRentaEstado, declaracionRentaPeriodo ?? null,
        certificacionBancariaEstado, certificacionBancariaBanco ?? null, certificacionBancariaFecha ?? null,
        cumpleSuficiencia, observaciones ?? null, verificadoPor,
      ]
    );

    logger.info({
      msg: 'Suficiencia patrimonial upserted',
      provider_id: providerId,
      periodo: periodoFiscal,
      cumple: cumpleSuficiencia,
    });

    return result.rows[0];
  }

  /**
   * Obtiene el registro más reciente de suficiencia patrimonial de un prestador
   */
  async getByProvider(providerId: string, periodoFiscal?: string): Promise<SuficienciaPatrimonialRow | null> {
    const query = periodoFiscal
      ? `SELECT sp.*, u.first_name || ' ' || u.last_name AS verificado_por_nombre
         FROM suficiencia_patrimonial sp
         LEFT JOIN users u ON u.id = sp.verificado_por
         WHERE sp.provider_id = $1 AND sp.periodo_fiscal = $2
         LIMIT 1`
      : `SELECT sp.*, u.first_name || ' ' || u.last_name AS verificado_por_nombre
         FROM suficiencia_patrimonial sp
         LEFT JOIN users u ON u.id = sp.verificado_por
         WHERE sp.provider_id = $1
         ORDER BY sp.periodo_fiscal DESC
         LIMIT 1`;

    const params = periodoFiscal ? [providerId, periodoFiscal] : [providerId];
    const result = await this.pool.query<SuficienciaPatrimonialRow>(query, params);
    return result.rows[0] ?? null;
  }

  /**
   * Lista todos los períodos evaluados de un prestador
   */
  async listByProvider(providerId: string): Promise<SuficienciaPatrimonialRow[]> {
    const result = await this.pool.query<SuficienciaPatrimonialRow>(
      `SELECT sp.*, u.first_name || ' ' || u.last_name AS verificado_por_nombre
       FROM suficiencia_patrimonial sp
       LEFT JOIN users u ON u.id = sp.verificado_por
       WHERE sp.provider_id = $1
       ORDER BY sp.periodo_fiscal DESC`,
      [providerId]
    );
    return result.rows;
  }

  /**
   * Verifica la vigencia de la póliza de responsabilidad civil
   * Retorna días restantes hasta el vencimiento (negativo = vencida)
   */
  async verificarVigenciaPoliza(providerId: string): Promise<{
    estado: EstadoDocumento;
    diasRestantes: number | null;
    vencimiento: string | null;
  }> {
    const registro = await this.getByProvider(providerId);
    if (!registro || !registro.poliza_rc_vigencia_hasta) {
      return { estado: 'pendiente', diasRestantes: null, vencimiento: null };
    }

    const hoy = new Date();
    const vencimiento = new Date(registro.poliza_rc_vigencia_hasta);
    const diasRestantes = Math.floor((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

    return {
      estado: diasRestantes >= 0 ? 'vigente' : 'vencido',
      diasRestantes,
      vencimiento: registro.poliza_rc_vigencia_hasta,
    };
  }

  /**
   * Resumen de cumplimiento de la Condición 2 para el dashboard
   */
  async resumenCondicion2(providerId: string): Promise<{
    cumple: boolean;
    periodo: string | null;
    documentos: Array<{ nombre: string; estado: EstadoDocumento }>;
    indicadores: {
      razonSolvencia: number | null;
      nivelEndeudamiento: number | null;
    };
  }> {
    const registro = await this.getByProvider(providerId);

    if (!registro) {
      return {
        cumple: false,
        periodo: null,
        documentos: [],
        indicadores: { razonSolvencia: null, nivelEndeudamiento: null },
      };
    }

    return {
      cumple: registro.cumple_suficiencia,
      periodo: registro.periodo_fiscal,
      documentos: [
        { nombre: 'Estados Financieros', estado: registro.estados_financieros_estado },
        { nombre: 'Póliza RC Extracontractual', estado: registro.poliza_rc_estado },
        { nombre: 'Declaración de Renta', estado: registro.declaracion_renta_estado },
        { nombre: 'Certificación Bancaria', estado: registro.certificacion_bancaria_estado },
      ],
      indicadores: {
        razonSolvencia: registro.razon_solvencia,
        nivelEndeudamiento: registro.nivel_endeudamiento,
      },
    };
  }
}
