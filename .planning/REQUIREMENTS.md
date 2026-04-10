# Norma 3100 Compliance Management System - Requirements

**Project:** Norma 3100 Compliance Management System  
**Version:** 1.0  
**Date:** 2026-04-10  
**Status:** Active (Phase 1 MVP)

---

## Functional Requirements (55+)

### FR-101: Provider Management (8 requirements)

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| FR-101.1 | Create provider profile | Provider record created with legal entity data (RUT, name, address, contact) |
| FR-101.2 | Edit provider profile | Provider data updated without affecting audit trail timestamps |
| FR-101.3 | Delete/archive provider | Provider marked archived; historical data retained for audit; new transactions blocked |
| FR-101.4 | Provider status transitions | States: active → suspended → active/revoked; status changes logged immutably |
| FR-101.5 | Multi-location support | Each provider can register multiple service locations; each location has independent compliance status |
| FR-101.6 | Organizational hierarchy | Support parent-subsidiary relationships; cascade compliance requirements as needed |
| FR-101.7 | Bulk REPS import | Import 100+ provider records from REPS registry in <5 min without manual intervention |
| FR-101.8 | Provider search & filtering | Full-text search by name, RUT, location; advanced filters by status, certification level, region |

### FR-102: Service Catalog (7 requirements)

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| FR-102.1 | Service taxonomy definition | Define Norma 3100-aligned service categories; categorization matches regulatory framework |
| FR-102.2 | Add/edit service | Create service records with description, classification, pricing tier, capacity constraints |
| FR-102.3 | Service availability toggle | Enable/disable services; deactivated services excluded from new bookings |
| FR-102.4 | Service pricing structure | Support multiple pricing models (fixed, per-unit, per-time); compliance cost tracking |
| FR-102.5 | Service capacity planning | Set max concurrent users/sessions per service; capacity alerts at 80%/95% |
| FR-102.6 | Service-provider mapping | Assign services to provider locations; validate service-location combos align to Norma |
| FR-102.7 | Service change audit trail | All service modifications (add/edit/retire) immutably logged with timestamp, user, reason |

### FR-103: Self-Assessment (9 requirements)

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| FR-103.1 | Assessment questionnaire builder | Admin creates multi-section questionnaires; questions support checkbox, radio, text, scale (1-5) |
| FR-103.2 | Assessment distribution | Assign questionnaires to provider(s); auto-notify providers of pending assessments |
| FR-103.3 | Multi-round assessment cycles | Support initial, mid-term (6mo), annual cycles; track version changes across rounds |
| FR-103.4 | Progress tracking | Real-time % completion per section; auto-save drafts every 30s |
| FR-103.5 | Risk scoring (auto-calc) | Auto-calculate provider risk score (0-100) based on responses; flag high-risk items |
| FR-103.6 | Assessment history/versioning | Retain all assessment versions; compare changes between rounds; audit trail per response |
| FR-103.7 | Assessment export | Export completed assessment (PDF) with signatures, timestamps, auditor notes |
| FR-103.8 | Conditional logic | Question visibility based on prior answers (if Q1="yes" then show Q2) |
| FR-103.9 | Assessment deadline enforcement | Soft deadline (warning at -3 days), hard deadline (submission blocked after); escalation alerts |

### FR-104: Findings & Corrective Actions (10 requirements)

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| FR-104.1 | Finding creation | Create finding record via audit/assessment/external report; link to provider, service |
| FR-104.2 | Severity classification | Severity levels: critical (1), major (2), minor (3); compliance score impacts per level |
| FR-104.3 | Corrective action assignment | Assign 1+ corrective actions per finding; track owner, deadline, evidence links |
| FR-104.4 | Evidence upload & validation | Attach documents/files to findings/actions; validate file types (PDF, image, video); max 500MB per file |
| FR-104.5 | Action status workflow | States: open → in_progress → resolved → verified → closed; transitions immutably logged |
| FR-104.6 | Due date management | Set due dates; auto-generate escalation alerts at -7d, -3d, 0d, +3d overdue |
| FR-104.7 | Bulk action assignment | Assign corrective actions to 50+ providers in <2 min via CSV import |
| FR-104.8 | Finding categorization | Categorize by regulatory area (quality, infrastructure, staffing, etc.) per Norma 3100 |
| FR-104.9 | Internal comment threads | Internal-only comments on findings (not visible to provider); support @mentions and notifications |
| FR-104.10 | Finding resolution verification | Auditor review of evidence; approve/reject resolution; re-open if insufficient |

