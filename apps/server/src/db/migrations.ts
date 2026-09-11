import { DatabaseAdapter } from './db.js';

export function runMigrations(db: DatabaseAdapter): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS brain_dumps (
      id TEXT PRIMARY KEY,
      raw_text TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'parsed', 'clarifying', 'fixed', 'failed')),
      parsing_provider TEXT,
      parsing_model TEXT,
      metadata_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS candidates (
      id TEXT PRIMARY KEY,
      brain_dump_id TEXT NOT NULL REFERENCES brain_dumps(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      estimated_duration INTEGER NOT NULL DEFAULT 30,
      priority TEXT NOT NULL CHECK(priority IN ('P1', 'P2', 'P3', 'P4')) DEFAULT 'P2',
      expected_outcome TEXT,
      category TEXT NOT NULL DEFAULT 'Work',
      tags_json TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL CHECK(status IN ('created', 'parsed', 'clarification_required', 'clarified', 'reviewable', 'fixed', 'discarded')) DEFAULT 'reviewable',
      clarification_question TEXT,
      clarification_answer TEXT,
      clarification_round INTEGER NOT NULL DEFAULT 0,
      scheduled_start TEXT,
      scheduled_end TEXT,
      is_fixed_commitment INTEGER NOT NULL DEFAULT 0,
      is_included INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      source_candidate_id TEXT,
      source_brain_dump_id TEXT REFERENCES brain_dumps(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT NOT NULL CHECK(priority IN ('P1', 'P2', 'P3', 'P4')),
      category TEXT NOT NULL DEFAULT 'Work',
      tags_json TEXT NOT NULL DEFAULT '[]',
      estimated_duration INTEGER NOT NULL,
      planned_duration INTEGER NOT NULL,
      actual_duration INTEGER NOT NULL DEFAULT 0,
      scheduled_date TEXT NOT NULL,
      scheduled_start TEXT,
      scheduled_end TEXT,
      deadline TEXT,
      expected_outcome TEXT,
      status TEXT NOT NULL CHECK(status IN ('planned', 'running', 'paused', 'completed', 'postponed', 'missed', 'rescheduled', 'cancelled')) DEFAULT 'planned',
      postponed_count INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      is_fixed_commitment INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS checklist_items (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      is_completed INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS timer_sessions (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      total_paused_seconds INTEGER NOT NULL DEFAULT 0,
      active_seconds INTEGER NOT NULL DEFAULT 0,
      last_resumed_at TEXT,
      state TEXT NOT NULL CHECK(state IN ('running', 'paused', 'completed', 'abandoned')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS task_events (
      id TEXT PRIMARY KEY,
      task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      prior_state TEXT,
      next_state TEXT,
      timestamp TEXT NOT NULL,
      metadata_json TEXT
    );

    CREATE TABLE IF NOT EXISTS daily_reviews (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL UNIQUE,
      completed_tasks_count INTEGER NOT NULL DEFAULT 0,
      total_tasks_count INTEGER NOT NULL DEFAULT 0,
      planned_minutes INTEGER NOT NULL DEFAULT 0,
      actual_minutes INTEGER NOT NULL DEFAULT 0,
      main_outcome_achieved INTEGER NOT NULL DEFAULT 0,
      what_went_well TEXT,
      what_could_improve TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS patterns (
      id TEXT PRIMARY KEY,
      pattern_type TEXT NOT NULL,
      observation_window_start TEXT NOT NULL,
      observation_window_end TEXT NOT NULL,
      metric_value REAL NOT NULL,
      sample_count INTEGER NOT NULL,
      confidence TEXT NOT NULL CHECK(confidence IN ('insufficient_data', 'emerging', 'supported', 'strong')),
      calculation_method TEXT NOT NULL,
      evidence_json TEXT NOT NULL,
      human_readable_summary TEXT NOT NULL,
      generated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recommendations (
      id TEXT PRIMARY KEY,
      pattern_id TEXT REFERENCES patterns(id) ON DELETE SET NULL,
      recommendation_type TEXT NOT NULL,
      affected_category TEXT,
      message TEXT NOT NULL,
      confidence TEXT NOT NULL CHECK(confidence IN ('emerging', 'supported', 'strong')),
      evidence_json TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'accepted', 'dismissed')) DEFAULT 'pending',
      created_at TEXT NOT NULL,
      resolved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_date ON tasks(scheduled_date, status);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_candidates_brain_dump ON candidates(brain_dump_id);
    CREATE INDEX IF NOT EXISTS idx_checklist_task ON checklist_items(task_id);
    CREATE INDEX IF NOT EXISTS idx_timer_task_state ON timer_sessions(task_id, state);
    CREATE INDEX IF NOT EXISTS idx_timer_state ON timer_sessions(state);
    CREATE INDEX IF NOT EXISTS idx_events_task ON task_events(task_id, timestamp);
    CREATE INDEX IF NOT EXISTS idx_patterns_type ON patterns(pattern_type);
    CREATE INDEX IF NOT EXISTS idx_recommendations_status ON recommendations(status);
  `);

  seedDefaultSettings(db);
}

function seedDefaultSettings(db: DatabaseAdapter): void {
  const defaults: Record<string, any> = {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    work_start: '09:00',
    work_end: '22:00',
    buffer_percent: 15,
    selected_provider: 'offline_quick_split', // Default offline per §P3
    ollama_base_url: 'http://127.0.0.1:11434',
    ollama_model: 'mistral:latest',
    openrouter_model: 'minimax/minimax-m2.7:free',
    notifications_enabled: true,
    theme: 'light',
  };

  const now = new Date().toISOString();
  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO settings (key, value_json, updated_at) VALUES (?, ?, ?)
  `);

  for (const [key, val] of Object.entries(defaults)) {
    insertStmt.run(key, JSON.stringify(val), now);
  }
}
