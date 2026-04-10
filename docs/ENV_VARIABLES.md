# Environment Variables Documentation

Complete reference for all environment variables used in Norma 3100.

## Backend Environment Variables

### Server Configuration

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `NODE_ENV` | string | Yes | development | Execution environment (development, test, production) |
| `PORT` | number | No | 3001 | HTTP server port |
| `HOST` | string | No | localhost | Server host binding |
| `LOG_LEVEL` | string | No | info | Logging level (debug, info, warn, error) |

### Database Configuration

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `DB_HOST` | string | Yes | localhost | PostgreSQL hostname |
| `DB_PORT` | number | No | 5432 | PostgreSQL port |
| `DB_NAME` | string | Yes | norma3100 | Database name |
| `DB_USER` | string | Yes | postgres | Database user |
| `DB_PASSWORD` | string | Yes | - | Database password (change in production!) |
| `DB_POOL_MIN` | number | No | 5 | Minimum connection pool size |
| `DB_POOL_MAX` | number | No | 20 | Maximum connection pool size |
| `DB_SSL` | boolean | No | false | Enable SSL for database connection |

### Redis Configuration

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `REDIS_URL` | string | Yes | redis://localhost:6379 | Redis connection URL |
| `REDIS_PASSWORD` | string | No | - | Redis password if protected |
| `REDIS_DB` | number | No | 0 | Redis database number |
| `REDIS_POOL_SIZE` | number | No | 10 | Connection pool size |

### Authentication & Security

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `JWT_SECRET` | string | Yes | - | JWT signing secret (min 32 chars in prod) |
| `JWT_EXPIRATION` | string | No | 24h | JWT token expiration (e.g., "7d", "24h") |
| `JWT_REFRESH_SECRET` | string | Yes | - | JWT refresh token secret |
| `JWT_REFRESH_EXPIRATION` | string | No | 7d | Refresh token expiration |
| `BCRYPT_ROUNDS` | number | No | 10 | Bcrypt hashing rounds (10-12 recommended) |
| `SESSION_SECRET` | string | Yes | - | Session encryption secret |
| `SESSION_TTL` | number | No | 86400 | Session TTL in seconds (24h default) |

### CORS & Network

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `CORS_ORIGIN` | string | No | http://localhost:5173 | Allowed CORS origin(s) |
| `CORS_CREDENTIALS` | boolean | No | true | Allow credentials in CORS |
| `RATE_LIMIT_WINDOW` | number | No | 900 | Rate limit window in seconds |
| `RATE_LIMIT_MAX_REQUESTS` | number | No | 100 | Max requests per window |

### External APIs

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `REPS_API_BASE_URL` | string | No | https://api.reps.gov.co | REPS API base URL |
| `REPS_API_KEY` | string | No | - | REPS API authentication key |
| `REPS_API_TIMEOUT` | number | No | 30000 | REPS API timeout in milliseconds |
| `INVIMA_API_BASE_URL` | string | No | https://api.invima.gov.co | INVIMA API base URL |
| `INVIMA_API_KEY` | string | No | - | INVIMA API authentication key |

### Email Configuration (Optional)

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `SMTP_HOST` | string | No | - | SMTP server host |
| `SMTP_PORT` | number | No | 587 | SMTP server port |
| `SMTP_USER` | string | No | - | SMTP username |
| `SMTP_PASSWORD` | string | No | - | SMTP password |
| `SMTP_FROM` | string | No | noreply@norma3100.com | Default from email address |
| `SMTP_TLS` | boolean | No | true | Use TLS for SMTP |

### Feature Flags

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `ENABLE_MFA` | boolean | No | false | Enable multi-factor authentication |
| `ENABLE_EXTERNAL_SYNC` | boolean | No | false | Enable external API synchronization |
| `ENABLE_AUDIT_TRAIL` | boolean | No | true | Enable immutable audit trail logging |
| `ENABLE_EMAIL_NOTIFICATIONS` | boolean | No | false | Enable email notifications |

---

## Frontend Environment Variables

### API Configuration

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `VITE_API_URL` | string | Yes | http://localhost:3001/api | Backend API URL |
| `VITE_API_TIMEOUT` | number | No | 30000 | API request timeout in milliseconds |
| `VITE_RETRY_ATTEMPTS` | number | No | 3 | Number of retry attempts for failed requests |

### Application Configuration

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `VITE_ENV` | string | No | development | Environment name (development, staging, production) |
| `VITE_APP_TITLE` | string | No | Norma 3100 | Application title |
| `VITE_APP_VERSION` | string | No | 1.0.0 | Application version |
| `VITE_LOG_LEVEL` | string | No | info | Logging level |

