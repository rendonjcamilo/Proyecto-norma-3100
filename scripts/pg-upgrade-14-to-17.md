# Runbook: Migración de PostgreSQL 14 → 17 en producción

> **Estado:** Runbook listo. Ejecución en producción PENDIENTE de checkpoint humano (Task 2 del plan 06-09).
> **Alcance:** `norma3100-postgres` en `/opt/norma3100` (VPS `147.93.45.4`, alias SSH `hostinger-vps-new`).
> **Responsable de ejecución:** Juan Camilo Rendón (VPS operations owner), bajo supervisión.
> **Referencia normativa interna:** REGLA DE ORO #6 (validación 100% de impacto antes de proponer/ejecutar) y CONCERNS.md §6 "Postgres 14 Is EOL (MEDIUM)".

---

## 0. Resumen ejecutivo

PostgreSQL 14 llega a EOL en noviembre de 2026 (deja de recibir parches de seguridad). El contenedor de producción usa `postgres:14-alpine` (`docker-compose.prod.yml` línea 87), con datos en el volumen Docker `postgres_data` montado en `/var/lib/postgresql/data`.

**Esto NO es un simple cambio de tag de imagen.** PostgreSQL 17 rehúsa arrancar sobre un directorio de datos escrito por la versión 14 (el formato de archivo binario del catálogo cambia entre major versions). La única ruta segura es **dump lógico → restore en una instancia nueva de pg17**, nunca un `docker compose down -v` ni un simple reemplazo de imagen sobre el volumen existente.

