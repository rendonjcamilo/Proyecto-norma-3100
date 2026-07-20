---
phase: 06-security-hardening-deployment-weeks-15-16
plan: 09
subsystem: infra
tags: [postgres, docker, backup-restore, runbook, eol-migration]

# Dependency graph
requires:
  - phase: 06-security-hardening-deployment-weeks-15-16 (plan 08)
    provides: Postgres container hardening (connection logging, kept at pg14) that this runbook builds on
provides:
  - "scripts/pg-upgrade-14-to-17.md — backup-verified, reversible dump/restore runbook for production Postgres 14 to 17"
  - "Documented throwaway-restore verification procedure satisfying FR-110.10 (backup restorability)"
affects: [deployment, infrastructure, postgres-eol-followup]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Dump/restore major-version upgrade via new Docker volume, never in-place image swap on a live data directory"]

key-files:
  created: [scripts/pg-upgrade-14-to-17.md]
  modified: []

key-decisions:
  - "Runbook stages the migration through a brand-new Docker volume (postgres_data_v17) so the pg14 volume (postgres_data) is never touched with -v, giving an instant rollback path"
  - "docker-compose.prod.yml image tag change to postgres:17-alpine is documented as an in-runbook step applied only during supervised execution, not committed as a standalone edit in this plan"
  - "Local throwaway-restore verification (plan Task 1 optional step) could not run in this execution environment: Docker daemon was not available (dockerDesktopLinuxEngine pipe missing) and no pre-existing backup file exists in ./backups/. This is documented in the runbook itself as the mandatory first blocking step of the human checkpoint (Task 2)."
  - "Task 2 (production upgrade) was NOT executed, per explicit plan gating (type=checkpoint:human-action, gate=blocking) and per this execution's non-negotiable instruction to never touch the production VPS or its Postgres database"

patterns-established:
  - "Pattern: EOL major-version DB upgrades on this project always go through backup -> throwaway restore verification -> new-volume migration -> compare-and-cutover -> retain-old-volume rollback window, never a bare image tag bump"

requirements-completed: [FR-110.10]

# Metrics
duration: ~15min
completed: 2026-07-07
---

# Phase 6 Plan 09: Postgres 14→17 Upgrade Runbook Summary

**Wrote a backup-verified, reversible pg14→17 dump/restore runbook (`scripts/pg-upgrade-14-to-17.md`); the actual production upgrade is paused at a mandatory human checkpoint and was not executed.**

## Performance

- **Duration:** ~15 min (Task 1 only)
- **Started:** 2026-07-07T15:38:00Z (approx.)
- **Completed:** 2026-07-07T15:53:43Z
- **Tasks:** 1 of 2 completed (Task 2 is a blocking human-action checkpoint, intentionally not executed)
- **Files modified:** 1 created

## Accomplishments

- Created `scripts/pg-upgrade-14-to-17.md`, a copy-pasteable, numbered runbook (Spanish prose, English commands) covering: pre-requisites/no-regression guarantee, encrypted backup invocation (using the real `scripts/backup.sh`), throwaway-restore verification with row-count + event-hash-chain checks (FR-110.10), the new-volume pg17 dump/restore migration, cutover, rollback, and post-upgrade retention.
- Verified all plan acceptance-criteria greps pass against the produced file (`down -v`, `pg_dumpall`/`pg_dump`, `postgres:17-alpine`, rollback section, `backup.sh` reference, `providers`/`assessments`/`events` row-count checks).
- Confirmed `docker-compose.prod.yml` was NOT modified by this task — the image-tag/volume change is documented as an in-runbook step for the supervised execution, exactly as the plan required.
- **STOPPED at Task 2** (the supervised production go/no-go) per the plan's `type="checkpoint:human-action" gate="blocking"` frontmatter and per explicit execution constraints: no SSH, no command against the production Postgres, no `docker compose down -v`, no live migration was attempted.

## Task Commits

Each task was committed atomically:

1. **Task 1: Write and dry-run-verify the pg 14→17 upgrade runbook** - `b2fe288` (docs)
2. **Task 2: Supervised production Postgres 14→17 upgrade (go/no-go)** - NOT EXECUTED (blocking human-action checkpoint)

**Plan metadata:** (this SUMMARY.md commit, see below)

## Files Created/Modified

- `scripts/pg-upgrade-14-to-17.md` - Full dump/restore runbook: backup → throwaway restore verification → pg17 migration (new volume) → cutover → rollback → post-upgrade retention. References the real `scripts/backup.sh` invocation and the real `docker-compose.prod.yml` service/volume names (`norma3100-postgres`, `postgres_data`, `postgres:14-alpine`).

## Decisions Made