### FR-105: Documentary Matrix (8 requirements)

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| FR-105.1 | Document requirement catalog | Maintain Norma 3100-aligned document checklist (e.g., Quality Manual, Risk Assessment, Staffing Plan) |
| FR-105.2 | Checklist generation | Auto-generate provider-specific checklist based on services offered and location |
| FR-105.3 | Document upload | Upload documents per checklist item; store encrypted; associate metadata (date, version, uploader) |
| FR-105.4 | Document expiry tracking | Flag documents nearing expiry; auto-alert 30 days before expiration |
| FR-105.5 | OCR validation (optional) | Scan document text for keyword compliance (e.g., facility name, required signatures); confidence score >80% |
| FR-105.6 | Compliance status per doc type | Mark each doc as: compliant, expired, pending, rejected; provider compliance % by document category |
| FR-105.7 | Document version control | Retain document history; audit log of uploads, replacements, deletions; rollback capability |
| FR-105.8 | Document audit trail | All document changes (upload, approve, delete) logged immutably with user, timestamp, reason |

### FR-106: REPS/INVIMA Integration (9 requirements)

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| FR-106.1 | REPS API authentication | Securely store REPS API credentials; authenticate with API key/OAuth; refresh tokens every 1h |
| FR-106.2 | Provider data sync (from REPS) | Query REPS registry; import/update provider name, status, location, certifications; conflict resolution (local override?) |
| FR-106.3 | Provider status outbound sync | Update REPS with provider compliance status (pass/fail/warning) when milestone achieved |
| FR-106.4 | Service approval lookup | Query INVIMA registry for device/service approvals; validate against provider's offerings |
| FR-106.5 | Sync frequency & scheduling | Bi-directional sync: inbound nightly 2am, outbound on-demand + weekly; error alerting on sync failure |
| FR-106.6 | API error handling & retry | Exponential backoff (3x retry, max 15min wait) on transient failures; log all API errors |
| FR-106.7 | API call audit logging | Every REPS/INVIMA API call logged: timestamp, user, method, endpoint, request/response summary, latency |
| FR-106.8 | Data reconciliation report | Weekly report: REPS data vs. local data; identify mismatches, manual resolution workflow |
| FR-106.9 | Offline fallback | If REPS/INVIMA unavailable >1h, switch to cached data; notify admins; queue sync for retry |

### FR-107: Audit Trail & Logging (9 requirements)

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| FR-107.1 | Immutable event log | All compliance state changes written to append-only event log; no updates/deletes of events |
| FR-107.2 | User action tracking | Every user action logged: user ID, timestamp, action type (create/edit/delete/view), resource, IP address |
| FR-107.3 | Data change snapshots | Before/after snapshots for all sensitive data changes (provider status, findings, documents) |
| FR-107.4 | Compliance violation detection | Auto-flag: unauthorized access attempts, data tampering (checksums), privilege escalation, off-hours access |
| FR-107.5 | Audit report export | Generate audit report (PDF/CSV): time range, user, action filters; include analytics (top users, actions) |
| FR-107.6 | Audit log retention | Store audit logs for 7+ years; compliance with Colombian data protection regulations |
| FR-107.7 | Full-text search on audit logs | Search audit events by user, action, resource, timestamp; sub-second query performance (<500ms) |
| FR-107.8 | Real-time audit dashboard | Dashboard showing last 100 audit events; filters by event type, user, severity; auto-refresh every 10s |
| FR-107.9 | Audit log encryption | All audit logs encrypted at rest (AES-256); encryption keys rotated quarterly |

### FR-108: Reports & Dashboards (9 requirements)

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| FR-108.1 | Executive dashboard | Real-time KPIs: total providers, compliance %, findings by severity, REPS sync status, top risks |
| FR-108.2 | Compliance status heatmap | Visual matrix: providers (rows) vs. compliance areas (columns); color-coded risk levels (green/yellow/red) |
| FR-108.3 | Audit readiness report | Provider-specific: compliance %, outstanding findings, documentary gaps, action plan |
| FR-108.4 | Findings summary report | Aggregate findings: open/closed counts, by severity, category, owner, provider, due date trends |
| FR-108.5 | Documentary compliance status | Provider documentary checklist status; highlight expired/pending documents; % completion per document type |
| FR-108.6 | REPS sync status report | Last sync time, success rate, failed records, reconciliation issues, next scheduled sync |
| FR-108.7 | User activity report | User login frequency, actions performed (count by type), privilege changes, last active |
| FR-108.8 | Customizable report builder | Admin-created reports: select metrics, filters (date range, provider, severity), group by, export format (PDF/CSV/Excel) |
| FR-108.9 | Report scheduling & email | Schedule reports to run daily/weekly/monthly; email delivery to stakeholder list; archive on-demand |

