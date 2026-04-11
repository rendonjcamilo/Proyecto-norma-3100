# Risk Scoring API Documentation

## Overview

The Risk Scoring API provides comprehensive risk assessment for findings with automatic calculation, trend analysis, and escalation alerting. Risk scores range from 0-100 with automatic severity classification.

## Risk Scoring Algorithm

Risk Score = Normalized(Severity + Age + Overdue + ActionStatus) / 130 × 100

**Components:**
- **Severity Points** (0-80): Based on finding severity level
  - Crítica: 80 points
  - Alta: 60 points
  - Media: 40 points
  - Baja: 20 points

- **Age Points** (0-15): Increases with finding age
  - 0 days: 0 points
  - 30 days: 7.5 points
  - 60+ days: 15 points

- **Overdue Points** (0-20): If corrective action deadline passed
  - 0 days overdue: 0 points
  - 7 days overdue: 10 points
  - 14+ days overdue: 20 points

- **Action Status Points** (0-15): Based on action status and deadline proximity
  - Open, >14 days to deadline: 3 points
  - In Progress, 7-14 days to deadline: 8 points
  - Overdue: 15 points

**Risk Levels:**
- Crítica: ≥ 80 (immediate action required)
- Alta: 60-79 (urgent action required)
- Media: 40-59 (action required within days)
- Baja: < 40 (low priority, can be scheduled)

---

## API Endpoints

### GET /api/findings/:findingId/risk

**Get current risk score for a finding**

**Authentication:** Required (Bearer token)

**Authorization:** Auditor or super_admin; provider_admin for own provider

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `findingId` | string (UUID) | The finding ID |

**Response:** `200 OK`

```json
{
  "findingId": "550e8400-e29b-41d4-a716-446655440000",
  "currentScore": 75,
  "severity": "alta",
  "ageInDays": 15,
  "daysOverdue": 3,
  "actionStatus": "in_progress",
  "components": {
    "severityPoints": 60,
    "agePoints": 3.75,
    "overduePoints": 10,
    "actionStatusPoints": 8
  },
  "riskLevel": "alta",
  "escalationRequired": true,
  "lastCalculated": "2026-04-10T14:30:00Z"
}
```

**Error Responses:**
- `404 Not Found` - Finding not found
- `403 Forbidden` - User not authorized to view this finding
- `500 Internal Server Error` - Server error

---

### GET /api/findings/:findingId/risk/trend

**Get risk score trend and historical data**

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `findingId` | string (UUID) | The finding ID |

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `months` | number | 3 | Historical period in months (max: 12) |

**Response:** `200 OK`

```json
{
  "findingId": "550e8400-e29b-41d4-a716-446655440000",
  "trends": [
    {
      "date": "2026-01-10T00:00:00Z",
      "score": 45,
      "riskLevel": "media"
    },
    {
      "date": "2026-02-10T00:00:00Z",
      "score": 60,
      "riskLevel": "alta"
    },
    {
      "date": "2026-03-10T00:00:00Z",
      "score": 75,
      "riskLevel": "alta"
    },
    {
      "date": "2026-04-10T00:00:00Z",
      "score": 70,
      "riskLevel": "alta"
    }
  ],
  "averageScore": 62.5,
  "trend": "worsening"
}
```

**Trend Field:**
- `improving` - Score decreased by >5 points in recent period
- `stable` - Score relatively stable
- `worsening` - Score increased by >5 points in recent period

**Error Responses:**
- `404 Not Found` - Finding not found
- `400 Bad Request` - Invalid months parameter
- `403 Forbidden` - Not authorized

---

### GET /api/risk-alerts

**Get all high-risk alerts (score > 70 or overdue)**

**Authentication:** Required

**Authorization:** Auditor or super_admin only

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `providerId` | string | (all) | Filter by provider ID |
| `limit` | number | 50 | Max results (max: 200) |

**Response:** `200 OK`

```json
[
  {
    "findingId": "550e8400-e29b-41d4-a716-446655440000",
    "findingTitle": "Critical Infrastructure Gap",
    "currentScore": 95,
    "riskLevel": "crítica",
    "severity": "crítica",
    "daysOverdue": 5,
    "actionDescription": "Upgrade backup power system",
    "assignedTo": "engineer@hospital.com",
    "priority": 1
  },
  {
    "findingId": "550e8400-e29b-41d4-a716-446655440001",
    "findingTitle": "Training Compliance Issue",
    "currentScore": 72,
    "riskLevel": "alta",
    "severity": "alta",
    "daysOverdue": 0,
    "actionDescription": "Complete staff certifications",
    "assignedTo": "hr@hospital.com",
    "priority": 2
  }
]
```

**Error Responses:**
- `403 Forbidden` - User not authorized (must be auditor/admin)
- `400 Bad Request` - Invalid parameters
- `500 Internal Server Error` - Server error

---

### GET /api/providers/:providerId/risk-summary

**Get risk scoring summary for a provider**

**Authentication:** Required

**Authorization:** Provider_admin (own provider only), Auditor, or Super_admin

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `providerId` | string (UUID) | The provider ID |

**Response:** `200 OK`

```json
{
  "total_findings": 12,
  "closed_findings": 4,
  "high_risk_findings": 2,
  "avg_risk_score": 52.3,
  "max_risk_score": 95
}
```

**Field Descriptions:**
- `total_findings` - Total findings (open + closed)
- `closed_findings` - Number of resolved/closed findings
- `high_risk_findings` - Findings with score > 70
- `avg_risk_score` - Average risk across open findings
- `max_risk_score` - Highest risk score in open findings

