# /etc/nginx/sites-available/app.habilitapro.com
# Reverse proxy para HabilitaPro — app.habilitapro.com
#
# Instalar:
#   cp /opt/norma3100/config/nginx/app.habilitapro.com /etc/nginx/sites-available/app.habilitapro.com
#   ln -s /etc/nginx/sites-available/app.habilitapro.com /etc/nginx/sites-enabled/
#   nginx -t && systemctl reload nginx
#   certbot --nginx -d app.habilitapro.com

# Zona de rate limiting para autenticación (complementa el rate limit de Express)
limit_req_zone $binary_remote_addr zone=habilitapro_auth:10m rate=5r/m;

# ── HTTP: redirigir todo a HTTPS ───────────────────────────────────────────────
server {
    listen 80;
    listen [::]:80;
    server_name app.habilitapro.com;

    # Permitir desafíos ACME de Certbot
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# ── HTTPS ──────────────────────────────────────────────────────────────────────
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name app.habilitapro.com;

    # Certificados Let's Encrypt (Certbot los gestiona)
    ssl_certificate     /etc/letsencrypt/live/app.habilitapro.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.habilitapro.com/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    # ── Headers de seguridad ───────────────────────────────────────────────────
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # ── Proxy → Backend API ────────────────────────────────────────────────────
    location /api {
        proxy_pass         http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
        client_max_body_size 55m;
    }

    # ── Proxy → Auth (rate limit estricto) ────────────────────────────────────
    location /auth {
        proxy_pass         http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
        limit_req zone=habilitapro_auth burst=10 nodelay;
    }

    # ── Health check (sin logs para no contaminar) ─────────────────────────────
    location /health {
        proxy_pass http://127.0.0.1:3001;
        access_log off;
    }

    # ── Frontend React SPA ─────────────────────────────────────────────────────
    location / {
        proxy_pass         http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }

    # Caché de assets estáticos del frontend
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://127.0.0.1:5173;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Bloquear acceso a Swagger en producción si se desea
    # location /api/docs {
    #     deny all;
    #     return 403;
    # }
}
