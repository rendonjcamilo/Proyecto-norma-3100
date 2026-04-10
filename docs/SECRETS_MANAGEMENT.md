# Secrets Management Guide

Guidelines for managing sensitive information in Norma 3100.

## Core Principles

1. **Never commit secrets to git** - All credentials in .gitignore
2. **Principle of least privilege** - Grant minimum required permissions
3. **Separate by environment** - Different secrets for dev, test, prod
4. **Rotate regularly** - Change secrets on a schedule
5. **Audit access** - Log who accesses what secrets
6. **Encrypt in transit & at rest** - TLS 1.3 + AES-256

## Secret Types

### Database Credentials

```bash
DB_HOST=prod-db.norma3100.com
DB_PORT=5432
DB_NAME=norma3100
DB_USER=app_user
DB_PASSWORD=<random-32-char-password>
```

**Generation:**
```bash
# Generate secure database password
openssl rand -base64 32
```

**Rotation:**
- Change every 90 days
- Update in all environments
- Test connection before deploying
- Keep old password for 24h as fallback

### JWT Secrets

```bash
JWT_SECRET=<min-32-char-random-string>
JWT_REFRESH_SECRET=<min-32-char-random-string>
```

**Generation:**
```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Rotation Strategy:**
- Use key versioning (current + previous key)
- Accept tokens signed with both keys
- Retire old key after 24 hours
- Prevent reading old refresh tokens

### API Keys

```bash
REPS_API_KEY=<32-char-api-key>
INVIMA_API_KEY=<32-char-api-key>
SMTP_PASSWORD=<email-password>
```

**Management:**
- Store in secrets manager
- Rotate every 6 months or if compromised
- Use service-specific keys (not shared)
- Enable request signing if API supports

### Session Secrets

```bash
SESSION_SECRET=<random-string>
BCRYPT_ROUNDS=12  # Higher = slower but more secure
```

---

## Development Environment

### Local Machine

**Setup .env file (not committed):**

```bash
cp backend/.env.example backend/.env
# Edit with your values
```

**Safe development secrets:**
```bash
NODE_ENV=development
DB_PASSWORD=postgres_dev_password    # Simple for local dev
JWT_SECRET=dev_jwt_secret_change_me
BCRYPT_ROUNDS=8                      # Lower for faster dev
```

### Docker Development

Secrets passed via docker-compose.yml:

```yaml
services:
  backend:
    environment:
      - DB_PASSWORD=${DB_PASSWORD}    # From .env
      - JWT_SECRET=${JWT_SECRET}
```

**Local override:**
```bash
# .env.local (not committed)
DB_PASSWORD=my_local_password
JWT_SECRET=my_local_secret
```

---

## Test Environment

### Test Database

Separate from production:

```bash
NODE_ENV=test
DB_NAME=norma3100_test
DB_PASSWORD=test_password
REDIS_DB=1                           # Different Redis DB
```

### Test Secrets

Use simple, known values (only in CI/CD):

```bash
JWT_SECRET=test_jwt_secret_12345678901234567
BCRYPT_ROUNDS=4                      # Fast for tests
```

### CI/CD Secrets

Use GitHub Secrets for actions:

```yaml
# .github/workflows/test.yml
env:
  DB_HOST: localhost
  DB_NAME: norma3100_test
  DB_PASSWORD: ${{ secrets.TEST_DB_PASSWORD }}
  REDIS_URL: redis://localhost:6379/1
```

---

## Production Environment

### Secrets Management System

Use a dedicated secrets manager:

#### Option 1: AWS Secrets Manager

```bash
# Store secret
aws secretsmanager create-secret \
  --name norma3100/prod/db \
  --secret-string '{"host":"db.example.com","password":"xyz"}'

# Retrieve secret
aws secretsmanager get-secret-value \
  --secret-id norma3100/prod/db
```

#### Option 2: HashiCorp Vault

```bash
# Store secret
vault kv put secret/norma3100/prod/db \
  password=xyz \
  username=app_user

# Retrieve secret
vault kv get secret/norma3100/prod/db
```

#### Option 3: Azure Key Vault

```bash
# Store secret
az keyvault secret set \
  --vault-name Norma3100 \
  --name db-password \
  --value xyz

# Retrieve secret
az keyvault secret show \
  --vault-name Norma3100 \
  --name db-password
```

### Production Secrets

Example production .env structure:

```bash
# Source from secrets manager at startup
NODE_ENV=production
LOG_LEVEL=warn

# Database (from Vault)
DB_HOST=${DB_HOST}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_SSL=true

# JWT (from Vault, rotated monthly)
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}

# Encryption (at-rest)
ENCRYPTION_KEY=${ENCRYPTION_KEY}    # 32-byte key

# External APIs (from Vault)
REPS_API_KEY=${REPS_API_KEY}
INVIMA_API_KEY=${INVIMA_API_KEY}

