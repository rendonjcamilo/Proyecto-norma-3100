# Norma 3100 Compliance Management System - Roadmap

**Project:** Norma 3100 Compliance Management System  
**Timeline:** 16 weeks (MVP → Phase 1 complete)  
**Granularity:** Standard (6-7 phases, 3-5 plans per phase)  
**Execution:** Parallel (independent work streams where possible)  
**Created:** 2026-04-10

---

## Milestones & Timeline

```
Phase 1: Setup & Core Infrastructure      (Weeks 1-2)
  ├─ Phase 1.1: Dev Environment & Architecture
  ├─ Phase 1.2: Database Schema & Event Sourcing
  
Phase 2: Auth & User Management            (Weeks 3-4)
  ├─ Phase 2.1: JWT Auth & RBAC Backend
  ├─ Phase 2.2: User Management UI
  
Phase 3: Core Compliance Workflows         (Weeks 5-8)
  ├─ Phase 3.1: Provider Management Module
  ├─ Phase 3.2: Self-Assessment Module
  ├─ Phase 3.3: Findings & Corrective Actions
  
Phase 4: Regulatory Data & Integration     (Weeks 9-11)
  ├─ Phase 4.1: Service Catalog & Documentary Matrix
  ├─ Phase 4.2: REPS/INVIMA API Integration
  
Phase 5: Audit & Reporting                 (Weeks 12-14)
  ├─ Phase 5.1: Audit Trail & Immutable Logging
  ├─ Phase 5.2: Reports & Dashboards
  
Phase 6: Security Hardening & Deployment   (Weeks 15-16)
  ├─ Phase 6.1: Security Review & TLS/AES-256
  ├─ Phase 6.2: VPS Deployment & Go-Live Prep
```

---

## Phase Breakdown

### Phase 1: Setup & Core Infrastructure (Weeks 1-2)

**Goal:** Establish foundation: dev environment, database architecture, event sourcing for audit trail

**Effort:** 40 hours | **Team:** 2 engineers | **Parallelization:** High

#### Phase 1.1: Dev Environment & Architecture Setup

**Plans:**
1. **P1.1.1: Docker & Local Development Setup**
   - Create Docker Compose (backend, frontend, PostgreSQL, Redis)
   - Configure Node.js/Express scaffold
   - Setup npm scripts (dev, test, build, lint)
   - **Est. effort:** 8 hours
   - **Validation:** `docker-compose up` runs all services; health checks pass

2. **P1.1.2: Project Structure & Coding Standards**
   - Implement directory structure (src/modules, src/routes, src/middleware, src/utils, etc.)
   - Add ESLint, Prettier, TypeScript config
   - Create contribution guidelines
   - **Est. effort:** 5 hours
   - **Validation:** All code matches linter rules; README.md covers setup

#### Phase 1.2: Database Schema & Event Sourcing

**Plans:**
1. **P1.2.1: PostgreSQL Schema Design**
   - Design core tables: providers, locations, services, users, roles, permissions
   - Create audit events table (append-only log structure)
   - Add indexes for performance (provider_id, user_id, timestamp)
   - Setup migrations framework (e.g., Knex.js)
   - **Est. effort:** 10 hours
   - **Validation:** All schemas created; migration rollback works; no data loss

2. **P1.2.2: Event Sourcing Framework**
   - Implement event store (events table)
   - Create event publisher/subscriber pattern
   - Build event replay mechanism for state reconstruction
   - Add event versioning strategy
   - **Est. effort:** 12 hours
   - **Validation:** Events immutably logged; replay reconstructs state; 0 data loss

3. **P1.2.3: Redis Caching Strategy**
   - Configure Redis (sessions, audit log cache, real-time metrics)
   - Implement cache invalidation logic
   - Setup TTL policies
   - **Est. effort:** 5 hours
   - **Validation:** Cache hits reduce DB load by 40%; session data persists across restarts

---

### Phase 2: Auth & User Management (Weeks 3-4)

**Goal:** Implement secure authentication, JWT tokens, RBAC backend & UI

**Effort:** 35 hours | **Team:** 2 engineers | **Parallelization:** High (backend/frontend parallel)

#### Phase 2.1: JWT Auth & RBAC Backend

**Plans:**
1. **P2.1.1: JWT Token Lifecycle**
   - Implement JWT generation (HS256, 1h expiry)
   - Add refresh token mechanism (14d expiry)
   - Create token validation middleware
   - Implement token revocation list
   - **Est. effort:** 8 hours
   - **Validation:** Tokens issue/expire/refresh correctly; revoked tokens rejected; <10ms validation latency

