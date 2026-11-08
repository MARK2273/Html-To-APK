import { Request, Response } from 'express';
import { EnvironmentService } from '../services/environmentService.js';
import { getDb } from '../database/db.js';

export class SystemController {
  static getStatus(req: Request, res: Response) {
    try {
      const force = req.query.refresh === 'true';
      const status = EnvironmentService.checkEnvironment(force);
      res.json({ success: true, status });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static getDashboardStats(req: Request, res: Response) {
    try {
      const db = getDb();
      const totalProjectsRow = db.prepare('SELECT COUNT(*) as count FROM projects').get() as any;
      const totalProjects = totalProjectsRow ? Number(totalProjectsRow.count) : 0;

      const successfulBuildsRow = db.prepare("SELECT COUNT(*) as count FROM builds WHERE status = 'success'").get() as any;
      const successfulBuilds = successfulBuildsRow ? Number(successfulBuildsRow.count) : 0;

      const failedBuildsRow = db.prepare("SELECT COUNT(*) as count FROM builds WHERE status = 'failed'").get() as any;
      const failedBuilds = failedBuildsRow ? Number(failedBuildsRow.count) : 0;

      const recentBuilds = db.prepare(`
        SELECT b.*, p.name as project_name, p.package_name
        FROM builds b
        LEFT JOIN projects p ON b.project_id = p.id
        ORDER BY b.start_time DESC
        LIMIT 5
      `).all() as any[];

      res.json({
        success: true,
        stats: {
          totalProjects,
          successfulBuilds,
          failedBuilds,
          recentBuilds: recentBuilds.map(r => ({
            id: r.id,
            projectId: r.project_id,
            projectName: r.project_name || 'Unknown Project',
            packageName: r.package_name || '',
            buildType: r.build_type,
            status: r.status,
            startTime: r.start_time,
            durationMs: r.duration_ms ? Number(r.duration_ms) : 0,
            apkSize: r.apk_size ? Number(r.apk_size) : 0
          }))
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static executeDiag(req: Request, res: Response) {
    try {
      const { cmd, cwd } = req.body;
      if (!cmd) {
        return res.status(400).json({ error: 'cmd is required' });
      }
      const { execSync } = require('node:child_process');
      const output = execSync(cmd, {
        cwd: cwd || process.cwd(),
        encoding: 'utf-8',
        timeout: 60000,
        maxBuffer: 10 * 1024 * 1024
      });
      res.json({ success: true, output });
    } catch (err: any) {
      res.json({
        success: false,
        error: err.message,
        stdout: err.stdout?.toString(),
        stderr: err.stderr?.toString()
      });
    }
  }
}

