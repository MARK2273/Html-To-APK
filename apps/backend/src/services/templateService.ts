import path from 'node:path';
import fs from 'node:fs';
import { Project } from '../types/index.js';
import { ManifestGenerator } from './manifestGenerator.js';
import { Logger } from '../utils/logger.js';
import { getProjectsDir } from '../utils/paths.js';

export class TemplateService {
  /**
   * Clones and configures the Android template for a specific build.
   */
  static prepareBuildDirectory(
    project: Project,
    buildId: string,
    tempRootDir: string,
    templateDir: string,
    sdkPath: string,
    javaHome?: string
  ): string {
    const buildDir = path.join(tempRootDir, `build-${buildId}`);
    if (fs.existsSync(buildDir)) {
      fs.rmSync(buildDir, { recursive: true, force: true });
    }
    fs.mkdirSync(buildDir, { recursive: true });

    Logger.info(`Copying template from ${templateDir} to ${buildDir}`);
    this.copyDirectoryRecursive(templateDir, buildDir, ['.git', '.gradle', 'build', '.idea']);

    // 1. Create local.properties pointing to Android SDK
    const normalizedSdk = sdkPath.replace(/\\/g, '/');
    const localPropertiesContent = `sdk.dir=${normalizedSdk}\n`;
    fs.writeFileSync(path.join(buildDir, 'local.properties'), localPropertiesContent);

    // 2. Configure gradle.properties with container memory constraints
    const gradlePropsPath = path.join(buildDir, 'gradle.properties');
    let gradleProps = 'org.gradle.jvmargs=-Xmx256m -XX:+UseSerialGC -XX:MaxMetaspaceSize=112m -Dfile.encoding=UTF-8\nandroid.useAndroidX=true\norg.gradle.parallel=false\norg.gradle.workers.max=1\norg.gradle.vfs.watch=false\n';
    if (javaHome) {
      const normalizedJava = javaHome.replace(/\\/g, '/');
      gradleProps += `org.gradle.java.home=${normalizedJava}\n`;
    }
    fs.writeFileSync(gradlePropsPath, gradleProps);

    // 3. Configure app/build.gradle.kts
    const appBuildGradlePath = path.join(buildDir, 'app', 'build.gradle.kts');
    let buildGradle = fs.readFileSync(appBuildGradlePath, 'utf-8');

    // Update applicationId and versioning
    buildGradle = buildGradle.replace(
      /applicationId\s*=\s*"[^"]*"/,
      `applicationId = "${project.packageName}"`
    );
    buildGradle = buildGradle.replace(
      /minSdk\s*=\s*\d+/,
      `minSdk = ${project.minSdk || 24}`
    );
    buildGradle = buildGradle.replace(
      /targetSdk\s*=\s*\d+/,
      `targetSdk = ${project.targetSdk || 34}`
    );
    buildGradle = buildGradle.replace(
      /versionCode\s*=\s*\d+/,
      `versionCode = ${project.versionCode || 1}`
    );
    buildGradle = buildGradle.replace(
      /versionName\s*=\s*"[^"]*"/,
      `versionName = "${project.versionName || '1.0.0'}"`
    );

    fs.writeFileSync(appBuildGradlePath, buildGradle);

    // 4. Configure app name in strings.xml
    const stringsXmlPath = path.join(buildDir, 'app', 'src', 'main', 'res', 'values', 'strings.xml');
    const escapedAppName = project.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '\\"').replace(/'/g, "\\'");
    const stringsXml = `<resources>
    <string name="app_name">${escapedAppName}</string>
    <string name="error_title">Unable to Load Page</string>
    <string name="error_message">Please check your connection or website configuration.</string>
    <string name="retry">Retry</string>
</resources>`;
    fs.writeFileSync(stringsXmlPath, stringsXml);

    // 5. Generate dynamic AndroidManifest.xml
    const manifestXml = ManifestGenerator.generate({
      packageName: project.packageName,
      appName: project.name,
      orientation: project.orientation,
      permissions: project.permissions,
      allowExternalLinks: project.webviewConfig.enableExternalLinks
    });
    const manifestPath = path.join(buildDir, 'app', 'src', 'main', 'AndroidManifest.xml');
    fs.writeFileSync(manifestPath, manifestXml);

    // 6. Generate dynamic AppConfig.kt
    const entryRelative = project.entryPoint.replace(/\\/g, '/');
    const appConfigKt = `package com.htmltoapk.template

object AppConfig {
    const val ENTRY_URL = "https://appassets.androidplatform.net/assets/www/${entryRelative}"
    const val FALLBACK_ASSET_URL = "file:///android_asset/www/${entryRelative}"

    const val ENABLE_JAVASCRIPT = ${project.webviewConfig.enableJavaScript}
    const val ENABLE_DOM_STORAGE = ${project.webviewConfig.enableDomStorage}
    const val ENABLE_DATABASE = ${project.webviewConfig.enableLocalStorage}
    const val ENABLE_GEOLOCATION = ${project.webviewConfig.enableGeolocation}
    const val ENABLE_ZOOM = ${project.webviewConfig.enableZoom}
    const val ENABLE_FILE_UPLOAD = ${project.webviewConfig.enableFileUpload}
    const val ENABLE_CAMERA = ${project.webviewConfig.enableCameraAccess}
    const val ENABLE_MICROPHONE = ${project.webviewConfig.enableMicrophoneAccess}
    const val ENABLE_DOWNLOADS = ${project.webviewConfig.enableDownloadSupport}
    const val ENABLE_PULL_TO_REFRESH = true
    const val ALLOW_EXTERNAL_LINKS = ${project.webviewConfig.enableExternalLinks}
    const val OPEN_EXTERNAL_IN_BROWSER = true
    const val OFFLINE_CACHE_ENABLED = ${project.webviewConfig.enableOfflineMode}
}
`;
    const appConfigPath = path.join(buildDir, 'app', 'src', 'main', 'java', 'com', 'htmltoapk', 'template', 'AppConfig.kt');
    fs.writeFileSync(appConfigPath, appConfigKt);

    // 7. Inject website files into assets/www
    const assetsWwwDir = path.join(buildDir, 'app', 'src', 'main', 'assets', 'www');
    if (fs.existsSync(assetsWwwDir)) {
      fs.rmSync(assetsWwwDir, { recursive: true, force: true });
    }
    fs.mkdirSync(assetsWwwDir, { recursive: true });

    const projectSourceDir = path.join(getProjectsDir(), project.id, 'source');
    if (fs.existsSync(projectSourceDir)) {
      Logger.info(`Copying web files from ${projectSourceDir} to ${assetsWwwDir}`);
      this.copyDirectoryRecursive(projectSourceDir, assetsWwwDir);
    } else {
      Logger.warn(`Project source dir not found: ${projectSourceDir}, writing fallback index.html`);
      fs.writeFileSync(path.join(assetsWwwDir, 'index.html'), '<h1>Hello from HTML to APK</h1>');
    }

    // 8. Custom Icon support
    if (project.iconPath && fs.existsSync(project.iconPath)) {
      this.applyCustomIcon(project.iconPath, buildDir);
    }

    return buildDir;
  }

  /**
   * Applies custom app icon if provided (copies PNG to mipmap densities).
   */
  private static applyCustomIcon(iconPath: string, buildDir: string) {
    try {
      const resDir = path.join(buildDir, 'app', 'src', 'main', 'res');
      const mipmapFolders = [
        'mipmap-mdpi',
        'mipmap-hdpi',
        'mipmap-xhdpi',
        'mipmap-xxhdpi',
        'mipmap-xxxhdpi'
      ];
      for (const folder of mipmapFolders) {
        const destFolder = path.join(resDir, folder);
        if (!fs.existsSync(destFolder)) {
          fs.mkdirSync(destFolder, { recursive: true });
        }
        fs.copyFileSync(iconPath, path.join(destFolder, 'ic_launcher.png'));
        fs.copyFileSync(iconPath, path.join(destFolder, 'ic_launcher_round.png'));
      }
      Logger.info('Custom icon applied across all mipmap densities.');
    } catch (e: any) {
      Logger.warn(`Failed to apply custom icon: ${e.message}`);
    }
  }

  /**
   * Recursive directory copy with ignore list.
   */
  private static copyDirectoryRecursive(src: string, dest: string, ignores: string[] = []) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      if (ignores.includes(entry.name)) continue;

      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        this.copyDirectoryRecursive(srcPath, destPath, ignores);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}
