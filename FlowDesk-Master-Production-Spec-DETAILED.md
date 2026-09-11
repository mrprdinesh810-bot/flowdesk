# FlowDesk — Master Production Specification (Final)

**Document status:** FINAL PRE-BUILD MASTER SPECIFICATION  
**Purpose:** Single authoritative implementation contract for an autonomous coding agent  
**Implementation status:** DO NOT START IMPLEMENTATION until this master specification is accepted by the product owner  
**Product:** FlowDesk — AI Daily Productivity & Discipline App

---

## 0. Source of Truth

This document is the implementation-level expansion of the FlowDesk product blueprint.

This document is the **single source of truth** for FlowDesk. It combines the product specification, implementation contract, and production hardening decisions in one file.

**Precedence rule:** if any requirement in an earlier section conflicts with a binding production decision in §45, **§45 wins for that specific decision**. For everything else, the earlier product requirements remain authoritative.

The product is a personalized AI daily productivity and discipline app built around:

**BRAIN DUMP → AI PARSING → CLARIFICATION → FIX → EXECUTION → REVIEW → LEARNING**

The product is **not** a generic todo application.

### Source-derived non-negotiables

1. Natural-language brain dump with no manual organization required.
2. AI parses rough input into structured tasks.
3. The AI asks clarification only for an unclear task.
4. Nothing becomes part of the real plan until the user clicks **FIX**.
5. Approved tasks become timed checklist blocks.
6. Timers record planned versus actual time.
7. Notifications/reminders are supported.
8. Task lifecycle tracks planned, started/running, completed, missed, postponed, and rescheduled.
9. Personalization is based on measurable historical behavior.
10. Personalization is recommendation-only; it must never silently mutate the user's plan.
11. AI providers are Ollama and OpenRouter, using only models/usage explicitly allowed by the user.
12. Core productivity functionality must work when AI is unavailable.
13. User productivity data is local-first.
14. Backup/export/import uses a portable ZIP package for device transfer.
15. The app must work on desktop and mobile widths.

---

# 1. Product Goal

FlowDesk turns an unstructured statement of intended work into an approved, realistic, timed execution plan and then learns from actual execution history.

The product should optimize for **finished meaningful work**, not for the number of tasks entered, messages generated, or plans created.

## 1.1 Core user promise

The user can type messy thoughts such as:

> "college till 4 then edc study, finish trakt parser, revise python and check github issue"

FlowDesk should:

1. understand the input;
2. identify tasks;
3. ask only necessary clarification questions;
4. estimate duration and priority;
5. construct a feasible plan;
6. let the user correct it;
7. require explicit **FIX** approval;
8. convert approved items into execution blocks;
9. run timers and reminders;
10. record what actually happened;
11. use historical evidence to make later plans more realistic.

---

# 2. Product Principles

## P1 — User remains the final decision maker

AI can propose, explain, estimate, classify, and recommend.

AI cannot silently:
- create an approved task;
- delete an approved task;
- change approved duration;
- move an approved task;
- change priority;
- mark work complete;
- mark work missed;
- alter historical records.

Any recommendation that changes a future plan must be presented for approval.

## P2 — Deterministic core

The following must be deterministic application logic, not AI-generated business logic:

- timer calculations;
- elapsed time;
- task status transitions;
- checklist completion;
- schedule overlap checks;
- available-time calculations;
- total planned duration;
- feasibility checks;
- completion metrics;
- planned-versus-actual calculations;
- personalization metrics;
- backup manifest generation and validation.

AI may provide inputs or explanations, but deterministic code is authoritative.

## P3 — AI is optional infrastructure

The application remains useful when:
- Ollama is stopped;
- OpenRouter is unavailable;
- the selected model is unavailable;
- a model returns invalid data;
- the network is unavailable.

AI-specific functions degrade gracefully to an offline fallback.

## P4 — Evidence before personalization

The system must not claim to know a user pattern without sufficient historical evidence.

Every learned pattern must have:
- evidence count;
- calculation method;
- confidence;
- time window;
- timestamp;
- human-readable explanation.

## P5 — Portable local ownership

Productivity data belongs to the user and must remain locally accessible and exportable.

---

# 3. Explicit Non-Goals

Do not add these unless the user later approves them as separate requirements:

- social feeds;
- team collaboration;
- public profiles;
- gamification-heavy reward systems;
- cryptocurrency;
- advertising;
- cloud-only storage;
- mandatory accounts;
- automatic paid AI usage;
- autonomous task execution;
- hidden behavior tracking;
- background AI analysis that sends data without a user-triggered operation.

---

# 4. End-to-End Product Workflow

## Stage A — Brain Dump

The Brain Dump screen contains a large text input.

The user may enter:
- fragments;
- incomplete sentences;
- shorthand;
- mixed task types;
- approximate times;
- deadlines;
- personal notes;
- uncertainty.

The user is not required to format the input.

### Actions

**Parse with AI**
- sends the brain dump through the selected provider/model;
- receives structured candidate tasks.

**Quick Split (offline)**
- creates candidate tasks using deterministic local text splitting;
- does not claim semantic understanding.

### Requirement

Original raw brain dump must be preserved exactly.

---

## Stage B — AI Parsing

The AI receives the user's explicit brain dump and contextual information allowed for planning.

The model must return validated structured data.

Each candidate task contains:

- stable temporary candidate ID;
- title;
- optional description;
- priority;
- category;
- estimated duration;
- optional deadline;
- optional fixed-time constraint;
- checklist;
- tags;
- confidence;
- clarification_required;
- clarification_reason.

### Important

AI confidence is advisory metadata only.

The application does not treat confidence as truth.

---

# 5. Clarification System

When exactly one task is unclear, the system asks only about that task.

### Example

Candidate:

> "Fix supplier issue"

Clarification:

> "What specifically do you need to do with the supplier issue?"

The user answers:

> "Check whether the imported CSV columns map correctly."

The candidate is regenerated/updated.

## 5.1 Clarification rules

- Ask the smallest useful question.
- Do not ask for information already present.
- Do not block unrelated tasks unnecessarily.
- A clarification can be answered, skipped, or cancelled.
- If the user skips clarification, mark the task unresolved and keep it outside FIX-ready status unless the user explicitly edits it.

## 5.2 Clarification loop limit

Default maximum: 3 clarification rounds per candidate.

After the limit:
- present the task for manual editing;
- explain that AI could not resolve it reliably.

---

# 6. Candidate Plan / FIX Gate

Before FIX, all items are candidates.

The review screen must visibly distinguish:

**Candidate / AI suggestion**
from
**Approved / fixed task**

The user can edit:
- title;
- description;
- priority;
- category;
- estimated duration;
- scheduled time;
- checklist;
- tags;
- deadline;
- notes.

The screen must show:

- total planned minutes;
- available minutes;
- workload difference;
- overlap warnings;
- deadline conflicts;
- recommended changes;
- unresolved items.

## 6.1 FIX action

When the user clicks **FIX**:

1. validate every candidate;
2. validate schedule feasibility;
3. create approved task records;
4. create checklist records;
5. create schedule records;
6. record an approval event;
7. mark the source brain dump as approved;
8. preserve the pre-FIX candidate snapshot for audit/history.

Nothing is considered real before successful FIX.

## 6.2 Partial FIX

Default behavior:

- valid tasks can be fixed;
- unresolved/invalid tasks remain candidates;
- the user receives an explicit summary of what was approved and what remains unresolved.

The app must never silently discard unresolved tasks.

---

# 7. Scheduling Engine

Scheduling is deterministic.

AI may suggest scheduling preferences, but the application validates and computes the final schedule.

## 7.1 Inputs

- available work window;
- existing fixed commitments entered by the user;
- candidate task durations;
- priorities;
- deadlines;
- task constraints;
- user preferences;
- learned recommendations;
- break settings.

## 7.2 Outputs

- scheduled start;
- scheduled end;
- task order;
- breaks;
- warnings;
- overflow tasks;
- feasibility status.

## 7.3 Scheduling rules

1. Never overlap two active task blocks.
2. Never place a task outside its hard deadline when doing so would violate the user's explicit constraint.
3. Never remove an approved task silently.
4. If total workload exceeds capacity, preserve all tasks but identify overflow.
5. Higher-priority tasks receive earlier placement unless blocked by a fixed constraint.
6. Fixed-time events take precedence over flexible tasks.
7. Add configured breaks where appropriate.
8. Learned patterns are recommendations, not hidden rules.
9. User edits always override recommendations.

## 7.4 Workload warning

If:

`planned_minutes > available_minutes`

show:

> Your planned work exceeds the available time by X minutes.

Then list:
- tasks that fit;
- tasks causing overflow;
- recommended candidates to move.

The system must not automatically move them without approval.

---

# 8. Task State Machine

Every approved task has exactly one current state.

### States

- `planned`
- `running`
- `paused`
- `completed`
- `postponed`
- `missed`
- `rescheduled`
- `cancelled`

### Primary transitions

```text
FIX
  ↓
PLANNED
  ↓
RUNNING
  ↓
COMPLETED

PLANNED/RUNNING
  ↓
POSTPONED

PLANNED
  ↓
RESCHEDULED
  ↓
PLANNED

PLANNED/RUNNING
  ↓
MISSED

PLANNED
  ↓
CANCELLED
```

