export type Priority = 'P1' | 'P2' | 'P3' | 'P4';

export type TaskStatus =
  | 'planned'
  | 'running'
  | 'paused'
  | 'completed'
  | 'postponed'
  | 'missed'
  | 'rescheduled'
  | 'cancelled';

export type TimerState = 'running' | 'paused' | 'completed' | 'abandoned';

export type CandidateStatus =
  | 'created'
  | 'parsed'
  | 'clarification_required'
  | 'clarified'
  | 'reviewable'
  | 'fixed'
  | 'discarded';

export type FeasibilityStatus =
  | 'feasible'
  | 'tight'
  | 'overloaded'
  | 'conflicted'
  | 'deadline_risk';

export type BlockType =
  | 'FIXED_COMMITMENT'
  | 'FOCUS_WORK'
  | 'LIGHT_WORK'
  | 'BREAK'
  | 'BUFFER';

export interface BrainDump {
  id: string;
  raw_text: string;
  status: 'pending' | 'parsed' | 'clarifying' | 'fixed' | 'failed';
  parsing_provider: string | null;
  parsing_model: string | null;
  metadata_json: string | null;
  created_at: string;
  updated_at: string;
}

export interface Candidate {
  id: string;
  brain_dump_id: string;
  title: string;
  description: string | null;
  estimated_duration: number; // minutes
  priority: Priority;
  expected_outcome: string | null;
  category: string;
  tags_json: string;
  status: CandidateStatus;
  clarification_question: string | null;
  clarification_answer: string | null;
  clarification_round: number;
  scheduled_start: string | null;
  scheduled_end: string | null;
  is_fixed_commitment: number;
  is_included: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  source_candidate_id: string | null;
  source_brain_dump_id: string | null;
  title: string;
  description: string | null;
  priority: Priority;
  category: string;
  tags_json: string;
  estimated_duration: number;
  planned_duration: number;
  actual_duration: number; // seconds
  scheduled_date: string; // YYYY-MM-DD
  scheduled_start: string | null;
  scheduled_end: string | null;
  deadline: string | null;
  expected_outcome: string | null;
  status: TaskStatus;
  postponed_count: number;
  notes: string | null;
  is_fixed_commitment: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
  checklist?: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  task_id: string;
  title: string;
  is_completed: number;
  sort_order: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimerSession {
  id: string;
  task_id: string;
  started_at: string;
  ended_at: string | null;
  total_paused_seconds: number;
  active_seconds: number;
  last_resumed_at: string | null;
  state: TimerState;
  created_at: string;
  updated_at: string;
}

export interface TaskEvent {
  id: string;
  task_id: string | null;
  event_type: string;
  prior_state: string | null;
  next_state: string | null;
  timestamp: string;
  metadata_json: string | null;
}

export interface DailyReview {
  id: string;
  date: string;
  completed_tasks_count: number;
  total_tasks_count: number;
  planned_minutes: number;
  actual_minutes: number;
  main_outcome_achieved: number;
  what_went_well: string | null;
  what_could_improve: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduleBlock {
  id: string;
  taskId?: string;
  candidateId?: string;
  title: string;
  start: string; // HH:MM
  end: string;   // HH:MM
  durationMinutes: number;
  blockType: BlockType;
  priority?: Priority;
  isFixedCommitment: boolean;
}

export interface FeasibilityReport {
  status: FeasibilityStatus;
  availableMinutes: number;
  plannedMinutes: number;
  bufferMinutes: number;
  slackMinutes: number;
  workloadPercent: number;
  conflicts: Array<{ blockA: string; blockB: string; time: string }>;
  warnings: string[];
  recommendations: string[];
}

export interface MainOutcomeDefinition {
  outcome: string;
  whyItMatters: string;
}

export interface MustWinTaskItem {
  priority: 'P1' | 'P2';
  title: string;
  action: string;
  expectedResult: string;
  time: string;
  estimatedDuration: number;
}

export interface OtherTaskItem {
  priority: 'P3' | 'P4';
  title: string;
  time: string;
  recommendation: string;
  estimatedDuration: number;
}

export interface PlanningScheduleEntry {
  time: string;
  action: string;
  priority: Priority | 'BREAK' | 'BUFFER' | 'MEAL' | 'TRAVEL' | 'COMMITMENT';
  expectedOutput: string;
  blockType: BlockType;
  isFixed: boolean;
  durationMinutes: number;
  isPast?: boolean;
  isCurrent?: boolean;
  isPending?: boolean;
  originalTime?: string;
}

export interface WasteTaskItem {
  task: string;
  reason: string;
}

export interface PostponedTaskItem {
  task: string;
  suggestedDayOrReason: string;
}

export interface PendingPastTaskItem {
  task: string;
  originalTime: string;
  reason: string;
  actionTaken: 'rescheduled_to_now' | 'marked_completed' | 'marked_pending' | string;
}

export interface ProductiveDayPlan {
  currentTime: string;
  mainOutcome: MainOutcomeDefinition;
  mustWinTasks: MustWinTaskItem[];
  otherTasks: OtherTaskItem[];
  schedule: PlanningScheduleEntry[];
  pendingPastTasks: PendingPastTaskItem[];
  doNotWasteTimeOn: WasteTaskItem[];
  moveToAnotherDay: PostponedTaskItem[];
  successCriteria: string[];
  feasibility: FeasibilityReport;
  markdownReport: string;
}

export interface PlanningInputContext {
  date?: string;
  currentTime?: string;
  dayStart?: string;
  dayEnd?: string;
  fixedCommitments?: Array<{
    title: string;
    start: string;
    end: string;
    isFlexible?: boolean;
  }>;
}

export interface ReplanInput {
  brainDumpId?: string;
  brain_dump_id?: string;
  currentDate?: string;
  current_date?: string;
  currentTime?: string;
  current_time?: string;
  completedTaskIds?: string[];
  completed_task_ids?: string[];
  remainingMinutes?: number;
  remaining_minutes?: number;
  interruptionNote?: string;
  interruption_note?: string;
  newRawText?: string;
  new_raw_text?: string;
  provider?: string;
}

