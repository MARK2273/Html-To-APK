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
      const systemGradle = !isWindows && fs.existsSync('/opt/gradle/bin/gradle') ? '/opt/gradle/bin/gradle' : undefined;
      const gradlewName = isWindows ? 'gradlew.bat' : 'gradlew';
      const gradlewPath = path.join(projectDir, gradlewName);
      const execPath = systemGradle || gradlewPath;

      if (!fs.existsSync(execPath)) {
        return resolve({
          success: false,
          logs: [],
          error: `Gradle executable not found at ${execPath}`
        });
      }

      // Ensure executable permissions on Linux / macOS
      if (!isWindows) {
        try {
          fs.chmodSync(execPath, 0o755);
        } catch (e: any) {
          Logger.warn(`Failed to chmod ${execPath}: ${e.message}`);
        }
      }

      const env: NodeJS.ProcessEnv = {
        ...process.env,
        ANDROID_HOME: options.androidSdkPath || process.env.ANDROID_HOME,
        ANDROID_SDK_ROOT: options.androidSdkPath || process.env.ANDROID_SDK_ROOT,
        JAVA_HOME: options.javaHome || process.env.JAVA_HOME,
        LD_PRELOAD: fs.existsSync('/opt/libgradle_shim.so') ? '/opt/libgradle_shim.so' : process.env.LD_PRELOAD,
        NO_PROXY: 'localhost,127.0.0.1',
        no_proxy: 'localhost,127.0.0.1'
      };

      // Unset JVM hook and proxy variables that break Gradle IPC and process pipes
      delete env._JAVA_OPTIONS;
      delete env.JAVA_TOOL_OPTIONS;
      delete env.HTTP_PROXY;
      delete env.http_proxy;
      delete env.HTTPS_PROXY;
      delete env.https_proxy;
      delete env.ALL_PROXY;
      delete env.all_proxy;

      // Free Node heap before launching Gradle
      if ((global as any).gc) {
        try {
          (global as any).gc();
        } catch {}
      }

      // Cleanup any prior orphaned Gradle processes on Linux before starting
      if (!isWindows) {
        try {
          const { execSync } = require('node:child_process');
          execSync('pkill -9 -f "org.gradle.launcher" || true', { stdio: 'ignore' });
        } catch {}
      }

      // Cap launcher JVM memory via GRADLE_OPTS so client wrapper remains tiny (~35MB)
      env.GRADLE_OPTS = '-Xms16m -Xmx48m -XX:MaxMetaspaceSize=48m -XX:+UseSerialGC -Dfile.encoding=UTF-8';

      const args = isWindows
        ? ['/c', 'gradlew.bat', task, '--no-daemon', '--stacktrace']
        : [task, '--no-daemon', '--stacktrace'];

      const cmd = isWindows ? 'cmd.exe' : execPath;
      Logger.info(`Spawning ${cmd} ${args.join(' ')} in ${projectDir}`);

      const child = spawn(cmd, args, {
        cwd: projectDir,
        env,
        shell: false
      });

      // 10-minute safety timeout to prevent stuck child processes
      const timeoutMs = 10 * 60 * 1000;
      const killTimer = setTimeout(() => {
        Logger.warn(`Gradle build timed out after ${timeoutMs / 1000}s. Terminating...`);
        try {
          child.kill('SIGTERM');
          setTimeout(() => {
            if (!child.killed) child.kill('SIGKILL');
          }, 5000);
        } catch {}
      }, timeoutMs);

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
        clearTimeout(killTimer);
        Logger.error(`Gradle process spawn error: ${err.message}`);
        resolve({
          success: false,
          logs,
          error: `Failed to spawn Gradle: ${err.message}`
        });
      });

      child.on('close', (code) => {
        clearTimeout(killTimer);
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