## 8.1 Transition enforcement

The backend is the authority for state transitions.

Invalid transitions must return a controlled error.

Every transition creates an immutable event record.

---

# 9. Checklist Model

Every fixed task may contain ordered checklist items.

Each checklist item has:

- id;
- task_id;
- title;
- order_index;
- completed;
- completed_at;
- optional estimated_minutes.

## 9.1 Checklist behavior

- Ticking an item persists immediately.
- Reopening an item is allowed until task completion.
- Completing all checklist items does not automatically mark the task complete unless the user has enabled that preference.
- A task may be completed even when some checklist items remain incomplete, but the UI must warn the user.

---

# 10. Timer Engine

The timer must be based on timestamps, not on a UI countdown variable.

## 10.1 Required controls

- Start
- Pause
- Resume
- Complete
- Stop/Abandon according to product semantics
- Extend
- Postpone

## 10.2 Required data

For every timing session:

- task_id;
- session_id;
- started_at;
- pause intervals;
- resumed_at;
- ended_at;
- planned duration;
- actual active duration;
- completion state.

## 10.3 Timer authority

The backend/database timestamp history is authoritative for persisted timing.

The frontend countdown is a display.

If the page reloads:
- the timer must restore correctly.

If the browser tab is backgrounded:
- elapsed time must remain correct.

If the device clock changes significantly:
- record an integrity warning where detectable.

## 10.4 Actual duration

Actual active duration excludes explicitly paused intervals.

---

# 11. Notifications

Notifications are for execution, not encouragement spam.

## 11.1 Notification types

- upcoming task;
- task start;
- task ending soon;
- task ended;
- overdue task;
- next task;
- postponed task reminder.

## 11.2 Requirements

- notification preferences can be disabled;
- duplicate notifications must be prevented;
- notification state persists;
- user can configure lead time;
- notification failures must not break task execution.

For web environments, use supported browser/PWA notification mechanisms only.

---

# 12. Review System

At the end of a work period/day, the system summarizes:

- completed;
- missed;
- postponed;
- rescheduled;
- cancelled;
- planned minutes;
- actual active minutes;
- difference between planned and actual;
- checklist completion.

The review should also ask for optional reason coding on unfinished tasks:

- not enough time;
- harder than expected;
- unexpected interruption;
- lost focus;
- low priority;
- dependency/blocker;
- user choice;
- other.

This reason is user input and must not be inferred as fact by AI.

---

# 13. Personalization Engine

Personalization is based on recorded behavior.

## 13.1 Metrics

### Completion rate

```text
completed_tasks / eligible_planned_tasks
```

### Estimation error

For each completed task:

```text
absolute_error = abs(actual_minutes - planned_minutes)
relative_error = absolute_error / max(planned_minutes, 1)
```

Aggregate over a defined historical window.

### Productive hours

Group successful focus sessions by local hour.

Do not call an hour "productive" without a minimum evidence threshold.

### Repeated postponement

Count postponements per task/category/type.

### Frequent misses

Group similar tasks using deterministic identifiers first:
- exact task identity;
- normalized title;
- category;
- tags.

AI semantic grouping may be advisory and must show evidence.

### Workload capacity

Estimate the amount of planned work usually completed within a defined period.

Use a rolling window, not lifetime data only.

---

# 14. Pattern Confidence

No pattern should be shown as a strong conclusion with insufficient data.

Suggested states:

- `insufficient_data`
- `emerging`
- `supported`
- `strong`

Example:

> "Your coding tasks have averaged 87 minutes across 11 completed sessions."

is evidence-backed.

Avoid:

> "You are bad at estimating coding."

The product describes behavior, not identity.

---

# 15. Recommendation Engine

Recommendations may propose:

- duration adjustment;
- schedule-time adjustment;
- workload reduction;
- task splitting;
- moving a likely-missed task;
- adding buffer time.

Every recommendation must contain:

- recommendation;
- evidence;
- confidence;
- affected tasks;
- expected benefit;
- approve/ignore action.

## 15.1 Hard rule

Recommendations never automatically change approved work.

The user must choose whether to apply a recommendation.

---

# 16. AI Architecture

AI providers:

1. Ollama
2. OpenRouter

The app must not hard-code a single model.

## 16.1 Provider abstraction

Use one internal interface:

```text
AIProvider
├── healthCheck()
├── listModels()
├── parseBrainDump()
├── clarifyTask()
├── generateScheduleRecommendation()
└── generatePatternExplanation()
```

Each provider maps into this contract.

## 16.2 Model allowlist

The user explicitly configures the models allowed for use.

No paid model may be selected automatically.

No silent fallback to an unapproved model.

## 16.3 OpenRouter cost protection

The app should make a provider/model request only when:
- user has configured the provider;
- selected model is allowed;
- the request is initiated by a supported application action.

The application must not promise that third-party free credits are unlimited.

Show provider/model before or at the time of an AI operation.

---

# 17. AI Output Validation

Never trust model JSON directly.

Pipeline:

```text
raw model response
→ extract candidate JSON
→ parse JSON
→ schema validation
→ semantic validation
→ normalization
→ application use
```

On failure:

1. attempt bounded repair;
2. if still invalid, show a clear error;
3. preserve original model output for diagnostics locally where appropriate;
4. offer Quick Split or manual editing.

Do not repeatedly call the model without a bounded retry policy.

Default:
- maximum 2 structured-output retries.

---

# 18. AI Privacy Boundary

Only send data to AI when the user explicitly invokes an AI feature.

For Ollama:
- requests remain local by default.

For OpenRouter:
- data leaves the device as required by the user's configured provider.

The app should clearly identify the active provider.

History, analytics, patterns, settings, and task storage remain local.

---

# 19. Offline Mode

Without AI, the following must continue to work:

- view tasks;
- create/edit tasks manually;
- checklist;
- timer;
- scheduling validation;
- notifications where the platform supports them;
- review;
- analytics;
- pattern calculations;
- backup/export/import.

Quick Split offline behavior:

1. split by new lines;
2. optionally split by common separators;
3. trim whitespace;
4. create simple candidate task titles;
5. assign safe default duration;
6. use manual editing before FIX.

Quick Split must clearly state:

> Offline split — no semantic AI parsing was used.

---

# 20. Local Storage Architecture

Recommended production default:

```text
Application
├── SQLite database
├── schema/version metadata
├── local configuration
└── generated backups
```

The live database must not rely on the ZIP file.

## 20.1 Required data domains

- app metadata;
- brain dumps;
- candidate tasks;
- approved tasks;
- checklist items;
- task events;
- timer sessions;
- notifications;
- daily reviews;
- pattern observations;
- recommendations;
- user settings;
- AI provider settings;
- backup metadata.

---

# 21. Data Model Requirements

Every record should use:
- stable ID;
- created_at;
- updated_at where mutable;
- schema-compatible fields.

## 21.1 Brain dumps

- id;
- raw_text;
- parsed result;
- parsing provider;
- parsing model;
- parsing status;
- created_at;
- updated_at.

## 21.2 Tasks

- id;
- source_brain_dump_id;
- title;
- description;
- priority;
- category;
- tags;
- estimated_duration;
- planned_duration;
- actual_duration;
- scheduled_date;
- scheduled_start;
- scheduled_end;
- deadline;
- status;
- postponed_count;
- created_at;
- updated_at.

## 21.3 Task events

Immutable event log:
- id;
- task_id;
- event_type;
- prior_state;
- next_state;
- timestamp;
- metadata JSON.

## 21.4 Timer sessions

- id;
- task_id;
- started_at;
- ended_at;
- total_paused_seconds;
- active_seconds;
- state.

## 21.5 Patterns

- id;
- pattern_type;
- observation_window_start;
- observation_window_end;
- metric_value;
- sample_count;
- confidence;
- evidence JSON;
- generated_at.

## 21.6 Recommendations

- id;
- recommendation_type;
- recommendation_data;
- confidence;
- evidence;
- status (`pending`, `accepted`, `dismissed`);
- created_at;
- resolved_at.

---

# 22. Backup / Restore Specification

Export creates a ZIP package.

Example:

```text
flowdesk-backup-YYYY-MM-DD-HH-mm.zip
├── manifest.json
├── database.sqlite
└── metadata.json
```

## 22.1 Manifest

Must contain:
- backup format version;
- app version;
- schema version;
- creation timestamp;
- record counts;
- checksum(s).

## 22.2 Import validation

Before modifying live data:

1. inspect ZIP safely;
2. validate file names;
3. validate manifest;
4. validate checksum;
5. validate schema version;
6. load into a temporary database;
7. run integrity checks;
8. only then replace/merge the active dataset.

A failed import must leave the current database unchanged.

## 22.3 Device transfer

A valid backup can be moved manually between laptop and mobile-compatible installations.

---

# 23. Import Conflict Policy

Because backups can be imported from another device, the app must define behavior.

Default:

- restore/replace mode for a full backup;
- explicit confirmation before destructive replacement.

Future optional mode:

- merge mode using stable IDs and conflict reporting.

