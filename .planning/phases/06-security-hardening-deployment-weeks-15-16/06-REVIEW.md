---
phase: 06-security-hardening-deployment-weeks-15-16
reviewed: 2026-07-07T00:00:00Z
depth: standard
files_reviewed: 23
files_reviewed_list:
  - .env.example
  - .env.production.example
  - backend/.env.example
  - backend/jest.config.js
  - backend/src/index.ts
  - backend/src/middleware/rate-limit.middleware.ts
  - backend/src/modules/events/EventStore.ts
  - backend/src/modules/events/__tests__/EventStore.test.ts
  - backend/src/routes/__tests__/webhooks.routes.test.ts
  - backend/src/routes/assessments.routes.ts
  - backend/src/routes/auditor-clients.routes.ts
  - backend/src/routes/auth.routes.ts
  - backend/src/routes/risk-scoring.routes.ts
  - backend/src/routes/users.routes.ts
  - backend/src/routes/webhooks.routes.ts
  - backend/src/services/__tests__/jwt.service.test.ts
  - backend/src/services/jwt.service.ts
  - backend/src/utils/__tests__/webhook-signature.test.ts
  - backend/src/utils/webhook-signature.ts
  - config/nginx/nginx.prod.conf
  - docker-compose.prod.yml
  - docker-compose.yml
  - scripts/pg-upgrade-14-to-17.md
findings:
  critical: 4
  warning: 7
  info: 4
  total: 15
status: critical_fixed
critical_fixed_commit: f1140e3
---

# Phase 06: Code Review Report

**Reviewed:** 2026-07-07
**Depth:** standard
**Files Reviewed:** 23
**Status:** critical_fixed — all 4 CRITICAL/BLOCKER findings resolved in commit `f1140e3` (see below). The 7 WARNING and 4 INFO findings remain open, tracked as follow-up items.

## Resolution (post-review, orchestrator)

All four CRITICAL findings (CR-01 through CR-04) were fixed directly, verified against
the exact fix guidance below, and committed as `f1140e3`:

- **CR-01** (assessment export IDOR): fixed — ownership check added, matching sibling endpoints.
- **CR-02** (risk-trend no authz): fixed — ownership check added, matching neighboring endpoint.
- **CR-03** (EventStore false-positive tamper alert): fixed — `previousEventHash ?? null`
  normalization, plus a new regression test (`EventStore.verifyIntegrity` suite) covering the
  exact append→verify round trip that was broken.
- **CR-04** (error middleware never invoked): fixed — 4th `next` param added; the coupled
  IN-03 finding (CORS 500→403) was fixed in the same change.

Verification: `tsc --noEmit` and `eslint` clean on all changed files (zero new errors vs.
baseline), full backend `jest` suite shows an identical pass/fail set to the pre-fix baseline
(8 pre-existing unrelated failures unchanged; all phase-06 tests, including the new
regression test, pass).

WARNING and INFO findings (WR-01 through WR-07, IN-01, IN-02, IN-04) were **not** fixed in
this pass — they are lower-severity, several require a product/design decision (WR-07), and
none block phase completion. See `.planning/phases/06-security-hardening-deployment-weeks-15-16/deferred-items.md`
for the established pattern of tracking phase-06 follow-ups; these should be added there or
scoped as a dedicated follow-up plan.

## Summary

Reviewed the JWT hardening, webhook signature verification, Express/CORS/Swagger config, nginx
headers, EventStore integrity/encryption, audit-trail identity fixes, docker-compose secrets
externalization, and Postgres 14→17 runbook work for phase 06. The two issues the orchestrator
already flagged and fixed (time-boxed JWT refresh grace fallback, header-only webhook shared
secret) both look correctly and completely implemented on re-inspection — no new findings there.

However, four **BLOCKER**-level defects were found that either undermine the phase's stated goals
or were newly introduced by this phase's diff:

- A newly-wired PDF export endpoint (`POST /api/assessments/:id/export`) leaks any provider's full
  compliance report to any authenticated `provider_admin`/`auditor`, because it never got the
  ownership check every sibling endpoint in the same file has (broken access control / IDOR).
- `GET /api/findings/:findingId/risk/trend` has **no** authorization check at all — not even a
  role check — inside a router where every other endpoint enforces provider/role scoping.
- `EventStore.verifyIntegrity()` — the tamper-detection mechanism this phase's "EventStore
  integrity" workstream exists to deliver — is provably broken: it reports a false-positive hash
  mismatch for the first event of **every** aggregate due to an `undefined` vs `null`
  `JSON.stringify` serialization mismatch between `append()` and `verifyIntegrity()`.
