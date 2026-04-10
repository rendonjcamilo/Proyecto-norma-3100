# Norma 3100 Compliance Management System

## What This Is

A compliance management platform for Colombian health service providers to meet Norma 3100 de 2019 requirements. The system automates provider certification, self-assessment, findings tracking, and regulatory reporting for REPS/INVIMA authorities. Critical for health provider operations and audit readiness.

## Core Value

Enable health providers to efficiently manage and demonstrate compliance with Colombian health standards, reducing manual audit burden and accelerating certification cycles.

## Target Users

- **Primary:** Health service providers (clinics, diagnostic centers, surgical centers)
- **Secondary:** Auditors (Adriana Perdomo - compliance verification)
- **Operations:** VPS/Infrastructure team (Juan Camilo Rendón - deployment/maintenance)
- **Admin:** User management, provider onboarding, system oversight

## Success Metrics

- Module 1-6 (core compliance workflows): Live in 16 weeks
- Sub-10s audit trail queries for findings/documentary matrix
- Self-assessment completion in <20 min per provider
- REPS/INVIMA integration sync success rate >99%
- Zero auth/audit trail violations
- Provider onboarding to live compliance tracking: <2 days

## Constraints & Scope

### Constraints
- Colombian regulatory context (Norma 3100, REPS/INVIMA APIs)
- Audit trail immutability requirement
- TLS 1.3 + AES-256 encryption mandatory
- VPS-hosted production (Hostinger)
- Internal JWT auth (no external OAuth in Phase 1)

### Phase 1 Scope (MVP)
- 10 core modules (provider mgmt, service catalog, self-assessment, findings, documentary matrix, REPS/INVIMA, audit, reports, user control, + security/architecture)
- Domestic health providers only
- Internal user authentication
- No third-party ERP integration
- PostgreSQL + Redis backend

### Out of Scope (Post-MVP)
- External OAuth/SSO integration
- Multi-tenancy across regions
- Advanced ML-driven compliance predictions
- Mobile-first UI (desktop-first v1)
- Historical audit trail compression/archival (retention: 7+ years)

## Context

### Team & Stakeholders
- **Adriana Perdomo** — Auditor/subject matter expert (Norma 3100, compliance workflows)
- **Juan Camilo Rendón** — VPS/infrastructure access (Hostinger SSH, deployment)
- **Project Owner** — Vision/prioritization
- **Dev Team** — TBD (size, tech preference)

### Decision: Tech Stack

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Backend: Node.js/Express | JavaScript full-stack, rapid iteration, npm ecosystem rich | Chosen |
| Frontend: React | Component-driven, compliance UI patterns, developer velocity | Chosen |
| Database: PostgreSQL | Relational structure for audit/compliance data, jsonb audit logs, strong ACID | Chosen |
| Cache: Redis | High-speed session/audit log caching, real-time dashboards | Chosen |
| Containerization: Docker | Dev/prod parity, Hostinger VPS compatibility, easy scaling | Chosen |
| Auth: Internal JWT + bcrypt | No vendor lock-in, HIPAA-adjacent audit control, Phase 1 requirement | Chosen |
| Encryption: TLS 1.3 + AES-256 | Regulatory compliance, military-grade data protection | Chosen |
| Frontend Language: Spanish | All UI in Spanish for Colombian health providers; i18n setup for future expansion | Chosen |

### Decision: Architecture Pattern

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Microservices vs Monolith | Monolith (Phase 1) — simpler deployment on single VPS, tight audit coupling | Monolith with modular structure |
| API-first design | All UI consumes same REST/GraphQL API, audit-ready, future mobile/integrations | REST API v1 |
| Event sourcing (audit trail) | Immutable event log for all compliance state changes, audit requirement | Yes — core to Module 7 |

## Requirements

### Validated
(None yet — ship to validate)

### Active

**Module 1: Provider Management**
- [ ] Provider profile CRUD (legal entity data, certifications, contact info)
- [ ] Provider status tracking (active, suspended, revoked)
- [ ] Multi-location support per provider
- [ ] Provider hierarchy/organizational structure
- [ ] Bulk provider import from REPS registry

