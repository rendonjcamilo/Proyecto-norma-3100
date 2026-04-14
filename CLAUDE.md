# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Sistema de Gestión de Cumplimiento — Resolución 3100 de 2019 (Colombia)**
Platform for healthcare providers to self-assess, track findings, and demonstrate compliance with the Colombian Ministry of Health's Norma 3100. Core regulatory concept: 7 transversal standards (TSTH, TSINF, TSDOT, TSMD, TSPP, TSHCR, TSINT) apply to all 157 health services, plus N service-specific criteria per service.

## Commands

### Backend (`cd backend`)
```bash
npm run dev           # Start with tsx watch (port 3001)
npm run build         # TypeScript compile to dist/
npm run lint          # ESLint check
npm run lint:fix      # ESLint auto-fix
npm test              # Jest (all tests)
npm test -- --testPathPattern=assessments   # Run single test file
npm run migrate:up    # Apply all DB migrations
npm run migrate:down  # Rollback last migration
npm run seed          # Seed reference data
```

### Frontend (`cd frontend`)
```bash
npm run dev           # Vite dev server (port 5173)
npm run build         # tsc + vite build (requires terser: install if missing)
npm run lint          # ESLint check
npx tsc --noEmit      # Type-check only (faster than full build)
npm test              # Vitest
npm run test:coverage # Vitest with coverage
```

### Infrastructure
```bash
# Start DB + Redis only (recommended for local dev without full Docker)
docker-compose up -d postgres redis

# Full stack via Docker
docker-compose up -d
docker-compose exec backend npm run migrate:up
```

**Without Docker:** Set `DB_HOST=localhost` in `backend/.env` and run a local PostgreSQL 14+ instance. Default credentials: `postgres / postgres_dev_password`, DB: `norma3100`.

## Architecture

### Backend — `backend/src/`

**Pattern:** Route → Service → Pool (pg). Routes handle only HTTP; all business logic lives in Services.

- `index.ts` — Express entry point. Registers all routers, middleware, pg Pool, EventStore.
- `routes/` — One file per domain. Each exports a factory `createXxxRouter(pool, eventStore)`.
- `services/` — Business logic classes (e.g. `AssessmentService`, `QuestionnaireService`). No `req`/`res` here.
- `middleware/` — `auth.middleware.ts` (JWT verify), `role.middleware.ts` (RBAC), `rate-limit.middleware.ts`, `sanitize.middleware.ts`.
- `modules/events/` — Event sourcing: `EventStore` (append-only), `EventReplay`, `EventPublisher`. All compliance state changes emit an event with a hash-chain for tamper detection.
- `modules/cache/` — `CacheManager` wrapping Redis.

**DB schema files** (applied in order by `migrate:up`):
1. `db/schema.sql` — Core tables (providers, locations, services, users, roles, events, audit_logs)
2. `db/evaluation-schema.sql` — `evaluation_standards` (7 transversales seeded here), `evaluation_criteria`, `questionnaires`, responses
3. `db/schema-phase3.sql` — `assessments`, `assessment_responses_detailed`, `assessment_metrics`, `assessment_events`. Also seeds the 157 health services.
4. `db/findings-workflow-schema.sql`, `db/assessment-execution-schema.sql`, `db/documents-schema.sql`
5. `db/migrations/` — Feature migrations (notifications, risk scoring, INVIMA, etc.)
6. `db/seeds/criteria.sql` — 87 transversal criteria (TSTH×21, TSINF×15, TSDOT×12, TSMD×10, TSPP×13, TSHCR×11, TSINT×5)

### Frontend — `frontend/src/`

**Pattern:** Pages fetch via `services/api.ts` → pass data to Components. State via React Context (Auth, Provider, Theme).

- `services/api.ts` — **Single source of truth for all API calls.** Typed `request<T>()` helper with auto JWT injection. All API namespaces exported: `authApi`, `assessmentsApi`, `questionnairesApi`, `servicesApi`, `findingsApi`, `documentsApi`, `reportsApi`, etc.
- `context/` — `AuthContext` (JWT + localStorage, includes `loginWithMock` for dev without DB), `ProviderContext` (selected provider), `ThemeContext`.
- `pages/` — Route-level components. Each receives `providerId` as prop from `App.tsx`.
- `components/` — Feature components grouped by domain (`Assessment/`, `Compliance/`, `Findings/`, `Notifications/`, etc.).
- `hooks/` — `useRolePermission` (RBAC checks in UI), `useNotifications`.

**Routing** (`App.tsx`): React Router v6. Protected routes require roles `super_admin | auditor | provider_admin`. Path `/assessments/:id` renders `AssessmentExecutionPage`.

**Vite proxy:** `/api` and `/auth` requests are proxied to `http://localhost:3001` in dev — no CORS configuration needed.

**Path aliases:** `@`, `@components`, `@pages`, `@hooks`, `@services`, `@types`, `@styles` all resolve to `src/`.

### Assessment execution flow
1. `POST /api/assessments` — creates assessment, auto-loads published questionnaire for service+version
2. `GET /api/questions/:questionnaireId` — returns flat `criteria[]` with `standard_id`, `standard_name`, `is_transversal`
3. Frontend groups criteria by `standard_id` (code derived from criterion code prefix, e.g. `TSTH-001` → `TSTH`)
4. `PUT /api/assessments/:id` — saves responses batch, recalculates compliance % and semáforo in real-time
5. `POST /api/assessments/:id/submit` — locks assessment, auto-generates `findings` for NC criteria

### RBAC
Three roles enforced in both backend middleware (`role.middleware.ts`) and frontend (`useRolePermission`):
- `provider_admin` — read/write own provider only
- `auditor` — read all providers, write findings/actions
- `super_admin` — full access

### Key domain concepts
- **Semáforo:** verde ≥80%, naranja 50–79%, rojo <50% compliance
- **Finding severity:** crítica / alta / media / baja (auto-assigned from NC criteria weight)
- **Assessment versions:** `initial` | `year4` | `annual` | `pre-novelty`
- **Event hash chain:** each event in `events` table stores `previous_event_hash` + `event_hash` (SHA-256) for integrity

## Local dev without Docker

The login page includes `loginWithMock` — enter any email + select a role to bypass JWT auth. Service lists fall back to 8 sample services when the DB is unreachable. Assessments and compliance data require a live DB.
