#!/usr/bin/env bash
# backup.sh — Backup cifrado de PostgreSQL con AES-256-CBC
# Uso:
#   ./scripts/backup.sh                    # backup manual
#   BACKUP_PASSPHRASE=secret ./scripts/backup.sh
#
# Variables de entorno requeridas:
#   BACKUP_PASSPHRASE   — Passphrase para cifrar el backup (requerida)
#   DB_HOST             — Host de PostgreSQL (default: localhost)
#   DB_PORT             — Puerto de PostgreSQL (default: 5432)
#   DB_NAME             — Nombre de la base de datos (default: norma3100)
#   DB_USER             — Usuario de PostgreSQL (default: postgres)
#   DB_PASSWORD         — Contraseña de PostgreSQL
#   BACKUP_DIR          — Directorio destino (default: ./backups)
#   BACKUP_RETENTION_DAYS — Días de retención (default: 30)

set -euo pipefail

# ── Configuración ──────────────────────────────────────────────────────────────
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-norma3100}"
DB_USER="${DB_USER:-postgres}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/norma3100_${TIMESTAMP}.sql.gz.enc"
CHECKSUM_FILE="${BACKUP_FILE}.sha256"

# ── Validaciones ───────────────────────────────────────────────────────────────
if [[ -z "${BACKUP_PASSPHRASE:-}" ]]; then
  echo "ERROR: BACKUP_PASSPHRASE no está configurada." >&2
  echo "  Uso: BACKUP_PASSPHRASE='tu-passphrase-segura' ./scripts/backup.sh" >&2
  exit 1
fi

if ! command -v pg_dump &>/dev/null && ! command -v docker &>/dev/null; then
  echo "ERROR: pg_dump no encontrado. Instala postgresql-client o usa Docker." >&2
  exit 1
fi

if ! command -v openssl &>/dev/null; then
  echo "ERROR: openssl no encontrado. Instala openssl." >&2
  exit 1
fi

# ── Crear directorio de backups ────────────────────────────────────────────────
mkdir -p "${BACKUP_DIR}"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Iniciando backup de ${DB_NAME}..."

# ── Dump + Compresión + Cifrado (pipeline) ─────────────────────────────────────
# pg_dump → gzip → AES-256-CBC con PBKDF2 (100k iteraciones, sha256)
# El pipeline evita escribir datos sin cifrar en disco
if command -v docker &>/dev/null && docker ps --filter "name=postgres" --format "{{.Names}}" | grep -q postgres 2>/dev/null; then
  # Modo Docker: ejecutar pg_dump dentro del contenedor
  docker exec "$(docker ps --filter 'name=postgres' --format '{{.Names}}' | head -1)" \
    pg_dump -U "${DB_USER}" -d "${DB_NAME}" --no-password \
  | gzip -9 \
  | openssl enc -aes-256-cbc -pbkdf2 -iter 100000 -md sha256 \
      -pass pass:"${BACKUP_PASSPHRASE}" \
  > "${BACKUP_FILE}"
else
  # Modo local: pg_dump directo
  PGPASSWORD="${DB_PASSWORD:-postgres_dev_password}" \
  pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" \
  | gzip -9 \
  | openssl enc -aes-256-cbc -pbkdf2 -iter 100000 -md sha256 \
      -pass pass:"${BACKUP_PASSPHRASE}" \
  > "${BACKUP_FILE}"
fi

# ── Checksum del archivo cifrado ───────────────────────────────────────────────
sha256sum "${BACKUP_FILE}" > "${CHECKSUM_FILE}"
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Backup creado: ${BACKUP_FILE}"
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Checksum: $(cat "${CHECKSUM_FILE}")"

# ── Limpieza de backups antiguos ───────────────────────────────────────────────
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Eliminando backups con más de ${RETENTION_DAYS} días..."
find "${BACKUP_DIR}" -name "norma3100_*.sql.gz.enc" -mtime "+${RETENTION_DAYS}" -delete
find "${BACKUP_DIR}" -name "norma3100_*.sha256" -mtime "+${RETENTION_DAYS}" -delete

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Backup completado exitosamente."

# ── Instrucciones de restauración ─────────────────────────────────────────────
cat <<EOF

Para restaurar este backup:
  openssl enc -d -aes-256-cbc -pbkdf2 -iter 100000 -md sha256 \\
    -pass pass:'\${BACKUP_PASSPHRASE}' \\
    -in ${BACKUP_FILE} \\
  | gunzip \\
  | psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME}

Para verificar el checksum antes de restaurar:
  sha256sum -c ${CHECKSUM_FILE}

EOF
