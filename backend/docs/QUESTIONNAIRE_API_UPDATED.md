# Questionnaire API Documentation - Task 4

## Overview

The Questionnaire API manages assessment questionnaires for Norma 3100 compliance with:
- 7 estándares transversales (applicable to all services)
- Service-specific estándares (5-25 per service)
- Questionnaire versioning (initial, year4, annual, pre-novelty)
- RBAC enforcement
- Event sourcing for audit trail

## Base URL

```
http://localhost:3001/api/questions
```

## Endpoints (11 total)

### Questionnaire CRUD (5 endpoints)

1. **POST /api/questions** - Create questionnaire
2. **GET /api/questions** - List questionnaires
3. **GET /api/questions/:id** - Get questionnaire details
4. **PUT /api/questions/:id** - Update questionnaire
5. **DELETE /api/questions/:id** - Delete questionnaire (soft delete/archive)

### Criterion Management (2 endpoints)

6. **POST /api/questions/:id/criteria** - Add criterion
7. **DELETE /api/questions/:id/criteria/:criterionId** - Remove criterion

### Template & Versioning (4 endpoints)

8. **GET /api/questions/service/:serviceId/template** - Get service template (7 transversales + service-specific)
9. **GET /api/questions/versions/service/:serviceId** - List all versions for service
10. **POST /api/questions/:id/versions** - Create new version from existing
11. **POST /api/questions/:id/publish** - Publish questionnaire

## RBAC

- **super_admin**: Full CRUD, create/publish/version all questionnaires
- **provider_admin**: Read-only (view own provider's questionnaires)
- **auditor**: Read-only (view all assigned questionnaires)

## Response Format

All responses include standard structure:

```json
{
  "data": {...},
  "message": "Optional success message",
  "count": "Optional count for lists"
}
```

## 7 Estándares Transversales (Per Norma 3100)

1. **Capacidad técnico-administrativa** - Institution capacity to manage resources
2. **Políticas y procedimientos** - Operational policies and procedures
3. **Gestión de recursos humanos** - Personnel management and competency
4. **Gestión de información** - Information collection, storage, and security
5. **Infraestructura y tecnología** - Physical facilities, IT systems, equipment
6. **Bioseguridad y ambiente** - Biological, chemical, physical risk protection
7. **Evaluación y mejora continua** - Process evaluation and quality improvement

Each service questionnaire includes:
- 7 transversales (fixed)
- 5-25 service-specific criteria
- **Total: 40-80 criteria per questionnaire**

## Event Sourcing

All write operations emit immutable events:

```
questionnaire.created
questionnaire.updated
questionnaire.archived
questionnaire.published
questionnaire.criterion_added
questionnaire.criterion_removed
questionnaire.version_created
```

## HTTP Status Codes

- **201 Created** - Resource created
- **200 OK** - Success
- **400 Bad Request** - Invalid input
- **401 Unauthorized** - Missing JWT
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server error

## Database Schema

### questionnaires

```sql
CREATE TABLE questionnaires (
  id UUID PRIMARY KEY,
  service_id UUID NOT NULL,
  version_type VARCHAR(50), -- initial, year4, annual, pre-novelty
  name VARCHAR(255),
  status VARCHAR(50), -- draft, published, archived
  total_criteria INT,
  created_by UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  published_at TIMESTAMP
);
```

### evaluation_standards

```sql
CREATE TABLE evaluation_standards (
  id UUID PRIMARY KEY,
  code VARCHAR(50), -- T-01 to T-07
  name VARCHAR(255),
  description TEXT,
  is_transversal BOOLEAN, -- TRUE for 7 standards
  service_id UUID, -- NULL if transversal
  category VARCHAR(100),
  status VARCHAR(50) -- active, archived
);
```

### evaluation_criteria

```sql
CREATE TABLE evaluation_criteria (
  id UUID PRIMARY KEY,
  code VARCHAR(50),
  number VARCHAR(20),
  name VARCHAR(255),
  description TEXT,
  evidence_requirement TEXT,
  complexity VARCHAR(50), -- simple, medium, complex
  standard_id UUID,
  service_id UUID,
  is_mandatory BOOLEAN,
  status VARCHAR(50)
);
```

### questionnaire_criteria

```sql
CREATE TABLE questionnaire_criteria (
  id UUID PRIMARY KEY,
  questionnaire_id UUID,
  criterion_id UUID,
  created_at TIMESTAMP,
  UNIQUE(questionnaire_id, criterion_id)
);
```

## Service Architecture

### QuestionnaireService (backend/src/services/QuestionnaireService.ts)

Methods:
- `createQuestionnaire(serviceId, versionType, createdBy, name?)` → Questionnaire
- `getQuestionnaire(questionnaireId)` → QuestionnaireDetail | null
- `listQuestionnaires(filters?)` → Questionnaire[]
- `updateQuestionnaire(id, updates, updatedBy)` → Questionnaire
- `deleteQuestionnaire(id)` → void
- `publishQuestionnaire(id, publishedBy)` → Questionnaire
- `addCriterionToQuestionnaire(questionnaireId, criterionId)` → void
- `removeCriterionFromQuestionnaire(questionnaireId, criterionId)` → void
- `getServiceTemplate(serviceId)` → ServiceTemplate
- `getQuestionnaireVersions(serviceId)` → Questionnaire[]
- `createVersionFromExisting(sourceId, newVersionType, createdBy)` → Questionnaire

### Questions Router (backend/src/routes/questions.routes.ts)

Implements all 11 endpoints with:
- JWT authentication
- RBAC middleware
- Input validation
- Event sourcing integration
- Error handling with Spanish error messages

## Testing

File: `backend/src/routes/__tests__/questions.routes.test.ts`

Test cases cover:
- CRUD operations
- RBAC enforcement
- Event sourcing
- Error handling
- Criteria management
- Versioning
- Template loading
- Performance tests

## Integration with Task 5

Task 5 (Assessment Execution) uses published questionnaires to:
1. Create assessment instances for providers
2. Render questionnaire forms
3. Capture provider responses
4. Calculate compliance scores
5. Generate assessment reports

## Spanish Implementation

All user-facing text in Colombian Spanish (es_CO):

- Standard names: Capacidad técnico-administrativa, Políticas y procedimientos, etc.
- Criterion names: Assessment questions in Spanish
- Error messages: Spanish error descriptions
- API responses: Spanish field labels and messages
