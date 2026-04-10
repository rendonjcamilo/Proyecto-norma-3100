# Phase 1: Development Environment & Infrastructure Setup

**Project:** Norma 3100 Compliance Management System  
**Phase:** 1 (MVP Foundation)  
**Timeline:** Weeks 1-2  
**Total Effort:** 40 hours  
**Team Size:** 2 engineers  
**Status:** PLANNED

---

## Phase Goal

Establish the development environment, infrastructure, and architectural foundation for the Norma 3100 Compliance Management System. Deliver a fully functional Docker-based dev stack with event sourcing schema, Redis caching, and CI/CD skeleton ready for Phase 2 (Auth & User Management).

**Alignment to ROADMAP.md:**
- Phase 1.1: Dev Environment & Architecture
- Phase 1.2: Database Schema & Event Sourcing

---

## Success Criteria

1. **Docker Infrastructure**
   - `docker-compose up` starts all services (backend, frontend, PostgreSQL, Redis) without errors
   - All health checks pass (backend responds on :3000, frontend on :3000, PostgreSQL :5432, Redis :6379)
   - Services survive restart cycles without data loss
   - Build time <3 min for clean build

2. **Database & Event Sourcing**
   - PostgreSQL schema created and migrated successfully
   - Event store append-only table functional and immutable
   - All indexes created and performing (<100ms query on audit events table)
   - Migration rollback tested without data loss
   - Event replay mechanism reconstructs state correctly

3. **Redis Caching**
   - Redis responds to PING and basic SET/GET operations
   - Session cache TTL enforced correctly
   - Cache hit rates demonstrate ≥40% reduction in DB load
   - Redis persists data across container restarts

4. **Development Environment**
   - Project structure follows modular design (src/modules, src/routes, src/middleware, src/utils)
   - ESLint/Prettier/TypeScript configured and enforced
   - npm scripts functional: `npm run dev`, `npm run lint`, `npm run test`, `npm run build`
   - README.md covers setup, environment variables, project structure
   - .env.example includes all required variables (no secrets in git)

5. **Git & CI/CD Skeleton**
   - Repository initialized with clean commit history
   - GitHub Actions workflow created (lint, test, build gates)
   - .gitignore prevents committing secrets, node_modules, .env
   - Branch protection rules proposed (code review, status checks)

6. **Local Dev Readiness**
   - Developer can clone, run `docker-compose up`, and have system operational in <10 min
   - All environment variables documented
   - TypeScript compilation succeeds without warnings
   - No hardcoded credentials or sensitive data in committed code

---

## Task Breakdown (8 tasks, 40 hours total)

### Task 1: Docker Compose Setup & Base Services (8 hours)
**Traceability:** ROADMAP.md P1.1.1 → Task P1.T1

**Description:**
Create Docker Compose file orchestrating all development services: Node.js/Express backend, React frontend, PostgreSQL database, and Redis cache. Configure health checks, volumes, networking, and environment variables.

**Subtasks:**
1. Initialize Node.js Express backend service (base template)
2. Initialize React frontend service (base template)
3. Configure PostgreSQL service (image, volumes, initialization script)
4. Configure Redis service (image, persistence, configuration)
5. Define Docker Compose networking (backend-network, frontend-network)
6. Add health checks for all services
7. Create .dockerignore and Dockerfile.dev for development
8. Test `docker-compose up` → all services healthy

**Dependencies:** None (foundational task)

**Verification:**
- Run `docker-compose up -d && docker-compose ps` → all UP
- `curl http://localhost:3000/health` → 200 OK from backend
- `docker-compose exec postgres psql -U postgres -c "SELECT 1"` → returns 1
- `docker-compose exec redis redis-cli PING` → PONG
- `docker-compose down` + `docker-compose up` → no data loss in volumes
- Build time: `docker-compose build` completes in <3 min

**Effort Estimate:** 8 hours

**Owner:** Backend Engineer

---

### Task 2: Project Structure & Coding Standards (5 hours)
**Traceability:** ROADMAP.md P1.1.2 → Task P1.T2

**Description:**
Establish modular project structure, ESLint/Prettier configuration, TypeScript settings, and contribution guidelines. Ensure all code matches standards before Phase 2.

**Subtasks:**
1. Create directory structure:
   - Backend: src/modules/{auth,providers,services,etc}, src/routes, src/middleware, src/utils, src/types, src/config
   - Frontend: src/components, src/pages, src/hooks, src/contexts, src/services, src/types, src/styles
