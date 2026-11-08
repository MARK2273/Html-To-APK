import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import projectRoutes from './routes/projectRoutes.js';
import buildRoutes from './routes/buildRoutes.js';
import systemRoutes from './routes/systemRoutes.js';
import { getDb } from './database/db.js';
import { EnvironmentService } from './services/environmentService.js';
import { Logger } from './utils/logger.js';

export const app = express();

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Body Parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check
app.get(['/health', '/api/health'], (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount Routes
app.use('/api/projects', projectRoutes);
app.use('/api/builds', buildRoutes);
app.use('/api/system', systemRoutes);

// Also mount routes without /api prefix for flexible serverless path routing if rewrites strip /api
app.use('/projects', projectRoutes);
app.use('/builds', buildRoutes);
app.use('/system', systemRoutes);

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  Logger.error(`Unhandled request error: ${err.message}`, err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

let isInitialized = false;
export function initApp() {
  if (isInitialized) return;
  try {
    getDb();
    const env = EnvironmentService.checkEnvironment();
    Logger.info(`Environment Ready: ${env.isReady}`);
    if (!env.isReady) {
      Logger.warn(`Environment issues detected: ${env.issues.join(', ')}`);
    }
  } catch (e: any) {
    Logger.error(`Startup initialization failed: ${e.message}`);
  }
  isInitialized = true;
}

export default app;
