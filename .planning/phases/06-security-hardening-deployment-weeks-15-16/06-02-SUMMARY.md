---
phase: 06-security-hardening-deployment-weeks-15-16
plan: 02
subsystem: auth
tags: [express-rate-limit, resend, email-service, pdf-export, auth-routes]

# Dependency graph
requires:
  - phase: 06-security-hardening-deployment-weeks-15-16
    provides: "authLimiter / rate-limit.middleware.ts (plan 06-01, read-only dependency — not modified)"
provides:
  - "Rate-limited /auth/dev-login (dedicated route-local limiter, counts successful requests)"
  - "Welcome email ('Bienvenida' template) sent best-effort on POST /auth/register success"
  - "POST /api/assessments/:id/export returns a real application/pdf buffer via ReportService"
affects: [auth, assessments, reporting, deployment]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Route-local rate limiter defined inside the route file (not shared middleware) when the limiter's semantics differ from the shared authLimiter (skipSuccessfulRequests)"
    - "Best-effort side-effect (email) wrapped in its own try/catch with logger.warn — never blocks the primary HTTP response"

key-files:
  created: []
  modified:
    - backend/src/routes/auth.routes.ts
    - backend/src/routes/assessments.routes.ts

key-decisions:
  - "devLoginLimiter defined at module scope in auth.routes.ts (not in shared rate-limit.middleware.ts) to avoid touching a file owned by plan 06-01"
  - "EmailService instantiated once in setUserService(pool) (module-level singleton), mirroring the config-building pattern from multichannel.routes.ts:64, rather than re-instantiating per request"
  - "Export handler resolves provider_id via a direct SQL lookup (SELECT provider_id FROM assessments WHERE id = $1) instead of assessmentService.getAssessment(), to avoid a pre-existing Assessment-type/camelCase mismatch unrelated to this plan"

requirements-completed: [FR-110.4, FR-103.7]

# Metrics
duration: ~20min
completed: 2026-07-07
---

# Phase 6 Plan 02: Auth/Assessment Completeness Gaps Summary

**dev-login now throttled with a success-counting limiter, registration sends a Spanish 'Bienvenida' email best-effort, and assessment export returns a real PDF instead of a Phase-5 placeholder**

## Performance

- **Duration:** ~20 min (includes `npm ci` to provision node_modules for verification, not present in worktree)
- **Started:** 2026-07-07T10:39:00-05:00 (approx, worktree base reset)
- **Completed:** 2026-07-07T11:04:00-05:00
- **Tasks:** 3/3 completed
- **Files modified:** 2

## Accomplishments
- `/auth/dev-login` carries a dedicated `devLoginLimiter` (10 req/15min, `skipSuccessfulRequests: false`) so successful dev-token mints are throttled, unlike the shared `authLimiter` which skips them. Production 404 gate untouched.
- `POST /auth/register` now sends the existing `'Bienvenida'` email template (via `EmailService.sendEmail`) with `{{name}}`/`{{date}}` variables after a successful registration; failures are logged via `logger.warn` and never break the 201 response.
- `POST /api/assessments/:id/export` no longer returns `{status: 'pending', message: 'Export scheduled - available in Phase 5 (Reporting)'}`. It resolves the assessment's provider server-side, calls `ReportService.generatePdfReport`, and streams back a real `application/pdf` buffer with a `Content-Disposition: attachment` header.

## Task Commits

Each task was committed atomically:

1. **Task 1: Apply a dedicated strict limiter to /auth/dev-login** - `0c952b8` (feat)
2. **Task 2: Send welcome email after successful registration** - `f3257a9` (feat)
3. **Task 3: Wire POST /api/assessments/:id/export to ReportService** - `815696c` (feat)

_No plan-metadata commit — parallel worktree executor; STATE.md/ROADMAP.md are updated centrally by the orchestrator after merge._

## Files Created/Modified
- `backend/src/routes/auth.routes.ts` - Added `devLoginLimiter` (module scope) applied to `POST /dev-login`; added `EmailService`/`EmailConfig` imports, instantiated `emailService` inside `setUserService(pool)`, and sent the `'Bienvenida'` welcome email (try/catch, `logger.warn` on failure) after `registerUser` succeeds.
- `backend/src/routes/assessments.routes.ts` - Added `ReportService` import; replaced the `POST /assessments/:id/export` placeholder body with a direct `provider_id` lookup + `ReportService.generatePdfReport` call, responding with a real PDF buffer (404 if the assessment id does not exist, 500 with a Spanish message on failure).

