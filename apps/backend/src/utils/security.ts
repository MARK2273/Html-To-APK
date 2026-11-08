import path from 'node:path';

// Valid Android package name regex: e.g. com.example.myapp
// At least two segments, each starting with a letter, containing letters, numbers, and underscores.
// No Java keywords allowed.
const PACKAGE_NAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/;

const JAVA_KEYWORDS = new Set([
  'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const',
  'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final', 'finally', 'float',
  'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int', 'interface', 'long', 'native',
  'new', 'package', 'private', 'protected', 'public', 'return', 'short', 'static', 'strictfp',
  'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'try', 'void',
  'volatile', 'while'
]);

export function validatePackageName(packageName: string): { valid: boolean; error?: string } {
  if (!packageName || typeof packageName !== 'string') {
    return { valid: false, error: 'Package name is required.' };
  }

  const trimmed = packageName.trim();
  if (trimmed.length > 255) {
    return { valid: false, error: 'Package name cannot exceed 255 characters.' };
  }

  if (!PACKAGE_NAME_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: 'Package name must have at least two segments separated by dots (e.g. com.example.app) and start with a letter.'
    };
  }

  const parts = trimmed.split('.');
  for (const part of parts) {
    if (JAVA_KEYWORDS.has(part.toLowerCase())) {
      return {
        valid: false,
        error: `Package name segment "${part}" is a reserved Java keyword.`
      };
    }
  }

  return { valid: true };
}

/**
 * Validates against directory traversal (Zip Slip protection).
 * Ensures that resolving target relative to destination does not escape destination.
 */
export function isSafePath(destinationDir: string, relativePath: string): boolean {
  const safeDest = path.resolve(destinationDir);
  const targetPath = path.resolve(destinationDir, relativePath);
  return targetPath.startsWith(safeDest + path.sep) || targetPath === safeDest;
}

/**
 * Sanitizes a file name to avoid path traversal characters and invalid characters.
 */
export function sanitizeFilename(filename: string): string {
  return path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
}

