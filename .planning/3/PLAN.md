# Phase 3: Core Compliance Workflows

**Project:** Norma 3100 Compliance Management System  
**Phase:** 3 (Provider Management, Self-Assessment, Findings & Corrective Actions)  
**Timeline:** Weeks 5-8  
**Total Effort:** 70 hours  
**Team Size:** 3 engineers (1 backend lead, 1 backend, 1 frontend) - parallelizable into 3 workstreams  
**Status:** PLANNED

---

## Phase Goal

Implement core user-facing compliance workflows: provider multi-location management with status tracking, self-assessment questionnaires with risk scoring and deadline enforcement, and findings/corrective actions with complete lifecycle tracking. Enable providers to conduct self-assessments and auditors to document findings and assign corrective actions. Establish event-sourced state machine for all compliance state changes.

**Alignment to ROADMAP.md:**
- Phase 3.1: Provider Management Module (FR-101, FR-102)
- Phase 3.2: Self-Assessment Module (FR-103)
- Phase 3.3: Findings & Corrective Actions Module (FR-104)

**Dependencies:** Phase 1 COMPLETE (Docker, DB schema, Redis, event sourcing), Phase 2 COMPLETE (JWT auth, RBAC)

**Key Design Decisions:**
- **Event Sourcing:** All provider, assessment, and finding state changes logged as immutable events; state derived from event replay
- **Compliance Calculation:** Compliance % = (C / (C + NC)) * 100 per standard/service; semáforo: verde ≥80%, naranja 50-79%, rojo <50%
- **Spanish UI:** All user-facing text in Colombian Spanish (es_CO)
- **Multi-Location:** Each provider can have multiple service locations; compliance tracked independently per location
- **Audit Trail:** Every state transition immutably logged with user, timestamp, reason

---

## Success Criteria

### Provider Management (FR-101, FR-102)

1. **Provider CRUD & Profile**
   - Create provider: legal entity data (RUT, name, address, contact), multi-location support
   - Edit provider: update data without losing audit trail; non-destructive updates
   - Delete provider: soft delete (archive) marks provider inactive; historical data retained
   - Provider states: active → suspended → active/revoked; transitions atomic and logged
   - Soft delete prevents new transactions; historical access preserved for audit

2. **Multi-Location Support**
   - Each provider registers 1+ service locations (independent records)
   - Each location has own compliance status, services offered, assessment responses
   - Location-level compliance % calculated independently
   - Organizational hierarchy support: parent-subsidiary relationships with cascading requirements
   - Cascade policy: parent compliance impacts subsidiary requirements (TBD in execution)

3. **Service Catalog & Provider Mapping**
   - Service taxonomy: 157 Norma 3100-aligned services in 5 regulatory groups
   - Service definition: name, description, classification, pricing tier, capacity constraints
   - Service availability: toggle active/inactive; deactivated excluded from new bookings
   - Service-provider mapping: assign services to locations; validate combinations align to Norma
   - Capacity planning: set max concurrent users/sessions; alerts at 80%/95% usage

4. **Bulk REPS Import**
   - Import CSV with 100+ provider records (from REPS registry)
   - Data validation: RUT format, required fields, conflict detection
   - Conflict resolution: skip duplicates, allow override, generate error log
   - Progress tracking: % imported in real-time, error list, validation report
   - Performance: 1000+ records imported in <5 minutes without manual intervention

### Self-Assessment (FR-103)

1. **Questionnaire Builder**
   - Admin UI for questionnaire design: create sections, add questions
   - Question types: checkbox, radio button, text input, 5-point scale
   - Conditional logic: question visibility based on prior answers (if Q1="yes" then show Q2)
   - Versioning: track question/section changes across assessment rounds
   - Reusable templates: save/load questionnaire templates for recurring assessments

2. **Assessment Distribution & Execution**
   - Assign questionnaires to provider(s) with deadline
   - Soft deadline: warning at -3 days before due date
   - Hard deadline: submission blocked after due date; escalation alerts sent
   - Provider UI: multi-section form, progress tracking (% completion per section)
   - Auto-save: draft responses saved every 30 seconds; user notified on save
   - Submit workflow: mark assessment complete, send confirmation to auditor

3. **Risk Scoring & History**
   - Auto-calculate risk score (0-100) based on responses: high-risk items flagged
   - Risk scoring algorithm: weighted factors per question; critical responses = higher risk
   - Assessment history/versioning: retain all versions, compare changes between rounds
   - Audit trail per response: track edits, timestamps, user ID
   - Assessment export: PDF with provider data, responses, risk score, auditor notes, signatures

4. **Multi-Round Assessment Cycles**
   - Support initial assessment, mid-term (6-month), annual cycles
   - Track assessment versions across rounds
   - Compare changes: show diff between current and prior assessment
   - Cumulative compliance %: calculate per standard/service group from all responses
   - Dashboard: display compliance % by service group, trend over time

### Findings & Corrective Actions (FR-104)

1. **Finding Creation & Management**
   - Create finding from audit/assessment/external report (via UI or API)
   - Link finding to provider, location, service, standard area
   - Severity classification: critical (1), major (2), minor (3) with compliance score impact
   - Categorization by regulatory area: quality, infrastructure, staffing, management, etc.
   - Finding metadata: creation date, created_by, assigned_to, due_date, evidence links
   - Search/filter: by provider, severity, category, status, due date

2. **Corrective Action Workflow**
   - Create 1+ corrective actions per finding
   - Action assignment: assign owner (provider user), deadline, description of required action
   - State machine: open → in_progress → resolved → verified → closed
   - State transitions: atomic, immutably logged, with timestamp and user ID
   - Escalation alerts: auto-generate at -7d, -3d, 0d (due), +3d (overdue), +7d (critical)