Do not silently overwrite data.

---

# 24. UI/UX Requirements

## 24.1 Dashboard

Show:
- current task;
- next task;
- today's progress;
- planned vs actual time;
- quick brain dump entry;
- active timer;
- important warnings;
- one or two useful pattern insights.

Avoid crowded dashboards.

## 24.2 Brain Dump

Primary focus:
- large text input;
- Parse with AI;
- Quick Split;
- parsing status;
- clarification panel;
- candidate review.

## 24.3 Review/FIX Screen

Each candidate appears in an editable card.

Show:
- task;
- priority;
- duration;
- schedule;
- checklist;
- warnings;
- recommendation indicators.

Bottom/top persistent summary:

```text
Planned: 4h 40m
Available: 4h 00m
Overflow: 40m
```

Primary action:

**FIX PLAN**

## 24.4 Task Board

Filters:
- today;
- upcoming;
- completed;
- missed;
- postponed;
- all.

Search should be fast and local.

## 24.5 Task Detail

Show:
- title;
- schedule;
- countdown;
- checklist;
- planned vs actual;
- state;
- history;
- postpone/reschedule controls.

## 24.6 Timer

Large readable countdown.

Minimal distraction mode is preferred.

## 24.7 Review

Make the user quickly understand:
- what got done;
- what did not;
- what took longer;
- why work was missed.

## 24.8 Analytics

Display:
- completion rate;
- estimation accuracy/error;
- actual vs planned;
- productive-hour distribution;
- frequent postponements;
- frequent misses;
- workload capacity;
- trend over a selectable window.

Every insight must show evidence/time range when practical.

## 24.9 Settings

- profile;
- timezone/locale;
- work windows;
- break length;
- notifications;
- AI provider;
- approved models;
- AI request behavior;
- backup;
- data management.

---

# 25. Responsive Requirements

Must work at minimum on:

- desktop/laptop width;
- tablet width;
- mobile portrait width.

Desktop may use multi-column layouts.

Mobile must prioritize:
- current task;
- timer;
- FIX;
- checklist;
- brain dump.

No core feature may depend on hover-only interaction.

---

# 26. Accessibility Requirements

- semantic headings;
- visible labels;
- keyboard navigation;
- accessible form controls;
- focus states;
- adequate touch targets;
- aria labels for icon-only controls;
- reduced-motion consideration;
- readable timer contrast;
- error messages associated with fields.

---

# 27. Error Handling

Every asynchronous operation needs:

- loading state;
- success state;
- clear failure state;
- recovery action.

Examples:

AI unavailable:

> Ollama is unavailable. You can retry or use Quick Split.

Invalid import:

> This backup could not be restored. Your current data was not changed.

Timer failure:

> The timer could not persist the last action. Review the recovered session.

Never leave the user with a silent spinner.

---

# 28. Security Requirements

Even for a local app:

- validate all API inputs;
- validate all imported files;
- reject path traversal in ZIP files;
- do not expose raw database endpoints;
- do not execute imported content;
- keep secrets outside source control;
- redact sensitive values from logs;
- never put API keys into frontend bundles;
- use server-side provider calls where credentials are involved.

---

# 29. Logging and Diagnostics

Logs must help debugging without leaking sensitive productivity data unnecessarily.

Include:
- timestamp;
- subsystem;
- operation;
- error category;
- request/correlation ID where useful.

Avoid logging:
- full brain dumps by default;
- API keys;
- provider secrets;
- unnecessary personal task content.

Provide a local diagnostic export only if later approved.

---

# 30. Configuration

Environment/configuration should support:

- server port;
- database path;
- Ollama base URL;
- allowed Ollama models;
- OpenRouter base URL;
- OpenRouter credential storage strategy;
- allowed OpenRouter models;
- notification defaults;
- log level;
- application environment.

Production configuration must never require source-code editing.

---

# 31. API Design Requirements

Use versionable API routes.

Suggested:

```text
/api/v1/brain-dumps
/api/v1/candidates
/api/v1/tasks
/api/v1/checklists
/api/v1/timers
/api/v1/notifications
/api/v1/reviews
/api/v1/analytics
/api/v1/patterns
/api/v1/recommendations
/api/v1/settings
/api/v1/backup
/api/v1/ai
```

Responses should have consistent error structure.

Example:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Task duration must be greater than zero",
    "details": {}
  }
}
```

---

# 32. Frontend State Rules

The frontend must not be the authority for:
- task state transitions;
- actual elapsed duration;
- approval persistence;
- analytics calculations;
- backup validity.

Frontend:
- displays;
- collects input;
- requests actions;
- reflects backend state.

---

# 33. Testing Strategy

Testing is mandatory.

## 33.1 Unit tests

Cover:
- duration calculations;
- timer calculations;
- state machine;
- scheduling;
- workload checks;
- metric calculations;
- recommendation thresholds;
- backup manifest;
- import validation;
- AI schema validation.

## 33.2 Integration tests

Cover:
- brain dump → candidate creation;
- clarification flow;
- FIX → task creation;
- task → checklist;
- task → timer;
- timer → actual duration;
- task status transitions;
- analytics aggregation;
- export → import.

## 33.3 End-to-end tests

At minimum:

### E2E-01 Happy path

```text
brain dump
→ AI parse/mock AI
→ review
→ FIX
→ task exists
→ start timer
→ pause
→ resume
→ complete
→ review reflects completion
→ analytics reflects actual time
```

### E2E-02 Clarification

```text
brain dump
→ ambiguous task
→ clarification
→ answer
→ candidate updated
→ FIX
```

### E2E-03 AI unavailable

```text
AI request fails
→ user uses Quick Split
→ FIX
→ normal execution works
```

### E2E-04 Unrealistic plan

```text
planned > available
→ warning
→ recommendations shown
→ no silent movement
→ user approves final plan
```

### E2E-05 Backup

```text
create data
→ export ZIP
→ validate ZIP
→ import into clean test database
→ compare records
```

### E2E-06 Timer recovery

```text
start timer
→ reload app
→ timer state recovered correctly
```

---

# 34. Acceptance Criteria

The product is not complete until all of these are true.

## AC-01 Brain dump

A user can enter unstructured text without manually creating task rows.

## AC-02 Parsing

The selected AI provider can return structured candidate tasks conforming to schema validation.

## AC-03 Clarification

An unclear task causes a focused clarification request rather than a broad questionnaire.

## AC-04 FIX

No candidate becomes an approved task until the user explicitly clicks FIX.

## AC-05 Scheduling

The app detects workload overflow and schedule conflicts deterministically.

## AC-06 Execution

An approved task can be started, paused, resumed, completed, postponed, missed, and rescheduled according to valid transitions.

## AC-07 Timer

Planned and actual time are recorded accurately across pause/resume and page reload scenarios.

## AC-08 Notification

Configured reminders are triggered where supported by the platform.

## AC-09 Review

The user can see completed, missed, postponed, and rescheduled work.

## AC-10 Personalization

Analytics are derived from actual stored history and display evidence/confidence.

## AC-11 Recommendation safety

Pattern-based recommendations never silently modify approved plans.

## AC-12 AI fallback

Core functions remain usable when AI is unavailable.

## AC-13 Cost boundary

The application never automatically invokes an unapproved or paid AI model.

## AC-14 Local data

Productivity data is stored locally.

## AC-15 Backup

A valid ZIP can be exported and safely restored.

## AC-16 Responsive

Core workflows function on desktop and mobile widths.

## AC-17 Failure recovery

AI/network/import/database errors have readable recovery paths.

---

# 35. Performance Targets

Reasonable local targets:

- initial dashboard render: fast on a normal modern laptop;
- local database reads: near-instant for ordinary personal-data volumes;
- task/checklist actions: immediate UI confirmation after successful persistence;
- timer display: smooth and stable;
- analytics: cached or incrementally calculated where needed.

Do not optimize prematurely, but avoid unnecessary repeated database queries and AI requests.

---

# 36. Reliability Requirements

The app must prefer data integrity over convenience.

Examples:

- persist state changes before showing success;
- never double-complete a timer session;
- never create duplicate notifications for the same event;
- never partially replace a database during failed import;
- never lose an approved task because an AI recommendation failed;
- never require AI to read existing data merely to display it.

---

# 37. Versioning and Migration

Maintain:
- app version;
- database schema version;
- backup format version;
- AI contract version where needed.

Schema changes require migrations.

A backup created by an older supported version must either:
- migrate safely;
- or be rejected with a clear compatibility message.

---

# 38. Recommended Project Structure

```text
flowdesk/
├── apps/
│   ├── web/
│   └── server/
├── packages/
│   ├── domain/
│   ├── schemas/
│   ├── scheduler/
│   ├── analytics/
│   ├── ai/
│   └── backup/
├── data/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
└── scripts/
```

The exact framework implementation can differ if behavior and acceptance criteria remain satisfied.

---

# 39. Recommended Technology Direction

The existing product blueprint specifies:

- React + TypeScript + Vite;
- Tailwind CSS;
- Node.js + Express;
- SQLite;
- Ollama;
- OpenRouter.

These remain the baseline implementation direction.

The agent may improve internal libraries or patterns if it documents the reason and preserves all externally visible requirements.

---

# 40. Agent Operating Rules

The coding agent must follow these rules.

## Rule 1 — Read before coding

Before implementation:
- read this document completely;
- inspect existing repository contents;
- identify contradictions;
- identify missing implementation decisions.

Do not immediately generate a large codebase.

## Rule 2 — Preserve product rules

Do not remove or weaken:
- FIX gate;
- recommendation-only personalization;
- local-first data;
- AI offline usability;
- free/approved model restriction.

## Rule 3 — Do not invent product behavior silently

When behavior is genuinely unspecified:
1. choose the safest reversible implementation;
2. document the decision in `docs/DECISIONS.md`;
3. keep it compatible with this specification.

## Rule 4 — Small vertical slices

Build and verify in this order:

1. local persistence;
2. tasks/checklists/state machine;
3. timer;
4. brain dump + offline Quick Split;
5. AI adapter;
6. FIX workflow;
7. scheduling;
8. notifications;
9. review/analytics;
10. personalization;
11. backup/import;
12. polish.

## Rule 5 — Test every slice

Do not proceed while the current slice is broken.

## Rule 6 — No fake implementations

Do not leave:
- TODO-only core paths;
- placeholder buttons claiming success;
- mock data in production flows;
- fake timers;
- fake analytics;
- simulated backup success.

Mocks may be used only inside tests or clearly labeled development mode.

## Rule 7 — Never claim completion without evidence

The final report must include:
- tests run;
- test counts/results;
- build result;
- end-to-end verification;
- known limitations;
- exact run instructions.

---

# 41. Definition of Done

The implementation can be called complete only when:

```text
[ ] Specification reviewed
[ ] Repository structure documented
[ ] Database created and migrated
[ ] State machine implemented and tested
[ ] Checklist persistence implemented
[ ] Timer persistence implemented
[ ] Brain Dump implemented
[ ] Offline Quick Split implemented
[ ] AI provider abstraction implemented
[ ] Ollama integration implemented
[ ] OpenRouter integration implemented
[ ] Allowed-model/cost guard implemented
[ ] AI JSON validation implemented
[ ] Clarification loop implemented
[ ] FIX gate implemented
[ ] Deterministic scheduling implemented
[ ] Overflow detection implemented
[ ] Notifications implemented where supported
[ ] Review implemented
[ ] Analytics implemented
[ ] Pattern evidence/confidence implemented
[ ] Recommendation approval flow implemented
[ ] Local backup export implemented
[ ] Backup import validation implemented
[ ] Responsive UI verified
[ ] Accessibility basics verified
[ ] Error/recovery states verified
[ ] Unit tests passing
[ ] Integration tests passing
[ ] E2E tests passing
[ ] Production build passing
[ ] Fresh-install test passing
[ ] Existing-data migration/backup test passing
[ ] README completed
[ ] Architecture/documentation completed
[ ] Known limitations documented
```

---

# 42. Final Acceptance Scenario

A human tester must be able to perform this sequence successfully:

```text
1. Open FlowDesk.

