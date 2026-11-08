import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { Logger } from '../utils/logger.js';

export interface SigningConfig {
  keystorePath?: string;
  keystorePassword?: string;
  keyAlias?: string;
  keyPassword?: string;
}

export class SigningService {
  /**
   * Signs an APK using apksigner from Android SDK build-tools.
   */
  static signApk(
    apkPath: string,
    buildToolsDir: string,
    config: SigningConfig
  ): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      if (!config.keystorePath || !fs.existsSync(config.keystorePath)) {
        return resolve({ success: false, error: 'Keystore file not found.' });
      }

      const apksignerName = process.platform === 'win32' ? 'apksigner.bat' : 'apksigner';
      const apksignerPath = path.join(buildToolsDir, apksignerName);

      if (!fs.existsSync(apksignerPath)) {
        return resolve({ success: false, error: `apksigner not found at ${apksignerPath}` });
      }

      const args = [
        'sign',
        '--ks', config.keystorePath,
        '--ks-key-alias', config.keyAlias || 'key0',
        '--ks-pass', `pass:${config.keystorePassword || ''}`
      ];

      if (config.keyPassword) {
        args.push('--key-pass', `pass:${config.keyPassword}`);
      }

      args.push(apkPath);

      Logger.info(`Signing APK at: ${apkPath} (credentials securely masked)`);

      const child = spawn(apksignerPath, args, { shell: process.platform === 'win32' });
      let stderr = '';

      child.stderr.on('data', (d) => {
        stderr += d.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          Logger.info('APK signed successfully.');
          resolve({ success: true });
        } else {
          // Clean stderr to remove any potential credential leaks
          const sanitizedError = stderr.replace(/pass:[^\s]+/g, 'pass:*****');
          Logger.error(`apksigner failed: ${sanitizedError}`);
          resolve({ success: false, error: sanitizedError });
        }
      });
    });
  }
}