2. **P2.1.2: Password Management & Bcrypt**
   - Implement bcrypt hashing (cost=12)
   - Add password complexity validation
   - Create password reset flow (email link, temp token, 1h expiry)
   - Add password history (prevent reuse of last 5)
   - **Est. effort:** 7 hours
   - **Validation:** Passwords hashed consistently; reset links expire; no plaintext in logs

3. **P2.1.3: Role-Based Access Control (RBAC)**
   - Define roles: Admin, Auditor, Provider User, Viewer
   - Create permission matrix (role → actions allowed)
   - Implement middleware to check permissions
   - Add permission caching in Redis
   - **Est. effort:** 8 hours
   - **Validation:** Role checks enforced on all endpoints; audit logs privilege changes; cache hit >95%

#### Phase 2.2: User Management UI

**Plans:**
1. **P2.2.1: Login & Register Pages**
   - Create login form (email, password, remember-me checkbox)
   - Add password reset form (email → new password)
   - Implement form validation (client-side + server-side)
   - Add error handling & user feedback
   - **Est. effort:** 6 hours
   - **Validation:** Forms validate inputs; error messages clear; <2s login latency

2. **P2.2.2: User Administration Dashboard**
   - Create user list (searchable, filterable by role, status)
   - Add user creation form (email, role, provider assignment)
   - Implement user edit/deactivate/delete
   - Add bulk user import (CSV)
   - **Est. effort:** 9 hours
   - **Validation:** CRUD operations work; audit logs all changes; bulk import <500ms for 100 users

---

### Phase 3: Core Compliance Workflows (Weeks 5-8)

**Goal:** Implement provider management, self-assessment, findings—core user-facing workflows

**Effort:** 70 hours | **Team:** 3 engineers | **Parallelization:** High (3 parallel work streams)

#### Phase 3.1: Provider Management Module (FR-101, FR-102)

**Plans:**
1. **P3.1.1: Provider CRUD & Profile Management**
   - Create provider profile form (legal entity data, locations, certifications)
   - Implement provider status transitions (active → suspended → revoked)
   - Add multi-location support (each location = separate record)
   - Implement soft delete (archive) with audit trail
   - **Est. effort:** 12 hours
   - **Validation:** CRUD operations immutably logged; status transitions atomic; no data loss on delete

2. **P3.1.2: Service Catalog Management**
   - Create service definition form (Norma 3100 categories)
   - Implement service availability toggle
   - Add pricing & capacity constraints
   - Build service-provider mapping
   - **Est. effort:** 10 hours
   - **Validation:** Services categorized correctly; capacity alerts trigger at thresholds; pricing tracked

3. **P3.1.3: Bulk Provider Import (REPS)**
   - Create CSV import flow for providers
   - Implement data validation & conflict resolution
   - Add progress tracking UI (% imported, errors)
   - **Est. effort:** 8 hours
   - **Validation:** 1000+ records imported in <5 min; duplicates detected; error log generated

#### Phase 3.2: Self-Assessment Module (FR-103)

**Plans:**
1. **P3.2.1: Assessment Questionnaire Builder**
   - Create admin UI for questionnaire design
   - Support question types (checkbox, radio, text, scale 1-5)
   - Implement conditional logic (if Q1="yes" then show Q2)
   - Add section organization
   - **Est. effort:** 12 hours
   - **Validation:** Questionnaires save/load correctly; conditional logic works; versioning preserved

2. **P3.2.2: Assessment Distribution & Completion**
   - Create assessment assignment UI (assign to providers)
   - Build assessment UI for provider (progress tracking, auto-save every 30s)
   - Implement deadline enforcement (soft warning -3d, hard block after)
   - Add draft/submit workflow
   - **Est. effort:** 14 hours
   - **Validation:** Assessments distribute; drafts auto-save; deadlines enforced; <100ms save latency

3. **P3.2.3: Risk Scoring & Assessment History**
   - Implement auto-calculated risk score (0-100 based on responses)
   - Create assessment comparison view (show changes between rounds)
   - Add assessment export (PDF with signatures)
   - Build assessment history/versioning
   - **Est. effort:** 10 hours
   - **Validation:** Risk scores calculated correctly; exports include metadata; version diffs accurate

#### Phase 3.3: Findings & Corrective Actions Module (FR-104)

**Plans:**
1. **P3.3.1: Finding Creation & Management**
   - Create finding form (auditor/assessment-sourced)
   - Implement severity classification (critical/major/minor)
   - Add finding categorization (by regulatory area)
   - Link findings to providers/services
   - **Est. effort:** 10 hours
   - **Validation:** Findings created; severity impacts compliance score; categorization aligns to Norma 3100

