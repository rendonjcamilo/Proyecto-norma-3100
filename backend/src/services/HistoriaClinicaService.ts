/**
 * HistoriaClinicaService
 * Verificación de Historia Clínica conforme a Resolución 1995 de 1999
 * y estándar TSHCR de la Resolución 3100 de 2019
 *
 * Verifica los 15 campos mínimos obligatorios por muestra de historias clínicas
 */

import { Pool } from 'pg';
import { logger } from '../utils/logger.js';

// ============================================================
// TIPOS
// ============================================================

/** Los 15 campos mínimos de identificación según Res. 1995/1999, Art. 15 */
export interface CamposMinimosHC {
  campo01NombreCompleto: boolean;
  campo02EstadoCivil: boolean;
  campo03DocumentoIdentidad: boolean;
  campo04FechaNacimiento: boolean;
  campo05Edad: boolean;
  campo06Sexo: boolean;
  campo07Ocupacion: boolean;
  campo08DireccionResidencia: boolean;
  campo09TelefonoResidencia: boolean;
  campo10MunicipioResidencia: boolean;
  campo11AcompananteNombreTelefono: boolean;
  campo12ResponsableNombreTelefonoParentesco: boolean;
  campo13EntidadAseguradora: boolean;
  campo14TipoVinculacion: boolean;
  campo15ConsentimientoInformado: boolean;
}

export interface HallazgoHC {
  campo: string;
  descripcion: string;
  hcCount: number;   // Número de HC donde se encontró el problema
}

export interface HistoriaClinicaVerificacionInput {
  providerId: string;
  assessmentId?: string;
  fechaVerificacion?: string;
  totalHcRevisadas: number;
  totalHcConformes: number;
  campos: CamposMinimosHC;
  tieneRegistrosClinicos?: boolean;
  tieneRegistrosSignosVitales?: boolean;
  tieneNotasEvolucion?: boolean;
  tieneRegistrosEnfermeria?: boolean;
  hallazgosIdentificados?: HallazgoHC[];
  observaciones?: string;
  verificadoPor: string;
}

export interface HistoriaClinicaVerificacionRow {
  id: string;
  provider_id: string;
  assessment_id: string | null;
  fecha_verificacion: string;
  verificado_por: string;
  total_hc_revisadas: number;
  total_hc_conformes: number;
  porcentaje_conformidad: number;
  campo_01_nombre_completo: boolean;
  campo_02_estado_civil: boolean;
  campo_03_documento_identidad: boolean;
  campo_04_fecha_nacimiento: boolean;
  campo_05_edad: boolean;
  campo_06_sexo: boolean;
  campo_07_ocupacion: boolean;
  campo_08_direccion_residencia: boolean;
  campo_09_telefono_residencia: boolean;
  campo_10_municipio_residencia: boolean;
  campo_11_acompanante_nombre_telefono: boolean;
  campo_12_responsable_nombre_telefono_parentesco: boolean;
  campo_13_entidad_aseguradora: boolean;
  campo_14_tipo_vinculacion: boolean;
  campo_15_consentimiento_informado: boolean;
  campos_minimos_cumplidos: number;
  tiene_registros_clinicos: boolean;
  tiene_registros_signos_vitales: boolean;
  tiene_notas_evolucion: boolean;
  tiene_registros_enfermeria: boolean;
  hallazgos_identificados: HallazgoHC[];
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResumenHC {
  totalVerificaciones: number;
  ultimaVerificacion: string | null;
  porcentajeConformidadPromedio: number;
  camposConFallaFrecuente: string[];
  totalHallazgos: number;
  cumpleTSHCR: boolean;
}

// Mapa de código de campo a nombre descriptivo
const NOMBRES_CAMPOS: Record<string, string> = {
  campo_01_nombre_completo:                      '1. Nombre completo del paciente',
  campo_02_estado_civil:                         '2. Estado civil',
  campo_03_documento_identidad:                  '3. Tipo y número de documento de identidad',
  campo_04_fecha_nacimiento:                     '4. Fecha de nacimiento',
  campo_05_edad:                                 '5. Edad al momento de la atención',
  campo_06_sexo:                                 '6. Sexo biológico',
  campo_07_ocupacion:                            '7. Ocupación',
  campo_08_direccion_residencia:                 '8. Dirección de residencia',
  campo_09_telefono_residencia:                  '9. Teléfono de residencia',
  campo_10_municipio_residencia:                 '10. Municipio/ciudad de residencia',
  campo_11_acompanante_nombre_telefono:          '11. Nombre y teléfono del acompañante',
  campo_12_responsable_nombre_telefono_parentesco: '12. Responsable: nombre, teléfono y parentesco',
  campo_13_entidad_aseguradora:                  '13. Entidad aseguradora (EPS/ARS)',
  campo_14_tipo_vinculacion:                     '14. Tipo de vinculación al SGSSS',
  campo_15_consentimiento_informado:             '15. Consentimiento informado firmado',
};

// ============================================================
// SERVICIO
// ============================================================

export class HistoriaClinicaService {
  constructor(private pool: Pool) {}

