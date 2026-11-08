import { spawn } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { Logger } from '../utils/logger.js';

export interface GradleBuildResult {
  success: boolean;
  apkPath?: string;
  aabPath?: string;
  logs: string[];
  error?: string;
}

export class GradleService {
  /**
   * Executes Gradle build in the specified project directory.
   */
  static runGradleBuild(
    projectDir: string,
    task: 'assembleDebug' | 'assembleRelease' | 'bundleRelease',
    options: {
      androidSdkPath?: string;
      javaHome?: string;
      onLog?: (line: string) => void;
      onProgress?: (progressText: string, percent: number) => void;
    }
  ): Promise<GradleBuildResult> {
    return new Promise((resolve) => {
      const isWindows = os.platform() === 'win32';
      const gradlewName = isWindows ? 'gradlew.bat' : 'gradlew';
      const gradlewPath = path.join(projectDir, gradlewName);

      if (!fs.existsSync(gradlewPath)) {
        return resolve({
          success: false,
          logs: [],
          error: `Gradle wrapper not found at ${gradlewPath}`
        });
      }

      // Ensure executable permissions on Linux / macOS
      if (!isWindows) {
        try {
          fs.chmodSync(gradlewPath, 0o755);
        } catch (e: any) {
          Logger.warn(`Failed to chmod gradlew: ${e.message}`);
        }
      }

      const env: NodeJS.ProcessEnv = {
        ...process.env,
        ANDROID_HOME: options.androidSdkPath || process.env.ANDROID_HOME,
        ANDROID_SDK_ROOT: options.androidSdkPath || process.env.ANDROID_SDK_ROOT,
        JAVA_HOME: options.javaHome || process.env.JAVA_HOME,
        GRADLE_DAEMON_BIND_ADDRESS: '127.0.0.1',
        GRADLE_OPTS: '-Xmx384m -XX:+UseSerialGC -Djava.net.preferIPv4Stack=true',
        _JAVA_OPTIONS: '-Xmx384m -XX:+UseSerialGC -Djava.net.preferIPv4Stack=true',
        NO_PROXY: 'localhost,127.0.0.1',
        no_proxy: 'localhost,127.0.0.1'
      };

      // Unset cloud proxy variables for local Gradle daemon IPC
      delete env.HTTP_PROXY;
      delete env.http_proxy;
      delete env.HTTPS_PROXY;
      delete env.https_proxy;
      delete env.ALL_PROXY;
      delete env.all_proxy;

      const args = isWindows
        ? ['/c', 'gradlew.bat', task, '--stacktrace', '--no-daemon', '--no-parallel', '-Dorg.gradle.daemon=false', '-Djava.net.preferIPv4Stack=true']
        : [task, '--stacktrace', '--no-daemon', '--no-parallel', '-Dorg.gradle.daemon=false', '-Djava.net.preferIPv4Stack=true'];

      const cmd = isWindows ? 'cmd.exe' : gradlewPath;
      Logger.info(`Spawning ${cmd} ${args.join(' ')} in ${projectDir}`);

      const child = spawn(cmd, args, {
        cwd: projectDir,
        env,
        shell: false
      });

      const logs: string[] = [];
      let totalTasks = 30;
      let completedTasks = 0;

      const handleOutput = (data: Buffer) => {
        const lines = data.toString().split(/\r?\n/);
        for (const line of lines) {
          if (!line.trim()) continue;
          logs.push(line);
          options.onLog?.(line);

          // Detect task progress
          if (line.startsWith('> Task :')) {
            completedTasks++;
            const taskName = line.replace('> Task :', '').split(' ')[0];
            const percent = Math.min(95, Math.round((completedTasks / totalTasks) * 80) + 15);
            options.onProgress?.(`Compiling: ${taskName}`, percent);
          }
        }
      };

      child.stdout.on('data', handleOutput);
      child.stderr.on('data', handleOutput);

      child.on('error', (err) => {
        Logger.error(`Gradle process spawn error: ${err.message}`);
        resolve({
          success: false,
          logs,
          error: `Failed to spawn Gradle: ${err.message}`
        });
      });

      child.on('close', (code) => {
        if (code === 0) {
          Logger.info('Gradle build succeeded.');

          // Locate generated APK or AAB
          const outputsDir = path.join(projectDir, 'app', 'build', 'outputs');
          let apkPath: string | undefined;
          let aabPath: string | undefined;

          // Search for apk
          const apkDir = path.join(outputsDir, 'apk');
          if (fs.existsSync(apkDir)) {
            const findApk = (dir: string): string | undefined => {
              const entries = fs.readdirSync(dir, { withFileTypes: true });
              for (const e of entries) {
                const full = path.join(dir, e.name);
                if (e.isDirectory()) {
                  const res = findApk(full);
                  if (res) return res;
                } else if (e.name.endsWith('.apk')) {
                  return full;
                }
              }
              return undefined;
            };
            apkPath = findApk(apkDir);
          }

          // Search for aab
          const bundleDir = path.join(outputsDir, 'bundle');
          if (fs.existsSync(bundleDir)) {
            const findAab = (dir: string): string | undefined => {
              const entries = fs.readdirSync(dir, { withFileTypes: true });
              for (const e of entries) {
                const full = path.join(dir, e.name);
                if (e.isDirectory()) {
                  const res = findAab(full);
                  if (res) return res;
                } else if (e.name.endsWith('.aab')) {
                  return full;
                }
              }
              return undefined;
            };
            aabPath = findAab(bundleDir);
          }

          resolve({
            success: true,
            apkPath,
            aabPath,
            logs
          });
        } else {
          Logger.error(`Gradle build failed with exit code ${code}`);
          const failureLines = logs.filter(l => l.includes('FAILURE:') || l.includes('What went wrong:') || l.includes('error:'));
          const errorMsg = failureLines.length > 0 ? failureLines.join('\n') : `Gradle build failed with exit code ${code}`;
          resolve({
            success: false,
            logs,
            error: errorMsg
          });
        }
      });
    });
  }
}
