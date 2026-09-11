# FlowDesk — Verification and Quality Assurance Plan

This document outlines the test strategy and acceptance criteria used to verify FlowDesk.

---

## 1. Automated Test Suites

- **Database & Migrations (`apps/server/tests/db.test.ts`):**
  - Database initialization, WAL mode verification, foreign key cascades, migration idempotency.
- **Parsing & Quick Split (`apps/server/tests/parser.test.ts`):**
  - Offline quick split deterministic parsing, title sanitization, duration defaults.
- **Scheduling & Customization (`apps/server/tests/scheduler.test.ts`):**
  - Respect for fixed commitments, buffer reservations, feasibility classifications (`feasible`, `tight`, `overloaded`, `conflicted`).
  - Dynamic recalculation when user customizes times or durations.
- **FIX Transaction Gate (`apps/server/tests/fix.test.ts`):**
  - Atomic promotion of candidate tasks to executable tasks.
  - Transaction rollback on failure (no partial state).
- **Timer Concurrency & Integrity (`apps/server/tests/timer.test.ts`):**
  - Strict enforcement of single active timer (`TIMER_ALREADY_RUNNING`).
  - Accurate elapsed time calculation across pause/resume cycles.
- **Analytics & Patterns (`apps/server/tests/analytics.test.ts`):**
  - Deterministic completion rates, estimation errors, confidence rating thresholds.
- **Backup & Restore (`apps/server/tests/backup.test.ts`):**
  - ZIP package structure, SHA-256 manifest verification, path traversal prevention, atomic restore.

---

## 2. Manual End-to-End Acceptance Test

Verify the complete user journey:
1. Enter: `"college till 4 then edc study, finish trakt parser, revise python and check github issue"`
2. Verify candidate extraction, priority assignment, and outcome proposal.
3. Check schedule timeline with 4:00 PM college fixed commitment.
4. Modify schedule by adjusting EDC study duration. Verify recalculation of feasibility warning.
5. Click **FIX PLAN** and verify transactional promotion to executable tasks.
6. Start timer for EDC Study; attempt to start timer for Trakt parser and verify `TIMER_ALREADY_RUNNING` switch prompt.
7. Complete checklist items, pause/resume, complete task.
8. Perform Daily Review and verify updated analytics and pattern insights.
