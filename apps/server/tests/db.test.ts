import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDb, closeDb, DatabaseAdapter } from '../src/db/db.js';
import { runMigrations } from '../src/db/migrations.js';

describe('Database Adapter & Migrations', () => {
  let db: DatabaseAdapter;

  beforeEach(() => {
    // In-memory database for isolated testing
    db = getDb(':memory:');
    runMigrations(db);
  });

  afterEach(() => {
    db.close();
  });

  it('initializes all tables and seeds default settings', () => {
    const settings = db.prepare('SELECT * FROM settings').all();
    expect(settings.length).toBeGreaterThan(0);

    const defaultProvider = db.prepare('SELECT value_json FROM settings WHERE key = ?').get('selected_provider') as any;
    expect(defaultProvider).toBeDefined();
    expect(JSON.parse(defaultProvider.value_json)).toBe('offline_quick_split');
  });

  it('enforces foreign key cascading deletions', () => {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO brain_dumps (id, raw_text, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run('bd_1', 'study for test', 'parsed', now, now);

    db.prepare(`
      INSERT INTO candidates (id, brain_dump_id, title, estimated_duration, priority, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('cand_1', 'bd_1', 'study for test', 60, 'P1', now, now);

    const candidateBefore = db.prepare('SELECT * FROM candidates WHERE id = ?').get('cand_1');
    expect(candidateBefore).toBeDefined();

    // Delete parent brain dump
    db.prepare('DELETE FROM brain_dumps WHERE id = ?').run('bd_1');

    // Child candidate should be deleted via ON DELETE CASCADE
    const candidateAfter = db.prepare('SELECT * FROM candidates WHERE id = ?').get('cand_1');
    expect(candidateAfter).toBeUndefined();
  });

  it('rolls back transactions cleanly on error', () => {
    const now = new Date().toISOString();

    expect(() => {
      db.transaction(() => {
        db.prepare(`
          INSERT INTO brain_dumps (id, raw_text, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?)
        `).run('bd_rollback', 'test raw', 'pending', now, now);

        // Throw error inside transaction
        throw new Error('Forced error inside transaction');
      });
    }).toThrow('Forced error inside transaction');

    // Must have rolled back
    const dumped = db.prepare('SELECT * FROM brain_dumps WHERE id = ?').get('bd_rollback');
    expect(dumped).toBeUndefined();
  });
});
