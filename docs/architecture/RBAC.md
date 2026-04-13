# RBAC (Role-Based Access Control) — Norma 3100

**Última actualización:** 2026-04-13  
**Status:** Implementado en Frontend + Backend

---

## 📋 Resumen de Roles

| Rol | Nivel | Acceso | Casos de uso |
|-----|-------|--------|-------------|
| **super_admin** | 🔴 Máximo | Todo | Administradores del sistema |
| **auditor** | 🟠 Alto | Mayoría (sin templates) | Auditores certificados |
| **provider_admin** | 🟡 Medio | Su prestador + documentos | Administradores hospitalarios |
| **viewer** | 🟢 Mínimo | Solo lectura (dashboard+hallazgos) | Consulta solamente |

---

## 🎯 Super Admin (👤 Super Admin)

**Perfil:** Administrador del sistema con acceso total

### Menú Visible (12 items)
```
GENERAL (4)
├─ Dashboard
├─ Hallazgos
├─ Evaluaciones
└─ Proveedores

CUMPLIMIENTO (2)
├─ Matriz Documental
└─ Reportes

NOTIFICACIONES (3)
├─ Analíticas
├─ Entregas
└─ Preferencias

PLANTILLAS (3)
├─ Email
├─ SMS
└─ Push
```

### Permisos de Funcionalidad

| Módulo | Ver | Crear | Editar | Eliminar | Notas |
|--------|-----|-------|--------|----------|-------|
| **Dashboard** | ✅ | - | - | - | Vista global de compliance |
| **Hallazgos** | ✅ | ✅ | ✅ | ✅ | Cualquier prestador |
| **Evaluaciones** | ✅ | ✅ | ✅ | ✅ | A cualquier prestador |
| **Proveedores** | ✅ | ✅ | ✅ | ✅ | Administración total |
| **Documentos** | ✅ | ✅ | ✅ | ✅ | Upload de cualquier doc |
| **Reportes** | ✅ | ✅ | - | - | Generar PDF/Excel |
| **Notificaciones** | ✅ | ✅ | ✅ | ✅ | Configuración total |
| **Plantillas** | ✅ | ✅ | ✅ | ✅ | Email, SMS, Push |
| **Usuarios** | ✅ | ✅ | ✅ | ✅ | Gestionar accesos |

### Rutas Protegidas (/routes)
- ✅ `/` (Dashboard)
- ✅ `/findings`
- ✅ `/assessments`
- ✅ `/providers` ← **Restringida a auditor/super_admin**
- ✅ `/documents`
- ✅ `/reports` ← **Restringida a auditor/super_admin**
- ✅ `/notifications/*`
- ✅ `/notifications/templates/*` ← **Solo super_admin**

---

## 📋 Auditor (📋 Auditor)

**Perfil:** Auditor certificado que puede crear evaluaciones y hallazgos

### Menú Visible (9 items)
```
GENERAL (4)
├─ Dashboard
├─ Hallazgos
├─ Evaluaciones
└─ Proveedores

CUMPLIMIENTO (2)
├─ Matriz Documental
└─ Reportes

NOTIFICACIONES (3)
├─ Analíticas
├─ Entregas
└─ Preferencias
```

**NO ve:** Plantillas (Email, SMS, Push)

### Permisos de Funcionalidad

| Módulo | Ver | Crear | Editar | Eliminar | Notas |
|--------|-----|-------|--------|----------|-------|
| **Dashboard** | ✅ | - | - | - | Solo lectura |
| **Hallazgos** | ✅ | ✅ | ✅ | ❌ | Crear/editar propios |
| **Evaluaciones** | ✅ | ✅ | ✅ | ❌ | Crear auditorías |
| **Proveedores** | ✅ | ❌ | ❌ | ❌ | Solo ver lista |
| **Documentos** | ✅ | ❌ | ❌ | ❌ | Solo lectura |
| **Reportes** | ✅ | ❌ | - | - | Solo descargar |
| **Notificaciones** | ✅ | ❌ | ❌ | ❌ | Solo lectura |
| **Plantillas** | ❌ | ❌ | ❌ | ❌ | **NO ACCESO** |
| **Usuarios** | ❌ | ❌ | ❌ | ❌ | **NO ACCESO** |

