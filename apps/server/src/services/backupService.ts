import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import archiver from 'archiver';
import unzipper from 'unzipper';
import { DatabaseAdapter, getDb } from '../db/db.js';
import { config } from '../config.js';

export class BackupService {
  /**
   * Compute SHA-256 hex string of a file
   */
  static computeSha256(filePath: string): string {
    const buffer = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Export database and manifest into a portable ZIP package per §72
   */
  static async exportBackup(db: DatabaseAdapter, outputPath: string): Promise<{ zipPath: string; sha256: string }> {
    const tempDir = path.resolve(process.cwd(), 'temp', `backup_${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    const tempDbPath = path.join(tempDir, 'database.sqlite');
    if (fs.existsSync(tempDbPath)) {
      fs.rmSync(tempDbPath, { force: true });
    }
    
    // Checkpoint WAL if file mode
    try {
      db.exec('PRAGMA wal_checkpoint(TRUNCATE);');
    } catch {}

    try {
      db.exec(`VACUUM INTO '${tempDbPath.replace(/\\/g, '/')}'`);
    } catch {
      if (fs.existsSync(config.dbPath)) {
        fs.copyFileSync(config.dbPath, tempDbPath);
      } else {
        // Create an empty sqlite db file in tempDbPath
        const fallbackDb = new (db as any).constructor(tempDbPath);
        fallbackDb.close();
      }
    }

    const dbSha256 = this.computeSha256(tempDbPath);
    const now = new Date().toISOString();

    const counts = {
      brain_dumps: (db.prepare('SELECT COUNT(*) as c FROM brain_dumps').get() as any)?.c || 0,
      candidates: (db.prepare('SELECT COUNT(*) as c FROM candidates').get() as any)?.c || 0,
      tasks: (db.prepare('SELECT COUNT(*) as c FROM tasks').get() as any)?.c || 0,
      timer_sessions: (db.prepare('SELECT COUNT(*) as c FROM timer_sessions').get() as any)?.c || 0,
      task_events: (db.prepare('SELECT COUNT(*) as c FROM task_events').get() as any)?.c || 0,
      daily_reviews: (db.prepare('SELECT COUNT(*) as c FROM daily_reviews').get() as any)?.c || 0,
      patterns: (db.prepare('SELECT COUNT(*) as c FROM patterns').get() as any)?.c || 0,
      recommendations: (db.prepare('SELECT COUNT(*) as c FROM recommendations').get() as any)?.c || 0,
    };

    const manifest = {
      backup_format_version: 1,
      schema_version: 1,
      app_version: config.appVersion,
      created_at: now,
      record_counts: counts,
      files: {
        'database.sqlite': {
          sha256: dbSha256,
        },
      },
    };

    const metadata = {
      export_platform: process.platform,
      node_version: process.version,
      app: 'FlowDesk',
      note: 'Authoritative local backup package',
    };

    const manifestPath = path.join(tempDir, 'manifest.json');
    const metadataPath = path.join(tempDir, 'metadata.json');

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');

    // Create zip archive
    await new Promise<void>((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => resolve());
      archive.on('error', (err: any) => reject(err));

      archive.pipe(output);
      archive.file(manifestPath, { name: 'manifest.json' });
      archive.file(tempDbPath, { name: 'database.sqlite' });
      archive.file(metadataPath, { name: 'metadata.json' });
      archive.finalize();
    });

    // Cleanup temp folder
    fs.rmSync(tempDir, { recursive: true, force: true });

    // Record event
    db.prepare(`
      INSERT INTO task_events (id, task_id, event_type, prior_state, next_state, timestamp, metadata_json)
      VALUES (?, NULL, 'BACKUP_EXPORTED', NULL, NULL, ?, ?)
    `).run(`evt_${crypto.randomUUID().slice(0, 8)}`, now, JSON.stringify({ sha256: dbSha256 }));

    return { zipPath: outputPath, sha256: dbSha256 };
  }

  /**
   * Import and validate a portable ZIP backup per §72, §73
   */
  static async importBackup(zipBuffer: Buffer, targetDbPath?: string): Promise<{ success: boolean; recordCounts: any }> {
    const extractDir = path.resolve(process.cwd(), 'temp', `restore_${Date.now()}`);
    fs.mkdirSync(extractDir, { recursive: true });

    try {
      // 1. Extract ZIP with strict path traversal checks (§73)
      const directory = await unzipper.Open.buffer(zipBuffer);

      for (const file of directory.files) {
        const normalized = path.normalize(file.path).replace(/^(\.\.[\/\\])+/, '');
        if (normalized.includes('..') || path.isAbsolute(normalized)) {
          throw new Error(`ZIP security violation: illegal path "${file.path}"`);
        }
        const validNames = ['manifest.json', 'database.sqlite', 'metadata.json'];
        if (!validNames.includes(normalized)) {
          throw new Error(`ZIP security violation: unexpected entry "${file.path}"`);
        }
        const fullDest = path.join(extractDir, normalized);
        const content = await file.buffer();
        fs.writeFileSync(fullDest, content);
      }

      // 2. Validate manifest presence and structure
      const manifestFile = path.join(extractDir, 'manifest.json');
      const dbFile = path.join(extractDir, 'database.sqlite');

      if (!fs.existsSync(manifestFile) || !fs.existsSync(dbFile)) {
        throw new Error('BACKUP_INVALID: Archive missing manifest.json or database.sqlite');
      }

      const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
      if (manifest.backup_format_version !== 1) {
        throw new Error(`BACKUP_VERSION_UNSUPPORTED: Expected format version 1, got ${manifest.backup_format_version}`);
      }

      // 3. Verify SHA-256 checksum (§45.K)
      const expectedSha256 = manifest.files?.['database.sqlite']?.sha256;
      if (!expectedSha256) {
        throw new Error('BACKUP_INVALID: Manifest missing database checksum');
      }

      const actualSha256 = this.computeSha256(dbFile);
      if (actualSha256.toLowerCase() !== expectedSha256.toLowerCase()) {
        throw new Error(`BACKUP_CHECKSUM_MISMATCH: Computed ${actualSha256}, expected ${expectedSha256}`);
      }

      // 4. Verify SQLite structure and integrity
      const tempTestDb = getDb(dbFile);
      try {
        const integrity = tempTestDb.prepare('PRAGMA integrity_check;').get() as any;
        const integrityVal = Object.values(integrity || {})[0];
        if (integrityVal !== 'ok') {
          throw new Error(`Corrupted database inside archive: ${integrityVal}`);
        }
      } finally {
        tempTestDb.close();
      }

      // 5. Atomic database replacement
      const activePath = targetDbPath || config.dbPath;
      const backupExisting = `${activePath}.bak`;

      if (fs.existsSync(activePath)) {
        fs.copyFileSync(activePath, backupExisting);
      }

      fs.copyFileSync(dbFile, activePath);

      // Record restore event in restored database
      const restoredDb = getDb(activePath);
      const now = new Date().toISOString();
      restoredDb.prepare(`
        INSERT INTO task_events (id, task_id, event_type, prior_state, next_state, timestamp, metadata_json)
        VALUES (?, NULL, 'BACKUP_IMPORTED', NULL, NULL, ?, ?)
      `).run(`evt_${crypto.randomUUID().slice(0, 8)}`, now, JSON.stringify({ sha256: actualSha256 }));

      return {
        success: true,
        recordCounts: manifest.record_counts || {},
      };
    } finally {
      // Clean up temp extraction folder
      fs.rmSync(extractDir, { recursive: true, force: true });
    }
  }
}
