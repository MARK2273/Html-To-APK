import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { Logger } from '../utils/logger.js';

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }

  const storageDir = path.resolve(process.cwd(), '../../storage');
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  const dbPath = path.join(storageDir, 'database.sqlite');
  Logger.info(`Initializing SQLite database at: ${dbPath}`);

  dbInstance = new DatabaseSync(dbPath);

  // Enable WAL mode for high performance
  dbInstance.exec('PRAGMA journal_mode = WAL;');

  initSchema(dbInstance);
  return dbInstance;
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      package_name TEXT NOT NULL,
      version_name TEXT NOT NULL,
      version_code INTEGER NOT NULL,
      description TEXT,
      min_sdk INTEGER NOT NULL DEFAULT 24,
      target_sdk INTEGER NOT NULL DEFAULT 34,
      orientation TEXT NOT NULL DEFAULT 'unspecified',
      permissions TEXT NOT NULL,
      webview_config TEXT NOT NULL,
      entry_point TEXT NOT NULL DEFAULT 'index.html',
      icon_path TEXT,
      splash_path TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS builds (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      build_type TEXT NOT NULL DEFAULT 'debug',
      status TEXT NOT NULL DEFAULT 'pending',
      start_time TEXT NOT NULL,
      end_time TEXT,
      duration_ms INTEGER,
      apk_path TEXT,
      apk_size INTEGER,
      aab_path TEXT,
      logs TEXT NOT NULL DEFAULT '',
      error_message TEXT,
      config_snapshot TEXT,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_builds_project_id ON builds(project_id);
    CREATE INDEX IF NOT EXISTS idx_builds_status ON builds(status);
  `);

  Logger.info('SQLite schema initialized successfully.');
}