- The app's final Express error-handling middleware in `index.ts` is declared with only 3
  parameters (`err, req, res`) instead of the 4 Express requires (`err, req, res, next`) to be
  recognized as error middleware, so it is **never invoked** — unhandled/forwarded errors (CORS
  rejections included) bypass the app's sanitized JSON error contract and its `logger.error(...)`
  call, silently dropping error logs.

Several WARNING-level issues were also found, most notably that the new per-user API rate-limit
tier introduced in this phase (`apiLimiter`'s `max`/`keyGenerator` based on `req.user`) can never
activate anywhere in the app, because `apiLimiter` is always mounted *before* `authMiddleware`
runs — `req.user` is undefined at evaluation time on every route.

## Critical Issues

### CR-01: Broken access control — assessment PDF export leaks any provider's compliance data

**File:** `backend/src/routes/assessments.routes.ts:743-770`
**Issue:** This phase converted `POST /api/assessments/:id/export` from a no-op JSON placeholder
into a real handler that streams a full PDF compliance report (`ReportService.generatePdfReport`)
for the assessment's `provider_id`. Every other read/write endpoint in this same file enforces
ownership — `provider_admin` must match `assessment.providerId` via a `users` lookup, and
`auditor` must have a row in `auditor_providers` for that provider (see e.g. lines 220-248,
504-525, 593-606). The new export handler skips both checks entirely: it only confirms the
assessment row exists, then generates and returns the PDF to *any* authenticated
`provider_admin` or `auditor`, regardless of which provider they belong to or are assigned to.
Since assessment IDs are returned in list/detail responses across the app, any authenticated
non-admin user can pull another provider's full compliance report (healthcare data under Res.
3100 / Ley 1581) by guessing/observing an assessment UUID.
**Fix:** Reuse the same ownership pattern as the sibling endpoints before calling
`generatePdfReport`:
```ts
const r = await pool.query('SELECT provider_id FROM assessments WHERE id = $1', [id]);
if (r.rows.length === 0) {
  return res.status(404).json({ error: 'Not Found', message: 'Evaluación no encontrada' });
}
const providerId = r.rows[0].provider_id;
const userRole = req.user?.role;
const userId = req.user?.user_id;

if (userRole === 'provider_admin') {
  const u = await pool.query('SELECT provider_id FROM users WHERE id = $1', [userId]);
  if (u.rows.length === 0 || u.rows[0].provider_id !== providerId) {
    return res.status(403).json({ error: 'Access denied' });
  }
}
if (userRole === 'auditor') {
  const assigned = await pool.query(
    'SELECT 1 FROM auditor_providers WHERE auditor_id = $1 AND provider_id = $2',
    [userId, providerId]
  );
  if (assigned.rows.length === 0) {
    return res.status(403).json({ error: 'Access denied' });
  }
}
```

### CR-02: No authorization at all on `GET /api/findings/:findingId/risk/trend`

**File:** `backend/src/routes/risk-scoring.routes.ts:69-84`
**Issue:** This handler only sits behind the router-wide `router.use(authMiddleware)` (line 21) —
it has neither an `rbacMiddleware(...)` call nor the provider-ownership check that the endpoint
immediately above it (`GET /findings/:findingId/risk`, lines 27-63) performs. Any authenticated
user of any role (including a `provider_admin` from a completely unrelated provider) can fetch the
historical risk-score trend for any `findingId` in the system — cross-tenant exposure of
compliance/risk data within the very same router that otherwise scopes `provider_admin` and
checks provider ownership everywhere else.
**Fix:** Mirror the ownership check from the neighboring `/findings/:findingId/risk` handler:
```ts
router.get('/findings/:findingId/risk/trend', async (req, res, next) => {
  try {
    const { findingId } = req.params;
    const findingResult = await pool.query('SELECT provider_id FROM findings WHERE id = $1', [findingId]);
    if (findingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Hallazgo no encontrado' });
    }
    const userRole = req.user?.role;
    const userId = req.user?.user_id;
    if (userRole !== 'super_admin' && userRole !== 'auditor') {
      const access = await pool.query(
        'SELECT id FROM users WHERE id = $1 AND provider_id = $2',
        [userId, findingResult.rows[0].provider_id]
      );
      if (access.rows.length === 0) {
        return res.status(403).json({ error: 'No autorizado' });
      }
    }
    // ... existing logic
  } catch (error) { ... }
});
```

