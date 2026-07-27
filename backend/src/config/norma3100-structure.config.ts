/**
 * Estructura normativa del Capitulo 11 de la Resolucion 3100 de 2019, tal como esta en el archivo
 * fuente de auditoria (Archivo_Consolidaddo_Resolucion_3100-2019.xlsx, una hoja por servicio).
 *
 * TODO lo que se audita sale de aqui. Son 45 hojas: los 7 estandares transversales de 11.1 mas
 * los 38 servicios de 11.2 a 11.6.
 *
 * IMPORTANTE -- los 157 "servicios REPS" (Anestesia, Cardiologia, Optometria...) NO pertenecen a
 * esta estructura. Ese es el catalogo de habilitacion del prestador: dice que ofrece, no contra
 * que se audita. Un prestador que ofrece Anestesia se audita contra 11.2.2 Consulta Externa
 * Especializada, porque un estandar "Anestesia" no existe en la norma. Mezclarlos fue el error de
 * diseno que origino este archivo.
 */

export interface NormServicio {
  norm: string;
  code: string;
}

export interface NormGrupo {
  norm: string;
  name: string;
  /** true solo para 11.1 -- sus criterios cuelgan de evaluation_standards, no de un servicio. */
  transversal: boolean;
  servicios: NormServicio[];
}

export const NORMA_3100_STRUCTURE: NormGrupo[] = [
  {
    norm: '11.1',
    name: 'Estándares y criterios aplicables a todos los servicios',
    transversal: true,
    servicios: [
      { norm: '11.1.1', code: 'TSTH' },
      { norm: '11.1.2', code: 'TSINF' },
      { norm: '11.1.3', code: 'TSDOT' },
      { norm: '11.1.4', code: 'TSMD' },
      { norm: '11.1.5', code: 'TSPP' },
      { norm: '11.1.6', code: 'TSHCR' },
      { norm: '11.1.7', code: 'TSINT' },
    ],
  },
  {
    norm: '11.2',
    name: 'Grupo Consulta Externa',
    transversal: false,
    servicios: [
      { norm: '11.2.1', code: 'CEG' },
      { norm: '11.2.2', code: 'CEE' },
      { norm: '11.2.3', code: 'CEV' },
      { norm: '11.2.4', code: 'CES' },
    ],
  },
  {
    norm: '11.3',
    name: 'Grupo Apoyo Diagnóstico y Complementación Terapéutica',
    transversal: false,
    servicios: [
      { norm: '11.3.1', code: 'TRF' },
      { norm: '11.3.2', code: 'SF' },
      { norm: '11.3.3', code: 'RXO' },
      { norm: '11.3.4', code: 'IDX' },
      { norm: '11.3.5', code: 'MNUC' },
      { norm: '11.3.6', code: 'RDT' },
      { norm: '11.3.7', code: 'QMT' },
      { norm: '11.3.8', code: 'DVX' },
      { norm: '11.3.9', code: 'HTR' },
      { norm: '11.3.10', code: 'GNT' },
      { norm: '11.3.11', code: 'TLC' },
      { norm: '11.3.12', code: 'LAB' },
      { norm: '11.3.13', code: 'TMCU' },
      { norm: '11.3.14', code: 'LAC' },
      { norm: '11.3.15', code: 'LHT' },
      { norm: '11.3.16', code: 'LPT' },
      { norm: '11.3.17', code: 'DLS' },
    ],
  },
  {
    norm: '11.4',
    name: 'Grupo Internación',
    transversal: false,
    servicios: [
      { norm: '11.4.1', code: 'HGP' },
      { norm: '11.4.2', code: 'HPP' },
      { norm: '11.4.3', code: 'CBN' },
      { norm: '11.4.4', code: 'CII' },
      { norm: '11.4.5', code: 'CINN' },
      { norm: '11.4.6', code: 'CIM' },
      { norm: '11.4.7', code: 'CIP' },
      { norm: '11.4.8', code: 'CIMA' },
      { norm: '11.4.9', code: 'CIA' },
      { norm: '11.4.10', code: 'HSC' },
      { norm: '11.4.11', code: 'HSP' },
      { norm: '11.4.12', code: 'CPC' },
    ],
  },
  {
    norm: '11.5',
    name: 'Grupo Quirúrgico',
    transversal: false,
    servicios: [{ norm: '11.5.1', code: 'QRG' }],
  },
  {
    norm: '11.6',
    name: 'Grupo Atención Inmediata',
    transversal: false,
    servicios: [
      { norm: '11.6.1', code: 'URG' },
      { norm: '11.6.2', code: 'TAS' },
      { norm: '11.6.3', code: 'APH' },
      { norm: '11.6.4', code: 'APR' },
    ],
  },
];

/** Codigos que existen en la BD pero NO pertenecen a la Res. 3100 -- se muestran aparte. */
export const OTRA_NORMATIVA: Record<string, string> = {
  'LAB-CAL': 'Resolución 1619 de 2015 — calidad de laboratorio clínico, no es Resolución 3100',
};
