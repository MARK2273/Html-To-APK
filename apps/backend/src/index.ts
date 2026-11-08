import app, { initApp } from './app.js';
import { Logger } from './utils/logger.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

initApp();

app.listen(PORT, () => {
  Logger.info(`=======================================================`);
  Logger.info(`HTML to APK Converter Backend running on port ${PORT}`);
  Logger.info(`Health check: http://localhost:${PORT}/health`);
  Logger.info(`API Base URL: http://localhost:${PORT}/api`);
  Logger.info(`=======================================================`);
});

export default app;
