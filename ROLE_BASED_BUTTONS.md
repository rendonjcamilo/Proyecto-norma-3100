# Role-Based Button Visibility — Testing Guide

**Last Updated:** 2026-04-13  
**Status:** Implemented and ready for testing

---

## 📋 Overview

Role-based button visibility has been implemented across all key pages. Users now see only the action buttons they have permission to use.

## 🔧 Implementation

### New Hook: `useRolePermission`
Location: `frontend/src/hooks/useRolePermission.ts`

Centralizes all permission checking logic with a simple API:

```typescript
const { can } = useRolePermission();

// Usage:
{can('findings', 'create') && <button>Nuevo Hallazgo</button>}
{can('documents', 'create') && <button>Subir Documento</button>}
```

### Permission Matrix

| Resource | super_admin | auditor | provider_admin | viewer |
|----------|------------|---------|----------------|--------|
| **findings** | CRUD | CRU | CRU | R |
| **assessments** | CRUD | CRU | CRU | ✗ |
| **documents** | CRUD | CRU | CRU | ✗ |
| **reports** | CRU | R | ✗ | ✗ |
| **providers** | CRUD | R | ✗ | ✗ |
| **notifications** | CRUD | R | ✗ | ✗ |
| **templates** | CRUD | ✗ | ✗ | ✗ |

---

## 🧪 Components Updated

### 1. FindingsPage
**File:** `frontend/src/pages/FindingsPage.tsx`

**Button:** "Nuevo Hallazgo" (Create Finding)

| Role | Visible | Expected Behavior |
|------|---------|------------------|
| super_admin | ✅ | Button visible, can create |
| auditor | ✅ | Button visible, can create |
| provider_admin | ✅ | Button visible, can create own |
| viewer | ❌ | Button hidden, read-only |

**Code:**
```typescript
{can('findings', 'create') && (
  <button className="page-btn-primary">
    <svg>...</svg>
    Nuevo Hallazgo
  </button>
)}
```

---

### 2. AssessmentsPage
**File:** `frontend/src/pages/AssessmentsPage.tsx`

**Button:** "Nueva Evaluación" (Create Assessment)

| Role | Visible | Expected Behavior |
|------|---------|------------------|
| super_admin | ✅ | Button visible, can create |
| auditor | ✅ | Button visible, can create |
| provider_admin | ✅ | Button visible, can create |
| viewer | ❌ | Button hidden, cannot access page |

**Code:**
```typescript
{can('assessments', 'create') && (
  <button className="page-btn-primary">
    Nueva Evaluación
  </button>
)}
```

---

### 3. DocumentsPage
**File:** `frontend/src/components/Documents/DocumentsPage.tsx`

**Button:** Upload icon in each document row

| Role | Visible | Expected Behavior |
|------|---------|------------------|
| super_admin | ✅ | Upload icon visible, can upload |
| auditor | ✅ | Upload icon visible, can upload |
| provider_admin | ✅ | Upload icon visible, can upload |
| viewer | ❌ | Upload icon hidden, view-only |

**Code:**
```typescript
{can('documents', 'create') && (
  <button className="btn-icon btn-upload">
    <svg>...</svg>
  </button>
)}
```

---

## 🧑‍💻 Manual Testing Steps

### Test 1: Viewer Role (Most Restricted)

1. Navigate to `http://localhost:5175`
2. Click "Visualizador" login button
3. Verify sidebar shows only 2 items: Dashboard, Hallazgos
4. Go to **Hallazgos** page:
   - ❌ "Nuevo Hallazgo" button should be **HIDDEN**
   - ✅ Can see the findings list
5. Go to **Evaluaciones** page:
   - ❌ Should see "No tienes permisos" (page is blocked entirely)
6. Go to **Matriz Documental** page:
   - ❌ Should see "No tienes permisos" (page is blocked entirely)

**Expected Result:** Only read-only access to Dashboard and Hallazgos

---

### Test 2: Provider Admin Role

1. Navigate to `http://localhost:5175`
2. Click "Admin Prestador" login button
3. Verify sidebar shows 6 items: Dashboard, Hallazgos, Evaluaciones, Matriz Documental, (no Reports, no Templates)
4. Go to **Hallazgos** page:
   - ✅ "Nuevo Hallazgo" button should be **VISIBLE**
