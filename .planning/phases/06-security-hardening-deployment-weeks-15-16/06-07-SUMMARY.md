---
phase: 06-security-hardening-deployment-weeks-15-16
plan: 07
subsystem: auth
tags: [express, postgres, event-sourcing, audit-trail, rbac]

# Dependency graph
requires:
  - phase: 06-security-hardening-deployment-weeks-15-16
    provides: EventStore hash-chain module (modules/events/EventStore.ts), auth.middleware.ts req.user typing
provides:
  - Correct authenticated identity (req.user?.user_id) in all auditor-clients.routes.ts handlers, with 401 guards
  - Hash-chained risk-scoring events (finding.risk_recalculated, findings.bulk_risk_update) via EventStore.append
  - User-lifecycle audit events (user.created, user.updated, user.deleted) via EventStore.append, secrets excluded
affects: [audit-trail-verification, compliance-reporting, user-management]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Instantiate EventStore(pool) inside each route factory rather than threading it through index.ts constructor args"
    - "req.user?.user_id (never (req as any).user.id) for acting-user identity, with explicit 401 guard when required"

key-files:
  created: []
  modified:
    - backend/src/routes/auditor-clients.routes.ts
    - backend/src/routes/risk-scoring.routes.ts
    - backend/src/routes/users.routes.ts

key-decisions:
  - "EventStore is instantiated locally inside createRiskScoringRouter and createUsersRouter (new EventStore(pool)) instead of changing their factory signatures, to avoid touching index.ts (owned by a different plan in this wave)"
  - "user.updated payload carries a 'changes' object with the raw fields passed to updateUser (first_name, last_name, role, provider_id) rather than a before/after diff, matching the plan's explicit example shape"
  - "No distinct user.status_changed path exists in users.routes.ts today (no separate activate/deactivate endpoint) so that event type was not emitted — only create/update/delete"

patterns-established:
  - "user.* audit events are emitted after the DB mutation succeeds and before the HTTP response is sent, inside the same try block as the mutation (so append failures surface as 500s consistent with existing error handling, rather than being silently swallowed)"

requirements-completed: [NFR-105.3, NFR-105.4]

# Metrics
duration: 7min
completed: 2026-07-07
---

# Phase 06 Plan 07: Audit-Trail Identity & Hash-Chain Fixes Summary

**Fixed always-undefined actor identity in auditor-clients routes, moved risk-scoring events onto the EventStore hash chain, and added user-lifecycle audit events (create/update/delete) — closing three audit-trail integrity gaps flagged in CONCERNS.md (§3, §4, §5).**

## Performance

- **Duration:** ~7 min (commit span 10:57:11 to 11:03:41 UTC-05:00)
- **Started:** 2026-07-07T15:57:00Z (approx, worktree base-corrected then task execution began)
- **Completed:** 2026-07-07T16:03:41Z
- **Tasks:** 3/3
- **Files modified:** 3

## Accomplishments
- `auditor-clients.routes.ts`: all 4 handlers (GET, POST, PUT, DELETE) now resolve `req.user?.user_id` (the real authenticated id) instead of the always-`undefined` `(req as any).user.id`, restoring per-auditor data isolation in `AuditorClientService` calls, with a `401 Unauthorized` guard when identity is missing.
- `risk-scoring.routes.ts`: both raw `INSERT INTO events (...)` statements (single-finding recalculation and bulk update) replaced with `eventStore.append(...)`, so risk-scoring events join the SHA-256 hash chain and are verifiable via `EventStore.verifyIntegrity`.
- `users.routes.ts`: user create/update/delete now emit `user.created` / `user.updated` / `user.deleted` events via `EventStore.append`, attributed to the acting admin (`req.user?.user_id`), with no `password` or secret in any event payload.

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix undefined user identity in auditor-clients.routes.ts** - `020cbe2` (fix)
2. **Task 2: Route risk-scoring events through EventStore.append** - `3810ad8` (fix)
3. **Task 3: Emit user-lifecycle audit events in users.routes.ts** - `c94e155` (feat)

_No TDD tasks in this plan — all three were direct `type="auto"` fixes._

## Files Created/Modified
- `backend/src/routes/auditor-clients.routes.ts` - Replaced `(req as any).user.id` with `req.user?.user_id` + 401 guard in all 4 handlers (GET, POST, PUT, DELETE)
- `backend/src/routes/risk-scoring.routes.ts` - Imported `EventStore`, instantiated `const eventStore = new EventStore(pool)` in the factory, replaced both raw `INSERT INTO events` calls with `eventStore.append(...)`
- `backend/src/routes/users.routes.ts` - Imported `EventStore`, instantiated `const eventStore = new EventStore(pool)` in the factory, added `eventStore.append(...)` calls after POST `/` (create), PUT `/:id` (update), and DELETE `/:id` (delete) mutations succeed

## Decisions Made
- Instantiated `EventStore` inside each router factory (`risk-scoring.routes.ts`, `users.routes.ts`) rather than modifying the factory signature to accept a shared instance — `index.ts` constructs both routers with `(pool)` only and is owned by a separate plan (06-04) in this wave, so changing its call sites was avoided per the plan's explicit interface note.
- `user.updated` payload uses `{ changes: { first_name, last_name, role, provider_id } }` — the raw fields accepted by the PUT handler — rather than computing a diff against the prior record, matching the plan's literal example.
- No `user.status_changed` event was added because `users.routes.ts` has no distinct status-change endpoint (activation/deactivation) in the current codebase; only create/update/delete paths exist and were covered.

## Deviations from Plan

None - plan executed exactly as written. All three tasks matched their `<action>` blocks precisely; no Rule 1-4 auto-fixes were needed beyond what the plan already specified.

## Issues Encountered
- `backend/node_modules` was not present in this worktree (or the main project checkout) at execution start; ran `npm ci` in `backend/` to install dependencies before `tsc`/`eslint` verification could run. This is a one-time environment-setup step, not a plan deviation — no source files were affected.
- Repo-wide `npx tsc --noEmit` surfaces ~35 pre-existing type errors in unrelated files (`provider.routes.ts`, `questions.routes.ts`, `services.routes.ts`, `Anexo4Service.ts`, `AssessmentService.ts`, `Norma3100Service.ts`, `RepsAlertService.ts`, `RepsEnrichmentService.ts`, `RethusService.ts`, `sms/SMSService.ts`, `user.service.ts`). None of these are in this plan's `files_modified` scope and none were touched by this plan's changes (confirmed via `grep` filtering tsc output to the 3 target files, which returns zero errors). Per the deviation-rules scope boundary, these are out of scope for this plan and were left untouched — logged here rather than in a separate `deferred-items.md` since they are pre-existing conditions unrelated to any task in this plan, likely owned by other Wave-1 plans executing concurrently.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `auditor-clients.routes.ts`, `risk-scoring.routes.ts`, and `users.routes.ts` are ready for the audit-trail verifier / EventStore integrity checks planned elsewhere in Phase 6.
- No blockers for downstream plans; `index.ts` router wiring for these three files is unchanged (both `createRiskScoringRouter(pool)` and `createUsersRouter(pool)` retain their existing single-argument signatures).

---
*Phase: 06-security-hardening-deployment-weeks-15-16*
*Completed: 2026-07-07*

## Self-Check: PASSED

- FOUND: `.planning/phases/06-security-hardening-deployment-weeks-15-16/06-07-SUMMARY.md`
- FOUND: `020cbe2` (Task 1 commit)
- FOUND: `3810ad8` (Task 2 commit)
- FOUND: `c94e155` (Task 3 commit)
