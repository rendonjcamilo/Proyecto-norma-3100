---
phase: 06-security-hardening-deployment-weeks-15-16
plan: 05
subsystem: infra
tags: [nginx, security-headers, csp, tls, reverse-proxy]

# Dependency graph
requires: []
provides:
  - "nginx prod template with full 7-header security set (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-XSS-Protection, Content-Security-Policy)"
  - "/api/docs and /api/docs.json blocked at the nginx layer (defense-in-depth with backend prod gate)"
  - "verified TLS 1.3-only config with the two FR-110.1 cipher suites"
affects: [06-04-plan-backend-docs-gate, deployment-ops-runbook]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "nginx add_header ... always applied at server-block scope so both API and static frontend responses inherit the full header set"
    - "location = /path exact-match block used for docs.json alongside prefix location for /api/docs"

key-files:
  created: []
  modified:
    - config/nginx/nginx.prod.conf

key-decisions:
  - "style-src kept as 'self' 'unsafe-inline' (not stricter) because the React production build injects inline styles; a stricter policy would break the SPA visually"
  - "/api/docs and /api/docs.json return 403 directly at nginx rather than proxying to backend, since the backend prod gate (plan 06-04) is a second, independent layer"

patterns-established:
  - "Security headers set once at the 443 server-block level with `always` so they apply uniformly to /api, /auth, and the static frontend (/ location), matching REGLA DE ORO #3 §2 (mandated header set)"

requirements-completed: [FR-110.1, FR-110.5, NFR-105.1]

# Metrics
duration: 6min
completed: 2026-07-07
---

# Phase 06 Plan 05: Nginx Security Headers & TLS Lock Summary

**Full 7-header security set (added X-XSS-Protection + CSP) applied `always` at the nginx server block, /api/docs and /api/docs.json denied with `return 403`, TLS 1.3 + mandated cipher suites verified unchanged.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-07-07T15:46:00Z
- **Completed:** 2026-07-07T15:52:29Z
- **Tasks:** 2 completed
- **Files modified:** 1

## Accomplishments
- Added `X-XSS-Protection "1; mode=block"` and a `Content-Security-Policy` header (`default-src 'self'`, `frame-ancestors 'none'`, `style-src 'self' 'unsafe-inline'` to avoid breaking the React SPA's inline styles) at the nginx server-block level with `always`, so the policy covers static frontend responses that Helmet's backend-only CSP does not reach.
- Replaced the commented `# deny all; # return 403;` placeholder in `/api/docs` with an active `return 403;`, and added an exact-match `location = /api/docs.json { return 403; }` block — both close the Swagger/OpenAPI-schema disclosure surface at the reverse-proxy layer (defense-in-depth with the backend prod gate from plan 06-04).
- Confirmed (no change needed) `ssl_protocols TLSv1.3;` and `ssl_ciphers TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256;` remain exactly as required by FR-110.1 — no downgrade path exists in the template.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add X-XSS-Protection and Content-Security-Policy headers** - `ccf3aac` (feat)
2. **Task 2: Deny /api/docs at the nginx layer and confirm TLS 1.3 lock** - `bc5171a` (feat)

**Plan metadata:** (this commit) `docs(06-05): complete nginx security headers and TLS-lock plan`

## Files Created/Modified
- `config/nginx/nginx.prod.conf` - Added X-XSS-Protection + CSP headers (server-block scope, `always`); replaced commented docs-deny placeholder with active `return 403` for `/api/docs` and a new exact-match `/api/docs.json` deny block; TLS block verified unchanged (TLSv1.3-only, mandated cipher suite).

## Decisions Made
- Kept `style-src 'self' 'unsafe-inline'` rather than a stricter nonce/hash-based policy, per the plan's explicit instruction — the React build injects inline styles, and dropping `unsafe-inline` would visually break the SPA. This is a documented trade-off, not an oversight.
- Dropped the `proxy_pass` from `/api/docs` entirely since the location is now a hard deny — no reason to proxy a request that always returns 403.

## Deviations from Plan

None - plan executed exactly as written. Both tasks matched the plan's action blocks verbatim; all acceptance criteria (grep-based) passed on first attempt with no auto-fixes required.

## Issues Encountered

**Worktree access to `.planning/phases/06-.../06-05-PLAN.md`:** The plan and other `.planning/phases/` context files (CONCERNS.md, REQUIREMENTS.md detail) are untracked/gitignored (`.planning/` is listed in `.gitignore`) and were never committed to git, so they did not exist inside this git worktree checkout. Root-level `.planning/` files (PROJECT.md, STATE.md, ROADMAP.md, REQUIREMENTS.md, config.json) were tracked and present (added before the gitignore rule or force-added), but the phase-06 plan directory was not. Worked around this by reading the plan and CONCERNS.md directly via absolute path from the main project root (`C:\Users\guido\OneDrive\G2INNOVATION\HABILITAPRO\Proyecto-norma-3100\.planning\...`) using the Read tool, which can access any path regardless of worktree boundaries. This SUMMARY.md is being written into the worktree's `.planning/phases/06-.../` (newly created directory) and will be force-added to git so it survives the worktree merge/removal, matching the precedent of other force-added phase summaries already in the tracked history (e.g. `.planning/phases/03-phase3/03-task5-SUMMARY.md`).

## User Setup Required

None - no external service configuration required. Note the plan's documented ops follow-up (not part of this autonomous task): apply this template to the live host nginx config, run `nginx -t && systemctl reload nginx`, then validate with `curl -I https://<domain>/` that all 7 headers (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-XSS-Protection, Content-Security-Policy) appear and that `/api/docs` / `/api/docs.json` both return 403.

## Next Phase Readiness
- `config/nginx/nginx.prod.conf` is ready to be copied to the VPS host nginx config by ops (Juan Camilo Rendón) per the plan's noted follow-up.
- No blockers for other Wave-1 phase-06 plans; this plan touched only `config/nginx/nginx.prod.conf` and had no dependencies on or from sibling plans (06-01 through 06-04, 06-06 through 06-09).

---
*Phase: 06-security-hardening-deployment-weeks-15-16*
*Completed: 2026-07-07*

## Self-Check: PASSED

- FOUND: config/nginx/nginx.prod.conf
- FOUND: .planning/phases/06-security-hardening-deployment-weeks-15-16/06-05-SUMMARY.md
- FOUND commit: ccf3aac (Task 1)
- FOUND commit: bc5171a (Task 2)
