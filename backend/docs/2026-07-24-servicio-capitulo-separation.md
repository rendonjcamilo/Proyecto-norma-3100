# Separación servicio REPS vs capítulo de cumplimiento (2026-07-24)

## Problema

La tabla `services` mezcla dos conceptos distintos sin distinguirlos (ver `CONTEXT.md`):
- **157 servicios REPS reales** (código numérico, ej. `301`) — lo que un prestador registra
  ante el REPS y debería poder marcar como "habilitado".
- **39 "capítulos de cumplimiento"** (código alfa, ej. `SF`, `CIA`, `MNUC`) — filas internas que
  cargan cuestionarios/criterios de evaluación adicionales, nunca deberían mostrarse como un
  servicio que un prestador "tiene habilitado".

Ambas poblaciones aparecían mezcladas en el selector de "Servicios Habilitados" de un prestador
y en el selector de servicio al crear una evaluación. **Confirmado en producción** (lectura
2026-07-24, autorizada explícitamente): 8 evaluaciones reales ya tienen `service_id` apuntando a
un capítulo en vez de a un servicio REPS real (CEE ×4, CEG ×1, GNT ×1, IDX ×2), y 2 prestadores
tienen un capítulo marcado como "habilitado" (CEE, IDX).

## Decisión de diseño: aditivo, nunca destructivo

Dado que ya hay auditorías reales en prod referenciando estas filas vía FK (`assessments`,
`findings`, `capacidad_instalada_servicios`, `services_enabled`, `evaluation_criteria`,
`evaluation_standards`, `questionnaires` — las 7 tablas que tienen FK a `services.id`), el diseño
descarta la idea original de "reapuntar los criterios extra al servicio REPS real y borrar la
fila duplicada del capítulo". Esa alternativa habría requerido migrar esas 8 evaluaciones reales
primero — se deja fuera de alcance explícitamente, ver "Pendiente" abajo.

En su lugar:
1. Columna `services.type` (`reps_service` | `compliance_chapter`) — aditiva, no toca ningún FK
   existente.
2. Tabla nueva `service_chapter_mapping` — enlaza servicio REPS ↔ capítulo para una futura
   funcionalidad de auto-sugerencia (no implementada aún). No toca `services_enabled`,
   `assessments`, `findings`, etc.
3. Los endpoints que alimentan los selectores ahora filtran por `type='reps_service'`.

## Migraciones (en este orden exacto)

```
backend/db/migrations/2026-07-24-add-service-type-column.sql
backend/db/migrations/2026-07-24-create-service-chapter-mapping.sql
backend/db/migrations/2026-07-24-deactivate-chapter-enablements.sql
```

**⚠️ Bug conocido del migration runner** (`backend/db/migrations.ts`, `executeSchemaFile`): su
parser ingenuo (`content.split(';')`) falló silenciosamente en
`2026-07-24-create-service-chapter-mapping.sql` (el `CREATE TABLE` nunca se ejecutó, cada
`INSERT` subsiguiente falló con "relation does not exist") **pero el runner igual marcó la
migración como aplicada** y reportó "Migrations UP completed successfully". Mismo bug ya
documentado para `2026-07-21-fix-service-name-typos.sql`. Workaround usado en dev:

```bash
docker cp backend/db/migrations/2026-07-24-create-service-chapter-mapping.sql norma3100-postgres:/tmp/
docker exec norma3100-postgres psql -U postgres -d norma3100 -f /tmp/svc-chapter-mapping.sql
```

**Antes de dar por buena esta migración en prod, verificar directo con SELECT** (no confiar en
el mensaje de éxito del runner):

```sql
SELECT count(*) FROM service_chapter_mapping;  -- debe dar 41
SELECT type, count(*) FROM services GROUP BY type;  -- debe dar reps_service=157, compliance_chapter=39
```

## Cambios de código

- `backend/src/services/ServiceService.ts` — `getAllServices` acepta filtro `type`.
- `backend/src/routes/services.routes.ts` — `GET /api/services` acepta `?type=`. Default sin
  cambios (compatible hacia atrás) porque `QuestionnairesPage.tsx` todavía necesita ver los
  capítulos para poder adjuntarles un cuestionario nuevo.
- `backend/src/routes/provider.routes.ts` — `GET /providers/:id/services` ahora filtra
  `type='reps_service'`; `PUT /providers/:id/services` ahora rechaza (400) cualquier
  `serviceId` que sea un capítulo, con mensaje explícito.
- `frontend/src/pages/ProvidersPage.tsx`, `frontend/src/pages/AssessmentsPage.tsx` — piden
  explícitamente `type: 'reps_service'` al cargar el selector de servicios.
- `frontend/src/services/api.ts` — `servicesApi.getAll()` acepta el parámetro `type`.

## Garantía de no-regresión

| Consumidor de `services`/`services_enabled` | Impacto | Evidencia |
|---|---|---|
| `assessments`, `findings`, `capacidad_instalada_servicios` | Ninguno | Ningún FK existente se reapunta ni se borra; los 8 registros reales en prod que referencian un capítulo siguen intactos y consultables. |
| `evaluation_criteria`, `evaluation_standards`, `questionnaires` | Ninguno | Mismo motivo — solo se agregó una columna y una tabla nueva. |
| `GET /api/services` (sin `?type=`) | Ninguno | Comportamiento default sin cambios; `QuestionnairesPage.tsx` sigue viendo capítulos. |
| `services_enabled` histórico | 2 filas en dev pasan de `active` a `inactive` (soft-delete, no se borran) | Eran exactamente la manifestación del bug reportado — un capítulo marcado como "habilitado". Prod tiene el mismo patrón (CEE, IDX), 1 fila cada uno — replicar la 3ra migración ahí también. |

## Pendiente (explícitamente fuera de alcance de este cambio)

- **CEE y QRG no tienen mapeo** — cubren toda una categoría (91 y 24 servicios REPS
  respectivamente), no un servicio puntual. Decisión de diseño pendiente (¿regla a nivel de
  categoría en vez de fila por fila?).
- **13 filas de `service_chapter_mapping` con `confidence='needs_review'`** — candidato(s)
  encontrado(s) algorítmicamente pero no confirmado por la Dra. Adriana (5 capítulos se dividen
  en 2 servicios REPS reales: DLS, HPP, IDX, TAS, CES; 3 tienen un único candidato débil: CEG,
  HGP, LPT). Consultar con `SELECT * FROM service_chapter_mapping WHERE confidence='needs_review'`.
- **Los 8 assessments reales en prod que apuntan a un capítulo** (CEE ×4, CEG ×1, GNT ×1, IDX ×2)
  quedan tal cual — no se tocan. Migrarlos a su servicio REPS real es un cambio de mayor alcance,
  no incluido aquí.
- La funcionalidad de auto-sugerencia de capítulos según servicios habilitados (el objetivo final
  de `service_chapter_mapping`) no está implementada — esta migración solo deja los datos listos.

## Verificado en dev (2026-07-24)

- `GET /api/services` sin filtro → 196; con `?type=reps_service` → 157 (sin códigos alfa);
  con `?type=compliance_chapter` → 39.
- `PUT /providers/:id/services` con un `serviceId` de capítulo → `400` con mensaje explícito.
- `GET /providers/:id/services` para el prestador que tenía CEE habilitado → ya no aparece.
- Build de backend y frontend sin errores nuevos (mismos ~13 errores TS preexistentes,
  ninguno en los archivos tocados).
- Sitio `dev.app.habilitapro.com` responde 200 tras el redeploy.
