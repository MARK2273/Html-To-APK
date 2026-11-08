import path from 'node:path';
import fs from 'node:fs';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database/db.js';
import { Project, ProjectPermissions, WebViewConfig } from '../types/index.js';
import { validatePackageName } from '../utils/security.js';
import { ZipService, ExtractedWebsiteInfo } from './zipService.js';
import { Logger } from '../utils/logger.js';
import { getProjectsDir } from '../utils/paths.js';

const defaultPermissions: ProjectPermissions = {
  internet: true,
  camera: false,
  microphone: false,
  location: false,
  fineLocation: false,
  coarseLocation: false,
  fileAccess: false,
  notifications: false,
  vibration: false
};

const defaultWebViewConfig: WebViewConfig = {
  enableJavaScript: true,
  enableDomStorage: true,
  enableLocalStorage: true,
  enableFileUpload: true,
  enableCameraAccess: false,
  enableMicrophoneAccess: false,
  enableGeolocation: false,
  enableZoom: false,
  enableFullscreen: false,
  enableDownloadSupport: true,
  enableExternalLinks: true,
  enableOfflineMode: true
};

export class ProjectService {
  private static getProjectsDir(): string {
    return getProjectsDir();
  }

  static createProject(data: Partial<Project>): Project {
    const packageName = data.packageName || 'com.example.htmlapp';
    const validation = validatePackageName(packageName);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    const project: Project = {
      id,
      name: data.name || 'Untitled Application',
      packageName,
      versionName: data.versionName || '1.0.0',
      versionCode: data.versionCode || 1,
      description: data.description || '',
      minSdk: data.minSdk || 24,
      targetSdk: data.targetSdk || 34,
      orientation: data.orientation || 'unspecified',
      permissions: { ...defaultPermissions, ...(data.permissions || {}) },
      webviewConfig: { ...defaultWebViewConfig, ...(data.webviewConfig || {}) },
      entryPoint: data.entryPoint || 'index.html',
      iconPath: data.iconPath,
      splashPath: data.splashPath,
      createdAt: now,
      updatedAt: now
    };

    // Create source directory
    const sourceDir = path.join(this.getProjectsDir(), id, 'source');
    fs.mkdirSync(sourceDir, { recursive: true });

    // Insert into DB
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO projects (
        id, name, package_name, version_name, version_code, description,
        min_sdk, target_sdk, orientation, permissions, webview_config,
        entry_point, icon_path, splash_path, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      project.id,
      project.name,
      project.packageName,
      project.versionName,
      project.versionCode,
      project.description,
      project.minSdk,
      project.targetSdk,
      project.orientation,
      JSON.stringify(project.permissions),
      JSON.stringify(project.webviewConfig),
      project.entryPoint,
      project.iconPath || null,
      project.splashPath || null,
      project.createdAt,
      project.updatedAt
    );

    Logger.info(`Project created: ${project.id} (${project.name})`);
    return project;
  }

  static getProject(id: string): Project | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as any;
    if (!row) return null;
    return this.mapRowToProject(row);
  }

  static listProjects(): Project[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM projects ORDER BY updated_at DESC').all() as any[];
    return rows.map(r => this.mapRowToProject(r));
  }

  static updateProject(id: string, updates: Partial<Project>): Project {
    const existing = this.getProject(id);
    if (!existing) {
      throw new Error(`Project with ID ${id} not found.`);
    }

    if (updates.packageName) {
      const validation = validatePackageName(updates.packageName);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
    }

    const updated: Project = {
      ...existing,
      ...updates,
      permissions: updates.permissions ? { ...existing.permissions, ...updates.permissions } : existing.permissions,
      webviewConfig: updates.webviewConfig ? { ...existing.webviewConfig, ...updates.webviewConfig } : existing.webviewConfig,
      updatedAt: new Date().toISOString()
    };

    const db = getDb();
    const stmt = db.prepare(`
      UPDATE projects SET
        name = ?, package_name = ?, version_name = ?, version_code = ?,
        description = ?, min_sdk = ?, target_sdk = ?, orientation = ?,
        permissions = ?, webview_config = ?, entry_point = ?,
        icon_path = ?, splash_path = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      updated.name,
      updated.packageName,
      updated.versionName,
      updated.versionCode,
      updated.description,
      updated.minSdk,
      updated.targetSdk,
      updated.orientation,
      JSON.stringify(updated.permissions),
      JSON.stringify(updated.webviewConfig),
      updated.entryPoint,
      updated.iconPath || null,
      updated.splashPath || null,
      updated.updatedAt,
      id
    );

    Logger.info(`Project updated: ${id}`);
    return updated;
  }

  static deleteProject(id: string): boolean {
    const projectDir = path.join(this.getProjectsDir(), id);
    if (fs.existsSync(projectDir)) {
      fs.rmSync(projectDir, { recursive: true, force: true });
    }

    const db = getDb();
    db.prepare('DELETE FROM builds WHERE project_id = ?').run(id);
    db.prepare('DELETE FROM projects WHERE id = ?').run(id);

    Logger.info(`Project deleted: ${id}`);
    return true;
  }

  static extractZip(id: string, zipPath: string): ExtractedWebsiteInfo {
    const project = this.getProject(id);
    if (!project) throw new Error(`Project not found: ${id}`);

    const sourceDir = path.join(this.getProjectsDir(), id, 'source');
    // Clear existing source if requested
    if (fs.existsSync(sourceDir)) {
      fs.rmSync(sourceDir, { recursive: true, force: true });
    }
    fs.mkdirSync(sourceDir, { recursive: true });

    const info = ZipService.extractWebsiteZip(zipPath, sourceDir);

    // If project entry point wasn't explicitly set, default to detected entry
    if (info.defaultEntryPoint && project.entryPoint === 'index.html') {
      this.updateProject(id, { entryPoint: info.defaultEntryPoint });
    }

    return info;
  }

  static getProjectFiles(id: string): ExtractedWebsiteInfo {
    const sourceDir = path.join(this.getProjectsDir(), id, 'source');
    return ZipService.scanWebsiteDirectory(sourceDir);
  }

  private static mapRowToProject(row: any): Project {
    return {
      id: row.id,
      name: row.name,
      packageName: row.package_name,
      versionName: row.version_name,
      versionCode: Number(row.version_code),
      description: row.description || '',
      minSdk: Number(row.min_sdk),
      targetSdk: Number(row.target_sdk),
      orientation: row.orientation,
      permissions: JSON.parse(row.permissions),
      webviewConfig: JSON.parse(row.webview_config),
      entryPoint: row.entry_point || 'index.html',
      iconPath: row.icon_path || undefined,
      splashPath: row.splash_path || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