### FR-109: User Control & RBAC (9 requirements)

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| FR-109.1 | Role definitions | Roles: Admin (full), Auditor (read/findings), Provider User (own provider only), Viewer (read-only); custom roles TBD |
| FR-109.2 | Permission mapping | Role-to-permission matrix defined; Admin can modify role permissions in UI |
| FR-109.3 | User provisioning | Create user: email, role, provider assignment (if Provider User); auto-send invite with temp password |
| FR-109.4 | User deprovisioning | Deactivate user (retain audit history); revoke all tokens; block re-login immediately |
| FR-109.5 | Password policy enforcement | Min 12 chars, 1 uppercase, 1 number, 1 special; complexity check; no dictionary words |
| FR-109.6 | Password expiration & rotation | Passwords expire every 90 days; re-use prevention (last 5 passwords blocked); force reset on next login |
| FR-109.7 | Multi-factor authentication (MFA) | Support TOTP (Google Authenticator); optional for all users, mandatory for Admin/Auditor |
| FR-109.8 | Session timeout & reauthentication | Session timeout 30 min inactive; re-authenticate after timeout; persistent session with "Remember Me" (14 days max) |
| FR-109.9 | User activity audit | Log all user actions: login, logout, role changes, permission modifications, password resets, MFA registration |

### FR-110: Security & Architecture (9+ requirements)

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| FR-110.1 | TLS 1.3 encryption in transit | All network traffic encrypted TLS 1.3; no fallback to TLS 1.2; cipher suites: TLS_AES_256_GCM_SHA384, TLS_CHACHA20_POLY1305_SHA256 |
| FR-110.2 | AES-256 encryption at rest | DB, backups, sensitive files encrypted AES-256-GCM; encryption keys managed securely (HSM if available) |
| FR-110.3 | JWT token lifecycle | Issue JWT with 1h expiry; refresh token (14d); revocation list on logout; signed with HS256 or RS256 |
| FR-110.4 | Rate limiting & DDoS mitigation | Rate limit: 100 req/min per user, 1000 req/min per IP; respond with 429 Retry-After header |
| FR-110.5 | CORS & CSRF protection | CORS: whitelist origins; CSRF tokens on state-changing requests (POST/PUT/DELETE); SameSite=Strict cookies |
| FR-110.6 | Input validation & SQL injection prevention | Parameterized queries; input validation (length, type, whitelist); OWASP Top 10 mitigations |
| FR-110.7 | Environment isolation | Dev/test/prod Docker configs separate; no cross-env data leaks; prod secrets not in git |
| FR-110.8 | Secrets management | Store API keys, DB credentials, JWT secret in env vars or vault (e.g., HashiCorp Vault, AWS Secrets Manager); rotate quarterly |
| FR-110.9 | Health checks & monitoring | Liveness probes (health endpoint), readiness checks (DB connectivity), metrics export (Prometheus-compatible) |
| FR-110.10 | Backup & disaster recovery | Daily DB backups, encrypted, 30-day retention; restore tested weekly; RTO <4h, RPO <1h |
| FR-110.11 | Docker multi-stage builds | Dev/prod parity; dev image includes debug tools, prod minimal footprint; image scanning for vulnerabilities |
| FR-110.12 | VPS hardening | SSH hardening (key-based auth, port 22→custom port), firewall rules (allow 80/443 only), fail2ban, unattended security updates |

---

## Non-Functional Requirements

### NFR-101: Performance

| ID | Requirement | Target |
|---|---|---|
| NFR-101.1 | Page load time | <2 sec (P95) for dashboard, reports |
| NFR-101.2 | API response time | <200 ms (P95) for majority of endpoints |
| NFR-101.3 | Database query performance | <100 ms for audit trail queries (event sourcing); indexing strategy |
| NFR-101.4 | Concurrent users | Support 500+ concurrent users without degradation |
| NFR-101.5 | Bulk import throughput | 1000+ provider records / 5 min (REPS import) |