3. **Evidence Upload & Verification**
   - Attach documents/files to findings and actions
   - File validation: PDF, images, video; max 500MB per file
   - Evidence metadata: filename, upload date, uploader, file hash (for integrity)
   - Encryption: store encrypted at rest (AES-256-GCM)
   - Auditor verification: review evidence, approve/reject resolution, add comments
   - Re-open workflow: if evidence insufficient, reject and return to in_progress

4. **Bulk Operations & Communication**
   - Bulk action assignment: CSV import for 50+ providers; create actions in <2 minutes
   - Internal comment threads: comment on findings (not visible to provider)
   - @mentions: notify users in comments; trigger notifications
   - Internal notes: audit-only comments, sensitive information
   - Provider notifications: notify owner on action assignment, deadline approaching, escalation

---

## Task Breakdown (11 tasks, 70 hours total)

Organized into 3 parallel workstreams:
- **Workstream A (Backend Provider & Service Management):** Tasks 1-3, 6 hours + 10 hours + 8 hours = 24 hours
- **Workstream B (Backend Assessment & Risk):** Tasks 4-5, 12 hours + 10 hours = 22 hours
- **Workstream C (Backend Findings & Frontend):** Tasks 6-11, 8 hours (finding) + 16 hours (UI) = 24 hours

---

### Task 1: Provider Data Model & Event Schema (6 hours)
**Traceability:** REQUIREMENTS.md FR-101.1-3, ROADMAP.md P3.1.1 (part 1)

**Description:** Design and create PostgreSQL tables for providers (legal entity, RUT, status), locations (multi-location support), organizational hierarchy (parent-subsidiary). Implement event schema for provider state changes. Seed 157 Norma 3100 services with categories.

**Key Decisions:**
- Providers table: id, rut (unique), legal_name, status (active/suspended/revoked), created_at, archived_at
- Locations table: id, provider_id, name, address, city, status, compliance_pct, created_at
- Organizational hierarchy: parent_id nullable (NULL = root provider, non-NULL = subsidiary)
- Services table: id, name, category (5 groups), description, active, capacity_max
- Service_provider_mapping: location_id, service_id, status, assigned_date

**Dependencies:** Phase 1 complete (event sourcing framework), PostgreSQL running

**Verification:**
- Provider table created with proper indexes (rut, status, created_at)
- Locations support multi-location per provider; location compliance_pct nullable until assessment
- Service catalog seeded with 157 services in 5 categories (verified count)
- Events table captures provider.created, provider.status_changed, location.created events
- Organizational hierarchy: parent-subsidiary relationships queryable

**Effort:** 6 hours | **Owner:** Backend Lead

---

### Task 2: Provider CRUD Endpoints & Status Transitions (10 hours)
**Traceability:** REQUIREMENTS.md FR-101.1-6, ROADMAP.md P3.1.1

**Description:** Implement REST API endpoints for provider CRUD operations with event sourcing. Support multi-location management, status transitions (active/suspended/revoked), and soft delete with audit trail. Enforce RBAC: super_admin full access, provider_admin own provider only, auditor read-only.

**Endpoints:**
- `POST /api/providers` → create provider, auto-event: provider.created
- `GET /api/providers` → list providers (filtered by role: provider_admin sees own, auditor sees assigned, super_admin sees all)
- `GET /api/providers/:id` → fetch provider with locations
- `PUT /api/providers/:id` → update provider data, auto-event: provider.updated
- `DELETE /api/providers/:id` → soft delete (archive), auto-event: provider.archived
- `PUT /api/providers/:id/status` → change status (active/suspended/revoked), auto-event: provider.status_changed
- `POST /api/providers/:id/locations` → add location
- `GET /api/providers/:id/locations` → list locations
- `PUT /api/providers/:id/locations/:loc_id` → update location
- `DELETE /api/providers/:id/locations/:loc_id` → soft delete location

**Event Sourcing:**
- All endpoints emit immutable events to audit trail with user_id, timestamp, before/after state
- Event schema: {event_type, provider_id, location_id, user_id, timestamp, data: {...}}
- State derived from event replay (idempotent reconstruction)

**RBAC Enforcement:**
- provider_admin: create own provider, manage own locations, cannot view other providers
- auditor: read-only access to assigned providers
- super_admin: full CRUD on all

**Validation:**
- RUT format validated (Colombian format)
- Required fields: legal_name, address, contact_email
- Status transitions: active ↔ suspended, active ↔ revoked (no direct suspended → revoked)
- Soft delete: mark archived_at timestamp, block new transactions, retain historical data

**Dependencies:** Task 1 complete

**Verification:**
- `POST /api/providers` with valid data → 201 Created, event logged
- `GET /api/providers` → provider_admin sees only own, auditor sees assigned, super_admin sees all
- `PUT /api/providers/:id/status` from active → suspended → 200 OK, event logged with before/after
- Soft delete: GET after delete → archived=true, new transactions blocked
- Audit trail: events queryable with replay reconstructing provider state

**Effort:** 10 hours | **Owner:** Backend Engineer

---

### Task 3: Service Catalog Management & Bulk Import (8 hours)
**Traceability:** REQUIREMENTS.md FR-102.1-7, ROADMAP.md P3.1.2-3

**Description:** Implement service catalog CRUD, service-provider mapping, and bulk REPS CSV import with validation, conflict detection, and progress tracking.

