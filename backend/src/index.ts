import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import 'express-async-errors';
import { Pool } from 'pg';
import multer from 'multer';

import { logger } from './utils/logger.js';
import authRoutes, { setUserService } from './routes/auth.routes.js';
import { apiLimiter, authLimiter, webhookLimiter } from './middleware/rate-limit.middleware.js';
import { authMiddleware, setAuthPool } from './middleware/auth.middleware.js';
import { sanitizeInputs } from './middleware/sanitize.middleware.js';
import { createProviderRouter } from './routes/provider.routes.js';
import { createAssessmentsRouter } from './routes/assessments.routes.js';
import { createFindingRouter } from './routes/finding.routes.js';
import { createServiceRouter } from './routes/services.routes.js';
import { createStructureRouter } from './routes/structure.routes.js';
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
import { createWhatsAppRouter } from './routes/whatsapp.routes.js';
import { createAnexo4Router } from './routes/anexo4.routes.js';
import { createAuditorClientsRouter } from './routes/auditor-clients.routes.js';
import { createImprovementPlanRouter } from './routes/improvement-plan.routes.js';
import { createRethusRouter } from './routes/rethus.routes.js';
import { RepsAlertService } from './services/RepsAlertService.js';
import { createNorma3100Router } from './routes/norma3100.routes.js';
import { createUsersRouter } from './routes/users.routes.js';
import { createLocationsRouter } from './routes/locations.routes.js';
import { createNotificationsRouter } from './routes/notifications.routes.js';
import { HabilitacionAlertService } from './services/HabilitacionAlertService.js';
import { DocumentExpiryAlertService } from './services/DocumentExpiryAlertService.js';
import { AdherenceAlertService } from './services/AdherenceAlertService.js';
import { MedicamentosAlertService } from './services/MedicamentosAlertService.js';
import { WhatsAppSchedulerService } from './services/WhatsAppSchedulerService.js';
import { NotificationService } from './services/NotificationService.js';
import { EventStore } from './modules/events/EventStore.js';
import swaggerUi from 'swagger-ui-express';
import { openapiSpec, swaggerUiOptions } from './config/openapi.config.js';
import cron from 'node-cron';
import { RepsEnrichmentService } from './services/RepsEnrichmentService.js';

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

// Aplica migraciones de columnas al arrancar — idempotente con IF NOT EXISTS
async function runStartupMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    const statements = [
      `ALTER TABLE providers ADD COLUMN IF NOT EXISTS email VARCHAR(255)`,
      `ALTER TABLE providers ADD COLUMN IF NOT EXISTS phone VARCHAR(50)`,
      `ALTER TABLE providers ADD COLUMN IF NOT EXISTS nombre_sede VARCHAR(255)`,
      `ALTER TABLE providers ADD COLUMN IF NOT EXISTS codigo_habilitacion VARCHAR(50)`,
      `ALTER TABLE providers ADD COLUMN IF NOT EXISTS habilitacion_fecha_vencimiento DATE`,
      `CREATE TABLE IF NOT EXISTS auditor_providers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        auditor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
        assigned_at TIMESTAMPTZ DEFAULT now(),
        assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
        UNIQUE(auditor_id, provider_id)
      )`,
      `CREATE INDEX IF NOT EXISTS idx_auditor_providers_auditor_id ON auditor_providers(auditor_id)`,
      `CREATE INDEX IF NOT EXISTS idx_auditor_providers_provider_id ON auditor_providers(provider_id)`,
    ];
    for (const sql of statements) {
      await client.query(sql);
    }
    logger.info({ msg: 'Startup migrations applied' });
  } catch (err) {
    logger.error({ msg: 'Startup migrations error', error: err instanceof Error ? err.message : String(err) });
  } finally {
    client.release();
  }
}

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
  permissionsPolicy: false,
  hsts: NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  } : false,
}));

app.use((req, res, next) => {
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Permissions-Policy', "camera=(), microphone=(), geolocation=(), payment=(), usb=(), midi=(), sync-xhr=()");
  next();
});

app.use(cors({
  origin: (origin, callback) => {
    const allowed = (process.env.CORS_ORIGIN || 'http://localhost:5173')
      .split(',').map((s) => s.trim()).filter(Boolean);
    // Sin header Origin (same-origin, curl, health checks) o dominio en whitelist → permitido
    if (!origin || allowed.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.disable('x-powered-by');

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
if (NODE_ENV !== 'production') {
  // Raw OpenAPI spec
  app.get('/api/docs.json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(openapiSpec);
  });
  // Interactive Swagger UI
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, swaggerUiOptions));
} else {
  // En producción los docs quedan ocultos (404) — refuerzo defensivo junto al bloqueo en nginx
  app.use(['/api/docs', '/api/docs.json'], (_req, res) => res.status(404).json({ error: 'Not Found' }));
}

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
      const client = createClient({ url: redisUrl, password: process.env.REDIS_PASSWORD || undefined });
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
app.use('/api', apiLimiter, createStructureRouter(pool));
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

// WhatsApp automático vía Evolution API (Baileys)
app.use('/api', apiLimiter, createWhatsAppRouter(pool));

// Clientes personales del auditor (agenda de prestadores recurrentes)
app.use('/api', apiLimiter, createAuditorClientsRouter(pool));

// Plan de Mejoramiento (Matriz Plan de Mejora Visita Auditoría)
app.use('/api', apiLimiter, createImprovementPlanRouter(pool));

// RETHUS: Registro Especial del Talento Humano en Salud (Ley 1164/2007)
app.use('/api', apiLimiter, createRethusRouter());

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
    path: _req.path,
  });
});

