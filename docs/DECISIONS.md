# FlowDesk — Architectural & Binding Production Decisions

This document records the binding production decisions established in Section 45 and additional product decisions for the FlowDesk application.

---

### DECISION-RUNTIME-TOPOLOGY (§45.A)
- **Decision:** Desktop runs the authoritative Node.js + Express backend bound strictly to `127.0.0.1` and SQLite. The browser UI runs as a client. Mobile is served as an installable PWA using the same responsive React frontend with app-shell caching.
- **Cross-device Transfer:** Data transfer between desktop and mobile is strictly via the portable ZIP backup/restore mechanism (§22). There is NO live cloud synchronization in v1.
- **Rationale:** Keeps data local-first, avoids cloud sync infrastructure, respects privacy, and ensures identical behavior across environments.

---

### DECISION-PWA (§45.B)
- **Decision:** Ship the web UI as an installable PWA with a valid `manifest.json` (`display: standalone`, app icons, theme colors) and a service worker implementing:
  - App-shell caching for built frontend static assets (loads offline).
  - Network-first strategy for `/api/*` requests (never cache stale API responses; show clear offline fallback state if backend unreachable).
  - Stale cache eviction on activation.
- **Rationale:** Enables clean standalone installation on mobile and desktop without requiring native wrapper compilation.

---

### DECISION-SQLITE (§45.C)
- **Decision:** The application runs on Node.js (v25+). We use Node's native built-in `node:sqlite` (`DatabaseSync`), isolated strictly behind a single `db` adapter exposing `prepare(sql).get/all/run(...)`, `exec(sql)`, and `transaction(fn)`.
- **Rationale:** Eliminates native C++ compilation failures and external binary dependencies on fresh systems while delivering synchronous prepared statement execution and transactional safety. The abstraction allows swapping to `better-sqlite3` without touching any domain or business logic.

---

### DECISION-SINGLE-USER (§45.D)
- **Decision:** v1 is strictly single-user with zero authentication. The `user_id` columns in SQLite default to `user-001` as scaffolding for future device migration.
- **Rationale:** Local-first personal productivity app; mandatory accounts and login screens create friction without adding security on a local single-user machine.

---

### DECISION-SINGLE-TIMER (§45.E, §57)
- **Decision:** At most **one active focus timer** may be running globally at any time. If the user attempts to start a timer while another is running, the backend strictly rejects the operation with error code `TIMER_ALREADY_RUNNING`, returning the active task metadata and a controlled prompt to switch or stay.
- **Rationale:** Prevents fragmented attention and ambiguous time accounting. Backend enforcement guarantees single-focus discipline even across multiple browser tabs.

---

### DECISION-MULTI-TAB (§45.F, §74)
- **Decision:** The backend is the single authoritative writer. Multiple browser tabs synchronize state using a `BroadcastChannel` (`flowdesk_state_sync`) for instant cross-tab updates without polling storms.
- **SQLite Concurrency:** SQLite is configured with `PRAGMA journal_mode = WAL;` and `PRAGMA busy_timeout = 5000;`.
- **Rationale:** Users frequently open multiple tabs; `BroadcastChannel` immediately synchronizes active timer countdowns and task status changes.

---

### DECISION-TIME-UTC (§45.G, §59)
- **Decision:** All timestamps are stored in UTC ISO-8601 strings in the database. Timestamps are formatted in the user's configured local timezone for display. Elapsed time is computed from persisted UTC timestamps on the server. Monotonic references (`performance.now()` / process `hrtime`) detect suspicious wall-clock jumps, generating an `INTEGRITY_WARNING` event rather than rewriting history.
- **Rationale:** Avoids daylight saving anomalies and timezone skew while rendering local times accurately.

---

### DECISION-TOOLCHAIN (§45.H)
- **Decision:**
  - Runtime: Node.js (>= 20, active: v25.8.1)
  - Backend: Express 4 + TypeScript + `node:sqlite` + Zod
  - Frontend: React 18 + TypeScript + Vite 5 + Tailwind CSS 3 + Zustand
  - Tests: Vitest + Supertest
  - Monorepo: Lightweight npm workspaces (`apps/server`, `apps/web`)
- **Rationale:** Standard, reproducible modern stack with zero bloated build frameworks.

---

### DECISION-NOTIFICATION-BOUNDARY (§45.I, §60)
- **Decision:** Web and PWA notifications are supported when the app or PWA is open or running in the background of the browser. OS-level push notifications with the app/browser completely closed are explicitly out of scope for v1.
- **Rationale:** Respects technical realities of standalone web apps without requiring cloud push infrastructure or APNs/FCM credentials.

---

### DECISION-SECURITY-KEYS (§45.J, §66, §67)
- **Decision:**
  - Express server binds to `127.0.0.1` (never `0.0.0.0`).
  - CORS is restricted to local frontend origins.
  - OpenRouter API keys are stored server-side only in a gitignored `.env` file, loaded into process memory. They are NEVER sent to the frontend, never logged, and never stored in SQLite.
  - All AI provider requests (Ollama and OpenRouter) are proxied server-side.
- **Rationale:** Prevents credential leaks and unauthorized external access to the local productivity server.

---

### DECISION-BACKUP-SHA256 (§45.K, §72, §73)
- **Decision:** Backups are standard portable ZIP packages containing `manifest.json`, `database.sqlite`, and `metadata.json`. The manifest records format version `1`, schema version `1`, and a hex SHA-256 checksum of `database.sqlite`. On restore, the archive undergoes strict security inspection: path traversal rejection, manifest verification, checksum validation, temporary database integrity check, and atomic swap.
- **Rationale:** Ensures complete data portability between desktop and mobile while preventing corrupted or malicious ZIP archives from overwriting user data.

---

### DECISION-SINGLE-LOCALE (§45.L)
- **Decision:** v1 is strictly English (en-US). UI strings are consolidated in components and domain constants for straightforward future localization.
- **Rationale:** Avoids unnecessary i18n overhead while keeping the codebase clean.

---

### DECISION-SCHEDULE-CUSTOMIZATION
- **Decision:** Before FIX PLAN, the proposed schedule is fully customizable by the user. The user can adjust start/end times, durations, priority, ordering, placement, breaks, buffers, and toggle task inclusion/postponement. Any modification triggers a deterministic recalculation of workload, available time, remaining capacity, buffer/slack, and feasibility warnings. FlowDesk warns the user if the plan is overloaded, but NEVER forces a plan or silently alters tasks. The user clicking FIX PLAN transactionally persists the exact customized version.
- **Rationale:** Core product principle P1: FlowDesk is AI-assisted, not AI-controlled; the user remains the final authority on their schedule.
