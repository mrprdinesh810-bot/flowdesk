import { Router } from 'express';
import { getDb } from '../db/db.js';
import { FixService } from '../services/fixService.js';
import { FixPlanSchema } from '../domain/schemas.js';

export const fixRouter = Router();

/**
 * POST /api/v1/fix
 * Atomic FIX approval transaction promoting customized candidate tasks into executable tasks
 */
fixRouter.post('/', (req, res, next) => {
  try {
    const input = FixPlanSchema.parse(req.body);
    const db = getDb();

    const result = FixService.fixPlan(
      db,
      input.brain_dump_id,
      input.candidates,
      input.scheduled_date
    );

    res.status(200).json({
      success: true,
      tasks: result.tasks,
      scheduled_date: result.scheduledDate,
      message: 'Plan successfully approved and fixed into executable tasks.',
    });
  } catch (err) {
    next(err);
  }
});
