import path from 'node:path';
import fs from 'node:fs';
import { EventEmitter } from 'node:events';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database/db.js';
import { ProjectService } from './projectService.js';
import { TemplateService } from './templateService.js';
import { GradleService } from './gradleService.js';
import { SigningService, SigningConfig } from './signingService.js';
import { EnvironmentService } from './environmentService.js';
import { BuildRecord, BuildProgressEvent, BuildType, BuildStatus } from '../types/index.js';
import { Logger } from '../utils/logger.js';
import { getStorageDir, getBuildsDir, getTempDir, getAndroidTemplateDir } from '../utils/paths.js';

export interface StartBuildOptions {
  projectId: string;
  buildType?: BuildType;
  signingConfig?: SigningConfig;
  generateAab?: boolean;
}

interface QueuedBuild {
  buildRecord: BuildRecord;
  project: any;
  signingConfig?: SigningConfig;
  generateAab: boolean;
}

export class BuildEngine extends EventEmitter {
  private static instance: BuildEngine;
  private activeBuilds: Map<string, { abort: () => void }> = new Map();
  private buildQueue: QueuedBuild[] = [];
  private isProcessingQueue = false;

  static getInstance(): BuildEngine {
    if (!this.instance) {
      this.instance = new BuildEngine();
    }
    return this.instance;
  }

  private getStorageDir(): string {
    return getStorageDir();
  }

  private getBuildsDir(): string {
    return getBuildsDir();
  }

  private getTempDir(): string {
    return getTempDir();
  }

  private getTemplateDir(): string {
    return getAndroidTemplateDir();
  }

