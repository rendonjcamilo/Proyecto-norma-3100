# Phase 2: Authentication & User Management

**Project:** Norma 3100 Compliance Management System  
**Phase:** 2 (Auth & RBAC)  
**Timeline:** Weeks 3-4  
**Total Effort:** 35 hours  
**Team Size:** 2 engineers (1 backend, 1 frontend) - parallelizable  
**Status:** PLANNED

---

## Phase Goal

Implement secure authentication, JWT token lifecycle management, bcrypt password hashing, role-based access control (RBAC), and user management capabilities. Deliver production-ready auth backend (API endpoints) and user-facing UI for login, registration, password recovery, and user administration. Enable fine-grained permission checks on all compliance workflows.

**Alignment to ROADMAP.md:**
- Phase 2.1: JWT Auth & RBAC Backend
- Phase 2.2: User Management UI

**Dependencies:** Phase 1 COMPLETE (Docker, DB schema, Redis functional)

---

## Success Criteria

### Backend Authentication

1. **JWT Token Lifecycle**
   - Access tokens issue with HS256 algorithm, 1-hour expiry, verified in <10ms
   - Refresh tokens issue with 14-day expiry, single-use, rotating (new token returned on refresh)
   - Token validation middleware enforces expiry, signature verification, and blacklist checks
   - Revoked tokens immediately rejected; expired tokens return 401 Unauthorized
   - Token claims include: user_id, role, provider_id, iat (issued-at), exp (expiration), jti (JWT ID for revocation)

2. **Bcrypt Password Hashing**
   - Passwords hashed with bcrypt cost factor 13, producing 250-500ms hash time
   - Password validation uses timing-safe comparison (no timing-attack vulnerabilities)
   - Password complexity enforced: min 12 chars, at least 1 uppercase, 1 lowercase, 1 number, 1 special char
   - Password history prevents reuse of last 5 passwords
   - No plaintext passwords logged or exposed in error messages

3. **Email Password Recovery**
   - Reset tokens generated with 64+ character cryptographically random string (non-PII)
   - Reset tokens expire after 1 hour; tokens are single-use (invalidated after reset)
   - Reset token hash (SHA-256) stored in DB; plain token only in email
   - Reset email sent via nodemailer (SMTP configured, e.g., Gmail/SendGrid)
   - Account enumeration prevented: same response time for existent/non-existent accounts

4. **RBAC Enforcement**
   - Three roles implemented: provider_admin, auditor, super_admin
   - Roles mapped to permissions (provider_admin: manage provider data; auditor: read findings, approve actions; super_admin: all)
   - Permission checks enforced on all protected endpoints via middleware
   - Role-based resource filtering: provider_admin sees only own provider data; auditor sees assigned findings; super_admin sees all
   - Permission cache in Redis with 1-hour TTL; cache hit rate >95%
   - Audit log tracks all role/permission changes with user_id, timestamp, change details

5. **Session Management**
   - Sessions stored in Redis with 24-hour TTL
   - Session data includes: user_id, role, provider_id, login_ip, user_agent (for security audit)
   - Concurrent session limit enforced: max 3 active sessions per user (older sessions invalidated)
   - Logout endpoint revokes all user tokens and Redis sessions
   - Session refresh on each API call (sliding window expiry)

### Frontend User Management

1. **Login & Registration**
   - Login form validates email/password client-side and server-side
   - Registration form enforces password policy, email validation, captures provider assignment
   - Error messages clear, don't reveal account existence
   - <2s login latency (API response + UI render)
   - Remember-me checkbox persists non-sensitive session identifier (encrypted, not tokens)

2. **Password Reset Flow**
   - User enters email → backend sends reset link (24-hour validity)
   - Reset link opens form with new password + confirmation
   - Form validates password policy before submit
   - Success/error feedback clear; user redirected to login post-reset
   - No plaintext tokens exposed in URL (hashed, sent in email body)

