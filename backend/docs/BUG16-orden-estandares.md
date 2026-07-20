# BUG #16: Orden de Estándares según Normatividad para IPS y Profesional Independiente

## Resumen

El orden de presentación de los 7 estándares transversales en la interfaz de evaluación es **incorrecto** debido a que `GET /api/assessments/:id/questions` ordena por `standard_id` (UUID aleatorio) en lugar de usar el orden normativo establecido en la Res. 3100 de 2019.

---

## 1. Estructura actual: `evaluation_standards`

**Archivo:** `backend/db/evaluation-schema.sql` (líneas 14-36)

La tabla `evaluation_standards` **NO tiene columna `sort_order`**. Su definición es:

```sql
CREATE TABLE IF NOT EXISTS evaluation_standards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_transversal BOOLEAN DEFAULT FALSE,
    service_id UUID REFERENCES services(id),
    category VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(code, service_id, is_transversal)
);
```

Solo `evaluation_criteria` tiene `sort_order` (añadido en migración `2026-05-15-sort-order-criteria.sql`).

---

## 2. Orden actual en el INSERT de `evaluation-schema.sql` (líneas 192-220)

El INSERT define los 7 estándares en este orden:

| # | Código | Nombre | Categoría |
|---|--------|--------|-----------|
| 1 | TSTH | Talento Humano | Talento Humano |
| 2 | TSINF | Infraestructura | Infraestructura |
| 3 | TSDOT | Dotación | Dotación |
| 4 | TSMD | Medicamentos, Dispositivos Médicos e Insumos | Medicamentos y Dispositivos |
| 5 | TSPP | Procesos Prioritarios | Procesos Asistenciales |
| 6 | TSHCR | Historia Clínica y Registros | Historia Clínica |
| 7 | TSINT | Interdependencia de Servicios | Interdependencia |

---

## 3. Análisis de los endpoints del backend

### ✅ `QuestionnaireService.ts` — CORRECTO

**`getQuestionnaire()`** (líneas 193-206) y **`getServiceTemplate()`** (líneas 486-497) usan un `ORDER BY CASE` explícito con el orden normativo correcto:

```sql
ORDER BY CASE es.code
  WHEN 'TSTH'  THEN 1
  WHEN 'TSINF' THEN 2
  WHEN 'TSDOT' THEN 3
  WHEN 'TSMD'  THEN 4
  WHEN 'TSPP'  THEN 5
  WHEN 'TSHCR' THEN 6
  WHEN 'TSINT' THEN 7
  ELSE 8
END
```

Estos endpoints **sí** devuelven los estándares en el orden correcto.

### ❌ `assessments.routes.ts` — INCORRECTO (EL BUG)

**`GET /api/assessments/:id/questions`** (línea 380) ordena con:

```sql
ORDER BY is_transversal DESC, standard_id, sort_order NULLS LAST, code
```

El problema: `standard_id` es un **UUID** generado aleatoriamente (`gen_random_uuid()`). Ordenar por UUID produce un orden esencialmente **aleatorio** para los estándares dentro del grupo de transversales. Los criterios individuales dentro de cada estándar sí se ordenan correctamente por `sort_order`.

**Nota:** Este endpoint (`/assessments/:id/questions`) es el que consume el frontend en `AssessmentForm.tsx` (via `assessmentsApi.getQuestions()`).

---

## 4. Análisis del frontend `AssessmentForm.tsx`

**Archivo:** `frontend/src/components/Assessment/AssessmentForm.tsx`

**Líneas 305-306** — El componente filtra estándares pero **no aplica ningún orden propio**:

```typescript
const transversales = questionnaiireData.standards.filter((s) => s.isTransversal);
const serviceSpecific = questionnaiireData.standards.filter((s) => !s.isTransversal);
```

Luego renderiza con `{transversales.map((standard) => ( ... ))}`, que itera en el orden que llegue del backend. No hay `.sort()` ni lógica de reordenamiento.

**Conclusión:** El frontend depende completamente del orden que devuelva el backend. Si el backend ordena por UUID aleatorio, el frontend mostrará los estándares en orden aleatorio.

---

## 5. El orden normativo correcto (Res. 3100 de 2019)

