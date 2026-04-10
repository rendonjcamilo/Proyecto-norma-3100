# Phase 3 Research Summary

**Project:** Norma 3100 Compliance Management System  
**Phase:** 3 (Core Compliance Workflows)  
**Date:** 2026-04-10  
**Topic:** Compliance Assessment Patterns, Multi-Location Hierarchies, Service Taxonomy

---

## Compliance Assessment Patterns

### Self-Assessment Model (Industry Best Practices)

**Definition:** Provider-conducted assessment using standardized questionnaire to evaluate compliance against regulatory standards. Typically lower-risk assessment compared to audits; used for baseline and periodic tracking.

**Key Components:**
1. **Questionnaire Structure:**
   - Multi-section design (by regulatory area: management, infrastructure, quality, staffing, safety)
   - Progressive disclosure: conditional questions reveal based on prior answers (e.g., "Do you have QA processes?" → if yes, show details)
   - Mixing response types: binary (yes/no), multiple-choice, text explanation, scale-based (1-5 severity)

2. **Risk Scoring Algorithm:**
   - Weighted response scoring: critical answers weighted heavily, minor issues lighter
   - Cumulative scoring: aggregate per section, then overall 0-100 scale
   - Threshold-based flagging: high-risk items (>75) trigger auditor review recommendation
   - Semáforo (traffic light) visualization: Green ≥80%, Yellow 50-79%, Red <50%

3. **Multi-Round Assessment Cycles:**
   - **Initial Assessment:** Baseline compliance evaluation
   - **Mid-Term (6 months):** Check progress on corrective actions, reassess critical areas
   - **Annual:** Comprehensive review, identify trends, plan next year improvements
   - **Version Control:** Each round creates new questionnaire version; prior versions retained for trending

4. **Audit Trail & Versioning:**
   - Immutable response logging: timestamps, user ID, response values (before/after for edits)
   - Question versioning: track question/section changes across rounds (added, modified, deleted)
   - Response history: all edits tracked, audit log shows changes
   - Snapshot mechanism: save full assessment state on submit (for later comparison)

### Application to Norma 3100:

**Norma 3100 Framework** (Colombian health provider regulation):
- Covers ~5 major compliance areas: Management, Infrastructure, Quality, Staffing, Safety
- ~157 sub-services/practices across areas
- Tiered compliance: critical (must have), major (should have), minor (nice to have)

**Self-Assessment Approach:**
- **Section Structure:** 5 sections aligned to Norma 3100 areas
- **Questions:** ~30-40 per section (158 total questionnaire)
- **Response Types:** 
  - Binary: "Do you have [requirement]?" (yes/no)
  - Scale: "Rate your compliance: 1=No evidence, 2=Minimal, 3=Partial, 4=Documented, 5=Optimized"
  - Evidence: "Upload supporting documentation (optional)"
- **Conditional Rules:** If no QA processes (critical), show sub-questions on corrective actions needed
- **Risk Calculation:** Critical no-responses = high risk; scale responses ≥3 = compliant

---

## Multi-Location Hierarchy Model

### Organizational Structure Patterns

**Pattern 1: Independent Multi-Location (No Cascade)**
```
Provider (holding company/legal entity)
├── Location A (hospital, clinic, etc.)
│   ├── Compliance %: X%
│   ├── Services: [list]
│   └── Assessments: [independent]
├── Location B (satellite clinic)
│   ├── Compliance %: Y%
│   ├── Services: [list]
│   └── Assessments: [independent]
└── Location C (corporate office)
    ├── Compliance %: Z%
    ├── Services: [none - admin only]
    └── Assessments: [not required]
```

**Benefits:**
- Flexible: each location assessed independently
- Scalable: add/remove locations without affecting others
- Simple: no complex cascade logic
- Realistic: different locations often have different compliance levels

**Challenges:**
- Reporting: how to aggregate provider-level compliance? (average? worst? best?)
- Policies: do corporate policies apply to all locations? (often yes)

**Solution for Phase 3:**
- Implement independent location model (no cascade v1)
- Location-level assessments: each location completes own assessment
- Provider-level compliance: aggregate as average or rolled-up worst-case (TBD with Adriana)
- Policy documents: attach to provider (applies to all locations) or location (specific)

**Pattern 2: Parent-Subsidiary Cascade (For Phase 4+)**
```
Parent Provider (main entity, must-meet requirements)
├── Must-meet requirements: 100% compliance
├── Subsidiary A (acquired company)
│   ├── Inherits parent requirements + own
│   ├── Compliance: must ≥ parent level
│   └── Failure impact: parent shares liability
└── Subsidiary B
    ├── Inherits parent requirements + own
    ├── Compliance: must ≥ parent level
    └── Failure impact: parent shares liability
```

**Phase 3 Decision:** Implement parent_id nullable field in provider table; defer cascade logic to Phase 4 (when Adriana clarifies policy impact).

---

## Service Taxonomy Design (157 Norma 3100 Services)

