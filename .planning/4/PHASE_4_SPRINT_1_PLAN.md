# Phase 4 Sprint 1: Real-Time Notifications Plan

**Project:** Norma 3100 Compliance Management System  
**Phase:** 4 - Advanced Features  
**Sprint:** 1 - Real-Time Notifications  
**Duration:** 12 hours  
**Status:** 🟢 PLANNING

---

## Sprint Goal

Enable real-time notifications for compliance events via WebSockets, allowing:
- Instant alerts for overdue actions
- Severity-based notification filtering
- User notification preferences
- Notification history and acknowledge functionality

---

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│         Frontend (React + WebSocket)        │
├─────────────────────────────────────────────┤
│ NotificationCenter                          │
│ ├─ useNotifications hook                    │
│ ├─ NotificationToast component              │
│ └─ NotificationHistory component            │
└──────────────────┬──────────────────────────┘
                   │ WebSocket (Socket.io)
                   │
┌──────────────────▼──────────────────────────┐
│   Backend (Node.js + Socket.io Server)     │
├─────────────────────────────────────────────┤
│ WebSocketManager                            │
│ ├─ Connection handling                      │
│ ├─ Room management (per provider/location)  │
│ └─ Event broadcasting                       │
│                                             │
│ NotificationService                         │
│ ├─ Generate alerts                          │
│ ├─ Filter by severity                       │
│ └─ Store history                            │
│                                             │
│ NotificationQueue (Redis optional)          │
│ ├─ Queue pending notifications              │
│ └─ Retry failed sends                       │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│    Database (PostgreSQL)                    │
├─────────────────────────────────────────────┤
│ notifications table                         │
│ notification_preferences table              │
│ notification_history table                  │
└─────────────────────────────────────────────┘
```

---

## Implementation Tasks

### Task 1: Backend WebSocket Setup (2.5h)

**File:** `backend/src/socket/websocket-manager.ts`

Features:
- Socket.io server initialization
- Connection/disconnection handling
- Room management (providerId, locationId)
- Event emission framework
- User authentication with JWT

```typescript
interface WebSocketEvent {
  type: 'finding.overdue' | 'action.overdue' | 'verification.required' | 'risk.alert';
  severity: 'low' | 'medium' | 'high' | 'critical';
  findingId: string;
  actionId?: string;
  data: Record<string, any>;
  timestamp: string;
}
```

---

### Task 2: Notification Service (2.5h)

**File:** `backend/src/services/NotificationService.ts`

Features:
- Generate notifications from events
- Filter by user preferences
- Store notification history
- Mark as read/acknowledged
- Query user notifications

Methods:
- `generateNotification()` - Create from event
- `getNotifications()` - Query with filters
- `markAsRead()` - Update status
- `broadcastToRoom()` - Send via WebSocket
- `storeHistory()` - Persist to DB

---

### Task 3: Database Schema (1h)

**File:** `backend/db/migrations/2026-04-10-notifications.sql`

Tables:
```sql
-- Store all notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  severity ENUM('low', 'medium', 'high', 'critical'),
  finding_id UUID REFERENCES findings(id),
  action_id UUID REFERENCES actions(id),
  provider_id UUID REFERENCES providers(id),
  user_id UUID REFERENCES users(id),
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP,
  acknowledged_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_user_id_created (user_id, created_at),
  INDEX idx_provider_id (provider_id),
  INDEX idx_is_read (is_read)
);

-- User notification preferences
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) UNIQUE,
  enable_overdue BOOLEAN DEFAULT true,
  enable_high_risk BOOLEAN DEFAULT true,
  enable_verification BOOLEAN DEFAULT true,
  min_severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

### Task 4: API Endpoints (1.5h)

**File:** `backend/src/routes/notifications.routes.ts`

Endpoints:
```
GET    /api/notifications                 - List user notifications
GET    /api/notifications/:id             - Get single notification
PUT    /api/notifications/:id/read        - Mark as read
PUT    /api/notifications/:id/acknowledge - Acknowledge alert
GET    /api/notifications/preferences     - Get user preferences
PUT    /api/notifications/preferences     - Update preferences
POST   /api/notifications/test            - Send test notification
DELETE /api/notifications/:id             - Delete notification
```

---

### Task 5: Frontend WebSocket Hook (2h)

**File:** `frontend/src/hooks/useNotifications.ts`

```typescript
interface Notification {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  findingId?: string;
  actionId?: string;
  isRead: boolean;
  createdAt: string;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  connect: (userId: string) => void;
  disconnect: () => void;
  markAsRead: (notificationId: string) => Promise<void>;
  acknowledge: (notificationId: string) => Promise<void>;
  delete: (notificationId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}
```

Features:
- Auto-connect/disconnect on mount/unmount
- WebSocket reconnection logic
- Notification queue management
- Sound notification support
- Browser notification API integration

---

### Task 6: NotificationCenter Component (2h)

**File:** `frontend/src/components/Notifications/NotificationCenter.tsx`

Components:
- **NotificationToast** - Toast notifications (top-right)
- **NotificationBell** - Bell icon with unread count
- **NotificationPanel** - Dropdown with notification list
- **NotificationHistory** - Full notification history page

Features:
- Real-time toast updates
- Unread badge
- Click to dismiss
- Mark as read
- Severity-based colors
- Auto-hide after 5 seconds

---

### Task 7: ComplianceDashboard Integration (1.5h)

**File:** `frontend/src/components/Compliance/ComplianceDashboard.tsx` (update)

Changes:
- Add NotificationBell to header
- Display unread count
- Show latest alert in dashboard
- Real-time metric updates on notification

---

### Task 8: Tests (2h)

