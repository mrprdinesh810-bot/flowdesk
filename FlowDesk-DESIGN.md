# FlowDesk — Production UI/UX Design Specification

**Document:** `DESIGN.md`  
**Status:** Design source of truth  
**Scope:** UI/UX, visual system, interaction design, responsive behavior, accessibility, and screen behavior  
**Implementation:** No application implementation is defined here  

---

## 1. Design Purpose

FlowDesk is a personalized AI daily productivity and discipline system. Its primary experience is:

```text
ROUGH BRAIN DUMP
      ↓
AI UNDERSTANDING
      ↓
CLARIFICATION (only when needed)
      ↓
PRIORITY + OUTCOME
      ↓
REALISTIC SCHEDULE
      ↓
USER REVIEW
      ↓
FIX
      ↓
TIMED EXECUTION
      ↓
REVIEW
      ↓
PERSONALIZATION
```

The interface must make this flow feel natural and fast.

The product is **not a generic task-management dashboard**. The design must optimize for:

- deciding what matters today
- seeing a realistic plan
- starting the current task quickly
- staying focused during execution
- understanding what actually happened
- learning from real behavior

The user should not need to become a productivity expert to use FlowDesk.

---

# 2. Core UX Principles

## 2.1 Clarity Before Density

The user should understand the current state of the day within a few seconds.

Never prioritize displaying more information over displaying the right information.

## 2.2 Execution Before Administration

Today and the current task receive higher visual priority than historical analytics, settings, or task-management administration.

## 2.3 One Primary Action

Each important screen should have one obvious primary action.

Examples:

- Brain Dump → `Parse with AI`
- Proposal Review → `FIX PLAN`
- Ready Task → `START`
- Running Task → `PAUSE`
- Completed Task → `DONE`

## 2.4 AI Assists; User Controls

The UI must clearly distinguish between:

```text
AI PROPOSAL
```

and:

```text
APPROVED PLAN
```

The user must understand that nothing becomes an approved plan until `FIX` is used.

## 2.5 Focus the User, Do Not Motivate With Noise

Avoid motivational slogans, excessive streak mechanics, gamification, visual clutter, and unnecessary animations.

Use practical signals instead:

- what is next
- what is running
- what is late
- what remains
- what changed

---

# 3. Visual Direction

## 3.1 Overall Character

FlowDesk should look like a **focused personal command center** rather than a corporate project-management application.

Visual qualities:

- calm
- precise
- trustworthy
- modern
- compact but breathable
- highly readable
- strong task hierarchy
- restrained motion

Avoid:

- heavy glassmorphism
- excessive blur
- large decorative gradients
- neon-heavy dashboards
- excessive cards within cards
- oversized illustrations
- noisy backgrounds

## 3.2 Layout Philosophy

Use a clean neutral canvas with strong hierarchy.

Prefer:

- one primary content column for mobile
- two-column layouts only where they improve comprehension on desktop
- generous but controlled spacing
- aligned card edges
- consistent content widths
- strong whitespace around the current task

---

# 4. Color System

The palette should be **focused and functional**. Color communicates state, priority, and action; it is not decoration.

## 4.1 Base Colors

Use a neutral interface foundation:

```text
Background        #F7F8FA
Surface           #FFFFFF
Surface Muted     #F1F3F5
Border            #E2E5E9
Text Primary      #171A1F
Text Secondary    #5E6672
Text Muted        #88909C
```

For dark mode:

```text
Background        #0F1115
Surface           #171A20
Surface Muted     #1F232B
Border            #2A3039
Text Primary      #F4F6F8
Text Secondary    #B3BAC4
Text Muted        #7D8692
```

## 4.2 Brand / Primary Action

Use a focused indigo/blue family for actions and active application state.

```text
Primary           #4F46E5
Primary Hover     #4338CA
Primary Soft      #EEF2FF
Primary Text      #FFFFFF
```

Use the primary color for:

- primary buttons
- active navigation
- selected controls
- important links
- focused states
- the `FIX PLAN` action

Do not use primary color everywhere.

## 4.3 Priority Colors

Priority colors must remain visually distinct from the general brand color.

```text
P1 Critical       #DC2626
P1 Soft           #FEF2F2

P2 High Value     #EA580C
P2 Soft           #FFF7ED

P3 Useful         #CA8A04
P3 Soft           #FEFCE8

P4 Low Value      #16A34A
P4 Soft           #F0FDF4
```

