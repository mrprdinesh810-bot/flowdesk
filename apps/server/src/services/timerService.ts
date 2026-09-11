import crypto from 'node:crypto';
import { DatabaseAdapter } from '../db/db.js';
import { TimerSession, Task } from '../domain/types.js';

export interface ActiveTimerResponse {
  active: boolean;
  session: TimerSession | null;
  task: Task | null;
  active_seconds: number;
}

export class TimerAlreadyRunningError extends Error {
  code = 'TIMER_ALREADY_RUNNING';
  activeTaskId: string;
  activeTaskTitle: string;
  activeSessionId: string;

  constructor(taskId: string, taskTitle: string, sessionId: string) {
    super(`Another focus timer is already running for task "${taskTitle}".`);
    this.activeTaskId = taskId;
    this.activeTaskTitle = taskTitle;
    this.activeSessionId = sessionId;
  }
}

export class TimerService {
  /**
   * Helper: compute current active seconds accurately from UTC timestamps
   */
  static computeCurrentActiveSeconds(session: TimerSession): number {
    let total = session.active_seconds;
    if (session.state === 'running' && session.last_resumed_at) {
      const startMs = new Date(session.last_resumed_at).getTime();
      const nowMs = Date.now();
      if (nowMs > startMs) {
        total += Math.floor((nowMs - startMs) / 1000);
      }
    }
    return total;
  }

  /**
   * Get currently active timer session (state in 'running' or 'paused')
   */
  static getActiveTimer(db: DatabaseAdapter): ActiveTimerResponse {
    const session = db.prepare<TimerSession>(`
      SELECT * FROM timer_sessions
      WHERE state IN ('running', 'paused')
      ORDER BY started_at DESC
      LIMIT 1
    `).get();

    if (!session) {
      return { active: false, session: null, task: null, active_seconds: 0 };
    }

    const task = db.prepare<Task>('SELECT * FROM tasks WHERE id = ?').get(session.task_id) || null;
    const activeSeconds = this.computeCurrentActiveSeconds(session);

    return {
      active: session.state === 'running',
      session,
      task,
      active_seconds: activeSeconds,
    };
  }

  /**
   * Start focus timer for task, enforcing single active timer rule
   */
  static startTimer(db: DatabaseAdapter, taskId: string): TimerSession {
    const task = db.prepare<Task>('SELECT * FROM tasks WHERE id = ?').get(taskId);
    if (!task) {
      throw new Error(`Task with ID "${taskId}" not found.`);
    }

    // Check if another session is already active (running or paused)
    const existing = db.prepare<TimerSession>(`
      SELECT * FROM timer_sessions
      WHERE state IN ('running', 'paused')
      LIMIT 1
    `).get();

    if (existing) {
      if (existing.task_id === taskId && existing.state === 'running') {
        return existing; // already running for this exact task
      }
      const existingTask = db.prepare<Task>('SELECT * FROM tasks WHERE id = ?').get(existing.task_id);
      throw new TimerAlreadyRunningError(
        existing.task_id,
        existingTask?.title || 'Active Task',
        existing.id
      );
    }

    const now = new Date().toISOString();
    const sessionId = `sess_${crypto.randomUUID().slice(0, 8)}`;

    return db.transaction(() => {
      db.prepare(`
        INSERT INTO timer_sessions (
          id, task_id, started_at, total_paused_seconds, active_seconds,
          last_resumed_at, state, created_at, updated_at
        ) VALUES (?, ?, ?, 0, 0, ?, 'running', ?, ?)
      `).run(sessionId, taskId, now, now, now, now);

      // Update task state to running
      db.prepare("UPDATE tasks SET status = 'running', updated_at = ? WHERE id = ?").run(now, taskId);

      // Record event
      db.prepare(`
        INSERT INTO task_events (id, task_id, event_type, prior_state, next_state, timestamp, metadata_json)
        VALUES (?, ?, 'TASK_STARTED', ?, 'running', ?, ?)
      `).run(`evt_${crypto.randomUUID().slice(0, 8)}`, taskId, task.status, now, JSON.stringify({ session_id: sessionId }));

      return db.prepare<TimerSession>('SELECT * FROM timer_sessions WHERE id = ?').get(sessionId)!;
    });
  }

  /**
   * Pause focus timer
   */
  static pauseTimer(db: DatabaseAdapter, sessionId: string): TimerSession {
    const session = db.prepare<TimerSession>('SELECT * FROM timer_sessions WHERE id = ?').get(sessionId);
    if (!session) {
      throw new Error(`Timer session "${sessionId}" not found.`);
    }
    if (session.state !== 'running') {
      return session; // already paused or closed
    }

    const now = new Date().toISOString();
    const currentActive = this.computeCurrentActiveSeconds(session);

    return db.transaction(() => {
      db.prepare(`
        UPDATE timer_sessions
        SET state = 'paused', active_seconds = ?, last_resumed_at = NULL, updated_at = ?
        WHERE id = ?
      `).run(currentActive, now, sessionId);

      // Update task status to paused
      db.prepare("UPDATE tasks SET status = 'paused', actual_duration = ?, updated_at = ? WHERE id = ?")
        .run(currentActive, now, session.task_id);

      db.prepare(`
        INSERT INTO task_events (id, task_id, event_type, prior_state, next_state, timestamp, metadata_json)
        VALUES (?, ?, 'TASK_PAUSED', 'running', 'paused', ?, ?)
      `).run(`evt_${crypto.randomUUID().slice(0, 8)}`, session.task_id, now, JSON.stringify({ session_id: sessionId, active_seconds: currentActive }));

      return db.prepare<TimerSession>('SELECT * FROM timer_sessions WHERE id = ?').get(sessionId)!;
    });
  }

