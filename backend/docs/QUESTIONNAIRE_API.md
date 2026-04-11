# Norma 3100 Assessment Questionnaire API

## Overview

The Questionnaire API implements a comprehensive assessment framework aligned with Norma 3100 compliance standards. It provides:

- **Questionnaire CRUD** with version management (initial, year4, annual, pre-novelty)
- **Criteria Management** (40-80 per service: 7 transversales + 5-25 specific)
- **Conditional Logic** (if criterion is NC, show dependent criteria)
- **Compliance Scoring** (C / (C + NC) * 100, with semáforo status)
- **Event Sourcing** (all operations immutably logged for audit trail)
- **RBAC Enforcement** (super_admin creates, auditor views, provider_admin views own)

---

## Data Model

### Evaluation Standards

```
evaluation_standards {
  id: UUID
  code: string              // e.g., "T-01" (transversal) or "CX-01" (Consulta Externa)
  name: string
  description: text
  is_transversal: boolean   // TRUE for 7 standards, FALSE for service-specific
  service_id: UUID          // NULL if transversal, service ID if specific
  category: string          // Gestión, Personal, Seguridad, etc.
  status: "active" | "archived"
}
```

**Transversales (7 per Norma 3100):**
- T-01: Dirección y Gestión
- T-02: Planeación
- T-03: Talento Humano
- T-04: Seguridad del Paciente
- T-05: Tecnología de Información
- T-06: Documentación Clínica
- T-07: Gestión de Riesgos

### Evaluation Criteria

```
evaluation_criteria {
  id: UUID
  code: string              // e.g., "CX-T01-001" (service + standard + number)
  number: string            // e.g., "1.1", "1.2", "2.1"
  name: string
  description: text
  evidence_requirement: text  // What proof is needed
  complexity: "simple" | "medium" | "complex"
  standard_id: UUID         // FK to evaluation_standards
  service_id: UUID          // FK to services
  is_mandatory: boolean
  status: "active" | "archived"
}
```

**Per Service:**
- 7 transversales (same for all)
- 5-25 service-specific
- Total: 12-32 criteria per service (typically 25-30)
- System total: 600+ criteria across 157 services

### Questionnaires (Versioned Snapshots)

```
questionnaires {
  id: UUID
  name: string
  service_id: UUID
  version_type: "initial" | "year4" | "annual" | "pre-novelty"
  status: "draft" | "published" | "archived"
  total_criteria: int
  created_by: UUID
  created_at: timestamp
  published_at: timestamp
}
```

**Versioning Strategy:**
- `initial`: First-time provider assessment
- `year4`: Full re-evaluation at year 4 renewal
- `annual`: Annual check-in assessment
- `pre-novelty`: Before registering new service

### Assessment Responses

```
assessment_criteria_responses {
  id: UUID
  assessment_id: UUID
  criterion_id: UUID
  value: "C" | "NC" | "NA"  // Compliant, Non-Compliant, Not Applicable
  notes: text
  evidence_references: string[]  // Document paths/IDs
  answered_by: UUID
  answered_at: timestamp
}
```

### Conditional Logic

```
criteria_conditional_logic {
  id: UUID
  criterion_id: UUID        // Source criterion
  dependent_criterion_id: UUID  // Criterion to show if source is NC
  condition_type: "if_not_compliant" | "if_compliant"
  description: text
}
```

---

## API Endpoints

### 1. Create Questionnaire

```http
POST /api/assessments/questionnaires
Authorization: Bearer {token}
Content-Type: application/json
X-User-Role: super_admin

{
  "serviceId": "550e8400-e29b-41d4-a716-446655440000",
  "version": "initial"  // or "year4", "annual", "pre-novelty"
}
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Consulta Externa - initial Assessment",
    "service_id": "550e8400-e29b-41d4-a716-446655440000",
    "version": "initial",
    "status": "published",
    "total_criteria": 25,
    "created_by": "550e8400-e29b-41d4-a716-446655440002",
    "created_at": "2026-04-10T20:56:09Z",
    "published_at": "2026-04-10T20:56:09Z"
  },
  "message": "Questionnaire created with 25 criteria"
}
```

**RBAC:**
- ✅ super_admin: create
- ❌ auditor: read-only
- ❌ provider_admin: read-only

**Events:**
- `questionnaire.created` (logged to events table)

**Error Responses:**
- `400`: Invalid version or missing serviceId
- `409`: Duplicate questionnaire for service+version
- `404`: Service not found
- `403`: Insufficient permissions

---

### 2. Get Questionnaire Detail