3. **User Administration Dashboard**
   - User list: searchable, filterable by role/provider/status
   - User creation: email, role assignment, provider association, bulk import (CSV)
   - User edit: modify role, deactivate, reset password (send reset email)
   - User delete (soft delete with archive option for audit trail)
   - Bulk import: CSV → progress tracking, error log, validation report
   - Audit log: all user modifications tracked with admin_id, timestamp, before/after values

---

## Task Breakdown (8 tasks, 35 hours total)


### Task 1: JWT Token Strategy & Generation (6 hours)
**Traceability:** ROADMAP.md P2.1.1

**Description:** Implement JWT token generation, validation, refresh mechanisms with access + refresh token rotation strategy. Configure token expiry (1h access, 14d refresh), HS256 signing.

**Dependencies:** None

**Verification:**
- POST /auth/login returns access_token (1h expiry) + refresh_token (14d expiry)
- POST /auth/refresh with valid refresh token → new access + refresh tokens issued, old refresh invalidated
- Expired access token rejected with 401
- Token validation latency <10ms

**Effort:** 6 hours | **Owner:** Backend Engineer

---

### Task 2: Bcrypt Password Hashing & Validation (5 hours)
**Traceability:** ROADMAP.md P2.1.2

**Description:** Implement bcrypt password hashing with cost factor 13, password complexity validation, password history tracking, timing-safe comparison.

**Dependencies:** Task 1

**Verification:**
- bcrypt.hash with cost=13 produces 250-500ms hash time
- bcrypt.compare returns true for correct password
- Weak password rejected: "pass" → validation error
- Password reuse blocked: cannot reuse same password within last 5 changes

**Effort:** 5 hours | **Owner:** Backend Engineer

---

### Task 3: User Registration Endpoint & Validation (5 hours)
**Traceability:** ROADMAP.md P2.1.2

**Description:** Implement POST /auth/register endpoint with email validation, password policy, user creation, and audit logging.

**Dependencies:** Task 2

**Verification:**
- POST /auth/register with valid data → 201 Created
- Duplicate email → 409 Conflict
- Weak password → 400 Bad Request
- Welcome email sent to new user

**Effort:** 5 hours | **Owner:** Backend Engineer

---

### Task 4: Login Endpoint & Session Creation (5 hours)
**Traceability:** ROADMAP.md P2.1.2

**Description:** Implement POST /auth/login with password validation, session creation in Redis, JWT issuance, brute-force protection.

**Dependencies:** Task 3

**Verification:**
- POST /auth/login with correct credentials → 200 OK with tokens
- Incorrect password → 401 Unauthorized
- Account locked after 5 failures → 429 Too Many Requests
- Login latency <200ms

**Effort:** 5 hours | **Owner:** Backend Engineer

---

### Task 5: Email Password Recovery & Reset (4 hours)
**Traceability:** ROADMAP.md P2.1.2

**Description:** Implement POST /auth/forgot-password and POST /auth/reset-password endpoints with secure token generation, email delivery, single-use tokens, 1-hour expiry.

**Dependencies:** Task 4

**Verification:**
- POST /auth/forgot-password → reset email sent with token link
- Token expires after 1 hour
- Token single-use: second reset attempt with same token → 401 Already Used
- User can login with new password after reset

**Effort:** 4 hours | **Owner:** Backend Engineer

---

### Task 6: RBAC Middleware & Permission Enforcement (6 hours)
**Traceability:** ROADMAP.md P2.1.3

**Description:** Implement role-based access control with three roles (provider_admin, auditor, super_admin), permission matrix, middleware enforcement, Redis caching.

**Dependencies:** Task 4

**Verification:**
- GET /api/providers/<other_provider_id> as provider_admin → 403 Forbidden
- GET /api/providers/<own_provider_id> as provider_admin → 200 OK
- Permission cache hit rate >95%
- Audit log captures all permission checks

