#!/usr/bin/env bash
# ssl-setup.sh — Provisiona certificados TLS 1.3 con Let's Encrypt (certbot)
# Ejecutar UNA VEZ en el VPS después del primer deploy
#
# Uso:
#   DOMAIN=norma3100.tuempresa.com EMAIL=admin@tuempresa.com ./scripts/ssl-setup.sh
#
# Requisitos previos en el VPS:
#   1. Docker y Docker Compose instalados
#   2. Stack corriendo: docker compose -f docker-compose.prod.yml up -d nginx
#   3. DNS del dominio apuntando al IP del VPS
#   4. Puertos 80 y 443 abiertos en el firewall

set -euo pipefail

DOMAIN="${DOMAIN:-}"
EMAIL="${EMAIL:-}"
WEBROOT_PATH="/var/www/certbot"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

# ── Validaciones ───────────────────────────────────────────────────────────────
if [[ -z "$DOMAIN" ]]; then
  echo "ERROR: Variable DOMAIN requerida." >&2
  echo "  Uso: DOMAIN=tudominio.com EMAIL=admin@tudominio.com $0" >&2
  exit 1
fi

if [[ -z "$EMAIL" ]]; then
  echo "ERROR: Variable EMAIL requerida para alertas de renovación de Let's Encrypt." >&2
  exit 1
fi

if ! command -v certbot &>/dev/null; then
  echo "ERROR: certbot no encontrado. Instálalo con:" >&2
  echo "  apt update && apt install -y certbot" >&2
  exit 1
fi

echo "=== Configurando TLS 1.3 para: $DOMAIN ==="

# ── Crear directorio ACME challenge ───────────────────────────────────────────
mkdir -p "$WEBROOT_PATH"

# ── Verificar que el dominio resuelve a este servidor ─────────────────────────
echo "[1/4] Verificando resolución DNS de $DOMAIN..."
SERVER_IP=$(curl -sf https://api.ipify.org 2>/dev/null || echo "unknown")
DOMAIN_IP=$(dig +short "$DOMAIN" 2>/dev/null || echo "unknown")

if [[ "$SERVER_IP" != "$DOMAIN_IP" ]]; then
  echo "ADVERTENCIA: $DOMAIN resuelve a $DOMAIN_IP pero el servidor es $SERVER_IP"
  echo "  El DNS puede tardar hasta 48h en propagarse."
  read -r -p "  ¿Continuar de todos modos? [y/N] " answer
  [[ "$answer" =~ ^[Yy]$ ]] || exit 1
fi

# ── Obtener certificado con Webroot ───────────────────────────────────────────
echo "[2/4] Obteniendo certificado para $DOMAIN y www.$DOMAIN..."
certbot certonly \
  --webroot \
  --webroot-path="$WEBROOT_PATH" \
  --agree-tos \
  --non-interactive \
  --email "$EMAIL" \
  -d "$DOMAIN" \
  -d "www.$DOMAIN" \
  --rsa-key-size 4096

echo "[3/4] Certificado emitido exitosamente."
echo "  Ruta: /etc/letsencrypt/live/$DOMAIN/"
ls -la "/etc/letsencrypt/live/$DOMAIN/"

# ── Actualizar nginx.prod.conf con el dominio real ────────────────────────────
echo "[4/4] Actualizando configuración de Nginx con $DOMAIN..."
NGINX_CONF="$(dirname "$(realpath "$0")")/../config/nginx/nginx.prod.conf"
if [[ -f "$NGINX_CONF" ]]; then
  sed -i "s/TU_DOMINIO/$DOMAIN/g" "$NGINX_CONF"
  echo "  nginx.prod.conf actualizado."
fi

# ── Recargar Nginx ────────────────────────────────────────────────────────────
docker compose -f "$COMPOSE_FILE" exec nginx nginx -s reload
echo "  Nginx recargado con nuevo certificado."

# ── Configurar renovación automática (cron) ───────────────────────────────────
CRON_CMD="0 3 * * * certbot renew --quiet --webroot --webroot-path=$WEBROOT_PATH && docker compose -f /opt/norma3100/$COMPOSE_FILE exec nginx nginx -s reload"

if ! (crontab -l 2>/dev/null | grep -q "certbot renew"); then
  (crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -
  echo "  Cron de renovación automática configurado (diario 03:00 UTC)."
else
  echo "  Cron de renovación ya existe — no modificado."
fi

# ── Verificar TLS ─────────────────────────────────────────────────────────────
echo ""
echo "=== Verificación TLS ==="
echo "  Prueba manual con: curl -vI https://$DOMAIN/health"
echo "  Score SSL Labs:    https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
echo ""
echo "=== Configuración completada ==="
echo "  Dominio:      $DOMAIN"
echo "  Certificado:  /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
echo "  Renovación:   automática (certbot renew, cron diario)"
echo "  TLS mínimo:   1.3 (configurado en nginx.prod.conf)"