**Endpoints:**
- `GET /api/services` → list all services (with filters: category, active_only)
- `GET /api/services/:id` → fetch service details
- `POST /api/services` → create service (admin only)
- `PUT /api/services/:id` → update service (admin only)
- `POST /api/services/:id/availability` → toggle active/inactive
- `POST /api/providers/:id/locations/:loc_id/services` → assign service to location
- `DELETE /api/providers/:id/locations/:loc_id/services/:svc_id` → unassign service
- `POST /api/providers/import` → bulk CSV import

**Service Catalog:**
- 157 services pre-seeded in 5 categories (group by: regulatory domain)
- Service model: id, name, category, description, active, capacity_max, capacity_alerts (80%, 95%)
- Service-provider mapping: location_id, service_id, status, assigned_date

**Bulk Import:**
- CSV format: RUT, legal_name, address, city, contact_email, contact_phone, [service_codes]
- Validation: RUT format, required fields, service codes exist
- Conflict detection: duplicate RUT → skip with warning, allow force-override flag
- Progress tracking: use event stream to update import job status (queued → processing → completed)
- Performance target: 1000+ records in <5 minutes (batch inserts, async processing)
- Error log: generate report with skipped rows, validation errors

**Event Sourcing:**
- Import as multi-event transaction: provider.created for each new provider, service.assigned for each service
- Progress events: import.started, import.batch_processed, import.completed

**Dependencies:** Task 1 complete

**Verification:**
- Service CRUD: create/read/update service details
- Service availability toggle: inactive services excluded from new assignments
- Capacity alerts: threshold configuration (80%, 95%)
- Bulk import: 1000 records in <5 min (measured)
- Conflict handling: duplicate RUT skipped, error logged, non-duplicate records imported
- Progress tracking: admin sees real-time % imported, error count

**Effort:** 8 hours | **Owner:** Backend Engineer

---

### Task 4: Assessment Questionnaire Builder (12 hours)
**Traceability:** REQUIREMENTS.md FR-103.1, 3, 8, ROADMAP.md P3.2.1

**Description:** Implement admin UI for questionnaire design and backend API for CRUD operations. Support question types (checkbox, radio, text, scale), conditional logic, versioning, and multi-round assessment cycles.

**Database Model:**
- Questionnaires table: id, name, status (draft/published/archived), version, created_by, created_at
- Sections table: id, questionnaire_id, order, title, description
- Questions table: id, section_id, order, question_text, type (checkbox/radio/text/scale), conditional_on (nullable)
- Question_options table: id, question_id, option_text, order (for radio/checkbox)
- Conditional_rules table: id, question_id, parent_question_id, parent_value, visibility_action

**Endpoints:**
- `POST /api/questionnaires` → create new questionnaire (admin)
- `GET /api/questionnaires` → list questionnaires (filter: status, version)
- `GET /api/questionnaires/:id` → fetch full questionnaire with sections/questions
- `PUT /api/questionnaires/:id` → update questionnaire metadata, versioning tracked
- `POST /api/questionnaires/:id/sections` → add section
- `POST /api/questionnaires/:id/sections/:sec_id/questions` → add question
- `PUT /api/questionnaires/:id/questions/:q_id` → update question
- `DELETE /api/questionnaires/:id/questions/:q_id` → delete question
- `POST /api/questionnaires/:id/publish` → publish questionnaire (creates new version)

**Versioning:**
- Each publish creates new questionnaire version (version incremented)
- Prior versions immutably retained for historical assessments
- Question/section changes tracked: added, modified, deleted fields logged

**Conditional Logic:**
- Rule: if question_id X has value Y, then show question Z
- Multiple rules per question supported (OR logic: show if any rule matches)
- Client-side evaluation: return only applicable questions based on prior responses

**Frontend (Admin UI):**
- Questionnaire list: name, status, version, actions (edit, publish, preview, delete)
- Questionnaire editor: drag-drop sections, add/edit/delete questions
- Question builder: type selector, options (for radio/checkbox), conditional rules
- Preview mode: show questionnaire as provider will see it
- Publish workflow: confirm changes, create version, mark published

**Dependencies:** Phase 2 complete (auth, RBAC), Task 1 complete (provider model)

**Verification:**
- Create questionnaire with 3 sections, 10 questions (mixed types)
- Conditional logic: question visible only if prior answer = specific value
- Versioning: publish creates v2, prior questions unchanged in v1
- Export: questionnaire exportable as JSON (for backup/sharing)
- Admin role enforcement: only super_admin can publish/create templates

**Effort:** 12 hours | **Owner:** Backend (5h) + Frontend (7h)

---

### Task 5: Assessment Execution & Risk Scoring (10 hours)
**Traceability:** REQUIREMENTS.md FR-103.2-6, 9, ROADMAP.md P3.2.2-3

**Description:** Implement assessment assignment, provider completion UI with auto-save, risk scoring engine, deadline enforcement, and assessment history/versioning.

**Database Model:**
- Assessments table: id, provider_id, location_id, questionnaire_id, version, status (draft/submitted/reviewed), assigned_date, deadline, submitted_at, risk_score
- Assessment_responses table: id, assessment_id, question_id, response_value (JSON), answered_at, updated_at, user_id (who answered)

**Endpoints:**
- `POST /api/assessments` → create assessment (assign to provider), auto-event: assessment.created
- `GET /api/assessments` → list assessments (provider sees own, auditor sees assigned, super_admin sees all)
- `GET /api/assessments/:id` → fetch assessment with responses
- `POST /api/assessments/:id/responses` → bulk save responses, auto-save every 30s from frontend
- `PUT /api/assessments/:id/submit` → mark submitted, calculate risk score, send auditor notification
- `GET /api/assessments/:id/history` → fetch version history (prior assessments)
- `GET /api/assessments/:id/compare` → compare current vs. prior version (show changes)
- `POST /api/assessments/:id/export` → generate PDF with responses, risk score, metadata