**Effort:** 6 hours | **Owner:** Backend Engineer

---

### Task 7: Login & Register Frontend UI (8 hours)
**Traceability:** ROADMAP.md P2.2.1

**Description:** Build React login/register pages with form validation, error handling, password reset flow. Integrate with backend /auth endpoints.

**Dependencies:** Task 5

**Verification:**
- Login form: valid credentials → redirect to dashboard
- Login form: invalid credentials → error message
- Register form: weak password → validation error with policy details
- Password reset: token link → new password form → success redirect
- Token security: refresh_token in HttpOnly cookie (JS-inaccessible)

**Effort:** 8 hours | **Owner:** Frontend Engineer

---

### Task 8: User Administration Dashboard (6 hours)
**Traceability:** ROADMAP.md P2.2.2

**Description:** Build React admin dashboard for user management: CRUD, role assignment, bulk import CSV, audit trail.

**Dependencies:** Task 6

**Verification:**
- Super admin sees all users; provider_admin sees only own provider
- Bulk import: 100 users <500ms, duplicates skipped
- User edit changes logged with before/after values
- Permission enforcement: provider_admin cannot assign super_admin

**Effort:** 6 hours | **Owner:** Frontend Engineer

---

## Effort Summary

| Task | Hours | Owner |
|------|-------|-------|
| P2.T1: JWT Token Strategy | 6 | Backend |
| P2.T2: Bcrypt Password Hashing | 5 | Backend |
| P2.T3: User Registration | 5 | Backend |
| P2.T4: Login & Sessions | 5 | Backend |
| P2.T5: Password Recovery | 4 | Backend |
| P2.T6: RBAC Middleware | 6 | Backend |
| P2.T7: Login/Register UI | 8 | Frontend |
| P2.T8: User Admin Dashboard | 6 | Frontend |
| **Total** | **35** | 2 engineers |

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-----------|
| Token expiry race conditions | Medium | Medium | Implement token refresh queue; retry on 401 with fresh token |
| Email delivery failure | Medium | High | Use SendGrid/AWS SES; fallback SMTP; test in dev |
| Session race conditions | Low | High | Atomic Redis ops; use jti for token family tracking |
| Bcrypt cost too low | Low | High | Validate cost=13 → 250-500ms; measure on prod hardware |
| RBAC cache miss | Low | Medium | Cache fallback to DB; cache warming on role updates |
| Password reset token guessing | Very Low | High | crypto.randomBytes 64-char; rate-limit 1 per 5 min |
| Account enumeration | Medium | Low | Identical response time/messages for existent/non-existent |

---

## Dependencies & Prerequisites

**Must Complete First:** Phase 1 (Docker, PostgreSQL schema, Redis running)

**External Services:** Email provider (SMTP for password recovery)

**Environment Variables:** DB_URL, REDIS_URL, JWT_SECRET, SMTP_USER, SMTP_PASSWORD

---

## Verification Checklist

Before marking Phase 2 complete:

- [ ] All 8 tasks completed and merged
- [ ] Backend tests pass: npm test (auth endpoints)
- [ ] Frontend tests pass: npm test (login, register, password reset)
- [ ] JWT validation <10ms latency
- [ ] Password hashing 250-500ms latency
- [ ] Email recovery tested end-to-end
- [ ] RBAC permission matrix enforced (provider isolation tested)
- [ ] Session management: concurrent sessions capped at 3
- [ ] Token rotation working (refresh endpoint returns new token)
- [ ] Audit logging verified (all modifications logged)
- [ ] Security review: no hardcoded secrets, no plaintext passwords
- [ ] Docker integration: docker-compose up with all services
- [ ] Load test: 100 concurrent users, <200ms p99 latency

---

## Next Phase

Phase 3: Core Compliance Workflows (Provider Management, Self-Assessment, Findings)

---

*Created: 2026-04-10*  
*Status: PLANNED - Ready for execution with /gsd-execute-phase 2*
