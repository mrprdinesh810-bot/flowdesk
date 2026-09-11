import { z } from 'zod';

export const BrainDumpInputSchema = z.object({
  raw_text: z.string().min(1, 'Input text cannot be empty'),
  current_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  mode: z.enum(['ai', 'offline_quick_split']).default('ai'),
  provider: z.enum(['ollama', 'openrouter', 'offline_quick_split']).optional(),
});


export const ClarifyInputSchema = z.object({
  answer: z.string().min(1, 'Clarification answer cannot be empty'),
});

export const CandidateUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  estimated_duration: z.number().int().positive().optional(),
  priority: z.enum(['P1', 'P2', 'P3', 'P4']).optional(),
  expected_outcome: z.string().nullable().optional(),
  category: z.string().optional(),
  scheduled_start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
  scheduled_end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
  is_fixed_commitment: z.number().int().min(0).max(1).optional(),
  is_included: z.number().int().min(0).max(1).optional(),
  sort_order: z.number().int().optional(),
});

export const RecalculateScheduleSchema = z.object({
  candidates: z.array(z.object({
    id: z.string(),
    title: z.string(),
    estimated_duration: z.number(),
    priority: z.enum(['P1', 'P2', 'P3', 'P4']),
    scheduled_start: z.string().nullable().optional(),
    scheduled_end: z.string().nullable().optional(),
    is_fixed_commitment: z.number().optional(),
    is_included: z.number().optional(),
    sort_order: z.number().optional(),
  })),
  day_start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).default('09:00'),
  day_end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).default('22:00'),
  buffer_percent: z.number().min(0).max(50).default(15),
});

export const FixPlanSchema = z.object({
  brain_dump_id: z.string(),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  candidates: z.array(z.object({
    id: z.string(),
    title: z.string().min(1),
    description: z.string().nullable().optional(),
    priority: z.enum(['P1', 'P2', 'P3', 'P4']),
    category: z.string().default('Work'),
    estimated_duration: z.number().int().positive(),
    scheduled_start: z.string().nullable().optional(),
    scheduled_end: z.string().nullable().optional(),
    expected_outcome: z.string().nullable().optional(),
    is_fixed_commitment: z.number().optional(),
    is_included: z.number().default(1),
    sort_order: z.number().default(0),
    checklist: z.array(z.string()).optional(),
  })),
});

export const TimerStartSchema = z.object({
  task_id: z.string().min(1),
});

export const TimerSessionControlSchema = z.object({
  session_id: z.string().min(1),
});

export const TimerCompleteSchema = z.object({
  session_id: z.string().min(1),
  mark_task_completed: z.boolean().default(true),
});

export const TimerSwitchSchema = z.object({
  current_session_id: z.string().min(1),
  new_task_id: z.string().min(1),
  action: z.enum(['pause', 'complete', 'abandon']).default('pause'),
});

export const TaskUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  priority: z.enum(['P1', 'P2', 'P3', 'P4']).optional(),
  notes: z.string().nullable().optional(),
  scheduled_start: z.string().nullable().optional(),
  scheduled_end: z.string().nullable().optional(),
});

export const TaskStatusUpdateSchema = z.object({
  status: z.enum(['planned', 'running', 'paused', 'completed', 'postponed', 'missed', 'rescheduled', 'cancelled']),
});

export const TaskPostponeSchema = z.object({
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const ChecklistToggleSchema = z.object({
  is_completed: z.boolean(),
});

export const ChecklistCreateSchema = z.object({
  title: z.string().min(1),
});

export const DailyReviewSchema = z.object({
  what_went_well: z.string().nullable().optional(),
  what_could_improve: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  main_outcome_achieved: z.boolean().default(false),
});

export const AiTestSchema = z.object({
  provider: z.enum(['ollama', 'openrouter']),
  base_url: z.string().url().optional(),
  model: z.string().optional(),
  api_key: z.string().optional(),
});

export const PlanningInputSchema = z.object({
  raw_text: z.string().min(1, 'Input text cannot be empty'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  current_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  day_start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).default('09:00'),
  day_end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).default('22:00'),
  fixed_commitments: z.array(z.object({
    title: z.string(),
    start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    is_flexible: z.boolean().optional(),
  })).optional(),
  mode: z.enum(['ai', 'offline_quick_split']).default('ai'),
  provider: z.enum(['ollama', 'openrouter', 'offline_quick_split']).optional(),
});


export const ReplanInputSchema = z.object({
  brain_dump_id: z.string().optional(),
  current_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  current_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  completed_task_ids: z.array(z.string()).optional(),
  remaining_minutes: z.number().int().positive().optional(),
  interruption_note: z.string().optional(),
  new_raw_text: z.string().optional(),
  provider: z.enum(['ollama', 'openrouter', 'offline_quick_split']).optional(),
});

