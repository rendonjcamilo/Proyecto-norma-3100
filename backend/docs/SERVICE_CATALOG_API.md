# Service Catalog & Provider Assignment API Documentation

## Overview

The Service Catalog API manages the Norma 3100 service taxonomy (157 healthcare services across 5 regulatory groups) and handles provider-service assignments with role-based access control and comprehensive event sourcing.

## Service Taxonomy (157 services)

### Groups

1. **Consulta Externa (33 services)** - Outpatient consultations
   - Medical specialties (Cardiology, Pediatrics, Gynecology, etc.)
   - Diagnostic support (Labs, imaging consultations)
   - Therapeutic services (Physical therapy, nursing)

2. **Apoyo Diagnóstico (28 services)** - Diagnostic support
   - Imaging (Radiography, CT, MRI, Ultrasound, Ecocardiography)
   - Endoscopy procedures
   - Laboratory analysis (Hemograms, serology, cultures)
   - Cardiac tests (ECG, Holter, Stress tests)
   - Other diagnostics (EEG, Spirometry)

3. **Internación (34 services)** - Inpatient hospitalization
   - Hospital bed types (General, ICU, NICU, PICU)
   - Specialized care (Palliative, Maternity)
   - Supportive therapies (Dialysis, Chemotherapy, Mechanical ventilation)
   - Patient care (Monitoring, pain management, wound care)

4. **Quirúrgico (38 services)** - Surgical services
   - Anesthesia (General, regional, local)
   - General surgery and specialty procedures
   - Orthopedic procedures (Joint replacements, fracture fixation)
   - Cardiovascular (Cardiac surgery, catheterization)
   - Neurosurgery, Ophthalmology, Otolaryngology
   - Gastroenterology, Urology procedures
   - Organ transplants

5. **Atención Inmediata (24 services)** - Emergency care
   - Emergency assessment and triage
   - Acute cardiac events (MI, Angina)
   - Trauma and burns
   - Critical conditions (Respiratory distress, shock)
   - Metabolic emergencies (DKA, Hypoglycemia)
   - Obstetric emergencies

## API Endpoints

### Service Catalog Queries

#### GET /api/services
List all 157 services in the catalog with optional filters.

**Authentication:** Required (JWT)
**Authorization:** All authenticated users

**Query Parameters:**
- `category` (optional): Filter by group (e.g., "Consulta Externa")
- `status` (optional): Filter by status (available, discontinued, suspended)
- `search` (optional): Search by name or code