  /**
   * Registra una verificación de historias clínicas con los 15 campos mínimos
   */
  async registrarVerificacion(input: HistoriaClinicaVerificacionInput): Promise<HistoriaClinicaVerificacionRow> {
    const {
      providerId, assessmentId, fechaVerificacion = new Date().toISOString().split('T')[0],
      totalHcRevisadas, totalHcConformes, campos,
      tieneRegistrosClinicos = false, tieneRegistrosSignosVitales = false,
      tieneNotasEvolucion = false, tieneRegistrosEnfermeria = false,
      hallazgosIdentificados = [], observaciones, verificadoPor,
    } = input;

    const result = await this.pool.query<HistoriaClinicaVerificacionRow>(
      `INSERT INTO historia_clinica_verificacion (
        provider_id, assessment_id, fecha_verificacion, verificado_por,
        total_hc_revisadas, total_hc_conformes,
        campo_01_nombre_completo, campo_02_estado_civil, campo_03_documento_identidad,
        campo_04_fecha_nacimiento, campo_05_edad, campo_06_sexo, campo_07_ocupacion,
        campo_08_direccion_residencia, campo_09_telefono_residencia,
        campo_10_municipio_residencia, campo_11_acompanante_nombre_telefono,
        campo_12_responsable_nombre_telefono_parentesco,
        campo_13_entidad_aseguradora, campo_14_tipo_vinculacion,
        campo_15_consentimiento_informado,
        tiene_registros_clinicos, tiene_registros_signos_vitales,
        tiene_notas_evolucion, tiene_registros_enfermeria,
        hallazgos_identificados, observaciones
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6,
        $7, $8, $9,
        $10, $11, $12, $13,
        $14, $15,
        $16, $17,
        $18,
        $19, $20,
        $21,
        $22, $23,
        $24, $25,
        $26::jsonb, $27
      ) RETURNING *`,
      [
        providerId, assessmentId ?? null, fechaVerificacion, verificadoPor,
        totalHcRevisadas, totalHcConformes,
        campos.campo01NombreCompleto, campos.campo02EstadoCivil, campos.campo03DocumentoIdentidad,
        campos.campo04FechaNacimiento, campos.campo05Edad, campos.campo06Sexo, campos.campo07Ocupacion,
        campos.campo08DireccionResidencia, campos.campo09TelefonoResidencia,
        campos.campo10MunicipioResidencia, campos.campo11AcompananteNombreTelefono,
        campos.campo12ResponsableNombreTelefonoParentesco,
        campos.campo13EntidadAseguradora, campos.campo14TipoVinculacion,
        campos.campo15ConsentimientoInformado,
        tieneRegistrosClinicos, tieneRegistrosSignosVitales,
        tieneNotasEvolucion, tieneRegistrosEnfermeria,
        JSON.stringify(hallazgosIdentificados), observaciones ?? null,
      ]
    );

    logger.info({
      msg: 'Historia clínica verificación registrada',
      provider_id: providerId,
      campos_cumplidos: result.rows[0].campos_minimos_cumplidos,
      porcentaje: result.rows[0].porcentaje_conformidad,
    });

    return result.rows[0];
  }

  /**
   * Lista verificaciones de historia clínica de un prestador
   */
  async listByProvider(providerId: string, limit = 20): Promise<HistoriaClinicaVerificacionRow[]> {
    const result = await this.pool.query<HistoriaClinicaVerificacionRow>(
      `SELECT hcv.*, u.first_name || ' ' || u.last_name AS verificado_por_nombre
       FROM historia_clinica_verificacion hcv
       LEFT JOIN users u ON u.id = hcv.verificado_por
       WHERE hcv.provider_id = $1
       ORDER BY hcv.fecha_verificacion DESC
       LIMIT $2`,
      [providerId, limit]
    );
    return result.rows;
  }

  /**
   * Obtiene una verificación por ID
   */
  async getById(id: string): Promise<HistoriaClinicaVerificacionRow | null> {
    const result = await this.pool.query<HistoriaClinicaVerificacionRow>(
      `SELECT hcv.*, u.first_name || ' ' || u.last_name AS verificado_por_nombre
       FROM historia_clinica_verificacion hcv
       LEFT JOIN users u ON u.id = hcv.verificado_por
       WHERE hcv.id = $1`,
      [id]
    );
    return result.rows[0] ?? null;
  }