- Staged the pg17 migration through a brand-new Docker volume (`postgres_data_v17`) rather than reusing/overwriting `postgres_data`, so the pg14 volume is always available intact as an instant rollback target — no `docker compose down -v` is ever required at any point in the runbook.
- Deferred the `docker-compose.prod.yml` image-tag/volume edit to be applied *during* supervised execution (Task 2), not committed here as a bare edit — committing it now would leave the compose file pointing at `postgres:17-alpine` while the actual volume is still pg14-formatted, breaking a normal `docker compose up`.
- Documented (rather than attempted) the local throwaway-restore verification: this execution environment has no running Docker daemon (`docker ps` failed — `dockerDesktopLinuxEngine` pipe not found) and no pre-existing encrapted backup under `./backups/`. Per the plan's own allowance ("otherwise document the verification as a required step in the checkpoint"), this is now the explicit, blocking first sub-step of Task 2's `how-to-verify`.

## Deviations from Plan

None - plan executed exactly as written for Task 1. Task 2 was intentionally not executed; this is the plan's designed behavior (`type="checkpoint:human-action" gate="blocking"`), not a deviation.

## Issues Encountered

- Docker daemon was not running in this execution environment, preventing the optional local throwaway-restore dry-run described in Task 1's `<action>`. This does not block Task 1 completion (the plan explicitly allows documenting this as a required checkpoint step instead), but it does mean the FR-110.10 restorability proof has NOT yet been empirically demonstrated — it will be demonstrated as the first step Juan Camilo Rendón runs during the Task 2 checkpoint.

## CHECKPOINT REACHED

**Type:** human-action
**Plan:** 06-09
**Progress:** 1/2 tasks complete

### Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Write and dry-run-verify the pg 14→17 upgrade runbook | `b2fe288` | `scripts/pg-upgrade-14-to-17.md` |

### Current Task

**Task 2:** Supervised production Postgres 14→17 upgrade (go/no-go)
**Status:** blocked — awaiting human action
**Blocked by:** Requires Juan Camilo Rendón (VPS operations owner) to execute `scripts/pg-upgrade-14-to-17.md` against the production host (`147.93.45.4`, `/opt/norma3100`) under supervision. This executor MUST NOT and DID NOT: SSH into the production host, run any command against the production Postgres database, execute `docker compose down -v` or any destructive command, or attempt the actual pg17 migration/cutover/any live database mutation.

### Checkpoint Details

Plan 06-08 hardened the Postgres container (connection logging, kept image at 14). Task 1 (this execution) produced `scripts/pg-upgrade-14-to-17.md` — a backup-verified, reversible dump/restore runbook. The actual production upgrade touches live compliance data and is irreversible if mishandled, so per the plan it requires Juan Camilo Rendón to execute step-by-step under supervision.

**How to verify (on the VPS, `ssh hostinger-vps-new`, `cd /opt/norma3100`), following `scripts/pg-upgrade-14-to-17.md`:**
1. Run the encrypted backup and CONFIRM the throwaway restore passes the row-count + event-chain checks (sections 2-3 of the runbook).
2. Only if step 1 passes: perform the pg17 dump/restore, run `npm run migrate:up`, and confirm the pg17 row counts + integrity checks MATCH the pg14 baseline (section 4).
3. Cut over the backend, confirm `/health` reports healthy and one assessment read + one write succeed (section 5).
4. Retain the pg14 volume for 7 days (section 7).
5. If ANY integrity check fails, execute the runbook's Rollback section (section 6) and STOP.

### Awaiting

A human decision and supervised execution. Resume-signal (exact text from the plan): reply **"upgraded"** (with the matching row counts) once pg17 is live and verified, **"rolled-back"** if reverted, or **"defer"** to keep pg14 until closer to the Nov-2026 EOL.

## User Setup Required

**External/production action required — this is not a code deployment step.** Task 2 requires Juan Camilo Rendón (VPS operations owner) to run `scripts/pg-upgrade-14-to-17.md` against the production VPS under supervision. See the Checkpoint Details above for the exact verification sequence and the resume-signal wording.

## Next Phase Readiness

- Task 1's runbook is complete, self-contained, and verified against all plan acceptance criteria (greps pass, no bare `docker-compose.prod.yml` edit committed).
- Task 2 remains open pending human execution; this plan (06-09) should be considered **partially complete** at the orchestrator level — 1 of 2 tasks done — until the human checkpoint is resolved with one of "upgraded" / "rolled-back" / "defer".
- No repository changes were made against `.planning/STATE.md` or `.planning/ROADMAP.md` by this worktree agent, per parallel-execution instructions; the orchestrator owns those writes after all wave agents complete.

---
*Phase: 06-security-hardening-deployment-weeks-15-16*
*Completed: 2026-07-07 (Task 1 only; Task 2 paused at human checkpoint)*

## Self-Check: PASSED

- FOUND: `scripts/pg-upgrade-14-to-17.md`
- FOUND: `.planning/phases/06-security-hardening-deployment-weeks-15-16/06-09-SUMMARY.md`
- FOUND: commit `b2fe288` in git log