# Rate limiting (strict for production)
RATE_LIMIT_MAX_REQUESTS=50
BCRYPT_ROUNDS=12
```

### Environment-Specific Policies

**Production Database User:**
```sql
-- Limited to required tables
GRANT CONNECT ON DATABASE norma3100 TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- No DELETE, DROP, ALTER (immutable audit trail)
REVOKE DELETE, DROP, ALTER ON ALL TABLES FROM app_user;
```

---

## Secret Rotation

### Rotation Schedule

| Secret | Frequency | Procedure |
|--------|-----------|-----------|
| DB Password | 90 days | Update in Vault → restart service |
| JWT Secret | 30 days | Dual-key rotation → retire old |
| API Keys | 180 days | Generate new in provider console |
| Certificates | 365 days | Pre-plan renewal |

### Rotation Procedure

1. **Generate new secret** (offline, secure environment)
2. **Update in secrets manager** (Vault, AWS Secrets Manager, etc.)
3. **Deploy with new secret** (rolling deployment, no downtime)
4. **Keep old secret for 24h** (for token grace period)
5. **Retire old secret** (remove from Vault)
6. **Document rotation** (audit log entry)

### JWT Secret Rotation Example

```javascript
// During rotation period, accept both old and new secrets
const verifyJWT = (token) => {
  const currentSecret = process.env.JWT_SECRET;
  const previousSecret = process.env.JWT_SECRET_PREVIOUS; // 24h grace

  try {
    return jwt.verify(token, currentSecret);
  } catch (err) {
    if (previousSecret) {
      try {
        return jwt.verify(token, previousSecret);
      } catch (_) {
        throw err;
      }
    }
    throw err;
  }
};
```

---

## Incident Response

### Secrets Compromised

**Immediate Actions:**
1. Revoke the secret immediately
2. Generate new secret
3. Rotate in all systems
4. Audit access logs for abuse
5. Notify affected users if necessary
6. Document incident

```bash
# Example: Revoke API key
curl -X POST https://api.reps.gov.co/keys/revoke \
  -H "Authorization: Bearer ${ADMIN_KEY}" \
  -d '{"key_id":"compromised_key"}'

# Generate new key
curl -X POST https://api.reps.gov.co/keys/create \
  -H "Authorization: Bearer ${ADMIN_KEY}" \
  -d '{"app_id":"norma3100"}'
```

### Commit History Cleanup

If secret accidentally committed:

```bash
# Remove from history (careful!)
git filter-branch --tree-filter 'rm -f .env' HEAD

# Force push (only if no one has pulled)
git push --force

# Alternative: use git-secrets or BFG
bfg --delete-files .env
```

---

## Access Control

### Who Can Access Secrets?

| Role | Dev Secrets | Test Secrets | Prod Secrets |
|------|-----------|-----------|------------|
| Developer | Own .env | Yes (CI/CD) | No |
| DevOps | All | All | Yes (Vault admin) |
| Backend Engineer | Own | Yes | Limited (specific keys) |
| System Admin | Yes | Yes | Yes |

### Audit Logging

Log all secret access:

```bash
# Vault audit logs
vault audit enable file file_path=/var/log/vault-audit.log

# AWS Secrets Manager logs (CloudTrail)
aws cloudtrail create-trail --name norma3100-audit --s3-bucket-name audit-bucket

# Application logging
logger.info({
  action: 'secret_accessed',
  secret_name: 'DB_PASSWORD',
  user: 'app_user',
  timestamp: new Date(),
  approved: true
});
```

---

## Tools & Libraries

### Secret Scanning

**Pre-commit hooks:**
```bash
# Install git-secrets
brew install git-secrets
git secrets --install
git secrets --register-aws

# Scan before commit
git secrets --scan
```

**CI/CD scanning:**
```yaml
# GitHub Actions
- name: Scan for secrets
  uses: gitleaks/gitleaks-action@v2
```

### Secret Managers

| Tool | Use Case | Cost |
|------|----------|------|
| **1Password** | Team-wide | $$$$ |
| **AWS Secrets Manager** | AWS-based | $$ |
| **HashiCorp Vault** | Enterprise | $ or $$$ |
| **Azure Key Vault** | Azure-based | $$ |
| **.env + git-crypt** | Small team | Free |

### Implementation

**Current recommendation for Phase 1:**
- Development: .env files (not committed)
- CI/CD: GitHub Secrets
- Production (Phase 6): Vault or AWS Secrets Manager

---

## Compliance & Audit

### Requirements

- All production secrets encrypted at rest
- All secret access logged and auditable
- Secret rotation documented
- Incident response procedure defined
- Access control enforced
- No plain-text secrets in code

### Audit Checklist

- [ ] No .env files in git history
- [ ] All env vars documented in ENV_VARIABLES.md
- [ ] Secret rotation schedule defined
- [ ] Access logs configured
- [ ] Incident response procedure ready
- [ ] Team training completed

---

## References

- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [HashiCorp Vault Documentation](https://www.vaultproject.io/docs)
- [AWS Secrets Manager Guide](https://docs.aws.amazon.com/secretsmanager/)
- [Secure Coding Guidelines](https://github.com/goldbergyoni/nodebestpractices)

---

**Last Updated:** 2026-04-10  
**Status:** Effective for Phase 1  
**Next Review:** Phase 2 (Production Setup)
