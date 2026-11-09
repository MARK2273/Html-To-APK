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

    // 2. Configure gradle.properties with container/local memory constraints
    const gradlePropsPath = path.join(buildDir, 'gradle.properties');
    const isWindows = process.platform === 'win32';
    const isRender = !!process.env.RENDER || fs.existsSync('/opt/android-sdk');

    // On local Windows: generous memory so builds never fail with Metaspace OOM
    // On Render container: strictly calibrated memory keeping total footprint within 512MB RAM
    const jvmArgs = (!isRender && isWindows)
      ? 'org.gradle.jvmargs=-Xmx1024m -XX:MaxMetaspaceSize=512m -Dfile.encoding=UTF-8'
      : 'org.gradle.jvmargs=-Xms32m -Xmx96m -XX:MaxMetaspaceSize=160m -XX:ReservedCodeCacheSize=20m -XX:CICompilerCount=2 -Xss256k -XX:+UseSerialGC -Dfile.encoding=UTF-8';

    let gradleProps = [
      jvmArgs,
      'android.useAndroidX=true',
      'org.gradle.parallel=false',
      'org.gradle.workers.max=1',
      'org.gradle.vfs.watch=false',
      'android.builder.sdkDownload=false',
      'android.enableAapt2Daemon=false'
    ].join('\n') + '\n';
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

    // 6. Generate dynamic AppConfig.java and assets/app-config.json
    const entryRelative = project.entryPoint.replace(/\\/g, '/');
    const safeAppName = project.name.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const appConfigJava = `package com.htmltoapk.template;

import android.content.Context;
import org.json.JSONObject;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

public final class AppConfig {
    public static String APP_NAME = "${safeAppName}";
    public static String ORIENTATION = "${project.orientation || 'unspecified'}";
    public static String ENTRY_URL = "https://appassets.androidplatform.net/assets/www/${entryRelative}";
    public static String FALLBACK_ASSET_URL = "file:///android_asset/www/${entryRelative}";

    public static boolean ENABLE_JAVASCRIPT = ${project.webviewConfig.enableJavaScript};
    public static boolean ENABLE_DOM_STORAGE = ${project.webviewConfig.enableDomStorage};
    public static boolean ENABLE_DATABASE = ${project.webviewConfig.enableLocalStorage};
    public static boolean ENABLE_GEOLOCATION = ${project.webviewConfig.enableGeolocation};
    public static boolean ENABLE_ZOOM = ${project.webviewConfig.enableZoom};
    public static boolean ENABLE_FILE_UPLOAD = ${project.webviewConfig.enableFileUpload};
    public static boolean ENABLE_CAMERA = ${project.webviewConfig.enableCameraAccess};
    public static boolean ENABLE_MICROPHONE = ${project.webviewConfig.enableMicrophoneAccess};
    public static boolean ENABLE_DOWNLOADS = ${project.webviewConfig.enableDownloadSupport};
    public static boolean ENABLE_PULL_TO_REFRESH = true;
    public static boolean ALLOW_EXTERNAL_LINKS = ${project.webviewConfig.enableExternalLinks};
    public static boolean OPEN_EXTERNAL_IN_BROWSER = true;
    public static boolean OFFLINE_CACHE_ENABLED = ${project.webviewConfig.enableOfflineMode};

    private static boolean initialized = false;

    private AppConfig() {}

    public static synchronized void init(Context context) {
        if (initialized) return;
        try {
            InputStream is = context.getAssets().open("app-config.json");
            byte[] buffer = new byte[is.available()];
            int bytesRead = is.read(buffer);
            is.close();
            if (bytesRead > 0) {
                String jsonStr = new String(buffer, 0, bytesRead, StandardCharsets.UTF_8);
                JSONObject obj = new JSONObject(jsonStr);

                if (obj.has("appName")) APP_NAME = obj.getString("appName");
                if (obj.has("orientation")) ORIENTATION = obj.getString("orientation");
                if (obj.has("entryPoint")) {
                    String entry = obj.getString("entryPoint");
                    if (entry.startsWith("http://") || entry.startsWith("https://")) {
                        ENTRY_URL = entry;
                        FALLBACK_ASSET_URL = entry;
                    } else {
                        String clean = entry.startsWith("/") ? entry.substring(1) : entry;
                        ENTRY_URL = "https://appassets.androidplatform.net/assets/www/" + clean;
                        FALLBACK_ASSET_URL = "file:///android_asset/www/" + clean;
                    }
                }
                if (obj.has("enableJavaScript")) ENABLE_JAVASCRIPT = obj.getBoolean("enableJavaScript");
                if (obj.has("enableDomStorage")) ENABLE_DOM_STORAGE = obj.getBoolean("enableDomStorage");
                if (obj.has("enableDatabase")) ENABLE_DATABASE = obj.getBoolean("enableDatabase");
                if (obj.has("enableGeolocation")) ENABLE_GEOLOCATION = obj.getBoolean("enableGeolocation");
                if (obj.has("enableZoom")) ENABLE_ZOOM = obj.getBoolean("enableZoom");
                if (obj.has("enableFileUpload")) ENABLE_FILE_UPLOAD = obj.getBoolean("enableFileUpload");
                if (obj.has("enableCamera")) ENABLE_CAMERA = obj.getBoolean("enableCamera");
                if (obj.has("enableMicrophone")) ENABLE_MICROPHONE = obj.getBoolean("enableMicrophone");
                if (obj.has("enableDownloads")) ENABLE_DOWNLOADS = obj.getBoolean("enableDownloads");
                if (obj.has("enablePullToRefresh")) ENABLE_PULL_TO_REFRESH = obj.getBoolean("enablePullToRefresh");
                if (obj.has("allowExternalLinks")) ALLOW_EXTERNAL_LINKS = obj.getBoolean("allowExternalLinks");
                if (obj.has("openExternalInBrowser")) OPEN_EXTERNAL_IN_BROWSER = obj.getBoolean("openExternalInBrowser");
                if (obj.has("offlineCacheEnabled")) OFFLINE_CACHE_ENABLED = obj.getBoolean("offlineCacheEnabled");
            }
        } catch (Exception ignored) {
        }
        initialized = true;
    }
}
`;
    const appConfigPath = path.join(buildDir, 'app', 'src', 'main', 'java', 'com', 'htmltoapk', 'template', 'AppConfig.java');
    fs.writeFileSync(appConfigPath, appConfigJava);

    // Also write assets/app-config.json
    const assetsDir = path.join(buildDir, 'app', 'src', 'main', 'assets');
    fs.mkdirSync(assetsDir, { recursive: true });
    const appConfigJson = {
      appName: project.name,
      orientation: project.orientation || 'unspecified',
      entryPoint: project.entryPoint.replace(/\\/g, '/'),
      enableJavaScript: project.webviewConfig.enableJavaScript,
      enableDomStorage: project.webviewConfig.enableDomStorage,
      enableDatabase: project.webviewConfig.enableLocalStorage,
      enableGeolocation: project.webviewConfig.enableGeolocation,
      enableZoom: project.webviewConfig.enableZoom,
      enableFileUpload: project.webviewConfig.enableFileUpload,
      enableCamera: project.webviewConfig.enableCameraAccess,
      enableMicrophone: project.webviewConfig.enableMicrophoneAccess,
      enableDownloads: project.webviewConfig.enableDownloadSupport,
      enablePullToRefresh: true,
      allowExternalLinks: project.webviewConfig.enableExternalLinks,
      openExternalInBrowser: true,
      offlineCacheEnabled: project.webviewConfig.enableOfflineMode
    };
    fs.writeFileSync(path.join(assetsDir, 'app-config.json'), JSON.stringify(appConfigJson, null, 2), 'utf-8');

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
    let resolvedIconPath: string | null = null;
    if (project.iconPath && fs.existsSync(project.iconPath)) {
      resolvedIconPath = project.iconPath;
    } else {
      const projectDir = path.join(getProjectsDir(), project.id);
      for (const ext of ['.png', '.jpg', '.jpeg', '.webp']) {
        const candidate = path.join(projectDir, `icon${ext}`);
        if (fs.existsSync(candidate)) {
          resolvedIconPath = candidate;
          break;
        }
      }
    }

    if (resolvedIconPath && fs.existsSync(resolvedIconPath)) {
      this.applyCustomIcon(resolvedIconPath, buildDir);
    }

    return buildDir;
  }

  /**
   * Applies custom app icon if provided (copies PNG to mipmap densities).
   */
  private static applyCustomIcon(iconPath: string, buildDir: string) {
    try {
      const resDir = path.join(buildDir, 'app', 'src', 'main', 'res');
      
      // Remove anydpi-v26 adaptive vector xmls so Android uses raster PNG icons on all devices
      const anyDpiDir = path.join(resDir, 'mipmap-anydpi-v26');
      if (fs.existsSync(anyDpiDir)) {
        fs.rmSync(anyDpiDir, { recursive: true, force: true });
      }

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
