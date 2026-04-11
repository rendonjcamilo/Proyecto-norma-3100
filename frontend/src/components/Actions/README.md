# Actions Module - Action Tracking & Corrective Action UI

## Overview

The Actions module provides a comprehensive UI for tracking corrective actions and progress in the Norma 3100 compliance system. It includes components for providers to update progress on actions and for auditors to review and approve/reject actions.

## Components

### 1. ActionsList
Main list component showing all actions with filters and sorting.

**Props:**
- `providerId?: string` - Filter to specific provider's actions
- `readonly?: boolean` - Set to true for auditor read-only view (default: false)

**Features:**
- Filter by status (abierta, en_progreso, cerrada)
- Filter by priority (crítica, alta, media, baja)
- Sort by deadline, priority, or progress
- Inline progress bars
- Color-coded status and priority badges
- Overdue/due-soon highlighting
- Click to view detail

**Example:**
```tsx
import { ActionsList } from './components/Actions';

export function MyActionsPage() {
  return <ActionsList providerId="provider-123" />;
}
```

### 2. ActionDetail
Full detail view with timeline, follow-up steps, and edit capabilities.

**Props:**
- `actionId: string` - Required action ID to display
- `onClose?: () => void` - Callback when closing detail
- `readonly?: boolean` - Set to true for read-only mode

**Features:**
- Display action metadata (title, number, deadline, priority)
- Timeline view of 6 follow-up steps
- Progress bar (0-100%)
- Evidence/attachment links
- Comments and history
- Edit action details
- Update progress form

**Example:**
```tsx
import { ActionDetail } from './components/Actions';

export function DetailModal() {
  return (
    <ActionDetail 
      actionId="action-123"
      onClose={() => setShowDetail(false)}
      readonly={false}
    />
  );
}
```

### 3. FollowUpStep
Individual step card showing progress, evidence, and comments.

**Props:**
- `followup: ActionFollowup` - Required followup data
- `onUpdateStatus?: (followupId, status) => void` - Status change callback
- `onAddEvidence?: (followupId, evidence) => void` - Evidence upload callback
- `onAddComment?: (followupId, comment) => void` - Comment callback
- `readonly?: boolean` - Set to true for read-only display

**Features:**
- Status badge (pending, in_progress, completed)
- Due date with days-until indicator
- Progress bar (0-100%)
- Evidence attachment link
- Comments section
- Inline form for adding updates
- Color-coded status (red=pending, orange=in_progress, green=completed)

**Example:**
```tsx
import { FollowUpStep } from './components/Actions';

export function StepList() {
  return followups.map(fu => (
    <FollowUpStep
      key={fu.id}
      followup={fu}
      onUpdateStatus={handleStatusChange}
      onAddComment={handleComment}
      readonly={false}
    />
  ));
}
```

### 4. ProgressUpdateForm
Modal form for updating action progress with evidence and comments.

**Props:**
- `actionId: string` - Required action ID
- `followups: ActionFollowup[]` - Available steps to update
- `onSubmit: (data) => Promise<void>` - Submit handler
- `onCancel: () => void` - Cancel handler
- `loading?: boolean` - Show loading state

**Features:**
- Step selection dropdown
- Status selector
- Progress slider (0-100%)
- Evidence URL input
- Comment textarea
- Estimated remaining days
- Form validation
- Loading state during submission

**Example:**
```tsx
import { ProgressUpdateForm } from './components/Actions';

export function UpdateProgressModal() {
  return (
    <ProgressUpdateForm
      actionId="action-123"
      followups={followups}
      onSubmit={async (data) => {
        await api.updateProgress(data);
        setShowForm(false);
      }}
      onCancel={() => setShowForm(false)}
      loading={false}
    />
  );
}
```

### 5. ActionStats
Summary cards displaying action metrics.

**Props:** None (connects directly to store)

**Features:**
- Total actions count
- Open actions (abierta)
- In-progress actions (en_progreso)
- Closed actions (cerrada)
- Overdue actions count
- Average completion %
- Progress bar visualization

**Example:**
```tsx
import { ActionStats } from './components/Actions';

export function Dashboard() {
  return <ActionStats />;
}
```