2. Enter:
   "College till 4. Study EDC for two hours.
    Finish TRAKAE parser.
    Check GitHub later."

3. Parse the brain dump.

4. If "check GitHub later" is insufficiently defined,
   the app asks about that task only.

5. Review candidate tasks.

6. Edit a duration if needed.

7. See total planned versus available time.

8. Click FIX.

9. Approved tasks become real timed blocks.

10. Start the first task.

11. Timer counts accurately.

12. Tick checklist items.

13. Pause and resume.

14. Complete the task.

15. See actual duration recorded.

16. Postpone another task.

17. Review the day.

18. See completed/postponed/unfinished work.

19. Open analytics.

20. After sufficient historical data exists,
    see evidence-backed pattern insights.

21. Receive a recommendation.

22. Recommendation does not modify the plan automatically.

23. Export a ZIP.

24. Import the ZIP into a clean environment.

25. Verify data integrity.

26. Turn AI off.

27. Continue using task/checklist/timer/review functionality.
```

---

# 43. Required Documentation Outputs from the Agent

The implementation repository must contain:

```text
README.md
docs/PRODUCT.md
docs/ARCHITECTURE.md
docs/DATA_MODEL.md
docs/AI_CONTRACT.md
docs/SCHEDULING.md
docs/PERSONALIZATION.md
docs/BACKUP_FORMAT.md
docs/DECISIONS.md
docs/TESTING.md
```

Documentation must describe actual behavior after implementation, not aspirational behavior only.

---

# 44. Final Instruction to the Coding Agent

Build FlowDesk **only according to this document**.

Before implementation:
1. Read the entire specification.
2. Treat every **MUST**, **MUST NOT**, **SHALL**, and **DECISION** as binding.
3. Treat §45 as the final authority for the production decisions it covers.
4. Do not invent product behavior silently.
5. Record any justified implementation-level decision in `docs/DECISIONS.md`.
6. Do not declare completion without executable tests and evidence for the Definition of Done.

The implementation must prioritize, in order:

**data integrity → user control → deterministic correctness → reliable execution → graceful AI behavior → personalization → visual polish.**

The AI is an assistant to the application, not the authority over the user's plan or historical records.

# 45. Binding Production Decisions

This section closes the remaining implementation ambiguities identified during production review. These decisions are part of the master specification and are binding unless the product owner explicitly changes them before implementation.

### 45.A — Deployment & Runtime Topology  ← **the most important decision**

The base spec requires desktop **and** mobile use, and laptop ↔ mobile data transfer.
The chosen stack (Node + Express + SQLite) runs only on a desktop-class machine. Resolve
the contradiction explicitly.

**DECISION (v1 scope):**

- **Desktop** = the full product. `server/` (Node + Express + SQLite) runs on the user's
  laptop, bound to `127.0.0.1`. The `web/` UI runs in a normal browser tab.
- **Mobile** = the **same responsive web UI**, delivered as an installable **PWA** (§B),
  accessed in one of two supported ways (both out of scope for v1, but the UI must not
  depend on either to be mobile-responsive):
  - *(v1.1, optional)* served from the desktop over LAN (a single "Share on network" toggle), or
  - *(future)* a mobile-native shell (Capacitor) that embeds a local SQLite + the same web UI.
- **Laptop ↔ mobile transfer is via ZIP backup only** (§22), exactly as the base spec states.
  This is the correct v1 mechanism; it is not a live sync, and the spec should not imply one.

**What the agent must NOT do:** invent a cloud sync service, or claim the Node backend runs
on iOS/Android. Record this in `docs/DECISIONS.md` as `DECISION-RUNTIME-TOPOLOGY`.

---

### 45.B — PWA Specification (makes "mobile + notifications + offline" real)

The base spec references PWA notifications but never defines the PWA contract.

**DECISION:** Ship the web UI as a PWA. Required artifacts:

1. **`manifest.json`** — `name: FlowDesk`, `short_name: FlowDesk`, `display: standalone`,
   `start_url: /`, theme/background colors, and app icons (192px + 512px PNG/SVG, local assets).
2. **Service worker** — at minimum:
   - **App-shell caching** for the built frontend assets (so the UI loads offline).
   - **Network-first** for all `/api/*` requests (never cache API responses; they must always
     hit the local backend or show the offline state).
   - Versioned cache name + activation that deletes stale caches.
3. **Install prompt** surfaced from the Settings/Backup area (not intrusive on first load).
4. **Offline behavior:** when the service worker cannot reach the backend, show the existing
   offline/error states — never a blank screen.

**Boundary:** PWA offline means the *shell* loads; data operations still require the local
backend running on desktop. On a phone (future), the embedded shell (§A) supplies the data layer.

---

### 45.C — SQLite Driver Decision (avoids the #1 build failure)

The base spec says "SQLite" but not *how*. Native modules like `better-sqlite3` require a
working C++ toolchain and frequently fail `npm install` on clean machines.

**DECISION (pick exactly one, in priority order):**

1. **`better-sqlite3` (preferred)** — synchronous, fast, mature. **Condition:** verify a
   prebuilt binary exists for the target Node version; document in `README.md` that a C++
   build toolchain is required *only if* no prebuilt binary matches.
2. **Node's built-in `node:sqlite`** (Node ≥ 22, flag-gated) — zero native deps, but API is
   still marked experimental. Acceptable if the agent pins Node and treats the API surface as
   frozen.
3. **`sql.js` (WASM)** — zero native compilation, fully portable, but requires explicit
   manual persistence (`db.export()` → file) after writes. Use only if (1) and (2) are blocked.

**Whatever is chosen, the data layer must sit behind a single `db` module** exposing
`prepare(sql).get/all/run(...)` + `exec` so the driver can be swapped without touching
business logic. This is a hard architectural constraint, not a suggestion.

---

### 45.D — Identity & Auth (single-user, no auth)

**DECISION:** v1 is **strictly single-user with no authentication**. Rationale: local-first,
single-device, personal data; the base spec explicitly lists "mandatory accounts" as a non-goal
(§3). The `user_id` fields in the data model are **device-identity scaffolding for future
merge/import**, defaulting to a single constant (`user-001`). Do not build login, sessions, or
user management.

---

### 45.E — Timer Concurrency (one focus session at a time)

**DECISION:** At most **one active timer globally** at any time. Starting a timer while another
is running returns a controlled error (`TIMER_ALREADY_RUNNING`) listing the active task, with a
"switch to this task" action that completes/abandons the current session first. This matches the
"focus" intent and avoids ambiguous elapsed-time accounting. Enforce this in the **backend**, not
the UI.

---

### 45.F — Multi-Tab & Write Integrity

**DECISION:** The backend is the single writer (already stated in §32). Add:
- SQLite `journal_mode = WAL` for read concurrency.
- A `BroadcastChannel`/`storage` event in the frontend so multiple tabs reflect state changes
  without re-fetch storms.
- A simple **write serialization** guarantee on the server: since Node is single-threaded and
  SQLite writes are synchronous (with better-sqlite3), serialization is automatic — but the agent
  must not introduce a pool/worker that breaks this assumption without noting it in
  `docs/DECISIONS.md`.

---

### 45.G — Time Handling (UTC + monotonic clock)

**DECISION:**
- **Store all timestamps in UTC (ISO-8601).**
- **Render in the user's configured local timezone** (from settings §24.9).
- **Timer elapsed time** is computed from persisted UTC timestamps (backend authority, §10.3).
  For detecting clock jumps, keep a monotonic reference (`performance.now()` / process
  `hrtime`) on the client and, on the server, compare `Date.now()` deltas against `setInterval`
  drift; on a suspicious jump, write an `integrity_warning` event (§10.3) rather than silently
  trusting wall-clock.

---

### 45.H — Toolchain & Versions (pin these)

**DECISION (baseline, matching base spec §39):**

| Concern | Choice | Note |
|---|---|---|
| Package manager | npm (lockfiles committed) | simplest reproducible default |
| Frontend | React 18 + TypeScript + Vite 5 + Tailwind CSS 3 | §39 baseline |
| Backend | Node.js (LTS ≥ 20, pin exact) + Express 4 | §39 baseline |
| DB | per §C | — |
| State | Zustand (or React context if the agent prefers — record choice) | §32 says frontend is not authority |
| Unit tests | Vitest | matches Vite |
| API/integration tests | supertest + Vitest | |
| E2E tests | Playwright | §33 scenarios |
| Lint/format | ESLint + Prettier (optional but recommended) | |
| Monorepo | **Two top-level apps** (`apps/web`, `apps/server`) + shared `packages/*` only if the agent can justify reuse. Do not force a heavy monorepo tool (Turborepo/Nx) for a personal single-user app unless it simplifies, not complicates. | resolves §38 vs §39 tension |

---

### 45.I — Notification Reality Boundary

**DECISION:** v1 supports **web/PWA notifications only** — meaning: notifications fire while
the app is open or the PWA is installed and running. **OS-level background push (app fully
closed, phone locked) is explicitly out of scope** for a pure web app and must be documented
as a known limitation (§41). Do not attempt silent/background push; do not promise it.

---

### 45.J — Security Binding & API Key Boundary

**DECISION:**
- The Express server binds to **`127.0.0.1` by default** (never `0.0.0.0`), with CORS
  restricted to the local frontend origin(s).
- **OpenRouter API keys are stored outside the repository and outside the database** — in a
  local `.env` (gitignored) or local OS keychain, loaded server-side only. They are **never**
  baked into the frontend bundle, never returned by any API, and never logged (§28, §29).
- All AI calls go through the **local backend** (server-side provider calls, §28). The
  frontend never holds provider credentials.
- If "Share on network" (§A) is ever enabled, it must be an explicit opt-in and must not expose
  the OpenRouter key or the raw database over the network.

---

### 45.K — Backup Checksum & Format

**DECISION:** Checksums in the backup manifest (§22.1) use **SHA-256** (hex). The manifest
lists `sha256` for `database.sqlite`. Import verifies the checksum **before** any load
(§22.2). Encryption of backups is **out of scope for v1** (data is already local and
user-owned); note it as a future option. Backup format version starts at `1`, schema version
starts at `1`, both written into the manifest.

---

### 45.L — Localization & Scope

**DECISION:** v1 is **single-locale (English)**. Do not add an i18n framework. Hard-code
strings but keep them in one place where practical so a future locale can be added without
restructuring. Record `DECISION-SINGLE-LOCALE` in `docs/DECISIONS.md`.

---


### 45.M — Additional Definition-of-Done Checks

Append these checkboxes to the base Definition of Done:

```
[ ] Runtime topology documented (DECISION-RUNTIME-TOPOLOGY)
[ ] PWA manifest + service worker shipped and offline shell verified
[ ] SQLite driver pinned and documented with build-toolchain note
[ ] Single-user/no-auth decision documented
[ ] Single-active-timer rule enforced server-side
[ ] Multi-tab state propagation verified
[ ] UTC storage + local rendering + clock-jump warning implemented
[ ] Toolchain versions pinned in lockfiles
[ ] Server binds to 127.0.0.1; CORS restricted
[ ] OpenRouter key stored outside repo/DB, never in frontend/logs
[ ] Backup SHA-256 checksum verified on export and import
[ ] Notification boundary documented as a known limitation
[ ] docs/DECISIONS.md records every DECISION above with rationale
```

---



# 46. Master Specification Completion Rule

FlowDesk is not considered complete because the application launches, compiles, or passes a partial test suite.

Completion requires all of the following:

- the product workflow works end-to-end;
- deterministic business rules are enforced by the application;
- the FIX approval boundary is enforced;
- timer and notification behavior is verified;
- local storage and backup/restore are verified;
- AI failure and offline fallback paths are verified;
- personalization is based on recorded evidence and remains recommendation-only;
- the PWA/runtime boundaries are correctly implemented and documented;
- security constraints are verified;
- all required automated tests pass;
- the Final Acceptance Scenario and Definition of Done are demonstrated with evidence.

**This document supersedes the previous separate FlowDesk agent-ready specification and production addendum when used as the implementation source of truth.**
---

# 47. Detailed Implementation Contract

This section expands the master specification into an implementation-ready contract.
It does not change the product direction established above. It makes expected behavior,
boundaries, inputs, outputs, validation, and failure handling explicit so an autonomous
coding agent has fewer opportunities to guess incorrectly.

## 47.1 Requirement language

The following terms are binding:

- **MUST** — mandatory requirement.
- **MUST NOT** — prohibited behavior.
- **SHOULD** — preferred unless a documented reason exists.
- **MAY** — optional implementation choice that does not change product behavior.
- **USER ACTION** — requires an explicit user interaction.
- **SYSTEM ACTION** — deterministic application behavior.
- **AI ACTION** — model-assisted behavior that must remain advisory unless explicitly approved.

## 47.2 Authority hierarchy

When implementing any behavior, use this order:

1. Master Production Specification.
2. Binding production decisions in Section 45.
3. `DESIGN.md` for UI/interaction presentation.
4. Stitch visual references for visual matching.
5. Documented implementation decisions in `docs/DECISIONS.md`.

The agent MUST NOT use a visual reference to override a functional requirement.

---

# 48. Detailed Product Domain Model

## 48.1 Brain Dump

A Brain Dump is the original user-provided raw input.

Required properties:

- stable ID;
- raw text;
- created timestamp;
- updated timestamp;
- parse status;
- provider;
- model;
- parse attempt metadata;
- candidate snapshot reference where applicable.

The original text MUST remain unchanged.

Editing a later candidate MUST NOT overwrite the original brain dump.

## 48.2 Candidate

A Candidate is a proposed task before FIX.

Candidate lifecycle:

```text
created
→ parsed
→ clarification_required (optional)
→ clarification_answered (optional)
→ reviewable
→ fixed
OR
→ discarded_by_user
```

Candidate data is not equivalent to an approved task.

A candidate MUST have a stable temporary ID so clarification and edits cannot be attached to the wrong item.

## 48.3 Approved Task

An Approved Task exists only after a successful FIX action.

Approved task properties include:

- stable ID;
- source candidate ID;
- source brain dump ID;
- title;
- expected result;
- priority;
- category;
- tags;
- planned duration;
- scheduled start/end;
- deadline/constraint where supplied;
- current status;
- audit history.

## 48.4 Event Record

Important state changes MUST create immutable event records.

Examples:

```text
TASK_CREATED
TASK_FIXED
TASK_STARTED
TASK_PAUSED
TASK_RESUMED
TASK_COMPLETED
TASK_POSTPONED
TASK_MISSED
TASK_RESCHEDULED
TASK_CANCELLED
CHECKLIST_COMPLETED
CHECKLIST_REOPENED
RECOMMENDATION_CREATED
RECOMMENDATION_ACCEPTED
RECOMMENDATION_DISMISSED
BACKUP_EXPORTED
BACKUP_IMPORTED
INTEGRITY_WARNING
```

The event log is historical evidence and MUST NOT be rewritten merely to make analytics look better.

---

# 49. Detailed Brain Dump Parsing Contract

## 49.1 Inputs

The parser may receive:

- raw brain dump text;
- current date;
- explicitly supplied available time;
- explicitly supplied fixed commitments;
- configured user work window;
- relevant user-approved preferences;
- allowed recent behavioral context when the user has enabled/usefully configured personalization.

Do not send unrelated private history merely because it exists locally.

## 49.2 Parser output

The parser MUST return structured candidates.

Recommended shape:

```json
{
  "candidate_id": "cand_001",
  "title": "Finish TRAKAE parser",
  "description": null,
  "priority": "P2",
  "priority_reason": "Important project progress mentioned by the user.",
  "expected_result": "Finish the parser and verify its output.",
  "category": "work",
  "estimated_duration_minutes": 90,
  "deadline": null,
  "fixed_start": null,
  "fixed_end": null,
  "checklist": [
    {
      "title": "Open the current parser",
      "estimated_minutes": 10
    },
    {
      "title": "Finish the missing logic",
      "estimated_minutes": 50
    },
    {
      "title": "Run and verify output",
      "estimated_minutes": 30
    }
  ],
  "tags": ["TRAKAE"],
  "confidence": 0.84,
  "clarification_required": false,
  "clarification_reason": null
}
```

The exact internal schema may vary, but all information needed by the review screen and scheduler MUST be present.

## 49.3 Do not invent facts

The parser MUST NOT invent:

- deadlines;
- appointments;
- people;
- locations;
- durations presented as certain facts;
- consequences;
- dependencies;
- health requirements;
- academic dates.

A duration can be an estimate, but it MUST be represented as an estimate.

## 49.4 Duplicate handling

Obvious duplicates SHOULD be merged.

When merging:

- preserve the most complete title;
- combine useful constraints;
- combine checklists where non-duplicative;
- retain source references;
- do not silently lose user intent.

If the system cannot safely determine that two items are duplicates, keep them separate.

---

# 50. Detailed Priority Intelligence Contract

## 50.1 Priority dimensions

Priority recommendations use:

- urgency;
- importance;
- consequence;
- deadline;
- future value.

The system MAY calculate an internal recommendation score, but the user-facing result MUST be expressed as P1/P2/P3/P4 with a plain-language reason.

## 50.2 Priority rules

### P1 — Critical

Use when today's completion is materially important because of a real deadline, commitment, or significant consequence.

### P2 — High Value

Use when the task meaningfully advances an important goal and should normally receive today's execution capacity.

### P3 — Useful

Use when the task is beneficial but can reasonably yield to P1/P2 work.

### P4 — Low Value

Use when the task is optional, minor, repetitive, weakly valuable for today, or easily postponed.

## 50.3 Priority safeguards

The system MUST NOT:

- label everything P1;
- label everything P2;
- infer urgency solely because the user typed an item;
- fabricate a deadline;
- treat AI confidence as urgency;
- convert personal preference into a hard deadline.

## 50.4 Priority edit behavior

Before FIX:

- priority is editable;
- priority reason is visible;
- the user's edit overrides the AI recommendation;
- later scheduling must use the user-approved priority.

After FIX:

- priority changes require an explicit user action;
- AI cannot silently mutate it.

---

# 51. Expected Outcome Contract

Every P1/P2 task SHOULD have an expected result.

A good expected result is:

- observable;
- specific;
- achievable within the allocated block;
- derived from user intent.

Examples:

```text
Complete Diode topic + solve 5 problems.
```

```text
Fix CSV mapping and verify parser output.
```

Bad examples:

```text
Be productive.
Study more.
Work on project.
Do everything.
```

When a useful outcome cannot be determined safely, ask a focused clarification question or leave the outcome as a user-editable field.

---

# 52. Clarification Engine Contract

## 52.1 Question generation

Questions MUST be:

- specific to one candidate;
- minimal;
- actionable;
- written in simple language.

Good:

> What exactly do you need to do with the supplier issue?

Bad:

> Please provide more context, deadline, category, expected result, priority, duration, dependencies, and desired schedule.

## 52.2 Clarification state

The UI MUST clearly identify:

- the unclear task;
- what FlowDesk already understood;
- the exact question;
- answer control;
- continue;
- optional skip/cancel.

## 52.3 Clarification retry limit

Default maximum:

**3 clarification rounds per candidate.**

After the limit:

- stop automatic clarification;
- expose manual editing;
- mark the candidate unresolved until user resolves it.

The agent MUST NOT loop indefinitely.

---

# 53. Detailed Scheduling Contract

## 53.1 Fixed commitments

Fixed commitments are user-supplied or explicitly approved constraints.

Examples:

- college;
- class;
- appointment;
- travel;
- meal;
- workout at a specific time.

Fixed commitments take precedence over flexible tasks.

## 53.2 Flexible tasks

Flexible tasks may move within the available capacity subject to deadlines and constraints.

## 53.3 Buffer

Target buffer:

**approximately 10–20% of available flexible capacity**.

The exact buffer can be configurable within reasonable limits.

The scheduler MUST not intentionally fill every minute of the work window.

## 53.4 Priority ordering

Within equivalent constraints:

```text
P1
↓
P2
↓
P3
↓
P4
```

However, explicit fixed-time constraints and hard deadlines can override simple priority ordering.

## 53.5 Schedule output

For each scheduled item provide:

- task ID;
- start time;
- end time;
- duration;
- order;
- block type;
- source constraint where useful.

Block types:

```text
FIXED_COMMITMENT
FOCUS_WORK
LIGHT_WORK
BREAK
BUFFER
```

## 53.6 Feasibility statuses

Use at least:

```text
feasible
tight
overloaded
conflicted
deadline_risk
```

### Feasible

Work fits with adequate buffer.

### Tight

Work fits but available slack is small.

### Overloaded

Total planned flexible work exceeds available capacity.

### Conflicted

Explicit schedule blocks overlap.

### Deadline risk

A task may miss an explicit deadline under the current proposal.

## 53.7 Overflow behavior

When overloaded:

- preserve every candidate;
- identify what does not fit;
- identify why;
- recommend which lower-priority items to move;
- do not silently delete or reschedule.

---

# 54. Scheduling Example Contract

Input:

```text
Available:
4:00 PM – 10:00 PM

Fixed:
College ends 4:00 PM
Gym 6:30 PM – 7:15 PM

Tasks:
P1 EDC — 90 min
P2 TRAKAE parser — 90 min
P3 Python revision — 60 min
P4 GitHub issue — 30 min
```

The scheduler should:

1. reserve fixed commitments;
2. reserve configured breaks;
3. protect reasonable buffer;
4. place P1/P2 where feasible;
5. identify P3/P4 as lower-priority overflow candidates if capacity becomes insufficient;
6. show the resulting feasibility state.

The AI MAY explain the schedule, but deterministic code MUST calculate the actual placement and conflicts.

---

# 55. Detailed FIX Transaction Contract

FIX is a transactional boundary.

## Before FIX

No approved task records should be created merely because AI parsing succeeded.

## During FIX

The backend MUST:

1. validate candidate structure;
2. validate required fields;
3. reject unresolved candidates unless partial FIX is explicitly supported;
4. validate schedule;
5. create approved task records;
6. create checklist rows;
7. create schedule records;
8. create a FIX approval event;
9. mark the brain dump approval state;
10. preserve candidate snapshot.

## On failure

The transaction MUST roll back.

The system MUST NOT leave half-created tasks.

## After FIX

The approved tasks become executable.

---

# 56. Task State and Timer State Separation

Task state and timer state MUST be represented separately.

Example:

```text
TASK
planned / running / paused / completed / postponed / missed / rescheduled / cancelled

TIMER
idle / running / paused / completed / abandoned
```

A task being paused does not necessarily mean the entire task lifecycle has ended.

The UI may visually combine these concepts, but the underlying model MUST keep them distinct.

---

# 57. Timer Concurrency Contract

There may be at most:

**one active focus timer globally.**

When Task A is active and the user starts Task B:

Return a controlled error:

```text
TIMER_ALREADY_RUNNING
```

Response SHOULD include:

- active task;
- active session;
- action to remain;
- action to switch.

The server MUST enforce this rule.

The frontend MUST NOT rely on visual disabling alone.

---

# 58. Timer Recovery Contract

Persist timing state on every important state change.

The timer MUST survive:

- page refresh;
- tab backgrounding;
- ordinary browser rendering pauses;
- application restarts where persisted session data permits recovery.

Actual active duration:

```text
active_duration =
total elapsed time
− explicitly paused intervals
```

The frontend countdown is a display, not the authoritative calculation.

---

# 59. Clock Integrity Contract

Persist timestamps in UTC.

Render timestamps in the user's configured local timezone.

Use a monotonic clock reference where appropriate for detecting suspicious client-side jumps.

If a suspicious jump is detected:

- record an integrity warning;
- do not silently rewrite historical durations.

---

# 60. Notification Contract

Notifications SHOULD be generated from deterministic schedule/task events.

Required practical reminders may include:

- upcoming task;
- task start;
- ending soon;
- overdue;
- next task;
- postponed reminder.

Rules:

- no duplicate notification for one event;
- user can disable notifications;
- lead time is configurable;
- notification failure MUST NOT block task execution;
- notification history can be recorded locally.

Platform boundaries from Section 45 remain authoritative.

---

# 61. Detailed Analytics Contract

Analytics MUST use persisted historical records.

## 61.1 Completion rate

```text
completed eligible planned tasks
/
eligible planned tasks
```

Explicitly excluded items must be documented.

## 61.2 Estimation error

For each completed task:

```text
absolute_error_minutes
= abs(actual_minutes - planned_minutes)

relative_error
= absolute_error_minutes / max(planned_minutes, 1)
```

Aggregate over a selected rolling window.

## 61.3 Productive hours

A productive-hour metric MUST use an evidence threshold.

Do not call an hour productive from a single short session.

## 61.4 Misses

Use deterministic grouping first:

1. exact task identity;
2. normalized title;
3. category;
4. tags.

AI semantic grouping MAY be used as an advisory layer, but the evidence must remain visible.

## 61.5 Postponements

Track:

- total postponements;
- consecutive postponements;
- postponement by category;
- postponement by task;
- postponement by time window where supported.

---

# 62. Pattern Evidence Contract

Every pattern record should contain:

```text
pattern_type
observation_window_start
observation_window_end
sample_count
metric_value
confidence
evidence
calculation_method
generated_at
```

Suggested confidence states:

```text
insufficient_data
emerging
supported
strong
```

The UI MUST expose evidence or a concise evidence explanation.

---

# 63. Recommendation Contract

Each recommendation must include:

```json
{
  "recommendation_id": "rec_001",
  "type": "duration_adjustment",
  "affected_task_type": "coding",
  "message": "Consider allocating about 90 minutes.",
  "evidence": {
    "sample_count": 8,
    "planned_average_minutes": 60,
    "actual_average_minutes": 91
  },
  "confidence": "supported",
  "status": "pending"
}
```

Recommendation actions:

```text
Approve
Ignore
Dismiss
```

An accepted recommendation may influence future proposals but MUST NOT rewrite historical records.

---

# 64. Personalization Learning Loop

The intended learning loop is:

```text
Plan
↓
Execute
↓
Record
↓
Measure
↓
Detect pattern
↓
Create recommendation
↓
User accepts/ignores
↓
Future planning uses approved preference/evidence
```

The system MUST NOT jump from one missed task directly to a strong user-level conclusion.

---

# 65. Settings Contract

Settings should be separated into:

## General

- timezone;
- work start;
- work end;
- break defaults;
- notification defaults.

## AI

- selected provider;
- provider base URL;
- selected/allowed models;
- connection status;
- AI enabled/disabled.

## Data

- storage information;
- backup;
- import/export;
- data management.

## User control

- accepted recommendations/preferences where appropriate.

---

# 66. Ollama Configuration Contract

Required UI:

```text
Provider: Ollama

Base URL:
[ http://127.0.0.1:11434 ]

Model:
[ configured model ]

Status:
● Connected

[ Test Connection ]
```

Test connection MUST actually check the configured endpoint.

Possible results:

```text
connected
unavailable
invalid_url
model_not_found
timeout
```

The exact error message should be user-readable.

---

# 67. OpenRouter Configuration Contract

Required UI:

```text
Provider: OpenRouter

Base URL:
[ configured URL ]

Model:
[ configured free model ]

API Key:
[ masked ]

Usage Policy:
Free models only

Status:
● Connected

[ Test Connection ]
```

Security rules:

- provider requests go through local backend;
- API key never enters frontend bundle;
- API key never appears in normal API responses;
- API key never appears in logs;
- API key is stored outside the database per Section 45.J;
- no automatic paid fallback.

---

# 68. Offline Quick Split Contract

Quick Split is a deterministic fallback, not semantic AI.

Minimum behavior:

1. split by new lines;
2. optionally split by common separators;
3. trim whitespace;
4. ignore empty fragments;
5. create simple candidate titles;
6. assign safe default duration;
7. send the candidates to the same review/FIX workflow.

Show:

> Offline split — no semantic AI parsing was used.

Quick Split MUST NOT claim to have understood intent, priority, deadlines, or outcomes unless the user supplies/edits them.

---

# 69. API Resource Contract

Use consistent versioning.

Preferred root:

```text
/api/v1
```

Suggested resources:

```text
POST   /api/v1/brain-dumps
GET    /api/v1/brain-dumps/:id

POST   /api/v1/brain-dumps/:id/parse
POST   /api/v1/candidates/:id/clarify

GET    /api/v1/candidates
PUT    /api/v1/candidates/:id

POST   /api/v1/fix

GET    /api/v1/tasks
GET    /api/v1/tasks/:id
PUT    /api/v1/tasks/:id
POST   /api/v1/tasks/:id/postpone
POST   /api/v1/tasks/:id/reschedule

GET    /api/v1/checklists
PUT    /api/v1/checklists/:id

POST   /api/v1/timers/start
POST   /api/v1/timers/pause
POST   /api/v1/timers/resume
POST   /api/v1/timers/complete
GET    /api/v1/timers/active
GET    /api/v1/timers/history

GET    /api/v1/reviews/:date
GET    /api/v1/analytics
GET    /api/v1/patterns
GET    /api/v1/recommendations
POST   /api/v1/recommendations/:id/accept
POST   /api/v1/recommendations/:id/dismiss

GET    /api/v1/settings
PUT    /api/v1/settings

POST   /api/v1/ai/test
POST   /api/v1/backup/export
POST   /api/v1/backup/import
```

The exact route names may differ if the agent documents a justified alternative, but resource boundaries MUST remain clear.

---

# 70. API Error Contract

Use one consistent error shape:

```json
{
  "error": {
    "code": "TIMER_ALREADY_RUNNING",
    "message": "Another focus timer is already running.",
    "details": {
      "task_id": "task_123"
    }
  }
}
```

Recommended error categories:

```text
VALIDATION_ERROR
NOT_FOUND
CONFLICT
STATE_TRANSITION_INVALID
TIMER_ALREADY_RUNNING
AI_PROVIDER_UNAVAILABLE
AI_MODEL_UNAVAILABLE
AI_OUTPUT_INVALID
BACKUP_INVALID
BACKUP_CHECKSUM_MISMATCH
BACKUP_VERSION_UNSUPPORTED
IMPORT_FAILED
INTERNAL_ERROR
```

Never expose stack traces in normal user responses.

---

# 71. Database Integrity Contract

The database layer MUST provide:

- migration version;
- transactions;
- foreign keys;
- appropriate indexes;
- stable IDs;
- created/updated timestamps;
- event history;
- integrity checks.

Recommended integrity rules:

- task must reference an existing source where required;
- checklist item must reference a task;
- timer session must reference a task;
- event record must reference its task where applicable;
- recommendation references must resolve where required.

---

# 72. Backup Format Contract

Backup:

```text
flowdesk-backup-YYYY-MM-DD-HH-mm.zip
├── manifest.json
├── database.sqlite
└── metadata.json
```

Manifest:

```json
{
  "backup_format_version": 1,
  "schema_version": 1,
  "app_version": "x.y.z",
  "created_at": "UTC timestamp",
  "record_counts": {},
  "files": {
    "database.sqlite": {
      "sha256": "hex"
    }
  }
}
```

Import validation sequence:

```text
archive inspection
→ filename/path validation
→ manifest validation
→ checksum validation
→ version validation
→ temporary database load
→ integrity checks
→ explicit restore
```

No import step may partially replace the active database before validation succeeds.

---

# 73. ZIP Security Contract

The importer MUST reject:

- path traversal;
- unexpected file types;
- malformed archive structure;
- missing required files;
- invalid manifest;
- checksum mismatch.

Never extract an archive directly over the live data directory without validation.

Never execute imported files.

---

# 74. Multi-Tab Contract

Use the backend as the authoritative writer.

Recommended browser synchronization:

- `BroadcastChannel`;
- `storage` event fallback.

Goals:

- reflect task state changes;
- reflect timer state;
- reflect settings changes;
- avoid uncontrolled polling/refetch storms.

SQLite should use WAL mode where supported by the selected driver.

---

# 75. Runtime Topology Contract

## Desktop v1

```text
Browser
  ↓
Local React/PWA frontend
  ↓
127.0.0.1 local Express server
  ↓
Local SQLite
```

## Mobile v1

Responsive PWA UI is supported as a UI surface.

Live mobile backend execution is NOT claimed for iOS/Android in v1.

Laptop ↔ mobile transfer uses ZIP backup/export/import.

No cloud sync is introduced.

---

# 76. UI Screen Contract

All screens defined in `DESIGN.md` MUST be implemented.

Primary screens:

```text
Today
Brain Dump
AI Processing
Clarification
Plan Review / FIX
Practical Schedule
Task Execution
Tasks
Daily Review
Analytics
Settings
Backup / Restore
System States
```

Screen combinations are permitted only when required functionality remains accessible.

---

# 77. Today Screen Contract

The Today screen must prioritize:

1. Main outcome.
2. Current task.
3. Timer.
4. Checklist.
5. Next task.
6. Day progress.

Secondary information:

- planned vs actual;
- one or two useful pattern insights;
- important warnings.

Do not make analytics dominate the Today screen.

---

# 78. Brain Dump Screen Contract

Primary interaction:

```text
large input
→ Parse with AI
→ Quick Split
```

Optional context:

- available time;
- fixed commitments.

Do not require manual organization before parsing.

---

# 79. Plan Review Screen Contract

Required visible data:

- candidate title;
- P1–P4;
- priority reason;
- expected result;
- duration;
- schedule;
- checklist;
- warnings;
- recommendations;
- total planned;
- available time;
- overflow;
- unresolved items.

Primary action:

**FIX PLAN**

---

# 80. Execution Screen Contract

The execution screen MUST answer:

- What task is active?
- Why does it matter?
- How much time remains?
- What checklist item is next?
- What can I do right now?

Required:

- task title;
- priority;
- expected result;
- timer;
- checklist;
- pause/resume;
- complete;
- postpone;
- next task.

---

# 81. Daily Review Contract

Daily review should present:

- completed;
- missed;
- postponed;
- rescheduled;
- planned minutes;
- actual active minutes;
- checklist completion;
- main outcomes;
- evidence-backed learning;
- optional reasons for unfinished work.

The review MUST NOT infer blame or motivation as fact.

---

# 82. Settings UX Contract

Settings must never expose internal implementation jargon unnecessarily.

Prefer:

> Ollama unavailable. Check the Base URL or model.

over:

> ECONNREFUSED 127.0.0.1:11434.

The raw technical diagnostic may still be retained in local developer logs when appropriate.

---

# 83. Accessibility Contract

For all critical interactions:

- keyboard reachable;
- visible focus;
- readable labels;
- accessible dialogs;
- semantic headings;
- touch-friendly controls;
- status represented with text and not color alone;
- reduced-motion consideration.

The timer MUST remain readable without relying only on contrast-heavy animation.

---

# 84. Performance and Responsiveness Contract

Target behavior for ordinary personal-data volumes:

- common page navigation should feel immediate;
- task/checklist actions should confirm promptly after persistence;
- timer display should remain smooth;
- analytics should not repeatedly recalculate expensive historical aggregates unnecessarily;
- AI calls should be bounded and user-triggered.

Do not optimize prematurely through speculative complexity.

---

# 85. Observability Contract

Log enough information to diagnose failures without storing unnecessary personal content.

A diagnostic event SHOULD include:

```text
timestamp
subsystem
operation
error code
correlation/request ID
```

Avoid logging by default:

- raw brain dump;
- API keys;
- provider secrets;
- unnecessary task text.

---

# 86. Testing Matrix

Every critical requirement SHOULD map to at least one test.

| Area | Minimum test |
|---|---|
| Brain Dump | parsing candidate creation |
| Clarification | one-task question flow |
| Priority | P1–P4 validation |
| FIX | candidate-to-task transaction |
| Scheduling | feasible and overloaded plans |
| State machine | valid/invalid transitions |
| Checklist | persistence/reopen |
| Timer | start/pause/resume/complete |
| Timer recovery | reload |
| Timer concurrency | second timer rejected |
| Notifications | duplicate prevention |
| Analytics | persisted data aggregation |
| Patterns | evidence/confidence |
| Recommendations | accept/dismiss |
| AI | schema validation + failure |
| Offline | Quick Split |
| Settings | save/reload |
| Backup | export/import |
| Backup security | checksum/path traversal |
| PWA | shell/offline behavior |
| Responsive | desktop/mobile viewport |
| Multi-tab | state propagation |

---

# 87. Test Data Requirements

Create deterministic test fixtures covering:

## Scenario A — Easy day

Small number of tasks, enough capacity.

## Scenario B — Overloaded day

P1/P2/P3/P4 mix exceeds capacity.

## Scenario C — Ambiguous task

One task needs clarification; others should proceed.

## Scenario D — Timer recovery

Active session survives page reload.

## Scenario E — Repeated postponement

Same task postponed several times.

## Scenario F — Estimation mismatch

Planned 60m, actual 90m across multiple historical records.

## Scenario G — AI unavailable

Fallback remains usable.

## Scenario H — Corrupt backup

Import rejected safely.

---

# 88. E2E Acceptance Scenarios

## E2E-A — Full happy path

```text
Open FlowDesk
→ brain dump
→ parse
→ review
→ FIX
→ Today
→ Start task
→ checklist
→ pause
→ resume
→ complete
→ review
→ analytics
```

## E2E-B — Clarification

```text
Brain dump
→ ambiguous candidate
→ one clarification
→ answer
→ candidate updated
→ FIX
```

## E2E-C — Overload

```text
Brain dump
→ workload too large
→ warning
→ move recommendation
→ user edits
→ FIX
```

## E2E-D — AI unavailable

```text
AI unavailable
→ Quick Split
→ edit
→ FIX
→ execute
```

## E2E-E — Backup transfer

```text
Create task history
→ export
→ validate
→ import into clean test database
→ compare records
```

## E2E-F — Timer recovery

```text
Start
→ reload
→ verify recovered session
→ complete
```

---

# 89. Definition of Done — Detailed

In addition to the existing checklist, require:

```text
[ ] All MUST/MUST NOT requirements traced to implementation
[ ] All major product flows have automated coverage
[ ] Invalid AI output cannot create approved tasks
[ ] Unresolved clarification cannot silently become fixed
[ ] FIX is transactional
[ ] One active timer is enforced by backend
[ ] Timer survives reload
[ ] Planned/actual timing is persisted correctly
[ ] Schedule conflicts are deterministic
[ ] User priority edits override AI priority
[ ] AI recommendations cannot silently alter approved work
[ ] Analytics are derived from persisted records
[ ] Pattern claims include evidence
[ ] Backup import cannot partially replace live data
[ ] ZIP path traversal is rejected
[ ] OpenRouter key is never returned or logged
[ ] Paid model is never auto-selected
[ ] Offline Quick Split works
[ ] PWA shell loads offline where supported
[ ] Multi-tab state synchronization works
[ ] Mobile core flow is usable
[ ] Accessibility basics verified
[ ] Production build succeeds from a clean install
[ ] Test suite succeeds from the committed lockfile
[ ] README commands work on the target environment
[ ] Known limitations are documented honestly
```

---

# 90. Agent Deliverables

The coding agent must produce both working software and documentation.

Required repository outputs:

```text
README.md
docs/PRODUCT.md
docs/ARCHITECTURE.md
docs/DATA_MODEL.md
docs/AI_CONTRACT.md
docs/SCHEDULING.md
docs/PERSONALIZATION.md
docs/BACKUP_FORMAT.md
docs/DECISIONS.md
docs/TESTING.md
```

The documents MUST describe actual implementation status.

---

# 91. Traceability Requirement

For each major feature, the agent SHOULD be able to identify:

```text
Requirement
→ implementation module
→ API endpoint
→ data model
→ UI
→ automated test
→ acceptance criterion
```

Example:

```text
FIX gate
→ fix service
→ POST /api/v1/fix
→ candidate/task tables + event
→ Plan Review screen
→ E2E FIX test
→ AC-04
```

This makes regressions easier to detect.

---

# 92. Change Management Contract

When the agent discovers a necessary change:

1. identify the affected requirement;
2. determine whether the change is product-level or implementation-level;
3. if implementation-level, document in `docs/DECISIONS.md`;
4. if product-level, stop and request user approval before changing the requirement;
5. update relevant tests/documentation.

Do not silently turn an implementation limitation into a product requirement.

---

# 93. Final Release Gate

Before calling the product READY, verify:

```text
BUILD
✓ shared
✓ server
✓ web

TEST
✓ unit
✓ integration
✓ E2E

RUNTIME
✓ backend
✓ frontend
✓ database

PRODUCT
✓ Brain Dump
✓ Clarification
✓ Priority
✓ Outcome
✓ Schedule
✓ FIX
✓ Timer
✓ Checklist
✓ Review
✓ Personalization

OPERATIONS
✓ AI settings
✓ Offline fallback
✓ Notifications
✓ Backup
✓ Restore
✓ PWA
✓ responsive UI

SECURITY
✓ local binding
✓ secrets
✓ AI provider boundary
✓ ZIP validation

QUALITY
✓ accessibility
✓ errors
✓ loading
✓ empty states
✓ documentation
```

A release is **NOT READY** if a critical feature merely exists in source code but has not been executed and verified.

---

# 94. Final Product Definition

FlowDesk succeeds when the following statement is true:

> A user can open the application, write messy work in ordinary language, let the system organize it without requiring manual structure, answer only the necessary clarification questions, see P1–P4 priorities and expected outcomes, receive a realistic schedule that protects capacity, review and explicitly FIX the plan, execute one timed task at a time with a checklist, receive practical reminders, review what actually happened, and eventually receive evidence-backed recommendations that improve future planning — while the user's data remains local-first and under the user's control.

The system should make real progress easier, not make planning itself another full-time task.

---

# 95. Master Specification Status

This detailed version is an expanded implementation contract.

It does NOT authorize implementation by itself; the product owner still controls the decision to begin implementation.

Use this document together with:

```text
FlowDesk-DESIGN.md
```

and the approved Stitch visual package.

The Master Production Specification remains the functional source of truth.
`DESIGN.md` remains the visual/interaction source of truth.
The Stitch package remains the visual reference.