### CR-03: `EventStore.verifyIntegrity()` always reports a false-positive tamper alert for the first event of every aggregate

**File:** `backend/src/modules/events/EventStore.ts:64-68, 70-80, 233-243, 275-280`
**Issue:** In `append()`, `previousEventHash` for an aggregate's first event is `undefined`
(`previousEventResult.rows[0]?.event_hash` with no rows, line 68), and that `undefined` value is
fed straight into `calculateHash()` (lines 72-80). `JSON.stringify` **omits** object keys whose
value is `undefined`, so the hash seed for the first event never contains a
`previousEventHash` key. But `verifyIntegrity()` re-reads the same row via
`getEventsByAggregateId()`, whose row-mapping (line 158) yields `previousEventHash: null` (the
actual Postgres `NULL` value, since it was stored as `previousEventHash || null` at insert time —
line 101) — and `JSON.stringify` **keeps** keys whose value is `null`. Recomputing the hash with
`previousEventHash: null` present therefore produces a different SHA-256 digest than the one
computed and stored at append time, for every single "first event" of every aggregate in the
system. Verified directly:
```
$ node -e "console.log(JSON.stringify({id:1, previousEventHash: undefined}))"
{"id":1}
$ node -e "console.log(JSON.stringify({id:1, previousEventHash: null}))"
{"id":1,"previousEventHash":null}
```
This means `verifyIntegrity(aggregateId)` will report `isValid: false` with an
`"Event ... hash mismatch"` error for virtually every aggregate that has ever been created,
completely defeating the tamper-evidence feature this phase's EventStore work is meant to
deliver. (Not currently caught by `EventStore.test.ts`, which only covers the transactional/lock
behavior of `append()`, not `verifyIntegrity()`.)
**Fix:** Normalize `previousEventHash` to the same type (both `undefined`, or both explicit
`null`) before hashing at both write and read time, e.g. always pass `previousEventHash ?? null`
into `calculateHash()` in `append()` so the JSON shape matches what `verifyIntegrity()` will later
recompute:
```ts
const eventHash = this.calculateHash({
  id: eventId,
  aggregateId: event.aggregateId,
  aggregateType: event.aggregateType,
  eventType: event.eventType,
  payload: event.payload,
  timestamp,
  previousEventHash: previousEventHash ?? null,   // was: previousEventHash (undefined)
});
```
Add a regression test asserting `verifyIntegrity()` returns `isValid: true` for a freshly-appended
single-event aggregate.

### CR-04: Final Express error-handling middleware has the wrong arity and is never invoked

**File:** `backend/src/index.ts:311-321`
**Issue:**
```ts
app.use((err: Error, _req: Request, res: Response) => {
  logger.error({ error: err.message, stack: err.stack });
  res.status(500).json({ ... });
});
```
Express identifies error-handling middleware **solely by function arity** — it must declare
exactly four parameters (`err, req, res, next`). This function declares three, so Express treats
it as ordinary middleware, not an error handler, and it is skipped whenever `next(err)` is called
(including errors surfaced by `express-async-errors`, which this app relies on — see the import at
line 5 — and the CORS rejection path at lines 131-145, which calls `callback(new Error(...))`).
The practical effect: every unhandled/forwarded error in the app falls through to Express's
built-in default error handler instead of this one, which means (a) the app's own
`logger.error(...)` call for unhandled errors never executes — silently losing error/audit
visibility for exactly the class of failures that matter most — and (b) API consumers receive
Express's default (non-JSON) error response instead of the documented
`{ error, message }` JSON envelope, breaking the API contract on any unexpected error.
**Fix:** Add the required fourth parameter (it can be prefixed `_next` if unused, but must be
present):
```ts
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ error: err.message, stack: err.stack });
  res.status(500).json({
    error: 'Internal Server Error',
    message: NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
  });
});
```

## Warnings

### WR-01: New per-user API rate-limit tier never activates — `req.user` is always undefined when `apiLimiter` runs

