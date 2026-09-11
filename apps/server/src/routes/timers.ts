import { Router } from 'express';
import { getDb } from '../db/db.js';
import { TimerService } from '../services/timerService.js';
import { TimerStartSchema, TimerSessionControlSchema, TimerCompleteSchema, TimerSwitchSchema } from '../domain/schemas.js';

export const timersRouter = Router();

/**
 * GET /api/v1/timers/active
 * Get current active timer session and task
 */
timersRouter.get('/active', (req, res, next) => {
  try {
    const db = getDb();
    const activeInfo = TimerService.getActiveTimer(db);
    res.json(activeInfo);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/timers/start
 * Start focus timer for task (enforcing single active timer globally)
 */
timersRouter.post('/start', (req, res, next) => {
  try {
    const input = TimerStartSchema.parse(req.body);
    const db = getDb();
    const session = TimerService.startTimer(db, input.task_id);
    const activeInfo = TimerService.getActiveTimer(db);
    res.status(201).json(activeInfo);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/timers/pause
 */
timersRouter.post('/pause', (req, res, next) => {
  try {
    const input = TimerSessionControlSchema.parse(req.body);
    const db = getDb();
    const session = TimerService.pauseTimer(db, input.session_id);
    const activeInfo = TimerService.getActiveTimer(db);
    res.json(activeInfo);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/timers/resume
 */
timersRouter.post('/resume', (req, res, next) => {
  try {
    const input = TimerSessionControlSchema.parse(req.body);
    const db = getDb();
    const session = TimerService.resumeTimer(db, input.session_id);
    const activeInfo = TimerService.getActiveTimer(db);
    res.json(activeInfo);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/timers/complete
 */
timersRouter.post('/complete', (req, res, next) => {
  try {
    const input = TimerCompleteSchema.parse(req.body);
    const db = getDb();
    const result = TimerService.completeTimer(db, input.session_id, input.mark_task_completed);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/timers/switch
 * Cleanly switches focus from active task to new task
 */
timersRouter.post('/switch', (req, res, next) => {
  try {
    const input = TimerSwitchSchema.parse(req.body);
    const db = getDb();
    const session = TimerService.switchTimer(db, input.current_session_id, input.new_task_id, input.action);
    const activeInfo = TimerService.getActiveTimer(db);
    res.json(activeInfo);
  } catch (err) {
    next(err);
  }
});
