# CLAUDE.md

Guía para Claude Code (claude.ai/code) al trabajar con este repositorio.

## 📋 El Proyecto

**Sistema de Gestión de Cumplimiento — Resolución 3100 de 2019 (Colombia)**

Plataforma que permite a los prestadores de salud:
- **Autoevaluarse** contra la Norma 3100 del Ministerio de Salud colombiano
- **Rastrear hallazgos** (inconformidades y oportunidades de mejora)
- **Demostrar cumplimiento** ante auditorías y organismos de control

### Concepto normativo clave:

**7 Estándares Transversales** (aplican a TODOS los 157 servicios de salud):
- `TSTH` — Talento Humano (21 criterios)
- `TSINF` — Información (15 criterios)
- `TSDOT` — Dotación (12 criterios)
- `TSMD` — Medicamentos y Dispositivos (10 criterios)
- `TSPP` — Procesos y Procedimientos (13 criterios)
- `TSHCR` — Habilitación Conjunta de Recursos (11 criterios)
- `TSINT` — Integralidad (5 criterios)

**+ Criterios específicos por servicio:** Consultoría, Urgencias, Hospitalización, Laboratorio, etc.

**Total:** 87 criterios transversales + N criterios por servicio = evaluación completa

## 🛠️ Comandos

### Backend (`cd backend`)
```bash
npm run dev           # Inicia con tsx watch (puerto 3001)
npm run build         # Compilar TypeScript a dist/
npm run lint          # Revisar código con ESLint
npm run lint:fix      # Arreglar errores de ESLint automáticamente
npm test              # Ejecutar todas las pruebas (Jest)
npm test -- --testPathPattern=assessments   # Ejecutar solo un archivo de prueba
npm run migrate:up    # Aplicar todas las migraciones de BD
npm run migrate:down  # Revertir la última migración
npm run seed          # Cargar datos de referencia iniciales
```

### Frontend (`cd frontend`)
```bash
npm run dev           # Servidor de desarrollo Vite (puerto 5173)
npm run build         # Compilar TypeScript + Vite (requiere terser)
npm run lint          # Revisar código con ESLint
npx tsc --noEmit      # Solo verificar tipos (más rápido que full build)
npm test              # Ejecutar pruebas con Vitest
npm run test:coverage # Vitest con cobertura de código
```

### Infraestructura
```bash
# Iniciar solo BD + Redis (recomendado para desarrollo local sin Docker completo)
docker-compose up -d postgres redis

# Stack completo con Docker
docker-compose up -d
docker-compose exec backend npm run migrate:up
```

**Sin Docker:** Configura `DB_HOST=localhost` en `backend/.env` y ejecuta PostgreSQL 14+ localmente.
- Usuario: `postgres`
- Contraseña: `postgres_dev_password`
- Base de datos: `norma3100`

## 🏗️ Arquitectura

### Backend — `backend/src/`

**Patrón:** Ruta → Servicio → Pool (pg). Las rutas solo manejan HTTP; toda la lógica de negocio está en Services.

- `index.ts` — Punto de entrada de Express. Registra routers, middleware, Pool de PostgreSQL, EventStore.
- `routes/` — Un archivo por dominio. Cada uno exporta una factory `createXxxRouter(pool, eventStore)`.
- `services/` — Clases con lógica de negocio (ej: `AssessmentService`, `QuestionnaireService`). Aquí NO hay `req`/`res`.
- `middleware/` — `auth.middleware.ts` (verifica JWT), `role.middleware.ts` (RBAC), `rate-limit.middleware.ts`, `sanitize.middleware.ts`.
- `modules/events/` — Event sourcing: `EventStore` (solo añade), `EventReplay`, `EventPublisher`. Todos los cambios de cumplimiento emiten eventos con cadena hash para detectar alteraciones.
- `modules/cache/` — `CacheManager` que envuelve Redis.