### 6. AuditorDashboard
Read-only dashboard for auditors with status distribution and management.

**Props:**
- `onApprove?: (actionId) => Promise<void>` - Approve callback
- `onReject?: (actionId, reason) => Promise<void>` - Reject callback

**Features:**
- Summary stats (total, overdue, avg completion)
- Status distribution pie chart
- Overdue actions alert
- Full actions table (read-only)
- Approve/reject buttons
- Reject reason modal

**Example:**
```tsx
import { AuditorDashboard } from './components/Actions';

export function AuditorView() {
  return (
    <AuditorDashboard
      onApprove={async (id) => {
        await api.approveAction(id);
      }}
      onReject={async (id, reason) => {
        await api.rejectAction(id, reason);
      }}
    />
  );
}
```

## State Management (Zustand)

The module uses Zustand for state management via `actionStore`:

```tsx
import { useActionStore } from './stores/actionStore';

export function MyComponent() {
  const {
    actions,
    selectedAction,
    filters,
    stats,
    loading,
    error,
    fetchActions,
    fetchActionDetail,
    updateAction,
    updateActionProgress,
    setFilters,
    clearError,
  } = useActionStore();

  // Use store...
}
```

### Actions:
- `fetchActions(filters)` - Fetch list with optional filters
- `fetchActionDetail(id)` - Fetch single action with followups
- `updateAction(id, data)` - Update action details
- `updateActionProgress(actionId, followupId, data)` - Update followup progress
- `updateFollowup(actionId, followupId, data)` - Alias for updateProgress
- `fetchStats()` - Fetch summary statistics
- `setSelectedAction(action)` - Set selected action
- `setFilters(filters)` - Update filters
- `clearError()` - Clear error message

## API Integration

The module consumes Task 6 backend endpoints:

- `GET /api/actions` - List actions with filters
- `GET /api/actions/:actionId` - Get full action detail with followups
- `PUT /api/actions/:actionId` - Update action
- `POST /api/actions/:actionId/followups/:followupId` - Update followup/progress
- `GET /api/actions/dashboard` - Auditor overview stats
- `GET /api/actions/stats` - Summary statistics

## Styling

All components use CSS Modules for scoped styling. Color scheme:

- **Primary:** Blue (#2E75B6)
- **Status Colors:**
  - Abierta (Open): Red (#D32F2F)
  - En Progreso: Orange (#F57C00)
  - Cerrada (Closed): Green (#388E3C)
- **Alerts:** Red/Orange for overdue
- **Backgrounds:** White/Light gray (#F5F5F5/#FAFAFA)

## Responsive Design

- **Desktop (>1024px):** Full table with all columns
- **Tablet (640px-1024px):** 2-column grid, sidebar filters
- **Mobile (<640px):** Card-based list, stacked layout

## Spanish Localization

All labels and messages are in Spanish (Colombian):
- "Mis Acciones" - My Actions
- "Estado: Abierta/En Progreso/Cerrada"
- "Plazo" - Deadline
- "Progreso" - Progress
- "Responsable" - Responsible
- "Pasos de Seguimiento" - Follow-up Steps
- "Prueba/Evidencia" - Evidence
- "Comentarios" - Comments

## Accessibility

- Semantic HTML structure
- ARIA labels on interactive elements
- Focus states for keyboard navigation
- Color not sole indicator (text + icons)
- Alt text on images

## Performance

- Virtual list for 1000+ actions
- Lazy load detail view
- Debounce filters (300ms)
- Memoized components
- Optimized re-renders

## Testing

Component tests are in `__tests__/` directory:
- ActionStats.test.tsx
- ActionsList.test.tsx
- FollowUpStep.test.tsx
- ProgressUpdateForm.test.tsx

Run tests:
```bash
npm test -- components/Actions
```

## Future Enhancements

- [ ] Bulk actions (batch update status/progress)
- [ ] Export to CSV/PDF
- [ ] Email notifications on deadline
- [ ] Integration with messaging for @mentions
- [ ] Custom dashboard widgets
- [ ] Advanced filtering (date ranges, text search)
- [ ] Comparison between assessment rounds
