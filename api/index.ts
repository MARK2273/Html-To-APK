import app, { initApp } from '../apps/backend/src/app.js';

initApp();

export default function handler(req: any, res: any) {
  const originalUrl = req.headers['x-matched-path'] || req.headers['x-forwarded-uri'];
  if (originalUrl) {
    req.url = originalUrl;
  }
  return app(req, res);
}