**Archivos de esquema BD** (se aplican en orden con `migrate:up`):
1. `db/schema.sql` — Tablas core (prestadores, sedes, servicios, usuarios, roles, eventos, audit_logs)
2. `db/evaluation-schema.sql` — `evaluation_standards` (7 transversales cargados aquí), `evaluation_criteria`, cuestionarios, respuestas
3. `db/schema-phase3.sql` — `assessments`, `assessment_responses_detailed`, `assessment_metrics`, `assessment_events`. También carga los 157 servicios de salud.
4. `db/findings-workflow-schema.sql`, `db/assessment-execution-schema.sql`, `db/documents-schema.sql`
5. `db/migrations/` — Migraciones de features (notificaciones, scoring de riesgo, INVIMA, etc.)
6. `db/seeds/criteria.sql` — 87 criterios transversales (TSTH×21, TSINF×15, TSDOT×12, TSMD×10, TSPP×13, TSHCR×11, TSINT×5)

### Frontend — `frontend/src/`

**Patrón:** Las páginas traen datos vía `services/api.ts` → pasan datos a Componentes. Estado manejado con React Context (Auth, Prestador, Tema).

- `services/api.ts` — **Fuente única de verdad para llamadas API.** Helper tipado `request<T>()` que inyecta JWT automáticamente. Todas las APIs exportadas: `authApi`, `assessmentsApi`, `questionnairesApi`, `servicesApi`, `findingsApi`, `documentsApi`, `reportsApi`, etc.
- `context/` — `AuthContext` (JWT + localStorage, incluye `loginWithMock` para dev sin BD), `ProviderContext` (prestador seleccionado), `ThemeContext`.
- `pages/` — Componentes de nivel de ruta. Cada uno recibe `providerId` como prop desde `App.tsx`.
- `components/` — Componentes de feature agrupados por dominio (`Assessment/`, `Compliance/`, `Findings/`, `Notifications/`, etc.).
- `hooks/` — `useRolePermission` (verificaciones RBAC en UI), `useNotifications`.

**Enrutamiento** (`App.tsx`): React Router v6. Las rutas protegidas requieren roles `super_admin | auditor | provider_admin`. La ruta `/assessments/:id` renderiza `AssessmentExecutionPage`.

**Proxy Vite:** Las peticiones a `/api` y `/auth` se proxean a `http://localhost:3001` en desarrollo — no requiere configuración CORS.

**Alias de rutas:** `@`, `@components`, `@pages`, `@hooks`, `@services`, `@types`, `@styles` se resuelven todos a `src/`.

### Flujo de ejecución de evaluaciones

1. `POST /api/assessments` — crea una evaluación, carga automáticamente el cuestionario publicado para el servicio+versión
2. `GET /api/questions/:questionnaireId` — retorna array plano de `criterios[]` con `standard_id`, `standard_name`, `is_transversal`
3. Frontend agrupa criterios por `standard_id` (código derivado del prefijo, ej: `TSTH-001` → `TSTH`)
4. `PUT /api/assessments/:id` — guarda lote de respuestas, recalcula % de cumplimiento y semáforo en tiempo real
5. `POST /api/assessments/:id/submit` — bloquea la evaluación, genera automáticamente `hallazgos` para criterios NC

### Control de Acceso por Rol (RBAC)

Tres roles aplicados en middleware del backend (`role.middleware.ts`) y frontend (`useRolePermission`):
- `provider_admin` — solo lectura/escritura de su prestador
- `auditor` — lectura de todos los prestadores, puede escribir hallazgos y acciones
- `super_admin` — acceso total

### Conceptos clave del dominio

- **Semáforo:** verde ≥80%, naranja 50–79%, rojo <50% cumplimiento
- **Severidad de hallazgo:** crítica / alta / media / baja (asignada automáticamente según peso del criterio NC)
- **Versiones de evaluación:** `initial` | `year4` | `annual` | `pre-novelty`
- **Cadena hash de eventos:** cada evento en la tabla `events` almacena `previous_event_hash` + `event_hash` (SHA-256) para garantizar integridad

## 💻 Desarrollo local sin Docker

La página de login incluye `loginWithMock` — ingresa cualquier email + selecciona un rol para saltarse la autenticación JWT. Las listas de servicios se repletan con 8 servicios de ejemplo cuando la BD no es alcanzable. Las evaluaciones y datos de cumplimiento requieren una BD activa.

