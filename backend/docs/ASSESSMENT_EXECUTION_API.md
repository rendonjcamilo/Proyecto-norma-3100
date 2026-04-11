# Norma 3100 Assessment Execution API

## Overview

The Assessment Execution API implements the complete assessment lifecycle:
1. Provider creates assessment instance (selects service to assess)
2. System loads published questionnaire for that service
3. Provider fills questionnaire with responses (C, NC, NA)
4. System calculates compliance scores in real-time
5. Provider submits assessment
6. System auto-generates findings for NC criteria

---

## Assessment Lifecycle

```
1. CREATE Assessment Instance
   ├─ Provider selects service
   ├─ System loads published questionnaire
   ├─ Assessment created with status: in_progress
   └─ Provider assigned as assessor

2. EXECUTE Assessment (Provider fills form)
   ├─ Load assessment with questionnaire criteria
   ├─ For each criterion: C/NC/NA
   ├─ If NC: capture description (required)
   ├─ If C/NA: optional comment
   ├─ Auto-save every 30s
   ├─ Calculate compliance % in real-time
   └─ Show semáforo (verde/naranja/rojo)

3. SUBMIT Assessment
   ├─ Validate all criteria answered (except NA)
   ├─ Calculate final scores
   ├─ Auto-create findings from NC responses
   ├─ Lock assessment (no edits allowed)
   └─ Status: submitted

4. REVIEW & GENERATE CORRECTIVE ACTIONS
   └─ Auditor/Provider reviews findings (Task 6)
```

---

## Data Model

### Assessment Instance

```sql
assessments {
  id: UUID PRIMARY KEY
  provider_id: UUID NOT NULL (FK users)
  location_id: UUID (FK provider_locations)
  service_id: UUID NOT NULL (FK services)
  questionnaire_id: UUID NOT NULL (FK questionnaires)
  assessment_version: VARCHAR(50) -- initial, year4, annual, pre-novelty
  status: VARCHAR(50) -- in_progress, submitted, locked
  started_date: TIMESTAMP
  started_by: UUID (user_id)
  submitted_date: TIMESTAMP
  submitted_by: UUID (user_id)
  compliance_percent: DECIMAL(5,2)
  semaforo_color: VARCHAR(20) -- verde, naranja, rojo
  hallazgos_generated: BOOLEAN DEFAULT FALSE
}
```

### Assessment Responses (Individual criterion answers)

```sql
assessment_responses_detailed {
  id: UUID PRIMARY KEY
  assessment_id: UUID NOT NULL (FK assessments)
  criterion_id: UUID NOT NULL (FK evaluation_criteria)
  response_status: VARCHAR(2) -- C, NC, NA
  description: TEXT -- Required for NC, optional for C/NA
  comments: TEXT
  evidence_file_ids: JSONB -- Array of file UUIDs
  responded_date: TIMESTAMP
  responded_by: UUID (user_id)
  updated_at: TIMESTAMP
  UNIQUE(assessment_id, criterion_id)
}
```

### Assessment Metrics (Cached compliance scores)

