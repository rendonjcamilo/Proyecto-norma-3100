# Deferred Items — Phase 06 Plan 06

Out-of-scope discoveries found while executing 06-06-PLAN.md. Not fixed here per
executor scope-boundary rules (only fix issues directly caused by this plan's changes).

## 1. `cd backend && npx tsc --noEmit` fails project-wide (69 pre-existing errors)

**Found during:** Task 1 verification (`npx tsc --noEmit` acceptance check).

**Evidence it's pre-existing:** `git stash` (reverting only this plan's uncommitted
`EventStore.ts` change, keeping the committed RED-test/jest-config commit) still
produces the same 69 errors. None of the 69 errors reference `EventStore.ts`.

**Affected files (unrelated to this plan):**
- `src/routes/provider.routes.ts` (many `'user' is possibly 'undefined'` / null-vs-undefined mismatches)
- `src/routes/questions.routes.ts` (`string | undefined` not assignable to `string`)
- `src/routes/services.routes.ts` (`Property 'userRole' does not exist on type 'Request'`)
- `src/services/Anexo4Service.ts`, `AssessmentService.ts`, `Norma3100Service.ts`,
  `RepsAlertService.ts`, `RepsEnrichmentService.ts`, `RethusService.ts`,
  `sms/SMSService.ts`, `user.service.ts`

**Recommendation:** A dedicated cleanup plan should fix these (mostly strict-null-check
drift after a TS config or `@types/express` bump). Until then `npx tsc --noEmit` cannot
be used as a hard gate for unrelated plans in this phase.

## 2. Stray compiled `.js` files committed alongside their `.ts` source in `src/`

**Found during:** Task 1 RED phase — Jest resolved the stale, committed
`src/modules/events/EventStore.js` instead of the current `EventStore.ts` when the new
test imported `'../EventStore.js'` (the project's established ESM import convention:
`.js` specifier resolved to the sibling `.ts` file via `moduleNameMapper`). Root cause:
Jest's default `moduleFileExtensions` resolves `.js` before `.ts`.

**Fix applied (in scope, blocking):** `backend/jest.config.js` — added
`moduleFileExtensions: ['ts', 'js', 'json', 'node']` so `.ts` sources win over stale
`.js` build artifacts left in `src/`. This unblocks Jest test resolution for ANY module
affected by this pattern, not just `EventStore`.

**Not fixed (out of scope — deletion of pre-existing tracked files not authorized in this
session):** The stale `.js` files themselves remain in the repo:
- `src/modules/events/EventStore.js` (stale — predates current `EncryptionService` /
  `decryptPayload` / `verifyIntegrity` methods present in `EventStore.ts`)
- `src/models/provider.model.js`
- `src/services/jwt.service.js`
- `src/utils/logger.js`

**Recommendation:** Remove these committed build artifacts from `src/` (they belong only
in `dist/` after `npm run build`) in a dedicated cleanup task, with explicit user
sign-off since it deletes pre-existing tracked files.

## 3. Full `npx jest` run: 7 of 13 suites fail on pre-existing TS errors inside the test files themselves

**Found during:** Post-Task-2 regression check (`npx jest` run for the whole backend
package, to confirm the `jest.config.js` fix didn't break unrelated suites).

**Evidence it's pre-existing, not caused by this plan's `jest.config.js` fix:** Before
this plan's fix, jest could not run ANY test in the package — every invocation aborted
with the `extensionsToTreatAsEsm` validation error (see item 2). Confirmed by temporarily
restoring the original `jest.config.js` (`git show b3726c5:backend/jest.config.js`) and
re-running `RiskScoringService.test.ts`: same validation-error abort, zero tests execute.
So 0 of these suites were passing before this plan touched the config; the plan's fix
only made the pre-existing breakage in these specific test files newly *visible* (jest
can now parse and type-check them where it previously couldn't even start).

**Failing suites (all pre-existing type errors in the test file itself, unrelated to
EventStore.ts / this plan's file scope):**
- `src/services/sms/__tests__/SMSService.test.ts` — `async (done) =>` signature not
  assignable to Jest's `DoneCallback` type (TS2345), multiple occurrences
- `src/routes/__tests__/findings.routes.test.ts`
- `src/__tests__/multichannel-integration.test.ts`
- `src/services/__tests__/RiskScoringService.test.ts` — `{ rows: [] } as QueryResult`
  cast rejected by `pg`'s `QueryResult` type (TS2352), missing
  `command`/`rowCount`/`oid`/`fields`; also one always-truthy expression (TS2872)
- `src/routes/__tests__/services.routes.test.ts`
- `src/queues/__tests__/NotificationQueueService.test.ts`
- `src/services/push/__tests__/PushService.test.ts`
- `src/socket/__tests__/websocket-manager.test.ts` — 1 runtime flake (`should handle
  invalid token`: timing-dependent socket-disconnect assertion, not a compile error)

**My task's own test (`EventStore.test.ts`) and 5 other pre-existing suites pass:**
`NotificationService.test.ts`, `assessments.routes.test.ts`, `questions.routes.test.ts`,
`notifications.routes.test.ts` all PASS.

**Recommendation:** Same dedicated TS-cleanup plan as item 1 should also update these
test files' mock typings (`QueryResult` casts, Jest `done` callback signatures) and
investigate the one flaky websocket timing test.
