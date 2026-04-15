# Guía: Generar Evaluaciones sin Base de Datos

## 📋 Descripción General

Se ha implementado un sistema completo para generar evaluaciones de cumplimiento Norma 3100 **sin requerir base de datos**. El sistema utiliza el modelo JSON (`docs/norma3100-model.json`) como fuente de datos.

### Características:

✅ **34 servicios de salud** disponibles
✅ **7 estándares transversales** + criterios específicos por servicio
✅ **3,768 criterios totales** (321 transversales + 3,447 específicos)
✅ **Cálculo automático de métricas** de cumplimiento
✅ **Generación automática de hallazgos** por inconformidades
✅ **Semáforo visual** (verde/naranja/rojo)
✅ **Sin dependencia de BD** - funciona completamente con archivos JSON

---

## 🚀 Cómo Empezar

### 1. Backend - Servicios sin BD

El backend proporciona endpoints que utilizan el modelo JSON:

**Nueva ruta registrada en `backend/src/index.ts`:**
```typescript
app.use('/api', apiLimiter, createNorma3100Router());
```

**Archivos creados:**
- `backend/src/services/Norma3100Service.ts` - Servicio que carga y gestiona el modelo JSON
- `backend/src/routes/norma3100.routes.ts` - Endpoints API para evaluaciones

### 2. Frontend - Componentes React

Se han creado dos nuevos componentes:

**1. AssessmentGeneratorPage** (`frontend/src/pages/AssessmentGeneratorPage.tsx`)
- Interfaz en 3 pasos para crear evaluaciones
- Selección de servicio
- Selección de versión de evaluación
- Respuesta de criterios con cálculo en tiempo real

**2. AssessmentResultPage** (`frontend/src/pages/AssessmentResultPage.tsx`)
- Muestra resultados de la evaluación
- Semáforo de cumplimiento
- Métricas por estándar
- Lista de hallazgos por severidad

---

## 📡 Endpoints API Disponibles

### 1. Obtener Servicios Disponibles
```bash
GET /api/norma3100/services
```

**Respuesta:**
```json
{
  "success": true,
  "count": 34,
  "services": [
    {
      "code": "CEG",
      "name": "Consulta Externa General",
      "groupName": "Consulta Externa",
      "totalCriteria": 128
    },
    ...
  ]
}
```

### 2. Obtener Estándares Transversales
```bash
GET /api/norma3100/standards
```

**Respuesta:**
```json
{
  "success": true,
  "count": 7,
  "standards": [
    {
      "code": "TSTH",
      "name": "Talento Humano",
      "criteriaCount": 20
    },
    ...
  ]
}
```

### 3. Crear Cuestionario para un Servicio
```bash
GET /api/norma3100/questionnaires/{serviceCode}/{version}
```

**Ejemplo:**
```bash
GET /api/norma3100/questionnaires/CEG/initial
```

**Parámetros:**
- `serviceCode`: Código del servicio (CEG, URG, HGP, etc.)
- `version`: initial | year4 | annual | pre-novelty

**Respuesta:**
```json
{
  "success": true,
  "questionnaire": {
    "id": "uuid",
    "name": "Evaluación Consulta Externa General - initial",
    "serviceCode": "CEG",
    "serviceName": "Consulta Externa General",
    "versionType": "initial",
    "totalCriteria": 128,
    "criteria": [
      {
        "id": "uuid",
        "code": "TSTH-001",
        "number": "1",
        "text": "El talento humano en salud...",
        "standardCode": "TSTH",
        "standardName": "Talento Humano",
        "isTransversal": true,
        "complexity": "simple",
        "isMandatory": true
      },
      ...
    ]
  }
}
```

### 4. Registrar Respuestas de Evaluación
```bash
PUT /api/norma3100/assessments/{id}/responses
Content-Type: application/json
```

**Body:**
```json
{
  "serviceCode": "CEG",
  "responses": {
    "criterion-id-1": "C",
    "criterion-id-2": "NC",
    "criterion-id-3": "NA"
  },
  "criteria": [/* array de criterios del cuestionario */]
}
```

