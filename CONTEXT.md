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

**Servicios Habilitados**:
Los servicios de salud que un prestador tiene autorizados para operar (ej. "Cuidado Intensivo
Neonatal"), almacenados en la tabla `services` (157 filas, nomenclatura oficial Res. 3100) y
enlazados al prestador vía `services_enabled`. Se seleccionan **manualmente** al crear/editar un
prestador — no hay preselección automática desde REPS (ver arriba).
_Avoid_: "servicios REPS" como si fuera una fuente de datos disponible — la única fuente de
verdad para esto en la app es la selección manual del usuario.

## Relationships

- Un **Prestador** (`providers`) tiene cero o más **Servicios Habilitados**, vía `services_enabled`
- La búsqueda de **REPS** solo autocompleta campos de identidad de un **Prestador** — no toca
  **Servicios Habilitados**

## Example dialogue

> **Dev:** "¿Por qué no aparecen preseleccionados los servicios que el prestador tiene en el REPS?"
> **Domain expert (investigación 2026-07-20/21):** "Porque REPS, tal como lo consulta la app hoy,
> nunca tuvo esa información — es un dataset de identidad, no de servicios. No es un bug de
> matching, es una limitación de la fuente de datos. La opción viable a corto plazo es dejar la
> selección de servicios 100% manual y ser honestos en la UI sobre eso."

## Flagged ambiguities

- Ninguna pendiente — el término "REPS" quedó resuelto: es fuente de identidad únicamente, no de
  servicios habilitados (2026-07-21).
