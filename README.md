# Sistema de Gestión de Cumplimiento Norma 3100

Una plataforma integral de gestión de cumplimiento normativo para prestadores de servicios de salud en Colombia que buscan cumplir con los requisitos de la **Norma 3100 de 2019**. El sistema automatiza la certificación de prestadores, autoevaluación, seguimiento de hallazgos y reportes regulatorios ante autoridades REPS/INVIMA.

## Descripción General

La **Norma 3100** es un estándar de cumplimiento en el sector salud en Colombia que requiere que los prestadores de servicios de salud demuestren cumplimiento con requisitos organizacionales, clínicos e infraestructurales específicos. Esta plataforma simplifica el complejo proceso de auditoría y certificación.

### Características Principales

- **Gestión de Prestadores** - Registro y seguimiento de información organizacional, certificaciones y estado de cumplimiento
- **Catálogo de Servicios** - Administración de servicios de salud ofrecidos y cumplimiento por servicio
- **Autoevaluación** - Cuestionarios estructurados alineados a requisitos de Norma 3100
- **Hallazgos y Acciones** - Registro de hallazgos, asignación de acciones correctivas y seguimiento de resolución
- **Matriz Documental** - Seguimiento de documentos requeridos y estado de cumplimiento
- **Almacenamiento de Eventos** - Auditoría inmutable de todos los cambios de estado de cumplimiento
- **Integración REPS/INVIMA** - Sincronización con registros de salud colombianos
- **Reportes de Auditoría** - Generación de reportes de cumplimiento y disposición para auditoría
- **Control de Acceso por Rol** - Roles de Admin, Auditor, Prestador y Visualizador

## Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Backend** | Node.js + Express | 18+ |
| **Language** | TypeScript | 5.3+ |
| **Frontend** | React + Vite | 18 / 5+ |
| **Database** | PostgreSQL | 14+ |
| **Cache** | Redis | 7+ |
| **Container** | Docker + Compose | 20+ |

## Quick Start

### With Docker (Recommended)

```bash
# Clone repository
git clone <repo-url>
cd Proyecto\ Norma\ 3100

# Start all services
docker-compose up -d

# Initialize database
docker-compose exec backend npm run migrate:up

# Access application
# Frontend: http://localhost:5173
# Backend API: http://localhost:3001
```

See [QUICKSTART.md](./QUICKSTART.md) for detailed setup instructions.

### Without Docker

```bash
# Backend setup
cd backend
npm install
npm run migrate:up
npm run dev

# Frontend setup (in new terminal)
cd frontend
npm install
npm run dev
```

## Project Structure

```
Proyecto Norma 3100/
├── backend/
│   ├── src/
│   │   ├── modules/          # Feature modules
│   │   ├── routes/           # API routes
│   │   ├── middleware/       # Express middleware
│   │   ├── utils/            # Utilities (logger, etc.)
│   │   ├── types/            # TypeScript types
│   │   └── config/           # Configuration
│   ├── db/
│   │   ├── schema.sql        # Database schema
│   │   ├── migrations.ts     # Migration framework
│   │   └── init.sql          # Database initialization
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom hooks
│   │   ├── contexts/         # Context/state management
│   │   ├── services/         # API clients
│   │   ├── types/            # TypeScript types
│   │   └── styles/           # Global styles
│   ├── public/               # Static assets
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── docker-compose.yml        # Multi-container configuration
├── Dockerfile.backend        # Backend Docker image
├── redis.conf                # Redis configuration
├── .env.example              # Environment variables template
└── README.md                 # This file
```

## Environment Variables

### Backend

```bash
# Server
NODE_ENV=development
PORT=3001

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=norma3100
DB_USER=postgres
DB_PASSWORD=postgres_dev_password

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=dev_jwt_secret_change_in_production
JWT_EXPIRATION=24h

# Logging
LOG_LEVEL=debug
```

See [backend/.env.example](./backend/.env.example) for all options.

### Frontend

```bash
VITE_API_URL=http://localhost:3001/api
VITE_ENV=development
```

## Development

### Setup IDE

```bash
# Install ESLint/Prettier extensions
# VS Code: ESLint, Prettier - Code formatter

# Enable format on save:
# Settings > Editor: Format On Save = true
```

### Running Tests