Use priority color primarily for:

- priority badge
- small indicator
- timeline marker
- concise status emphasis

Do not make whole screens red/orange/yellow/green.

## 4.4 Execution State Colors

```text
Running           #4F46E5
Success           #16A34A
Warning           #D97706
Error             #DC2626
Info              #2563EB
```

## 4.5 Accessibility Rule

Never communicate important information by color alone.

Example:

```text
🔴 P1 Critical
```

not only a red line.

Always combine color with:

- label
- icon where useful
- text
- shape/placement when appropriate

---

# 5. Typography

## 5.1 Font Character

Use a highly readable modern sans-serif.

Recommended hierarchy:

```text
Display / Main outcome  28–36px
Page title              24–30px
Section heading         18–22px
Task title              16–18px
Body                    14–16px
Metadata                12–14px
Timer                   48–72px depending on viewport
```

Do not use excessively thin font weights.

## 5.2 Timer Typography

Timer digits should use a highly legible weight and spacing.

The timer must remain readable from a short glance.

---

# 6. Spacing and Shape

Use a consistent spacing scale.

Recommended base:

```text
4px
8px
12px
16px
20px
24px
32px
40px
48px
```

Use:

- 8–12px radius for controls
- 12–16px radius for cards
- restrained shadows
- thin borders

Avoid excessively rounded interfaces.

---

# 7. Application Shell

## Desktop

Use a compact left sidebar or equivalent persistent navigation.

Navigation:

```text
TODAY
BRAIN DUMP
TASKS
ANALYTICS
SETTINGS
BACKUP
```

Show active state with:

- primary-color indicator
- subtle surface change
- text emphasis

Avoid large navigation graphics.

## Mobile

Use a compact bottom navigation or equivalent mobile-friendly pattern.

Keep the most important navigation destinations immediately accessible.

The current timer must always be reachable.

---

# 8. Screen 1 — TODAY

This is the primary application screen.

## Hierarchy

```text
Date / status
      ↓
Today's Main Outcome
      ↓
Current Task
      ↓
Checklist
      ↓
Next Task
      ↓
Day Progress
```

## 8.1 Header

Show:

- current date
- day name
- concise day status

Example:

> Friday, September 4  
> 2 important outcomes remaining

## 8.2 Today's Main Outcome

A prominent but compact card.

Example:

```text
TODAY'S MAIN OUTCOME

Complete EDC revision and verify the TRAKAE parser.
```

## 8.3 Current Task

The current task should dominate the screen while a timer is running.

Example:

```text
🔴 P1  CRITICAL

EDC Revision

4:30 PM – 6:00 PM

EXPECTED RESULT
Complete Diode topic + solve planned problems.

          01:17:42

2 / 4 checklist items

[ PAUSE ]       [ COMPLETE ]
```

## 8.4 Next Task

Show:

- priority
- title
- scheduled time
- duration

Do not display excessive detail.

## 8.5 Day Progress

Use outcome-oriented progress where possible.

Prefer:

> 2 of 3 important outcomes completed

over:

> 7 of 14 tasks completed

---

# 9. Screen 2 — BRAIN DUMP

This screen must be extremely simple.

## Primary heading

> What do you need to do today?

Supporting line:

> Write everything roughly. Don't organize it.

## Input

Use a large textarea with comfortable typing space.

Example placeholder:

```text
college till 4 then study edc for 2 hours
finish trakt parser
gym at 6:30
check github issue
revise python if possible
```

## Actions

Primary:

```text
[ Parse with AI ]
```

Secondary:

```text
[ Quick Split ]
```

## Important UX rule

Do not ask users to manually create structured tasks before parsing.

---

# 10. Screen 3 — AI PROCESSING

Show a calm processing state.

Example:

```text
Understanding your day…

✓ Reading your brain dump
✓ Finding tasks
● Checking priorities
○ Building a realistic schedule
```

Do not use fake percentage progress.

Do not make processing visually dramatic.

---

# 11. Screen 4 — CLARIFICATION

When exactly one task is unclear, focus the interface on that task.

Example:

```text
I understand the rest of your plan.

I need clarification about:

“fix supplier thing”

What exactly do you need to do?

[ Type clarification… ]

[ Continue ]
```

The user must not feel that their entire brain dump has failed.

