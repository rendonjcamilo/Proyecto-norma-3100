# Sistema de Gestión de Cumplimiento - Norma 3100 de 2019

**Plataforma de gestión integral de cumplimiento normativo para prestadores de servicios de salud en Colombia**

---

## 📋 Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Características Principales](#características-principales)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Requisitos Previos](#requisitos-previos)
5. [Inicio Rápido](#inicio-rápido)
6. [Módulos y Funcionalidades](#módulos-y-funcionalidades)
7. [Arquitectura Técnica](#arquitectura-técnica)
8. [Flujos de Trabajo](#flujos-de-trabajo)
9. [Guía de Desarrollo](#guía-de-desarrollo)
10. [Estado del Proyecto](#estado-del-proyecto)

---

## Descripción General

El **Sistema de Gestión de Cumplimiento Norma 3100** es una plataforma digital que automatiza el proceso de evaluación, seguimiento y demostración de cumplimiento de la Resolución 3100 de 2019 del Ministerio de Salud y Protección Social de Colombia.

### ¿Por qué Norma 3100?

La Norma 3100 establece procedimientos y condiciones para la inscripción de prestadores de servicios de salud en el Registro Especial de Prestadores (REPS). Define tres condiciones de habilitación:

- **Capacidad técnico-administrativa**
- **Suficiencia patrimonial y financiera**
- **Capacidad tecnológica y científica**

Estas se operacionalizan a través de:
- **7 estándares transversales** (aplicables a todos los servicios)
- **157 servicios habilitables** (categorizados en 5 grupos según complejidad)
- **Estándares específicos** por cada servicio

---

## Características Principales

### 1. **Gestión de Prestadores** (Módulo 1)
- Registro y mantenimiento de datos maestros del prestador
- Gestión de múltiples sedes/ubicaciones
- Clasificación por tipo (IPS pública, privada, mixta) y complejidad (I, II, III, IV)
- Seguimiento de estado (activa, suspendida, revocada)
- Importación masiva desde REPS

### 2. **Catálogo de Servicios** (Módulo 2)
- 157 servicios organizados en 5 grupos:
  - Consulta Externa (33 servicios)
  - Apoyo Diagnóstico (28 servicios)
  - Internación (34 servicios)
  - Quirúrgico (38 servicios)
  - Atención Inmediata (24 servicios)
- Asignación de servicios por prestador y sede
- Tracking de disponibilidad y complejidad

### 3. **Autoevaluación** (Módulo 3)
- Cuestionarios estructurados por servicio
- 7 estándares transversales + específicos por cada servicio
- Estados: Cumple (C), No Cumple (NC), No Aplica (NA)
- Cálculo automático de % cumplimiento por estándar
- Semáforo de cumplimiento:
  - 🟢 Verde: ≥80% cumplimiento
  - 🟡 Naranja: 50-79% cumplimiento
  - 🔴 Rojo: <50% cumplimiento
- Versionamiento (inicial, año 4, anual, pre-novedades)

### 4. **Hallazgos y Acciones Correctivas** (Módulo 4)
- Generación automática de hallazgos desde criterios no cumplidos
- Clasificación por severidad: Crítica, Alta, Media, Baja
- Asignación de acciones correctivas con responsable y plazo
- Estado de acciones: Abierta → En Progreso → Cerrada
- Seguimiento de avances con hasta 6 pasos por acción
- Carga de evidencias (documentos, fotos, enlaces)
- Alertas de escalamiento: -7d, -3d, vencido, +3d, +7d

### 5. **Matriz Documental** (Módulo 5)
- 108 documentos exigidos por norma
- Seguimiento de entrega y validación
- Vinculación con criterios de cumplimiento

### 6. **Integración REPS/INVIMA** (Módulo 6)
- Consulta de servicios habilitados en REPS
- Extracción automática de registros sanitarios INVIMA
- Sincronización de datos de prestadores
- Reporte de discrepancias

### 7. **Auditoría y Trazabilidad** (Módulo 7)
- Almacenamiento de eventos inmutable (Event Sourcing)
- Bitácora completa de cambios
- Quién, cuándo, qué se modificó
- Imposible borrar o alterar registros históricos

### 8. **Reportes y Dashboards** (Módulo 8)
- Dashboard de cumplimiento por prestador
- Gráficos de tendencia de % cumplimiento
- Reporte de hallazgos pendientes
- Matriz de riesgo (severidad × urgencia)
- Exportación en PDF y Word

### 9. **Gestión de Usuarios** (Módulo 9)
- Autenticación con JWT y bcrypt
- Roles: admin_prestador, auditor, super_admin
- Control de acceso granular (RBAC)
- Recuperación de contraseña por correo
- Historial de login y auditoría

### 10. **Seguridad y Arquitectura** (Módulo 10)
- Docker multi-contenedor (backend, frontend, PostgreSQL, Redis)
- Encriptación TLS 1.3
- Encriptación AES-256 en reposo (planeado)
- JWT con refresh tokens
- Control de sesiones (máx 3 concurrentes)

---

## Estructura del Proyecto

```
Proyecto Norma 3100/
│
├── 📁 backend/                    # API Node.js/Express
│   ├── src/
│   │   ├── modules/              # Módulos funcionales
│   │   │   ├── providers/         # Gestión de prestadores
│   │   │   ├── assessments/       # Autoevaluación
│   │   │   ├── findings/          # Hallazgos y acciones
│   │   │   ├── services/          # Catálogo de servicios
│   │   │   ├── users/             # Usuarios y roles
│   │   │   ├── events/            # Event sourcing
│   │   │   └── reports/           # Reportes
│   │   ├── routes/                # Definición de endpoints REST
│   │   ├── middleware/            # Auth, RBAC, error handling
│   │   ├── services/              # Servicios de negocio (JWT, bcrypt, RBAC)
│   │   ├── utils/                 # Logger, helpers
│   │   ├── types/                 # Tipos TypeScript
│   │   ├── config/                # Configuración
│   │   └── index.ts               # Punto de entrada
│   │
│   ├── db/
│   │   ├── schema.sql             # Esquema base de datos
│   │   ├── schema-phase3.sql      # Tablas Phase 3
│   │   ├── migrations.ts          # Framework de migraciones
│   │   ├── init.sql               # Inicialización
│   │   └── seeds/                 # Datos iniciales (157 servicios, roles, etc.)
│   │
│   ├── Dockerfile                 # Imagen Docker backend
│   ├── package.json              # Dependencias Node
│   └── tsconfig.json             # Configuración TypeScript
│
├── 📁 frontend/                   # UI React/Vite
│   ├── src/
│   │   ├── components/           # Componentes React reutilizables
│   │   │   ├── Auth/             # Login, registro, recuperación
│   │   │   ├── Provider/         # Gestión de prestadores
│   │   │   ├── Assessment/       # Cuestionarios y ejecución
│   │   │   ├── Findings/         # Hallazgos y acciones
│   │   │   ├── Dashboard/        # Dashboards
│   │   │   └── Common/           # Componentes comunes
│   │   ├── pages/                # Páginas principales
│   │   ├── hooks/                # Custom hooks
│   │   ├── contexts/             # Zustand stores (estado global)
│   │   ├── services/             # Cliente HTTP (axios)
│   │   ├── types/                # Tipos TypeScript
│   │   ├── styles/               # CSS/SCSS globales
│   │   ├── i18n/                 # Internacionalización (español)
│   │   ├── App.tsx               # Componente raíz
│   │   └── main.tsx              # Punto de entrada
│   │
│   ├── public/                   # Activos estáticos
│   ├── index.html                # HTML base
│   ├── vite.config.ts            # Configuración Vite
│   ├── package.json              # Dependencias Node
│   └── tsconfig.json             # Configuración TypeScript
│
├── 📁 docs/                       # Documentación
│   ├── ARCHITECTURE.md            # Arquitectura del sistema
│   ├── API.md                     # Especificación de endpoints
│   ├── DATABASE.md                # Esquema de base de datos
│   ├── TROUBLESHOOTING.md         # Solución de problemas
│   └── ENV_VARIABLES.md           # Variables de entorno
│
├── 📁 .planning/                  # Documentos de planificación GSD
│   ├── PROJECT.md                 # Descripción del proyecto
│   ├── REQUIREMENTS.md            # Especificación de requerimientos
│   ├── ROADMAP.md                 # Plan de fases (6 fases, 16 semanas)
│   ├── 1/                         # Phase 1 (Infraestructura)
│   ├── 2/                         # Phase 2 (Autenticación)
│   ├── 3/                         # Phase 3 (Flujos de cumplimiento)
│   └── ...
│
├── 📁 .github/                    # GitHub Actions CI/CD
│   └── workflows/
│       ├── lint.yml               # ESLint y TypeScript check
│       ├── test.yml               # Pruebas unitarias
│       └── docker-build.yml       # Construcción de imágenes
│
├── 📄 docker-compose.yml          # Orquestación multi-contenedor
├── 📄 Dockerfile.backend          # Imagen Docker backend
├── 📄 redis.conf                  # Configuración Redis
├── 📄 .env.example                # Plantilla de variables de entorno
├── 📄 .gitignore                  # Archivos ignorados por Git
├── 📄 README.md                   # Este archivo (en inglés)
├── 📄 PROYECTO_ES.md              # Documentación completa en español
├── 📄 QUICKSTART.md               # Guía rápida de inicio
├── 📄 CONTRIBUTING.md             # Guía de contribución
└── 📄 LICENSE                     # MIT License
```

---

## Requisitos Previos

### Mínimo Recomendado

- **Docker** 20.10+ y **Docker Compose** 3.9+
- **Git** 2.30+
- **Node.js** 18+ (para desarrollo sin Docker)
- **PostgreSQL** 14+ (si ejecutas sin Docker)
- **Redis** 7+ (si ejecutas sin Docker)

### Sistema Operativo

- ✅ Linux (Ubuntu 20.04+)
- ✅ macOS (12.0+)
- ✅ Windows 10/11 (con Docker Desktop)

---

## Inicio Rápido

### Con Docker (Recomendado - 10 minutos)

```bash
# 1. Clonar repositorio
git clone <url-repositorio>
cd Proyecto\ Norma\ 3100

# 2. Iniciar todos los servicios
docker-compose up -d

# 3. Esperar a que los servicios estén saludables
docker-compose ps
# Esperar hasta que todos muestren STATUS "healthy"

# 4. Inicializar base de datos
docker-compose exec backend npm run migrate:up

# 5. Acceder a la aplicación
# Frontend: http://localhost:5173
# Backend API: http://localhost:3001
# Documentación API: http://localhost:3001/api/docs
```

### Verificar Instalación

```bash
# Verificar servicios
docker-compose ps

# Probar API
curl http://localhost:3001/health
# Debe retornar: {"status":"healthy",...}

# Probar conexión a base de datos
docker-compose exec postgres psql -U postgres -d norma3100 -c "SELECT COUNT(*) FROM providers;"

# Probar Redis
docker-compose exec redis redis-cli PING
# Debe retornar: PONG
```

### Sin Docker (Desarrollo Local)

```bash
# Backend
cd backend
npm install
npm run migrate:up
npm run dev        # Inicia en :3001

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev        # Inicia en :5173
```

---

## Módulos y Funcionalidades

### Fase 1: Infraestructura ✅ COMPLETADA (40h)

**Estado:** Producción lista

- ✅ Docker Compose (4 servicios: backend, frontend, PostgreSQL, Redis)
- ✅ Esquema PostgreSQL con event sourcing
- ✅ Estructura de proyecto Node/Express/React
- ✅ Configuración TypeScript, ESLint, Prettier
- ✅ GitHub Actions (lint, test, build)
- ✅ Documentación (README, QUICKSTART, CONTRIBUTING)

**Endpoints:**
```
GET  /health                  # Estado de salud del servicio
GET  /api                     # Estado de API
```

### Fase 2: Autenticación y Usuarios ✅ PARCIALMENTE COMPLETADA (35h)

**Estado:** Backend listo, Frontend pendiente

**Backend completado:**
- ✅ JWT (HS256, 1h acceso, 14d refresh)
- ✅ Bcrypt (cost factor 13, 250-500ms)
- ✅ Registro de usuarios con validación de email
- ✅ Login con protección anti-fuerza bruta
- ✅ Recuperación de contraseña por email
- ✅ RBAC con 3 roles: admin_prestador, auditor, super_admin
- ✅ Sesiones en Redis (máx 3 concurrentes)
- ✅ Auditoría de logins e intentos fallidos

**Endpoints:**
```
POST   /auth/register                 # Registro de nuevo usuario
POST   /auth/login                    # Login
POST   /auth/refresh                  # Renovar token
POST   /auth/logout                   # Logout
POST   /auth/forgot-password          # Solicitar recuperación
POST   /auth/reset-password           # Restablecer contraseña
GET    /auth/verify                   # Verificar token actual
```

**Frontend pendiente:**
- ⏳ Login UI (React, 100% español)
- ⏳ Registro UI
- ⏳ Recuperación de contraseña UI
- ⏳ Dashboard de administración de usuarios

### Fase 3: Flujos de Cumplimiento 🔄 EN PROGRESO (70h)

**Estado:** Backend Tasks 1-2 completadas (16h)

**Funcionalidades completadas:**
- ✅ Modelo de Prestador con múltiples sedes
- ✅ CRUD de prestadores
- ✅ Transiciones de estado (activa → suspendida → revocada)
- ✅ Importación masiva desde REPS
- ✅ Esquema de autoevaluación, hallazgos, acciones

**Funcionalidades pendientes:**
- ⏳ Catálogo de servicios (157 servicios pre-cargados)
- ⏳ Asignación de servicios por prestador/sede
- ⏳ Constructor de cuestionarios
- ⏳ Motor de ejecución de autoevaluación
- ⏳ Cálculo automático de % cumplimiento
- ⏳ Creación automática de hallazgos
- ⏳ Workflow de acciones correctivas (estado machine)
- ⏳ Dashboards y reportes

**Endpoints (parciales):**
```
# Prestadores
GET    /api/providers                          # Listar prestadores
POST   /api/providers                          # Crear prestador
GET    /api/providers/:id                      # Obtener prestador
PUT    /api/providers/:id                      # Actualizar prestador
DELETE /api/providers/:id                      # Eliminar prestador (soft delete)

# Sedes
POST   /api/providers/:id/locations           # Crear sede
GET    /api/providers/:id/locations           # Listar sedes
PUT    /api/providers/:id/locations/:locId    # Actualizar sede
DELETE /api/providers/:id/locations/:locId    # Eliminar sede

# Auditoría de eventos
GET    /api/events/:aggregateId                # Historial de cambios
```

### Fases 4-6: Futuras (Planeado)

- **Fase 4:** Integración REPS/INVIMA (50h)
- **Fase 5:** Auditoría avanzada y reportes (45h)
- **Fase 6:** Despliegue y seguridad (30h)

---

## Arquitectura Técnica

### Stack Tecnológico

| Capa | Tecnología | Versión | Propósito |
|------|-----------|---------|----------|
| **Frontend** | React + Vite | 18 / 5.0 | UI interactiva, SPA |
| **Estado Frontend** | Zustand | 4.4 | Gestión de estado global |
| **HTTP Client** | Axios | 1.6 | Comunicación con API |
| **Backend** | Node.js + Express | 18+ / 4.18 | Servidor API REST |
| **Lenguaje** | TypeScript | 5.3 | Type safety |
| **Base de Datos** | PostgreSQL | 14 | Almacenamiento relacional |
| **Cache/Sesiones** | Redis | 7 | Caché, sesiones, real-time |
| **Autenticación** | JWT + Bcrypt | jsonwebtoken 9.0 / bcrypt 5.1 | Auth segura |
| **Validación** | Joi/Zod | Depende | Validación de datos |
| **Logging** | Pino | 8.17 | Logs estructurados |
| **Testing** | Jest + Vitest | 29 / 1.0 | Pruebas unitarias e integración |
| **Contenedores** | Docker + Compose | 20+ / 3.9 | Orquestación |
| **CI/CD** | GitHub Actions | - | Pipeline de despliegue |
| **Linting** | ESLint + Prettier | 8.56 / 3.1 | Code quality |

### Event Sourcing (Almacenamiento de Eventos)

Todo cambio de estado en cumplimiento se registra como evento inmutable:

```
┌─────────────────────────────────────────────────────────┐
│ Tabla: events (Event Store)                             │
├─────────────────────────────────────────────────────────┤
│ id (UUID)                                               │
│ aggregate_id (e.g., provider_id)                        │
│ aggregate_type (e.g., 'Provider', 'Finding')            │
│ event_type (e.g., 'ProviderCreated', 'FindingOpened')   │
│ data (JSON del evento)                                  │
│ timestamp (cuándo ocurrió)                              │
│ user_id (quién lo causó)                                │
│ hash (para integridad: hash del evento anterior + este) │
└─────────────────────────────────────────────────────────┘

Flujo:
  Evento 1: {"type":"ProviderCreated", "id":"prov-123",...}
  Evento 2: {"type":"LocationAdded", "id":"prov-123",...}
  Evento 3: {"type":"ServiceAssigned", "id":"prov-123",...}
  
  El estado actual = Replay de todos los eventos en orden
  No se puede borrar ni modificar eventos históricos (inmutable)
```

### RBAC (Control de Acceso por Rol)

```
┌────────────────────────────────────────────────────────┐
│ Tres Roles Principales                                 │
├────────────────────────────────────────────────────────┤
│ 1. ADMIN_PRESTADOR                                     │
│    - Gestiona solo su prestador y sedes                │
│    - Ejecuta autoevaluaciones propias                  │
│    - Ve hallazgos de su prestador                      │
│    - Crea acciones correctivas propias                 │
│    - NO puede ver otros prestadores                    │
│                                                        │
│ 2. AUDITOR                                             │
│    - Acceso de LECTURA a todos los prestadores        │
│    - Revisa hallazgos y acciones                       │
│    - NO puede crear/modificar datos                    │
│    - Genera reportes                                   │
│                                                        │
│ 3. SUPER_ADMIN                                         │
│    - Acceso total a todo                               │
│    - Administra usuarios                               │
│    - Acceso a auditoría de sistema                     │
│    - Configuración global                              │
└────────────────────────────────────────────────────────┘
```

### Seguridad

```
🔒 Autenticación:
   - JWT con HS256 (token de acceso de 1 hora)
   - Refresh token de 14 días (single-use, rotating)
   - Bcrypt para contraseñas (cost factor 13)
   - Recuperación por email con tokens de 1 hora

🔐 Comunicación:
   - TLS 1.3 en producción (Let's Encrypt)
   - HTTPS obligatorio
   - Certificados auto-renovables

📝 Auditoría:
   - Event sourcing para todas las acciones
   - Bitácora inmutable de cambios
   - Quién, cuándo, qué se modificó
   - No se pueden borrar registros históricos

🛡️ Datos:
   - Contraseñas: never logged, never exposed
   - Tokens: refresh_token en HttpOnly cookie
   - Access_token en memoria (cleared on logout)
   - Encriptación AES-256 en reposo (planeado)

🚫 Protecciones:
   - Rate limiting (login: 5 intentos → 30 min lock)
   - CSRF tokens en formularios
   - Input validation (client + server)
   - SQL parameterized queries
   - No account enumeration
```

---

## Flujos de Trabajo

### 1. Flujo de Autoevaluación

```
ADMIN_PRESTADOR:

1. Acceder a Autoevaluación
   ↓
2. Seleccionar servicio y período (inicial, año 4, anual, pre-novedad)
   ↓
3. Ver cuestionario con:
   - 7 estándares transversales
   - Estándares específicos del servicio (variable por servicio)
   - Total de ~40-80 criterios por servicio
   ↓
4. Para cada criterio, marcar:
   - ✅ Cumple (C): Cumplimos totalmente
   - ❌ No Cumple (NC): Falta implementar
   - ⊘ No Aplica (NA): No relevante para nosotros
   ↓
5. Si marcar NC, capturar hallazgo:
   - Descripción del incumplimiento
   - Causa raíz (opcional)
   - Evidencia (opcional)
   ↓
6. Al terminar:
   - % cumplimiento = (C / (C + NC)) × 100
   - Semáforo: Verde ≥80%, Naranja 50-79%, Rojo <50%
   - Reportar automáticamente hallazgos
   ↓
7. Guardar autoevaluación con versión
```

### 2. Flujo de Hallazgos → Acciones Correctivas

```
ADMIN_PRESTADOR:

1. Ver hallazgos generados de autoevaluación
   ↓
2. Para cada hallazgo NC:
   - Revisar descripción y contexto
   - Asignar severidad: Crítica, Alta, Media, Baja
   - Asignar riesgo: 0-100 (auto-calculado por sistema)
   ↓
3. Crear acción correctiva:
   - Título: "Implementar política de..."
   - Descripción: Qué se va a hacer
   - Responsable: Nombre de quien lo hará
   - Plazo: Fecha límite (con alertas automáticas)
   - Prioridad: Alta, Media, Baja
   ↓
4. Estado de acción: Abierta → En Progreso → Cerrada
   ↓
5. Seguimiento (hasta 6 pasos):
   - Paso 1: Reunión de análisis causas (30%)
   - Paso 2: Diseño de solución (40%)
   - Paso 3: Implementación (70%)
   - Paso 4: Capacitación (85%)
   - Paso 5: Validación (95%)
   - Paso 6: Cierre con evidencia (100%)
   ↓
6. Subir evidencias para cada paso
   ↓
7. Cerrar acción cuando 100% completada
   ↓
8. Auditor revisa y cierra formalmente

AUDITOR:
- Ver todas las acciones de todos los prestadores
- Revisar evidencias
- Aprobar cierres
- Generar reporte de estado
```

### 3. Flujo de Reportería

```
AUDITOR:

1. Acceder a Reportes
   ↓
2. Seleccionar:
   - Prestador(es)
   - Período (mes, trimestre, año)
   - Tipo de reporte
   ↓
3. Genera automáticamente:
   - Resumen de cumplimiento general (%)
   - Cumplimiento por estándar (C/NC/NA)
   - Hallazgos abiertos vs cerrados
   - Acciones vencidas y próximas
   - Matriz de riesgo (gráfico)
   - Lista de documentos pendientes
   ↓
4. Exportar en formato:
   - PDF: Reporte formal para auditoría
   - Excel: Datos para análisis
   - Word: Documento editable
   ↓
5. Compartir con REPS/INVIMA según se requiera
```

---

## Guía de Desarrollo

### Setup de Desarrollo Local

```bash
# 1. Clonar y entrar
git clone <url>
cd Proyecto\ Norma\ 3100

# 2. Instalar dependencias
cd backend && npm install
cd ../frontend && npm install

# 3. Configurar variables de entorno
cd ../backend && cp .env.example .env
# Editar .env si es necesario (defaults funcionan con Docker)

# 4. Iniciar Docker
docker-compose up -d postgres redis

# 5. Migraciones
npm run migrate:up

# 6. Iniciar servicios (dos terminales)
# Terminal 1 - Backend:
cd backend && npm run dev    # :3001

# Terminal 2 - Frontend:
cd frontend && npm run dev   # :5173
```

### Comandos Útiles

```bash
# Backend
npm run dev                  # Modo desarrollo (nodemon)
npm run build               # Compilar TypeScript
npm start                   # Ejecutar compilado
npm run lint                # ESLint check
npm run lint:fix            # ESLint auto-fix
npm run format              # Prettier format
npm test                    # Pruebas unitarias
npm test:watch              # Watch mode
npm test:coverage           # Con cobertura
npm run migrate:up          # Aplicar migraciones
npm run migrate:down        # Revertir última migración

# Frontend
npm run dev                 # Modo desarrollo (Vite)
npm run build               # Build para producción
npm run preview             # Preview del build
npm run lint                # ESLint
npm run lint:fix            # Auto-fix
npm run format              # Prettier
npm test                    # Vitest
npm test:ui                 # Vitest con UI
npm test:coverage           # Con cobertura

# Docker
docker-compose up -d        # Iniciar todo
docker-compose down         # Parar todo
docker-compose logs -f      # Ver logs en tiempo real
docker-compose ps           # Ver estado de servicios
docker-compose exec backend npm run lint    # Ejecutar comando en contenedor
docker system prune -a      # Limpiar todo
```

### Estándares de Código

**Backend (TypeScript):**
- Modo estricto activado
- Tipos explícitos (no usar `any`)
- Funciones con tipo de retorno
- Clases en PascalCase
- Funciones en camelCase
- Constantes en UPPER_SNAKE_CASE
- Comentarios en español para lógica compleja
- Máximo 100 caracteres por línea

**Frontend (React/TypeScript):**
- Componentes funcionales con hooks
- Props interface por componente
- Zustand stores para estado global
- CSS Modules o Tailwind para estilos
- **Todos los textos en ESPAÑOL (es_CO)**
- Sin código en inglés visible al usuario

### Estructura de Commits

```bash
git commit -m "feat(modulo): breve descripción

- Cambio 1
- Cambio 2

Relacionado con #123"

# Tipos:
# feat:     nueva funcionalidad
# fix:      corrección de bug
# refactor: refactorización sin cambio funcional
# docs:     solo documentación
# test:     agregar/modificar pruebas
# chore:    dependencias, configuración
```

### Pruebas

```bash
# Backend
describe('FindingService', () => {
  it('should create finding from NC criterion', async () => {
    const finding = await service.createFromCriterion({
      criterionId: 'crit-123',
      status: 'NC',
      description: 'Falta implementar...'
    });
    expect(finding.id).toBeDefined();
  });
});

# Frontend
test('should submit provider form', () => {
  render(<ProviderForm />);
  fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Test' } });
  fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
  expect(mockSubmit).toHaveBeenCalled();
});
```

---

## Estado del Proyecto

### Resumen por Fase

| Fase | Nombre | Horas | Estado | Completada |
|------|--------|-------|--------|-----------|
| 1 | Infraestructura | 40h | ✅ Completada | 100% |
| 2 | Autenticación | 35h | 🔄 Backend OK, Frontend Pendiente | 60% |
| 3 | Flujos Cumplimiento | 70h | 🔄 En Progreso (Tasks 1-2/11) | 15% |
| 4 | Integración REPS/INVIMA | 50h | ⏳ No iniciada | 0% |
| 5 | Auditoría y Reportes | 45h | ⏳ No iniciada | 0% |
| 6 | Seguridad y Despliegue | 30h | ⏳ No iniciada | 0% |
| **TOTAL** | - | **270h** | 🔄 En Construcción | **18%** |

### Componentes Operacionales

- ✅ **Backend API:** 90% completado (auth + providers + eventos)
- ✅ **Base de Datos:** Esquema completo Phase 1-3
- ✅ **Event Sourcing:** Implementado y funcional
- ✅ **Docker:** Todos los servicios dockerizados
- 🔄 **Frontend Auth:** 50% (backend listo, UI pendiente)
- 🔄 **Frontend Módulos:** 0% (listos para iniciar)
- ⏳ **REPS/INVIMA:** No iniciado
- ⏳ **Reportes:** No iniciado
- ⏳ **Despliegue VPS:** No iniciado

### Próximos Pasos

1. ✅ **Completar Phase 3:** Frontend (Tasks 7-11, 54h)
2. ⏳ **Iniciar Phase 4:** Integración REPS/INVIMA
3. ⏳ **Phase 5:** Reportería avanzada
4. ⏳ **Phase 6:** Despliegue a VPS Hostinger

---

## Contacto y Soporte

- **Documentación:** Revisar `/docs` en el repositorio
- **Issues:** GitHub Issues
- **Discusiones:** GitHub Discussions
- **Equipo:** Development Team

---

**Última Actualización:** 2026-04-10  
**Versión:** 0.2.0 (Beta)  
**Licencia:** MIT

---

*Este documento resume toda la estructura, arquitectura y estado del **Sistema de Gestión de Cumplimiento Norma 3100**. Para más detalles técnicos, consulta los archivos en `/docs` y comentarios en el código.*
