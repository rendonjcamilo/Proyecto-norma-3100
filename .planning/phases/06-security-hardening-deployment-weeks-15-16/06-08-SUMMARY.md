---
phase: 06-security-hardening-deployment-weeks-15-16
plan: 08
subsystem: infra
tags: [docker, docker-compose, secrets-management, container-hardening, postgres, security-headers]

# Dependency graph
requires:
  - phase: 06-security-hardening-deployment-weeks-15-16
    provides: "CONCERNS.md security audit findings (§1 hardcoded secrets, §6 container hardening) that this plan remediates"
provides:
  - "docker-compose.yml with zero hardcoded secret literals, secrets sourced from gitignored root .env via ${VAR} interpolation"
  - "Committed .env.example placeholder template for dev secrets"
  - "docker-compose.prod.yml with no-new-privileges + cap_drop ALL on backend/frontend, backend read_only rootfs + tmpfs /tmp"
  - "Prod Postgres connection/disconnection logging enabled"
  - "Confirmed config/Dockerfile.backend multi-stage build (dev/builder/production)"
affects: [06-09-postgres-upgrade, deployment, infra-carry-overs]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Docker Compose secret externalization via ${VAR} interpolation from gitignored root .env, with committed .env.example placeholder template"
    - "Container-level hardening: security_opt no-new-privileges + cap_drop ALL + read_only rootfs/tmpfs for stateless services"

key-files:
  created:
    - .env.example
  modified:
    - docker-compose.yml
    - docker-compose.prod.yml

key-decisions:
  - "DB_PASSWORD/JWT_SECRET kept as non-secret dev defaults in .env.example (already documented in project CLAUDE.md); only the two leaked third-party keys (RESEND, EVOLUTION) use CAMBIAR_POR_* placeholders"
  - "Frontend prod container hardened with no-new-privileges + cap_drop ALL but NOT read_only (nginx static server needs writable paths without additional tmpfs mounts scoped by this plan)"
  - "Postgres image tag (postgres:14-alpine) left unchanged in both compose files — version upgrade is explicitly owned by plan 06-09"
  - "Key rotation for leaked RESEND_API_KEY and EVOLUTION_API_KEY is NOT performed by this plan (values already in git history) — tracked as human carry-over action"

requirements-completed: [FR-110.7, FR-110.8, FR-110.11, FR-110.12]

# Metrics
duration: 12min
completed: 2026-07-07
---

# Phase 6 Plan 08: Docker Secrets Externalization + Container Hardening Summary

**Removed all hardcoded secrets from docker-compose.yml via ${VAR} interpolation from a gitignored .env, and hardened prod backend/frontend containers with no-new-privileges + cap_drop ALL + Postgres connection logging.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-07T15:40:00Z
- **Completed:** 2026-07-07T15:52:01Z
- **Tasks:** 2
- **Files modified:** 2 (docker-compose.yml, docker-compose.prod.yml)
- **Files created:** 1 (.env.example) + local-only gitignored .env (not committed)

## Accomplishments
- `docker-compose.yml` no longer contains any plaintext secret value (RESEND_API_KEY, EVOLUTION_API_KEY, DB_PASSWORD, JWT_SECRET) — all resolved via `${VAR}` interpolation from a gitignored root `.env`
- Committed `.env.example` with `CAMBIAR_POR_*` placeholders for both leaked third-party keys (RESEND, EVOLUTION), satisfying FR-110.7/FR-110.8
- Prod backend + frontend containers now run with `no-new-privileges:true` and `cap_drop: [ALL]`; backend additionally runs `read_only: true` rootfs with `tmpfs: [/tmp]`
- Prod Postgres now logs `log_connections=on` / `log_disconnections=on` for retrospective access auditing (T-06-24)
- Confirmed `config/Dockerfile.backend` is multi-stage (`AS development` / `AS builder` / `AS production`), satisfying FR-110.11

## Task Commits

Each task was committed atomically:

1. **Task 1: Externalize dev-compose secrets to ${VAR} interpolation + committed .env.example** - `6f8509d` (fix)
2. **Task 2: Harden prod containers + enable Postgres connection logging** - `02f3a80` (fix)

**Plan metadata:** committed alongside this SUMMARY (see final commit)