---

## 🐳 Desarrollo con Docker

### Requisitos
- Docker Desktop instalado y corriendo
- 4GB RAM disponible (recomendado 8GB)

### Stack completo en Docker

**4 servicios orquestados por docker-compose:**
1. **PostgreSQL 14** — BD principal (puerto 5432)
2. **Redis 7** — Caché y sesiones (puerto 6379)
3. **Backend** — Express + TypeScript (puerto 3001, hot-reload con `tsx watch`)
4. **Frontend** — React + Vite (puerto 5173, hot-reload con HMR)

### Configuración necesaria

#### `backend/.env` (para Docker)
```env
DB_HOST=postgres          # ← Service name, NOT localhost
DB_PORT=5432
DB_NAME=norma3100
DB_USER=postgres
DB_PASSWORD=postgres_dev_password

REDIS_URL=redis://redis:6379  # ← Service name, NOT localhost
PORT=3001

CORS_ORIGIN=http://localhost:5173
JWT_SECRET=dev_jwt_secret_change_in_production_min_32_chars!!!!
# ... resto de variables
```

**⚠️ Nota crítica:** Dentro de un contenedor Docker, `localhost` hace referencia al contenedor mismo, no al host. Usa los nombres de servicio del docker-compose: `postgres`, `redis`, `backend`, `frontend`.

#### `docker-compose.yml` (ya configurado)
Las siguientes líneas son críticas:
- Backend servicio debe tener `PORT=3001` en `environment`
- Backend y Frontend montados con volúmenes para hot-reload en desarrollo
- Healthchecks en todos los servicios para esperar a que arranquen antes de conectar
- Network `norma-network` bridge para comunicación inter-contenedor

### Levantar el stack

```bash
# Inicia los 4 servicios en background
docker-compose up -d

# Espera a que todos alcancen "healthy" (30-60 seg)
docker-compose ps

# Ejecutar migraciones y cargar esquema
docker-compose exec backend npm run migrate:up
```

### Acceder a la aplicación

| Servicio | URL | Health |
|----------|-----|--------|
| **Frontend** | http://localhost:5173 | GET `/` |
| **Backend API** | http://localhost:3001/api | GET `/health` |
| **PostgreSQL** | localhost:5432 | psql user: `postgres` |
| **Redis** | localhost:6379 | `redis-cli ping` |

### Comandos útiles

```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico (últimas 30 líneas)
docker-compose logs backend --tail=30
docker-compose logs frontend --tail=30

# Ejecutar comando dentro de un contenedor
docker-compose exec backend npm run seed
docker-compose exec backend npm run migrate:up
docker-compose exec backend npm run lint

# Detener todo
docker-compose down

# Detener y eliminar volúmenes de BD (reset total)
docker-compose down -v

# Rebuildar imágenes (después de cambiar Dockerfile o package.json)
docker-compose up -d --build

# Entrar a la shell del backend
docker-compose exec backend sh

# Acceder a PostgreSQL dentro del contenedor
docker-compose exec postgres psql -U postgres -d norma3100
```

### Desarrollo con hot-reload

**Backend:** El código en `backend/src/` está montado como volumen. Cambios se detectan automáticamente con `tsx watch`:
```bash
docker-compose logs backend --tail=5
# Verás: "[tsx] restarting due to changes..." cuando guardas un archivo
```

**Frontend:** Vite hace HMR automáticamente. Los cambios en `frontend/src/` se reflejan en el navegador sin rebuild.

### Troubleshooting

**Error: "Cannot connect to Docker daemon"**
→ Docker Desktop no está corriendo. Ábrelo.

**Error: "Container exited with code 1"**
→ Mira los logs: `docker-compose logs backend`

**Error: "database "norma3100" does not exist"**
→ Las migraciones no corrieron. Ejecuta: `docker-compose exec backend npm run migrate:up`

**Error: "Port 5173 already in use"**
→ Detén el proceso en ese puerto o cambia el puerto en `docker-compose.yml` línea 49.