```sql
assessment_metrics {
  id: UUID PRIMARY KEY
  assessment_id: UUID NOT NULL UNIQUE (FK assessments)
  total_criteria: INT
  cumple_count: INT
  no_cumple_count: INT
  no_aplica_count: INT
  compliance_percent: DECIMAL(5,2)
  semaforo_color: VARCHAR(20)
  per_standard_metrics: JSONB -- [{standardId, percent, color}]
  calculated_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

### Per-Standard Compliance Breakdown

```sql
standard_compliance_breakdown {
  id: UUID PRIMARY KEY
  assessment_id: UUID NOT NULL (FK assessments)
  standard_id: UUID NOT NULL (FK evaluation_standards)
  total_criteria: INT
  cumple_count: INT
  no_cumple_count: INT
  no_aplica_count: INT
  compliance_percent: DECIMAL(5,2)
  calculated_at: TIMESTAMP
}
```

### Auto-Generated Findings

```sql
findings {
  id: UUID PRIMARY KEY
  assessment_id: UUID (FK assessments) -- NEW in Task 5
  assessment_response_id: UUID (FK assessment_responses_detailed) -- NEW
  criterion_id: UUID (FK evaluation_criteria)
  finding_type: VARCHAR(50) -- "assessment"
  status: VARCHAR(50) -- abierta, en_proceso, cerrada
  severity: VARCHAR(50) -- baja, media, alta, crítica
  description: TEXT
  provider_id: UUID NOT NULL (FK providers)
  service_id: UUID NOT NULL (FK services)
  semaforo_color: VARCHAR(20) -- verde, naranja, rojo
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

### Event Sourcing

```sql
assessment_events {
  id: UUID PRIMARY KEY
  assessment_id: UUID NOT NULL (FK assessments)
  event_type: VARCHAR(100) -- assessment.created, assessment.submitted, etc.
  description: TEXT
  payload: JSONB
  created_by: UUID (user_id)
  created_at: TIMESTAMP
}
```

---

## API Endpoints (12 Total)

### 1. POST /api/assessments - Create Assessment Instance

Create new assessment for a service.

**Request:**
```http
POST /api/assessments
Authorization: Bearer {token}
Content-Type: application/json

{
  "providerId": "550e8400-e29b-41d4-a716-446655440000",
  "locationId": "550e8400-e29b-41d4-a716-446655440001",
  "serviceId": "550e8400-e29b-41d4-a716-446655440002",
  "assessmentVersion": "initial"
}
```

**Response (201):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "providerId": "550e8400-e29b-41d4-a716-446655440000",
    "locationId": "550e8400-e29b-41d4-a716-446655440001",
    "serviceId": "550e8400-e29b-41d4-a716-446655440002",
    "questionnaireId": "550e8400-e29b-41d4-a716-446655440004",
    "assessmentVersion": "initial",
    "status": "in_progress",
    "startedDate": "2026-04-10T20:56:09Z",
    "startedBy": "550e8400-e29b-41d4-a716-446655440005",
    "compliancePercent": 0.0,
    "semaforo": "rojo"
  },
  "message": "Assessment created successfully"
}
```

**RBAC:**
- ✅ provider_admin: own provider only
- ✅ super_admin: any provider
- ❌ auditor: read-only

**Errors:**
- 400: serviceId and assessmentVersion required
- 400: Invalid assessmentVersion
- 404: Service not found
- 404: No published questionnaire found
- 403: Access denied

---

### 2. GET /api/assessments - List Assessments

List assessments with pagination and filters.

**Request:**
```http
GET /api/assessments?providerId=...&serviceId=...&status=in_progress&limit=20&offset=0
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "providerId": "550e8400-e29b-41d4-a716-446655440000",
      "serviceId": "550e8400-e29b-41d4-a716-446655440002",
      "status": "in_progress",
      "compliancePercent": 45.5,
      "semaforo": "naranja",
      "startedDate": "2026-04-10T20:56:09Z"
    }
  ],
  "total": 1,
  "count": 1,
  "limit": 20,
  "offset": 0
}
```

**Filters:**
- providerId: Filter by provider (provider_admin auto-filtered to own)
- serviceId: Filter by service
- status: in_progress, submitted, locked
- startDate, endDate: Date range

**RBAC:**
- provider_admin: See own provider only
- auditor: See all
- super_admin: See all

---

### 3. GET /api/assessments/:id - Get Assessment with Responses

Get assessment with all responses and metrics.

**Request:**
```http
GET /api/assessments/550e8400-e29b-41d4-a716-446655440003
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "providerId": "550e8400-e29b-41d4-a716-446655440000",
    "serviceId": "550e8400-e29b-41d4-a716-446655440002",
    "questionnaireId": "550e8400-e29b-41d4-a716-446655440004",
    "assessmentVersion": "initial",
    "status": "in_progress",
    "startedDate": "2026-04-10T20:56:09Z",
    "compliancePercent": 45.5,
    "semaforo": "naranja",
    "responses": [
      {
        "criterionId": "crit-001",
        "status": "C",
        "description": null,
        "comments": "Verified in office",
        "respondedDate": "2026-04-10T21:00:00Z",
        "respondedBy": "550e8400-e29b-41d4-a716-446655440005"
      },
      {
        "criterionId": "crit-002",
        "status": "NC",
        "description": "Manual needs update by June",
        "comments": null,
        "respondedDate": "2026-04-10T21:01:00Z",
        "respondedBy": "550e8400-e29b-41d4-a716-446655440005"
      }
    ],
    "metrics": {
      "totalCriteria": 25,
      "cumple": 10,
      "noCumple": 5,
      "noAplica": 10,
      "compliancePercent": 66.67,
      "semaforo": "naranja",
      "perStandardMetrics": [
        {
          "standardId": "std-001",
          "standardCode": "T-01",
          "standardName": "Dirección y Gestión",
          "totalCriteria": 3,
          "cumple": 2,
          "noCumple": 1,
          "noAplica": 0,
          "compliancePercent": 66.67
        }
      ]
    }
  }
}
```

---

### 4. PUT /api/assessments/:id - Save Response(s) / Update Draft

Save single or batch responses. Auto-calculates compliance % in real-time.

**Request:**
```http
PUT /api/assessments/550e8400-e29b-41d4-a716-446655440003
Authorization: Bearer {token}
Content-Type: application/json