### Feature Flags

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `VITE_ENABLE_ANALYTICS` | boolean | No | false | Enable usage analytics |
| `VITE_ENABLE_ERROR_TRACKING` | boolean | No | false | Enable error tracking (Sentry, etc.) |
| `VITE_ENABLE_MOCK_API` | boolean | No | false | Use mock API instead of real backend |

---

## Docker Environment Variables

Variables used in docker-compose.yml:

```yaml
# Backend service
- NODE_ENV=development
- DB_HOST=postgres
- DB_PASSWORD=postgres_dev_password
- REDIS_URL=redis://redis:6379

# PostgreSQL service
- POSTGRES_DB=norma3100
- POSTGRES_USER=postgres
- POSTGRES_PASSWORD=postgres_dev_password

# Redis service
# (No special env vars, uses redis.conf file)
```

---

## Development vs Production

### Development (.env.development)

```bash
NODE_ENV=development
DB_HOST=localhost
DB_PASSWORD=postgres_dev_password
JWT_SECRET=dev_jwt_secret_change_me
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:5173
```

### Production (.env.production)

```bash
NODE_ENV=production
DB_HOST=prod-db.example.com
DB_PASSWORD=<strong-password-from-vault>
DB_SSL=true
JWT_SECRET=<min-32-char-from-vault>
LOG_LEVEL=warn
CORS_ORIGIN=https://app.norma3100.com
BCRYPT_ROUNDS=12
RATE_LIMIT_MAX_REQUESTS=50
```

### Test (.env.test)

```bash
NODE_ENV=test
DB_HOST=localhost
DB_NAME=norma3100_test
DB_PASSWORD=test_password
REDIS_URL=redis://localhost:6379/1
JWT_SECRET=test_jwt_secret
LOG_LEVEL=error
```

---

## How to Set Environment Variables

### Option 1: .env File (Development)

```bash
cp .env.example .env
# Edit .env with your values
npm run dev
```

### Option 2: System Environment

```bash
export DB_HOST=localhost
export DB_PASSWORD=mypassword
npm run dev
```

### Option 3: Docker Compose

Environment variables in docker-compose.yml:

```yaml
services:
  backend:
    environment:
      - NODE_ENV=development
      - DB_HOST=postgres
      - DB_PASSWORD=postgres_dev_password
```

### Option 4: Secrets Management (Production)

Use environment variable management systems:
- **AWS Secrets Manager**
- **HashiCorp Vault**
- **Azure Key Vault**
- **GitHub Secrets** (for CI/CD)

```bash
# Example: AWS Secrets Manager
aws secretsmanager get-secret-value --secret-id norma3100/prod
```

---

## Validation & Defaults

### Startup Validation

The application validates required environment variables on startup and fails fast if missing:

```
✓ Required variables present
✓ DB connection successful
✓ Redis connection successful
✓ Configuration validated
✓ Server starting on port 3001
```

### Default Values

If an optional variable is not set, the application uses the default value specified in the variable list above.

---

## Security Best Practices

### 1. Never Commit Secrets

```bash
# ✓ Good - .env is in .gitignore
# ✗ Bad - Don't commit .env files
```

### 2. Use .env.example

Template file for developers:

```bash
# .env.example (safe to commit)
DB_HOST=localhost
DB_PASSWORD=CHANGE_ME_IN_DEVELOPMENT
JWT_SECRET=CHANGE_ME_IN_PRODUCTION
```

### 3. Rotate Secrets Regularly

```bash
# Example: JWT secret rotation
# 1. Generate new secret
NEW_SECRET=$(openssl rand -hex 32)

# 2. Update environment
export JWT_SECRET=$NEW_SECRET

# 3. Restart application
```

### 4. Use Minimum Permissions

Grant only required permissions:
- Database user: SELECT, INSERT, UPDATE (no DROP)
- API keys: Limited to specific endpoints

### 5. Monitor Access

Log and audit all configuration changes:
- Who changed what
- When the change occurred
- Approval trail

---

## Troubleshooting

### "Cannot find module" errors

Check `NODE_ENV` is set:
```bash
export NODE_ENV=development
npm run dev
```

### Database connection refused

Verify environment variables:
```bash
echo "Host: $DB_HOST"
echo "Port: $DB_PORT"
echo "Database: $DB_NAME"

# Test connection
psql -h $DB_HOST -U $DB_USER -d $DB_NAME
```

### Redis connection timeout

Check Redis URL format:
```bash
# Correct: redis://host:port/db
# Wrong: redis:host:port

# Test Redis
redis-cli -u $REDIS_URL PING
```

### JWT validation fails

Ensure `JWT_SECRET` is consistent:
```bash
# Same secret must be used for signing and verification
# Don't accidentally rotate mid-session
```

---

## References

- [Node.js dotenv documentation](https://github.com/motdotla/dotenv)
- [Vite environment variables](https://vitejs.dev/guide/env-and-mode.html)
- [OWASP secrets management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

---

**Last Updated:** 2026-04-10