## Files Created/Modified
- `.env.example` - Committed placeholder template (DB_PASSWORD/JWT_SECRET as documented dev defaults; RESEND_API_KEY/EVOLUTION_API_KEY as `CAMBIAR_POR_*` placeholders)
- `docker-compose.yml` - Replaced hardcoded secret literals in `backend.environment`, `postgres.environment`, and `evolution.environment` with `${DB_PASSWORD}`, `${JWT_SECRET}`, `${RESEND_API_KEY}`, `${EVOLUTION_API_KEY}` interpolation
- `docker-compose.prod.yml` - Added `security_opt: [no-new-privileges:true]` + `cap_drop: [ALL]` to backend and frontend; added `read_only: true` + `tmpfs: [/tmp]` to backend; added `command` override to postgres enabling `log_connections`/`log_disconnections`
- `.env` (local, gitignored, NOT committed) - Real dev secret values, so `docker-compose up` continues to work locally with zero runtime behavior change

## Decisions Made
- Kept `DB_PASSWORD`/`JWT_SECRET` dev defaults as-is in `.env.example` since they are already publicly documented non-secret dev values in the project's own `CLAUDE.md` (`postgres_dev_password`, etc.); only the two actually-leaked third-party API keys got `CAMBIAR_POR_*` placeholders per the plan's explicit scope note.
- Did not add `read_only` to the nginx-based frontend container per plan instruction — avoids breaking the static server without the required additional tmpfs mounts, which were out of scope for this plan.
- Left `postgres:14-alpine` image tag untouched in both compose files; the version upgrade is explicitly deferred to plan 06-09 per the plan's scope note.

## Deviations from Plan

None - plan executed exactly as written. Both tasks matched their `<action>` and `<acceptance_criteria>` blocks with no architectural changes, bug fixes, or blocking issues encountered.

## Issues Encountered

`docker compose -f docker-compose.prod.yml config` initially failed because `.env.production` (a prod-deploy-only file never committed to this repo) doesn't exist in the worktree — this is expected/pre-existing (the file is created manually at deploy time per the header comment in `docker-compose.prod.yml`, referencing `/opt/norma3100/.env.production`). Verified the compose file's YAML/interpolation correctness by temporarily creating a throwaway `.env.production` with dummy values, running `docker compose config`, confirming `no-new-privileges`, `cap_drop`, `read_only`, `tmpfs`, and `log_connections`/`log_disconnections` all render correctly in the resolved config, then deleting the throwaway file (never staged/committed).

## Outstanding Carry-Over (Human Action Required)

**Key rotation NOT performed by this plan** (explicitly out of scope per plan's SCOPE NOTE):
- `RESEND_API_KEY` (leaked value `re_SZxw6HFN_GFcV5w3p9cpgUZmL9v4J7YEM`) must be rotated on resend.com — the old value remains in git history even after this plan's changes.
- `EVOLUTION_API_KEY` (leaked value `norma3100_evo_key_2025`) must be rotated in the Evolution API instance configuration — same git-history exposure caveat.
- Both rotations are tracked as phase 06 carry-over human actions (T-06-25, disposition: transfer). After rotation, update the real (gitignored) `.env` locally and `/opt/norma3100/.env.production` on the VPS with the new values — no further code changes required since both are already externalized via `${VAR}`/`env_file`.

**Postgres version upgrade** — `postgres:14-alpine` tag is intentionally left unchanged in both `docker-compose.yml` and `docker-compose.prod.yml`; owned by plan 06-09.

## User Setup Required

None - no external service configuration required by this plan itself. See "Outstanding Carry-Over" above for the separate human action of rotating the two leaked API keys (tracked, not blocking this plan's completion).

## Next Phase Readiness
- `docker-compose.yml` and `docker-compose.prod.yml` are both fully hardened per REGLA DE ORO #4/#5 within this plan's scope (secrets externalization + container hardening + Postgres audit logging).
- Plan 06-09 can proceed independently to upgrade the Postgres image tag without touching the hardening added here.
- No blockers for subsequent phase-6 plans.

---
*Phase: 06-security-hardening-deployment-weeks-15-16*
*Completed: 2026-07-07*

## Self-Check: PASSED

- FOUND: .env.example
- FOUND: docker-compose.yml
- FOUND: docker-compose.prod.yml
- FOUND: .planning/phases/06-security-hardening-deployment-weeks-15-16/06-08-SUMMARY.md
- FOUND: 6f8509d (Task 1 commit)
- FOUND: 02f3a80 (Task 2 commit)