**Error Responses:**
- `404 Not Found` - Provider not found
- `403 Forbidden` - Not authorized
- `500 Internal Server Error` - Server error

---

### GET /api/locations/:locationId/risk-summary

**Get risk scoring summary for a location**

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `locationId` | string (UUID) | The location ID |

**Response:** `200 OK` (same schema as provider risk summary)

---

### POST /api/findings/:findingId/risk/recalculate

**Manually recalculate and update risk score**

**Authentication:** Required

**Authorization:** Auditor or Super_admin

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `findingId` | string (UUID) | The finding ID |

**Request Body:**
```json
{
}
```

**Response:** `200 OK`

Returns the updated RiskScore object (same as GET /api/findings/:findingId/risk)

**Error Responses:**
- `404 Not Found` - Finding not found
- `403 Forbidden` - Not authorized
- `500 Internal Server Error` - Calculation error

---

### POST /api/findings/bulk-risk-update

**Recalculate risk scores for multiple findings**

**Authentication:** Required

**Authorization:** Auditor or Super_admin

**Request Body:**
```json
{
  "findingIds": [
    "550e8400-e29b-41d4-a716-446655440000",
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002"
  ]
}
```

**Response:** `200 OK`

```json
{
  "updated": 3,
  "errors": []
}
```

**Field Descriptions:**
- `updated` - Number of successfully updated findings
- `errors` - Array of { findingId, error } for failures

**Example Error Response:**
```json
{
  "updated": 2,
  "errors": [
    {
      "findingId": "550e8400-e29b-41d4-a716-446655440002",
      "error": "Finding not found"
    }
  ]
}
```

**Error Responses:**
- `400 Bad Request` - Missing or invalid findingIds array
- `403 Forbidden` - Not authorized
- `500 Internal Server Error` - Server error

---

## Performance

### Response Times
- Individual risk calculation: <100ms
- Risk trend query (3 months): <200ms
- Risk alerts query: <500ms
- Bulk update (100 findings): <2 sec

### Calculation Triggers
Risk scores are automatically recalculated:
- When finding status changes
- When corrective action status changes
- When corrective action deadline passes
- When new action is assigned
- When evidence is uploaded

### Caching Strategy
- Individual risk score: cached for 5 minutes
- Risk alert list: cached for 10 minutes
- Risk summary: cached for 15 minutes
- Clear cache on recalculation

---

## Rate Limiting
- 100 requests per minute per user
- 1000 requests per minute per application
- Response includes X-RateLimit-* headers

---

## Error Handling

All endpoints return error responses in standard format:

**Error Response Format:**
```json
{
  "error": "Error description",
  "message": "Detailed error message",
  "code": "ERROR_CODE"
}
```

**Common Error Codes:**
- `FINDING_NOT_FOUND` - Finding does not exist
- `NOT_AUTHORIZED` - User lacks permission
- `INVALID_PARAMETER` - Request parameter validation failed
- `CALCULATION_ERROR` - Risk calculation failed
- `DATABASE_ERROR` - Database operation failed

---

## Examples

### Example 1: Get Risk Score for Critical Finding

```bash
curl -X GET \
  https://api.norma3100.com/api/findings/550e8400-e29b-41d4-a716-446655440000/risk \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Response:**
```json
{
  "findingId": "550e8400-e29b-41d4-a716-446655440000",
  "currentScore": 85,
  "severity": "crítica",
  "ageInDays": 20,
  "daysOverdue": 7,
  "actionStatus": "overdue",
  "components": {
    "severityPoints": 80,
    "agePoints": 5,
    "overduePoints": 20,
    "actionStatusPoints": 15
  },
  "riskLevel": "crítica",
  "escalationRequired": true,
  "lastCalculated": "2026-04-10T14:35:22Z"
}
```

### Example 2: Get High-Risk Alerts for Provider

```bash
curl -X GET \
  "https://api.norma3100.com/api/risk-alerts?providerId=550e8400-e29b-41d4-a716-446655440000&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

### Example 3: Bulk Recalculate Risk Scores

```bash
curl -X POST \
  https://api.norma3100.com/api/findings/bulk-risk-update \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "findingIds": [
      "550e8400-e29b-41d4-a716-446655440000",
      "550e8400-e29b-41d4-a716-446655440001"
    ]
  }'
```

---

## Database Schema

### risk_score_history Table
```sql
CREATE TABLE risk_score_history (
  id UUID PRIMARY KEY,
  finding_id UUID NOT NULL REFERENCES findings(id),
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level VARCHAR(20) NOT NULL,
  components JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### risk_score_escalations Table
```sql
CREATE TABLE risk_score_escalations (
  id UUID PRIMARY KEY,
  finding_id UUID NOT NULL REFERENCES findings(id),
  risk_score INTEGER NOT NULL,
  escalation_type VARCHAR(50) NOT NULL,
  escalation_level VARCHAR(20) NOT NULL,
  assigned_to UUID REFERENCES users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP WITH TIME ZONE,
  comments TEXT
);
```

---

## Integration Points

### Triggered By
- Finding status changes → recalculate risk
- Corrective action status changes → update parent finding risk
- Action deadline reached → escalate risk
- Evidence uploaded → potentially reduce risk

### Triggers
- Risk > 70 → create escalation alert
- Days overdue > 0 → notify assigned user
- Risk worsening trend → notify auditor
- High-risk finding → trigger audit workflow

---

## Security Considerations

- All endpoints require authentication
- Role-based authorization enforced
- Finding access scoped by provider association
- Risk scores are audit-logged
- Bulk operations limited to authenticated users

---

*Last Updated: 2026-04-10*  
*Task 9: Risk Scoring Backend*
