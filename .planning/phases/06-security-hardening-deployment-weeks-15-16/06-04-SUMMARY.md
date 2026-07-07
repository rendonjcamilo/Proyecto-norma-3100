---
phase: 06-security-hardening-deployment-weeks-15-16
plan: 04
subsystem: api
tags: [express, cors, swagger, redis, health-check, hardening]

# Dependency graph
requires:
  - phase: 06-security-hardening-deployment-weeks-15-16
    provides: CONCERNS.md security audit (§1 CORS, §1 Swagger, §6 Redis health) that identified these three findings
provides:
  - Function-based CORS origin validator enforcing a comma-separated CORS_ORIGIN whitelist
  - Production gate hiding Swagger UI (/api/docs) and the raw OpenAPI spec (/api/docs.json) behind NODE_ENV, with a 404 fallback in prod
  - Authenticated Redis client in the /health readiness probe (REDIS_PASSWORD)
affects: [06-05 (nginx hardening — defense-in-depth for /api/docs), deployment/production-readiness]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CORS origin validated via callback function against CORS_ORIGIN.split(',') whitelist instead of a single literal string"
    - "Environment-gated route registration (if (NODE_ENV !== 'production') { ... } else { 404 })"

key-files:
  created: []
  modified:
    - backend/src/index.ts

key-decisions:
  - "Kept credentials/methods/allowedHeaders/maxAge unchanged in the cors() call — only origin became a function"
  - "Production branch returns 404 (not 403) for /api/docs and /api/docs.json to avoid confirming the routes exist"
  - "REDIS_PASSWORD passed as `|| undefined` so dev (no password set) keeps connecting unauthenticated exactly as before"

patterns-established:
  - "Fixed an ESLint curly-brace violation introduced by the new CORS validator (project enforces `curly` rule requiring braces on all if-statements)"

requirements-completed: [FR-110.5, FR-110.9]

# Metrics
duration: 18min
completed: 2026-07-07
---

# Phase 06 Plan 04: Express App Hardening (CORS, Swagger, Redis Health) Summary

**Function-based CORS whitelist validator, production-gated Swagger/OpenAPI routes, and REDIS_PASSWORD-authenticated /health Redis probe in backend/src/index.ts**

## Performance

- **Duration:** 18 min
- **Started:** 2026-07-07T15:44:14Z
- **Completed:** 2026-07-07T16:01:46Z
- **Tasks:** 3
- **Files modified:** 1 (`backend/src/index.ts`)

## Accomplishments
- CORS origin is now validated against a comma-separated `CORS_ORIGIN` whitelist (function validator with explicit rejection), instead of accepting only a single literal origin string
- Swagger UI (`/api/docs`) and the raw OpenAPI spec (`/api/docs.json`) are registered only when `NODE_ENV !== 'production'`; production requests to either path get a 404
- The `/health` Redis probe now authenticates with `REDIS_PASSWORD` when set, so the readiness check succeeds against the password-protected production Redis instance instead of failing the container healthcheck after 3 retries

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace single-string CORS with a whitelist validator** - `3198d24` (feat)
2. **Task 2: Gate Swagger UI and /api/docs.json out of production** - `0bbd9d4` (feat)
3. **Task 3: Authenticate the /health Redis probe with REDIS_PASSWORD** - `a86597f` (fix)

**Plan metadata:** (worktree mode — orchestrator commits plan metadata centrally after merge)

_Note: Task 3's commit also fixed an ESLint `curly` error introduced by Task 1 (see Deviations)._

## Files Created/Modified
- `backend/src/index.ts` - CORS origin function validator (whitelist via `CORS_ORIGIN.split(',')`); Swagger/OpenAPI routes wrapped in `NODE_ENV !== 'production'` guard with 404 fallback; `/health` Redis client now passes `password: process.env.REDIS_PASSWORD`