Keep the already understood work visible or summarized.

---

# 12. Screen 5 — PROPOSED PLAN / FIX

This is the most important decision screen.

The page must make the proposed day easy to inspect.

## 12.1 Header

```text
YOUR PROPOSED DAY
```

Show:

```text
Planned: 4h 20m
Available: 4h 35m
Buffer: 15m

✓ Feasible
```

If overloaded:

```text
⚠ Plan exceeds available time by 1h 25m
```

## 12.2 Today's Priority

Show one main outcome.

## 12.3 Must Win Today

Show only P1/P2 work.

Example cards:

```text
🔴 P1
EDC Study

Expected result:
Complete Diode topic + solve 5 problems.

90 min
```

```text
🟠 P2
TRAKAE Parser

Expected result:
Fix mapping + verify output.

90 min
```

## 12.4 Other Tasks

P3/P4 should appear in a visually lower hierarchy.

Example:

```text
🟡 P3   Gym                      45 min
🟢 P4   Check GitHub issue       20 min
```

## 12.5 Task Editing

Every proposal card should expose editing without creating UI clutter.

Editable:

- title
- priority
- expected result
- duration
- category
- checklist
- scheduled time

## 12.6 Low-Value Recommendation

Example:

```text
Consider postponing

This task is lower value than today's P1/P2 work.
```

Never shame the user.

## 12.7 FIX Action

Use a clearly dominant button:

```text
✓ FIX PLAN
```

Supporting label:

> Creates your executable schedule.

This button must visually communicate that this is the transition from proposal to approved plan.

---

# 13. Screen 6 — PRACTICAL SCHEDULE

Show the approved day as a chronological timeline.

Example:

```text
4:00 PM   Break / Travel

4:30 PM   🔴 P1 EDC
          90 min

6:00 PM   Break

6:30 PM   🟡 P3 Gym
          45 min

7:30 PM   🟠 P2 TRAKAE
          90 min

9:20 PM   Buffer
```

Use visual differences for:

- fixed commitments
- work blocks
- breaks
- buffer
- completed blocks
- current block

The current block should be the strongest item on screen.

---

# 14. Screen 7 — TASK DETAIL / EXECUTION

When the user enters a task, remove distractions.

Structure:

```text
Priority
Task title
Scheduled time
Expected result
Timer
Checklist
Controls
```

The expected result should remain visible while executing.

This reinforces outcome-first behavior.

---

# 15. Timer UX

Timer is a core product element.

## Idle

```text
Ready to focus

[ START ]
```

## Running

```text
01:17:42

EDC Revision

[ PAUSE ]
```

## Paused

```text
PAUSED
01:04:25 remaining

[ RESUME ]
```

## Complete

```text
✓ Completed

Planned   90 min
Actual    84 min

[ DONE ]
```

## Overtime

Use a restrained warning state:

```text
⚠ Planned time exceeded
+12 min
```

Do not turn overtime into a failure/shame state.

---

# 16. Checklist UX

Checklist items should be easy to scan and tap.

Example:

```text
☑ Review concept
☐ Study formulas
☐ Solve 5 problems
☐ Recall without notes
```

Use touch targets large enough for mobile.

The checklist should remain visible beside/below the timer depending on screen size.

---

# 17. Single Active Timer UX

If the user tries to start another task while one timer is running, show a controlled confirmation.

Example:

```text
EDC Revision is currently running.

Switch to TRAKAE Parser?

[ Stay on EDC ]   [ Switch Task ]
```

Avoid confusing multiple simultaneous timers.

---

# 18. Notifications

Notification language should be practical, not motivational.

Examples:

```text
EDC Revision starts in 10 minutes.
```

```text
EDC Revision starts now.
```

```text
10 minutes remaining.
```

```text
Next: TRAKAE Parser starts in 5 minutes.
```

Use concise notification text.

Do not repeatedly remind the user without meaningful reason.

---

# 19. Task Board

The task-management screen should support:

```text
All
Planned
Running
Completed
Postponed
Missed
Rescheduled
```

Task row/card should show:

- priority
- task title
- expected result where space allows
- scheduled time/date
- duration
- status

Use compact cards rather than oversized project-management cards.

---

# 20. Daily Review

The review screen should answer:

> What actually happened today?

Sections:

```text
COMPLETED
MISSED
POSTPONED
RESCHEDULED
```

