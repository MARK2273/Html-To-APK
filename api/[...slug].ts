import app, { initApp } from '../apps/backend/src/app.js';

initApp();

export default function handler(req: any, res: any) {
  return app(req, res);
}