{
  "responses": [
    {
      "criterionId": "crit-001",
      "status": "C",
      "comments": "Verified in office"
    },
    {
      "criterionId": "crit-002",
      "status": "NC",
      "description": "Manual needs update by June",
      "comments": "Will be corrected in Q2"
    }
  ]
}
```

**Response (200):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "status": "in_progress",
    "compliancePercent": 66.67,
    "semaforo": "naranja"
  },
  "message": "2 response(s) recorded successfully"
}
```

**Validation:**
- status must be C, NC, or NA
- If NC: description required (min 10 chars)
- assessment.status must be in_progress
- cannot edit after submitted

**RBAC:**
- provider_admin: own provider only
- super_admin: any provider
- ❌ auditor: read-only

**Events:**
- assessment.response_updated

---

### 5. POST /api/assessments/:id/submit - Submit Assessment

Submit assessment as complete. Locks against edits. Auto-generates findings from NC responses.

**Request:**
```http
POST /api/assessments/550e8400-e29b-41d4-a716-446655440003/submit
Authorization: Bearer {token}
Content-Type: application/json
```

**Response (200):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "status": "submitted",
    "submittedDate": "2026-04-10T22:00:00Z",
    "submittedBy": "550e8400-e29b-41d4-a716-446655440005",
    "compliancePercent": 66.67,
    "semaforo": "naranja",
    "hallazgosGenerated": true
  },
  "message": "Assessment submitted successfully"
}
```

**Validation:**
- assessment.status must be in_progress
- all criteria must be answered (except NA)

**Side Effects:**
- Creates finding for each NC response
- Sets status to submitted (immutable after)
- Calculates final scores
- Emits assessment.submitted event
- Emits finding.created event for each NC

**RBAC:**
- provider_admin: own provider only
- super_admin: any provider
- ❌ auditor: read-only

---

### 6. DELETE /api/assessments/:id - Delete Assessment (Soft Delete)

Soft delete (archive) assessment.

**Request:**
```http
DELETE /api/assessments/550e8400-e29b-41d4-a716-446655440003
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Assessment deleted successfully"
}
```

**Note:** Soft delete for audit trail preservation

---

### 7. GET /api/assessments/:id/metrics - Get Compliance Metrics

Get calculated metrics (scores, breakdown, per-standard).

**Request:**
```http
GET /api/assessments/550e8400-e29b-41d4-a716-446655440003/metrics
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "data": {
    "totalCriteria": 25,
    "cumple": 16,
    "noCumple": 9,
    "noAplica": 0,
    "compliancePercent": 64.0,
    "semaforo": "naranja",
    "perStandardMetrics": [
      {
        "standardId": "std-001",
        "standardCode": "T-01",
        "standardName": "Dirección y Gestión",
        "totalCriteria": 3,
        "cumple": 3,
        "noCumple": 0,
        "noAplica": 0,
        "compliancePercent": 100.0
      },
      {
        "standardId": "std-002",
        "standardCode": "T-02",
        "standardName": "Planeación",
        "totalCriteria": 4,
        "cumple": 2,
        "noCumple": 2,
        "noAplica": 0,
        "compliancePercent": 50.0
      }
    ]
  }
}
```

---

### 8. GET /api/assessments/:id/scores - Get Scores Summary

Quick scores summary with semáforo colors.

**Request:**
```http
GET /api/assessments/550e8400-e29b-41d4-a716-446655440003/scores
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "data": {
    "overallPercentage": 64.0,
    "semaforo": "naranja",
    "standards": [
      {
        "name": "Dirección y Gestión",
        "percent": 100.0,
        "color": "verde"
      },
      {
        "name": "Planeación",
        "percent": 50.0,
        "color": "rojo"
      }
    ],
    "hallazgosCount": 9
  }
}
```

---

### 9. GET /api/assessments/:id/scores/summary - Quick Summary

Very quick summary for dashboards.

**Request:**
```http
GET /api/assessments/550e8400-e29b-41d4-a716-446655440003/scores/summary
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "data": {
    "overallPercentage": 64.0,
    "semaforo": "naranja",
    "hallazgosCount": 9
  }
}
```

---

### 10. POST /api/assessments/:id/export - Export Assessment

Export assessment as PDF report (placeholder for Phase 5).

**Request:**
```http
POST /api/assessments/550e8400-e29b-41d4-a716-446655440003/export
Authorization: Bearer {token}
Content-Type: application/json