Según la Resolución 3100 de 2019, Capítulo 11 — Condición 3 (Capacidad Tecnológica y Científica):

| # | Código | Estándar | Hoja Excel | Criterios |
|---|--------|----------|------------|-----------|
| 1 | **TSTH** | **Talento Humano** | 11.1.1 | 25 |
| 2 | **TSINF** | **Infraestructura** | 11.1.2 | 197 |
| 3 | **TSDOT** | **Dotación** | 11.1.3 | 63 |
| 4 | **TSMD** | **Medicamentos, Dispositivos Médicos e Insumos** | 11.1.4 | 56 |
| 5 | **TSPP** | **Procesos Prioritarios** | 11.1.5 | 109 |
| 6 | **TSHCR** | **Historia Clínica y Registros** | 11.1.6 | 56 |
| 7 | **TSINT** | **Interdependencia de Servicios** | 11.1.7 | 6 |

**Este orden aplica tanto a IPS como a profesionales independientes.** La diferencia entre IPS y profesional independiente no está en el orden de los estándares sino en qué criterios aplican (ej: TSTH-003 dice explícitamente "Este criterio no aplica para profesionales independientes de salud").

---

## 6. Diferencia IPS vs. Profesional Independiente

En el proyecto existe un precedente para ordenar por tipo de prestador en `DocumentsPage.tsx` (líneas 217-247), donde `CATEGORY_ORDER` varía entre IPS e independiente. Para los estándares transversales, sin embargo, **no hay diferencia normativa en el orden** — los 7 estándares se presentan igual.

---

## 7. Corrección requerida

### Opción A (recomendada): Corregir ORDER BY en `assessments.routes.ts`

Reemplazar línea 380:
```sql
ORDER BY is_transversal DESC, standard_id, sort_order NULLS LAST, code
```
Por:
```sql
ORDER BY is_transversal DESC,
  CASE es.code
    WHEN 'TSTH'  THEN 1
    WHEN 'TSINF' THEN 2
    WHEN 'TSDOT' THEN 3
    WHEN 'TSMD'  THEN 4
    WHEN 'TSPP'  THEN 5
    WHEN 'TSHCR' THEN 6
    WHEN 'TSINT' THEN 7
    ELSE 8
  END,
  sort_order NULLS LAST,
  code
```

### Opción B (preventiva): Añadir `sort_order` a `evaluation_standards`

Crear una migración que añada `sort_order` a la tabla `evaluation_standards` y lo poble con valores 1-7, luego usarlo en todos los ORDER BY. Esto es más mantenible que el CASE statement hardcodeado.

### Opción C (frontend): Ordenar en `AssessmentForm.tsx`

Si no se puede cambiar el backend inmediatamente, agregar en `AssessmentForm.tsx`:
```typescript
const STANDARD_ORDER = ['TSTH', 'TSINF', 'TSDOT', 'TSMD', 'TSPP', 'TSHCR', 'TSINT'];
const transversales = questionnaiireData.standards
  .filter((s) => s.isTransversal)
  .sort((a, b) => STANDARD_ORDER.indexOf(a.code) - STANDARD_ORDER.indexOf(b.code));
```

---

## 8. Conclusión

| Aspecto | Estado |
|---------|--------|
| `evaluation_standards` tiene `sort_order`? | ❌ No |
| `evaluation_criteria` tiene `sort_order`? | ✅ Sí (migración 2026-05-15) |
| `QuestionnaireService.getQuestionnaire()` ordena correctamente? | ✅ Sí (CASE statement) |
| `QuestionnaireService.getServiceTemplate()` ordena correctamente? | ✅ Sí (CASE statement) |
| `assessments.routes.ts` ordena correctamente? | ❌ **No** (ordena por UUID) |
| `AssessmentForm.tsx` ordena en frontend? | ❌ No (depende del backend) |
| El orden normativo de los 7 estándares es correcto en el CASE? | ✅ Sí |

**El bug está en `backend/src/routes/assessments.routes.ts` línea 380**, donde `ORDER BY ... standard_id ...` debe reemplazarse por el mismo `CASE es.code` que ya existe correctamente en `QuestionnaireService.ts`.
