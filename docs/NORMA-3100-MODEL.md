# Norma 3100 JSON Model — Complete Documentation

## Overview

This document describes the complete Norma 3100 data model extracted from the Excel file (`Archivo_Consolidaddo_Resolucion_3100-2019.xlsx`) and exported as a JSON model that serves as the source of truth for all compliance criteria.

## What Is This Model?

The **Norma 3100 JSON Model** (`docs/norma3100-model.json`) contains:

1. **7 Transversal Standards** (applicable to ALL health services):
   - TSTH — Talento Humano (20 criteria)
   - TSINF — Información (152 criteria)
   - TSDOT — Dotación (45 criteria)
   - TSMD — Medicamentos y Dispositivos (16 criteria)
   - TSPP — Procesos Prioritarios (52 criteria)
   - TSHCR — Historia Clínica y Registros (35 criteria)
   - TSINT — Integralidad (1 criterion)
   - **Total: 321 transversal criteria** (vs. 87 currently in database)

2. **Service-Specific Criteria** (34 services grouped in 5 groups):
   - Consulta Externa (4 services)
   - Apoyo Diagnóstico (17 services)
   - Internación (13 services)
   - Quirúrgico (1 service)
   - Atención Inmediata (4 services)
   - **Total: ~3,500+ service-specific criteria**

---

## JSON Model Structure

### Root Object

```json
{
  "version": "resolucion-3100-2019",
  "source": "Archivo_Consolidaddo_Resolucion_3100-2019.xlsx",
  "standards": [...],
  "service_groups": [...],
  "statistics": {...}
}
```

### Transversal Standards (`standards` array)

```json
{
  "code": "TSTH",
  "name": "Talento Humano",
  "is_transversal": true,
  "sheet_ref": "11.1.1TH",
  "criteria_count": 20,
  "criteria": [
    {
      "code": "TSTH-001",
      "number": "1",
      "text": "El talento humano en salud y otros profesionales...",
      "complexity": "simple|medium|high",
      "is_mandatory": true,
      "state": "C|NC|NA",
      "section": "Optional grouping section"
    },
    ...
  ]
}
```

**Fields:**
- `code`: Unique standard code (TSTH, TSINF, etc.)
- `name`: Human-readable standard name
- `is_transversal`: Always `true` for transversals
- `sheet_ref`: Reference to original Excel sheet
- `criteria_count`: Number of criteria in this standard
- `criteria`: Array of criteria objects

**Criterion Fields:**
- `code`: Unique criterion code (e.g., TSTH-001, TSTH-002)
- `number`: Criterion numbering from the Excel (e.g., "1", "1.1", "1.2.1")
- `text`: Full normative text from the Excel
- `complexity`: Determined from criteria text (simple, medium, high)
- `is_mandatory`: `true` except when state is "NA"
- `state`: Compliance state from Excel (C=Conforme, NC=No Conforme, NA=No Aplica)
- `section`: Optional grouping (e.g., "Complejidad baja", "Modalidad intramural")

### Service-Specific Criteria (`service_groups` array)

```json
{
  "group_code": "11.2",
  "group_name": "Consulta Externa",
  "services": [
    {
      "code": "CEG",
      "name": "Consulta Externa General",
      "sheet_ref": "11.2.1.S_CE_G",
      "applicable_transversal_standards": [
        "TSTH", "TSINF", "TSDOT", "TSMD", "TSPP", "TSHCR", "TSINT"
      ],
      "specific_standards": [
        {
          "code": "CEG_TH",
          "parent_transversal": "TSTH",
          "criteria": [
            {
              "number": "1",
              "text": "1. Cumple con los criterios que le sean aplicables...",
              "is_mandatory": true,
              "state": "C|NC|NA"
            },
            ...
          ]
        },
        {
          "code": "CEG_INF",
          "parent_transversal": "TSINF",
          "criteria": [...]
        }
      ],
      "multi_instance": false  // Optional: true for Diagnóstico Vascular (max 7 instances)
    }
  ]
}
```

**Service Fields:**
- `code`: Service code (CEG, CES, etc.) — matches `services.code` in database
- `name`: Service name
- `sheet_ref`: Original Excel sheet name
- `applicable_transversal_standards`: All 7 standards apply to every service
- `specific_standards`: Service-specific criteria organized by standard area
- `multi_instance`: (Optional) For services like Diagnóstico Vascular with multiple independent instances