**Module 2: Service Catalog**
- [ ] Service taxonomy definition (aligned to Norma 3100 categories)
- [ ] Service availability tracking (available/discontinued)
- [ ] Service pricing/cost structures
- [ ] Service capacity planning (max concurrent, booking)
- [ ] Service-provider mapping (which provider offers what)

**Module 3: Self-Assessment**
- [ ] Assessment questionnaire builder
- [ ] Multi-round assessment cycles (initial, mid-term, annual)
- [ ] Progress tracking across assessment sections
- [ ] Risk scoring (auto-calc based on responses)
- [ ] Assessment history/versioning per provider

**Module 4: Findings & Corrective Actions**
- [ ] Finding creation (from audit/assessment/external report)
- [ ] Severity classification (critical/major/minor)
- [ ] Corrective action assignment and tracking
- [ ] Evidence upload and validation
- [ ] Action status workflow (open/in-progress/resolved/closed)
- [ ] Due date management and escalation alerts

**Module 5: Documentary Matrix**
- [ ] Document requirement catalog per Norma 3100
- [ ] Provider document checklist generation
- [ ] Document upload and OCR validation (if available)
- [ ] Compliance status per document type
- [ ] Document expiry tracking and renewal alerts
- [ ] Audit trail of all document uploads/changes

**Module 6: REPS/INVIMA Integration**
- [ ] REPS API synchronization (provider data, status changes)
- [ ] INVIMA registry lookup (service/device approvals)
- [ ] Bi-directional data sync (outbound compliance status → REPS)
- [ ] API error handling and retry logic
- [ ] Audit logging of all external API calls
- [ ] Data reconciliation report

**Module 7: Audit Trail & Logging**
- [ ] Immutable event log (all compliance state changes)
- [ ] User action tracking (who, what, when, why)
- [ ] Data change tracking (before/after snapshots)
- [ ] Compliance violation detection (unauthorized access, data tampering)
- [ ] Audit report export (PDF, CSV, standardized format)
- [ ] Retention policy enforcement (7+ years minimum)

**Module 8: Reports & Dashboards**
- [ ] Executive compliance dashboard (status by provider, risk heatmap)
- [ ] Audit readiness report
- [ ] Findings summary (open/closed, by severity, by category)
- [ ] Documentary compliance status
- [ ] REPS synchronization status/log
- [ ] User activity report
- [ ] Customizable report builder (filters, grouping, export)

**Module 9: User Control & RBAC**
- [ ] Role-based access control (Admin, Auditor, Provider User, Viewer)
- [ ] User provisioning/deprovisioning
- [ ] Password policy enforcement (complexity, rotation)
- [ ] Multi-factor authentication (MFA) support
- [ ] Session timeout and re-authentication
- [ ] User activity audit (logins, role changes, permission modifications)

**Module 10: Security & Architecture**
- [ ] TLS 1.3 encryption in transit
- [ ] AES-256 encryption at rest (DB, backups)
- [ ] JWT token lifecycle (issue, refresh, revoke, expiration)
- [ ] Rate limiting and DDoS mitigation
- [ ] CORS and CSRF protection
- [ ] Input validation and SQL injection prevention
- [ ] Environment isolation (dev/test/prod Docker configs)
- [ ] Secrets management (DB credentials, API keys, JWT secret)
- [ ] Health checks and monitoring
- [ ] Backup and disaster recovery procedures
- [ ] Docker multi-stage builds (dev/prod parity)
- [ ] VPS hardening (Hostinger best practices)

### Out of Scope

- External OAuth/SSO providers (Phase 2) — V1 requirement: internal JWT only
- ERP system integration (Phase 2+) — complex, post-MVP
- Multi-tenancy across Colombian regions (Phase 3) — single provider landscape v1
- Advanced ML compliance prediction (Phase 2) — manual assessment v1
- Mobile application (Phase 3) — desktop web v1
- Audit trail compression before 7+ year retention (Phase 2) — store all v1
- HIPAA compliance (v1 scope: Norma 3100 only)

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---

*Last updated: 2026-04-10 after initialization*