### Norma 3100 Service Groups (5 Categories)

Based on Colombian health regulation framework:

**Group 1: Management (30 services)**
- Governance structure
- Quality policy and objectives
- Risk management
- Compliance procedures
- Documentation and records management
- Incident reporting and management
- Internal audit procedures
- Management review and corrective action
- Stakeholder communication
- Budget and financial controls
- [Additional 20 services across management domains]

**Group 2: Infrastructure & Operations (35 services)**
- Facility design and maintenance
- Infection control procedures
- Equipment maintenance and validation
- Utilities (power, water, HVAC)
- Waste management
- Cleaning and sanitization protocols
- Safety systems (fire, emergency)
- Supply chain management
- Technology systems and cybersecurity
- [Additional 26 services]

**Group 3: Quality Assurance (32 services)**
- Quality planning and design
- Process validation
- Performance monitoring and metrics
- Service delivery standards
- Patient safety procedures
- Adverse event management
- Complaint handling
- Continuous improvement processes
- Quality training programs
- [Additional 23 services]

**Group 4: Staffing & Competency (35 services)**
- Role definitions and responsibilities
- Recruitment and onboarding
- Competency assessment
- Training and development programs
- Performance evaluation
- Continuing education (CE)
- Credentialing and licensing verification
- Disciplinary procedures
- Staff health and wellness
- [Additional 26 services]

**Group 5: Safety & Compliance (25 services)**
- Emergency preparedness
- Incident prevention
- Occupational health and safety
- Chemical and hazardous material management
- Regulatory compliance monitoring
- Data protection and privacy
- Confidentiality agreements
- Succession planning
- Vendor management
- [Additional 16 services]

### Service Catalog Model

**Service Attributes:**
- `id`: Unique service code (e.g., "MGMT-001", "INFRA-015")
- `name`: Service name (Spanish: "Procedimiento de Control de Infecciones")
- `category`: Group (1-5 per above)
- `description`: Detailed explanation of compliance requirement
- `criticality`: Level (critical, major, minor) — impacts compliance weight
- `evidence_types`: Expected documentation (e.g., policy, procedure, training records)
- `frequency`: Assessment frequency (annual, biennial, on-change)

**Service-Provider Mapping:**
- Each location can offer subset of services (not all 157 required)
- Mapping captures: assigned_date, status (active/inactive), compliance_pct (if assessed)
- Enables targeted assessments: only assess services offered by location

**Assessment Questions per Service:**
- Questionnaire includes 2-3 questions per service (not per group)
- Example service: "Infection Control"
  - Q1: "Do you have documented infection control procedures?" (yes/no)
  - Q2: "Rate staff training on infection control (1-5 scale)"
  - Q3: "Provide evidence of last infection control audit"
- Allows granular risk scoring per service

### Implementation Approach

**Phase 3 Task 1:** Seed service catalog with 157 services
- Create SQL seed script with all 157 services, categories, descriptions
- Use provider test data to validate service assignments
- Share with Adriana for validation (ensure alignment to actual Norma 3100)