2. **P3.3.2: Corrective Action Workflow**
   - Implement action creation (linked to findings)
   - Create action status workflow (open → in_progress → resolved → verified → closed)
   - Add due date management & escalation alerts
   - Build evidence upload (file validation, max 500MB)
   - **Est. effort:** 13 hours
   - **Validation:** Actions transition atomically; alerts fire at -7d/-3d/0d/+3d; evidence stored securely

3. **P3.3.3: Finding Verification & Bulk Operations**
   - Create auditor verification UI (approve/reject resolutions)
   - Implement bulk action assignment (CSV, 50+ providers)
   - Add internal comment threads (@mentions)
   - **Est. effort:** 9 hours
   - **Validation:** Verification workflow enforced; bulk ops complete <2 min; comments notify recipients

---

### Phase 4: Regulatory Data & Integration (Weeks 9-11)

**Goal:** Implement documentary matrix, REPS/INVIMA integration—regulatory compliance data

**Effort:** 50 hours | **Team:** 2 engineers | **Parallelization:** High (parallel API work)

#### Phase 4.1: Documentary Matrix Module (FR-105)

**Plans:**
1. **P4.1.1: Document Requirements & Checklist**
   - Create Norma 3100 document catalog (quality manual, risk assessment, staffing, etc.)
   - Implement auto-generated checklists (per provider/service)
   - Add document metadata (upload date, version, expiry, uploader)
   - Implement document expiry tracking & alerts
   - **Est. effort:** 10 hours
   - **Validation:** Checklists auto-generate correctly; expiry alerts fire 30 days before; metadata accurate

2. **P4.1.2: Document Upload & Validation**
   - Create file upload handler (validation, encryption, storage)
   - Implement OCR scanning for keyword validation (optional, >80% confidence)
   - Add document version control (history, rollback)
   - Build compliance status tracking (compliant/expired/pending/rejected)
   - **Est. effort:** 12 hours
   - **Validation:** Files encrypted at rest; OCR confidence tracked; version history immutable; <100ms upload

3. **P4.1.3: Documentary Compliance Reporting**
   - Create dashboard showing compliance % by document type
   - Build provider-specific checklist views
   - Add export (PDF compliance report)
   - **Est. effort:** 8 hours
   - **Validation:** Compliance % calculated correctly; reports reflect latest uploads

#### Phase 4.2: REPS/INVIMA API Integration (FR-106)

**Plans:**
1. **P4.2.1: REPS API Client & Sync**
   - Implement REPS API authentication (API key/OAuth, token refresh 1h)
   - Create provider data sync (query REPS, import/update local records)
   - Implement conflict resolution (local override strategy)
   - Add sync scheduling (nightly 2am inbound, weekly outbound)
   - **Est. effort:** 12 hours
   - **Validation:** Auth tokens refresh; sync completes <5 min; 1000+ records sync without loss

2. **P4.2.2: INVIMA Registry Lookup & Service Validation**
   - Implement INVIMA device/service approval lookup
   - Validate provider service offerings against INVIMA
   - Add lookup caching (24h TTL)
   - Create lookup error handling & alerts
   - **Est. effort:** 8 hours
   - **Validation:** Lookups return correct approval status; cache reduces API calls by 80%; errors logged

3. **P4.2.3: Outbound Status Sync & Reconciliation**
   - Implement provider compliance status → REPS push
   - Create reconciliation report (local vs. REPS data)
   - Add data mismatch detection & manual resolution workflow
   - Implement API error handling & retry (exponential backoff)
   - **Est. effort:** 12 hours
   - **Validation:** Status syncs to REPS; reconciliation identifies mismatches; retry succeeds <15 min

---

### Phase 5: Audit & Reporting (Weeks 12-14)

**Goal:** Implement audit trail, immutable logging, reports/dashboards for compliance visibility

**Effort:** 45 hours | **Team:** 2 engineers | **Parallelization:** High

#### Phase 5.1: Audit Trail & Immutable Logging (FR-107)

**Plans:**
1. **P5.1.1: Event Log Architecture & Immutability**
   - Finalize event log schema (append-only, timestamped, checksummed)
   - Implement immutability verification (hash chains, tamper detection)
   - Add event retention policy (7+ year storage)
   - Create event search indexes (user, action, timestamp, resource)
   - **Est. effort:** 10 hours
   - **Validation:** Events immutably logged; tamper detection works; search <500ms for 10M events

