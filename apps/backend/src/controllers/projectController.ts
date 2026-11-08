import { Request, Response } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { ProjectService } from '../services/projectService.js';
import { isSafePath } from '../utils/security.js';
import { Logger } from '../utils/logger.js';
import { getProjectsDir, ensureDir } from '../utils/paths.js';

export class ProjectController {
  static create(req: Request, res: Response) {
    try {
      const project = ProjectService.createProject(req.body);
      res.status(201).json({ success: true, project });
    } catch (err: any) {
      Logger.error(`Project creation failed: ${err.message}`);
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static list(req: Request, res: Response) {
    try {
      const projects = ProjectService.listProjects();
      res.json({ success: true, projects });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static get(req: Request, res: Response) {
    try {
      const project = ProjectService.getProject(String(req.params.id));
      if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }
      res.json({ success: true, project });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static update(req: Request, res: Response) {
    try {
      const project = ProjectService.updateProject(String(req.params.id), req.body);
      res.json({ success: true, project });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static delete(req: Request, res: Response) {
    try {
      ProjectService.deleteProject(String(req.params.id));
      res.json({ success: true, message: 'Project deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static uploadFiles(req: Request, res: Response) {
    try {
      const projectId = String(req.params.id);
      const project = ProjectService.getProject(projectId);
      if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ success: false, error: 'No files uploaded' });
      }

      // Check if it's a zip file
      const zipFile = files.find(f => f.originalname.toLowerCase().endsWith('.zip') || f.mimetype === 'application/zip');
      if (zipFile) {
        const info = ProjectService.extractZip(projectId, zipFile.path);
        // Clean temp upload
        fs.unlinkSync(zipFile.path);
        return res.json({ success: true, message: 'Zip archive extracted successfully', info });
      }

      // Individual files
      const sourceDir = ensureDir(path.join(getProjectsDir(), projectId, 'source'));

      for (const file of files) {
        // preserve relative path if client sent webkitRelativePath in body or header
        const relativePath = (req.body.relativePaths && req.body.relativePaths[file.originalname]) || file.originalname;
        if (!isSafePath(sourceDir, relativePath)) {
          throw new Error(`Invalid file path detected: ${relativePath}`);
        }
        const targetPath = path.join(sourceDir, relativePath);
        const parent = path.dirname(targetPath);
        if (!fs.existsSync(parent)) {
          fs.mkdirSync(parent, { recursive: true });
        }
        fs.copyFileSync(file.path, targetPath);
        fs.unlinkSync(file.path);
      }

      const info = ProjectService.getProjectFiles(projectId);
      res.json({ success: true, message: 'Files uploaded successfully', info });
    } catch (err: any) {
      Logger.error(`Upload error: ${err.message}`);
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static uploadIcon(req: Request, res: Response) {
    try {
      const projectId = String(req.params.id);
      const file = req.file;
      if (!file) {
        return res.status(400).json({ success: false, error: 'No icon file uploaded' });
      }

      const projectDir = ensureDir(path.join(getProjectsDir(), projectId));
      const iconPath = path.join(projectDir, `icon${path.extname(file.originalname)}`);
      fs.copyFileSync(file.path, iconPath);
      fs.unlinkSync(file.path);

      ProjectService.updateProject(projectId, { iconPath });
      res.json({ success: true, message: 'Icon updated', iconPath });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static getFiles(req: Request, res: Response) {
    try {
      const info = ProjectService.getProjectFiles(String(req.params.id));
      res.json({ success: true, info });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static preview(req: Request, res: Response) {
    try {
      const projectId = String(req.params.id);
      const subPath = req.params[0] || '';
      const sourceDir = path.join(getProjectsDir(), projectId, 'source');

      if (!fs.existsSync(sourceDir)) {
        return res.status(404).send('Project source files not found.');
      }

      const requestedFile = subPath || 'index.html';
      if (!isSafePath(sourceDir, requestedFile)) {
        return res.status(403).send('Forbidden file path.');
      }

      const fullFilePath = path.join(sourceDir, requestedFile);
      if (!fs.existsSync(fullFilePath)) {
        return res.status(404).send(`File not found: ${requestedFile}`);
      }

      res.sendFile(fullFilePath);
    } catch (err: any) {
      res.status(500).send(`Preview error: ${err.message}`);
    }
  }
}