**Garantía de no-regresión (REGLA DE ORO #6):**
- El pg14 actual NUNCA se detiene con `-v` (los datos persisten en `postgres_data` durante todo el proceso).
- El dump/restore se prueba primero en un contenedor **desechable** (throwaway), separado del volumen de producción, antes de tocar nada real.
- La migración real a pg17 usa un volumen **nuevo** (`postgres_data_v17`); el volumen `postgres_data` (pg14) permanece intacto y montable durante y después del corte, como plan de rollback inmediato.
- El cambio de tag de imagen en `docker-compose.prod.yml` (`postgres:14-alpine` → `postgres:17-alpine`) se aplica **durante la ejecución supervisada** de este runbook — no se commitea como una edición aislada que rompería un `docker compose up` normal mientras el volumen siga en formato pg14.

---

## 1. Pre-requisitos y garantía de no-regresión

Antes de tocar cualquier cosa:

- [ ] Confirmar que `docker compose down -v` / `docker compose down --volumes` está PROHIBIDO en este runbook. En ningún paso se ejecuta contra `norma3100-postgres` ni contra el volumen `postgres_data`.
- [ ] Confirmar que existe un backup cifrado reciente (`scripts/backup.sh`) y que **pasó** la verificación de restaurabilidad (sección 3) antes de iniciar la sección 4 (migración real).
- [ ] Confirmar espacio en disco suficiente en el VPS para: el dump sin comprimir temporal, el volumen `postgres_data_v17` completo, y mantener `postgres_data` (pg14) sin tocar durante 7 días post-corte (sección 7). Verificar con `df -h` antes de empezar.
- [ ] Confirmar ventana de mantenimiento comunicada (aunque el objetivo es minimizar downtime, la sección 5 implica un corte breve del backend).
- [ ] Tener acceso SSH confirmado: `ssh hostinger-vps-new` → `cd /opt/norma3100`.

**Regla dura:** si cualquier checklist de arriba no se puede marcar, NO se avanza a la sección 4.

---

## 2. Backup cifrado

Usar el script existente `scripts/backup.sh` (AES-256-CBC + PBKDF2, 100k iteraciones, checksum SHA-256). En el VPS:

```bash
ssh hostinger-vps-new
cd /opt/norma3100

# El script detecta el contenedor Docker (norma3100-postgres) automáticamente
# y hace pg_dump dentro del contenedor -> gzip -> cifrado, sin escribir texto plano a disco.
BACKUP_PASSPHRASE='<passphrase-segura-desde-vault>' \
DB_NAME=norma3100 \
DB_USER=postgres \
BACKUP_DIR=/opt/norma3100/backups \
  ./scripts/backup.sh
```

Esto produce:
- `/opt/norma3100/backups/norma3100_<TIMESTAMP>.sql.gz.enc` — dump cifrado
- `/opt/norma3100/backups/norma3100_<TIMESTAMP>.sql.gz.enc.sha256` — checksum

Verificar el checksum inmediatamente:

```bash
cd /opt/norma3100/backups
sha256sum -c norma3100_<TIMESTAMP>.sql.gz.enc.sha256
```

No continuar a la sección 3 si el checksum no coincide.

---

## 3. Verificación de restaurabilidad (FR-110.10)

**Objetivo:** demostrar que el backup cifrado producido en la sección 2 restaura limpio ANTES de arriesgar nada en producción. Esto corre en un contenedor **desechable**, en un volumen **desechable** — nunca toca `postgres_data` ni `norma3100-postgres`.

```bash
cd /opt/norma3100

# 1. Levantar un pg14 desechable en un volumen nuevo (aislado del real)
docker run -d --name pg-restore-check \
  -e POSTGRES_PASSWORD=throwaway_pw \
  -e POSTGRES_DB=norma3100 \
  -v pg_restore_check_vol:/var/lib/postgresql/data \
  postgres:14-alpine

# Esperar a que esté healthy
until docker exec pg-restore-check pg_isready -U postgres; do sleep 2; done

# 2. Descifrar + descomprimir + restaurar el backup en el contenedor desechable
openssl enc -d -aes-256-cbc -pbkdf2 -iter 100000 -md sha256 \
  -pass pass:'<passphrase-segura-desde-vault>' \
  -in /opt/norma3100/backups/norma3100_<TIMESTAMP>.sql.gz.enc \
| gunzip \
| docker exec -i pg-restore-check psql -U postgres -d norma3100

# 3. Sanity check: conteos de filas en tablas clave, comparados contra el pg14 real
echo "== Conteos en el restore desechable =="
docker exec pg-restore-check psql -U postgres -d norma3100 -c \
  "SELECT 'providers' AS tabla, count(*) FROM providers
   UNION ALL SELECT 'assessments', count(*) FROM assessments
   UNION ALL SELECT 'events', count(*) FROM events
   UNION ALL SELECT 'findings', count(*) FROM findings
   UNION ALL SELECT 'users', count(*) FROM users;"

echo "== Conteos en el pg14 real (para comparar) =="
docker exec norma3100-postgres psql -U postgres -d norma3100 -c \
  "SELECT 'providers' AS tabla, count(*) FROM providers
   UNION ALL SELECT 'assessments', count(*) FROM assessments
   UNION ALL SELECT 'events', count(*) FROM events
   UNION ALL SELECT 'findings', count(*) FROM findings
   UNION ALL SELECT 'users', count(*) FROM users;"

# 4. Verificación de integridad de la cadena hash de eventos (tamper detection)
echo "== count(*) de events en el restore (cadena hash) =="
docker exec pg-restore-check psql -U postgres -d norma3100 -c \
  "SELECT count(*) FROM events;"
```

**Criterio de aceptación:** los conteos de `providers`, `assessments`, `events`, `findings`, `users` en el restore desechable deben **coincidir exactamente** con los del pg14 real, y el `count(*) FROM events` del restore debe ser igual al del origen (ninguna fila de la cadena hash se perdió en el dump/restore).

Si CUALQUIER conteo no coincide: **detener aquí**, no avanzar a la sección 4, investigar la causa (backup corrupto, dump incompleto, etc.) y repetir la sección 2.

```bash
# 5. Teardown — SOLO el contenedor y volumen desechables. NUNCA norma3100-postgres.
docker stop pg-restore-check && docker rm pg-restore-check
docker volume rm pg_restore_check_vol
```

---

## 4. Migración a pg17

Solo proceder si la sección 3 pasó completamente.

```bash
cd /opt/norma3100

# 1. Dump completo desde el pg14 en vivo (pg_dumpall incluye roles + todas las DBs;
#    alternativa: pg_dump -Fc por DB individual si se prefiere formato custom)
docker exec norma3100-postgres pg_dumpall -U postgres > /opt/norma3100/backups/pg14_full_dump_pre_v17.sql

# 2. Crear el volumen NUEVO para pg17 (el volumen pg14 'postgres_data' queda intacto)
docker volume create norma3100_postgres_data_v17

# 3. Levantar un servicio pg17 temporal apuntando al volumen nuevo
docker run -d --name norma3100-postgres-v17 \
  -e POSTGRES_PASSWORD="${DB_PASSWORD}" \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=norma3100 \
  -v norma3100_postgres_data_v17:/var/lib/postgresql/data \
  --network norma3100_norma-network \
  postgres:17-alpine

until docker exec norma3100-postgres-v17 pg_isready -U postgres; do sleep 2; done

# 4. Restaurar el dump en la instancia pg17
docker exec -i norma3100-postgres-v17 psql -U postgres < /opt/norma3100/backups/pg14_full_dump_pre_v17.sql

# 5. Aplicar migraciones de la app (por si hay migraciones pendientes desde el último deploy)
#    Esto requiere apuntar temporalmente el backend (o un contenedor efímero con el mismo código)
#    a norma3100-postgres-v17 vía DB_HOST=norma3100-postgres-v17
docker compose -f docker-compose.prod.yml run --rm \
  -e DB_HOST=norma3100-postgres-v17 \
  backend npm run migrate:up

# 6. Repetir los mismos conteos de la sección 3, ahora contra pg17, y comparar contra el baseline pg14
echo "== Conteos en pg17 (post dump/restore + migrate:up) =="
docker exec norma3100-postgres-v17 psql -U postgres -d norma3100 -c \
  "SELECT 'providers' AS tabla, count(*) FROM providers
   UNION ALL SELECT 'assessments', count(*) FROM assessments
   UNION ALL SELECT 'events', count(*) FROM events
   UNION ALL SELECT 'findings', count(*) FROM findings
   UNION ALL SELECT 'users', count(*) FROM users;"
```

**Criterio de aceptación:** los conteos de `providers`, `assessments`, `events`, `findings` en pg17 deben coincidir con el baseline pg14 capturado en la sección 3 (más cualquier escritura legítima ocurrida entre el dump y este punto, si el corte no fue instantáneo — documentar la diferencia si la hay).

Solo **después** de que este chequeo pase, editar `docker-compose.prod.yml`:
- `image: postgres:14-alpine` → `image: postgres:17-alpine` (servicio `postgres`, línea ~87)
- `postgres_data:/var/lib/postgresql/data` → `postgres_data_v17:/var/lib/postgresql/data` (mismo servicio)
- Agregar `postgres_data_v17` a la sección `volumes:` top-level.

Este cambio se aplica y commitea **como parte de la ejecución supervisada**, no antes.

---

## 5. Corte (cutover)

```bash
cd /opt/norma3100

# 1. Detener el backend (evita escrituras mientras se hace el corte final)
docker compose -f docker-compose.prod.yml stop backend

# 2. Detener el contenedor pg14 en vivo -- SIN -v, el volumen postgres_data se conserva intacto
docker compose -f docker-compose.prod.yml stop postgres

# 3. Traer el stack con el docker-compose.prod.yml ya editado (imagen pg17 + volumen v17)
docker compose -f docker-compose.prod.yml up -d postgres
# Esto debe levantar norma3100-postgres ahora sobre postgres:17-alpine + postgres_data_v17
# (el contenedor temporal norma3100-postgres-v17 de la sección 4 puede detenerse/eliminarse
#  una vez que el servicio definitivo esté arriba y verificado)

docker exec norma3100-postgres pg_isready -U postgres

# 4. Levantar el backend de nuevo
docker compose -f docker-compose.prod.yml up -d backend

# 5. Healthcheck de la app
curl -f http://127.0.0.1:3001/health

# 6. Smoke test funcional: una lectura y una escritura reales
#    Lectura: cualquier GET autenticado sobre /api/assessments
#    Escritura: PUT sobre una evaluación existente (guardar una respuesta) o
#    crear un evento de prueba controlado, y confirmar que aparece con su
#    previous_event_hash encadenado correctamente.
```

**Criterio de aceptación:** `/health` responde 200, la lectura y la escritura de prueba funcionan, y no hay errores de conexión en `docker compose logs backend --tail=50`.

---

## 6. Rollback

Si CUALQUIER chequeo de las secciones 3, 4 o 5 falla:

```bash
cd /opt/norma3100

# 1. Detener backend y el postgres nuevo (pg17) -- SIN -v
docker compose -f docker-compose.prod.yml stop backend
docker compose -f docker-compose.prod.yml stop postgres

# 2. Revertir docker-compose.prod.yml al estado anterior:
#    image: postgres:17-alpine -> postgres:14-alpine
#    volumen: postgres_data_v17 -> postgres_data
git checkout -- docker-compose.prod.yml   # si el commit de la sección 4 aún no se hizo
#    (o un revert explícito del commit si ya se había aplicado)

# 3. Levantar de nuevo sobre el volumen pg14 original (postgres_data), intacto desde la sección 1
docker compose -f docker-compose.prod.yml up -d postgres
docker exec norma3100-postgres pg_isready -U postgres

# 4. Levantar backend
docker compose -f docker-compose.prod.yml up -d backend
curl -f http://127.0.0.1:3001/health

# 5. Limpieza de los recursos temporales de pg17 (el volumen v17 puede conservarse
#    para diagnóstico o eliminarse una vez confirmado el rollback estable)
docker stop norma3100-postgres-v17 2>/dev/null || true
docker rm norma3100-postgres-v17 2>/dev/null || true
# NO eliminar postgres_data_v17 de inmediato -- conservar para el post-mortem.
```

**El volumen `postgres_data` (pg14) nunca se tocó con `-v` en ningún paso previo, por lo que el rollback es una simple reversión de imagen + volumen, sin pérdida de datos.**

---

## 7. Post-upgrade

- [ ] Conservar el volumen `postgres_data` (pg14) sin eliminar durante **7 días** después de un corte exitoso, como red de seguridad adicional al backup cifrado.
- [ ] Confirmar que `log_connections = on` / `log_disconnections = on` (aplicado en el plan 06-08) sigue activo en la instancia pg17 — estos ajustes viven en `ALTER SYSTEM` dentro del propio volumen de datos, así que **deben reaplicarse** en el volumen v17 si no fueron parte del dump (`ALTER SYSTEM` no se incluye en `pg_dumpall` de datos de usuario; verificar `SHOW log_connections;` en pg17 y reaplicar si es necesario).
- [ ] Pasados los 7 días sin incidentes, eliminar el volumen `postgres_data` (pg14) y el dump temporal `pg14_full_dump_pre_v17.sql` (mover a almacenamiento frío o borrar según política de retención).
- [ ] Actualizar `.planning/STATE.md` y `CONCERNS.md` §6 marcando el ítem como resuelto.
- [ ] Registrar en `SECURITY.md` (si aplica) la fecha de la migración para el historial de parches.

---

## Referencia rápida de acceso

- SSH: `ssh hostinger-vps-new` (key: `C:\Users\guido\.ssh\hostinger_agente_openclaw_ed25519`)
- Directorio de la app en el VPS: `/opt/norma3100`
- Contenedor postgres actual: `norma3100-postgres` (imagen `postgres:14-alpine`, volumen `postgres_data`)
- Compose file de producción: `docker-compose.prod.yml`
- **Prohibido siempre:** `docker compose down -v` / `docker compose down --volumes` contra `docker-compose.prod.yml` en el VPS — el volumen `postgres_data` tiene datos reales de cumplimiento y NUNCA debe destruirse.

---

## Nota de ejecución de este plan (06-09, Task 1)

La verificación de restaurabilidad local (sección 3, ejecutada contra un backup real) **no se ejecutó en este task** porque el entorno de ejecución del executor no tiene el daemon de Docker corriendo (`docker ps` falló con `dockerDesktopLinuxEngine` no disponible) y no existe un backup previo en `./backups/` en este checkout. Esta verificación queda como el **primer paso obligatorio y bloqueante** del checkpoint humano (Task 2): si el restore desechable no pasa los chequeos de conteo de filas y cadena de eventos, el runbook prohíbe avanzar a la sección 4 (migración real).
