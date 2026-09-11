import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { TimerAlreadyRunningError } from '../services/timerService.js';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV !== 'production') {
    console.error('API Error:', err);
  }
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data.',
        details: err.flatten(),
      },
    });
  }

  if (err instanceof TimerAlreadyRunningError) {
    return res.status(409).json({
      error: {
        code: 'TIMER_ALREADY_RUNNING',
        message: err.message,
        details: {
          active_task_id: err.activeTaskId,
          active_task_title: err.activeTaskTitle,
          active_session_id: err.activeSessionId,
        },
      },
    });
  }

  if (err.message && err.message.startsWith('BACKUP_')) {
    const code = err.message.split(':')[0].trim();
    return res.status(400).json({
      error: {
        code,
        message: err.message,
      },
    });
  }

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected internal error occurred.',
    },
  });
}