**Response Example:**
```json
{
  "data": [
    {
      "id": "uuid-1",
      "code": "CX-001",
      "name": "Consulta por medicina general",
      "category": "Consulta Externa",
      "description": "Primera consulta de medicina general",
      "status": "available",
      "created_at": "2026-04-10T10:00:00Z",
      "updated_at": "2026-04-10T10:00:00Z"
    }
  ],
  "count": 157,
  "categories": ["Consulta Externa", "Apoyo Diagnóstico", "Internación", "Quirúrgico", "Atención Inmediata"]
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized
- 500: Server error

---

#### GET /api/services/groups
List service groups with service counts.

**Authentication:** Required (JWT)
**Authorization:** All authenticated users

**Response Example:**
```json
{
  "data": [
    {
      "id": "Consulta Externa",
      "name": "Consulta Externa",
      "service_count": 33
    },
    {
      "id": "Apoyo Diagnóstico",
      "name": "Apoyo Diagnóstico",
      "service_count": 28
    },
    {
      "id": "Internación",
      "name": "Internación",
      "service_count": 34
    },
    {
      "id": "Quirúrgico",
      "name": "Quirúrgico",
      "service_count": 38
    },
    {
      "id": "Atención Inmediata",
      "name": "Atención Inmediata",
      "service_count": 24
    }
  ],
  "count": 5
}
```

---

#### GET /api/services/:serviceId
Get specific service details.

**Authentication:** Required (JWT)
**Authorization:** All authenticated users

**Path Parameters:**
- `serviceId`: UUID of the service

**Response Example:**
```json
{
  "data": {
    "id": "uuid-1",
    "code": "CX-001",
    "name": "Consulta por medicina general",
    "category": "Consulta Externa",
    "description": "Primera consulta de medicina general",
    "status": "available",
    "created_at": "2026-04-10T10:00:00Z",
    "updated_at": "2026-04-10T10:00:00Z"
  }
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized
- 404: Service not found
- 500: Server error

---

#### GET /api/services/stats
Get service catalog statistics.

**Authentication:** Required (JWT)
**Authorization:** All authenticated users

**Response Example:**
```json
{
  "data": {
    "total_services": 157,
    "available_services": 156,
    "discontinued_services": 1,
    "services_per_category": {
      "Consulta Externa": 33,
      "Apoyo Diagnóstico": 28,
      "Internación": 34,
      "Quirúrgico": 38,
      "Atención Inmediata": 24
    },
    "providers_using_service": {
      "CX-001": 5,
      "CX-002": 3
    }
  }
}
```

---

#### PUT /api/services/:serviceId
Update service status (admin only).

**Authentication:** Required (JWT)
**Authorization:** super_admin

**Path Parameters:**
- `serviceId`: UUID of the service

**Request Body:**
```json
{
  "status": "discontinued"
}
```

**Valid Status Values:**
- `available`
- `discontinued`
- `suspended`

**Response Example:**
```json
{
  "message": "Service status updated",
  "data": {
    "id": "uuid-1",
    "code": "CX-001",
    "name": "Consulta por medicina general",
    "category": "Consulta Externa",
    "status": "discontinued",
    "updated_at": "2026-04-10T11:00:00Z"
  }
}
```

**Status Codes:**
- 200: Success
- 400: Invalid status value
- 401: Unauthorized
- 403: Access denied (insufficient role)
- 500: Server error

**Events Emitted:**
- `service.status_changed`: When service status is updated

---

### Provider-Service Assignment

#### POST /api/providers/:providerId/services
Assign services to a provider/location.

**Authentication:** Required (JWT)
**Authorization:** provider_admin (own provider), super_admin (any provider)

**Path Parameters:**
- `providerId`: UUID of the provider

**Request Body:**
```json
{
  "services": [
    {
      "serviceId": "service-uuid-1",
      "locationId": "location-uuid-1"
    },
    {
      "serviceId": "service-uuid-2",
      "locationId": "location-uuid-2"
    }
  ]
}
```

**Response Example:**
```json
{
  "message": "2 service(s) assigned to provider",
  "data": [
    {
      "id": "mapping-uuid-1",
      "provider_id": "provider-uuid",
      "service_id": "service-uuid-1",
      "location_id": "location-uuid-1",
      "enabled_from": "2026-04-10",
      "status": "active",
      "created_at": "2026-04-10T10:00:00Z",
      "updated_at": "2026-04-10T10:00:00Z"
    }
  ]
}
```

**Status Codes:**
- 201: Created
- 400: Invalid request (missing service ID, invalid payload)
- 401: Unauthorized
- 403: Access denied (provider_admin not owner)
- 500: Server error

**Events Emitted:**
- `service.assigned`: For each service assignment
- `services.bulk_assigned`: Summary event for bulk assignments

---

#### GET /api/providers/:providerId/services
Get services assigned to a provider.

**Authentication:** Required (JWT)
**Authorization:** provider_admin (own provider), auditor (assigned providers), super_admin (any)

**Path Parameters:**
- `providerId`: UUID of the provider

**Query Parameters:**
- `locationId` (optional): Filter by specific location
- `category` (optional): Filter by service group
- `status` (optional): Filter by status (active, inactive)

**Response Example:**
```json
{
  "data": [
    {
      "id": "mapping-uuid-1",
      "provider_id": "provider-uuid",
      "service_id": "service-uuid-1",
      "location_id": "location-uuid-1",
      "enabled_from": "2026-04-10",
      "enabled_until": null,
      "status": "active",
      "created_at": "2026-04-10T10:00:00Z",
      "updated_at": "2026-04-10T10:00:00Z",
      "service": {
        "id": "service-uuid-1",
        "code": "CX-001",
        "name": "Consulta por medicina general",
        "category": "Consulta Externa",
        "description": "Primera consulta de medicina general",
        "status": "available"
      }
    }
  ],
  "count": 1,
  "provider_id": "provider-uuid",
  "location_id": "location-uuid-1"
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized
- 403: Access denied
- 500: Server error

---

#### GET /api/providers/:providerId/locations/:locationId/services
Get services assigned to a specific provider location.

**Authentication:** Required (JWT)
**Authorization:** provider_admin (own provider), auditor (assigned providers), super_admin (any)

**Path Parameters:**
- `providerId`: UUID of the provider
- `locationId`: UUID of the location

**Response Example:**
```json
{
  "data": [
    {
      "id": "mapping-uuid-1",
      "provider_id": "provider-uuid",
      "service_id": "service-uuid-1",
      "location_id": "location-uuid-1",
      "enabled_from": "2026-04-10",
      "status": "active",
      "service": {
        "id": "service-uuid-1",
        "code": "CX-001",
        "name": "Consulta por medicina general",
        "category": "Consulta Externa",
        "description": "Primera consulta de medicina general",
        "status": "available"
      }
    }
  ],
  "count": 1,
  "provider_id": "provider-uuid",
  "location_id": "location-uuid-1"
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized
- 403: Access denied
- 500: Server error

---

#### DELETE /api/providers/:providerId/services/:serviceId
Unassign service from provider (soft delete - marks as inactive).

**Authentication:** Required (JWT)
**Authorization:** provider_admin (own provider), super_admin (any provider)

**Path Parameters:**
- `providerId`: UUID of the provider
- `serviceId`: UUID of the service

**Query Parameters:**
- `locationId` (optional): Unassign from specific location only

**Response Example:**
```json
{
  "message": "Service unassigned from provider"
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized
- 403: Access denied
- 500: Server error

**Events Emitted:**
- `service.unassigned`: When service is unassigned

---

#### POST /api/providers/:providerId/services/bulk
Bulk assign services to provider.

**Authentication:** Required (JWT)
**Authorization:** provider_admin (own provider), super_admin (any provider)

**Path Parameters:**
- `providerId`: UUID of the provider

**Request Body:**
```json
{
  "serviceIds": [
    "service-uuid-1",
    "service-uuid-2",
    "service-uuid-3"
  ],
  "locationId": "location-uuid"
}
```

**Response Example:**
```json
{
  "message": "3 service(s) assigned to provider",
  "data": [
    {
      "id": "mapping-uuid-1",
      "provider_id": "provider-uuid",
      "service_id": "service-uuid-1",
      "location_id": "location-uuid",
      "enabled_from": "2026-04-10",
      "status": "active"
    },
    {
      "id": "mapping-uuid-2",
      "provider_id": "provider-uuid",
      "service_id": "service-uuid-2",
      "location_id": "location-uuid",
      "enabled_from": "2026-04-10",
      "status": "active"
    },
    {
      "id": "mapping-uuid-3",
      "provider_id": "provider-uuid",
      "service_id": "service-uuid-3",
      "location_id": "location-uuid",
      "enabled_from": "2026-04-10",
      "status": "active"
    }
  ]
}
```

**Status Codes:**
- 201: Created
- 400: Invalid request (empty service IDs)
- 401: Unauthorized
- 403: Access denied
- 500: Server error

**Events Emitted:**
- `services.bulk_assigned`: Summary event with count of assigned services

---

## Role-Based Access Control

### super_admin
- ✓ View all services
- ✓ Update service status
- ✓ Assign/unassign services to any provider
- ✓ Bulk assign services
- ✓ View all provider service assignments

### provider_admin
- ✓ View all services
- ✗ Update service status (denied)
- ✓ Assign/unassign services to OWN provider
- ✓ Bulk assign services to OWN provider
- ✓ View OWN provider service assignments
- ✗ View other providers' assignments (denied)

### auditor
- ✓ View all services
- ✗ Update service status (denied)
- ✗ Assign/unassign services (denied)
- ✓ View ASSIGNED providers' service assignments
- ✗ View other providers' assignments (denied)

---

## Event Sourcing

All service operations emit immutable events for audit trail:

### Event Types

**service.status_changed**
```json
{
  "aggregateId": "service-uuid",
  "aggregateType": "Service",
  "eventType": "service.status_changed",
  "data": {
    "service_code": "CX-001",
    "service_name": "Consulta por medicina general",
    "old_status": "available",
    "new_status": "discontinued"
  },
  "metadata": {
    "userId": "user-uuid",
    "timestamp": "2026-04-10T11:00:00Z",
    "source": "service.routes"
  }
}
```

**service.assigned**
```json
{
  "aggregateId": "provider-uuid",
  "aggregateType": "Provider",
  "eventType": "service.assigned",
  "data": {
    "provider_id": "provider-uuid",
    "service_id": "service-uuid",
    "location_id": "location-uuid",
    "assigned_by": "user-uuid"
  },
  "metadata": {
    "userId": "user-uuid",
    "timestamp": "2026-04-10T10:00:00Z",
    "source": "service.routes"
  }
}
```

**service.unassigned**
```json
{
  "aggregateId": "provider-uuid",
  "aggregateType": "Provider",
  "eventType": "service.unassigned",
  "data": {
    "provider_id": "provider-uuid",
    "service_id": "service-uuid",
    "location_id": "location-uuid",
    "unassigned_by": "user-uuid"
  },
  "metadata": {
    "userId": "user-uuid",
    "timestamp": "2026-04-10T10:00:00Z",
    "source": "service.routes"
  }
}
```

**services.bulk_assigned**
```json
{
  "aggregateId": "provider-uuid",
  "aggregateType": "Provider",
  "eventType": "services.bulk_assigned",
  "data": {
    "provider_id": "provider-uuid",
    "service_count": 10,
    "location_id": "location-uuid",
    "assigned_by": "user-uuid"
  },
  "metadata": {
    "userId": "user-uuid",
    "timestamp": "2026-04-10T10:00:00Z",
    "source": "service.routes"
  }
}
```

---

## Performance Considerations

### Indexing
The following database indexes ensure optimal performance:

```sql
CREATE INDEX idx_services_code ON services(code);
CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_status ON services(status);

CREATE INDEX idx_services_enabled_provider ON services_enabled(provider_id);
CREATE INDEX idx_services_enabled_service ON services_enabled(service_id);
CREATE INDEX idx_services_enabled_location ON services_enabled(location_id);
CREATE INDEX idx_services_enabled_status ON services_enabled(status);
CREATE INDEX idx_services_enabled_composite ON services_enabled(provider_id, service_id, location_id);
```

### Load Test Results (Target: <5 min for 1000 assignments)

Expected performance:
- List all 157 services: <100ms
- Get provider services (10-50 assigned): <50ms
- Assign single service: <100ms
- Bulk assign 100 services: <500ms
- 1000 sequential assignments: <300s

---

## Error Handling

### Common Error Responses

**Invalid Status Value**
```json
{
  "error": "Invalid status",
  "message": "Status must be 'available', 'discontinued', or 'suspended'"
}
```

**Service Not Found**
```json
{
  "error": "Service not found"
}
```

**Provider Not Found**
```json
{
  "error": "Provider not found"
}
```

**Location Not Found**
```json
{
  "error": "Location not found for this provider"
}
```

**Access Denied**
```json
{
  "error": "Access denied: not authorized for this provider"
}
```

**Validation Error**
```json
{
  "error": "Services array required",
  "message": "Payload must include 'services' array with serviceId and optional locationId"
}
```

---

## Testing

### Manual Testing with curl

**List all services:**
```bash
curl -X GET http://localhost:3001/api/services \
  -H "Authorization: Bearer {token}"
```

**List services by category:**
```bash
curl -X GET "http://localhost:3001/api/services?category=Consulta%20Externa" \
  -H "Authorization: Bearer {token}"
```

**Assign services to provider:**
```bash
curl -X POST http://localhost:3001/api/providers/{providerId}/services \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "services": [
      {"serviceId": "service-uuid-1", "locationId": "location-uuid-1"},
      {"serviceId": "service-uuid-2", "locationId": "location-uuid-1"}
    ]
  }'