**File:** `backend/src/middleware/rate-limit.middleware.ts:21-49`; mounting order in
`backend/src/index.ts` (e.g. lines 242-243, 250, 261)
**Issue:** This phase changed `apiLimiter` to compute `max` and `keyGenerator` from
`req.user?.user_id` (100 req/min for authenticated users vs 1000 req/min anonymous, keyed
per-user). But in every mounting in `index.ts`, `apiLimiter` runs *before* `authMiddleware`
(either directly, e.g. `app.use('/api/multichannel', apiLimiter, authMiddleware, ...)`, or because
`authMiddleware` is applied per-route/`router.use()` *inside* the sub-router that `apiLimiter`
wraps). `req.user` is only populated by `authMiddleware`/`optionalAuthMiddleware`
(`backend/src/middleware/auth.middleware.ts:83-88`), which hasn't run yet at the point
`apiLimiter`'s `max`/`keyGenerator` callbacks execute. As a result, `req.user?.user_id` is always
`undefined` for every request through `apiLimiter`, so every request — authenticated or not —
gets the more permissive 1000 req/min-per-IP tier and is keyed by IP, never by user. The intended
tighter, per-user rate limit for authenticated traffic silently never applies anywhere in the app.
**Fix:** Either mount `authMiddleware` before `apiLimiter` on every route that needs the
per-user tier, or (simpler, given `authMiddleware` currently 401s on missing tokens which would
break unauthenticated routes) use `optionalAuthMiddleware` ahead of `apiLimiter` specifically to
populate `req.user` when a valid token is present, without rejecting anonymous requests.

### WR-02: `expires_in` in auth responses is hardcoded to 3600s but the actual access token expiry is 1800s

**File:** `backend/src/routes/auth.routes.ts:272, 370, 483, 723`; actual value in
`backend/src/services/jwt.service.ts:6`
**Issue:** `ACCESS_TOKEN_EXPIRY = 1800` (30 minutes) is used to sign every access token, and the
code comment explicitly states the frontend is expected to silently renew "via refresh token"
using this value. But all four places that return token metadata to the client
(`/auth/login`, `/auth/refresh`, `/auth/dev-login`, `/auth/change-password`) hardcode
`expires_in: 3600` (1 hour) instead of importing `ACCESS_TOKEN_EXPIRY`. Any frontend that
schedules its silent-refresh timer off `expires_in` will use an already-expired access token for
the last ~30 minutes of the token's advertised lifetime, causing spurious 401s until the client's
reactive-refresh-on-401 logic (if it exists) kicks in.
**Fix:** Import and reuse the constant instead of a literal:
```ts
res.status(200).json({
  access_token: accessToken,
  expires_in: ACCESS_TOKEN_EXPIRY, // was: 3600
  ...
});
```

### WR-03: Event hash chain excludes `userId` and `metadata` — audit-trail "who" is not tamper-protected

**File:** `backend/src/modules/events/EventStore.ts:72-80, 275-280`
**Issue:** `calculateHash()` is seeded with `id, aggregateId, aggregateType, eventType, payload,
timestamp, previousEventHash` — it does not include `userId` or `metadata`. Since this phase's
audit-trail identity fixes specifically moved several routers (`risk-scoring`, `users`) off raw
`INSERT INTO events` and onto `EventStore.append()` precisely to get tamper-evident hash chaining
for audit trail integrity, excluding `user_id` from the hash means the "who performed this action"
field on any past event can be modified directly in the database without invalidating the
hash chain or being detected by `verifyIntegrity()`. For a compliance system whose audit trail is
a core control, this is a meaningful gap.
**Fix:** Include `userId` (and ideally `metadata`) in the hashed payload, with a migration note
that this changes the hash of all future events (existing stored hashes remain valid since they
were never computed including these fields — no backfill needed, only forward behavior changes).

### WR-04: Webhook signature-verification fail-open behavior depends solely on an exact `NODE_ENV === 'production'` string match, and required secrets are missing from the production env template

