import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDb, DatabaseAdapter } from '../src/db/db.js';
import { runMigrations } from '../src/db/migrations.js';
import { FixService } from '../src/services/fixService.js';

describe('FIX Plan Transaction Engine', () => {
  let db: DatabaseAdapter;

  beforeEach(() => {
    db = getDb(':memory:');
    runMigrations(db);
  });

  afterEach(() => {
    db.close();
  });

  it('promotes candidate tasks atomically to executable tasks with checklist and audit events', () => {
    const now = new Date().toISOString();
    db.prepare('INSERT INTO brain_dumps (id, raw_text, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
      .run('bd_test', 'study edc', 'parsed', now, now);

    db.prepare(`
      INSERT INTO candidates (id, brain_dump_id, title, estimated_duration, priority, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('cand_1', 'bd_test', 'EDC Study', 90, 'P1', now, now);

    const result = FixService.fixPlan(db, 'bd_test', [
      {
        id: 'cand_1',
        title: 'EDC Study',
        estimated_duration: 90,
        priority: 'P1',
        is_included: 1,
        checklist: ['Read notes', 'Solve problems'],
      },
    ]);

    expect(result.tasks.length).toBe(1);
    expect(result.tasks[0].title).toBe('EDC Study');
    expect(result.tasks[0].status).toBe('planned');

    // Verify task stored in database
    const dbTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.tasks[0].id) as any;
    expect(dbTask).toBeDefined();
    expect(dbTask.planned_duration).toBe(90);

    // Verify checklist items created
    const checklists = db.prepare('SELECT * FROM checklist_items WHERE task_id = ?').all(result.tasks[0].id);
    expect(checklists.length).toBe(2);

    // Verify brain dump updated to fixed
    const bd = db.prepare('SELECT status FROM brain_dumps WHERE id = ?').get('bd_test') as any;
    expect(bd.status).toBe('fixed');

    // Verify audit event written
    const events = db.prepare('SELECT * FROM task_events WHERE task_id = ?').all(result.tasks[0].id);
    expect(events.length).toBeGreaterThan(0);
    expect((events[0] as any).event_type).toBe('TASK_FIXED');
  });

  it('rolls back completely if an error occurs during FIX', () => {
    const now = new Date().toISOString();
    db.prepare('INSERT INTO brain_dumps (id, raw_text, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
      .run('bd_rollback', 'test', 'parsed', now, now);

    // Attempt fix with non-existent brain dump
    expect(() => {
      FixService.fixPlan(db, 'non_existent_bd', [
        { id: 'c1', title: 'Task 1', estimated_duration: 30, priority: 'P1', is_included: 1 },
      ]);
    }).toThrow();

    // No tasks should exist
    const count = (db.prepare('SELECT COUNT(*) as c FROM tasks').get() as any).c;
    expect(count).toBe(0);
  });
});