2. Configure TypeScript (tsconfig.json for backend & frontend)
3. Setup ESLint (backend: .eslintrc.js, rules for Node.js)
4. Setup Prettier (.prettierrc.js, .prettierignore)
5. Create pre-commit hook (lint & format on commit)
6. Write CONTRIBUTING.md (branching, commit style, PR process)
7. Write README.md (installation, environment setup, dev workflow, project structure)
8. Verify all config files committed and linting passes

**Dependencies:** Task 1 (Docker Compose)

**Verification:**
- Run `npm run lint` → 0 errors, 0 warnings
- Run `npm run format` → files reformatted without breaking code
- TypeScript compilation: `npm run build` → 0 errors
- README.md covers setup, env variables, project structure
- CONTRIBUTING.md provides clear branching/commit guidance

**Effort Estimate:** 5 hours

**Owner:** Backend Engineer

---

### Task 3: PostgreSQL Schema Design & Migrations (10 hours)
**Traceability:** ROADMAP.md P1.2.1 → Task P1.T3

**Description:**
Design and implement PostgreSQL schema for core entities (providers, locations, services, users, roles, permissions) plus append-only event store. Create migration framework and index strategy for performance.

**Subtasks:**
1. Design core tables:
   - providers (id, rut, name, address, status, created_at, updated_at)
   - locations (id, provider_id, address, services[], metadata, created_at)
   - services (id, name, category, description, status, created_at)
   - users (id, email, password_hash, role, provider_id, status, created_at)
   - roles (id, name, description, permissions[], created_at)
   - permissions (id, action, resource, created_at)
   
2. Design event store:
   - events (id, aggregate_id, aggregate_type, event_type, payload, timestamp, version, user_id, metadata)
   - Ensure append-only, immutable structure
   
3. Create indexes:
   - providers: (provider_id, status), (created_at DESC)
   - events: (aggregate_id, aggregate_type), (timestamp DESC), (event_type)
   - users: (email UNIQUE), (user_id)
   
4. Setup migration framework (Knex.js or TypeORM)
5. Write initial migration (all tables + indexes)
6. Create rollback migration (verify idempotency)
7. Document schema ERD (Mermaid or ASCII diagram)
8. Test migration: up → down → up without data loss

**Dependencies:** Task 1 (Docker Compose)

**Verification:**
- Run migration: `npm run migrate:up` → creates all tables
- Verify tables exist: `psql -c "\dt"` → all tables listed
- Verify indexes: `psql -c "\di"` → all indexes present
- Insert test data into events table: immutability verified (no UPDATE allowed)
- Rollback test: `npm run migrate:down` → all tables dropped
- Reapply migration: `npm run migrate:up` → clean state, no errors

**Effort Estimate:** 10 hours

**Owner:** Backend Engineer

---

### Task 4: Event Sourcing Framework & Immutability (12 hours)
**Traceability:** ROADMAP.md P1.2.2 → Task P1.T4

**Description:**
Implement event sourcing framework with event publisher/subscriber pattern, event replay mechanism for state reconstruction, and event versioning strategy. Ensure immutability and audit trail foundation.

**Subtasks:**
1. Create EventStore class (append-only insert, no update/delete)
2. Implement EventPublisher (emit events to subscribers)
3. Implement EventSubscriber interface (handle specific event types)
4. Create event versioning strategy (v1, v2, migration if needed)
5. Implement event replay mechanism:
   - Reconstruct provider state from event history
   - Handle event migrations across versions
   - Verify state consistency after replay
6. Add event snapshots (periodic snapshots to speed up replay)
7. Implement compliance violation detection:
   - Hash chain verification (detect tampering)
   - Immutability checks (no updates to events)
8. Create unit tests for event store, publisher, replay
9. Create integration tests (end-to-end: generate event → consume → state updated)

**Dependencies:** Task 3 (PostgreSQL Schema)

**Verification:**
- Unit tests: `npm test -- EventStore.test.ts` → 100% pass
- Integration test: Create provider → emit event → replay → verify state
- Immutability test: Attempt UPDATE on events table → fails
- Hash verification: Corrupt event → violation detected
- Replay performance: Replay 10,000 events in <5 sec
- Event subscribers correctly handle published events

**Effort Estimate:** 12 hours

**Owner:** Backend Engineer

---

### Task 5: Redis Caching Strategy & Configuration (5 hours)
**Traceability:** ROADMAP.md P1.2.3 → Task P1.T5