  async startBuild(options: StartBuildOptions): Promise<BuildRecord> {
    const { projectId, buildType = 'debug', signingConfig, generateAab = false } = options;

    const project = ProjectService.getProject(projectId);
    if (!project) {
      throw new Error(`Project with ID ${projectId} not found.`);
    }

    const envStatus = EnvironmentService.checkEnvironment();
    if (!envStatus.isReady) {
      const issueText = envStatus.issues.join('; ');
      throw new Error(`Environment is not ready for Android builds: ${issueText}`);
    }

    const buildId = uuidv4();
    const startTime = new Date().toISOString();
    const isBusy = this.isProcessingQueue;
    const initialStatus: BuildStatus = isBusy ? 'pending' : 'running';
    const initialLog = isBusy
      ? `[QUEUE] Build queued (position #${this.buildQueue.length + 1}). Waiting for active build to finish...\n`
      : '';

    const db = getDb();
    const insertStmt = db.prepare(`
      INSERT INTO builds (
        id, project_id, build_type, status, start_time, logs, config_snapshot
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(
      buildId,
      projectId,
      buildType,
      initialStatus,
      startTime,
      initialLog,
      JSON.stringify(project)
    );

    const buildRecord: BuildRecord = {
      id: buildId,
      projectId,
      buildType,
      status: initialStatus,
      startTime,
      logs: initialLog,
      configSnapshot: JSON.stringify(project)
    };

    this.buildQueue.push({
      buildRecord,
      project,
      signingConfig,
      generateAab
    });

    if (isBusy) {
      Logger.info(`Build ${buildId} queued (position: #${this.buildQueue.length}).`);
      const queuePos = this.buildQueue.length;
      const event: BuildProgressEvent = {
        buildId,
        stage: `Queued (position #${queuePos})`,
        stepIndex: 0,
        totalSteps: 8,
        status: 'pending',
        progressPercent: 0,
        durationMs: 0
      };
      this.emit(`progress:${buildId}`, event);
      this.emit('progress', event);
    } else {
      this.processQueue().catch((err) => {
        Logger.error(`Queue processing error: ${err.message}`);
      });
    }

    return buildRecord;
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    try {
      while (this.buildQueue.length > 0) {
        const item = this.buildQueue.shift();
        if (!item) break;

        const { buildRecord, project, signingConfig, generateAab } = item;

        if (buildRecord.status !== 'running') {
          buildRecord.status = 'running';
          const db = getDb();
          db.prepare('UPDATE builds SET status = ? WHERE id = ?').run('running', buildRecord.id);
        }

        try {
          await this.executeBuildPipeline(buildRecord, project, signingConfig, generateAab);
        } catch (err: any) {
          Logger.error(`Build ${buildRecord.id} unhandled failure: ${err.message}`);
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  static cleanupOrphanedBuilds(): void {
    try {
      const db = getDb();
      const result = db.prepare(`
        UPDATE builds 
        SET status = 'failed', 
            error_message = 'Build interrupted by server restart',
            end_time = datetime('now')
        WHERE status IN ('running', 'pending')
      `).run();
      if (result.changes > 0) {
        Logger.info(`Cleaned up ${result.changes} orphaned build(s) from previous server run.`);
      }
    } catch (err: any) {
      Logger.warn(`Failed to cleanup orphaned builds: ${err.message}`);
    }
  }

  private async executeBuildPipeline(
    build: BuildRecord,
    project: any,
    signingConfig?: SigningConfig,
    generateAab = false
  ) {
    const buildId = build.id;
    const logs: string[] = [];
    const startTime = Date.now();
    let tempBuildDir = '';

    const emitProgress = (
      stage: string,
      stepIndex: number,
      totalSteps: number,
      progressPercent: number,
      status: BuildStatus = 'running',
      error?: string
    ) => {
      const event: BuildProgressEvent = {
        buildId,
        stage,
        stepIndex,
        totalSteps,
        status,
        progressPercent,
        durationMs: Date.now() - startTime,
        error
      };
      this.emit(`progress:${buildId}`, event);
      this.emit('progress', event);
    };

    const appendLog = (line: string) => {
      logs.push(line);
      this.emit(`log:${buildId}`, line);
    };

    const totalSteps = 8;

    try {
      // Step 1: Validating website files
      emitProgress('Validating website files', 1, totalSteps, 10);
      appendLog('[STEP 1/8] Validating website project files...');
      const filesInfo = ProjectService.getProjectFiles(project.id);
      if (filesInfo.totalFiles === 0) {
        throw new Error('Project source directory contains no files. Please upload your website files first.');
      }
      appendLog(`Found ${filesInfo.totalFiles} files (${(filesInfo.totalSize / 1024).toFixed(1)} KB). Default entry: ${project.entryPoint}`);

      // Step 2: Preparing Android project
      emitProgress('Preparing Android project', 2, totalSteps, 25);
      appendLog('[STEP 2/8] Creating temporary isolated build workspace...');
      const env = EnvironmentService.checkEnvironment();
      tempBuildDir = TemplateService.prepareBuildDirectory(
        project,
        buildId,
        this.getTempDir(),
        this.getTemplateDir(),
        env.androidSdk.sdkPath!,
        env.java.javaHome
      );
      appendLog(`Build directory prepared at: ${tempBuildDir}`);

      // Step 3: Copying website assets
      emitProgress('Copying website assets', 3, totalSteps, 35);
      appendLog('[STEP 3/8] Assets synchronized into Android assets/www.');

      // Step 4: Configuring Android manifest
      emitProgress('Configuring Android manifest & permissions', 4, totalSteps, 45);
      appendLog(`[STEP 4/8] Applied package "${project.packageName}", orientation "${project.orientation}".`);

      // Step 5: Applying application configuration
      emitProgress('Applying WebView settings and app configuration', 5, totalSteps, 55);
      appendLog(`[STEP 5/8] Configured WebView: JS=${project.webviewConfig.enableJavaScript}, DOMStorage=${project.webviewConfig.enableDomStorage}, FileUpload=${project.webviewConfig.enableFileUpload}.`);

      // Step 6: Running Gradle
      emitProgress('Running Gradle build', 6, totalSteps, 70);
      appendLog(`[STEP 6/8] Executing Gradle build (${build.buildType === 'release' ? 'assembleRelease' : 'assembleDebug'})...`);

      const gradleTask = build.buildType === 'release'
        ? (generateAab ? 'bundleRelease' : 'assembleRelease')
        : 'assembleDebug';

      const gradleResult = await GradleService.runGradleBuild(
        tempBuildDir,
        gradleTask,
        {
          androidSdkPath: env.androidSdk.sdkPath,
          javaHome: env.java.javaHome,
          onLog: (line) => appendLog(line),
          onProgress: (taskText, percent) => {
            emitProgress(`Running Gradle: ${taskText}`, 6, totalSteps, Math.min(88, Math.max(60, percent)));
          }
        }
      );

      if (!gradleResult.success || (!gradleResult.apkPath && !gradleResult.aabPath)) {
        throw new Error(gradleResult.error || 'Gradle build failed without producing an output package.');
      }

      appendLog(`[STEP 6/8] Gradle build completed successfully.`);

      // Step 7: Signing APK (if release)
      emitProgress('Finalizing and signing package', 7, totalSteps, 90);
      appendLog('[STEP 7/8] Packaging output artifact...');

      let finalApkPath = gradleResult.apkPath;
      if (build.buildType === 'release' && signingConfig?.keystorePath && finalApkPath) {
        appendLog('Signing release APK with custom keystore...');
        const buildToolsDir = path.join(env.androidSdk.sdkPath!, 'build-tools', env.androidSdk.buildTools[0]);
        const signResult = await SigningService.signApk(finalApkPath, buildToolsDir, signingConfig);
        if (!signResult.success) {
          throw new Error(`Signing failed: ${signResult.error}`);
        }
        appendLog('Release APK signed successfully.');
      }

      // Step 8: Finalizing build & moving artifact to storage/builds/:id/output/
      emitProgress('Finalizing build', 8, totalSteps, 98);
      appendLog('[STEP 8/8] Copying artifact to permanent build storage...');

      const outputDir = path.join(this.getBuildsDir(), buildId, 'output');
      fs.mkdirSync(outputDir, { recursive: true });

      let savedApkPath = '';
      let apkSize = 0;

      if (finalApkPath && fs.existsSync(finalApkPath)) {
        const safeBaseName = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${build.buildType}.apk`;
        savedApkPath = path.join(outputDir, safeBaseName);
        fs.copyFileSync(finalApkPath, savedApkPath);
        apkSize = fs.statSync(savedApkPath).size;
        appendLog(`APK stored at: ${savedApkPath} (${(apkSize / (1024 * 1024)).toFixed(2)} MB)`);
      }

      let savedAabPath = '';
      if (gradleResult.aabPath && fs.existsSync(gradleResult.aabPath)) {
        const safeBaseName = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-release.aab`;
        savedAabPath = path.join(outputDir, safeBaseName);
        fs.copyFileSync(gradleResult.aabPath, savedAabPath);
      }

      // Clean temporary build directory safely
      try {
        if (tempBuildDir && fs.existsSync(tempBuildDir)) {
          fs.rmSync(tempBuildDir, { recursive: true, force: true });
          appendLog('Temporary build directory cleaned.');
        }
      } catch (cleanErr: any) {
        Logger.warn(`Failed to clean temp build dir: ${cleanErr.message}`);
      }

      const durationMs = Date.now() - startTime;
      const endTime = new Date().toISOString();

      // Update database
      const db = getDb();
      const updateStmt = db.prepare(`
        UPDATE builds SET
          status = 'success',
          end_time = ?,
          duration_ms = ?,
          apk_path = ?,
          apk_size = ?,
          aab_path = ?,
          logs = ?
        WHERE id = ?
      `);

      updateStmt.run(
        endTime,
        durationMs,
        savedApkPath || null,
        apkSize || null,
        savedAabPath || null,
        logs.join('\n'),
        buildId
      );

      appendLog(`Build ${buildId} completed successfully in ${(durationMs / 1000).toFixed(1)}s.`);
      emitProgress('Build Completed', 8, totalSteps, 100, 'success');

    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      const endTime = new Date().toISOString();
      const errorMessage = err.message || 'Unknown build error occurred';

      appendLog(`[BUILD ERROR] ${errorMessage}`);
      Logger.error(`Build ${buildId} failed: ${errorMessage}`);

      // Attempt cleanup
      try {
        if (tempBuildDir && fs.existsSync(tempBuildDir)) {
          fs.rmSync(tempBuildDir, { recursive: true, force: true });
        }
      } catch {}

      const db = getDb();
      const updateStmt = db.prepare(`
        UPDATE builds SET
          status = 'failed',
          end_time = ?,
          duration_ms = ?,
          error_message = ?,
          logs = ?
        WHERE id = ?
      `);

      updateStmt.run(
        endTime,
        durationMs,
        errorMessage,
        logs.join('\n'),
        buildId
      );

      emitProgress('Build Failed', totalSteps, totalSteps, 100, 'failed', errorMessage);
    }
  }

  static getBuild(buildId: string): BuildRecord | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM builds WHERE id = ?').get(buildId) as any;
    if (!row) return null;
    return this.mapRowToBuild(row);
  }

  static listBuilds(projectId?: string): BuildRecord[] {
    const db = getDb();
    let query = 'SELECT * FROM builds';
    const params: any[] = [];
    if (projectId) {
      query += ' WHERE project_id = ?';
      params.push(projectId);
    }
    query += ' ORDER BY start_time DESC';
    const rows = db.prepare(query).all(...params) as any[];
    return rows.map(r => this.mapRowToBuild(r));
  }

  private static mapRowToBuild(row: any): BuildRecord {
    return {
      id: row.id,
      projectId: row.project_id,
      buildType: row.build_type as BuildType,
      status: row.status as BuildStatus,
      startTime: row.start_time,
      endTime: row.end_time || undefined,
      durationMs: row.duration_ms ? Number(row.duration_ms) : undefined,
      apkPath: row.apk_path || undefined,
      apkSize: row.apk_size ? Number(row.apk_size) : undefined,
      aabPath: row.aab_path || undefined,
      logs: row.logs || '',
      errorMessage: row.error_message || undefined,
      configSnapshot: row.config_snapshot || undefined
    };
  }
}

