# Proyecto-norma-3100

Plataforma de gestión de cumplimiento con la Resolución 3100 de 2019 para prestadores de salud
colombianos: certificación, autoevaluación, hallazgos y reportería regulatoria (REPS/INVIMA).

## Language

**REPS** (Registro Especial de Prestadores de Servicios de Salud):
El registro oficial de MinSalud donde un prestador de salud colombiano queda inscrito. En este
codebase, "buscar en REPS" (`repsApi.consultar`) consulta el dataset `c36g-9fc2` de datos.gov.co,
que **solo trae identidad del prestador** (nombre, dirección, teléfono, código de habilitación,
NIT) — nunca servicios habilitados. Confirmado empíricamente 2026-07-21 consultando la API en
vivo con un prestador real: la respuesta no tiene ningún campo de servicios. No existe hoy una
fuente automatizable (API pública, dataset nacional en datos.gov.co, o export) de los servicios
habilitados de un prestador por su código/NIT — el portal oficial que sí los muestra
(`prestadores.minsalud.gov.co/habilitacion`) es de uso manual y está protegido con CAPTCHA.
_Avoid_: asumir que "buscar en REPS" trae o debería traer servicios — no lo hace, por diseño de
la fuente de datos, no por un bug pendiente de arreglar.

**Servicio** (servicio REPS específico):
La unidad granular y oficial que un prestador **registra ante el REPS** (ej. "Cuidado Intensivo
Neonatal", "Cirugía General", "Urgencias"). Fuente de verdad del listado completo: hoja de cálculo
del equipo de auditoría/habilitación (columna `nombre_servicio`). En la tabla `services` son las
157 filas con código numérico REPS oficial. Es lo único que debería vivir en `services_enabled`
(prestador ↔ servicio) — lo que un prestador realmente tiene habilitado.
_Avoid_: confundir con **Grupo de servicio** o **Capítulo de cumplimiento** (ver abajo) — los tres
son conceptos distintos que llegaron a compartir la misma tabla `services`, causando confusión
real en la UI ("se mezcla con los grupos de servicios") confirmada 2026-07-21.

**Grupo de servicio**:
Una de solo 5 categorías amplias de la Res. 3100 (Internación, Quirúrgicos, Consulta Externa,
Apoyo Diagnóstico y Complementación Terapéutica, Atención Inmediata) — confirmado contra la hoja
de cálculo oficial del equipo (columna `grupo_servicio`). En el código es la columna `category` de
`services`. Es una agrupación visual/de filtro, no algo que un prestador "tenga habilitado".

**Capítulo de cumplimiento** (nombre no oficial, uso interno del código):
Concepto real de la Res. 3100/Res. 1619 — un set adicional de estándares/criterios de habilitación
específico para cierto tipo de servicio (ej. `SF` = Servicio Farmacéutico, `CIA` = Cuidado
Intensivo Adulto, `MNUC` = Medicina Nuclear, `LAB-CAL` = calidad de laboratorio Res.1619). 39 filas
en `services` con código alfa, cada una con su propio `evaluation_standards`/`questionnaires`
publicado — activamente usado en el flujo de "Nueva Evaluación" (`AssessmentsPage.tsx`, sección
"Servicios específicos a evaluar"). **No es un servicio REPS ni un grupo** — determina qué checklist
adicional aplica, no qué presta el prestador. Confirmado en uso real 2026-07-21, no se debe borrar.
_Avoid_: mostrarlo junto a **Servicio** en el mismo listado sin distinguir tipo — root cause del
bug de "se mezcla" reportado 2026-07-21.

**Servicio ficticio** (eliminado 2026-07-21):
157 filas placeholder (códigos `CX-*`/`AD-*`/`INT-*`/`QX-*`/`AI-*`) de un scaffold temprano,
declaradas obsoletas por `backend/db/migrations/2026-04-24-reps-services.sql` pero resucitadas en
cada deploy por un bug de idempotencia en `backend/db/migrations.ts` (corregido 2026-07-21). Sin
contenido real (0 criterios). No deberían volver a aparecer.

## Relationships

- Un **Prestador** (`providers`) tiene cero o más **Servicios** (REPS), vía `services_enabled`
- Cada **Servicio** pertenece a un **Grupo de servicio** (`category`) — solo para agrupar/filtrar
- Un **Capítulo de cumplimiento** trae su propio cuestionario y se selecciona al crear una
  evaluación (`AssessmentsPage.tsx`) — hoy es una selección manual separada, no derivada
  automáticamente de los **Servicios** reales del prestador (mejora futura pendiente, no
  implementada)
- La búsqueda de **REPS** solo autocompleta campos de identidad de un **Prestador** — no toca
  **Servicios**

## Example dialogue

> **Dev:** "¿Por qué no aparecen preseleccionados los servicios que el prestador tiene en el REPS?"
> **Domain expert (investigación 2026-07-20/21):** "Porque REPS, tal como lo consulta la app hoy,
> nunca tuvo esa información — es un dataset de identidad, no de servicios. No es un bug de
> matching, es una limitación de la fuente de datos. La opción viable a corto plazo es dejar la
> selección de servicios 100% manual y ser honestos en la UI sobre eso."

## Flagged ambiguities

- El término "REPS" quedó resuelto: es fuente de identidad únicamente, no de servicios habilitados
  (2026-07-21).
- **"Servicio" vs "Grupo de servicio" vs "Capítulo de cumplimiento" quedó resuelto (2026-07-21)**
  contra la hoja de cálculo oficial del equipo — ver arriba. Pendiente sin resolver: si un
  **Capítulo de cumplimiento** debería derivarse automáticamente de los **Servicios** reales que
  el prestador tiene habilitados (en vez de seleccionarse manualmente al crear una evaluación) —
  esto requeriría un mapeo explícito servicio↔capítulo, validado por la Dra. Adriana, que no
  existe todavía.
