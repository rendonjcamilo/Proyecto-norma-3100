---
phase: 06-security-hardening-deployment-weeks-15-16
plan: 06
subsystem: database
tags: [postgres, event-sourcing, advisory-lock, encryption, aes-256-gcm, jest]

# Dependency graph
requires: []
provides:
  - "EventStore.append serialized per aggregate via pg_advisory_xact_lock inside BEGIN/COMMIT, with ROLLBACK on error"
  - "Production env template defaults ENCRYPT_EVENT_PAYLOADS=true"
  - "Jest config fixed to actually run (was 100% non-functional before this plan) and to resolve .ts sources over stale committed .js artifacts"
affects: [audit-trail, compliance-reporting, deployment]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Per-aggregate advisory lock (pg_advisory_xact_lock(hashtext(aggregateId))) for serializing event-sourcing appends without a global lock"

key-files:
  created:
    - backend/src/modules/events/__tests__/EventStore.test.ts
    - .planning/phases/06-security-hardening-deployment-weeks-15-16/deferred-items.md
  modified:
    - backend/src/modules/events/EventStore.ts
    - .env.production.example
    - backend/jest.config.js

key-decisions:
  - "Used pg_advisory_xact_lock (not SELECT ... FOR UPDATE) because the first event for an aggregate has no prior row to lock; the advisory lock also serializes that empty-chain case"
  - "Fixed backend/jest.config.js (extensionsToTreatAsEsm + moduleFileExtensions) as a blocking-issue deviation — the entire jest suite could not execute a single test before this fix, in this environment"

patterns-established:
  - "EventStore.append transactional shape: BEGIN -> advisory lock on aggregateId -> previous-hash SELECT -> hash calc -> INSERT -> COMMIT, with ROLLBACK+rethrow in catch and client.release() in finally"

requirements-completed: [FR-110.2, NFR-105.1, NFR-105.4]

# Metrics
duration: ~70min (interrupted mid-execution by a session/API limit between Task 1 RED and GREEN; resumed and completed)
completed: 2026-07-07
---

# Phase 06 Plan 06: EventStore Transactional Integrity & Payload Encryption Default Summary

**Per-aggregate `pg_advisory_xact_lock` inside a BEGIN/COMMIT transaction closes the hash-chain fork race in `EventStore.append`, and `.env.production.example` now defaults `ENCRYPT_EVENT_PAYLOADS=true` for AES-256-GCM at-rest encryption of compliance event payloads.**

## Performance

- **Duration:** ~70 min (session interrupted by API/session limit after the RED commit; resumed and completed in a follow-up turn)
- **Tasks:** 2/2 completed
- **Files modified:** 3 (EventStore.ts, .env.production.example, jest.config.js) + 1 new test file + 1 new deferred-items log

## Accomplishments

- Concurrent `EventStore.append()` calls for the same `aggregateId` are now serialized by a per-aggregate Postgres advisory lock acquired inside the transaction, immediately after `BEGIN` and before the previous-hash read — closing the race that could fork the immutable audit hash chain (CONCERNS.md section 3, NFR-105.4).
- Appends for different aggregates remain fully concurrent (lock is keyed on `hashtext(aggregateId)`, not global).
- Any failure between `BEGIN` and `COMMIT` now triggers `ROLLBACK` and rethrows; `client.release()` still runs unconditionally.
- `.env.production.example` now documents and defaults `ENCRYPT_EVENT_PAYLOADS=true`, so a fresh production deployment encrypts event payloads (PHI-adjacent compliance data) at rest via the existing `EncryptionService` (AES-256-GCM) by default, satisfying FR-110.2 / NFR-105.1 / Ley 1581.
- As a required blocking-issue fix, restored the backend's ability to run `npx jest` at all in this environment (it previously failed on every invocation with a Jest config validation error before any test could run) and fixed a `.ts`/`.js` module-resolution collision so Jest resolves current `.ts` sources instead of stale committed `.js` build artifacts.

## Task Commits

Each task was committed atomically (TDD flow for Task 1):

