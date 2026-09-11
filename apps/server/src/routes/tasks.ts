import { Router } from 'express';
import crypto from 'node:crypto';
import { getDb } from '../db/db.js';
import { Task, ChecklistItem } from '../domain/types.js';
import { TaskUpdateSchema, TaskStatusUpdateSchema, TaskPostponeSchema, ChecklistToggleSchema, ChecklistCreateSchema } from '../domain/schemas.js';

export const tasksRouter = Router();

/**
 * GET /api/v1/tasks
 * List tasks with optional date and status filters
 */
tasksRouter.get('/', (req, res, next) => {
  try {
    const db = getDb();
    const date = req.query.date as string | undefined;
    const status = req.query.status as string | undefined;

    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params: any[] = [];

    if (date) {
      query += ' AND scheduled_date = ?';
      params.push(date);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY sort_order ASC, created_at ASC';

    const tasks = db.prepare<Task>(query).all(...params);

    // Attach checklists
    const tasksWithChecklists = tasks.map(t => {
      const checklists = db.prepare<ChecklistItem>('SELECT * FROM checklist_items WHERE task_id = ? ORDER BY sort_order ASC').all(t.id);
      return { ...t, checklist: checklists };
    });

    res.json(tasksWithChecklists);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/tasks/:id
 */
tasksRouter.get('/:id', (req, res, next) => {
  try {
    const db = getDb();
    const task = db.prepare<Task>('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Task not found.' } });
    }

    const checklist = db.prepare<ChecklistItem>('SELECT * FROM checklist_items WHERE task_id = ? ORDER BY sort_order ASC').all(task.id);
    const sessions = db.prepare('SELECT * FROM timer_sessions WHERE task_id = ? ORDER BY started_at DESC').all(task.id);

    res.json({ ...task, checklist, timer_sessions: sessions });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/tasks/:id
 */
tasksRouter.put('/:id', (req, res, next) => {
  try {
    const input = TaskUpdateSchema.parse(req.body);
    const db = getDb();
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Task not found.' } });
    }

    const updates: string[] = [];
    const values: any[] = [];
    const now = new Date().toISOString();

    for (const [key, val] of Object.entries(input)) {
      if (val !== undefined) {
        updates.push(`${key} = ?`);
        values.push(val);
      }
    }
    updates.push('updated_at = ?');
    values.push(now);
    values.push(req.params.id);

    db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/tasks/:id/status
 */
tasksRouter.post('/:id/status', (req, res, next) => {
  try {
    const input = TaskStatusUpdateSchema.parse(req.body);
    const db = getDb();
    const task = db.prepare<Task>('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Task not found.' } });
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?').run(input.status, now, req.params.id);

    db.prepare(`
      INSERT INTO task_events (id, task_id, event_type, prior_state, next_state, timestamp, metadata_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(`evt_${crypto.randomUUID().slice(0, 8)}`, req.params.id, `TASK_${input.status.toUpperCase()}`, task.status, input.status, now, null);

    const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/tasks/:id/postpone
 */
tasksRouter.post('/:id/postpone', (req, res, next) => {
  try {
    const input = TaskPostponeSchema.parse(req.body);
    const db = getDb();
    const task = db.prepare<Task>('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Task not found.' } });
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE tasks
      SET status = 'postponed', scheduled_date = ?, postponed_count = postponed_count + 1, updated_at = ?
      WHERE id = ?
    `).run(input.target_date, now, req.params.id);

    db.prepare(`
      INSERT INTO task_events (id, task_id, event_type, prior_state, next_state, timestamp, metadata_json)
      VALUES (?, ?, 'TASK_POSTPONED', ?, 'postponed', ?, ?)
    `).run(`evt_${crypto.randomUUID().slice(0, 8)}`, req.params.id, task.status, now, JSON.stringify({ target_date: input.target_date }));

    const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/checklists/:id/toggle
 */
tasksRouter.post('/checklists/:id/toggle', (req, res, next) => {
  try {
    const input = ChecklistToggleSchema.parse(req.body);
    const db = getDb();
    const now = new Date().toISOString();

    const item = db.prepare<ChecklistItem>('SELECT * FROM checklist_items WHERE id = ?').get(req.params.id);
    if (!item) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Checklist item not found.' } });
    }

    db.prepare(`
      UPDATE checklist_items
      SET is_completed = ?, completed_at = ?, updated_at = ?
      WHERE id = ?
    `).run(input.is_completed ? 1 : 0, input.is_completed ? now : null, now, req.params.id);

    const updated = db.prepare('SELECT * FROM checklist_items WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/tasks/:id/checklists
 */
tasksRouter.post('/:id/checklists', (req, res, next) => {
  try {
    const input = ChecklistCreateSchema.parse(req.body);
    const db = getDb();
    const task = db.prepare('SELECT id FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Task not found.' } });
    }

    const chkId = `chk_${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    const count = (db.prepare('SELECT COUNT(*) as c FROM checklist_items WHERE task_id = ?').get(req.params.id) as any).c;

    db.prepare(`
      INSERT INTO checklist_items (id, task_id, title, is_completed, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, 0, ?, ?, ?)
    `).run(chkId, req.params.id, input.title, count, now, now);

    const created = db.prepare('SELECT * FROM checklist_items WHERE id = ?').get(chkId);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/tasks/:id
 * Delete task and cascade to checklists, timers, events
 */
tasksRouter.delete('/:id', (req, res, next) => {
  try {
    const db = getDb();
    const task = db.prepare('SELECT id FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Task not found.' } });
    }

    // Stop active timer session if it belongs to this task
    db.prepare("UPDATE timer_sessions SET state = 'abandoned', ended_at = ? WHERE task_id = ? AND state IN ('running', 'paused')")
      .run(new Date().toISOString(), req.params.id);

    // Delete task (cascades to checklist_items, timer_sessions, task_events)
    db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);

    res.json({ success: true, message: 'Task deleted successfully.', id: req.params.id });
  } catch (err) {
    next(err);
  }
});