**Risk Scoring Algorithm:**
- Per question: assign risk weight (1-5) based on criticality
- Response scoring: critical "No" responses = high risk points
- Aggregate score: sum risk points / max possible, scale 0-100
- Auto-calculate on assessment submit
- Flag high-risk items (score >75): list of critical findings

**Deadline Enforcement:**
- Soft deadline: warning notification at -3 days
- Hard deadline: submit blocked after deadline; error message with escalation path
- Escalation alerts: auto-generated at -7d, -3d, 0d, +3d, +7d overdue

**Assessment History & Versioning:**
- Retain all assessment versions (initial, mid-term, annual)
- Compare interface: show questions changed/added/removed, old vs. new responses
- Trend tracking: compliance % over assessment rounds

**Multi-Round Cycles:**
- Initial assessment: baseline compliance
- Mid-term (6mo): reassess, compare to prior, identify improvements
- Annual: comprehensive review, year-over-year trend

**Cumulative Compliance %:**
- Calculate per standard/service group: (C responses / (C + NC responses)) * 100
- Semáforo: verde ≥80%, naranja 50-79%, rojo <50%

**Frontend (Provider Assessment UI):**
- Assessment form: sections with progress bar (% complete per section)
- Question rendering: conditional questions shown/hidden based on prior answers
- Auto-save: every 30s, user notified ("Guardado a las 14:30")
- Response validation: required fields, answer format validation
- Draft/Submit: save as draft (button greyed until all sections complete), submit triggers calculation
- Deadline display: show deadline, warning color if <3 days, error if overdue

**Frontend (Auditor Assessment Review UI):**
- Assessment list: provider, deadline, status, risk score (color-coded)
- Assessment detail: show all responses, risk score breakdown, any prior versions for comparison
- History view: compare current vs. prior assessment, highlight changes
- Export: download PDF with full assessment + metadata

**Dependencies:** Task 4 complete (questionnaire model), Task 2 complete (provider model)

**Verification:**
- Assign assessment: `POST /api/assessments` → 201 Created
- Auto-save response: `POST /api/assessments/:id/responses` every 30s (test with multiple answers)
- Risk score: submit assessment → risk_score 0-100 calculated, high-risk items flagged
- Deadline enforcement: attempt submit after deadline → 403 Forbidden with message
- Deadline warning: <3 days → warning notification
- History comparison: fetch prior assessment, diff shows changes
- Export: PDF includes provider, responses, risk score, timestamp

**Effort:** 10 hours | **Owner:** Backend (5h) + Frontend (5h)

---

### Task 6: Finding Creation & Categorization (8 hours)
**Traceability:** REQUIREMENTS.md FR-104.1-2, 8, ROADMAP.md P3.3.1

**Description:** Implement finding creation from audit/assessment, severity classification, regulatory categorization, and finding search/filtering.

**Database Model:**
- Findings table: id, provider_id, location_id, service_id, source (audit/assessment/external), source_reference_id, severity (1/2/3), category (regulatory area), status, created_by, created_at
- Finding_status history: id, finding_id, old_status, new_status, changed_by, changed_at

**Endpoints:**
- `POST /api/findings` → create finding (auditor only)
- `GET /api/findings` → list findings (filter: provider, severity, category, status, due_date)
- `GET /api/findings/:id` → fetch finding with history, actions, comments
- `PUT /api/findings/:id` → update finding description, severity, category
- `PUT /api/findings/:id/status` → change status (not direct; use corrective action workflow)

**Finding Creation:**
- Auto-triggered from assessment: if assessment response = critical NC, suggest finding creation
- Manual creation: auditor form with provider, location, service, severity, category, description
- Link to assessment/audit: capture source_reference_id for traceability

**Severity Levels:**
- Critical (1): immediate compliance risk, blocks service delivery (escalation: 24h)
- Major (2): significant risk, impacts quality (escalation: 72h)
- Minor (3): process improvement opportunity (escalation: 14d)

**Categories (Regulatory Areas):**
- Quality: QA processes, documentation standards
- Infrastructure: facilities, equipment, environment controls
- Staffing: training, competency, certification
- Management: governance, policies, procedures
- Safety: incident prevention, emergency protocols
- Others: compliance-specific areas

**Finding Model:**
- Description: detailed issue statement
- Impact: how finding affects compliance
- Suggested corrective action: initial recommendation (refined during action assignment)
- Evidence: attach documents supporting finding
- Status: open → in_progress → resolved → verified → closed (controlled via corrective actions)

**Search & Filtering:**
- Full-text search: finding description, provider name
- Filters: provider, severity (checkboxes), category, status, date range
- Sorting: by severity (critical first), by due_date, by updated_at

**Event Sourcing:**
- Event: finding.created with full data
- Event: finding.categorized (if auto-categorized from assessment)

**Frontend (Auditor UI):**
- Finding list: provider, service, severity (color-coded), status, due_date, created_by
- Create finding form: provider lookup, location, service, severity, category, description, evidence upload
- Finding detail: show finding, linked corrective actions, internal comments, evidence
- Bulk create: CSV import (optional, for initial audit findings)

**Dependencies:** Task 2 complete (provider model), Task 5 complete (assessment model)