**Cambios en package.json no se aplicaron**
→ Rebuild: `docker-compose down && docker-compose up -d --build`

**BD datos obsoletos**
→ Reset total: `docker-compose down -v && docker-compose up -d && docker-compose exec backend npm run migrate:up`

---

## 📁 Estructura del proyecto

```
Proyecto Norma 3100/
├── backend/                          # Express + TypeScript + PostgreSQL
│   ├── src/
│   │   ├── index.ts                  # Entry point, registra routers y middleware
│   │   ├── routes/                   # Solo HTTP (req → service → res)
│   │   ├── services/                 # Lógica de negocio (sin req/res)
│   │   ├── middleware/               # Auth, RBAC, rate-limit, sanitize
│   │   ├── modules/
│   │   │   ├── events/               # Event sourcing + hash-chain
│   │   │   └── cache/                # Redis (sesiones, caché)
│   │   └── utils/                    # Logger, helpers
│   └── db/
│       ├── schema.sql                # Tablas base
│       ├── evaluation-schema.sql     # 7 estándares + criterios
│       ├── schema-phase3.sql         # Evaluaciones + 157 servicios
│       ├── migrations/               # Migraciones incrementales
│       └── seeds/                    # 87 criterios transversales
│
├── frontend/                         # React + Vite + TypeScript
│   └── src/
│       ├── services/api.ts           # Cliente HTTP (fuente única)
│       ├── context/                  # Auth, Provider, Theme
│       ├── pages/                    # Componentes de ruta
│       ├── components/               # UI por dominio
│       ├── hooks/                    # useRolePermission, etc.
│       └── index.css                 # Estilos globales
│
└── docker-compose.yml                # Servicios: postgres, redis, backend, frontend
```

## 🎯 Convenciones del proyecto

- **Código:** inglés · **Comentarios:** español · **Commits:** inglés
- **Commits:** `type(scope): description` — modo imperativo, máx 72 caracteres
  - Ejemplo: `feat(assessments): agregar cálculo de semáforo` → `feat(assessments): add traffic light calculation`
- **Texto visible al usuario:** español colombiano (es-CO)
- **Separación estricta:**
  - Rutas: solo HTTP, SIN lógica de negocio
  - Servicios: lógica de negocio, SIN req/res
  - BD: acceso vía Pool de PostgreSQL
- **Archivos protegidos:** `.env`, `docker-compose.yml`

---

## 🚀 Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 18 + Vite + TypeScript |
| **Backend** | Node.js + Express + TypeScript |
| **BD** | PostgreSQL 14+ (cliente `pg`) |
| **Caché** | Redis 7 |
| **Autenticación** | JWT + bcryptjs |
| **Testing** | Jest (backend), Vitest (frontend) |
| **Infra** | Docker Compose + GitHub Actions |
| **Dev** | `tsx watch` (backend) + `vite dev` con proxy a `:3001` |

---

## 📊 Cómo funciona la evaluación de cumplimiento

```
┌─────────────────────────────────────────────────────────┐
│  PRESTADOR DE SALUD (Hospital, Clínica, etc.)          │
└─────────────────────────────────────────────────────────┘
                           ↓
        ┌──────────────────────────────────┐
        │  ELIGE SERVICIO + VERSIÓN        │
        │  (ej: Consultoría, Urgencias)    │
        └──────────────────────────────────┘
                           ↓
        ┌──────────────────────────────────────────────────┐
        │  EVALUACIÓN AUTOMÁTICA DE:                       │
        │  ✓ 87 criterios transversales (todos los 7 TS)  │
        │  ✓ + N criterios específicos del servicio       │
        └──────────────────────────────────────────────────┘
                           ↓
        ┌──────────────────────────────────────────────┐
        │  RESPONDER CUESTIONARIO (SI/NO + evidencia)  │
        └──────────────────────────────────────────────┘
                           ↓
        ┌───────────────────────────────────────────────────┐
        │  SISTEMA CALCULA EN TIEMPO REAL:                 │
        │  • % Cumplimiento por estándar                   │
        │  • Semáforo: 🟢 Verde (≥80%) | 🟡 Naranja (50-79%) | 🔴 Rojo (<50%)
        │  • Hallazgos: inconformidades + oportunidades    │
        │  • Severidad: crítica / alta / media / baja      │
        └───────────────────────────────────────────────────┘
                           ↓
        ┌──────────────────────────────────────────────┐
        │  AUDITOR REVISA Y VALIDA HALLAZGOS          │
        │  (Solo super_admin y auditor)                │
        └──────────────────────────────────────────────┘
                           ↓
        ┌──────────────────────────────────────────────┐
        │  PLAN DE ACCIÓN PARA MEJORAR CUMPLIMIENTO   │
        │  (El prestador responde + pruebas)          │
        └──────────────────────────────────────────────┘
```