**File:** `backend/src/routes/webhooks.routes.ts:24`; `.env.production.example`
**Issue:** `failOpen = process.env.NODE_ENV !== 'production'` is the single gate that decides
whether an unset webhook secret is tolerated (dev) or rejected (prod) — see the `!ok &&
!(failOpen && !key)` guard repeated in every handler. If `NODE_ENV` is ever missing or set to
anything other than the literal string `'production'` in a real deployment (a plausible
misconfiguration — e.g. `NODE_ENV=prod`, or an orchestrator that doesn't propagate it), every
webhook endpoint silently reverts to accepting **unsigned, unverified** third-party payloads,
which is exactly the "HIGH" gap this phase's webhook-signature work was meant to close.
Compounding this, `.env.production.example` (the template ops copies to `.env.production`) was
only touched to add `ENCRYPTION_KEY`/`ENCRYPT_EVENT_PAYLOADS` in this phase and still does not
list any of the six new webhook secret variables
(`MAILGUN_WEBHOOK_SIGNING_KEY`, `SENDGRID_WEBHOOK_SECRET`, `TWILIO_AUTH_TOKEN`,
`AWS_SNS_WEBHOOK_SECRET`, `FCM_WEBHOOK_SECRET`, `APNS_WEBHOOK_SECRET`), nor `TURNSTILE_SECRET_KEY`
or `FRONTEND_URL` (both read by `auth.routes.ts`). An operator following only
`.env.production.example` has no signal that these need to be set.
**Fix:** Add the missing variables (with `CAMBIAR_POR_...` placeholders, matching the existing
convention) to `.env.production.example`. Consider hardening the fail-open gate itself, e.g.
requiring an explicit `ALLOW_UNVERIFIED_WEBHOOKS=true` opt-in for non-production instead of
inferring safety from `NODE_ENV`.

### WR-05: Dev `docker-compose.yml` binds Postgres/Redis/Evolution ports to `0.0.0.0`

**File:** `docker-compose.yml:82-83` (postgres `5433:5432`), `docker-compose.yml:155-156` (redis
`6379:6379`), `docker-compose.yml:105-106` (evolution `8080:8080`)
**Issue:** All three are published without a `127.0.0.1:` bind prefix, so they listen on every
network interface (Docker bypasses host firewalls such as UFW via the `DOCKER-USER`/`DOCKER`
iptables chains). This phase's docker-compose secrets-externalization work correctly removed
hardcoded credentials from this file (`DB_PASSWORD`, `JWT_SECRET`, `RESEND_API_KEY`,
`EVOLUTION_API_KEY` all moved to `${VAR}` interpolation) but left the port bindings unchanged.
On any dev host that isn't fully NAT-isolated (e.g. a cloud dev VM with a public IP), this exposes
Postgres/Redis/Evolution directly to the network using whatever password is in the local `.env`.
`docker-compose.prod.yml` already does this correctly (no `ports:` for postgres/redis at all).
**Fix:**
```yaml
postgres:
  ports:
    - "127.0.0.1:5433:5432"
redis:
  ports:
    - "127.0.0.1:6379:6379"
evolution:
  ports:
    - "127.0.0.1:8080:8080"
```

### WR-06: nginx and Express/helmet both set security headers on proxied `/api` and `/auth` responses, producing duplicate/conflicting header sets

**File:** `config/nginx/nginx.prod.conf:37-45` vs `backend/src/index.ts:110-129`
**Issue:** `nginx.prod.conf`'s `server { listen 443 ... }` block sets `Strict-Transport-Security`,
`X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`,
`X-XSS-Protection: "1; mode=block"`, and a `Content-Security-Policy` at the server level (inherited
by every location, including `/api` and `/auth`, which proxy to the Express backend). The Express
app independently sets its own version of most of these via `helmet(...)` (including a
**different** CSP — e.g. `connect-src 'self' ws: wss:` vs nginx's `connect-src 'self'` — and
helmet v7's default `X-XSS-Protection: 0`, which directly conflicts with nginx's
`"1; mode=block"`). `nginx add_header` does not strip pre-existing upstream headers of the same
name, so proxied API responses will carry two `X-Frame-Options`, two `X-XSS-Protection`
(with contradictory values), and two `Content-Security-Policy` headers. While the practical impact
on pure JSON API responses is limited (CSP/frame-ancestors mainly matter for documents), this is a
config-hygiene problem that produces genuinely conflicting security-header values in the wire
response and can silently break future functionality that depends on a specific header value.
**Fix:** Pick one layer as the single source of truth. Either strip the Express-set headers for
`/api`/`/auth` in nginx (`proxy_hide_header X-Frame-Options;` etc. before re-adding nginx's own),
or disable the corresponding helmet directives for those routes and let nginx own them exclusively.

### WR-07: `risk-scoring.routes.ts` does not scope the `auditor` role to assigned providers, unlike `assessments.routes.ts`

**File:** `backend/src/routes/risk-scoring.routes.ts:27-63, 148-184, 114-146`
**Issue:** `assessments.routes.ts` consistently restricts `auditor` users to providers listed in
`auditor_providers` before allowing read/write access (e.g. lines 220-248, 504-525). In
`risk-scoring.routes.ts`, the ownership check on `GET /findings/:findingId/risk` (lines 46-54)
explicitly excludes `auditor` from the check (`if (userRole !== 'super_admin' && userRole !==
'auditor')`), and `POST /findings/:findingId/risk/recalculate` (lines 148-184) and
`GET /providers/:providerId/risk-summary` (lines 114-146, auditor branch) apply no
provider-assignment check for auditors at all — any auditor account can view or recalculate risk
scores for any provider in the system, not just their assigned ones. This may be an intentional
design choice (auditors get org-wide risk visibility) but it is inconsistent with the stricter
model enforced everywhere in `assessments.routes.ts`, and combined with CR-02 above suggests this
router's authorization model wasn't reviewed to the same standard as the assessments router during
this hardening phase.
**Fix:** Confirm the intended model with product/compliance; if auditors should be scoped like in
`assessments.routes.ts`, add the same `auditor_providers` check to these three endpoints.

## Info

### IN-01: Historical hardcoded secrets remain in git history even though `docker-compose.yml` is now externalized

**File:** `docker-compose.yml` (current, clean); `.env.example:5-6` (placeholder comments
`CAMBIAR_POR_NUEVA_KEY_RESEND` / `CAMBIAR_POR_NUEVA_EVOLUTION_KEY` hint this is already tracked)
**Issue:** Prior to this phase's diff, `docker-compose.yml` contained a live-looking Resend API
key (`re_SZxw6HFN_GFcV5w3p9cpgUZmL9v4J7YEM`) and a static Evolution API key
(`norma3100_evo_key_2025`) directly in source. These are now correctly externalized to
`${RESEND_API_KEY}`/`${EVOLUTION_API_KEY}`, but the old values remain permanently readable in git
history. The `.env.example` placeholders ("CAMBIAR..." = "change...") suggest the team is already
tracking rotation, but this should be explicitly confirmed/closed out.
**Fix:** Confirm both keys were rotated at the provider (Resend dashboard, Evolution API config)
and record the rotation date in `SECURITY.md`, per REGLA DE ORO #4's key-rotation runbook
requirement.

### IN-02: `pg-upgrade-14-to-17.md` hardcodes the production VPS IP and a local SSH private key path

**File:** `scripts/pg-upgrade-14-to-17.md:4, 269`
**Issue:** The runbook embeds the production VPS's public IP (`147.93.45.4`) and a local operator
SSH private key path (`C:\Users\guido\.ssh\hostinger_agente_openclaw_ed25519`) directly in a
markdown file committed to the repository. This is operational documentation, not executable code,
and the key material itself isn't included, but publishing the exact IP + key filename in a
version-controlled doc is unnecessary recon information if the repo is ever made public or shared
more broadly than intended.
**Fix:** Reference the VPS via its SSH config alias only (`hostinger-vps-new`, already used
elsewhere in the doc) and drop the raw IP/key-path detail, or move this reference doc to a
non-committed ops runbook location.

### IN-03: CORS rejection returns HTTP 500 instead of 403

**File:** `backend/src/index.ts:131-145` (interacts with CR-04)
**Issue:** When an `Origin` header isn't in the whitelist, the `cors` middleware's origin callback
is invoked with `callback(new Error('CORS not allowed'))`, which Express forwards via `next(err)`.
Because of CR-04 (the error handler's broken arity), this currently falls through to Express's
default handler rather than the app's own, but even once CR-04 is fixed, the app's generic error
handler would still turn a CORS rejection into a `500 Internal Server Error` rather than a more
accurate `403 Forbidden`.
**Fix:** Handle the CORS error explicitly (e.g. a small middleware checking `err.message === 'CORS
not allowed'` before the generic handler, or pass a custom error subtype) and return 403.

### IN-04: AWS SNS webhook handler can throw on a missing/malformed `Message` field

**File:** `backend/src/routes/webhooks.routes.ts:263-276`
**Issue:** `let message = payload.Message; if (typeof message === 'string') { message =
JSON.parse(message); }` — if `payload.Message` is absent, `message` stays `undefined`, and the
following line `message.delivery?.status` throws a `TypeError` (caught by the outer `try/catch`,
producing a generic `500` instead of a `400 Bad Request`). Similarly a malformed JSON string in
`Message` would throw from `JSON.parse` uncaught by anything more specific. Not introduced by this
phase's diff (only the signature-verification lines above it were added), but worth a quick
robustness pass while this file was touched.
**Fix:**
```ts
let message: any = payload.Message;
if (typeof message === 'string') {
  try { message = JSON.parse(message); } catch { return res.status(400).json({ error: 'Invalid Message JSON' }); }
}
if (!message || typeof message !== 'object') {
  return res.status(400).json({ error: 'Missing Message field' });
}
```

---

_Reviewed: 2026-07-07_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