**Verification:**
- Create finding: `POST /api/findings` → 201 Created, auto-event logged
- Auto-suggest from assessment: critical assessment response → suggestion triggered
- Severity impacts escalation: critical → 24h alert, major → 72h alert
- Category assignment: finding categorized, queryable by category
- Search: filter by provider, severity, category returns correct findings
- History: finding status changes logged and queryable

**Effort:** 8 hours | **Owner:** Backend Engineer

---

### Task 7: Corrective Action Workflow & Escalations (13 hours)
**Traceability:** REQUIREMENTS.md FR-104.3-7, 9-10, ROADMAP.md P3.3.2

**Description:** Implement complete corrective action lifecycle: creation, assignment, status workflow (open → in_progress → resolved → verified → closed), due date management, escalation alerts, evidence upload, and verification workflow.

**Database Model:**
- Actions table: id, finding_id, provider_id, location_id, assigned_to, description, due_date, created_at, status (open/in_progress/resolved/verified/closed)
- Action_status_history: id, action_id, old_status, new_status, changed_by, changed_at, reason
- Action_evidence: id, action_id, filename, content_hash, uploaded_by, uploaded_at, file_type, size_bytes
- Action_comments: id, action_id, user_id, content (internal only), created_at, mentions (JSON array of user_ids)

**Endpoints:**
- `POST /api/findings/:id/actions` → create corrective action(s) for finding
- `GET /api/actions` → list actions (filter: provider, status, assigned_to, due_date, overdue)
- `GET /api/actions/:id` → fetch action with status history, evidence, comments
- `PUT /api/actions/:id` → update action description, due_date, assigned_to
- `PUT /api/actions/:id/status` → transition status (with validation)
- `POST /api/actions/:id/evidence` → upload evidence file (with encryption, virus scan optional)
- `POST /api/actions/:id/comments` → add internal comment (auditor/admin only)
- `POST /api/actions/bulk-assign` → CSV import for 50+ actions

**Action Status Workflow:**
- open: newly created, awaiting start
- in_progress: work started, evidence being gathered
- resolved: evidence uploaded, awaiting verification
- verified: auditor approved evidence, action complete
- closed: finding resolved, action archived

**State Transition Rules:**
- open → in_progress: any time
- in_progress → resolved: evidence required (non-empty attachment)
- resolved → verified: auditor review (approve)
- resolved → in_progress: auditor reject (evidence insufficient)
- verified → closed: finding closed (after all actions verified)
- Any state → closed: administrative override (with reason)

**Due Date Management:**
- Set due_date on action creation (default: finding severity + offset: critical +14d, major +30d, minor +60d)
- Escalation alerts: -7d (warning), -3d (urgent), 0d (overdue), +3d (critical), +7d (escalate_to_manager)
- Escalation notification recipients: assigned_to, assigned_by, provider_admin, auditor

**Evidence Upload:**
- File types: PDF, images (JPG/PNG), video (MP4/MOV), max 500MB per file
- Encryption: store encrypted with AES-256-GCM, file hash for integrity
- Metadata: filename, upload date, uploader, file_type, size_bytes, content_hash
- Virus scanning: optional integration (ClamAV or VirusTotal API)

**Auditor Verification Workflow:**
- Review evidence: download, view in-app preview
- Approve/Reject: checkbox + optional comment
- Approve: status → verified
- Reject: revert to in_progress, send comment to assigned_to with guidance

**Internal Comments & @Mentions:**
- Comment threads on each action (auditor-only visibility)
- @mention syntax: "@username comment" → triggers notification to user
- Mentions stored as JSON array, notification sent via internal messaging

**Bulk Action Assignment:**
- CSV format: provider_rut, location_name, action_description, assigned_to_email, due_date
- Validation: provider/location exist, email valid, due_date parsed
- Create all actions atomically, send notifications to assigned_to
- Performance: 50+ actions created in <2 minutes

**Event Sourcing:**
- Events: action.created, action.status_changed (with before/after), action.evidence_uploaded, action.commented

**Frontend (Provider UI):**
- My Actions: list of actions assigned to me, status color-coded, due_date highlighted if overdue
- Action detail: show description, due_date, status, evidence requirements, upload form
- Evidence upload: drag-drop file, progress indicator, confirmation message
- Action history: show status changes over time

**Frontend (Auditor UI):**
- Actions dashboard: filter by provider, status, assigned_to, due_date
- Action detail: show provider context, finding detail, evidence, status history
- Verification form: review evidence, approve/reject, add comment
- Bulk assign: CSV upload, preview, confirm create

**Dependencies:** Task 6 complete (finding model), Task 2 complete (provider model), Phase 2 complete (auth for notifications)

**Verification:**
- Create action: `POST /api/findings/:id/actions` → 201 Created
- Status transition: open → in_progress → resolved (requires evidence)
- Evidence upload: multipart file upload, encrypted storage, hash verified
- Escalation alert: action overdue → alert triggered at proper intervals
- Verification workflow: auditor approve → status verified, reject → status reverted
- Bulk assign: 50 actions from CSV created in <2 min
- Comments: internal comment with @mention → user notified

**Effort:** 13 hours | **Owner:** Backend Lead (8h) + Frontend (5h)

---

### Task 8: Frontend Provider Management UI (8 hours)
**Traceability:** ROADMAP.md P3.1.1-3

**Description:** Build React admin/provider UI for provider CRUD, location management, service assignment, and bulk import with progress tracking.

**UI Screens:**
1. **Provider List**
   - Table: RUT, Legal Name, Status (color badge), Locations (count), Compliance % (semáforo), Actions
   - Filters: status, location_city, compliance_pct range, created_date range
   - Search: RUT, legal name (full-text)
   - Actions: view, edit, delete, change status, view locations
   - Role-based: provider_admin sees only own, auditor read-only, super_admin full access