**Special Case — Multi-Instance Services:**
```json
{
  "code": "DVX",
  "name": "Diagnóstico Vascular",
  "multi_instance": true,
  "max_instances": 7,
  "instance_label": "Sede de diagnóstico vascular",
  ...
}
```

---

## How Was This Model Generated?

### Step 1: Python Extraction Script

The `scripts/extract_norma3100.py` script:

1. Reads the Excel file using `openpyxl`
2. Iterates through all 47 sheets
3. Extracts transversal standards (sheets 3-9)
4. Extracts service-specific criteria (sheets 10-47)
5. Normalizes criterion numbering and text
6. Generates unique codes for each criterion
7. Exports to JSON

**Usage:**
```bash
python scripts/extract_norma3100.py \
  --input "docs/Norma 3100/Archivo_Consolidaddo_Resolucion_3100-2019.xlsx" \
  --output docs/norma3100-model.json
```

### Step 2: Database Import (TypeScript)

The `backend/scripts/import-norma3100.ts` script:

1. Reads `docs/norma3100-model.json`
2. Connects to PostgreSQL via Node.js Pool
3. Inserts transversal standards into `evaluation_standards` table
4. Inserts all transversal criteria into `evaluation_criteria` table
5. For each service:
   - Creates service-specific standards in `evaluation_standards`
   - Inserts service-specific criteria into `evaluation_criteria`

**Usage:**
```bash
cd backend
npm run import-norma3100  # Or: ts-node scripts/import-norma3100.ts
```

---

## Database Mapping

### evaluation_standards Table

| Column | JSON Source | Example |
|--------|-----------|---------|
| `code` | `standards[].code` | "TSTH" |
| `name` | `standards[].name` | "Talento Humano" |
| `is_transversal` | `standards[].is_transversal` | true |
| `service_id` | NULL (for transversals) | NULL |
| `status` | (hardcoded) | 'active' |

For service-specific standards:

| Column | JSON Source | Example |
|--------|-----------|---------|
| `code` | `service_groups[].services[].specific_standards[].code` | "CEG_TH" |
| `name` | Generated | "Consulta Externa General - TSTH" |
| `is_transversal` | false | false |
| `service_id` | (from services table) | UUID of CEG service |
| `status` | (hardcoded) | 'active' |

### evaluation_criteria Table

| Column | JSON Source | Example |
|--------|-----------|---------|
| `code` | `criteria[].code` | "TSTH-001" |
| `number` | `criteria[].number` | "1.1" |
| `description` | `criteria[].text` | "El talento humano en salud..." |
| `complexity` | `criteria[].complexity` | "simple" |
| `standard_id` | (from evaluation_standards) | UUID |
| `service_id` | NULL (for transversals) | NULL |
| `is_mandatory` | `criteria[].is_mandatory` | true |

---

## Current Database State vs. JSON Model

### Gap Analysis

| Aspect | Current BD | JSON Model | Gap |
|--------|-----------|-----------|-----|
| **Transversal Criteria** | 87 | 321 | +234 criteria (2.7x more) |
| **TSINF Criteria** | 15 | 152 | +137 (most discrepancy) |
| **Service-Specific Criteria** | 0 | ~3,500+ | Completely missing |
| **Services Covered** | 0 specific | 34 | New: all 34 services |

### Why the Discrepancy?

The Excel file contains **sub-criteria** that branch by complexity level or service modality:

**Example (TSINF):**
```
8. El prestador tiene acceso a fuentes de información...
   8.1 Complejidad baja
       8.1.1 Requisito A
       8.1.2 Requisito B
   8.2 Complejidad media
       8.2.1 Requisito C
   8.3 Complejidad alta
       8.3.1 Requisito D
```

The BD only stored the top-level items, while the JSON captures **all** variants.

---

## How to Use This Model

### Option 1: As a Questionnaire Template

When creating a new assessment for a service (e.g., CEG):

1. Load `docs/norma3100-model.json`
2. Find `service_groups[0].services[0]` (CEG)
3. Iterate through `applicable_transversal_standards` (all 7)
4. For each standard, fetch both:
   - Transversal criteria (from `standards[]`)
   - Service-specific criteria (from `specific_standards[]`)
