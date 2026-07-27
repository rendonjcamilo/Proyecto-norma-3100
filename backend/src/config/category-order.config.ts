/**
 * Orden normativo único de los 5 grupos de servicio de la Resolución 3100, Capítulo 11:
 * 11.2 Consulta Externa, 11.3 Apoyo Diagnóstico y Complementación Terapéutica, 11.4
 * Internación, 11.5 Quirúrgico, 11.6 Atención Inmediata (11.1 son los estándares
 * transversales, ver `standard-order.config.ts`, no un grupo de servicio).
 *
 * Antes vivía copiado a mano como un CASE SQL/array en 5 sitios distintos
 * (ServiceService.ts x3, structure.routes.ts, ProvidersPage.tsx en el frontend), todos con
 * el mismo orden equivocado ('Internación', 'Quirúrgicos', 'Consulta Externa', 'Apoyo
 * Diagnóstico...', 'Atención Inmediata') que no coincide con la numeración real del capítulo.
 * Reportado por el usuario comparando la pantalla "Estructura de Servicios" contra el archivo
 * fuente (spreadsheet de la Res. 3100). Fuente única de verdad desde 2026-07-27.
 *
 * Espejo en el frontend: frontend/src/pages/ProvidersPage.tsx (picker de servicios
 * habilitados) — mantener sincronizado si este orden cambia.
 */
export const SERVICE_CATEGORY_ORDER = [
  'Consulta Externa',
  'Apoyo Diagnóstico y Complementación Terapéutica',
  'Internación',
  'Quirúrgicos',
  'Atención Inmediata',
] as const;

/**
 * Genera el fragmento `CASE <columnExpr> WHEN ... END` para usar en `ORDER BY`.
 * `columnExpr` es la expresión SQL que evalúa a la categoría/grupo (ej. `category`,
 * `s.category`).
 */
export function categoryOrderCaseSql(columnExpr: string): string {
  const whens = SERVICE_CATEGORY_ORDER
    .map((cat, i) => `WHEN '${cat}' THEN ${i + 1}`)
    .join(' ');
  return `CASE ${columnExpr} ${whens} ELSE ${SERVICE_CATEGORY_ORDER.length + 1} END`;
}
