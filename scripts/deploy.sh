#!/bin/bash
# deploy.sh — Script de despliegue para app.habilitapro.com

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

# Diagnóstico inicial — visible en GitHub Actions log
log "--- ESTADO INICIAL DEL VPS ---"
log "Espacio en disco: $(df -h / | tail -1)"
log "Memoria disponible: $(free -h | grep Mem | awk '{print $4}') libres"
log "Imágenes Docker: $(docker images --format 'table {{.Repository}}:{{.Tag}}\t{{.Size}}' 2>/dev/null | head -10)"
log "Uso Docker: $(docker system df 2>/dev/null | tail -5)"

# 1. Verificar que existe el archivo de variables de entorno
if [ ! -f "$APP_DIR/.env.production" ]; then
  log "ERROR: No existe $APP_DIR/.env.production"
  exit 1
fi

cd "$APP_DIR"

log "Commit en VPS: $(git rev-parse --short HEAD)"

# 2. Limpiar caché de build y imágenes antiguas para liberar espacio
log "Liberando espacio en disco antes del build..."
docker image prune -af || true
docker builder prune -af || true
log "Espacio disponible tras limpieza: $(df -h / | tail -1 | awk '{print $4}')"

# 4. Construir nuevas imágenes
log "Construyendo imágenes Docker..."
$COMPOSE_CMD build 2>&1 | tee -a "$LOG_FILE"
log "Build completado"

# 5. Levantar servicios (sin downtime para postgres y redis)
log "Iniciando servicios..."
$COMPOSE_CMD up -d --remove-orphans

# 6. Esperar a que el backend esté saludable
log "Esperando a que el backend esté disponible..."
MAX_WAIT=300
WAITED=0
until $COMPOSE_CMD exec -T backend curl -sf http://localhost:3001/health > /dev/null 2>&1; do
  if [ $WAITED -ge $MAX_WAIT ]; then
    log "ERROR: Backend no respondió después de ${MAX_WAIT}s"
    $COMPOSE_CMD logs backend --tail=50
    exit 1
  fi
  sleep 10
  WAITED=$((WAITED + 10))
  log "Esperando backend... (${WAITED}s / ${MAX_WAIT}s)"
done
log "Backend saludable"

# 7. Ejecutar migraciones de base de datos
log "Ejecutando migraciones..."
$COMPOSE_CMD exec -T backend npm run migrate:up
log "Migraciones aplicadas exitosamente"

# 8. Verificar estado final
log "Estado de los contenedores:"
$COMPOSE_CMD ps

log "=========================================="
log "Despliegue completado exitosamente"
log "URL: https://app.habilitapro.com"
log "=========================================="
