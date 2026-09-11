# FlowDesk — Data Model Specification

All tables reside in a single SQLite database (`flowdesk.sqlite`) with WAL mode (`PRAGMA journal_mode = WAL;`) and enforced foreign keys (`PRAGMA foreign_keys = ON;`).

---

## 1. Tables & Schemas

### 1.1 `brain_dumps`
Stores the original, immutable raw text inputs entered by the user.
- `id` TEXT PRIMARY KEY (e.g. `bd_...`)
- `raw_text` TEXT NOT NULL
- `status` TEXT NOT NULL CHECK(status IN ('pending', 'parsed', 'clarifying', 'fixed', 'failed'))
- `parsing_provider` TEXT NULL ('ollama', 'openrouter', 'offline_quick_split')
- `parsing_model` TEXT NULL
- `metadata_json` TEXT NULL
- `created_at` TEXT NOT NULL (UTC ISO-8601)
- `updated_at` TEXT NOT NULL (UTC ISO-8601)

### 1.2 `candidates`
Ephemeral proposed tasks produced by parsing or editing before FIX.
- `id` TEXT PRIMARY KEY (e.g. `cand_...`)
- `brain_dump_id` TEXT NOT NULL REFERENCES brain_dumps(id) ON DELETE CASCADE
- `title` TEXT NOT NULL
- `description` TEXT NULL
- `estimated_duration` INTEGER NOT NULL DEFAULT 30 (minutes)
- `priority` TEXT NOT NULL CHECK(priority IN ('P1', 'P2', 'P3', 'P4')) DEFAULT 'P2'
- `expected_outcome` TEXT NULL
- `category` TEXT NOT NULL DEFAULT 'Work'
- `tags_json` TEXT NOT NULL DEFAULT '[]'
- `status` TEXT NOT NULL CHECK(status IN ('created', 'parsed', 'clarification_required', 'clarified', 'reviewable', 'fixed', 'discarded')) DEFAULT 'reviewable'
- `clarification_question` TEXT NULL
- `clarification_answer` TEXT NULL
- `clarification_round` INTEGER NOT NULL DEFAULT 0
- `scheduled_start` TEXT NULL (HH:MM format)
- `scheduled_end` TEXT NULL (HH:MM format)
- `is_fixed_commitment` INTEGER NOT NULL DEFAULT 0 (boolean 0 or 1)
- `is_included` INTEGER NOT NULL DEFAULT 1 (boolean 0 or 1)
- `sort_order` INTEGER NOT NULL DEFAULT 0
- `created_at` TEXT NOT NULL
- `updated_at` TEXT NOT NULL

### 1.3 `tasks`
Authoritative approved tasks created ONLY upon successful FIX transaction.
- `id` TEXT PRIMARY KEY (e.g. `task_...`)
- `source_candidate_id` TEXT NULL
- `source_brain_dump_id` TEXT NULL REFERENCES brain_dumps(id) ON DELETE SET NULL
- `title` TEXT NOT NULL
- `description` TEXT NULL
- `priority` TEXT NOT NULL CHECK(priority IN ('P1', 'P2', 'P3', 'P4'))
- `category` TEXT NOT NULL DEFAULT 'Work'
- `tags_json` TEXT NOT NULL DEFAULT '[]'
- `estimated_duration` INTEGER NOT NULL (minutes)
- `planned_duration` INTEGER NOT NULL (minutes)
- `actual_duration` INTEGER NOT NULL DEFAULT 0 (seconds)
- `scheduled_date` TEXT NOT NULL (YYYY-MM-DD)
- `scheduled_start` TEXT NULL (HH:MM)
- `scheduled_end` TEXT NULL (HH:MM)
- `deadline` TEXT NULL
- `expected_outcome` TEXT NULL
- `status` TEXT NOT NULL CHECK(status IN ('planned', 'running', 'paused', 'completed', 'postponed', 'missed', 'rescheduled', 'cancelled')) DEFAULT 'planned'
- `postponed_count` INTEGER NOT NULL DEFAULT 0
- `notes` TEXT NULL
- `is_fixed_commitment` INTEGER NOT NULL DEFAULT 0
- `sort_order` INTEGER NOT NULL DEFAULT 0
- `created_at` TEXT NOT NULL
- `updated_at` TEXT NOT NULL

### 1.4 `checklist_items`
Actionable checklist sub-items belonging to an approved task.
- `id` TEXT PRIMARY KEY (e.g. `chk_...`)
- `task_id` TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE
- `title` TEXT NOT NULL
- `is_completed` INTEGER NOT NULL DEFAULT 0
- `sort_order` INTEGER NOT NULL DEFAULT 0
- `completed_at` TEXT NULL
- `created_at` TEXT NOT NULL
- `updated_at` TEXT NOT NULL