  /**
   * Resumen del cumplimiento TSHCR para un prestador
   */
  async resumenTSHCR(providerId: string): Promise<ResumenHC> {
    const verificaciones = await this.listByProvider(providerId, 10);

    if (verificaciones.length === 0) {
      return {
        totalVerificaciones: 0,
        ultimaVerificacion: null,
        porcentajeConformidadPromedio: 0,
        camposConFallaFrecuente: [],
        totalHallazgos: 0,
        cumpleTSHCR: false,
      };
    }

    const avg =
      verificaciones.reduce((sum, v) => sum + Number(v.porcentaje_conformidad), 0) /
      verificaciones.length;

    // Identificar campos fallando con mayor frecuencia (en >30% de verificaciones)
    const camposFallas: string[] = [];
    const campos15 = [
      'campo_01_nombre_completo', 'campo_02_estado_civil', 'campo_03_documento_identidad',
      'campo_04_fecha_nacimiento', 'campo_05_edad', 'campo_06_sexo', 'campo_07_ocupacion',
      'campo_08_direccion_residencia', 'campo_09_telefono_residencia',
      'campo_10_municipio_residencia', 'campo_11_acompanante_nombre_telefono',
      'campo_12_responsable_nombre_telefono_parentesco',
      'campo_13_entidad_aseguradora', 'campo_14_tipo_vinculacion',
      'campo_15_consentimiento_informado',
    ] as const;

    for (const campo of campos15) {
      const fallos = verificaciones.filter(
        (v) => !v[campo as keyof HistoriaClinicaVerificacionRow]
      ).length;
      if (fallos / verificaciones.length > 0.3) {
        camposFallas.push(NOMBRES_CAMPOS[campo] ?? campo);
      }
    }

    const totalHallazgos = verificaciones.reduce(
      (sum, v) => sum + (Array.isArray(v.hallazgos_identificados) ? v.hallazgos_identificados.length : 0),
      0
    );

    // Cumple TSHCR si la última verificación tiene ≥80% de conformidad y 15/15 campos
    const ultima = verificaciones[0];
    const cumpleTSHCR =
      Number(ultima.porcentaje_conformidad) >= 80 && ultima.campos_minimos_cumplidos === 15;

    return {
      totalVerificaciones: verificaciones.length,
      ultimaVerificacion: ultima.fecha_verificacion,
      porcentajeConformidadPromedio: Math.round(avg * 100) / 100,
      camposConFallaFrecuente: camposFallas,
      totalHallazgos,
      cumpleTSHCR,
    };
  }

  /**
   * Genera el detalle de los 15 campos con su nombre descriptivo y estado
   * para la última verificación de un prestador
   */
  async detalle15Campos(providerId: string): Promise<Array<{
    numero: number;
    campo: string;
    nombre: string;
    cumple: boolean;
  }> | null> {
    const verificaciones = await this.listByProvider(providerId, 1);
    if (verificaciones.length === 0) return null;

    const v = verificaciones[0];
    return [
      { numero: 1,  campo: 'campo_01_nombre_completo', nombre: NOMBRES_CAMPOS['campo_01_nombre_completo'], cumple: v.campo_01_nombre_completo },
      { numero: 2,  campo: 'campo_02_estado_civil', nombre: NOMBRES_CAMPOS['campo_02_estado_civil'], cumple: v.campo_02_estado_civil },
      { numero: 3,  campo: 'campo_03_documento_identidad', nombre: NOMBRES_CAMPOS['campo_03_documento_identidad'], cumple: v.campo_03_documento_identidad },
      { numero: 4,  campo: 'campo_04_fecha_nacimiento', nombre: NOMBRES_CAMPOS['campo_04_fecha_nacimiento'], cumple: v.campo_04_fecha_nacimiento },
      { numero: 5,  campo: 'campo_05_edad', nombre: NOMBRES_CAMPOS['campo_05_edad'], cumple: v.campo_05_edad },
      { numero: 6,  campo: 'campo_06_sexo', nombre: NOMBRES_CAMPOS['campo_06_sexo'], cumple: v.campo_06_sexo },
      { numero: 7,  campo: 'campo_07_ocupacion', nombre: NOMBRES_CAMPOS['campo_07_ocupacion'], cumple: v.campo_07_ocupacion },
      { numero: 8,  campo: 'campo_08_direccion_residencia', nombre: NOMBRES_CAMPOS['campo_08_direccion_residencia'], cumple: v.campo_08_direccion_residencia },
      { numero: 9,  campo: 'campo_09_telefono_residencia', nombre: NOMBRES_CAMPOS['campo_09_telefono_residencia'], cumple: v.campo_09_telefono_residencia },
      { numero: 10, campo: 'campo_10_municipio_residencia', nombre: NOMBRES_CAMPOS['campo_10_municipio_residencia'], cumple: v.campo_10_municipio_residencia },
      { numero: 11, campo: 'campo_11_acompanante_nombre_telefono', nombre: NOMBRES_CAMPOS['campo_11_acompanante_nombre_telefono'], cumple: v.campo_11_acompanante_nombre_telefono },
      { numero: 12, campo: 'campo_12_responsable_nombre_telefono_parentesco', nombre: NOMBRES_CAMPOS['campo_12_responsable_nombre_telefono_parentesco'], cumple: v.campo_12_responsable_nombre_telefono_parentesco },
      { numero: 13, campo: 'campo_13_entidad_aseguradora', nombre: NOMBRES_CAMPOS['campo_13_entidad_aseguradora'], cumple: v.campo_13_entidad_aseguradora },
      { numero: 14, campo: 'campo_14_tipo_vinculacion', nombre: NOMBRES_CAMPOS['campo_14_tipo_vinculacion'], cumple: v.campo_14_tipo_vinculacion },
      { numero: 15, campo: 'campo_15_consentimiento_informado', nombre: NOMBRES_CAMPOS['campo_15_consentimiento_informado'], cumple: v.campo_15_consentimiento_informado },
    ];
  }
}