{
  "format": "pdf"
}
```

**Response (202):**
```json
{
  "data": {
    "exportId": "export-550e8400-e29b-41d4-a716-446655440003",
    "format": "pdf",
    "status": "pending",
    "message": "Export scheduled - available in Phase 5 (Reporting)"
  }
}
```

---

### 11. GET /api/assessments/:id/hallazgos - Get NC Findings

Get list of NC findings generated from assessment.

**Request:**
```http
GET /api/assessments/550e8400-e29b-41d4-a716-446655440003/hallazgos
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "finding-001",
      "assessmentId": "550e8400-e29b-41d4-a716-446655440003",
      "criterionId": "crit-002",
      "status": "abierta",
      "severity": "media",
      "description": "CX-T01-002: Manual needs update by June",
      "createdAt": "2026-04-10T22:00:00Z"
    }
  ],
  "count": 9
}
```

---

### 12. GET /api/assessments/provider/:providerId/summary - Provider Summary

Summary of all provider assessments (latest version per service).

**Request:**
```http
GET /api/assessments/provider/550e8400-e29b-41d4-a716-446655440000/summary
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "data": [
    {
      "serviceId": "550e8400-e29b-41d4-a716-446655440002",
      "serviceCode": "CX-01",
      "serviceName": "Consulta Externa",
      "status": "submitted",
      "compliancePercent": 64.0,
      "semaforo": "naranja",
      "assessmentVersion": "initial",
      "submittedDate": "2026-04-10T22:00:00Z"
    },
    {
      "serviceId": "550e8400-e29b-41d4-a716-446655440010",
      "serviceCode": "EM-01",
      "serviceName": "Emergencias",
      "status": "in_progress",
      "compliancePercent": 45.0,
      "semaforo": "rojo",
      "assessmentVersion": "initial",
      "submittedDate": null
    }
  ],
  "count": 2
}
```

**RBAC:**
- provider_admin: own provider only
- auditor: all
- super_admin: all

---

## Compliance Score Calculation

**Formula:**
```
Compliance % = (C / (C + NC)) × 100

Where:
- C = Cumple (compliant)
- NC = No Cumple (non-compliant)
- NA = No Aplica (not applicable) - EXCLUDED from calculation
```

**Examples:**
- 10 C, 5 NC = (10 / 15) × 100 = 66.67%
- 15 C, 5 NC = (15 / 20) × 100 = 75%
- 20 C, 0 NC = (20 / 20) × 100 = 100%
- 0 C, 5 NC = (0 / 5) × 100 = 0%

**Semáforo Colors:**
- Verde (Green): ≥ 80%
- Naranja (Yellow): 50% to 79%
- Rojo (Red): < 50%

**Per-Standard Calculation:**
Same formula applied to each standard independently:
- Count C and NC for each standard
- Calculate % per standard
- Aggregate for overall %

---

## Hallazgo (Finding) Auto-Generation

When assessment is submitted, system auto-creates finding for each NC response:

```
For each NC response:
1. Create finding with:
   - title: criterion.question_text
   - description: assessment_response.description
   - standard_id: criterion.standard_id
   - status: "abierta" (open)
   - severity: auto-calculated from:
     * Transversal + Complex = crítica
     * Transversal + Medium = alta
     * Service-specific + Complex = alta
     * Service-specific + Medium/Simple = media