Show planned vs actual time.

Use neutral language for missed work.

Example:

> 2 important outcomes completed. 1 task moved to tomorrow.

---

# 21. Analytics

Analytics should explain the user's behavior without overwhelming them.

## Top KPIs

- completion rate
- planned vs actual time
- estimation accuracy
- realistic workload capacity

## Pattern Cards

Example:

```text
PATTERN DETECTED

Coding tasks usually take longer than planned.

8 completed tasks
Planned: 60 min average
Actual: 91 min average

Recommendation
Try allocating about 90 min.
```

The recommendation should clearly appear as a recommendation based on recorded evidence.

Do not present speculation as fact.

---

# 22. Personalization UI

Use evidence-based wording.

Preferred:

> Based on your recent history…

> Across 8 completed tasks…

> Your average actual time is…

Avoid:

> You are a procrastinator.

> You always fail in the evening.

The UI should never turn normal productivity variation into a personality judgment.

---

# 23. Settings

Settings should be organized into clear sections.

## General

- work start time
- work end time
- timezone
- notification preferences

## AI Provider

Provider selector:

```text
Ollama
OpenRouter
Offline / No AI
```

---

# 24. Ollama Settings

Provide:

```text
OLLAMA

Base URL
[ http://127.0.0.1:11434 ]

Model
[ configured model ]

Status
● Connected

[ Test Connection ]
```

States:

- Connected
- Connecting
- Unavailable
- Invalid model

Provide clear error recovery.

Never show a fake connected state.

---

# 25. OpenRouter Settings

Provide:

```text
OPENROUTER

Base URL
[ configured URL ]

Model
[ configured free model ]

API Key
[ ••••••••••••• ]

Usage policy
Free models only

[ Test Connection ]
```

After saving, do not display the full secret again.

Make the free-only policy visible.

The visual design must communicate that FlowDesk will never automatically switch to a paid model.

---

# 26. Backup / Restore

Use a simple utility screen.

```text
BACKUP & RESTORE

Your data is stored locally.

Last backup:
Today, 10:20 AM

[ EXPORT BACKUP ]

[ IMPORT BACKUP ]
```

Provide clear status messages:

- Backup created
- Backup verified
- Restore successful
- Invalid backup
- Checksum mismatch
- Restore failed

Do not make backup management look like an administrative enterprise console.

---

# 27. Empty States

## No Tasks

```text
Nothing planned yet.

Tell FlowDesk what you need to do today.

[ ADD BRAIN DUMP ]
```

## No Analytics

```text
Your patterns will appear here after you complete some tasks.
```

## No Active Timer

```text
Nothing is running.

[ VIEW TODAY ]
```

---

# 28. Error States

Errors must explain what happened and what the user can do next.

Bad:

> Error 500

Good:

```text
Ollama is unavailable.

Your tasks and timer still work.

[ Retry ]
[ Use Quick Split ]
```

Do not expose stack traces to normal users.

---

# 29. Loading States

Use restrained loading states for:

- AI parsing
- clarification
- schedule calculation
- FIX save
- timer actions
- backup export/import
- provider connection test

Use skeletons/spinners where appropriate.

Do not use fake progress numbers.

---

# 30. Responsive Rules

## Desktop

Use multi-column layouts where they improve comprehension.

Example:

```text
Main content                    Supporting panel
Today / Current Task            Next Task / Day summary
```

## Tablet

Collapse secondary panels when needed.

## Mobile

Use one main column.

Priority order:

```text
Current task
Timer
Checklist
Next task
Day progress
```

The current timer must remain visible without excessive scrolling.

For proposal review, stack cards vertically.

For task boards, convert rows into touch-friendly cards.

---

# 31. Touch and Interaction Standards

Mobile touch targets should be comfortably tappable.

Avoid tiny icon-only actions for important operations.

Critical actions such as:

- Start
- Pause
- Resume
- Complete
- FIX

must have clear text labels.

Icon-only controls may be used for secondary navigation with accessible labels.

---

# 32. Motion

Motion must explain state changes.

Good uses:

- checklist completion
- timer state transition
- task card movement after FIX
- notification appearance
- successful save

Avoid:

- bouncing cards
- constant animated backgrounds
- excessive page transitions
- distracting timer effects

Use short, subtle transitions.

Respect reduced-motion preferences.

---