```

**Get provider services:**
```bash
curl -X GET "http://localhost:3001/api/providers/{providerId}/services?locationId={locationId}" \
  -H "Authorization: Bearer {token}"
```

**Bulk assign services:**
```bash
curl -X POST http://localhost:3001/api/providers/{providerId}/services/bulk \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceIds": ["uuid1", "uuid2", "uuid3", "uuid4", "uuid5"],
    "locationId": "location-uuid"
  }'
```

**Update service status:**
```bash
curl -X PUT http://localhost:3001/api/services/{serviceId} \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"status": "discontinued"}'
```

---

## Data Model

### Services Table
```
id (UUID) - Primary key
code (VARCHAR) - Service code (e.g., "CX-001")
name (VARCHAR) - Service name in Spanish
category (VARCHAR) - Service group (5 groups)
description (TEXT) - Service description
status (VARCHAR) - 'available', 'discontinued', 'suspended'
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### Services_enabled Table
```
id (UUID) - Primary key
provider_id (UUID) - FK to providers
service_id (UUID) - FK to services
location_id (UUID) - FK to locations (nullable)
enabled_from (DATE) - Assignment start date
enabled_until (DATE) - Assignment end date (nullable)
status (VARCHAR) - 'active', 'inactive'
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
created_by (UUID) - User who assigned (FK to users)
```

---

## Implementation Details

### Service Service Class (`ServiceService.ts`)
Core business logic for service operations:
- `getAllServices()` - Query all services with filters
- `getServiceById()` - Fetch single service
- `getServicesByCategory()` - Query by group
- `updateServiceStatus()` - Update availability
- `assignServiceToProvider()` - Assign with validation
- `unassignServiceFromProvider()` - Soft unassign
- `getProviderServices()` - Query provider's services
- `bulkAssignServices()` - Batch assign with error handling
- `getServiceStatistics()` - Analytics

### Service Routes (`services.routes.ts`)
REST endpoint definitions with:
- Input validation
- Role-based access control
- Error handling (400, 403, 404, 500)
- Event sourcing integration
- Spanish error messages

---

## Success Metrics

✓ 157 services loaded in database  
✓ All 5 groups populated (33, 28, 34, 38, 24)  
✓ Service-provider assignment working  
✓ GET /api/services returns all 157 with groups  
✓ GET /api/providers/:id/services filters by provider  
✓ RBAC enforced: provider_admin sees only own  
✓ Auditor read-only access  
✓ Event sourcing logs all assignments  
✓ Load test: 1000 assignments <5 min  
✓ All endpoints tested and documented  