**Respuesta:**
```json
{
  "success": true,
  "assessment": {
    "id": "assessment-id",
    "status": "in_progress",
    "metrics": {
      "totalCriteria": 128,
      "evaluatedCriteria": 128,
      "cumple": 100,
      "noCumple": 20,
      "noAplica": 8,
      "compliancePercent": 83.33,
      "semaforo": "verde",
      "complianceByStandard": [
        {
          "code": "TSTH",
          "name": "Talento Humano",
          "totalCriteria": 20,
          "cumple": 15,
          "noCumple": 3,
          "noAplica": 2,
          "compliancePercent": 83.33
        },
        ...
      ]
    },
    "hallazgos": [
      {
        "id": "hallazgo-id",
        "assessmentId": "assessment-id",
        "criterionId": "criterion-id",
        "criterionCode": "TSTH-005",
        "criterionText": "...",
        "standardCode": "TSTH",
        "severity": "alta",
        "findingDescription": "No cumple con criterio TSTH-005: ...",
        "createdAt": "2024-04-15T..."
      }
    ]
  }
}
```

### 5. Obtener Criterios por Estándar
```bash
GET /api/norma3100/criteria/{serviceCode}/{standardCode}
```

**Ejemplo:**
```bash
GET /api/norma3100/criteria/CEG/TSTH
```

### 6. Crear Assessment
```bash
POST /api/norma3100/assessments
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "serviceCode": "CEG",
  "version": "initial",
  "providerId": "provider-id",
  "locationId": "location-id"
}
```

### 7. Obtener Modelo Completo
```bash
GET /api/norma3100/model
```

Retorna el modelo JSON completo (útil para frontend si quiere construir UIs dinámicas).

---

## 🎨 Uso en el Frontend

### 1. Navegar a Crear Evaluación

Añade una ruta en `frontend/src/App.tsx`:

```typescript
import { AssessmentGeneratorPage } from '@pages/AssessmentGeneratorPage';
import { AssessmentResultPage } from '@pages/AssessmentResultPage';

// En el Router:
<Route path="/assessments/new" element={<AssessmentGeneratorPage />} />
<Route path="/assessments/result/:id" element={<AssessmentResultPage />} />
```

### 2. Hook useAuth (si es necesario)

El componente usa `useAuth` para obtener datos del usuario autenticado:

```typescript
const { user } = useAuth();
```

Si no tienes este hook, puedes crear uno simple:

```typescript
export function useAuth() {
  return {
    user: {
      id: localStorage.getItem('userId') || 'mock-user',
      providerId: localStorage.getItem('providerId') || 'mock-provider',
      role: localStorage.getItem('userRole') || 'provider_admin'
    }
  };
}
```

### 3. Crear un Botón de Acceso

En tu página principal o menú:

```typescript
<button onClick={() => navigate('/assessments/new')}>
  Crear Nueva Evaluación
</button>
```

---

## 📊 Flujo de Uso

```
Usuario hace clic en "Nueva Evaluación"
    ↓
[Paso 1] Selecciona servicio (CEG, URG, HGP, etc.)
    ↓
[Paso 2] Selecciona versión (initial, annual, year4, pre-novelty)
    ↓
[Paso 3] Responde cuestionario
    ├─ API carga 128-250 criterios
    ├─ Usuario responde: Cumple / No Cumple / No Aplica
    ├─ Cálculo en tiempo real de % cumplimiento
    └─ Semáforo visual (verde/naranja/rojo)
    ↓
Usuario hace clic en "Calcular Métricas"
    ├─ Computa compliance %
    ├─ Genera hallazgos para NC
    └─ Calcula por estándar
    ↓
Usuario guarda la evaluación
    ↓
[Página de Resultados]
    ├─ Semáforo de cumplimiento
    ├─ Desglose por estándar
    ├─ Lista de hallazgos
    └─ Opción de descargar reporte
```

---

## 🔍 Estructura de Datos

### Modelo JSON (`docs/norma3100-model.json`)

