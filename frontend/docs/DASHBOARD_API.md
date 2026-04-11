# Multi-Location Dashboard API Documentation

## Overview

The Multi-Location Dashboard displays compliance status across all provider locations with semáforo color coding (verde/naranja/rojo) and comparative analysis.

## API Endpoints

### Get Provider Locations

**Endpoint:** `GET /api/providers/locations`

**Description:** Retrieve all locations for the authenticated provider

**Authentication:** Required (Bearer token)

**Response:** `200 OK`

```json
[
  {
    "id": "loc-001",
    "name": "Clínica Centro",
    "city": "Bogotá",
    "state": "Cundinamarca",
    "created_at": "2026-03-01T10:00:00Z",
    "updated_at": "2026-03-15T14:30:00Z"
  },
  {
    "id": "loc-002",
    "name": "Hospital Norte",
    "city": "Medellín",
    "state": "Antioquia",
    "created_at": "2026-02-15T10:00:00Z",
    "updated_at": "2026-03-10T09:15:00Z"
  }
]
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - User not authorized to view locations
- `500 Internal Server Error` - Server error

---

### Get Location Compliance Data

**Endpoint:** `GET /api/assessments/locations/compliance`

**Description:** Retrieve compliance data for all locations of the authenticated provider

**Authentication:** Required (Bearer token)

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `year` | number | Filter by assessment year (optional) |
| `assessment_type` | string | Filter by assessment type: initial, year4, annual, pre-novelty (optional) |

**Response:** `200 OK`

```json
[
  {
    "locationId": "loc-001",
    "locationName": "Clínica Centro",
    "overallCompliance": 85,
    "semaforo": "verde",
    "hallazgosCount": 2,
    "lastAssessmentDate": "2026-03-15T10:00:00Z",
    "perStandardMetrics": [
      {
        "name": "Capacidad técnico-administrativa",
        "code": "CTA",
        "percent": 90,
        "color": "verde"
      },
      {
        "name": "Políticas y procedimientos",
        "code": "PP",
        "percent": 85,
        "color": "verde"
      },
      {
        "name": "Gestión de recursos humanos",
        "code": "GRH",
        "percent": 80,
        "color": "verde"
      },
      {
        "name": "Gestión de información",
        "code": "GI",
        "percent": 75,
        "color": "naranja"
      },
      {
        "name": "Infraestructura y tecnología",
        "code": "IT",
        "percent": 80,
        "color": "verde"
      },
      {
        "name": "Bioseguridad y ambiente",
        "code": "BA",
        "percent": 85,
        "color": "verde"
      },
      {
        "name": "Evaluación y mejora continua",
        "code": "EMC",
        "percent": 80,
        "color": "verde"
      }
    ]
  },
  {
    "locationId": "loc-002",
    "locationName": "Hospital Norte",
    "overallCompliance": 65,
    "semaforo": "naranja",
    "hallazgosCount": 5,
    "lastAssessmentDate": "2026-03-10T10:00:00Z",
    "perStandardMetrics": [
      {
        "name": "Capacidad técnico-administrativa",
        "code": "CTA",
        "percent": 70,
        "color": "naranja"
      },
      {
        "name": "Políticas y procedimientos",
        "code": "PP",
        "percent": 60,
        "color": "naranja"
      },
      {
        "name": "Gestión de recursos humanos",
        "code": "GRH",
        "percent": 65,
        "color": "naranja"
      },
      {
        "name": "Gestión de información",
        "code": "GI",
        "percent": 55,
        "color": "rojo"
      },
      {
        "name": "Infraestructura y tecnología",
        "code": "IT",
        "percent": 70,
        "color": "naranja"
      },
      {
        "name": "Bioseguridad y ambiente",
        "code": "BA",
        "percent": 65,
        "color": "naranja"
      },
      {
        "name": "Evaluación y mejora continua",
        "code": "EMC",
        "percent": 60,
        "color": "naranja"
      }
    ]
  }
]
```

**Semáforo Color Mapping:**

- **Verde** - Compliance ≥ 80%
- **Naranja** - Compliance 50-79%
- **Rojo** - Compliance < 50%

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - User not authorized to view compliance data
- `500 Internal Server Error` - Server error

---

### Get Location Compliance Detail

**Endpoint:** `GET /api/assessments/locations/:locationId/compliance`

**Description:** Retrieve detailed compliance data for a specific location

**Authentication:** Required (Bearer token)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `locationId` | string | The location ID |

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `assessment_id` | string | Get compliance for specific assessment (optional) |

**Response:** `200 OK`

```json
{
  "locationId": "loc-001",
  "locationName": "Clínica Centro",
  "providerId": "prov-001",
  "overallCompliance": 85,
  "semaforo": "verde",
  "hallazgosCount": 2,
  "lastAssessmentDate": "2026-03-15T10:00:00Z",
  "assessmentId": "assess-001",
  "perStandardMetrics": [
    {
      "name": "Capacidad técnico-administrativa",
      "code": "CTA",
      "percent": 90,
      "color": "verde",
      "cumuloCount": 45,
      "noCumuloCount": 5
    }
  ],
  "serviceMetrics": [
    {
      "serviceId": "svc-001",
      "serviceName": "Consulta Externa",
      "compliance": 88,
      "color": "verde"
    }
  ],
  "historicalTrend": [
    {
      "date": "2025-12-15",
      "compliance": 82,
      "semaforo": "verde"
    },
    {
      "date": "2026-03-15",
      "compliance": 85,
      "semaforo": "verde"
    }
  ]
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - User not authorized to view this location
- `404 Not Found` - Location not found
- `500 Internal Server Error` - Server error

---

### Get Compliance Metrics by Service

**Endpoint:** `GET /api/assessments/locations/:locationId/services/compliance`

**Description:** Get compliance breakdown by service for a specific location

**Authentication:** Required (Bearer token)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `locationId` | string | The location ID |

**Response:** `200 OK`

```json
[
  {
    "serviceId": "svc-001",
    "serviceName": "Consulta Externa",
    "compliance": 88,
    "semaforo": "verde",
    "hallazgosCount": 1,
    "standardBreakdown": [
      {
        "code": "CTA",
        "name": "Capacidad técnico-administrativa",
        "percent": 90,
        "color": "verde"
      }
    ]
  },
  {
    "serviceId": "svc-002",
    "serviceName": "Apoyo Diagnóstico",
    "compliance": 82,
    "semaforo": "verde",
    "hallazgosCount": 0,
    "standardBreakdown": [
      {
        "code": "CTA",
        "name": "Capacidad técnico-administrativa",
        "percent": 85,
        "color": "verde"
      }
    ]
  }
]
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - User not authorized to view this location
- `404 Not Found` - Location or services not found
- `500 Internal Server Error` - Server error

---

### Get Compliance Trend

**Endpoint:** `GET /api/assessments/locations/:locationId/trend`

**Description:** Get historical compliance trend for a location

**Authentication:** Required (Bearer token)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `locationId` | string | The location ID |

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `months` | number | Number of months to retrieve (default: 12, max: 60) |

**Response:** `200 OK`

```json
{
  "locationId": "loc-001",
  "locationName": "Clínica Centro",
  "trend": [
    {
      "date": "2025-03-15",
      "compliance": 75,
      "semaforo": "naranja",
      "assessmentId": "assess-xxx"
    },
    {
      "date": "2025-06-15",
      "compliance": 78,
      "semaforo": "naranja",
      "assessmentId": "assess-yyy"
    },
    {
      "date": "2025-12-15",
      "compliance": 82,
      "semaforo": "verde",
      "assessmentId": "assess-zzz"
    },
    {
      "date": "2026-03-15",
      "compliance": 85,
      "semaforo": "verde",
      "assessmentId": "assess-aaa"
    }
  ]
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - User not authorized to view this location
- `404 Not Found` - Location not found
- `500 Internal Server Error` - Server error

---

### Get Comparison Metrics

**Endpoint:** `GET /api/assessments/locations/comparison`

**Description:** Get metrics for comparing multiple locations

**Authentication:** Required (Bearer token)

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `locations` | string | Comma-separated location IDs (optional - returns all if omitted) |

**Response:** `200 OK`

```json
{
  "averageCompliance": 75,
  "standardAverages": [
    {
      "code": "CTA",
      "name": "Capacidad técnico-administrativa",
      "percent": 80,
      "color": "verde"
    },
    {
      "code": "PP",
      "name": "Políticas y procedimientos",
      "percent": 72.5,
      "color": "naranja"
    }
  ],
  "semaforoDistribution": {
    "verde": 2,
    "naranja": 1,
    "rojo": 0
  },
  "topLocations": [
    {
      "locationId": "loc-001",
      "name": "Clínica Centro",
      "compliance": 85,
      "semaforo": "verde"
    },
    {
      "locationId": "loc-002",
      "name": "Hospital Norte",
      "compliance": 65,
      "semaforo": "naranja"
    }
  ]
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - User not authorized to view locations
- `500 Internal Server Error` - Server error

---

## Response Format

All responses follow standard JSON format with the following structure:

**Success Response:** `200 OK`
- Returns JSON array or object with requested data
- HTTP status: 200

**Error Response:** `4xx` or `5xx`
- Returns error object with `message` and `error` fields (if available)
- HTTP status: appropriate error code

---

## Performance Notes

- Location list: <100ms
- Compliance data for all locations: <500ms
- Individual location compliance detail: <200ms
- Comparison metrics: <300ms
- Trend data: <400ms

---

## Rate Limiting

- 100 requests per minute per authenticated user
- Response includes `X-RateLimit-*` headers

---

## Data Freshness

- Compliance data is cached for 5 minutes
- Clear cache on new assessment completion
- Historical data is immutable (event-sourced)

---

## Implementation Notes

The dashboard uses these endpoints to:

1. **Load Locations** - `GET /api/providers/locations`
2. **Load Compliance** - `GET /api/assessments/locations/compliance`
3. **Show Comparisons** - `GET /api/assessments/locations/comparison`
4. **Track Trends** - `GET /api/assessments/locations/:locationId/trend`

All endpoints require authentication via Bearer token in `Authorization` header.

---

*Last Updated: 2026-04-10*
*Task 8 Implementation: Multi-Location Dashboard Visual Design*
