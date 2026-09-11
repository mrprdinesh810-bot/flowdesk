# FlowDesk — System Architecture

FlowDesk is designed with strict boundaries separating deterministic application logic from optional AI assistance.

---

## 1. System Topology

```text
┌────────────────────────────────────────────────────────┐
│                      Client Layer                      │
│   React 18 + Vite + Tailwind CSS (Responsive Desktop)  │
│   Installable PWA (Mobile width / Desktop standalone)   │
│   Zustand Store + BroadcastChannel multi-tab sync      │
└───────────────────────────▲────────────────────────────┘
                            │ HTTP / JSON (127.0.0.1:4000)
┌───────────────────────────▼────────────────────────────┐
│                    Express Backend                     │
│  - REST Controllers (/api/v1/...)                      │
│  - Single Active Timer Concurrency Guard               │
│  - Deterministic Scheduling & Feasibility Engine       │
│  - FIX Transaction Coordinator                          │
│  - Deterministic Analytics & Pattern Detector          │
│  - Portable Backup / Restore ZIP Engine (SHA-256)      │
└───────────────▲────────────────────────▲───────────────┘
                │                        │
┌───────────────▼────────┐      ┌────────▼───────────────┐
│     SQLite Database    │      │    AI Provider Layer   │
│  - WAL journal mode    │      │  - Ollama (Local)      │
│  - Single DB Adapter   │      │  - OpenRouter (Remote) │
│  - Immutable Audit Log │      │  - Offline Quick Split │
└────────────────────────┘      └────────────────────────┘
```

---

## 2. Core Execution Chain

1. **Rough Brain Dump:** Raw text is saved immutably into `brain_dumps`.
2. **Parsing:** Evaluates text via Ollama/OpenRouter or Offline Quick Split into structured `candidates` with duration, priority (P1-P4), outcome, and constraints.
3. **Clarification:** Only triggered if critical ambiguity exists (capped at 3 rounds).
4. **Feasibility & Scheduling:** Calculates schedule timeline, reserved buffers (10-20%), and feasibility status.
5. **Schedule Customization:** User edits order, times, durations, or exclusions. The backend recalculates metrics and warns if overloaded.
6. **FIX Plan:** Transactional gate promoting approved candidates into authoritative `tasks` and `checklist_items`.
7. **Execution & Timers:** Backend-authoritative focus timer tracks UTC timestamps and active durations; rejects concurrent sessions.
8. **Daily Review & Learning:** End-of-day reflection feeds deterministic metrics and generates evidence-backed recommendation cards.
