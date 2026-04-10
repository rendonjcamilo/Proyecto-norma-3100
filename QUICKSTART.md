# Norma 3100 - Quick Start Guide

Get the Norma 3100 Compliance Management System running in under 10 minutes.

## Prerequisites

- Docker & Docker Compose (v3.9+)
- Git
- Node.js 18+ (for local development without Docker)

## Fast Start (Docker)

### 1. Clone the repository
```bash
git clone <repository-url>
cd Proyecto\ Norma\ 3100
```

### 2. Start all services
```bash
docker-compose up -d
```

This will start:
- **Backend API**: http://localhost:3001
- **Frontend UI**: http://localhost:5173
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### 3. Wait for services to be healthy
```bash
docker-compose ps
```

All services should show `healthy` in the STATUS column.

### 4. Initialize the database
```bash
docker-compose exec backend npm run migrate:up
```

### 5. Access the application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/health

## Verify Installation

### Check all services are running
```bash
docker-compose ps
```

### Test the API
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-04-10T12:00:00Z",
  "uptime": 45.2,
  "environment": "development"
}
```

### Test the database connection
```bash
docker-compose exec postgres psql -U postgres -d norma3100 -c "SELECT COUNT(*) FROM providers;"
```

### Test Redis
```bash
docker-compose exec redis redis-cli PING
```

Expected response: `PONG`

## Local Development (Without Docker)

### Backend Setup

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Create .env file**
   ```bash
   cp .env.example .env
   ```

3. **Ensure PostgreSQL and Redis are running** (locally or via Docker)
   ```bash
   docker run -d --name postgres -e POSTGRES_PASSWORD=password postgres:14
   docker run -d --name redis redis:7
   ```

4. **Run migrations**
   ```bash
   npm run migrate:up
   ```

5. **Start the server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Create .env file** (if needed)
   ```bash
   cp .env.example .env
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

## Common Commands

### Docker Commands
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f backend

# Rebuild images
docker-compose build --no-cache

# Execute command in container
docker-compose exec backend npm run lint

# Remove volumes (database data)
docker-compose down -v
```

### Backend Commands
```bash
# Development
npm run dev

# Linting
npm run lint
npm run lint:fix

# Testing
npm test
npm test:watch

# Building
npm run build

# Migrations
npm run migrate:up
npm run migrate:down
```

### Frontend Commands
```bash
# Development
npm run dev

# Linting
npm run lint
npm run lint:fix

# Testing
npm test

# Building
npm run build

# Preview production build
npm run preview
```

## Troubleshooting

### Port Already in Use
If you see "port already in use" errors:

```bash
# Find and kill process using the port
# On Linux/Mac
lsof -i :3001
kill -9 <PID>

# On Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Docker Permission Denied
```bash
# Add your user to docker group (Linux)
sudo usermod -aG docker $USER
newgrp docker
```

### Database Connection Errors
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Reset database
docker-compose down -v
docker-compose up -d postgres
docker-compose exec backend npm run migrate:up
```

### Out of Disk Space
```bash
# Clean up Docker
docker system prune -a
docker volume prune
```

## Next Steps

1. **Review the architecture** - See `docs/ARCHITECTURE.md`
2. **Set up Git hooks** - Pre-commit linting
3. **Configure IDE** - ESLint, Prettier plugins
4. **Read contribution guide** - See `CONTRIBUTING.md`
5. **Start development** - Review `QUICKSTART.md` for env setup

## Getting Help

- Check `troubleshooting/COMMON_ISSUES.md` for known issues
- Review GitHub Issues for solutions
- Contact the development team

---

**Last Updated:** 2026-04-10  
**Status:** Ready for production