### Ejemplo práctico: Criterio TSTH-001

**Criterio:** "El prestador debe contar con una política escrita de selección de personal"

- **Respuesta del prestador:** SÍ → Adjunta política de selección (PDF)
- **Sistema evalúa:** ¿Existe evidencia?
  - SI → ✓ CONFORME
  - NO → ✗ NO CONFORME → Genera hallazgo "crítico"
- **Auditor:** Revisa evidencia, valida, escribe observaciones
- **Plan de mejora:** Prestador propone acciones correctivas con fechas

---

## 🔐 Flujo de seguridad e integridad

**Evento sourcing con cadena hash:**

Cada cambio importante (respuesta, hallazgo, validación) genera un evento:

```sql
INSERT INTO events (
  event_id,
  event_type,          -- 'assessment_started', 'response_submitted', etc.
  entity_id,           -- assessment ID
  data,                -- JSON con detalles
  previous_event_hash, -- SHA-256 del evento anterior
  event_hash           -- SHA-256 de este evento
) VALUES (...)
```

**Beneficio:** Imposible alterar registros sin romper la cadena. Auditoría completa + tamper detection automático.

---

## 💡 Conceptos importantes para el desarrollo

### Inconformidad (NC) vs. Conformidad (C)

- **C (Conforme):** El prestador cumple el criterio → ✓ semáforo
- **NC (No Conforme):** Le falta evidencia o no cumple → hallazgo → plan de acción

### Cuestionario vs. Evaluación

| Aspecto | Cuestionario | Evaluación |
|---------|-------------|-----------|
| **Qué es** | Template con criterios (reutilizable) | Instancia completada por un prestador |
| **Ciclo de vida** | Creado por auditor, publicado, versionado | Inicia, se responde, se cierra |
| **Datos** | Criterios estáticos | Respuestas dinámicas + hallazgos |

### Rol del Auditor vs. Prestador

| Rol | Permisos | Acciones |
|-----|---------|---------|
| **provider_admin** | Su prestador | Ver evaluaciones, responder cuestionarios |
| **auditor** | Todos los prestadores | Ver todo, validar hallazgos, escribir acciones |
| **super_admin** | Todos | Crear cuestionarios, gestionar usuarios |

---

## 🎓 Primeros pasos para entender el código

1. **Lee el flujo:** Revisa `backend/src/routes/assessments.ts` → verás las 5 operaciones principales
2. **Entiende el modelo:** `backend/src/services/AssessmentService.ts` tiene la lógica de cálculo
3. **Ve la UI:** `frontend/src/pages/AssessmentExecutionPage.tsx` → cómo se renderiza
4. **Prueba localmente:** `docker-compose up -d postgres redis` + `npm run dev` en ambas carpetas
5. **Consulta datos:** Abre pgAdmin en `http://localhost:5050` (usuario: `admin@pgadmin.org`, contraseña: `admin`)

---

## ✅ Checklist antes de hacer commits

- [ ] Código en inglés, comentarios en español
- [ ] Commit message: `type(scope): description` (inglés)
- [ ] `npm run lint` → sin errores
- [ ] `npx tsc --noEmit` (frontend) → sin errores de tipo
- [ ] Pruebas corren sin fallar
- [ ] Cambios respetan separación: rutas ≠ servicios ≠ BD
- [ ] Texto visible al usuario en español colombiano (es-CO)
