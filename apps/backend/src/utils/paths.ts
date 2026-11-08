import path from 'node:path';
import fs from 'node:fs';

export function getStorageDir(): string {
  if (process.env.STORAGE_PATH) {
    return path.resolve(process.env.STORAGE_PATH);
  }
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return '/tmp/storage';
  }
  if (process.cwd().endsWith('backend')) {
    return path.resolve(process.cwd(), '../../storage');
  }
  return path.resolve(process.cwd(), 'storage');
}

export function ensureDir(dirPath: string): string {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
}

export function getProjectsDir(): string {
  return ensureDir(path.join(getStorageDir(), 'projects'));
}

export function getUploadsDir(): string {
  return ensureDir(path.join(getStorageDir(), 'temp', 'uploads'));
}

export function getBuildsDir(): string {
  return ensureDir(path.join(getStorageDir(), 'builds'));
}

export function getTempDir(): string {
  return ensureDir(path.join(getStorageDir(), 'temp'));
}