2. **Create/Edit Provider**
   - Form fields: RUT (validated), legal_name, address, city, contact_email, contact_phone
   - Organization: parent_provider (dropdown, nullable for subsidiaries)
   - Submit: create or update, confirmation toast, redirect to provider detail

3. **Provider Detail**
   - Header: RUT, legal_name, status, created_at, compliance_pct (semáforo)
   - Tabs: Overview, Locations, Services, Assessments, Findings
   - Overview: provider data, edit link, status transition buttons
   - Locations: list locations with add button
   - Services: list assigned services with unassign action
   - Assessments: list assessments with link to detail
   - Findings: list findings with status, severity

4. **Location Management**
   - Create location: modal form with name, address, city, status
   - Location list: name, address, compliance_pct, services (count), assessments (count)
   - Edit location: form modal
   - Delete location: soft delete confirmation

5. **Service Assignment**
   - Service list: all available services, categorized
   - Search/filter: by category, name
   - Assign to location: checkbox select, bulk assign, confirm
   - Assigned services: show per location, unassign action

6. **Bulk Import**
   - Import form: CSV file upload, format info, template download
   - Progress: real-time % imported, error count, current row processing
   - Results: summary (imported count, skipped count, errors), error detail list, download error report
   - Retry: option to retry failed rows, skip conflicts, force-override duplicates

**Spanish UI:** All labels, buttons, messages, and help text in Colombian Spanish (es_CO)
- "Crear Proveedor", "Editar", "Eliminar", "Estado: Activo", "Importar CSV", "Importar en progreso...", etc.

**Dependencies:** Task 1-3 complete (provider, location, service models)

**Verification:**
- Create provider form: validate RUT format, required fields, show validation errors
- Provider list: role-based filtering (provider_admin sees own, auditor read-only)
- Location management: add/edit/delete location with confirmation
- Service assignment: bulk select services, assign to location
- Bulk import: upload CSV, show progress, display errors, download report

**Effort:** 8 hours | **Owner:** Frontend Engineer

---

### Task 9: Frontend Assessment UI (10 hours)
**Traceability:** ROADMAP.md P3.2.1-3

**Description:** Build React admin UI for questionnaire builder and provider UI for assessment completion, with auto-save, deadline enforcement, and compliance dashboard.

**UI Screens:**

1. **Admin: Questionnaire Builder** (5 hours)
   - Questionnaire list: name, status (draft/published/archived), version, actions (edit, publish, duplicate, preview, delete)
   - Create questionnaire: modal form with name, description, save as draft
   - Editor: sections (drag-drop reorder), questions (add/edit/delete within section)
   - Question form: text, type (checkbox/radio/text/scale), required flag
   - Options form: for radio/checkbox, add/edit/delete options
   - Conditional rules: UI to set "if question X = Y, show question Z"
   - Publish: confirm changes, create version, publish status
   - Preview: render questionnaire as provider will see it (read-only)

2. **Provider: Assessment Completion** (5 hours)
   - Assessment list: questionnaire name, status (draft/submitted), deadline (color: red if overdue, orange if <3d), assigned_date
   - Assessment form: sections with progress indicator (completed / total questions)
   - Question rendering: conditional questions shown/hidden based on responses
   - Response types: checkbox (single/multi), radio (single), text (free form), scale (1-5 slider)
   - Auto-save: every 30s, display "Guardado a las 14:30" in green, unsaved changes indicator
   - Submit: button disabled until all required questions answered, show deadline warning if applicable
   - Draft warning: if attempting to close with unsaved changes
   - Submitted confirmation: show risk score (color-coded), thank you message, next steps

3. **Auditor: Assessment Review** (3 hours)
   - Assessment list: provider, questionnaire, deadline, status, risk_score (semáforo), actions (view, export)
   - Assessment detail: show all responses, risk_score breakdown
   - History comparison: dropdown to select prior assessment, side-by-side comparison
   - Export PDF: full assessment with metadata, responses, risk score

**Spanish UI:** All labels, messages, placeholders in Colombian Spanish
- "Cuestionario", "Crear Cuestionario", "Sección", "Pregunta", "Guardar", "Enviar Respuestas", "Guardado a las...", "Respuestas Obligatorias", "Riesgo Alto", etc.

**Compliance Dashboard** (optional, integrated):
- Quick stats: assessments pending, compliance % (semáforo by group), high-risk assessments
- Compliance by service group: table with group name, C count, NC count, compliance %

**Dependencies:** Task 4-5 complete (questionnaire, assessment models)

**Verification:**
- Create questionnaire: drag-drop sections, add questions with options
- Conditional logic: show/hide questions based on prior responses (test in preview)
- Assessment completion: answer questions, auto-save every 30s, show save timestamp
- Risk score calculation: submit assessment, show calculated risk score (0-100)
- Deadline enforcement: if overdue, show error message on submit
- History comparison: select prior assessment, show diff (added/removed/changed questions)
- Export PDF: download includes provider, responses, risk score, timestamp

**Effort:** 10 hours | **Owner:** Frontend Engineer

---

### Task 10: Frontend Findings & Actions UI (8 hours)
**Traceability:** ROADMAP.md P3.3.1-3

**Description:** Build React auditor UI for finding creation, management, and corrective action tracking with evidence upload and verification workflow.

**UI Screens:**

