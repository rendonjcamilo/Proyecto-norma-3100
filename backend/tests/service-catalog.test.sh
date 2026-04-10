#!/bin/bash

# Service Catalog & Provider Assignment API Test Script
# Tests all endpoints with curl and validates responses

BASE_URL="http://localhost:3001/api"
PROVIDER_ID="provider-test-uuid"
SERVICE_ID="service-test-uuid"
LOCATION_ID="location-test-uuid"
ADMIN_TOKEN="your-admin-jwt-token"
PROVIDER_TOKEN="your-provider-jwt-token"
AUDITOR_TOKEN="your-auditor-jwt-token"

echo "========================================="
echo "Service Catalog API Tests"
echo "========================================="

# Test 1: List all services
echo -e "\n[TEST 1] GET /api/services - List all 157 services"
curl -X GET "${BASE_URL}/services" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -s | jq '.count, .categories'

# Test 2: Get service groups
echo -e "\n[TEST 2] GET /api/services/groups - Get 5 service groups"
curl -X GET "${BASE_URL}/services/groups" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -s | jq '.data[] | {name: .name, service_count: .service_count}'

# Test 3: Filter services by category
echo -e "\n[TEST 3] GET /api/services?category=Consulta+Externa - Filter by group"
curl -X GET "${BASE_URL}/services?category=Consulta%20Externa" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -s | jq '.count'

# Test 4: Search services
echo -e "\n[TEST 4] GET /api/services?search=medicina - Search services"
curl -X GET "${BASE_URL}/services?search=medicina" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -s | jq '.data[] | {code: .code, name: .name}'

# Test 5: Get service statistics
echo -e "\n[TEST 5] GET /api/services/stats - Get service statistics"
curl -X GET "${BASE_URL}/services/stats" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -s | jq '.data | {total: .total_services, available: .available_services, per_category: .services_per_category}'

# Test 6: Assign services to provider
echo -e "\n[TEST 6] POST /api/providers/:providerId/services - Assign services"
curl -X POST "${BASE_URL}/providers/${PROVIDER_ID}/services" \
  -H "Authorization: Bearer ${PROVIDER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "services": [
      {"serviceId": "service-uuid-1", "locationId": "location-uuid-1"},
      {"serviceId": "service-uuid-2", "locationId": "location-uuid-1"}
    ]
  }' \
  -s | jq '.message, .data | length'

# Test 7: Get provider services
echo -e "\n[TEST 7] GET /api/providers/:providerId/services - Get provider services"
curl -X GET "${BASE_URL}/providers/${PROVIDER_ID}/services" \
  -H "Authorization: Bearer ${PROVIDER_TOKEN}" \
  -H "Content-Type: application/json" \
  -s | jq '.count, .data[] | {code: .code, name: .name}'

# Test 8: Get location services
echo -e "\n[TEST 8] GET /api/providers/:providerId/locations/:locationId/services - Get location services"
curl -X GET "${BASE_URL}/providers/${PROVIDER_ID}/locations/${LOCATION_ID}/services" \
  -H "Authorization: Bearer ${PROVIDER_TOKEN}" \
  -H "Content-Type: application/json" \
  -s | jq '.count'

# Test 9: Bulk assign services
echo -e "\n[TEST 9] POST /api/providers/:providerId/services/bulk - Bulk assign"
curl -X POST "${BASE_URL}/providers/${PROVIDER_ID}/services/bulk" \
  -H "Authorization: Bearer ${PROVIDER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceIds": [
      "service-uuid-1",
      "service-uuid-2",
      "service-uuid-3",
      "service-uuid-4",
      "service-uuid-5"
    ],
    "locationId": "'${LOCATION_ID}'"
  }' \
  -s | jq '.message, (.data | length)'

# Test 10: Update service status (admin only)
echo -e "\n[TEST 10] PUT /api/services/:serviceId - Update service status (admin)"
curl -X PUT "${BASE_URL}/services/${SERVICE_ID}" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"status": "discontinued"}' \
  -s | jq '.message, .data.status'

# Test 11: Unassign service
echo -e "\n[TEST 11] DELETE /api/providers/:providerId/services/:serviceId - Unassign service"
curl -X DELETE "${BASE_URL}/providers/${PROVIDER_ID}/services/${SERVICE_ID}" \
  -H "Authorization: Bearer ${PROVIDER_TOKEN}" \
  -H "Content-Type: application/json" \
  -s | jq '.message'

# Test 12: RBAC - Provider admin access denied to other provider
echo -e "\n[TEST 12] RBAC - Provider admin denied access to other provider"
curl -X GET "${BASE_URL}/providers/other-provider-id/services" \
  -H "Authorization: Bearer ${PROVIDER_TOKEN}" \
  -H "Content-Type: application/json" \
  -s | jq '.error'

# Test 13: RBAC - Auditor read-only (assign denied)
echo -e "\n[TEST 13] RBAC - Auditor denied service assignment"
curl -X POST "${BASE_URL}/providers/${PROVIDER_ID}/services" \
  -H "Authorization: Bearer ${AUDITOR_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"services": [{"serviceId": "service-uuid"}]}' \
  -s | jq '.error'

# Test 14: Validation - Missing service ID
echo -e "\n[TEST 14] Validation - Empty services array"
curl -X POST "${BASE_URL}/providers/${PROVIDER_ID}/services" \
  -H "Authorization: Bearer ${PROVIDER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"services": [{"locationId": "location-uuid"}]}' \
  -s | jq '.error'

# Test 15: Validation - Invalid status
echo -e "\n[TEST 15] Validation - Invalid service status"
curl -X PUT "${BASE_URL}/services/${SERVICE_ID}" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"status": "invalid-status"}' \
  -s | jq '.error'

echo -e "\n========================================="
echo "Test Suite Complete"
echo "========================================="