## Decisions Made
- Kept the new dev-login limiter local to `auth.routes.ts` instead of adding it to `rate-limit.middleware.ts`, since that shared file is owned by plan 06-01 (parallel wave) — avoids a merge conflict and respects the plan's explicit instruction.
- Instantiated `EmailService` once per pool (inside `setUserService`), matching the existing module-level-singleton pattern already used for `userService`/`passwordRecoveryService`/`dbPool` in this file, rather than constructing it per-request.
- Used a direct `pool.query('SELECT provider_id FROM assessments WHERE id = $1', ...)` in the export handler (as specified in the plan) instead of `assessmentService.getAssessment(id)`, because the latter has a pre-existing (unrelated, out-of-scope) TypeScript type mismatch between its SQL row shape (snake_case) and the declared `Assessment` type (camelCase) — see Issues Encountered below.

## Deviations from Plan

None - plan executed exactly as written. All three tasks were implemented per the `<action>` blocks with the exact field names, template name (`'Bienvenida'`), and method signatures specified in the plan's `<interfaces>` section.

## Issues Encountered

**Pre-existing backend `tsc --noEmit` errors (out of scope, not touched):** The backend has 69 pre-existing TypeScript errors on the worktree's base commit (`b3726c5`), spanning unrelated files (`provider.routes.ts`, `questions.routes.ts`, `services.routes.ts`, `Anexo4Service.ts`, `AssessmentService.ts`, `Norma3100Service.ts`, `RepsAlertService.ts`, `RepsEnrichmentService.ts`, `RethusService.ts`, `SMSService.ts`, `user.service.ts`) and also 3-4 pre-existing errors inside the two files this plan touches (`assessments.routes.ts` lines ~86/544/614, `auth.routes.ts` line ~255 in the unrelated `/login` handler). Verified via `git stash`/`git stash pop` that the error count and exact error set is byte-identical before and after this plan's changes (69 errors both times) — this plan introduces zero new `tsc` errors. Per the executor's scope-boundary rule ("Only auto-fix issues DIRECTLY caused by the current task's changes"), these pre-existing errors were left untouched and are logged to `deferred-items.md`. `npm run lint` exits 0 (0 errors, 182 pre-existing warnings, none new) on every task.

**`node_modules` absent in worktree:** This git worktree had no `node_modules` (gitignored, and the sibling worktrees are freshly created from a commit with no install step). Ran `npm ci --prefer-offline --no-audit --no-fund` in `backend/` to provision dependencies for `tsc`/`lint` verification. This is a one-time environment-setup action, not a plan deviation — no `package.json`/lockfile changes were made or committed.

**`.planning/phases/06-security-hardening-deployment-weeks-15-16/` untracked in git:** The plan file itself (`06-02-PLAN.md`) is not committed to git (the repo's `.gitignore` line 63 ignores `.planning/` wholesale, and these phase-6 plan files were never force-added). It was read directly from the main working tree's filesystem path since it does not exist inside this git worktree. This SUMMARY.md is written to the same (gitignored) path and will be force-added to this worktree's branch so it survives the merge, per this plan's explicit "REQUIRED: SUMMARY.md MUST be committed" instruction.

## User Setup Required

None - no external service configuration required. (Welcome-email delivery depends on `RESEND_API_KEY`/`EMAIL_PROVIDER` env vars already documented/used elsewhere in the codebase — e.g. `multichannel.routes.ts` — and is best-effort: absence of a key simply means `EmailService` logs a warning and queues without sending, per its existing `initializeProvider()` behavior.)

## Next Phase Readiness
- `/auth/dev-login` is now safe to leave enabled in non-production environments without unlimited-request risk.
- New user registrations produce a real onboarding email once `RESEND_API_KEY` is configured in the target environment.
- The assessment export feature (FR-103.7) is functionally complete for PDF; Word/DOCX export (if still desired) remains out of scope for this plan and was not referenced anywhere in the interfaces/tasks provided.
- No blockers for downstream phases. Threat register items T-06-04 and T-06-05 are mitigated as designed; T-06-06 (accepted risk) holds by construction (try/catch around the email send).

---
*Phase: 06-security-hardening-deployment-weeks-15-16*
*Completed: 2026-07-07*