```bash
# Backend
cd backend
npm test                 # Run once
npm test:watch          # Watch mode
npm test:coverage       # With coverage

# Frontend
cd frontend
npm test
npm test:ui             # UI mode
npm test:coverage
```

### Linting & Formatting

```bash
# Backend
cd backend
npm run lint            # Check
npm run lint:fix        # Fix issues
npm run format          # Format with Prettier

# Frontend
cd frontend
npm run lint
npm run lint:fix
npm run format
```

### Database Migrations

```bash
# Create migration files
npm run migrate:create

# Apply migrations
npm run migrate:up

# Rollback migrations
npm run migrate:down

# Seed database
npm run seed
```

## Architecture

### Event Sourcing

All compliance state changes are immutably recorded as events in the event store. This provides:

- **Audit Trail** - Complete history of all changes
- **Replay** - Reconstruct state at any point in time
- **Compliance** - Tamper detection and integrity verification
- **Performance** - Efficient caching of computed state

```
Event Store → Event Replay → Aggregate State → API Response
```

### API Routes

```
GET    /health                    # Service health
GET    /api                       # API status

# Providers (Module 1)
GET    /api/providers             # List providers
POST   /api/providers             # Create provider
GET    /api/providers/:id         # Get provider
PUT    /api/providers/:id         # Update provider

# Findings (Module 4)
GET    /api/findings              # List findings
POST   /api/findings              # Create finding
PATCH  /api/findings/:id/status   # Update status

# Events (Audit Trail)
GET    /api/events/:aggregateId   # Get event history
```

## Database Schema

### Core Tables

- `providers` - Healthcare organizations
- `locations` - Physical sites of providers
- `services` - Healthcare services offered
- `services_enabled` - Services per provider/location
- `users` - System users
- `roles` - User roles with permissions

### Compliance Tables

- `findings` - Audit findings/deficiencies
- `corrective_actions` - Corrective action tracking
- `evaluation_criteria` - Norma 3100 criteria reference
- `documentary_matrix` - Required documents per norm
- `documents` - Uploaded compliance documents

### Audit Trail

- `events` - Immutable event store (append-only)
- `audit_logs` - User action audit logging
- `user_sessions` - Session management

## Contributing

1. **Create a feature branch** from `develop`
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Follow coding standards**
   - Run linter: `npm run lint`
   - Format code: `npm run format`
   - Write tests for new features

3. **Commit atomically**
   ```bash
   git commit -m "feat: describe your change"
   ```

4. **Push and create Pull Request**
   - Link related issues
   - Describe changes clearly
   - Await code review approval

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

## CI/CD Pipeline

GitHub Actions workflows:

- **Lint** - ESLint and TypeScript checks
- **Test** - Unit tests with coverage (≥80%)
- **Build** - Docker image builds
- **Deploy** - Production deployment

All PRs must pass checks before merging.

## Security

- **Encryption** - TLS 1.3 in transit, AES-256 at rest (planned)
- **Auth** - JWT with refresh tokens
- **Secrets** - Environment variables, no hardcoded credentials
- **Audit** - Immutable event log of all changes
- **RBAC** - Role-based access control

## Troubleshooting

### Common Issues

```bash
# Port in use
lsof -i :3001 | grep -v PID | awk '{print $2}' | xargs kill -9

# Database connection failed
docker-compose down -v && docker-compose up -d postgres
docker-compose exec backend npm run migrate:up

# Docker out of space
docker system prune -a --volumes
```

See [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) for more.

## Performance Targets

- **API Response** - <100ms (p95)
- **Audit Query** - <1s for 10k events
- **Docker Build** - <3 min clean build
- **Page Load** - <2s on 4G

## Roadmap

- **Phase 1** (MVP) - Core infrastructure & foundation
- **Phase 2** - Authentication & user management
- **Phase 3** - Self-assessment module
- **Phase 4** - Findings & corrective actions
- **Phase 5** - REPS/INVIMA integration
- **Phase 6** - Reports & dashboards

## Support

- **Documentation** - See `docs/` directory
- **Issues** - GitHub Issues
- **Discussions** - GitHub Discussions

## License

MIT

---

**Last Updated:** 2026-04-10  
**Maintainer:** Development Team  
**Repository:** Proyecto Norma 3100
