/**
 * Orden normativo único de los 7 estándares transversales de la Resolución 3100, Capítulo 11 —
 * Condición 3 (Capacidad Tecnológica y Científica): TSTH=11.1.1, TSINF=11.1.2, TSDOT=11.1.3,
 * TSMD=11.1.4, TSPP=11.1.5, TSHCR=11.1.6, TSINT=11.1.7. Verificado contra el INSERT original de
 * `backend/db/evaluation-schema.sql` (líneas 192-216), que sigue este mismo orden.
 *
 * Antes vivía copiado a mano como un CASE SQL en 5 sitios distintos (assessments.routes.ts,
 * ReportService.ts x2, QuestionnaireService.ts x2) más un mapa equivalente en el frontend. De
 * esos, QuestionnaireService.ts tenía el orden correcto (TSINF=2, TSHCR=6); los otros 4 sitios
 * habían heredado por copy-paste un error con TSHCR y TSINF invertidos (ver
 * backend/docs/BUG16-orden-estandares.md) — el cuestionario se armaba/publicaba en un orden
 * distinto al que mostraba el formulario de evaluación y el PDF. Fuente única de verdad desde
 * 2026-07-20.
 *
 * Espejo en el frontend: frontend/src/pages/AssessmentExecutionPage.tsx (DOMAIN_ORDER) —
 * mantener ambos sincronizados si este orden cambia.
 */
export const TRANSVERSAL_STANDARD_ORDER = [
  'TSTH',
  'TSINF',
  'TSDOT',
  'TSMD',
  'TSPP',
  'TSHCR',
  'TSINT',
] as const;

/**
 * Genera el fragmento `CASE <columnExpr> WHEN ... END` para usar en `ORDER BY`.
 * `columnExpr` es la expresión SQL que evalúa al código del estándar (ej. `es.code`,
 * `sub.standard_code`).
 */
export function standardOrderCaseSql(columnExpr: string): string {
  const whens = TRANSVERSAL_STANDARD_ORDER
    .map((code, i) => `WHEN '${code}' THEN ${i + 1}`)
    .join(' ');
  return `CASE ${columnExpr} ${whens} ELSE ${TRANSVERSAL_STANDARD_ORDER.length + 1} END`;
}