```http
GET /api/assessments/questionnaires/{questionnaireId}
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Consulta Externa - initial Assessment",
    "service_id": "550e8400-e29b-41d4-a716-446655440000",
    "version": "initial",
    "status": "published",
    "total_criteria": 25,
    "created_by": "550e8400-e29b-41d4-a716-446655440002",
    "created_at": "2026-04-10T20:56:09Z",
    "published_at": "2026-04-10T20:56:09Z",
    "standards": [
      {
        "id": "std-001",
        "code": "T-01",
        "name": "Dirección y Gestión",
        "description": "Aspectos de Dirección, Gestión Administrativa y Financiera",
        "is_transversal": true,
        "criteria": [
          {
            "id": "crit-001",
            "code": "CX-T01-001",
            "number": "1.1",
            "name": "Definición de metas y objetivos",
            "description": "La organización debe tener documentada la misión, visión y objetivos estratégicos",
            "evidence_requirement": "Documento de Política de Gestión Administrativa",
            "complexity": "simple",
            "is_mandatory": true
          },
          // ... more criteria
        ]
      },
      // ... more standards (T-02 through T-07, then service-specific)
    ]
  }
}
```

---

### 3. Update Questionnaire

```http
PUT /api/assessments/questionnaires/{questionnaireId}
Authorization: Bearer {token}
Content-Type: application/json
X-User-Role: super_admin

{
  "name": "Updated Questionnaire Name",
  "status": "archived"
}
```

**Response (200 OK):**
```json
{
  "data": { /* updated questionnaire */ },
  "message": "Questionnaire updated"
}
```

**RBAC:** super_admin only

**Events:** `questionnaire.updated`

---

### 4. Delete Questionnaire (Soft Delete/Archive)

```http
DELETE /api/assessments/questionnaires/{questionnaireId}
Authorization: Bearer {token}
X-User-Role: super_admin
```

**Response (200 OK):**
```json
{
  "message": "Questionnaire archived"
}
```

**Note:** Soft delete (status = 'archived'), data retained for audit trail

**RBAC:** super_admin only

**Events:** `questionnaire.archived`

---

### 5. List Questionnaires by Service

```http
GET /api/assessments/services/{serviceId}/questionnaires
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Consulta Externa - initial Assessment",
      "service_id": "550e8400-e29b-41d4-a716-446655440000",
      "version": "initial",
      "status": "published",
      "total_criteria": 25,
      "created_by": "550e8400-e29b-41d4-a716-446655440002",
      "created_at": "2026-04-10T20:56:09Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "name": "Consulta Externa - annual Assessment",
      "service_id": "550e8400-e29b-41d4-a716-446655440000",
      "version": "annual",
      "status": "published",
      "total_criteria": 25,
      "created_by": "550e8400-e29b-41d4-a716-446655440002",
      "created_at": "2026-04-10T21:00:00Z"
    }
  ],
  "count": 2,
  "service_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### 6. List Criteria by Service (with Standard Hierarchy)

```http
GET /api/assessments/services/{serviceId}/criteria
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "standard": {
        "id": "std-001",
        "code": "T-01",
        "name": "Dirección y Gestión",
        "description": "Aspectos de Dirección, Gestión Administrativa y Financiera",
        "is_transversal": true,
        "category": "Gestión"
      },
      "criteria": [
        {
          "id": "crit-001",
          "code": "CX-T01-001",
          "number": "1.1",
          "name": "Definición de metas y objetivos",
          "description": "La organización debe tener documentada la misión, visión y objetivos estratégicos",
          "evidence_requirement": "Documento de Política de Gestión Administrativa",
          "complexity": "simple",
          "is_mandatory": true
        },
        // ... more criteria for T-01
      ]
    },
    // ... T-02 through T-07 (transversales)
    // ... then service-specific standards
  ],
  "total_criteria": 25,
  "standards_count": 8,  // 7 transversales + 1 service-specific
  "service_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Note:** Returns 7 transversales + 1-25 service-specific standards, total 40-80 criteria

---

### 7. Get Conditional Logic for Criterion

```http
GET /api/assessments/criteria/{criterionId}/conditional
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "crit-005",
      "code": "CX-T04-003",
      "number": "4.3",
      "name": "Plan de acción para evento adverso",
      "description": "Si hay evento adverso, debe existir plan de acción",
      "evidence_requirement": "Plan de acción documentado",
      "complexity": "medium",
      "is_mandatory": true
    }
  ],
  "criterion_id": "crit-004",
  "dependent_count": 1
}
```

**Logic:** Returns dependent criteria shown when criterion is marked as NC (Non-Compliant)

---

### 8. Save Assessment Responses

```http
POST /api/assessments/{assessmentId}/criteria-responses
Authorization: Bearer {token}
Content-Type: application/json

{
  "responses": [
    {
      "criterion_id": "crit-001",
      "value": "C",
      "notes": "Policy document verified in director's office",
      "evidence_references": ["doc-001", "doc-002"]
    },
    {
      "criterion_id": "crit-002",
      "value": "NC",
      "notes": "Manual of functions pending update",
      "evidence_references": []
    },
    {
      "criterion_id": "crit-003",
      "value": "NA",
      "notes": "Not applicable for this location type"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "data": [
    {
      "id": "resp-001",
      "assessment_id": "assess-001",
      "criterion_id": "crit-001",
      "value": "C",
      "notes": "Policy document verified",
      "answered_by": "550e8400-e29b-41d4-a716-446655440003",
      "answered_at": "2026-04-10T20:56:09Z"
    },
    // ... more responses
  ],
  "count": 3,
  "message": "3 response(s) saved"
}
```

