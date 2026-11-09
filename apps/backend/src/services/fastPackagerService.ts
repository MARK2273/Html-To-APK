import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { spawn } from 'node:child_process';
import AdmZip from 'adm-zip';
import { Project, BuildRecord } from '../types/index.js';
import { SigningConfig } from './signingService.js';
import { Logger } from '../utils/logger.js';
import { getAndroidTemplateDir, getProjectsDir, getTempDir } from '../utils/paths.js';

export interface FastPackageOptions {
  project: Project;
  build: BuildRecord;
  androidSdkPath?: string;
  signingConfig?: SigningConfig;
  onLog: (line: string) => void;
  onProgress: (stage: string, percent: number) => void;
}

export class FastPackagerService {
  /**
   * Discovers the base-template.apk location.
   */
  static getBaseTemplateApkPath(): string | null {
    const candidates = [
      '/app/android/base-template.apk',
      path.resolve(process.cwd(), 'android', 'base-template.apk'),
      path.resolve(process.cwd(), '..', '..', 'android', 'base-template.apk'),
      path.resolve(getAndroidTemplateDir(), '..', 'base-template.apk'),
      path.resolve(getAndroidTemplateDir(), 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk')
    ];

    for (const p of candidates) {
      if (fs.existsSync(p)) {
        return p;
      }
    }
    return null;
  }

  /**
   * Finds the Android debug keystore or generates one if missing.
   */
  static async getOrCreateDebugKeystore(): Promise<string> {
    const candidates = [
      '/app/android/debug.keystore',
      path.resolve(process.cwd(), 'android', 'debug.keystore'),
      path.resolve(process.cwd(), '..', '..', 'android', 'debug.keystore'),
      path.join(os.homedir(), '.android', 'debug.keystore')
    ];

    for (const p of candidates) {
      if (fs.existsSync(p)) {
        return p;
      }
    }

    // Generate debug keystore in temp or os.homedir
    const targetDir = path.join(os.homedir(), '.android');
    fs.mkdirSync(targetDir, { recursive: true });
    const targetPath = path.join(targetDir, 'debug.keystore');

    if (!fs.existsSync(targetPath)) {
      await new Promise<void>((resolve) => {
        const child = spawn(
          'keytool',
          [
            '-genkey', '-v',
            '-keystore', targetPath,
            '-storepass', 'android',
            '-alias', 'androiddebugkey',
            '-keypass', 'android',
            '-keyalg', 'RSA',
            '-keysize', '2048',
            '-validity', '10000',
            '-dname', 'CN=Android Debug,O=Android,C=US'
          ],
          { shell: true }
        );
        child.on('close', () => resolve());
        child.on('error', () => resolve());
      });
    }

    return targetPath;
  }

  /**
   * Finds binary in Android SDK build-tools or PATH.
   */
  static findTool(toolName: string, androidSdkPath?: string): string {
    const isWin = process.platform === 'win32';
    const binName = isWin ? (toolName === 'apksigner' ? `${toolName}.bat` : `${toolName}.exe`) : toolName;

    if (androidSdkPath) {
      const buildToolsDir = path.join(androidSdkPath, 'build-tools');
      if (fs.existsSync(buildToolsDir)) {
        const versions = fs.readdirSync(buildToolsDir).sort().reverse();
        for (const v of versions) {
          const candidate = path.join(buildToolsDir, v, binName);
          if (fs.existsSync(candidate)) return candidate;
        }
      }
    }

    return binName;
  }

  /**
   * Fast-packages the user's HTML website into an APK using precompiled base-template.apk.
   * Completes in ~2 seconds with < 30MB RAM footprint.
   */
  static async packageApk(options: FastPackageOptions): Promise<{ success: boolean; apkPath?: string; error?: string }> {
    const { project, build, androidSdkPath, signingConfig, onLog, onProgress } = options;
    const baseTemplateApk = this.getBaseTemplateApkPath();

    if (!baseTemplateApk) {
      return { success: false, error: 'Base template APK not found.' };
    }

    const workDir = path.join(getTempDir(), `fastpack-${build.id}`);
    fs.mkdirSync(workDir, { recursive: true });

    const unalignedApk = path.join(workDir, 'unaligned.apk');
    const alignedApk = path.join(workDir, 'aligned.apk');

    try {
      onProgress('Reading base APK template', 62);
      onLog(`[FAST PACK] Loading pre-compiled base APK from: ${baseTemplateApk}`);

      const zip = new AdmZip(baseTemplateApk);

      // 1. Strip existing signature entries
      onProgress('Preparing package signatures', 66);
      const entries = zip.getEntries();
      for (const entry of entries) {
        const name = entry.entryName;
        if (
          name.startsWith('META-INF/') &&
          (name.endsWith('.SF') ||
           name.endsWith('.RSA') ||
           name.endsWith('.DSA') ||
           name.endsWith('.MF'))
        ) {
          zip.deleteFile(name);
        }
      }

      // 2. Inject user website assets into assets/www/
      onProgress('Injecting website assets', 72);
      const projectSourceDir = path.join(getProjectsDir(), project.id, 'source');
      let assetCount = 0;

      if (fs.existsSync(projectSourceDir)) {
        const addDirRecursive = (currentDir: string, relativePath: string) => {
          const items = fs.readdirSync(currentDir);
          for (const item of items) {
            const fullPath = path.join(currentDir, item);
            const relItemPath = relativePath ? `${relativePath}/${item}` : item;
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
              addDirRecursive(fullPath, relItemPath);
            } else if (stat.isFile()) {
              const fileContent = fs.readFileSync(fullPath);
              zip.addFile(`assets/www/${relItemPath}`, fileContent);
              assetCount++;
            }
          }
        };
        addDirRecursive(projectSourceDir, '');
      }

      onLog(`[FAST PACK] Injected ${assetCount} web asset files into assets/www/`);

      // 3. Inject assets/app-config.json
      onProgress('Configuring application settings', 78);
      const appConfig = {
        appName: project.name || 'HTML App',
        orientation: project.orientation || 'unspecified',
        entryPoint: project.entryPoint || 'index.html',
        enableJavaScript: project.webviewConfig?.enableJavaScript ?? true,
        enableDomStorage: project.webviewConfig?.enableDomStorage ?? true,
        enableDatabase: true,
        enableGeolocation: project.webviewConfig?.enableGeolocation ?? true,
        enableZoom: project.webviewConfig?.enableZoom ?? false,
        enableFileUpload: project.webviewConfig?.enableFileUpload ?? true,
        enableCamera: project.webviewConfig?.enableCameraAccess ?? true,
        enableMicrophone: project.webviewConfig?.enableMicrophoneAccess ?? true,
        enableDownloads: project.webviewConfig?.enableDownloadSupport ?? true,
        enablePullToRefresh: true,
        allowExternalLinks: project.webviewConfig?.enableExternalLinks ?? true,
        openExternalInBrowser: true,
        offlineCacheEnabled: project.webviewConfig?.enableOfflineMode ?? true
      };

      zip.addFile('assets/app-config.json', Buffer.from(JSON.stringify(appConfig, null, 2), 'utf-8'));
      onLog(`[FAST PACK] Configured app: title="${appConfig.appName}", entry="${appConfig.entryPoint}", orientation="${appConfig.orientation}".`);

      // 4. Inject Custom Application Icon (if provided)
      let resolvedIconPath: string | null = null;
      if (project.iconPath && fs.existsSync(project.iconPath)) {
        resolvedIconPath = project.iconPath;
      } else {
        const projectDir = path.join(getProjectsDir(), project.id);
        const candidates = ['icon.png', 'icon.jpg', 'icon.jpeg', 'icon.webp'];
        for (const c of candidates) {
          const p = path.join(projectDir, c);
          if (fs.existsSync(p)) {
            resolvedIconPath = p;
            break;
          }
        }
      }

      if (resolvedIconPath && fs.existsSync(resolvedIconPath)) {
        onProgress('Injecting application icon', 80);
        onLog(`[FAST PACK] Injecting custom application icon from: ${path.basename(resolvedIconPath)}`);
        const iconBuffer = fs.readFileSync(resolvedIconPath);

        const iconDestinations = [
          'res/mipmap-mdpi/ic_launcher.png',
          'res/mipmap-hdpi/ic_launcher.png',
          'res/mipmap-xhdpi/ic_launcher.png',
          'res/mipmap-xxhdpi/ic_launcher.png',
          'res/mipmap-xxxhdpi/ic_launcher.png',
          'res/mipmap-mdpi/ic_launcher_round.png',
          'res/mipmap-hdpi/ic_launcher_round.png',
          'res/mipmap-xhdpi/ic_launcher_round.png',
          'res/mipmap-xxhdpi/ic_launcher_round.png',
          'res/mipmap-xxxhdpi/ic_launcher_round.png'
        ];

        for (const dest of iconDestinations) {
          zip.addFile(dest, iconBuffer);
        }
        onLog(`[FAST PACK] Custom launcher icon successfully applied to ${iconDestinations.length} screen densities.`);
      }

      // 5. Write unaligned APK
      onProgress('Writing APK package', 83);
      zip.writeZip(unalignedApk);

      // 6. Run zipalign
      onProgress('Aligning package boundaries (zipalign)', 87);
      const zipalignPath = this.findTool('zipalign', androidSdkPath);
      onLog(`[FAST PACK] Running zipalign: ${zipalignPath}`);

      await new Promise<void>((resolve, reject) => {
        const child = spawn(zipalignPath, ['-p', '-f', '4', unalignedApk, alignedApk]);
        let err = '';
        child.stderr?.on('data', (d) => { err += d.toString(); });
        child.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`zipalign exited with code ${code}: ${err}`));
        });
        child.on('error', (e) => reject(e));
      });

      // 6. Sign APK
      onProgress('Signing APK (apksigner)', 90);
      const apksignerPath = this.findTool('apksigner', androidSdkPath);

      if (build.buildType === 'release' && signingConfig?.keystorePath && fs.existsSync(signingConfig.keystorePath)) {
        onLog('[FAST PACK] Signing with custom release keystore...');
        const signArgs = [
          'sign',
          '--ks', signingConfig.keystorePath,
          '--ks-key-alias', signingConfig.keyAlias || 'key0',
          '--ks-pass', `pass:${signingConfig.keystorePassword || ''}`
        ];
        if (signingConfig.keyPassword) {
          signArgs.push('--key-pass', `pass:${signingConfig.keyPassword}`);
        }
        signArgs.push(alignedApk);

        await new Promise<void>((resolve, reject) => {
          const child = spawn(apksignerPath, signArgs, { shell: process.platform === 'win32' });
          let err = '';
          child.stderr?.on('data', (d) => { err += d.toString(); });
          child.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`Release apksigner failed with code ${code}: ${err}`));
          });
          child.on('error', (e) => reject(e));
        });
      } else {
        const debugKeystore = await this.getOrCreateDebugKeystore();
        onLog(`[FAST PACK] Signing with debug keystore: ${debugKeystore}`);
        const signArgs = [
          'sign',
          '--ks', debugKeystore,
          '--ks-key-alias', 'androiddebugkey',
          '--ks-pass', 'pass:android',
          alignedApk
        ];

        await new Promise<void>((resolve, reject) => {
          const child = spawn(apksignerPath, signArgs, { shell: process.platform === 'win32' });
          let err = '';
          child.stderr?.on('data', (d) => { err += d.toString(); });
          child.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`Debug apksigner failed with code ${code}: ${err}`));
          });
          child.on('error', (e) => reject(e));
        });
      }

      onLog('[FAST PACK] APK signed successfully.');

      // Clean unaligned intermediate
      try {
        if (fs.existsSync(unalignedApk)) fs.unlinkSync(unalignedApk);
      } catch {}

      return { success: true, apkPath: alignedApk };
    } catch (err: any) {
      Logger.error(`FastPackagerService error: ${err.message}`);
      return { success: false, error: err.message };
    }
  }
}