5. Create a questionnaire with all criteria

**Example (Frontend):**
```typescript
const model = await fetch('/api/norma3100-model.json').then(r => r.json());
const cegService = model.service_groups[0].services[0];
const allCriteria = [
  ...model.standards.flatMap(s => s.criteria),  // Transversals
  ...cegService.specific_standards.flatMap(ss => ss.criteria)  // Service-specific
];
```

### Option 2: As a Compliance Audit Tool

When evaluating a provider:

1. Fetch all criteria for the provider's service
2. Present them in the UI grouped by standard
3. Allow provider to mark each as C/NC/NA
4. Calculate compliance percentage
5. Generate hallazgos for NC items

### Option 3: For Database Population

Run the import script once to populate all criteria:

```bash
cd backend
npm run import-norma3100
```

Then verify:

```sql
SELECT
  is_transversal,
  COUNT(*) as total_criteria
FROM evaluation_criteria
GROUP BY is_transversal;

-- Expected result:
-- is_transversal | total_criteria
-- true          | 321
-- false         | ~3,500
```

---

## Important Notes

### Multi-Instance Services

**Diagnóstico Vascular (DVX)** has `multi_instance: true` with `max_instances: 7`. This means:

- A provider can enable up to 7 independent diagnostic vascular locations
- Each instance is evaluated separately
- The assessment UI should allow creating 7 separate response sets

### Criterion Numbering

The `number` field preserves the original Excel numbering:
- Simple: "1", "2", "3"
- Nested: "1.1", "1.2", "2.1", "2.1.1"

This is important for:
- Displaying in UI (shows regulatory structure)
- Generating reports
- Audit trails

### Complexity Levels

Complexity is inferred from criterion text keywords:
- **simple**: Default, no keywords
- **medium**: Contains "media", "mediana"
- **high**: Contains "alta", "alta_complejidad"

This can be manually overridden in the DB if needed.

---

## Regenerating the Model

If the Excel source file is updated:

1. Update: `docs/Norma 3100/Archivo_Consolidaddo_Resolucion_3100-2019.xlsx`
2. Run extraction: `python scripts/extract_norma3100.py --input ... --output docs/norma3100-model.json`
3. Verify JSON structure and statistics
4. Commit the updated JSON to Git
5. If DB needs updating, run: `npm run import-norma3100` (in backend)

---

## Troubleshooting

### Missing Services

If a service from the model isn't found in the DB:

```sql
-- Check which services exist
SELECT code, name FROM services ORDER BY code;

-- Add missing service
INSERT INTO services (code, name, category, description, status) VALUES
  ('CEG', 'Consulta Externa General', 'Consulta Externa', 'Consulta Externa General', 'available')
  ON CONFLICT DO NOTHING;
```

### Duplicate Criteria

The import script uses `ON CONFLICT (code, service_id) DO NOTHING` to prevent duplicates. If re-running:

```sql
-- Check for duplicates
SELECT code, service_id, COUNT(*) FROM evaluation_criteria
GROUP BY code, service_id HAVING COUNT(*) > 1;
```

### Missing Sheets in Excel

If the Python extraction script warns about missing sheets, check the sheet names:

```python
import openpyxl
wb = openpyxl.load_workbook('docs/Norma 3100/Archivo_Consolidaddo_Resolucion_3100-2019.xlsx')
print([sheet for sheet in wb.sheetnames if 'S_' in sheet])
```

---

## Next Steps

1. ✅ **DONE**: Extract Norma 3100 data to JSON model
2. ✅ **DONE**: Create TypeScript import script
3. **TODO**: Run import script in CI/CD or manual setup
4. **TODO**: Create questionnaires for each service (optional)
5. **TODO**: Update UI to load criteria from this model
6. **TODO**: Add migration to preserve backward compatibility

---

## References

- **Resolución 3100 de 2019**: Ministerio de Salud y Protección Social de Colombia
- **Excel Source**: `docs/Norma 3100/Archivo_Consolidaddo_Resolucion_3100-2019.xlsx`
- **JSON Model**: `docs/norma3100-model.json`
- **Python Script**: `scripts/extract_norma3100.py`
- **TypeScript Script**: `backend/scripts/import-norma3100.ts`
- **SQL Seed**: `backend/db/seeds/norma3100-seed.sql` (documentation only)