2. Link to assessment and criterion
3. Emit finding.created event
```

Findings are then used in Task 6 (Corrective Action Planning) to create action items.

---

## Event Sourcing

All assessment operations emit immutable events:

```json
{
  "id": "event-uuid",
  "assessment_id": "assessment-uuid",
  "event_type": "assessment.created",
  "description": "Assessment created for service CX-01",
  "payload": {
    "assessment_version": "initial",
    "total_criteria": 25
  },
  "created_by": "user-uuid",
  "created_at": "2026-04-10T20:56:09Z"
}
```

**Event Types:**
- `assessment.created` - Assessment instance created
- `assessment.response_updated` - Responses saved/updated
- `assessment.submitted` - Assessment completed and submitted
- `assessment.scoring_calculated` - Scores computed
- `finding.created` - Finding auto-generated from NC

---

## RBAC Matrix

| Operation | super_admin | auditor | provider_admin |
|-----------|-------------|---------|----------------|
| Create assessment | ✅ | ❌ | ✅ (own provider) |
| View assessments | ✅ | ✅ (all) | ✅ (own provider) |
| Record responses | ✅ | ❌ | ✅ (own assessment) |
| Submit assessment | ✅ | ❌ | ✅ (own assessment) |
| View metrics | ✅ | ✅ (all) | ✅ (own assessment) |
| Export assessment | ✅ | ✅ (all) | ✅ (own assessment) |

---

## Error Handling (Spanish Messages)

| Status | Message |
|--------|---------|
| 400 | serviceId y assessmentVersion son requeridos |
| 400 | assessmentVersion debe ser: initial, year4, annual, o pre-novelty |
| 400 | Status debe ser C (Cumple), NC (No Cumple), o NA (No Aplica) |
| 400 | Descripción requerida para respuestas NC (No Cumple) |
| 400 | responses array is required |
| 404 | Assessment not found |
| 404 | Service not found |
| 404 | No published questionnaire found |
| 403 | Access denied |
| 500 | Internal server error |

---

## Performance Targets

- Create assessment: < 100ms
- Get assessment with responses: < 150ms
- Record response(s): < 100ms (auto-save)
- Calculate compliance: < 50ms
- Submit assessment with finding generation: < 200ms
- List assessments: < 100ms

---

## Example Workflow

### Step 1: Create Assessment

```bash
curl -X POST http://localhost:3001/api/assessments \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "providerId": "provider-uuid",
    "serviceId": "service-uuid",
    "assessmentVersion": "initial"
  }'
# Returns: assessment.id
```

### Step 2: Get Assessment Form

```bash
curl http://localhost:3001/api/assessments/{assessment-id} \
  -H "Authorization: Bearer {token}"
# Returns: assessment with questionnaire criteria
```

### Step 3: Auto-Save Response (every 30s)

```bash
curl -X PUT http://localhost:3001/api/assessments/{assessment-id} \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "responses": [
      {
        "criterionId": "crit-001",
        "status": "C",
        "comments": "Verified"
      }
    ]
  }'
```

### Step 4: Get Live Compliance %

```bash
curl http://localhost:3001/api/assessments/{assessment-id}/metrics \
  -H "Authorization: Bearer {token}"
# Returns: current compliance %, semáforo, per-standard breakdown
```

### Step 5: Submit Assessment

```bash
curl -X POST http://localhost:3001/api/assessments/{assessment-id}/submit \
  -H "Authorization: Bearer {token}"
# Returns: assessment status=submitted, hallazgos_generated=true
```

### Step 6: Get Findings for Corrective Actions

```bash
curl http://localhost:3001/api/assessments/{assessment-id}/hallazgos \
  -H "Authorization: Bearer {token}"
# Returns: list of NC findings for Task 6 (Findings Creation)
```

---

## Implementation Notes

- **Database:** PostgreSQL 14+
- **Auth:** JWT Bearer token (via authMiddleware)
- **Transactions:** Used for assessment submission to ensure atomicity
- **Error Handling:** Spanish error messages for provider UX
- **Localization:** All labels in Spanish (es_CO)
- **Event Store:** All operations logged to assessment_events table
- **Performance:** Cached metrics for fast retrieval

---

## References

- Norma 3100 Compliance Standard
- Phase 3 Task 5 PLAN.md
- Backend: `backend/src/services/AssessmentService.ts`
- Routes: `backend/src/routes/assessments.routes.ts`
- Schema: `backend/db/assessment-execution-schema.sql`