2. **P5.1.2: User Action & Data Change Tracking**
   - Log all user actions (create/edit/delete/view with IP, timestamp, user_id)
   - Capture before/after snapshots for sensitive data
   - Implement violation detection (unauthorized access, off-hours access, privilege escalation)
   - Add audit log encryption (AES-256 at rest)
   - **Est. effort:** 12 hours
   - **Validation:** All actions logged; snapshots captured; violations flagged automatically; encryption verified

3. **P5.1.3: Audit Report Generation & Export**
   - Create audit report builder (filters by user, action, time range, severity)
   - Implement PDF/CSV export
   - Add analytics (top users, actions, trends)
   - Build real-time audit dashboard (last 100 events, auto-refresh 10s)
   - **Est. effort:** 10 hours
   - **Validation:** Reports generate <2 sec; exports include all data; dashboard updates in real-time

#### Phase 5.2: Reports & Dashboards (FR-108)

**Plans:**
1. **P5.2.1: Executive Dashboard & KPIs**
   - Create real-time dashboard (providers count, compliance %, findings by severity, REPS sync status)
   - Build compliance heatmap (providers vs. compliance areas)
   - Add top risks widget
   - Implement auto-refresh every 30s
   - **Est. effort:** 12 hours
   - **Validation:** KPIs update in real-time; heatmap renders <1 sec; no stale data >30s

2. **P5.2.2: Audit Readiness & Findings Reports**
   - Create provider-specific audit readiness report (compliance %, outstanding findings, doc gaps)
   - Build findings summary (open/closed, by severity/category/owner)
   - Add findings trend analysis (over time)
   - Implement finding export (PDF)
   - **Est. effort:** 10 hours
   - **Validation:** Reports accurate; exports include metadata; trends computed correctly

3. **P5.2.3: Custom Report Builder & Scheduling**
   - Create report builder UI (select metrics, filters, grouping, export format)
   - Implement report scheduling (daily/weekly/monthly)
   - Add email delivery to stakeholder lists
   - Build report archive
   - **Est. effort:** 11 hours
   - **Validation:** Custom reports generate correctly; scheduled reports email on time; archive queryable

---

### Phase 6: Security Hardening & Deployment (Weeks 15-16)

**Goal:** Security review, TLS/AES-256 implementation, VPS deployment, go-live prep

**Effort:** 30 hours | **Team:** 2 engineers (1 security, 1 DevOps) | **Parallelization:** Partial

**Plans:** 9 plans (finalized 2026-07-07 via `/gsd-plan-phase 6` — derived from the codebase security audit `.planning/codebase/CONCERNS.md`, not the original 6.1/6.2 estimate below which is retained as context)

Plans (all Wave 1 — parallel, exclusive file ownership; 06-09 has a supervised checkpoint):
- [x] 06-01-PLAN.md — JWT refresh-secret separation + API rate-limit hardening (FR-110.3, FR-110.4)
- [x] 06-02-PLAN.md — dev-login limiter, welcome email, assessment export wire-up (FR-110.4, FR-103.7)
- [x] 06-03-PLAN.md — webhook signature/secret verification on all 6 endpoints (FR-110.6)
- [x] 06-04-PLAN.md — Express config: CORS whitelist, Swagger prod gate, Redis health auth (FR-110.5, FR-110.9)
- [x] 06-05-PLAN.md — Nginx security headers (X-XSS, CSP), docs deny, TLS 1.3 verify (FR-110.1, FR-110.5)
- [x] 06-06-PLAN.md — EventStore hash-chain lock + at-rest payload encryption default (FR-110.2, NFR-105.4)
- [x] 06-07-PLAN.md — audit identity fix, risk-scoring via EventStore, user lifecycle events (NFR-105.3, NFR-105.4)
- [x] 06-08-PLAN.md — dev secrets to gitignored .env, prod container hardening, PG logging (FR-110.7, FR-110.8, FR-110.11, FR-110.12)
- [x] 06-09-PLAN.md — Postgres 14→17 upgrade runbook + supervised execution checkpoint (FR-110.10)

Carry-over human actions (NOT plan tasks — outside executor scope): rotate leaked RESEND_API_KEY on resend.com; restrict host PostgreSQL-16 to localhost; apply VPS OS updates + reboot. Already resolved / excluded: deploy.yml migrate:up (already in origin/main).

#### Phase 6.1: Security Review & Encryption Implementation

