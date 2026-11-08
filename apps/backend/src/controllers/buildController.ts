import { Request, Response } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { BuildEngine } from '../services/buildEngine.js';
import { Logger } from '../utils/logger.js';

export class BuildController {
  static async start(req: Request, res: Response) {
    try {
      const { projectId, buildType, generateAab, signingConfig } = req.body;
      if (!projectId) {
        return res.status(400).json({ success: false, error: 'projectId is required' });
      }

      const engine = BuildEngine.getInstance();
      const build = await engine.startBuild({
        projectId,
        buildType,
        generateAab,
        signingConfig
      });

      res.status(202).json({ success: true, build });
    } catch (err: any) {
      Logger.error(`Failed to start build: ${err.message}`);
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static list(req: Request, res: Response) {
    try {
      const projectId = req.query.projectId as string | undefined;
      const builds = BuildEngine.listBuilds(projectId);
      res.json({ success: true, builds });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static get(req: Request, res: Response) {
    try {
      const buildId = String(req.params.id);
      const build = BuildEngine.getBuild(buildId);
      if (!build) {
        return res.status(404).json({ success: false, error: 'Build record not found' });
      }
      res.json({ success: true, build });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static streamStatus(req: Request, res: Response) {
    const buildId = String(req.params.id);
    const build = BuildEngine.getBuild(buildId);

    if (!build) {
      return res.status(404).json({ success: false, error: 'Build not found' });
    }

    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Send initial snapshot
    res.write(`data: ${JSON.stringify({ type: 'snapshot', build })}\n\n`);

    if (build.status === 'success' || build.status === 'failed') {
      res.write(`data: ${JSON.stringify({ type: 'done', status: build.status })}\n\n`);
      return res.end();
    }

    const engine = BuildEngine.getInstance();

    const onProgress = (event: any) => {
      res.write(`data: ${JSON.stringify({ type: 'progress', event })}\n\n`);
      if (event.status === 'success' || event.status === 'failed') {
        cleanup();
        res.end();
      }
    };

    const onLog = (logLine: string) => {
      res.write(`data: ${JSON.stringify({ type: 'log', log: logLine })}\n\n`);
    };

    engine.on(`progress:${buildId}`, onProgress);
    engine.on(`log:${buildId}`, onLog);

    const cleanup = () => {
      engine.off(`progress:${buildId}`, onProgress);
      engine.off(`log:${buildId}`, onLog);
    };

    req.on('close', cleanup);
  }

  static getLogs(req: Request, res: Response) {
    try {
      const buildId = String(req.params.id);
      const build = BuildEngine.getBuild(buildId);
      if (!build) {
        return res.status(404).json({ success: false, error: 'Build not found' });
      }
      res.json({ success: true, logs: build.logs });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static download(req: Request, res: Response) {
    try {
      const buildId = String(req.params.id);
      const build = BuildEngine.getBuild(buildId);
      if (!build) {
        return res.status(404).json({ success: false, error: 'Build not found' });
      }

      if (build.status !== 'success' || !build.apkPath) {
        return res.status(400).json({ success: false, error: 'APK is not ready or build failed' });
      }

      if (!fs.existsSync(build.apkPath)) {
        return res.status(404).json({ success: false, error: 'APK file missing from storage' });
      }

      const filename = path.basename(build.apkPath);
      res.download(build.apkPath, filename);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}