  /**
   * Resume paused timer
   */
  static resumeTimer(db: DatabaseAdapter, sessionId: string): TimerSession {
    const session = db.prepare<TimerSession>('SELECT * FROM timer_sessions WHERE id = ?').get(sessionId);
    if (!session) {
      throw new Error(`Timer session "${sessionId}" not found.`);
    }
    if (session.state === 'running') {
      return session;
    }

    // Check if another session is running
    const otherRunning = db.prepare<TimerSession>(`
      SELECT * FROM timer_sessions
      WHERE state = 'running' AND id != ?
      LIMIT 1
    `).get(sessionId);

    if (otherRunning) {
      const otherTask = db.prepare<Task>('SELECT * FROM tasks WHERE id = ?').get(otherRunning.task_id);
      throw new TimerAlreadyRunningError(
        otherRunning.task_id,
        otherTask?.title || 'Active Task',
        otherRunning.id
      );
    }

    const now = new Date().toISOString();

    return db.transaction(() => {
      db.prepare(`
        UPDATE timer_sessions
        SET state = 'running', last_resumed_at = ?, updated_at = ?
        WHERE id = ?
      `).run(now, now, sessionId);

      db.prepare("UPDATE tasks SET status = 'running', updated_at = ? WHERE id = ?").run(now, session.task_id);

      db.prepare(`
        INSERT INTO task_events (id, task_id, event_type, prior_state, next_state, timestamp, metadata_json)
        VALUES (?, ?, 'TASK_RESUMED', 'paused', 'running', ?, ?)
      `).run(`evt_${crypto.randomUUID().slice(0, 8)}`, session.task_id, now, JSON.stringify({ session_id: sessionId }));

      return db.prepare<TimerSession>('SELECT * FROM timer_sessions WHERE id = ?').get(sessionId)!;
    });
  }

  /**
   * Complete focus timer session
   */
  static completeTimer(db: DatabaseAdapter, sessionId: string, markTaskCompleted = true): { session: TimerSession; task: Task } {
    const session = db.prepare<TimerSession>('SELECT * FROM timer_sessions WHERE id = ?').get(sessionId);
    if (!session) {
      throw new Error(`Timer session "${sessionId}" not found.`);
    }

    const now = new Date().toISOString();
    const finalActive = this.computeCurrentActiveSeconds(session);

    return db.transaction(() => {
      db.prepare(`
        UPDATE timer_sessions
        SET state = 'completed', ended_at = ?, active_seconds = ?, last_resumed_at = NULL, updated_at = ?
        WHERE id = ?
      `).run(now, finalActive, now, sessionId);

      const nextTaskStatus = markTaskCompleted ? 'completed' : 'planned';
      db.prepare(`
        UPDATE tasks
        SET status = ?, actual_duration = ?, updated_at = ?
        WHERE id = ?
      `).run(nextTaskStatus, finalActive, now, session.task_id);

      db.prepare(`
        INSERT INTO task_events (id, task_id, event_type, prior_state, next_state, timestamp, metadata_json)
        VALUES (?, ?, 'TASK_COMPLETED', ?, ?, ?, ?)
      `).run(`evt_${crypto.randomUUID().slice(0, 8)}`, session.task_id, session.state, nextTaskStatus, now, JSON.stringify({
        session_id: sessionId,
        active_seconds: finalActive,
      }));

      const updatedSession = db.prepare<TimerSession>('SELECT * FROM timer_sessions WHERE id = ?').get(sessionId)!;
      const updatedTask = db.prepare<Task>('SELECT * FROM tasks WHERE id = ?').get(session.task_id)!;

      return { session: updatedSession, task: updatedTask };
    });
  }

  /**
   * Switch active timer to another task cleanly
   */
  static switchTimer(
    db: DatabaseAdapter,
    currentSessionId: string,
    newTaskId: string,
    action: 'pause' | 'complete' | 'abandon' = 'pause'
  ): TimerSession {
    return db.transaction(() => {
      if (action === 'pause') {
        this.pauseTimer(db, currentSessionId);
      } else if (action === 'complete') {
        this.completeTimer(db, currentSessionId, true);
      } else {
        const now = new Date().toISOString();
        db.prepare("UPDATE timer_sessions SET state = 'abandoned', ended_at = ?, updated_at = ? WHERE id = ?")
          .run(now, now, currentSessionId);
      }
      return this.startTimer(db, newTaskId);
    });
  }
}
