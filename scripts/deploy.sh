#!/bin/bash
# deploy.sh — Script de despliegue para app.habilitapro.com
# Uso: bash /opt/norma3100/scripts/deploy.sh
#
# Requisitos:
#   - Repo clonado en /opt/norma3100
#   - Archivo /opt/norma3100/.env.production con las variables de entorno
#   - Docker y Docker Compose instalados

set -euo pipefail

APP_DIR="/opt/norma3100"
COMPOSE_FILE="$APP_DIR/docker-compose.prod.yml"
COMPOSE_CMD="docker compose -f $COMPOSE_FILE --env-file $APP_DIR/.env.production"
LOG_FILE="/var/log/norma3100-deploy.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=========================================="
log "Iniciando despliegue de HabilitaPro"
log "=========================================="

# 1. Verificar que existe el archivo de variables de entorno
if [ ! -f "$APP_DIR/.env.production" ]; then
  log "ERROR: No existe $APP_DIR/.env.production"
  log "Crea el archivo copiando: cp .env.production.example .env.production"
  exit 1
fi

cd "$APP_DIR"

# 2. Obtener últimos cambios del repositorio
log "Actualizando código desde repositorio..."
git fetch origin main
git reset --hard origin/main
log "Código actualizado al commit: $(git rev-parse --short HEAD)"

# 3. Construir nuevas imágenes
log "Construyendo imágenes Docker..."
$COMPOSE_CMD build

# 4. Levantar servicios (sin downtime para postgres y redis)
log "Iniciando servicios..."
$COMPOSE_CMD up -d --remove-orphans

# 5. Esperar a que el backend esté saludable
log "Esperando a que el backend esté disponible..."
MAX_WAIT=120
WAITED=0
until $COMPOSE_CMD exec -T backend curl -sf http://localhost:3001/health > /dev/null 2>&1; do
  if [ $WAITED -ge $MAX_WAIT ]; then
    log "ERROR: Backend no respondió después de ${MAX_WAIT}s"
    $COMPOSE_CMD logs backend --tail=50
    exit 1
  fi
  sleep 5
  WAITED=$((WAITED + 5))
  log "Esperando... (${WAITED}s)"
done

# 6. Ejecutar migraciones de base de datos
log "Ejecutando migraciones de base de datos..."
$COMPOSE_CMD exec -T backend npm run migrate:up
log "Migraciones aplicadas exitosamente"

# 7. Verificar estado final
log "Estado de los contenedores:"
$COMPOSE_CMD ps

log "=========================================="
log "Despliegue completado exitosamente"
log "URL: https://app.habilitapro.com"
log "=========================================="