**Note:** Supports upsert (updates existing response if already answered)

**Events:** `assessment_criteria.responded`

---

### 9. Get Assessment Responses with Compliance

```http
GET /api/assessments/{assessmentId}/criteria-responses
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "resp-001",
      "assessment_id": "assess-001",
      "criterion_id": "crit-001",
      "value": "C",
      "notes": "Policy verified",
      "answered_by": "550e8400-e29b-41d4-a716-446655440003",
      "answered_at": "2026-04-10T20:56:09Z"
    },
    // ... more responses
  ],
  "count": 25,
  "compliance_pct": 80,
  "breakdown": {
    "compliant": 20,
    "non_compliant": 5,
    "not_applicable": 0
  }
}
```

**Compliance Calculation:**
```
compliance_pct = (C / (C + NC)) * 100
                = (20 / 25) * 100
                = 80%
```

**Semáforo Status:**
- Verde: ≥80%
- Naranja: 50-79%
- Rojo: <50%

---

## RBAC Matrix

| Operation | super_admin | auditor | provider_admin |
|-----------|-------------|---------|----------------|
| Create questionnaire | ✅ | ❌ | ❌ |
| View questionnaire | ✅ | ✅ | ✅ (own service) |
| Update questionnaire | ✅ | ❌ | ❌ |
| Delete questionnaire | ✅ | ❌ | ❌ |
| List criteria | ✅ | ✅ | ✅ (own service) |
| Save responses | ✅ | ✅ | ✅ (own assessment) |
| View responses | ✅ | ✅ | ✅ (own assessment) |

---

## Event Sourcing

All questionnaire operations emit immutable events:

```json
{
  "id": "event-uuid",
  "aggregate_id": "questionnaire-uuid",
  "aggregate_type": "Questionnaire",
  "event_type": "questionnaire.created",
  "payload": {
    "questionnaire_id": "...",
    "service_id": "...",
    "version": "initial",
    "total_criteria": 25
  },
  "metadata": {
    "user_id": "...",
    "timestamp": "2026-04-10T20:56:09Z"
  },
  "event_hash": "sha256hash...",
  "previous_event_hash": "previous_hash...",
  "is_immutable": true
}
```

**Event Types:**
- `questionnaire.created` - New questionnaire created
- `questionnaire.updated` - Questionnaire metadata updated
- `questionnaire.archived` - Questionnaire soft deleted
- `assessment_criteria.responded` - Responses saved

---

## Error Handling (Spanish Messages)

```json
{
  "error": "serviceId y version son requeridos"
}
```

Common errors:

| Status | Message |
|--------|---------|
| 400 | serviceId y version son requeridos |
| 400 | version debe ser: initial, year4, annual, o pre-novelty |
| 404 | Questionnaire not found |
| 404 | Service not found |
| 409 | Questionnaire for service already exists |
| 403 | Access denied: insufficient permissions |
| 500 | Failed to create questionnaire |

---

## Example Workflow

### 1. Create Initial Assessment Questionnaire

```bash
curl -X POST http://localhost:3001/api/assessments/questionnaires \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "cx-uuid",
    "version": "initial"
  }'
```

### 2. Get Questionnaire with All Criteria

```bash
curl http://localhost:3001/api/assessments/questionnaires/{id} \
  -H "Authorization: Bearer {token}"
```

### 3. Save Assessment Responses

```bash
curl -X POST http://localhost:3001/api/assessments/{assessment-id}/criteria-responses \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "responses": [
      {"criterion_id": "crit-001", "value": "C"},
      {"criterion_id": "crit-002", "value": "NC", "notes": "Action required"}
    ]
  }'
```

### 4. Get Assessment Results with Compliance

```bash
curl http://localhost:3001/api/assessments/{assessment-id}/criteria-responses \
  -H "Authorization: Bearer {token}"
```

Response includes `compliance_pct` and `breakdown`

---

## Performance Considerations

- **Questionnaire Creation:** ~100ms (inserts 25-30 criteria links)
- **Get Full Questionnaire:** ~150ms (joins standards + criteria)
- **Save Responses:** ~200ms (bulk upsert 1-25 responses)
- **List Criteria:** ~100ms (aggregation by standard)

---

## Database Schema

Created tables:
- `evaluation_standards` - 7 transversales + service-specific
- `evaluation_criteria` - Individual criteria (600+ total)
- `questionnaires` - Versioned snapshots
- `questionnaire_criteria` - Links criteria to questionnaires
- `criteria_conditional_logic` - Dependency rules
- `assessment_criteria_responses` - Individual responses

See `backend/db/evaluation-schema.sql` for full DDL.

---

## References

- Norma 3100 Compliance Standard (Colombian healthcare regulation)
- Phase 3 Compliance Workflows PLAN.md
- Event Sourcing Implementation: `backend/src/modules/events/EventStore.ts`
- RBAC Middleware: `backend/src/middleware/role.middleware.ts`