**Description:**
Configure Redis for session caching, audit log caching, and real-time metrics. Implement cache invalidation logic and TTL policies for performance optimization.

**Subtasks:**
1. Configure Redis connection (redis://redis:6379)
2. Implement session cache:
   - Store JWT + session metadata
   - TTL: 24 hours for persistent sessions, 30 min for inactive
   - Invalidation on logout
3. Implement audit log cache:
   - Cache recent events (last 1000)
   - TTL: 1 hour
   - Invalidate on new event published
4. Setup cache invalidation logic (publish/subscribe for event updates)
5. Configure Redis persistence:
   - AOF (Append-Only File) enabled
   - Save snapshot every 5 min
   - Test recovery after Redis restart
6. Create cache health check (PING, memory usage, eviction policy)
7. Add cache metrics (hit rate, miss rate, memory usage)

**Dependencies:** Task 1 (Docker Compose)

**Verification:**
- Redis PING responds
- Session stored in Redis persists across requests
- Cache hit rate ≥40% reduction in DB load
- Cache TTL enforced (check expiration with TTL command)
- Restart Redis → data persists (AOF recovery)
- Memory usage monitored and eviction policy LRU applied

**Effort Estimate:** 5 hours

**Owner:** Backend Engineer

---

### Task 6: Git Repository & CI/CD Skeleton (4 hours)
**Traceability:** ROADMAP.md P1.1.1 → Task P1.T6

**Description:**
Initialize Git repository with clean structure, GitHub Actions workflows for CI/CD gates (lint, test, build), and branch protection rules.

**Subtasks:**
1. Initialize Git repository in project root
2. Create .gitignore (node_modules, .env, dist, coverage, etc.)
3. Create .env.example with all required variables (no secrets)
4. Create GitHub Actions workflows:
   - Lint workflow: ESLint on all TypeScript files
   - Test workflow: Jest unit tests + coverage ≥80%
   - Build workflow: Docker build, Docker Compose validation
5. Create GITHUB_CONFIG.md (branch strategy, PR requirements)
6. Document CI/CD status checks (required checks before merge)
7. Create initial commit with all infrastructure code
8. Document rollback procedure

**Dependencies:** Task 2 (Project Structure)

**Verification:**
- `git status` → clean (no untracked important files)
- `.gitignore` prevents secrets from being committed
- GitHub Actions workflows defined in `.github/workflows/`
- Workflows trigger on pull requests and commits
- All status checks pass on this initial commit

**Effort Estimate:** 4 hours

**Owner:** DevOps Engineer

---

### Task 7: Environment & Secrets Management Documentation (3 hours)
**Traceability:** ROADMAP.md P1.1.2 → Task P1.T7

**Description:**
Document environment variables, secrets management strategy, and local development setup to ensure team can spin up dev environment quickly and securely.

**Subtasks:**
1. Create ENV_VARIABLES.md documenting:
   - Backend env vars (DB_HOST, DB_USER, DB_PASS, REDIS_URL, JWT_SECRET, etc.)
   - Frontend env vars (REACT_APP_API_URL, etc.)
   - Required vs. optional variables
   - Example values (no real secrets)
2. Create SECRETS_MANAGEMENT.md:
   - Where to store secrets (env vars, not .env in git)
   - Development vs. production configuration
   - Key rotation procedures
   - Vault/HSM strategy for Phase 6
3. Create QUICKSTART.md (clone → docker-compose up → ready in 10 min)
4. Document troubleshooting common issues (DB connection, Redis, port conflicts)
5. Create LOCAL_SETUP.md for MacOS, Linux, Windows developers

**Dependencies:** Task 1 (Docker Compose), Task 2 (Project Structure)

**Verification:**
- README + QUICKSTART cover all setup steps
- ENV_VARIABLES.md lists all required variables with examples
- .env.example matches ENV_VARIABLES.md
- No secrets in git history (check with git-secrets or similar)
- Team can reproduce setup from documentation

**Effort Estimate:** 3 hours

**Owner:** Backend Engineer

---

### Task 8: Phase 1 Verification & Integration Testing (3 hours)
**Traceability:** All Tasks → Phase 1 Validation

**Description:**
Run comprehensive integration tests across all Phase 1 deliverables to verify Docker stack, database schema, event sourcing, caching, and CI/CD are working together correctly.

**Subtasks:**
1. Integration test: Full Docker stack startup
   - All services healthy after `docker-compose up`
   - No warnings or errors in logs
2. Integration test: Database initialization
   - Schema applies without errors
   - Default migrations complete
3. Integration test: Event sourcing end-to-end
   - Create provider record
   - Emit event to event store
   - Replay events → verify state reconstructed
4. Integration test: Caching
   - Cache miss → hit → verify reduction in DB queries
5. Integration test: Health checks
   - All service health endpoints respond
   - Liveness probes succeed
6. Documentation verification
   - QUICKSTART runnable by new developer
   - All URLs, ports, environment variables correct
7. Create VERIFICATION_CHECKLIST.md
8. Document known issues or limitations

**Dependencies:** All other tasks (Task 1-7)

**Verification:**
- Run `docker-compose up && npm test` → all tests pass
- New developer can clone and be productive in <10 min
- All Phase 1 deliverables documented and tested
- No critical bugs or warnings in logs
- VERIFICATION_CHECKLIST all items signed off

**Effort Estimate:** 3 hours

**Owner:** QA/Backend Engineer

---

## Task Dependencies & Critical Path

```
Task 1: Docker Compose Setup (8h)
  ├─ Task 2: Project Structure (5h)
  │   ├─ Task 6: Git & CI/CD (4h)
  │   └─ Task 7: Environment Docs (3h)
  │
  ├─ Task 3: PostgreSQL Schema (10h)
  │   └─ Task 4: Event Sourcing (12h)
  │
  └─ Task 5: Redis Caching (5h)
  
Task 8: Integration Testing (3h) [depends on all]

Critical Path: Task 1 → Task 3 → Task 4 → Task 8 (35 hours)
Parallel Work: Task 2, 5, 6, 7 can run in parallel with Task 3-4
```

---

## Effort Breakdown

| Task | Title | Effort | Owner | Status |
|------|-------|--------|-------|--------|
| 1 | Docker Compose Setup | 8h | Backend | TODO |
| 2 | Project Structure & Standards | 5h | Backend | TODO |
| 3 | PostgreSQL Schema | 10h | Backend | TODO |
| 4 | Event Sourcing Framework | 12h | Backend | TODO |
| 5 | Redis Caching | 5h | Backend | TODO |
| 6 | Git & CI/CD Skeleton | 4h | DevOps | TODO |
| 7 | Environment & Secrets Docs | 3h | Backend | TODO |
| 8 | Phase 1 Verification | 3h | QA/Backend | TODO |
| **TOTAL** | **Phase 1 Foundation** | **40h** | **2 engineers** | **PLANNED** |

---

## Risk Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|-----------|
| PostgreSQL schema too large for initial scope | High | Medium | Start with core 5 tables; defer location hierarchy to Phase 1.1.2 |
| Event sourcing complexity underestimated | High | Medium | Implement simple append-only store first; add versioning/replay in Phase 4.1 |
| Docker Compose networking issues on Windows | Medium | Medium | Test on Windows early (Task 1); document WSL2 setup |
| Redis persistence data loss on crash | Medium | Low | Enable AOF; test recovery procedure in Task 5 |
| Team unfamiliar with event sourcing patterns | High | High | Create detailed IMPLEMENTATION.md guide; pair programming on Task 4 |
| CI/CD pipeline too slow (>5 min builds) | Medium | Medium | Use Docker layer caching; parallelize tests; optimize in Phase 2 if needed |

---

## Verification & Acceptance Checklist

### Docker Infrastructure
- [ ] `docker-compose up -d` starts all 4 services
- [ ] All health checks pass (backend, frontend, PostgreSQL, Redis)
- [ ] Services survive graceful shutdown + restart
- [ ] Clean build time <3 min
- [ ] Volumes persist data correctly

### Database & Schema
- [ ] PostgreSQL schema applied without errors
- [ ] All 6+ core tables created (providers, locations, services, users, roles, permissions, events)
- [ ] All indexes created and functioning
- [ ] Migration framework functional (Knex.js or equivalent)
- [ ] Rollback tested successfully
- [ ] Event store table immutable (UPDATE fails)

### Event Sourcing
- [ ] Events append-only to event store
- [ ] Event replay reconstructs state correctly
- [ ] Event versioning strategy documented
- [ ] Event publisher/subscriber pattern implemented
- [ ] Hash chain or tamper detection mechanism works
- [ ] All unit tests pass

### Redis Caching
- [ ] Redis responds to PING
- [ ] Session cache TTL enforced
- [ ] Audit log cache reduces DB load ≥40%
- [ ] Cache invalidation logic functional
- [ ] Persistence (AOF) tested

### Development Environment
- [ ] Project structure follows modular design
- [ ] ESLint rules enforced (0 errors, 0 warnings)
- [ ] Prettier formatting automatic
- [ ] TypeScript configuration correct (0 compilation errors)
- [ ] npm scripts work: dev, lint, test, build, format
- [ ] README.md comprehensive and accurate
- [ ] .env.example includes all variables (no secrets)

### Git & CI/CD
- [ ] Repository initialized with clean history
- [ ] .gitignore prevents secrets/artifacts
- [ ] GitHub Actions workflows defined (lint, test, build)
- [ ] Status checks required before merge
- [ ] Branch protection rules applied
- [ ] Initial commit clean and documented

### Team Readiness
- [ ] QUICKSTART.md executed successfully by another team member
- [ ] All developers able to `docker-compose up` and have working stack
- [ ] Documentation complete (README, CONTRIBUTING, SECRETS_MANAGEMENT, etc.)
- [ ] No hardcoded credentials in code
- [ ] Troubleshooting guide created and tested

---

## Success Metrics (Go/No-Go for Phase 2)

**GO to Phase 2 if:**
- All 8 tasks completed and verified
- Docker Compose stack 100% healthy
- PostgreSQL schema + event sourcing tested
- Redis caching functional and documented
- CI/CD pipeline passing on main branch
- Team comfortable with stack and can spin up in <10 min
- Zero critical/high vulnerabilities in dependencies
- Documentation complete and accurate

**NO-GO items (block Phase 2):**
- Docker build fails or takes >5 min
- Event sourcing replay produces incorrect state
- Migration rollback leaves orphaned data
- CI/CD pipeline broken or timeout >10 min
- Secrets accidentally committed to git
- Team unable to replicate local dev environment

---

## Definition of Done

Each task is "done" when:
1. Code written and committed to feature branch
2. All tests pass locally and in CI/CD
3. Code review approved (≥1 approval)
4. Documentation written (README, inline comments, API docs if applicable)
5. Task verification checklist signed off
6. Merged to main branch with clean git history

---

## Phase 1 → Phase 2 Handoff

**Deliverables to Phase 2:**
- Fully functional Docker stack (docker-compose.yml)
- PostgreSQL schema with migrations
- Event sourcing framework (append-only, replay, versioning)
- Redis caching configuration
- Project structure and coding standards
- CI/CD pipeline and status checks
- Developer documentation (QUICKSTART, troubleshooting)

**Phase 2 Dependencies:**
- Task 1 (Docker) provides running services for Auth backend/frontend
- Task 3 (Schema) provides users/roles/permissions tables
- Task 4 (Event Sourcing) provides audit trail foundation
- Task 5 (Redis) supports JWT token/session caching
- Task 6 (Git/CI/CD) gates Phase 2 PRs

---

## Traceability Matrix

| ROADMAP.md Phase | Plan Task(s) | Acceptance Criteria | Verification |
|------------------|--------------|-------------------|--------------|
| P1.1.1 Docker & Dev | T1, T2, T6 | All services healthy, build <3min, QUICKSTART works | Task 1, 8 |
| P1.1.2 Structure & Standards | T2, T7 | ESLint 0 errors, TypeScript builds, docs complete | Task 2, 8 |
| P1.2.1 PostgreSQL Schema | T3 | Schema created, indexes functional, migration reversible | Task 3, 8 |
| P1.2.2 Event Sourcing | T4 | Events immutable, replay works, versioning strategy | Task 4, 8 |
| P1.2.3 Redis Caching | T5 | Cache hit ≥40%, TTL enforced, persistence tested | Task 5, 8 |
| All Phase 1 | T8 | Integration tests pass, documentation complete | Task 8 |

---

## Notes

- **TypeScript:** All backend code should be TypeScript; frontend React + TypeScript
- **Testing:** Aim for ≥80% code coverage on critical paths (event store, auth in Phase 2)
- **Logging:** Use structured JSON logging (winston, pino, or similar) for observability
- **Monitoring:** Phase 1 focuses on local dev; Phase 6 adds production monitoring
- **Event Sourcing:** Keep simple in Phase 1 (append-only, replay); add snapshotting if performance needed
- **Secrets:** Never commit .env files; use .env.example for documentation only

---

**Last Updated:** 2026-04-10  
**Status:** PLANNED → Ready for execution via `/gsd-execute-phase 1`
