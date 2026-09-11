import { Router } from 'express';
import crypto from 'node:crypto';
import { getDb } from '../db/db.js';
import { DailyReview, Task } from '../domain/types.js';
import { DailyReviewSchema } from '../domain/schemas.js';

export const reviewsRouter = Router();

/**
 * GET /api/v1/reviews/:date
 * Get or compute daily review summary for YYYY-MM-DD
 */
reviewsRouter.get('/:date', (req, res, next) => {
  try {
    const db = getDb();
    const date = req.params.date;

    const existing = db.prepare<DailyReview>('SELECT * FROM daily_reviews WHERE date = ?').get(date);

    // Get current day's tasks to calculate live metrics
    const dayTasks = db.prepare<Task>('SELECT * FROM tasks WHERE scheduled_date = ?').all(date);
    const completed = dayTasks.filter(t => t.status === 'completed');
    const plannedMinutes = dayTasks.reduce((s, t) => s + (t.planned_duration || 0), 0);
    const actualMinutes = Math.round(dayTasks.reduce((s, t) => s + (t.actual_duration || 0), 0) / 60);

    const result = {
      date,
      review: existing || null,
      summary: {
        total_tasks: dayTasks.length,
        completed_tasks: completed.length,
        planned_minutes: plannedMinutes,
        actual_minutes: actualMinutes,
      },
      tasks: dayTasks,
    };

    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/reviews/:date
 * Record or update end of day review
 */
reviewsRouter.post('/:date', (req, res, next) => {
  try {
    const input = DailyReviewSchema.parse(req.body);
    const db = getDb();
    const date = req.params.date;
    const now = new Date().toISOString();

    const dayTasks = db.prepare<Task>('SELECT * FROM tasks WHERE scheduled_date = ?').all(date);
    const completed = dayTasks.filter(t => t.status === 'completed');
    const plannedMinutes = dayTasks.reduce((s, t) => s + (t.planned_duration || 0), 0);
    const actualMinutes = Math.round(dayTasks.reduce((s, t) => s + (t.actual_duration || 0), 0) / 60);

    const existing = db.prepare<DailyReview>('SELECT id FROM daily_reviews WHERE date = ?').get(date);

    if (existing) {
      db.prepare(`
        UPDATE daily_reviews
        SET completed_tasks_count = ?, total_tasks_count = ?, planned_minutes = ?,
            actual_minutes = ?, main_outcome_achieved = ?, what_went_well = ?,
            what_could_improve = ?, notes = ?, updated_at = ?
        WHERE date = ?
      `).run(
        completed.length,
        dayTasks.length,
        plannedMinutes,
        actualMinutes,
        input.main_outcome_achieved ? 1 : 0,
        input.what_went_well || null,
        input.what_could_improve || null,
        input.notes || null,
        now,
        date
      );
    } else {
      db.prepare(`
        INSERT INTO daily_reviews (
          id, date, completed_tasks_count, total_tasks_count, planned_minutes,
          actual_minutes, main_outcome_achieved, what_went_well, what_could_improve,
          notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `rev_${crypto.randomUUID().slice(0, 8)}`,
        date,
        completed.length,
        dayTasks.length,
        plannedMinutes,
        actualMinutes,
        input.main_outcome_achieved ? 1 : 0,
        input.what_went_well || null,
        input.what_could_improve || null,
        input.notes || null,
        now,
        now
      );
    }

    const saved = db.prepare<DailyReview>('SELECT * FROM daily_reviews WHERE date = ?').get(date);
    res.json(saved);
  } catch (err) {
    next(err);
  }
});
