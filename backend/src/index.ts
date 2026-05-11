import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import 'express-async-errors';
import { Pool } from 'pg';

import { logger } from './utils/logger.js';
import authRoutes, { setUserService } from './routes/auth.routes.js';
import { apiLimiter, authLimiter, webhookLimiter } from './middleware/rate-limit.middleware.js';
import { authMiddleware, setAuthPool } from './middleware/auth.middleware.js';
import { sanitizeInputs } from './middleware/sanitize.middleware.js';
import { createProviderRouter } from './routes/provider.routes.js';
import { createAssessmentsRouter } from './routes/assessments.routes.js';
import { createFindingRouter } from './routes/finding.routes.js';
import { createServiceRouter } from './routes/services.routes.js';
import { createQuestionsRouter } from './routes/questions.routes.js';
import { createMultiChannelRouter } from './routes/multichannel.routes.js';
import { createWebhooksRouter } from './routes/webhooks.routes.js';
import { createDocumentsRouter } from './routes/documents.routes.js';
import { createReportsRouter } from './routes/reports.routes.js';
import { createRiskScoringRouter } from './routes/risk-scoring.routes.js';
import { createSuficienciaPatrimonialRouter } from './routes/suficiencia-patrimonial.routes.js';
import { createHistoriaClinicaRouter } from './routes/historia-clinica.routes.js';
import { createInvimaRouter } from './routes/invima.routes.js';
import { createRepsRouter } from './routes/reps.routes.js';
import { createRepsAlertsRouter } from './routes/reps-alerts.routes.js';
import { createAnexo4Router } from './routes/anexo4.routes.js';
import { RepsAlertService } from './services/RepsAlertService.js';
import { createNorma3100Router } from './routes/norma3100.routes.js';
import { createUsersRouter } from './routes/users.routes.js';
import { createLocationsRouter } from './routes/locations.routes.js';
import { createNotificationsRouter } from './routes/notifications.routes.js';
import { HabilitacionAlertService } from './services/HabilitacionAlertService.js';
import { NotificationService } from './services/NotificationService.js';
import { EventStore } from './modules/events/EventStore.js';
import swaggerUi from 'swagger-ui-express';
import { openapiSpec, swaggerUiOptions } from './config/openapi.config.js';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3002;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Database setup
const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'norma3100',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres_dev_password',
});

pool.on('error', (err) => {
  logger.error({ msg: 'Unexpected error on idle client', error: err.message });
});

// Initialize event store
const eventStore = new EventStore(pool);

// Security middleware (order matters)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: NODE_ENV === 'production' ? ["'self'"] : ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'ws:', 'wss:'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: NODE_ENV === 'production' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  } : false,
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Input sanitization (after body parsing)
app.use(sanitizeInputs);

// Trust proxy for accurate IP addresses behind reverse proxy
app.set('trust proxy', 1);

// Request logging middleware
app.use((req: Request, res: Response, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
    });
  });
  next();
});

// === API DOCUMENTATION (Swagger / OpenAPI) ===
// Raw OpenAPI spec
app.get('/api/docs.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(openapiSpec);
});
// Interactive Swagger UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, swaggerUiOptions));

// Health check endpoint — liveness + readiness (DB + Redis)
app.get('/health', async (_req: Request, res: Response) => {
  const checks: Record<string, { status: string; latencyMs?: number; error?: string }> = {};

  // Verificación de BD: query ligera con timeout implícito del pool
  const dbStart = Date.now();
  try {
    await pool.query('SELECT 1');
    checks.database = { status: 'healthy', latencyMs: Date.now() - dbStart };
  } catch (err) {
    checks.database = { status: 'unhealthy', error: (err as Error).message };
  }

  // Verificación de Redis (si REDIS_URL está configurada)
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    const redisStart = Date.now();
    try {
      const { createClient } = await import('redis');
      const client = createClient({ url: redisUrl });
      await client.connect();
      await client.ping();
      await client.disconnect();
      checks.redis = { status: 'healthy', latencyMs: Date.now() - redisStart };
    } catch (err) {
      checks.redis = { status: 'unhealthy', error: (err as Error).message };
    }
  }

  const allHealthy = Object.values(checks).every(c => c.status === 'healthy');
  const httpStatus = allHealthy ? 200 : 503;

  res.status(httpStatus).json({
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: process.env.npm_package_version || '1.0.0',
    environment: NODE_ENV,
    checks,
  });
});

