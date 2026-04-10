import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import 'express-async-errors';
import { Pool } from 'pg';

import { logger } from './utils/logger.js';
import authRoutes from './routes/auth.routes.js';
import { createProviderRouter } from './routes/provider.routes.js';
import { createAssessmentRouter } from './routes/assessment.routes.js';
import { createFindingRouter } from './routes/finding.routes.js';
import { createServiceRouter } from './routes/services.routes.js';
import { EventStore } from './modules/events/EventStore.js';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;
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

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

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

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
  });
});

// Auth Routes
app.use('/auth', authRoutes);

// API Routes
app.get('/api', (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Norma 3100 Compliance Management API',
    version: '1.0.0',
    status: 'operational',
  });
});

// Phase 3 Routes
app.use('/api', createProviderRouter(pool, eventStore));
app.use('/api', createAssessmentRouter(pool, eventStore));
app.use('/api', createFindingRouter(pool, eventStore));
app.use('/api', createServiceRouter(pool, eventStore));

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
});

export default app;