**Files:**
- `backend/src/socket/__tests__/websocket-manager.test.ts`
- `backend/src/services/__tests__/NotificationService.test.ts`
- `frontend/src/hooks/__tests__/useNotifications.test.ts`
- `frontend/src/components/Notifications/__tests__/NotificationCenter.test.ts`

Coverage:
- WebSocket connection/disconnection
- Notification generation
- Filtering by severity
- Read/acknowledge states
- API calls
- Real-time updates
- Error handling

---

## Feature Specifications

### Notification Types

```typescript
FINDING_OVERDUE = {
  type: 'finding.overdue',
  title: 'Hallazgo Vencido',
  message: 'El hallazgo "{title}" venció hace {days} días',
  severity: 'high'
}

ACTION_OVERDUE = {
  type: 'action.overdue',
  title: 'Acción Vencida',
  message: 'La acción "{title}" venció hace {days} días',
  severity: 'critical'
}

VERIFICATION_REQUIRED = {
  type: 'verification.required',
  title: 'Verificación Requerida',
  message: 'La acción "{title}" requiere verificación',
  severity: 'medium'
}

RISK_ALERT = {
  type: 'risk.alert',
  title: 'Alerta de Riesgo',
  message: 'El hallazgo "{title}" tiene riesgo: {score}/100',
  severity: 'dynamic'
}
```

### Severity Colors

```
low:      🟢 Verde (#4caf50)
medium:   🟡 Naranja (#ff9800)
high:     🟠 Rojo oscuro (#f44336)
critical: 🔴 Rojo brillante (#c62828)
```

---

## Event Triggering Logic

### When to Send Notifications

1. **Finding Created**
   - Notify assigned auditor
   - Type: finding.created
   - Severity: based on finding severity

2. **Action Overdue** (nightly cron)
   - Check actions with due_date < today
   - Send to assigned provider + auditors
   - Type: action.overdue
   - Severity: critical

3. **Finding Overdue** (daily check)
   - Check findings > 30 days old without resolved actions
   - Send to provider_admin + auditors
   - Type: finding.overdue
   - Severity: high

4. **Verification Required**
   - When action status = 'resolved'
   - Notify auditors only
   - Type: verification.required
   - Severity: medium

5. **High Risk Score** (real-time on calculation)
   - When risk_score >= 80
   - Notify auditors + provider_admin
   - Type: risk.alert
   - Severity: critical

---

## User Preferences

Users can configure:
- ✅ Enable/disable notification types
- ✅ Minimum severity level to receive
- ✅ Quiet hours (no notifications)
- ✅ Notification channels (in-app, email, SMS - future)

---

## Performance Targets

| Operation | Target | Method |
|-----------|--------|--------|
| WebSocket connection | <500ms | Optimized handshake |
| Notification delivery | <1s | Real-time via Socket.io |
| Notification query | <200ms | Indexed DB query |
| Toast render | <50ms | React optimization |
| Full panel load | <500ms | Pagination (20 per page) |

---

## Test Coverage

- ✅ WebSocket connection lifecycle (10+ tests)
- ✅ Notification generation (15+ tests)
- ✅ Filtering by severity and preference (10+ tests)
- ✅ Read/acknowledge workflows (8+ tests)
- ✅ Error handling and reconnection (8+ tests)
- ✅ Component rendering (12+ tests)
- ✅ Hook behavior (10+ tests)
- ✅ E2E notification flow (5+ scenarios)

**Total: 80+ test cases**

---

## Deliverables Checklist

- [ ] WebSocket server configured
- [ ] NotificationService implemented
- [ ] Database migrations created
- [ ] API endpoints implemented (7 endpoints)
- [ ] Frontend hooks created
- [ ] NotificationCenter components (4 components)
- [ ] Dashboard integration
- [ ] 80+ test cases passing
- [ ] Documentation complete
- [ ] Git commits (10+ atomic commits)

---

## Files to Create

```
backend/
├── src/socket/
│   ├── websocket-manager.ts (250 LOC)
│   └── __tests__/
│       └── websocket-manager.test.ts (200 LOC)
├── src/services/
│   ├── NotificationService.ts (400 LOC)
│   └── __tests__/
│       └── NotificationService.test.ts (300 LOC)
├── src/routes/
│   └── notifications.routes.ts (200 LOC)
└── db/migrations/
    └── 2026-04-10-notifications.sql (150 LOC)

frontend/
├── src/hooks/
│   ├── useNotifications.ts (250 LOC)
│   └── __tests__/
│       └── useNotifications.test.ts (250 LOC)
├── src/components/Notifications/
│   ├── NotificationCenter.tsx (300 LOC)
│   ├── NotificationToast.tsx (150 LOC)
│   ├── NotificationBell.tsx (120 LOC)
│   ├── NotificationPanel.tsx (200 LOC)
│   ├── NotificationHistory.tsx (250 LOC)
│   ├── Notifications.css (300 LOC)
│   └── __tests__/
│       ├── NotificationCenter.test.tsx (300 LOC)
│       ├── useNotifications.test.ts (250 LOC)
│       └── E2E.notifications.test.ts (200 LOC)
└── src/components/Compliance/
    └── ComplianceDashboard.tsx (update +50 LOC)

Total: 3,700+ LOC
Tests: 1,200+ LOC
```

---

## Success Criteria

✅ All WebSocket connections working  
✅ Notifications sent in <1 second  
✅ All tests passing (80+)  
✅ 90%+ code coverage  
✅ Zero unread notification bugs  
✅ Proper error handling & reconnection  
✅ All notifications localized (Spanish)  
✅ Mobile-responsive notification UI  
✅ No console errors  

---

**Sprint 1 Status: 🟢 READY TO START**

*Estimated Time: 12 hours*  
*Start Date: 2026-04-10*  
*Target Completion: Today (same day, with breaks)*