1. **Finding Management** (3 hours)
   - Finding list: provider, service, severity (icon+color), status, due_date (if from action), created_by, actions (view, edit, delete)
   - Filters: provider, severity (checkboxes), category, status, date_range
   - Search: finding description, provider name
   - Create finding form: provider (lookup), location (dropdown), service (dropdown), severity (radio), category (dropdown), description (textarea), evidence upload
   - Finding detail: show finding info, linked actions, status history, evidence, comments
   - Edit finding: update severity, category, description

2. **Corrective Action Tracking** (5 hours)
   - Action list: provider, description, assigned_to, status (color badge), due_date (bold if overdue, orange if <3d), actions (view, edit, change status)
   - Filters: provider, status (checkboxes), assigned_to, due_date_range (overdue/due_soon/upcoming)
   - Search: action description, provider name
   - Action detail: finding context, description, assigned_to, due_date, status history, evidence list, comments
   - Status transitions: dropdown to change status, with validation
   - Evidence section: list uploaded files with link to download/preview, upload new file button
   - Comments: internal comment form, list of comments with author, @mention support
   - Verification form: if status=resolved, show "Approve/Reject" radio, optional comment, submit

3. **Bulk Action Assignment** (1 hour)
   - Bulk assign form: CSV file upload, format template, preview after upload
   - Review table: show rows to create, any validation errors
   - Confirm: create all actions button

**Evidence Upload:**
- Drag-drop zone, file type validation (PDF, image, video), max 500MB warning
- Show file size, upload progress
- On success: show file preview (image/PDF in-app), link to download, delete button

**Spanish UI:**
- "Hallazgo", "Crear Hallazgo", "Acción Correctiva", "Asignar Acción", "Estado", "Abierta", "En Progreso", "Resuelta", "Verificada", "Cerrada", "Severidad", "Crítica", "Mayor", "Menor", "Categoría", "Evidencia", "Subir Archivo", "Comentario Interno", "Aprobado/Rechazado", etc.

**Dependencies:** Task 6-7 complete (finding, action models)

**Verification:**
- Create finding: form validates, submission creates finding, auto-event logged
- Finding list: filters work (severity, category, status), search returns correct results
- Action status transition: dropdown changes status, validation prevents invalid transitions
- Evidence upload: file uploaded, encrypted, preview available
- Comments: add comment, @mention user, notification sent
- Verification: auditor approve/reject action from resolved status
- Bulk assign: CSV upload creates multiple actions in <2 min

**Effort:** 8 hours | **Owner:** Frontend Engineer

---

### Task 11: Testing, Integration & Compliance Dashboard (4 hours)
**Traceability:** ROADMAP.md P3.1-3 (integration)

**Description:** Integration testing for all Phase 3 workflows, compliance % calculation verification, event sourcing audit trail validation, and basic compliance dashboard UI.

**Test Coverage:**
- API integration tests: end-to-end workflows (create provider → assign assessment → submit → calculate compliance %)
- UI integration tests: provider creation → assessment assignment → completion → finding generation → action assignment
- Event sourcing validation: replay events, verify state consistency
- Compliance % calculation: verify formula (C / (C + NC)) * 100, semáforo thresholds (verde ≥80%, naranja 50-79%, rojo <50%)
- Escalation alert timing: verify alerts fire at -7d, -3d, 0d, +3d, +7d

**Compliance Dashboard UI:**
- Summary stats: total providers, active assessments, pending actions, open findings
- Compliance status: heatmap or chart showing compliance % by provider/location
- Risk overview: high-risk assessments (risk_score >75), critical findings
- Alerts: overdue actions, upcoming deadlines, escalations
- Filters: by provider, location, service_group

**Performance Testing:**
- Bulk operations: 1000 provider import in <5 min, 50 action assignment in <2 min
- Concurrent assessments: 10+ concurrent assessment submissions, no race conditions
- Event replay: replay 10k+ events, state reconstructed in <2 sec

**Verification Checklist:**
- All Phase 3 tasks (1-10) integrated and tested
- Compliance % formula verified with known test data
- Event sourcing audit trail complete and tamper-validated
- Auto-save and escalations functioning
- Bulk operations meeting performance targets
- Spanish UI text complete and consistent

**Effort:** 4 hours | **Owner:** Backend Lead + Frontend Engineer (shared)

---

## Effort Summary

| Task | Hours | Owner | Workstream |
|------|-------|-------|-----------|
| P3.T1: Provider Data Model & Event Schema | 6 | Backend Lead | A |
| P3.T2: Provider CRUD & Status Transitions | 10 | Backend | A |
| P3.T3: Service Catalog & Bulk Import | 8 | Backend | A |
| P3.T4: Assessment Questionnaire Builder | 12 | Backend (5h) + Frontend (7h) | B |
| P3.T5: Assessment Execution & Risk Scoring | 10 | Backend (5h) + Frontend (5h) | B |
| P3.T6: Finding Creation & Categorization | 8 | Backend | C |
| P3.T7: Corrective Action Workflow | 13 | Backend (8h) + Frontend (5h) | C |
| P3.T8: Frontend Provider Management UI | 8 | Frontend | A |
| P3.T9: Frontend Assessment UI | 10 | Frontend | B |
| P3.T10: Frontend Findings & Actions UI | 8 | Frontend | C |
| P3.T11: Testing & Integration | 4 | Backend + Frontend | All |
| **Total** | **70** | 3 engineers | 3 workstreams |

---

## Parallelization Strategy

**Three Independent Workstreams (parallel execution):**

**Workstream A (Provider & Service Management) - 24 hours:**
- Task 1 → Task 2 → Task 3 → Task 8 (backend sequential, Task 8 frontend parallel with Task 2-3)
- Can start immediately after Phase 2
- Deliverable: provider CRUD, service catalog, bulk import, provider admin UI