// Error handler
// IMPORTANTE: Express solo reconoce middleware de error por su ARIDAD (debe
// declarar exactamente 4 parámetros: err, req, res, next). Con 3 parámetros
// Express lo trata como middleware normal y lo SALTA en el path de errores
// (incluye next(err) de express-async-errors y el callback de error de cors
// abajo) — los errores caen al handler por defecto de Express, sin loggear
// ni respetar el contrato JSON { error, message }.
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({
    error: err.message,
    stack: err.stack,
  });

  if (err.message === 'CORS not allowed') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Origin not allowed by CORS policy',
    });
  }

  if (err instanceof multer.MulterError) {
    const messages: Record<string, string> = {
      LIMIT_FILE_SIZE: 'El archivo supera el límite de 5MB permitido',
      LIMIT_UNEXPECTED_FILE: 'Campo de archivo inesperado en la solicitud',
    };
    // El frontend (services/api.ts) prioriza el campo `error` sobre `message` al mostrar el
    // toast -- el texto útil debe ir ahí, no solo en `message`.
    return res.status(400).json({
      error: messages[err.code] || `Error al procesar el archivo: ${err.code}`,
      message: messages[err.code] || `Error al procesar el archivo: ${err.code}`,
    });
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
  });
});

// Start server
void runStartupMigrations().then(() => app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  logger.info(`Environment: ${NODE_ENV}`);

  // Advertir en arranque si el JWT_SECRET es el valor débil por defecto
  const jwtSecret = process.env.JWT_SECRET || '';
  if (jwtSecret.length < 48 || jwtSecret.includes('dev_jwt_secret') || jwtSecret.includes('change_in_production')) {
    logger.warn('⚠️  SECURITY: JWT_SECRET is weak or uses default value. Rotate it immediately in production.');
  }

  // Iniciar cron de alertas de habilitación (verifica vencimientos ≤30 días)
  const notificationService = new NotificationService(pool);
  const habilitacionAlertService = new HabilitacionAlertService(pool, notificationService);
  habilitacionAlertService.startDailyCheck();

  // Alertas de vencimiento de documentos (30d, 15d, 7d, hoy)
  const documentExpiryAlertService = new DocumentExpiryAlertService(pool, notificationService);
  documentExpiryAlertService.startDailyCheck();

  // Recordatorio mensual de formatos de adherencia (día 1 de cada mes, 8 AM Bogotá)
  const adherenceAlertService = new AdherenceAlertService(pool, notificationService);
  adherenceAlertService.startMonthlyCheck();

  const medicamentosAlertService = new MedicamentosAlertService(pool, notificationService);
  medicamentosAlertService.startSchedules();

  // Despacha mensajes de WhatsApp encolados fuera de horario laboral (cada 15 min)
  const whatsAppSchedulerService = new WhatsAppSchedulerService(pool);
  whatsAppSchedulerService.startScheduler();

  // Iniciar schedulers de alertas REPS configuradas por el usuario
  void repsAlertService.initAllActiveSchedulers();

  // ─── Job nocturno: re-enriquecimiento automático de fechas REPS ───
  // 2:00 AM UTC — refresca NITs a punto de expirar y reintenta los fallidos hace más de 7 días
  const repsEnrichSvc = new RepsEnrichmentService(pool);
  cron.schedule('0 2 * * *', async () => {
    logger.info({ msg: 'REPS nightly enrichment job started' });
    try {
      const expiring = await pool.query<{ nit: string; codigo_habilitacion: string | null }>(
        `SELECT nit, codigo_habilitacion FROM reps_enriched
          WHERE fecha_vencimiento IS NOT NULL
            AND expira_at < NOW() + INTERVAL '7 days'
          LIMIT 200`
      );
      const stale = await pool.query<{ nit: string; codigo_habilitacion: string | null }>(
        `SELECT nit, codigo_habilitacion FROM reps_enriched
          WHERE fecha_vencimiento IS NULL
            AND enriquecido_at < NOW() - INTERVAL '7 days'
          LIMIT 100`
      );

      const entries = [...expiring.rows, ...stale.rows].map((r) => ({
        nit: r.nit,
        codigoHab: r.codigo_habilitacion ?? undefined,
      }));

      if (entries.length === 0) {
        logger.info({ msg: 'REPS nightly job: nothing to enrich' });
        return;
      }

      let exitosos = 0;
      for (let i = 0; i < entries.length; i += 20) {
        const batch = entries.slice(i, i + 20);
        const results = await repsEnrichSvc.enrichLote(batch).catch((e) => {
          logger.error({ msg: 'REPS nightly batch error', error: String(e) });
          return [];
        });
        exitosos += results.filter((r) => r.ok && r.fecha_vencimiento).length;
        if (i + 20 < entries.length) {await new Promise((r) => setTimeout(r, 3000));}
      }

      logger.info({ msg: 'REPS nightly enrichment job completed', total: entries.length, exitosos });
    } catch (err) {
      logger.error({ msg: 'REPS nightly enrichment job failed', error: String(err) });
    }
  }, { timezone: 'UTC' });
}));