```
{
  "version": "resolucion-3100-2019",
  "standards": [
    {
      "code": "TSTH",
      "name": "Talento Humano",
      "criteria": [
        {
          "code": "TSTH-001",
          "number": "1",
          "text": "...",
          "complexity": "simple|medium|high",
          "is_mandatory": true
        }
      ]
    }
  ],
  "service_groups": [
    {
      "group_name": "Consulta Externa",
      "services": [
        {
          "code": "CEG",
          "name": "Consulta Externa General",
          "specific_standards": [
            {
              "code": "CEG_TH",
              "parent_transversal": "TSTH",
              "criteria": [...]
            }
          ]
        }
      ]
    }
  ]
}
```

---

## 🎯 Casos de Uso

### 1. Evaluación Rápida de un Servicio
```bash
# Usuario selecciona CEG (Consulta Externa General)
GET /api/norma3100/questionnaires/CEG/initial
# Obtiene 128 criterios (87 transversales + 41 específicos)
# Responde todos
# Sistema calcula automáticamente 83% cumplimiento → Semáforo VERDE
```

### 2. Comparar Cumplimiento Entre Servicios
```bash
# Crear evaluación para CEG (Consulta)
GET /api/norma3100/questionnaires/CEG/initial
# Crear evaluación para URG (Urgencias)
GET /api/norma3100/questionnaires/URG/initial
# Comparar % cumplimiento entre servicios
```

### 3. Seguimiento Anual
```bash
# Primera evaluación: initial
GET /api/norma3100/questionnaires/HGP/initial
# Año siguiente: annual
GET /api/norma3100/questionnaires/HGP/annual
# El sistema mantiene histórico en localStorage
```

---

## 💾 Persistencia de Datos

### LocalStorage
Las evaluaciones se guardan en el navegador:

```typescript
localStorage.setItem('lastAssessment', JSON.stringify(assessment));
```

Para recuperar:
```typescript
const saved = localStorage.getItem('lastAssessment');
const assessment = JSON.parse(saved);
```

### Para Base de Datos (Futuro)
Cuando se implemente BD, cambiar:
```typescript
// Antes (sin BD):
const response = await fetch('/api/norma3100/assessments', { ... });

// Después (con BD):
const response = await fetch('/api/assessments', { ... });
```

---

## 🐛 Troubleshooting

### Problema: "Modelo JSON no encontrado"
**Solución:**
```bash
# Verificar que existe:
ls -la docs/norma3100-model.json

# Regenerar si es necesario:
python scripts/extract_norma3100.py \
  --input "docs/Norma 3100/Archivo_Consolidaddo_Resolucion_3100-2019.xlsx" \
  --output docs/norma3100-model.json
```

### Problema: Endpoint retorna 404
**Solución:**
```bash
# Verificar que la ruta está registrada en backend/src/index.ts
grep -n "norma3100" backend/src/index.ts

# Debería mostrar:
# import { createNorma3100Router } from './routes/norma3100.routes.js';
# app.use('/api', apiLimiter, createNorma3100Router());
```

### Problema: Componente no se renderiza
**Solución:**
```typescript
// En App.tsx, agregar ruta:
import { AssessmentGeneratorPage } from '@pages/AssessmentGeneratorPage';
import { AssessmentResultPage } from '@pages/AssessmentResultPage';

<Route path="/assessments/new" element={<AssessmentGeneratorPage />} />
<Route path="/assessments/result/:id" element={<AssessmentResultPage />} />
```

---

## 📈 Próximos Pasos

### Cuando se Implemente BD:

1. **Migrar datos del JSON a BD**
   ```bash
   npm run import-norma3100  # en backend/
   ```

2. **Cambiar endpoints**
   - Actualizar calls en frontend de `/api/norma3100/*` a `/api/*`
   - Mantener compatibilidad con endpoints JSON por ahora

3. **Agregar persistencia**
   - Guardar evaluaciones en BD
   - Implementar histórico
   - Agregar reportes

4. **Agregar validaciones**
   - Evidencia adjunta
   - Auditoría de cambios
   - Flujos de aprobación

---

## 📞 Soporte

Para más información:
- Ver: `docs/NORMA-3100-MODEL.md` - Especificación técnica del modelo
- Ver: `backend/src/services/Norma3100Service.ts` - Implementación del servicio
- Ver: `backend/src/routes/norma3100.routes.ts` - Documentación de endpoints

---

**¡Listo para crear evaluaciones sin base de datos! 🎉**
