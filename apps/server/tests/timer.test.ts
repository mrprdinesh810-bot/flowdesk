import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDb, DatabaseAdapter } from '../src/db/db.js';
import { runMigrations } from '../src/db/migrations.js';
import { TimerService, TimerAlreadyRunningError } from '../src/services/timerService.js';

describe('Timer Engine & Single Active Timer Concurrency', () => {
  let db: DatabaseAdapter;

  beforeEach(() => {
    db = getDb(':memory:');
    runMigrations(db);

    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO tasks (id, title, priority, category, estimated_duration, planned_duration, scheduled_date, status, created_at, updated_at)
      VALUES
      ('t1', 'Task One', 'P1', 'Work', 60, 60, '2026-09-04', 'planned', ?, ?),
      ('t2', 'Task Two', 'P2', 'Work', 45, 45, '2026-09-04', 'planned', ?, ?)
    `).run(now, now, now, now);
  });

  afterEach(() => {
    db.close();
  });

  it('starts a timer session and transitions task status to running', () => {
    const session = TimerService.startTimer(db, 't1');
    expect(session.state).toBe('running');
    expect(session.task_id).toBe('t1');

    const task = db.prepare('SELECT status FROM tasks WHERE id = ?').get('t1') as any;
    expect(task.status).toBe('running');

    const active = TimerService.getActiveTimer(db);
    expect(active.active).toBe(true);
    expect(active.task?.id).toBe('t1');
  });

  it('strictly rejects starting a second timer with TIMER_ALREADY_RUNNING', () => {
    TimerService.startTimer(db, 't1');

    expect(() => {
      TimerService.startTimer(db, 't2');
    }).toThrow(TimerAlreadyRunningError);

    try {
      TimerService.startTimer(db, 't2');
    } catch (err: any) {
      expect(err.code).toBe('TIMER_ALREADY_RUNNING');
      expect(err.activeTaskId).toBe('t1');
    }
  });

  it('supports pause and resume cycles cleanly', () => {
    const session = TimerService.startTimer(db, 't1');
    const paused = TimerService.pauseTimer(db, session.id);
    expect(paused.state).toBe('paused');

    const taskPaused = db.prepare('SELECT status FROM tasks WHERE id = ?').get('t1') as any;
    expect(taskPaused.status).toBe('paused');

    const resumed = TimerService.resumeTimer(db, session.id);
    expect(resumed.state).toBe('running');

    const taskResumed = db.prepare('SELECT status FROM tasks WHERE id = ?').get('t1') as any;
    expect(taskResumed.status).toBe('running');
  });

  it('completes timer and transitions task to completed', () => {
    const session = TimerService.startTimer(db, 't1');
    const { session: completedSession, task: completedTask } = TimerService.completeTimer(db, session.id, true);

    expect(completedSession.state).toBe('completed');
    expect(completedTask.status).toBe('completed');

    const active = TimerService.getActiveTimer(db);
    expect(active.active).toBe(false);
  });
});
