import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { config } from '../config.js';

const nodeRequire = createRequire(import.meta.url);
const { DatabaseSync } = nodeRequire('node:sqlite');

export interface Statement<T = any> {
  get(...params: any[]): T | undefined;
  all(...params: any[]): T[];
  run(...params: any[]): { changes: number | bigint; lastInsertRowid: number | bigint };
}

export interface DatabaseAdapter {
  prepare<T = any>(sql: string): Statement<T>;
  exec(sql: string): void;
  transaction<T>(fn: () => T): T;
  close(): void;
  rawDb: any;
}

class FlowDeskDatabase implements DatabaseAdapter {
  private db: any;

  constructor(filePath?: string) {
    const targetPath = filePath || config.dbPath;
    if (targetPath !== ':memory:') {
      const dir = path.dirname(targetPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
    this.db = new DatabaseSync(targetPath);

    // Enforce WAL mode, foreign keys, and concurrency configuration per §45.C, §45.F
    if (targetPath !== ':memory:') {
      this.db.exec('PRAGMA journal_mode = WAL;');
    }
    this.db.exec('PRAGMA foreign_keys = ON;');
    this.db.exec('PRAGMA busy_timeout = 5000;');
    this.db.exec('PRAGMA synchronous = NORMAL;');
  }

  get rawDb(): any {
    return this.db;
  }

  prepare<T = any>(sql: string): Statement<T> {
    const stmt = this.db.prepare(sql);
    return {
      get: (...params: any[]) => {
        // Node:sqlite StatementSync.get returns object or undefined
        return stmt.get(...params) as T | undefined;
      },
      all: (...params: any[]) => {
        // Node:sqlite StatementSync.all returns array of objects
        return stmt.all(...params) as T[];
      },
      run: (...params: any[]) => {
        return stmt.run(...params);
      }
    };
  }

  exec(sql: string): void {
    this.db.exec(sql);
  }

  transaction<T>(fn: () => T): T {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const result = fn();
      this.db.exec('COMMIT');
      return result;
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  close(): void {
    this.db.close();
  }
}

// Default singleton instance
let defaultDb: DatabaseAdapter | null = null;

export function getDb(customPath?: string): DatabaseAdapter {
  if (customPath) {
    return new FlowDeskDatabase(customPath);
  }
  if (!defaultDb) {
    defaultDb = new FlowDeskDatabase();
  }
  return defaultDb;
}

export function setDefaultDb(adapter: DatabaseAdapter | null): void {
  defaultDb = adapter;
}

export function closeDb(): void {
  if (defaultDb) {
    defaultDb.close();
    defaultDb = null;
  }
}