**Plans:**
1. **P6.1.1: TLS 1.3 & Certificate Management**
   - Configure TLS 1.3 on Express (disable TLS <1.3)
   - Implement certificate provisioning (Let's Encrypt via certbot)
   - Add certificate auto-renewal
   - Test cipher suites (TLS_AES_256_GCM_SHA384, TLS_CHACHA20_POLY1305_SHA256)
   - **Est. effort:** 6 hours
   - **Validation:** SSL Labs A+ rating; no fallback to <TLS 1.3; cert auto-renews

2. **P6.1.2: AES-256 At-Rest Encryption**
   - Implement DB encryption (PostgreSQL pgcrypto extension or app-level)
   - Add backup encryption (AES-256-GCM)
   - Implement secrets management (env vars, .env.local)
   - Create key rotation strategy (quarterly)
   - **Est. effort:** 8 hours
   - **Validation:** DB/backups encrypted; keys rotated; no plaintext secrets in git

3. **P6.1.3: Security Hardening & Vulnerability Scanning**
   - Run SAST (e.g., Snyk, npm audit) on dependencies
   - Fix critical/high vulnerabilities
   - Implement input validation & sanitization review
   - Add OWASP Top 10 checklist validation
   - **Est. effort:** 6 hours
   - **Validation:** No critical/high vulnerabilities; OWASP checklist 100% addressed

#### Phase 6.2: VPS Deployment & Go-Live Prep

**Plans:**
1. **P6.2.1: VPS Setup & Docker Deployment (Hostinger)**
   - Provision VPS on Hostinger (Ubuntu 22.04, 4GB RAM, 100GB SSD)
   - Configure SSH hardening (key-based auth, port customization)
   - Install Docker, Docker Compose
   - Setup firewall rules (80, 443 only)
   - Configure fail2ban
   - **Est. effort:** 6 hours
   - **Validation:** VPS accessible only via SSH key; firewall blocks all except 80/443; fail2ban configured

2. **P6.2.2: CI/CD Pipeline & Automated Deployment**
   - Setup Git-based deploy (push to main → deploy to prod)
   - Implement rolling updates (zero-downtime deploy)
   - Create health checks (startup, liveness, readiness)
   - Add monitoring & alerting (Prometheus, Grafana, or basic monitoring)
   - **Est. effort:** 6 hours
   - **Validation:** Commits trigger deploy; deployments complete <5 min; no downtime during updates; alerts fire

3. **P6.2.3: Backup, Monitoring & Go-Live**
   - Configure daily automated DB backups (encrypted, 30-day retention)
   - Test backup restoration (weekly)
   - Setup uptime monitoring (UptimeRobot or similar)
   - Create runbook (deployment, rollback, incident response)
   - Create go-live checklist (testing, user training, cutover plan)
   - **Est. effort:** 6 hours
   - **Validation:** Backups verified restorable; uptime monitoring active; runbook complete; team trained

---

## Estimation Summary

| Phase | Title | Effort (hrs) | Team | Timeline |
|-------|-------|---|---|---|
| 1 | Setup & Infrastructure | 40 | 2 | Weeks 1-2 |
| 2 | Auth & User Management | 35 | 2 | Weeks 3-4 |
| 3 | Core Compliance Workflows | 70 | 3 | Weeks 5-8 |
| 4 | Regulatory Data & Integration | 50 | 2 | Weeks 9-11 |
| 5 | Audit & Reporting | 45 | 2 | Weeks 12-14 |
| 6 | Security & Deployment | 30 | 2 | Weeks 15-16 |
| **Total** | **MVP Phase 1** | **270** | **2-3 avg** | **16 weeks** |

**Team:** 2-3 engineers (full-time) + DevOps/Security (part-time shared)  
**Key Dependencies:** Phases 1 → 2 → (3||4) → 5 → 6

---

## Success Criteria (Phase 1)

- All 10 modules functional and tested
- 55+ functional requirements implemented
- Audit trail immutable and tamper-detected
- TLS 1.3 + AES-256 encryption verified
- REPS/INVIMA integration syncing
- 500+ concurrent users supported
- <2 sec dashboard load, <200 ms API response
- 99.5% uptime SLA met
- Zero auth/audit violations
- Provider onboarding → compliance tracking: <2 days
- Team trained on operations & runbook

---

## Post-Phase 1 (Future Milestones)

**Phase 7:** External OAuth/SSO, advanced reporting, mobile PWA  
**Phase 8:** Multi-tenancy, regional expansion, ERP integration  
**Phase 9:** ML compliance predictions, audit log archival, advanced analytics

---

*Last updated: 2026-04-10*