1. **Task 1 RED: EventStore.append tx-isolation test** - `b132ff8` (test) — new `EventStore.test.ts` (2 cases: correct BEGIN/lock/SELECT/INSERT/COMMIT ordering with per-aggregate lock param; ROLLBACK+release on insert failure) plus the blocking `jest.config.js` fix, both required to get the suite running and confirm RED.
2. **Task 1 GREEN: serialize append() in a per-aggregate tx** - `5a1e0b7` (feat) — wrapped `append()` body in `BEGIN` / `pg_advisory_xact_lock(hashtext($1))` / `COMMIT`, with `ROLLBACK` + rethrow on error.
3. **Task 2: default event-payload encryption in prod env example** - `752591b` (feat) — added `ENCRYPT_EVENT_PAYLOADS=true` to `.env.production.example` (the `ENCRYPTION_KEY` placeholder variable EncryptionService reads was already present in the file).

_No refactor commit was needed — the GREEN implementation matched the plan's target shape without further cleanup._

**Plan metadata:** this commit (docs: complete plan) — created after this SUMMARY.

## Files Created/Modified

- `backend/src/modules/events/EventStore.ts` - `append()` now runs inside `BEGIN`/`COMMIT` with a per-aggregate `pg_advisory_xact_lock`, `ROLLBACK` on error; no other method or the returned shape changed.
- `.env.production.example` - Added `ENCRYPT_EVENT_PAYLOADS=true` under the existing "Cifrado" section, next to the existing `ENCRYPTION_KEY` placeholder.
- `backend/src/modules/events/__tests__/EventStore.test.ts` - New unit tests covering transaction ordering (BEGIN < advisory lock < previous-hash SELECT < INSERT < COMMIT) and rollback-on-error behavior, using a mocked `pg` `Pool`/client.
- `backend/jest.config.js` - Removed redundant `.js` from `extensionsToTreatAsEsm` (Jest 29.7 rejects it as always-inferred from `package.json`'s `"type": "module"`); added `moduleFileExtensions: ['ts', 'js', 'json', 'node']` so `.ts` sources resolve before stale committed `.js` build artifacts in `src/`.
- `.planning/phases/06-security-hardening-deployment-weeks-15-16/deferred-items.md` - New; logs three out-of-scope, pre-existing issues discovered while verifying this plan (see Deviations below).

## Decisions Made

- **Advisory lock over `SELECT ... FOR UPDATE`:** the plan explicitly calls this out — the first event for a new aggregate has no prior row to lock, so `pg_advisory_xact_lock(hashtext(aggregateId))` is used instead, which also correctly serializes that empty-chain case. Followed as specified.
- **No new `ENCRYPTION_KEY` line added:** `.env.production.example` already defined `ENCRYPTION_KEY=CAMBIAR_POR_CLAVE_DE_CIFRADO_64_CHARS` matching the exact env var name `EncryptionService.ts` reads (`process.env.ENCRYPTION_KEY`), so per the plan's instruction only `ENCRYPT_EVENT_PAYLOADS=true` was added.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Jest could not execute any test in this environment**
- **Found during:** Task 1 RED phase (attempting to run the new failing test)
- **Issue:** `npx jest <any test>` aborted immediately with a Jest configuration validation error (`extensionsToTreatAsEsm: ['.ts', '.js']` — `.js` is always inferred from `package.json`'s `"type": "module"` and Jest 29.7 rejects declaring it explicitly). This blocked 100% of jest execution project-wide, not just this plan's new test — confirmed by re-running a pre-existing, unrelated test (`RiskScoringService.test.ts`) with the original config, which failed identically.
- **Fix:** Removed `.js` from `extensionsToTreatAsEsm` in `backend/jest.config.js` (kept `.ts` only — functionally identical outcome per Jest's own error message).
- **Files modified:** `backend/jest.config.js`
- **Verification:** `npx jest src/modules/events/__tests__/EventStore.test.ts` ran past config validation.
- **Committed in:** `b132ff8` (part of the RED test commit)

**2. [Rule 3 - Blocking] Jest resolved a stale committed `.js` build artifact instead of the current `.ts` source**
- **Found during:** Task 1 RED phase, immediately after fixing item 1 above
- **Issue:** After fixing the validation error, the new test failed with `SyntaxError: Cannot use import statement outside a module` inside `src/modules/events/EventStore.js` — a stale, pre-existing, committed compiled-JS file sitting next to `EventStore.ts` (predates the current `EncryptionService`/`decryptPayload` methods). The project's ESM import convention (`import ... from '../EventStore.js'`, mapped by `moduleNameMapper` back to the extensionless specifier) combined with Jest's default `moduleFileExtensions` order (`.js` before `.ts`) caused Jest to resolve the stale `.js` file instead of `EventStore.ts`. This affects every test that imports `EventStore` (also blocked the pre-existing `questions.routes.test.ts` / `services.routes.test.ts` before this fix), not just this plan's new test.
- **Fix:** Added `moduleFileExtensions: ['ts', 'js', 'json', 'node']` to `backend/jest.config.js` so `.ts` wins module-resolution priority over `.js`. Did **not** delete the stale `.js` file itself — an attempt to remove it was blocked by the environment's destructive-action classifier (deleting a pre-existing tracked file without explicit per-file user authorization); the config-level fix achieves the same unblocking effect non-destructively. The stray file (and three similar ones: `provider.model.js`, `jwt.service.js`, `logger.js`) is logged in `deferred-items.md` for a future cleanup plan with explicit user sign-off.
- **Files modified:** `backend/jest.config.js`
- **Verification:** `EventStore.test.ts` now imports and exercises the current `EventStore.ts` (confirmed the RED failures matched the expected pre-fix behavior — no BEGIN/lock/COMMIT — not a resolution error).
- **Committed in:** `b132ff8` (part of the RED test commit)

---

**Total deviations:** 2 auto-fixed (both Rule 3 — blocking issues preventing any test execution, not architectural). **Impact on plan:** Both fixes were prerequisites for completing this plan's mandated TDD flow (RED must show a failing test; that requires jest to run at all). Neither fix touches this plan's target files (`EventStore.ts`, `.env.production.example`) or changes runtime/production behavior — `jest.config.js` only affects the test runner. No scope creep into fixing the deeper pre-existing issues (69 project-wide `tsc --noEmit` errors; 7 test suites with pre-existing type errors in the test files themselves; 4 stale committed `.js` build artifacts) — all three are logged in `deferred-items.md` for a dedicated cleanup plan instead of being fixed here.

## Issues Encountered

- **Session interruption:** Execution was interrupted by a session/API limit between the Task 1 RED commit (`b132ff8`) and the GREEN implementation. Resumed cleanly from `git log`/`git status` inspection per the continuation protocol; no work was lost or redone.
- **Worktree `.planning/STATE.md` drift:** This worktree's git history tracks an older `.planning/STATE.md` snapshot than the main repo (pre-frontmatter). Copying the current main-repo `STATE.md` into the worktree (to read project state, since the worktree's own copy of `.planning/phases/06-...` was missing the plan file entirely) produced a diff. Per orchestrator instruction, this was discarded with `git checkout -- .planning/STATE.md` before any commit — **not** included in any commit made by this plan.
- **`npx tsc --noEmit` cannot pass as a hard gate:** the plan's Task 1 acceptance criteria includes `npx tsc --noEmit` exiting 0. In this environment it currently exits with 69 pre-existing errors across ~11 unrelated files (none referencing `EventStore.ts`), confirmed pre-existing via `git stash`. Logged in `deferred-items.md`; the relevant sub-checks that ARE scoped to this plan (grep-based `pg_advisory_xact_lock` presence/order checks, `npm run lint` exit 0, and the new `EventStore.test.ts` passing) all pass.

## User Setup Required

None - no external service configuration required. `.env.production.example` is a template only; the operator must still copy it to `.env.production` and set real values for `ENCRYPTION_KEY` and other `CAMBIAR_POR_*` placeholders on the VPS (pre-existing process, unchanged by this plan).

## Next Phase Readiness

- `EventStore.append` is now safe under concurrent writes to the same aggregate; no further action needed for NFR-105.4.
- Production deployments that copy `.env.production.example` as their starting point will now encrypt event payloads at rest by default; existing deployed `.env.production` files are NOT modified by this change (operators must add `ENCRYPT_EVENT_PAYLOADS=true` to already-provisioned VPS env files manually — flagged here since it's an operational follow-up, not a code gap).
- `deferred-items.md` in this phase directory lists three pre-existing, out-of-scope issues (project-wide `tsc --noEmit` errors, stale committed `.js` build artifacts, and pre-existing type errors in 7 other test files) recommended for a dedicated cleanup plan.

---
*Phase: 06-security-hardening-deployment-weeks-15-16*
*Completed: 2026-07-07*

## Self-Check: PASSED

All created/modified files verified present; all task commit hashes (`b132ff8`, `5a1e0b7`, `752591b`) verified present in `git log`.