**Phase 3 Task 4:** Map questionnaire questions to services
- Build questionnaire with 5 sections (one per group)
- Within each section, organize questions by service (3-4 q's per service)
- Enable filtering: "Show questions for Service X only"

---

## Event Sourcing for Compliance Workflows

### Event Types for Phase 3

**Provider Events:**
- `provider.created`: New provider registered
- `provider.updated`: Provider metadata changed
- `provider.status_changed`: Status transition (active/suspended/revoked)
- `provider.archived`: Soft delete (marked inactive)

**Location Events:**
- `location.created`: New location added
- `location.updated`: Location data changed
- `location.status_changed`: Location status changed
- `location.archived`: Location soft delete

**Service Assignment Events:**
- `service.assigned_to_location`: Service activated for location
- `service.capacity_updated`: Capacity limits adjusted
- `service.deactivated`: Service deactivated

**Assessment Events:**
- `assessment.created`: Assessment assigned to provider
- `assessment.submitted`: Responses submitted, risk score calculated
- `assessment.response_recorded`: Individual response saved
- `assessment.approved`: Auditor reviewed and approved

**Finding Events:**
- `finding.created`: New finding recorded
- `finding.categorized`: Severity and category assigned
- `finding.status_changed`: Finding status change

**Action Events:**
- `action.created`: Corrective action assigned
- `action.status_changed`: Action state transition
- `action.evidence_uploaded`: Evidence file attached
- `action.verified`: Auditor approved action

### Event Storage & Replay

**Event Table Schema:**
```sql
events (
  id UUID PRIMARY KEY,
  aggregate_type VARCHAR(50),  -- 'provider', 'assessment', 'finding', 'action'
  aggregate_id UUID,           -- provider_id, assessment_id, finding_id, action_id
  event_type VARCHAR(50),      -- 'created', 'status_changed', etc.
  event_data JSONB,            -- full event payload (before, after, user_id, timestamp)
  created_at TIMESTAMP,
  created_by UUID,             -- user_id
  version INT                  -- event version number for that aggregate
);
```

**Replay Mechanism:**
- Reconstruct provider state: query events for aggregate_id, apply in order, derive current state
- Example: `SELECT * FROM events WHERE aggregate_id = provider_123 ORDER BY version`
  - Event 1: provider.created → state = {id: 123, name: 'Clinic X', status: 'active'}
  - Event 2: provider.status_changed (suspended) → state.status = 'suspended'
  - Event 3: provider.status_changed (active) → state.status = 'active'
  - Result: provider is currently 'active', with full audit trail

**Audit Benefits:**
- Immutability: no event updates/deletes, only appends
- Tamper detection: hash-chain events, detect missing/altered events
- Compliance trail: all changes and user accountability
- Recovery: replay events to specific point in time for forensics

---

## Cumulative Compliance % Calculation

### Formula per Standard/Service Group

**Metric:** Compliance percentage across all questions in a group

**Formula:**
```
Compliance % = (C / (C + NC)) × 100

where:
  C = Number of compliant responses (yes, scale ≥3, evidence provided)
  NC = Number of non-compliant responses (no, scale <3, no evidence)
  Missing/Skipped = Treated as non-compliant (conservative)
```

**Example (Management Group, 10 questions):**
- Q1-3 (management structure): answered "Yes" → C=3
- Q4-5 (policy): answered "Documented" (scale 4-5) → C=2
- Q6-8 (procedures): answered "No" or "Minimal" (scale 1-2) → NC=3
- Q9-10 (audit): not answered → NC=2

Calculation:
- C = 5, NC = 5
- Compliance % = (5 / 10) × 100 = 50%
- Semáforo: Orange (50-79%)

### Semáforo (Traffic Light) Thresholds

| Range | Color | Status | Action |
|-------|-------|--------|--------|
| ≥80% | Verde (Green) | Compliant | No action needed |
| 50-79% | Naranja (Orange) | At Risk | Plan improvements, assign corrective actions |
| <50% | Rojo (Red) | Non-Compliant | Immediate audit, escalate, enforce corrective action |

### Application in Phase 3

**Assessment Submission:**
1. User submits assessment (all questions answered or flagged as N/A)
2. System auto-calculates compliance % per group and overall
3. Compare to semáforo thresholds
4. If red or critical questions answered "no", auto-flag for auditor review
5. Generate risk score (0-100): weighted aggregate of group compliance %s

**Reporting (Phase 5):**
- Dashboard: compliance % heatmap (providers vs. groups)
- Trends: compliance % over time (assessment rounds)
- Actions: identify groups/providers in red, prioritize corrective actions

---

## Implementation Recommendations for Phase 3

1. **Start Simple:** Begin with independent locations (no cascade), independent assessments
   - Defer parent-subsidiary cascade logic to Phase 4
   - Implement parent_id field but don't enforce cascade rules yet
   
2. **Service Taxonomy Validation:**
   - Coordinate with Adriana (SME) before finalizing 157 services
   - Validate mapping to actual Norma 3100 requirements
   - Adjust categorization if needed (may be 4 or 6 groups instead of 5)

3. **Questionnaire Complexity:**
   - Start with 40-50 questions (not full 158)
   - Add conditional logic gradually
   - Test with small pilot (2-3 providers) before full rollout

4. **Risk Scoring Algorithm:**
   - Implement simple formula first: (C / (C + NC)) × 100
   - Add weighted scoring in Phase 5 if needed
   - Validate algorithm with Adriana against Norma 3100 compliance expectations

5. **Event Sourcing:**
   - Leverage Phase 1 framework; keep events simple
   - Don't over-engineer: focus on audit trail, not complex event analysis
   - Add event versioning/evolution strategy for future questionnaire changes

6. **Performance Optimization:**
   - Batch insert for bulk operations (1000 records)
   - Index on frequently queried fields: provider_id, location_id, assessment_id, created_at
   - Cache compliance % calculations (update on assessment submit, not on every read)

---

## References & Sources

**Norma 3100 (Colombian Health Regulation):**
- Official document: Ministry of Social Protection (MinSalud) Colombia
- Primary domains: Governance, Infrastructure, Quality, Staffing, Safety
- ~157 practices across domains (to be validated with Adriana)

**Compliance Assessment Best Practices:**
- Health Services Accreditation standards (JCI, AAHC)
- ISO 9001 audit cycle patterns (initial, follow-up, recertification)
- Risk-based assessment: prioritize high-risk areas

**Event Sourcing Patterns:**
- Martin Fowler's Event Sourcing architecture guide
- PostgreSQL JSONB for event payload storage
- Event versioning and schema evolution strategies

**Multi-Location Models:**
- Hospital networks and clinic chains
- Subsidiary management and compliance inheritance
- Location-specific vs. provider-wide policies

---

*Research compiled: 2026-04-10*  
*Status: Informational - Supports Phase 3 planning and execution*