### Rutas Protegidas
- ✅ `/` (Dashboard)
- ✅ `/findings`
- ✅ `/assessments`
- ✅ `/providers` ← **Auditor SÍ puede**
- ✅ `/documents`
- ✅ `/reports` ← **Auditor SÍ puede**
- ✅ `/notifications/preferences`, `/notifications/analytics`, `/notifications/delivery-status`
- ❌ `/notifications/templates/*` ← **BLOQUEADO**

---

## 🏥 Admin Prestador (🏥 Admin Prestador)

**Perfil:** Administrador de un prestador/hospital específico

### Menú Visible (6 items)
```
GENERAL (3)
├─ Dashboard
├─ Hallazgos
└─ Evaluaciones

CUMPLIMIENTO (2)
├─ Matriz Documental
└─ (NO: Reportes)

NOTIFICACIONES (1)
└─ Preferencias
```

**NO ve:** Proveedores, Reportes, Analíticas, Entregas, Plantillas

### Permisos de Funcionalidad

| Módulo | Ver | Crear | Editar | Eliminar | Notas |
|--------|-----|-------|--------|----------|-------|
| **Dashboard** | ✅ | - | - | - | Solo su prestador |
| **Hallazgos** | ✅ | ✅ | ✅ | ❌ | Solo de su prestador |
| **Evaluaciones** | ✅ | ✅ | ✅ | ❌ | Solo su prestador |
| **Proveedores** | ❌ | ❌ | ❌ | ❌ | **NO ACCESO** |
| **Documentos** | ✅ | ✅ | ✅ | ❌ | Upload de evidencia |
| **Reportes** | ❌ | ❌ | - | - | **NO ACCESO** |
| **Notificaciones** | ❌ | ❌ | ❌ | ❌ | **NO ACCESO** |
| **Plantillas** | ❌ | ❌ | ❌ | ❌ | **NO ACCESO** |
| **Usuarios** | ❌ | ❌ | ❌ | ❌ | **NO ACCESO** |

### Rutas Protegidas
- ✅ `/` (Dashboard)
- ✅ `/findings`
- ✅ `/assessments`
- ❌ `/providers` ← **BLOQUEADO**
- ✅ `/documents`
- ❌ `/reports` ← **BLOQUEADO**
- ❌ `/notifications/*` ← **BLOQUEADO**
- ❌ `/notifications/templates/*` ← **BLOQUEADO**

### Restricción: Own Provider Only
- `provider_id` en token debe coincidir con el prestador accedido
- Si intenta ver otro prestador → Error 403 Forbidden

---

## 👁️ Visualizador (👁️ Visualizador)

**Perfil:** Consulta de lectura solo — sin permisos de modificación

### Menú Visible (2 items)
```
GENERAL (2)
├─ Dashboard
└─ Hallazgos
```

**NO ve:** Evaluaciones, Proveedores, Documentos, Reportes, Notificaciones, Plantillas

### Permisos de Funcionalidad

| Módulo | Ver | Crear | Editar | Eliminar | Notas |
|--------|-----|-------|--------|----------|-------|
| **Dashboard** | ✅ | ❌ | ❌ | ❌ | Solo lectura |
| **Hallazgos** | ✅ | ❌ | ❌ | ❌ | Solo lectura |
| **Evaluaciones** | ❌ | ❌ | ❌ | ❌ | **NO ACCESO** |
| **Proveedores** | ❌ | ❌ | ❌ | ❌ | **NO ACCESO** |
| **Documentos** | ❌ | ❌ | ❌ | ❌ | **NO ACCESO** |
| **Reportes** | ❌ | ❌ | ❌ | ❌ | **NO ACCESO** |
| **Notificaciones** | ❌ | ❌ | ❌ | ❌ | **NO ACCESO** |
| **Plantillas** | ❌ | ❌ | ❌ | ❌ | **NO ACCESO** |
| **Usuarios** | ❌ | ❌ | ❌ | ❌ | **NO ACCESO** |

### Rutas Protegidas
- ✅ `/` (Dashboard)
- ✅ `/findings`
- ❌ `/assessments` ← **BLOQUEADO**
- ❌ `/providers` ← **BLOQUEADO**
- ❌ `/documents` ← **BLOQUEADO**
- ❌ `/reports` ← **BLOQUEADO**
- ❌ `/notifications/*` ← **BLOQUEADO**
- ❌ `/notifications/templates/*` ← **BLOQUEADO**

