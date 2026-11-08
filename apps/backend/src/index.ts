import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'node:path';
import projectRoutes from './routes/projectRoutes.js';
import buildRoutes from './routes/buildRoutes.js';
import systemRoutes from './routes/systemRoutes.js';
import { getDb } from './database/db.js';
import { EnvironmentService } from './services/environmentService.js';
import { Logger } from './utils/logger.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Body Parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount Routes
app.use('/api/projects', projectRoutes);
app.use('/api/builds', buildRoutes);
app.use('/api/system', systemRoutes);

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  Logger.error(`Unhandled request error: ${err.message}`, err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Initialize DB and verify environment
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

app.listen(PORT, () => {
  Logger.info(`=======================================================`);
  Logger.info(`HTML to APK Converter Backend running on port ${PORT}`);
  Logger.info(`Health check: http://localhost:${PORT}/health`);
  Logger.info(`API Base URL: http://localhost:${PORT}/api`);
  Logger.info(`=======================================================`);
});

