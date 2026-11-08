import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { EnvironmentStatus } from '../types/index.js';

export class EnvironmentService {
  private static cachedStatus: EnvironmentStatus | null = null;
  private static lastCheckTime = 0;

  static checkEnvironment(forceRefresh = false): EnvironmentStatus {
    const now = Date.now();
    if (!forceRefresh && this.cachedStatus && now - this.lastCheckTime < 10000) {
      return this.cachedStatus;
    }

    const issues: string[] = [];
    const suggestions: string[] = [];

    // 1. Operating System
    const osInfo = {
      platform: os.platform(),
      type: os.type(),
      release: os.release()
    };

    // 2. Java Check
    let javaInstalled = false;
    let javaVersion = '';
    const javaHome = process.env.JAVA_HOME || '';

    try {
      const javaOutput = execSync('java -version 2>&1', { encoding: 'utf-8' });
      const versionMatch = javaOutput.match(/(?:version|openjdk) "([^"]+)"/i);
      if (versionMatch) {
        javaVersion = versionMatch[1];
        javaInstalled = true;
      } else {
        javaVersion = javaOutput.split('\n')[0].trim();
        javaInstalled = true;
      }
    } catch {
      javaInstalled = false;
    }

    const javaValid = javaInstalled;
    if (!javaInstalled) {
      issues.push('Java JDK is not found on PATH.');
      if (osInfo.platform === 'linux') {
        suggestions.push('Install OpenJDK 17 or 21 on Ubuntu: sudo apt update && sudo apt install -y openjdk-17-jdk');
      } else {
        suggestions.push('Download and install OpenJDK 17 or 21 from Amazon Corretto or Adoptium, and set JAVA_HOME.');
      }
    }

    // 3. Android SDK Check
    const sdkPathsToCheck = [
      process.env.ANDROID_HOME,
      process.env.ANDROID_SDK_ROOT,
      'D:\\Android\\sdk',
      path.join(os.homedir(), 'Android', 'Sdk'),
      path.join(os.homedir(), 'AppData', 'Local', 'Android', 'Sdk'),
      '/usr/lib/android-sdk',
      '/opt/android-sdk'
    ].filter(Boolean) as string[];

    let detectedSdkPath: string | undefined;
    const platforms: string[] = [];
    const buildTools: string[] = [];

    for (const sdkPath of sdkPathsToCheck) {
      if (fs.existsSync(sdkPath)) {
        detectedSdkPath = sdkPath;
        // Check platforms
        const platformsDir = path.join(sdkPath, 'platforms');
        if (fs.existsSync(platformsDir)) {
          const list = fs.readdirSync(platformsDir);
          platforms.push(...list.filter(p => p.startsWith('android-')));
        }
        // Check build-tools
        const buildToolsDir = path.join(sdkPath, 'build-tools');
        if (fs.existsSync(buildToolsDir)) {
          const list = fs.readdirSync(buildToolsDir);
          buildTools.push(...list);
        }
        break;
      }
    }

    const androidSdkInstalled = !!detectedSdkPath;
    let androidSdkValid = false;

    if (!androidSdkInstalled) {
      issues.push('Android SDK is not installed or ANDROID_HOME is not set.');
      if (osInfo.platform === 'linux') {
        suggestions.push('Install Android SDK Command-line Tools and export ANDROID_HOME in ~/.bashrc.');
      } else {
        suggestions.push('Install Android SDK via Android Studio or Command-line Tools and set ANDROID_HOME.');
      }
    } else {
      if (platforms.length === 0) {
        issues.push(`Android SDK located at ${detectedSdkPath} has no platforms installed.`);
        suggestions.push('Install an Android platform: sdkmanager "platforms;android-34"');
      }
      if (buildTools.length === 0) {
        issues.push(`Android SDK located at ${detectedSdkPath} has no build-tools installed.`);
        suggestions.push('Install build tools: sdkmanager "build-tools;34.0.0"');
      }
      androidSdkValid = platforms.length > 0 && buildTools.length > 0;
    }

    // 4. Gradle Check
    let gradleInstalled = false;
    let gradleVersion = '';
    try {
      const gradleOutput = execSync('gradle -v 2>&1', { encoding: 'utf-8' });
      const gMatch = gradleOutput.match(/Gradle\s+([\d.]+)/i);
      if (gMatch) {
        gradleVersion = gMatch[1];
        gradleInstalled = true;
      }
    } catch {
      gradleInstalled = false;
    }

    // Check template wrapper
    const templateWrapperPath = path.resolve(process.cwd(), '../../android/webview-template/gradlew');
    const wrapperAvailable = fs.existsSync(templateWrapperPath) || fs.existsSync(templateWrapperPath + '.bat');

    const isReady = javaValid && androidSdkValid && (gradleInstalled || wrapperAvailable);

    const status: EnvironmentStatus = {
      isReady,
      os: osInfo,
      java: {
        installed: javaInstalled,
        version: javaVersion,
        javaHome,
        valid: javaValid
      },
      androidSdk: {
        installed: androidSdkInstalled,
        sdkPath: detectedSdkPath,
        platforms,
        buildTools,
        valid: androidSdkValid
      },
      gradle: {
        installed: gradleInstalled,
        version: gradleVersion,
        wrapperAvailable
      },
      issues,
      suggestions
    };

    this.cachedStatus = status;
    this.lastCheckTime = now;
    return status;
  }
}