5. Go to **Evaluaciones** page:
   - ✅ "Nueva Evaluación" button should be **VISIBLE**
6. Go to **Matriz Documental** page:
   - ✅ Upload icon should be **VISIBLE** in each row

**Expected Result:** Can see create buttons for allowed modules

---

### Test 3: Auditor Role

1. Navigate to `http://localhost:5175`
2. Click "Auditor" login button
3. Verify sidebar shows 9 items (missing Plantillas)
4. Go to **Hallazgos** page:
   - ✅ "Nuevo Hallazgo" button should be **VISIBLE**
5. Go to **Reportes** page:
   - ✅ Download buttons visible (auditor can view/download only)
   - ❌ No create buttons (auditor can't create new reports)
6. Go to **Proveedores** page:
   - ✅ Can see providers list
   - ❌ No create/edit buttons visible

**Expected Result:** Can create findings/assessments, view reports and providers, but can't manage them

---

### Test 4: Super Admin Role (Full Access)

1. Navigate to `http://localhost:5175`
2. Click "Super Admin" login button
3. Verify sidebar shows all 12 items across 4 sections
4. Go to **Hallazgos** page:
   - ✅ "Nuevo Hallazgo" button should be **VISIBLE**
5. Go to **Evaluaciones** page:
   - ✅ "Nueva Evaluación" button should be **VISIBLE**
6. Go to **Matriz Documental** page:
   - ✅ Upload icon should be **VISIBLE**
7. Go to **Reportes** page:
   - ✅ Download buttons visible
8. Go to **Plantillas** section:
   - ✅ Email, SMS, Push template editors visible

**Expected Result:** Full access with all action buttons visible

---

## 🔍 Verification Checklist

- [ ] Viewer role sees NO create buttons anywhere
- [ ] Viewer role cannot navigate to Evaluaciones/Documentos/Reports/Providers
- [ ] Provider Admin can create findings/assessments but cannot manage providers
- [ ] Auditor can view everything allowed but has limited create permissions
- [ ] Super Admin can create everything and access all buttons
- [ ] Upload buttons conditionally appear based on role
- [ ] Page headers show action buttons only when user has permission
- [ ] No console errors related to missing permissions
- [ ] Role switches work correctly (logout and re-login with different role)

---

## 🔐 Security Notes

- **Frontend only:** Button visibility is a UX feature for clarity
- **Backend enforcement:** API endpoints must also validate permissions (currently mock data)
- **Never rely on frontend checks:** Always validate on backend before performing actions
- **Token validation:** JWT token in localStorage contains user role for validation

---

## 📝 Component Implementation Details

### useRolePermission Hook Structure

```typescript
// Returns object with methods:
{
  can(resource, action) → boolean
  hasPermission(resource, action) → boolean
  userRole → UserRole
}
```

### Available Resources
- `findings` - Create, edit, delete findings
- `assessments` - Create, edit, delete assessments
- `documents` - Upload, edit, delete documents
- `reports` - Create, download reports
- `providers` - Manage providers
- `notifications` - Manage notification settings
- `templates` - Create email/SMS/push templates

### Available Actions
- `create` - New resource
- `edit` - Modify existing
- `delete` - Remove resource
- `view` - Read/view only

---

## 🚀 Next Steps

1. **Backend enforcement:** Implement role checks on API endpoints
2. **Data filtering:** Filter results based on user role (provider_admin sees only own provider)
3. **Audit logging:** Log create/edit/delete actions by role
4. **Role-based field visibility:** Hide form fields users can't edit
5. **Dynamic permissions:** Load permissions from database instead of hardcoded

---

## 🐛 Known Limitations

- Permissions are hardcoded (not database-driven)
- No support for custom roles yet
- No fine-grained field-level permissions
- Backend doesn't enforce role permissions yet (still uses mock data)

---

## 📞 Questions?

For permission questions, see: `RBAC.md`  
For route protection, see: `frontend/src/components/ProtectedRoute.tsx`  
For hook implementation, see: `frontend/src/hooks/useRolePermission.ts`