### NFR-102: Scalability

| ID | Requirement | Details |
|---|---|---|
| NFR-102.1 | Horizontal scaling | Docker deployment supports load balancing; no session affinity required |
| NFR-102.2 | Database scaling | PostgreSQL with read replicas for reports; sharding strategy for audit logs if >10M events |
| NFR-102.3 | Cache efficiency | Redis for session cache, audit log cache; eviction policy LRU, TTL-based |
| NFR-102.4 | CDN ready | Static assets (CSS, JS, images) optimized for CDN delivery |

### NFR-103: Availability

| ID | Requirement | Target |
|---|---|---|
| NFR-103.1 | Uptime SLA | 99.5% (max 3.6 hr downtime/month) |
| NFR-103.2 | Database backup frequency | Daily, 30-day retention |
| NFR-103.3 | Disaster recovery | Restore from backup in <4 hours (RTO); data loss <1 hour (RPO) |
| NFR-103.4 | Health monitoring | Automated alerting on service failures; incident response <15 min |

### NFR-104: Maintainability

| ID | Requirement | Details |
|---|---|---|
| NFR-104.1 | Code documentation | Inline comments for complex logic; API documentation (OpenAPI/Swagger) |
| NFR-104.2 | Logging & debugging | Structured JSON logs; request ID correlation across services; debug mode for troubleshooting |
| NFR-104.3 | Deployment automation | CI/CD pipeline; automated testing; rolling updates with zero-downtime |
| NFR-104.4 | Version control | Git-based workflow; semantic versioning; release notes for each version |

### NFR-105: Security

| ID | Requirement | Details |
|---|---|---|
| NFR-105.1 | Data encryption | TLS 1.3 in transit, AES-256 at rest |
| NFR-105.2 | Authentication | Internal JWT + bcrypt; no external OAuth v1 |
| NFR-105.3 | Authorization | RBAC with granular permissions; audit all privilege escalations |
| NFR-105.4 | Compliance | Align to Colombian data protection law (Ley 1581/2013); audit trail immutability |
| NFR-105.5 | Vulnerability scanning | Regular penetration testing; dependency scanning (npm audit); SAST on commit |

### NFR-106: Usability

| ID | Requirement | Details |
|---|---|---|
| NFR-106.1 | Interface responsiveness | Mobile-friendly (tablet min, desktop-first); accessibility (WCAG 2.1 AA) |
| NFR-106.2 | Error messaging | Clear, actionable error messages; guidance on remediation |
| NFR-106.3 | Help & documentation | In-app help (tooltips, guided tours); external docs (user guide, FAQs) |
| NFR-106.4 | Localization | Spanish (es-CO) primary; English secondary; date/currency formatting locale-aware |

---

## Requirement Traceability

### By Module

| Module | Functional Reqs | Non-Functional Reqs | Status |
|--------|---|---|---|
| 1. Provider Management | FR-101.1-8 | NFR-101.1, NFR-102.1, NFR-103.1 | Active |
| 2. Service Catalog | FR-102.1-7 | NFR-101.1, NFR-102.1 | Active |
| 3. Self-Assessment | FR-103.1-9 | NFR-101.1, NFR-101.4, NFR-102.1 | Active |
| 4. Findings & Actions | FR-104.1-10 | NFR-101.2, NFR-101.4, NFR-103.1 | Active |
| 5. Documentary Matrix | FR-105.1-8 | NFR-101.2, NFR-102.1, NFR-103.1 | Active |
| 6. REPS/INVIMA Integration | FR-106.1-9 | NFR-101.2, NFR-102.1, NFR-103.1 | Active |
| 7. Audit Trail & Logging | FR-107.1-9 | NFR-101.3, NFR-102.2, NFR-103.1, NFR-105.1-5 | Active |
| 8. Reports & Dashboards | FR-108.1-9 | NFR-101.1, NFR-101.2, NFR-102.1 | Active |
| 9. User Control & RBAC | FR-109.1-9 | NFR-105.2-4 | Active |
| 10. Security & Architecture | FR-110.1-12 | NFR-101.1-5, NFR-103.1-4, NFR-105.1-5 | Active |

---

## Change Log

| Date | Version | Changed By | Changes |
|---|---|---|---|
| 2026-04-10 | 1.0 | Project Init | Initial requirements from V2 specification |

---

*Last updated: 2026-04-10*