### 1.5 `timer_sessions`
Records individual focus sessions for active tasks.
- `id` TEXT PRIMARY KEY (e.g. `sess_...`)
- `task_id` TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE
- `started_at` TEXT NOT NULL (UTC ISO-8601)
- `ended_at` TEXT NULL (UTC ISO-8601)
- `total_paused_seconds` INTEGER NOT NULL DEFAULT 0
- `active_seconds` INTEGER NOT NULL DEFAULT 0
- `last_resumed_at` TEXT NULL (UTC ISO-8601)
- `state` TEXT NOT NULL CHECK(state IN ('running', 'paused', 'completed', 'abandoned'))
- `created_at` TEXT NOT NULL
- `updated_at` TEXT NOT NULL

### 1.6 `task_events`
Immutable audit log of all domain and lifecycle transitions.
- `id` TEXT PRIMARY KEY (e.g. `evt_...`)
- `task_id` TEXT NULL REFERENCES tasks(id) ON DELETE CASCADE
- `event_type` TEXT NOT NULL (e.g. 'TASK_CREATED', 'TASK_FIXED', 'TASK_STARTED', 'TASK_PAUSED', 'TASK_RESUMED', 'TASK_COMPLETED', 'TASK_POSTPONED', 'TASK_MISSED', 'CHECKLIST_TOGGLED', 'INTEGRITY_WARNING', 'BACKUP_EXPORTED', 'BACKUP_IMPORTED')
- `prior_state` TEXT NULL
- `next_state` TEXT NULL
- `timestamp` TEXT NOT NULL (UTC ISO-8601)
- `metadata_json` TEXT NULL

### 1.7 `daily_reviews`
End-of-day reflection records.
- `id` TEXT PRIMARY KEY (e.g. `rev_...`)
- `date` TEXT NOT NULL UNIQUE (YYYY-MM-DD)
- `completed_tasks_count` INTEGER NOT NULL DEFAULT 0
- `total_tasks_count` INTEGER NOT NULL DEFAULT 0
- `planned_minutes` INTEGER NOT NULL DEFAULT 0
- `actual_minutes` INTEGER NOT NULL DEFAULT 0
- `main_outcome_achieved` INTEGER NOT NULL DEFAULT 0
- `what_went_well` TEXT NULL
- `what_could_improve` TEXT NULL
- `notes` TEXT NULL
- `created_at` TEXT NOT NULL
- `updated_at` TEXT NOT NULL

### 1.8 `patterns`
Evidence-backed behavioral patterns detected from historical data.
- `id` TEXT PRIMARY KEY (e.g. `pat_...`)
- `pattern_type` TEXT NOT NULL (e.g. 'duration_underestimation', 'productive_hours', 'postponement_tendency')
- `observation_window_start` TEXT NOT NULL
- `observation_window_end` TEXT NOT NULL
- `metric_value` REAL NOT NULL
- `sample_count` INTEGER NOT NULL
- `confidence` TEXT NOT NULL CHECK(confidence IN ('insufficient_data', 'emerging', 'supported', 'strong'))
- `calculation_method` TEXT NOT NULL
- `evidence_json` TEXT NOT NULL
- `human_readable_summary` TEXT NOT NULL
- `generated_at` TEXT NOT NULL

### 1.9 `recommendations`
Actionable suggestions derived from confirmed patterns (recommendation-only).
- `id` TEXT PRIMARY KEY (e.g. `rec_...`)
- `pattern_id` TEXT NULL REFERENCES patterns(id) ON DELETE SET NULL
- `recommendation_type` TEXT NOT NULL
- `affected_category` TEXT NULL
- `message` TEXT NOT NULL
- `confidence` TEXT NOT NULL CHECK(confidence IN ('emerging', 'supported', 'strong'))
- `evidence_json` TEXT NOT NULL
- `status` TEXT NOT NULL CHECK(status IN ('pending', 'accepted', 'dismissed')) DEFAULT 'pending'
- `created_at` TEXT NOT NULL
- `resolved_at` TEXT NULL

### 1.10 `settings`
Key-value configuration store with defaults.
- `key` TEXT PRIMARY KEY
- `value_json` TEXT NOT NULL
- `updated_at` TEXT NOT NULL

---

## 2. Key Indexes
- `idx_tasks_scheduled_date` ON `tasks(scheduled_date, status)`
- `idx_tasks_status` ON `tasks(status)`
- `idx_candidates_brain_dump` ON `candidates(brain_dump_id)`
- `idx_checklist_task` ON `checklist_items(task_id)`
- `idx_timer_task_state` ON `timer_sessions(task_id, state)`
- `idx_timer_state` ON `timer_sessions(state)`
- `idx_events_task` ON `task_events(task_id, timestamp)`