**Workstream B (Assessment & Questionnaires) - 22 hours:**
- Task 4 → Task 5 → Task 9 (backend sequential, Task 9 frontend parallel with Task 5)
- Depends on Task 1 (provider model)
- Deliverable: questionnaire builder, assessment execution, risk scoring, assessment UI

**Workstream C (Findings & Actions) - 24 hours:**
- Task 6 → Task 7 → Task 10 (backend sequential, Task 10 frontend parallel with Task 7)
- Depends on Task 2 (provider model)
- Deliverable: finding creation, corrective action workflow, evidence upload, auditor UI

**Integration (Task 11) - 4 hours:**
- Runs after all workstreams complete
- Full end-to-end testing, performance validation, dashboard integration

**Critical Path:** Workstream A + B (34 hours), then Workstream C in parallel with B (24 hours) = 34 + 24 = 58 hours minimum, with 12 hours available for task overlap and buffer. Total 70 hours with realistic team coordination.

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-----------|
| Event sourcing complexity | Medium | High | Reference Phase 1 event sourcing framework; keep events simple, rely on event handlers |
| Compliance % formula misunderstanding | Medium | High | Document formula clearly, implement unit tests, verify with Adriana (SME) |
| Multi-location cascading logic unclear | Medium | Medium | Start with independent locations (no cascade v1), document for Phase 4 refinement |
| Service taxonomy doesn't align to Norma 3100 | Low | High | Work with Adriana to validate 157 services, adjust categorization if needed |
| Conditional logic bugs in questionnaires | Medium | Medium | Unit test all conditional branches, manual QA on complex questionnaires |
| Escalation alert timing race conditions | Low | High | Use cron job with event-driven backup; test with manual clock advancement |
| Bulk import performance degradation | Medium | Medium | Use batch inserts (1000 per transaction), async job queue, monitor DB connection pool |
| Assessment deadline enforcement edge cases | Low | Medium | Handle timezone edge cases, test deadline transitions at minute boundaries |
| Evidence file encryption/decryption errors | Low | High | Use proven crypto library (crypto Node module), test with large files, verify integrity hashes |
| RBAC permission gaps (provider_admin bypass) | Low | High | Comprehensive RBAC testing, all endpoints must check permissions before data access |
| Spanish UI translation gaps | Medium | Low | Use i18n framework, comprehensive translation review, consistent terminology |

---

## Dependencies & Prerequisites

**Must Complete First:**
- Phase 1 COMPLETE: Docker, PostgreSQL, Redis, event sourcing framework operational
- Phase 2 COMPLETE: JWT auth, bcrypt, RBAC middleware functional

**External Services:**
- Email service for assessment deadline alerts (already configured in Phase 2)

**Environment Variables:**
- DB_URL (PostgreSQL connection)
- REDIS_URL (Redis connection)
- JWT_SECRET (from Phase 2)
- SMTP_* (email for alerts)

**Data Seeding:**
- 157 Norma 3100 services (provided or created in Task 1)
- Test providers (for development)

---

## Verification Checklist

Before marking Phase 3 complete:

- [ ] All 11 tasks completed and merged
- [ ] Backend tests pass: npm test (provider, assessment, finding endpoints)
- [ ] Frontend tests pass: npm test (provider UI, assessment form, finding UI)
- [ ] Compliance % formula verified: (C / (C + NC)) * 100, semáforo logic correct
- [ ] Event sourcing: all state changes immutably logged, replay reconstructs state correctly
- [ ] Provider management: CRUD, multi-location, status transitions, soft delete working
- [ ] Service catalog: 157 services seeded, service-provider mapping functional
- [ ] Bulk import: 1000 providers in <5 min, conflict detection working
- [ ] Questionnaire builder: create, edit, publish, conditional logic working
- [ ] Assessment execution: auto-save every 30s, risk scoring calculated, deadline enforced
- [ ] Finding creation: from audit/assessment, severity/category assigned, searchable
- [ ] Corrective action workflow: status transitions, escalations at correct intervals, verification working
- [ ] Evidence upload: encrypted, max 500MB, file integrity verified
- [ ] Internal comments: @mention working, notifications sent
- [ ] Spanish UI: all text in Colombian Spanish, consistent terminology
- [ ] RBAC enforcement: provider_admin isolation, auditor read-only, super_admin full access
- [ ] Docker integration: docker-compose up with all services
- [ ] Load test: 50+ concurrent assessments, <200ms p99 latency
- [ ] Integration test: create provider → assign assessment → submit → generate finding → assign action

---

## Next Phase

Phase 4: Regulatory Data & Integration (Documentary Matrix, REPS/INVIMA API sync)

---

## Key Design Decisions to Preserve in Execution

1. **Event Sourcing:** All state changes immutable, event replay for audit and recovery
2. **Spanish UI:** No English text; all labels, buttons, messages in es_CO
3. **Multi-Location:** Providers can manage multiple locations; compliance tracked per location
4. **Compliance %:** Formula = (C / (C + NC)) * 100; visual semáforo (verde/naranja/rojo)
5. **RBAC:** provider_admin ↔ own provider, auditor → read-only, super_admin → all
6. **Deadline Enforcement:** Soft warning at -3d, hard block after due_date
7. **Risk Scoring:** Auto-calculated 0-100 on assessment submit; high-risk items flagged
8. **Audit Trail:** Every state change logged with user, timestamp, before/after
9. **Bulk Operations:** <5 min for 1000 imports, <2 min for 50 actions

---

*Created: 2026-04-10*  
*Status: PLANNED - Ready for execution with `/gsd-execute-phase 3`*