# 33. Accessibility

The UI must support:

- semantic headings
- keyboard navigation
- visible focus
- accessible form labels
- accessible dialogs
- accessible buttons
- sufficient text contrast
- status text in addition to color
- screen-reader-friendly controls
- reduced motion preference

Priority labels must remain understandable without color perception.

---

# 34. Core Reusable Components

Create a consistent component system around:

```text
AppShell
Navigation
PageHeader
MainOutcomeCard
PriorityBadge
TaskCard
ProposalTaskCard
ScheduleBlock
CurrentTaskCard
Checklist
TimerDisplay
TimerControls
FeasibilityBanner
ClarificationCard
FixButton
StatusBadge
NotificationBanner
AnalyticsCard
PatternCard
ProviderCard
BackupCard
EmptyState
ErrorState
LoadingState
Modal
ConfirmationDialog
Toast
```

Components should have defined visual states rather than one generic appearance.

---

# 35. Component State Requirements

## TaskCard

States:

- proposed
- approved
- running
- completed
- postponed
- missed
- rescheduled

## Timer

States:

- idle
- running
- paused
- completed
- overtime

## ProviderCard

States:

- not configured
- testing
- connected
- unavailable
- invalid configuration

## FeasibilityBanner

States:

- feasible
- tight
- overloaded

---

# 36. Before FIX vs After FIX

This visual distinction is critical.

## Before FIX

Use language:

- Proposed
- Suggested
- Review
- Edit
- Recommendation

Primary action:

```text
✓ FIX PLAN
```

## After FIX

Use language:

- Planned
- Scheduled
- Ready
- Current
- Next

Primary action:

```text
START
```

The user should immediately understand whether they are reviewing AI output or executing an approved plan.

---

# 37. Information Priority

Across the application, use this hierarchy:

```text
1. What should I do now?
2. Why does it matter?
3. How much time do I have?
4. What should I do next?
5. What remains today?
6. What did I learn?
7. Configuration / history
```

Do not reverse this hierarchy.

---

# 38. Design Anti-Patterns

Do NOT create:

- a giant KPI dashboard as the home screen
- a calendar-first experience
- a generic kanban-first experience
- an AI chat interface as the primary product
- excessive setup forms before first use
- mandatory manual categorization
- mandatory manual scheduling
- motivational quote walls
- streak-heavy gamification
- social feeds
- collaboration screens
- cloud-sync configuration not specified by the product

FlowDesk should feel like an assistant that quietly turns messy input into a clear executable day.

---

# 39. First-Time User Experience

The first-use experience should be short.

Suggested sequence:

```text
Welcome
  ↓
Choose / verify AI provider
  ↓
Set working hours
  ↓
Write today's brain dump
  ↓
See proposed plan
  ↓
FIX
  ↓
Start first task
```

Do not force users through a long onboarding tutorial.

---

# 40. Design Acceptance Criteria

The design is considered complete only when a developer can determine the intended UI behavior without guessing for the main flows.

Required screens/states:

```text
[ ] Today
[ ] Brain Dump
[ ] AI Processing
[ ] Clarification
[ ] Proposal Review
[ ] FIX state
[ ] Practical Schedule
[ ] Task Detail
[ ] Timer idle
[ ] Timer running
[ ] Timer paused
[ ] Timer completed
[ ] Timer overtime
[ ] Task Board
[ ] Daily Review
[ ] Analytics
[ ] Personalization
[ ] Settings
[ ] Ollama configuration
[ ] OpenRouter configuration
[ ] Backup / Restore
[ ] Loading states
[ ] Empty states
[ ] Error states
[ ] Mobile layouts
[ ] Accessibility states
```

---

# 41. Design Source-of-Truth Rule

This file defines **how FlowDesk should look, behave, and feel at the interface level**.

The product specification remains authoritative for product functionality and business rules.

The engineering specification remains authoritative for technical implementation.

When implementing the UI:

```text
Product behavior → Master Production Specification
Visual / interaction behavior → DESIGN.md
Technical implementation → Engineering specification
```

Do not change product rules simply to match a visual design.

---

# 42. Final UX Statement

FlowDesk should feel like this:

> **“I can dump everything in my head, FlowDesk figures out what matters, shows me a realistic plan, I approve it with FIX, and then I simply execute.”**

The UI should make that experience obvious from the first screen to the final review.
