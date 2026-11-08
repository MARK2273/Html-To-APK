import AdmZip from 'adm-zip';
import path from 'node:path';
import fs from 'node:fs';
import { isSafePath, sanitizeFilename } from '../utils/security.js';

export interface ExtractedWebsiteInfo {
  entryPoints: string[];
  defaultEntryPoint: string;
  totalFiles: number;
  totalSize: number;
  files: Array<{
    relativePath: string;
    size: number;
    isDirectory: boolean;
  }>;
}

const MAX_UNCOMPRESSED_SIZE = 250 * 1024 * 1024; // 250 MB
const MAX_FILE_COUNT = 3000;
const MAX_COMPRESSION_RATIO = 100; // 100:1 limit for zip bombs

export class ZipService {
  /**
   * Safely extracts a zip file with Zip Slip and Zip Bomb protections.
   */
  static extractWebsiteZip(zipFilePath: string, destinationDir: string): ExtractedWebsiteInfo {
    if (!fs.existsSync(zipFilePath)) {
      throw new Error(`Zip file not found at: ${zipFilePath}`);
    }

    if (!fs.existsSync(destinationDir)) {
      fs.mkdirSync(destinationDir, { recursive: true });
    }

    const zip = new AdmZip(zipFilePath);
    const entries = zip.getEntries();

    if (entries.length > MAX_FILE_COUNT) {
      throw new Error(`Zip archive exceeds maximum allowed file count (${MAX_FILE_COUNT}).`);
    }

    let totalUncompressedSize = 0;
    const stat = fs.statSync(zipFilePath);
    const zipFileSize = stat.size;

    // Validate entries before extraction
    for (const entry of entries) {
      if (entry.isDirectory) continue;

      totalUncompressedSize += entry.header.size;

      if (totalUncompressedSize > MAX_UNCOMPRESSED_SIZE) {
        throw new Error(`Zip archive contents exceed maximum allowed uncompressed size (${MAX_UNCOMPRESSED_SIZE / (1024 * 1024)} MB).`);
      }

      if (zipFileSize > 0 && entry.header.compressedSize > 0) {
        const ratio = entry.header.size / entry.header.compressedSize;
        if (ratio > MAX_COMPRESSION_RATIO) {
          throw new Error(`Suspicious compression ratio detected on entry: ${entry.entryName} (Possible zip bomb).`);
        }
      }

      // Zip Slip protection
      if (!isSafePath(destinationDir, entry.entryName)) {
        throw new Error(`Zip Slip attack detected in entry: ${entry.entryName}`);
      }
    }

    // Extract entries safely
    for (const entry of entries) {
      const sanitizedRelativePath = entry.entryName.split('/').map(p => p.trim()).filter(Boolean).join(path.sep);
      const outPath = path.join(destinationDir, sanitizedRelativePath);

      if (entry.isDirectory) {
        if (!fs.existsSync(outPath)) {
          fs.mkdirSync(outPath, { recursive: true });
        }
      } else {
        const parentDir = path.dirname(outPath);
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true });
        }
        fs.writeFileSync(outPath, entry.getData());
      }
    }

    return this.scanWebsiteDirectory(destinationDir);
  }

  /**
   * Scans an extracted or uploaded directory to identify entry points and file tree.
   */
  static scanWebsiteDirectory(directory: string): ExtractedWebsiteInfo {
    const files: Array<{ relativePath: string; size: number; isDirectory: boolean }> = [];
    const entryPoints: string[] = [];
    let totalSize = 0;

    function walk(currentDir: string, relativePrefix = '') {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const ent of entries) {
        const relPath = relativePrefix ? `${relativePrefix}/${ent.name}` : ent.name;
        const fullPath = path.join(currentDir, ent.name);

        if (ent.isDirectory()) {
          files.push({ relativePath: relPath, size: 0, isDirectory: true });
          walk(fullPath, relPath);
        } else {
          const s = fs.statSync(fullPath);
          totalSize += s.size;
          files.push({ relativePath: relPath, size: s.size, isDirectory: false });

          if (ent.name.toLowerCase().endsWith('.html') || ent.name.toLowerCase().endsWith('.htm')) {
            entryPoints.push(relPath);
          }
        }
      }
    }

    if (fs.existsSync(directory)) {
      walk(directory);
    }

    // Sort entry points: root index.html first, then any index.html, then others
    entryPoints.sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      if (aLower === 'index.html') return -1;
      if (bLower === 'index.html') return 1;
      if (aLower.endsWith('/index.html')) return -1;
      if (bLower.endsWith('/index.html')) return 1;
      return a.localeCompare(b);
    });

    const defaultEntryPoint = entryPoints.length > 0 ? entryPoints[0] : 'index.html';

    return {
      entryPoints,
      defaultEntryPoint,
      totalFiles: files.filter(f => !f.isDirectory).length,
      totalSize,
      files
    };
  }
}

