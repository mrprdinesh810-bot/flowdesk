# FlowDesk — REST API Specification (`/api/v1`)

All endpoints use standard JSON payloads and responses. The server binds strictly to `127.0.0.1`.

---

## 1. Standard Error Shape

Every error response adheres to Section 70:

```json
{
  "error": {
    "code": "TIMER_ALREADY_RUNNING",
    "message": "Another focus timer is already running.",
    "details": {
      "active_task_id": "task_123",
      "active_task_title": "EDC Study"
    }
  }
}
```

Standard error codes:
- `VALIDATION_ERROR` (400)
- `NOT_FOUND` (404)
- `CONFLICT` (409)
- `STATE_TRANSITION_INVALID` (400)
- `TIMER_ALREADY_RUNNING` (409)
- `AI_PROVIDER_UNAVAILABLE` (503)
- `AI_MODEL_UNAVAILABLE` (503)
- `AI_OUTPUT_INVALID` (502)
- `BACKUP_INVALID` (400)
- `BACKUP_CHECKSUM_MISMATCH` (400)
- `BACKUP_VERSION_UNSUPPORTED` (400)
- `IMPORT_FAILED` (500)
- `INTERNAL_ERROR` (500)

---

## 2. Resources & Endpoints

### 2.1 Brain Dumps & Candidates
- `POST /api/v1/brain-dumps`
  - Body: `{ "raw_text": "...", "mode": "ai" | "offline_quick_split" }`
  - Returns: `{ "brain_dump": ..., "candidates": [...], "feasibility": ... }`
- `GET /api/v1/brain-dumps/:id`
  - Returns: `{ "brain_dump": ..., "candidates": [...] }`
- `POST /api/v1/candidates/:id/clarify`
  - Body: `{ "answer": "..." }`
  - Returns: `{ "candidate": ..., "all_candidates": [...], "feasibility": ... }`
- `PUT /api/v1/candidates/:id`
  - Body: partial candidate fields (`title`, `estimated_duration`, `priority`, `scheduled_start`, `scheduled_end`, `is_included`, `is_fixed_commitment`, `sort_order`, etc.)
  - Returns: `{ "candidate": ..., "feasibility": ... }`
- `POST /api/v1/schedule/recalculate`
  - Body: `{ "candidates": [...], "day_start": "09:00", "day_end": "22:00" }`
  - Returns: `{ "schedule": [...], "feasibility": ... }`

### 2.2 FIX Approval Gate
- `POST /api/v1/fix`
  - Body: `{ "brain_dump_id": "...", "candidates": [...] }`
  - Description: Transactionally approves the customized proposal into real tasks, checklists, and audit events.
  - Returns: `{ "success": true, "tasks": [...], "scheduled_date": "YYYY-MM-DD" }`

### 2.3 Tasks & Checklists
- `GET /api/v1/tasks` (optional query: `?date=YYYY-MM-DD&status=...`)
  - Returns: `[ { ...task, checklist: [...] }, ... ]`
- `GET /api/v1/tasks/:id`
  - Returns: `{ ...task, checklist: [...], timer_history: [...] }`
- `PUT /api/v1/tasks/:id`
  - Body: update task fields (`title`, `notes`, `priority`, etc.)
- `POST /api/v1/tasks/:id/status`
  - Body: `{ "status": "completed" | "postponed" | "missed" | "cancelled" }`
- `POST /api/v1/tasks/:id/postpone`
  - Body: `{ "target_date": "YYYY-MM-DD" }`
- `POST /api/v1/checklists/:id/toggle`
  - Body: `{ "is_completed": boolean }`
- `POST /api/v1/tasks/:id/checklists`
  - Body: `{ "title": "..." }`

### 2.4 Timers (Backend-Authoritative)
- `GET /api/v1/timers/active`
  - Returns: `{ "active": boolean, "session": ... | null, "task": ... | null, "active_seconds": number }`
- `POST /api/v1/timers/start`
  - Body: `{ "task_id": "..." }`
  - Returns: `{ "session": ... }` or 409 `TIMER_ALREADY_RUNNING`
- `POST /api/v1/timers/pause`
  - Body: `{ "session_id": "..." }`
  - Returns: `{ "session": ... }`
- `POST /api/v1/timers/resume`
  - Body: `{ "session_id": "..." }`
  - Returns: `{ "session": ... }`
- `POST /api/v1/timers/complete`
  - Body: `{ "session_id": "...", "mark_task_completed": boolean }`
  - Returns: `{ "session": ..., "task": ... }`
- `POST /api/v1/timers/abandon`
  - Body: `{ "session_id": "..." }`
- `POST /api/v1/timers/switch`
  - Body: `{ "current_session_id": "...", "new_task_id": "...", "action": "pause" | "complete" | "abandon" }`
  - Switches active timer to new task cleanly.

### 2.5 Daily Review, Analytics & Personalization
- `GET /api/v1/reviews/:date`
  - Returns review for date or creates template summary.
- `POST /api/v1/reviews/:date`
  - Body: `{ "what_went_well": "...", "what_could_improve": "...", "notes": "...", "main_outcome_achieved": boolean }`
- `GET /api/v1/analytics`
  - Returns: `{ "completion_rate": ..., "planned_vs_actual": ..., "productive_hours": ..., "postponement_breakdown": ... }`
- `GET /api/v1/patterns`
  - Returns detected pattern records with confidence ratings and evidence.
- `GET /api/v1/recommendations`
  - Returns active pending recommendations.
- `POST /api/v1/recommendations/:id/accept`
- `POST /api/v1/recommendations/:id/dismiss`

### 2.6 Settings & AI Testing
- `GET /api/v1/settings`
- `PUT /api/v1/settings`
- `POST /api/v1/ai/test`
  - Body: `{ "provider": "ollama" | "openrouter", "base_url": "...", "model": "...", "api_key": "..." }`
  - Returns: `{ "connected": boolean, "status": "connected" | "unavailable" | "model_not_found", "message": "..." }`

### 2.7 Backup & Restore
- `GET /api/v1/backup/export`
  - Streams downloaded `.zip` file with SHA-256 manifest.
- `POST /api/v1/backup/import`
  - Multipart upload of ZIP archive. Verifies checksum, schema, validates SQLite structure, and applies atomically.
