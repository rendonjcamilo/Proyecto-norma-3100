# Assessment Execution Components

React components for Norma 3100 assessment execution and response recording.

## Components

### AssessmentForm

Main assessment form component that renders the complete questionnaire with criteria grouped by standard.

**Features:**
- Display all criteria (40-80 total) grouped by standard
- 7 transversales + service-specific standards
- Real-time compliance % calculation
- Semáforo color status (verde/naranja/rojo)
- Auto-save every 30 seconds
- Manual save button
- Submit button (only if all criteria answered)
- Progress tracking (X of Y criteria)
- Collapsible standard groups for organization

**Props:**
```typescript
interface AssessmentFormProps {
  assessment: Assessment;
  questionnaiireData: {
    standards: Standard[];
  };
  onSave?: (responses: Response[]) => Promise<void>;
  onSubmit?: () => Promise<void>;
  readOnly?: boolean;
}
```

**Usage:**
```tsx
<AssessmentForm
  assessment={assessmentData}
  questionnaiireData={questionnaireData}
  onSave={handleSave}
  onSubmit={handleSubmit}
/>
```

---

### CriterionInput

Individual criterion input component with response options and validation.

**Features:**
- Radio buttons: Cumple (C), No Cumple (NC), No Aplica (NA)
- Required description field for NC responses (min 10 chars)
- Optional comment field for all responses
- Complexity badge (simple, medium, complex)
- Evidence upload placeholder
- Real-time validation
- Character counters (500 max)

**Props:**
```typescript
interface CriterionInputProps {
  criterion: Criterion;
  number: number;
  response?: CriterionResponse;
  onChange: (response: CriterionResponse) => void;
  readOnly?: boolean;
}
```

**Usage:**
```tsx
<CriterionInput
  criterion={criterionData}
  number={1}
  response={currentResponse}
  onChange={handleResponseChange}
/>
```

---

### ProgressBar

Visual progress indicator showing completion percentage.

**Features:**
- Shows X of Y criteria answered
- Color-coded based on completion:
  - Verde (Green) ≥ 80%
  - Naranja (Yellow) 50-79%
  - Rojo (Red) < 50%
- Responsive design
- Optional label display

**Props:**
```typescript
interface ProgressBarProps {
  completed: number;
  total: number;
  showLabel?: boolean;
}
```

**Usage:**
```tsx
<ProgressBar completed={10} total={25} />
```

---

### ScoresDisplay

Displays compliance scores and semáforo status.

**Features:**
- Overall compliance percentage
- Semáforo color (verde/naranja/rojo)
- Per-standard compliance breakdown
- Hallazgos (findings) count
- Color-coded grid for per-standard metrics

**Props:**
```typescript
interface ScoresDisplayProps {
  compliance: number;
  semaforo: 'verde' | 'naranja' | 'rojo';
  perStandardMetrics?: PerStandardMetric[];
  hallazgosCount?: number;
}
```

**Usage:**
```tsx
<ScoresDisplay
  compliance={75.5}
  semaforo="naranja"
  perStandardMetrics={metrics}
  hallazgosCount={5}
/>
```

---

## Integration Example

```tsx
import { AssessmentForm } from './Assessment';
import { useEffect, useState } from 'react';

export default function AssessmentPage({ assessmentId }) {
  const [assessment, setAssessment] = useState(null);
  const [questionnaire, setQuestionnaire] = useState(null);

  useEffect(() => {
    // Fetch assessment and questionnaire
    fetchAssessmentData(assessmentId);
  }, [assessmentId]);

  const handleSave = async (responses) => {
    await saveResponses(assessmentId, responses);
    // Refetch to get updated compliance %
    await fetchAssessmentData(assessmentId);
  };

  const handleSubmit = async () => {
    await submitAssessment(assessmentId);
    // Navigate to findings review
  };

  return (
    <AssessmentForm
      assessment={assessment}
      questionnaiireData={questionnaire}
      onSave={handleSave}
      onSubmit={handleSubmit}
    />
  );
}
```

---

## Styling

All components use CSS modules with the following color scheme:

**Semáforo Colors:**
- Verde (Green): #4CAF50
- Naranja (Yellow): #ff9800
- Rojo (Red): #f44336

**Standard Colors:**
- Transversales (Orange): #ff9800
- Service-Specific (Blue): #2196F3

**Status Colors:**
- Compliant (C): #4CAF50
- Non-Compliant (NC): #f44336
- Not Applicable (NA): #999

**UI Colors:**
- Primary: #2196F3
- Error: #f44336
- Success: #4CAF50
- Background: #f5f5f5
- Text: #333

---

## Localization

All text is in Spanish (es_CO) for Colombian Spanish compliance requirements:

- Cumple = Compliant
- No Cumple = Non-Compliant
- No Aplica = Not Applicable
- Hallazgo = Finding/Non-Compliance Issue
- Incumplimiento = Non-Compliance
- Evaluación = Assessment
- Criterio = Criterion
- Estándar = Standard
- Transversal = Transversal/Cross-cutting

---

## Responsive Design

All components are responsive and optimized for:
- Desktop (1920px - 1024px)
- Tablet (1024px - 768px)
- Mobile (< 768px)

---

## Performance Considerations

- Auto-save throttled to 30-second intervals
- Collapsible standards reduce DOM size for large questionnaires
- Memoization recommended for large lists
- Lazy loading of standards sections possible
- Local state management for responsive UI

---

## Testing

Components are designed to be testable with clear separation of concerns:

Example tests:
- ProgressBar updates correctly based on completed/total props
- CriterionInput validates description for NC responses
- AssessmentForm calls onSave when save button clicked
- Compliance % updates in real-time as responses change

---

## Future Enhancements

- [ ] Evidence file upload integration
- [ ] PDF export of completed assessment
- [ ] Conditional criteria display (show criteria based on parent responses)
- [ ] Bulk response import from CSV
- [ ] Comparison with previous assessment versions
- [ ] Offline mode with sync when online
- [ ] Keyboard shortcuts for faster data entry
- [ ] Voice input for descriptions
- [ ] Multi-language support

---

## References

- Phase 3 Task 5 PLAN.md
- ASSESSMENT_EXECUTION_API.md (backend API documentation)
- AssessmentService.ts (backend logic)