---

## 🔐 Matriz de Comparación Rápida

```
                    Super Admin  Auditor  Admin Prov  Viewer
┌─────────────────────────────────────────────────────────────┐
│ Dashboard          ✅ Global    ✅ Global  ✅ Propio    ✅ Solo
│ Hallazgos          ✅ CRUD      ✅ CRU     ✅ CRU       ✅ R
│ Evaluaciones       ✅ CRUD      ✅ CRU     ✅ CRU       ❌
│ Proveedores        ✅ CRUD      ✅ R       ❌           ❌
│ Documentos         ✅ CRUD      ✅ R       ✅ CRU       ❌
│ Reportes           ✅ CRU       ✅ R       ❌           ❌
│ Notificaciones     ✅ CRUD      ✅ R       ❌           ❌
│ Plantillas         ✅ CRUD      ❌         ❌           ❌
│ Usuarios           ✅ CRUD      ❌         ❌           ❌
│ Total Menú         12 items     9 items    6 items     2 items
└─────────────────────────────────────────────────────────────┘

Leyenda:
✅ = Acceso permitido
❌ = Acceso denegado
C = Create (crear)
R = Read (ver)
U = Update (editar)
D = Delete (eliminar)
```

---

## 📂 Dónde está implementado

### Frontend
- **Sidebar filtering:** `/frontend/src/components/Layout/Sidebar.tsx` (líneas 11-75)
  - Cada `NavItem` tiene array `roles`
  - Sidebar filtra items según `user.role`

- **Route protection:** `/frontend/src/App.tsx` (líneas 114-207)
  - `<ProtectedRoute requiredRoles={[...]}>`
  - Valida `user.role` antes de renderizar

- **Auth context:** `/frontend/src/context/AuthContext.tsx`
  - `user.role` disponible en contexto
  - Tipos: `'super_admin' | 'auditor' | 'provider_admin' | 'viewer'`

### Backend
- **RBAC Service:** `/backend/src/services/rbac.service.ts`
  - Enum con 3 roles (backend), enum con 4 (frontend)
  - Matriz de permisos: resource × role × action

- **RBAC Middleware:** `/backend/src/middleware/rbac.middleware.ts`
  - Valida token JWT
  - Chequea rol contra rutas protegidas

- **Endpoints:** Todos tienen `authorize(['role1', 'role2'])`

---

## 🔄 Flujo de Validación

```
1. Usuario login → AuthContext.loginWithMock(email, role)
   └─ Guarda `user.role` en localStorage

2. Page render → Sidebar filtra menú según `user.role`
   └─ Items sin permiso = no se muestran

3. User click en link → ProtectedRoute chequea `user.role`
   └─ Si no tiene role → Error 403 o redirige a login

4. API call → Backend JWT verifica `token.role`
   └─ Si no tiene permiso → Error 403
```

---

## ⚠️ Casos Edge

| Caso | Resultado |
|------|-----------|
| Acceso URL directa a /providers como Visualizador | ❌ Error "No tienes permisos" |
| Admin Prestador intenta ver otros prestadores | ❌ provider_id mismatch → 403 |
| Token expirado | ❌ Redirige a /login |
| Role inválido en token | ❌ Invalid token → 401 |

---

## 📝 Testear cada rol

**Script rápido (en browser DevTools):**
```javascript
// Logout
localStorage.removeItem('auth_user');
localStorage.removeItem('auth_token');
location.reload();

// Luego en LoginPage, elige un rol:
// - Super Admin (12 menú items)
// - Auditor (9 items)
// - Admin Prestador (6 items)
// - Visualizador (2 items)
```

---

## 🚀 Próximos pasos (si BD está conectada)

Estos permisos se aplicarían también a datos backend:
- `SELECT ... WHERE provider_id = :user_provider_id` (Admin Prestador)
- `SELECT ... WHERE assigned_to = :user_id` (Auditor)
- Solo lectura para Viewer (no queries de modificación)

Por ahora, con datos mock, solo el frontend filtra.