// Initialize services with database pool
setUserService(pool);
setAuthPool(pool);

// Auth Routes (strict rate limiting for brute-force protection)
app.use('/auth', authLimiter, authRoutes);

// API Routes (standard rate limiting)
app.get('/api', (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Norma 3100 Compliance Management API',
    version: '1.0.0',
    status: 'operational',
  });
});

// Phase 3 Routes (protected by standard API limiter)
app.use('/api/users', apiLimiter, createUsersRouter(pool));
app.use('/api', apiLimiter, createProviderRouter(pool, eventStore));
app.use('/api', apiLimiter, createAssessmentsRouter(pool, eventStore));
app.use('/api', apiLimiter, createFindingRouter(pool, eventStore));
app.use('/api', apiLimiter, createServiceRouter(pool, eventStore));
app.use('/api/questions', apiLimiter, createQuestionsRouter(pool, eventStore));

// Phase 4 Sprint 2: Multi-Channel Notifications
app.use('/api/multichannel', apiLimiter, authMiddleware, createMultiChannelRouter(pool));
// Webhooks use their own (higher) limiter since providers may burst
app.use('/api/webhooks', webhookLimiter, createWebhooksRouter(pool));

// Phase 4.1: Documentary Matrix
app.use('/api', apiLimiter, createDocumentsRouter(pool, eventStore));

// Phase 5: Compliance Reports (PDF/Excel)
app.use('/api', apiLimiter, createReportsRouter(pool));

// Risk Scoring Engine
app.use('/api', apiLimiter, createRiskScoringRouter(pool));

// Condición 2: Suficiencia Patrimonial y Financiera (Res. 3100/2019, Cap. 9)
app.use('/api', apiLimiter, createSuficienciaPatrimonialRouter(pool));

// Estándar TSHCR: Historia Clínica y Registros (Res. 3100/2019, Cap. 11 + Res. 1995/1999)
app.use('/api', apiLimiter, createHistoriaClinicaRouter(pool));
app.use('/api', apiLimiter, createInvimaRouter(pool));

// REPS: Registro Especial de Prestadores (Condición 1 — datos.gov.co SODA API)
app.use('/api', apiLimiter, createRepsRouter(pool));

// REPS Alert Triggers: cron de prospección semi-automática por vencimiento
const repsAlertService = new RepsAlertService(pool);
app.use('/api', apiLimiter, createRepsAlertsRouter(pool, repsAlertService));

// Anexo 4: Verificación Estándar de Historia Clínica y Registros Asistenciales
app.use('/api', apiLimiter, createAnexo4Router(pool));

// Norma 3100 JSON-based assessments (no database required)
app.use('/api', apiLimiter, createNorma3100Router());

// Locations (Colombian departments and municipalities)
app.use('/api', apiLimiter, createLocationsRouter(pool));

// In-app Notifications
app.use('/api/notifications', apiLimiter, createNotificationsRouter(pool));

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
    path: _req.path,
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response) => {
  logger.error({
    error: err.message,
    stack: err.stack,
  });

  res.status(500).json({
    error: 'Internal Server Error',
    message: NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  logger.info(`Environment: ${NODE_ENV}`);

  // Iniciar cron de alertas de habilitación (verifica vencimientos ≤30 días)
  const notificationService = new NotificationService(pool);
  const habilitacionAlertService = new HabilitacionAlertService(pool, notificationService);
  habilitacionAlertService.startDailyCheck();

  // Iniciar schedulers de alertas REPS configuradas por el usuario
  repsAlertService.initAllActiveSchedulers();
});

export default app;