## Decisions Made
- Kept the CORS `credentials`, `methods`, `allowedHeaders`, `maxAge` options untouched — only `origin` changed from a string to a validator function, matching the plan's interface contract exactly
- Production docs 404 handler registered on both `/api/docs` and `/api/docs.json` via a single `app.use([...])` call, per plan instructions, as defense-in-depth alongside the nginx-level block planned in 06-05
- `password: process.env.REDIS_PASSWORD || undefined` preserves current dev behavior (no password configured → unauthenticated connect, unchanged) while fixing prod

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed ESLint `curly` rule violation introduced by Task 1's CORS validator**
- **Found during:** Task 3 (running `npm run lint` per Task 3's verification command, which is the first task in the plan that runs the full lint suite)
- **Issue:** The plan's literal CORS validator snippet (`if (!origin || allowed.includes(origin)) return callback(null, true);`) is a single-line `if` without braces. This project's ESLint config enforces the `curly` rule (braces required on every `if`), so `npm run lint` failed with `Expected { after 'if' condition` at index.ts:136 — a blocking issue for Task 3's own acceptance criteria (`npm run lint` exits 0).
- **Fix:** Wrapped the `if` body in braces (`if (...) { return callback(null, true); }`), functionally identical to the plan's snippet.
- **Files modified:** backend/src/index.ts
- **Verification:** `npm run lint` now reports 0 errors (182 pre-existing warnings, all in unrelated files, out of scope).
- **Committed in:** `a86597f` (Task 3 commit — grouped with the Redis change since it was discovered while verifying Task 3)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Cosmetic lint fix only; no behavior change. No scope creep.

## Issues Encountered

- `backend/node_modules` was not present in this worktree (fresh git worktree checkout); ran `npm ci` before any `tsc`/`lint` verification could execute. This is expected worktree setup, not a plan deviation.
- Both `npx tsc --noEmit` and `npm run lint` report pre-existing errors/warnings in files this plan does not touch (e.g. `provider.routes.ts`, `questions.routes.ts`, `services.routes.ts`, `AssessmentService.ts`, `user.service.ts`, and 182 `@typescript-eslint/no-explicit-any` warnings across the codebase). These are out of scope per the deviation rules' scope boundary (pre-existing, unrelated to `index.ts`). Verified zero `tsc`/`lint` errors specific to `index.ts` after all three tasks. Logged below for visibility; not fixed.

### Deferred (out of scope, logged only)

- `backend/src/routes/provider.routes.ts` — multiple `'user' is possibly 'undefined'` and `string | null` vs `string | undefined` TS errors (pre-existing, unrelated to this plan).
- `backend/src/routes/questions.routes.ts` — `string | undefined` not assignable to `string` TS errors (pre-existing).
- `backend/src/routes/services.routes.ts` — `Property 'userRole' does not exist on type 'Request'` (pre-existing, likely missing Express type augmentation).
- `backend/src/services/Anexo4Service.ts`, `AssessmentService.ts`, `Norma3100Service.ts`, `RepsAlertService.ts`, `RepsEnrichmentService.ts`, `RethusService.ts`, `sms/SMSService.ts`, `user.service.ts` — assorted pre-existing TS strictness errors.
- 182 `@typescript-eslint/no-explicit-any` warnings scattered across `services/email`, `services/push`, `services/sms`, `services/rbac.service.ts`, `socket/websocket-manager.ts`, `types/multichannel.types.ts` (pre-existing, warnings not errors, unrelated to this plan's files).

None of the above are caused by this plan's changes (confirmed via `grep -i "index.ts"` against the full `tsc --noEmit` output before and after each task — zero matches throughout).

## User Setup Required

None - no external service configuration required. Operators deploying to production must ensure `CORS_ORIGIN` is set to the correct comma-separated production origin(s) and `REDIS_PASSWORD` matches the value passed to Redis via `--requirepass` in `docker-compose.prod.yml` (both already documented as required env vars; no new env vars introduced by this plan).

## Next Phase Readiness

- `backend/src/index.ts` now satisfies FR-110.5 (CORS whitelist) and FR-110.9 (working health/readiness checks) as scoped by this plan.
- Plan 06-05 (nginx hardening) can proceed with its own `/api/docs` deny rule as defense-in-depth; the app-level 404 gate from this plan already covers the same threat (T-06-12) independently.
- No blockers identified for dependent plans.

---
*Phase: 06-security-hardening-deployment-weeks-15-16*
*Completed: 2026-07-07*

## Self-Check: PASSED

- FOUND: backend/src/index.ts
- FOUND: .planning/phases/06-security-hardening-deployment-weeks-15-16/06-04-SUMMARY.md
- FOUND: 3198d24 (Task 1 commit)
- FOUND: 0bbd9d4 (Task 2 commit)
- FOUND: a86597f (Task 3 commit)
