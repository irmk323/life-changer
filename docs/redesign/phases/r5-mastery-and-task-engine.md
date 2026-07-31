# R5 — Mastery projections and task engine

## Purpose
Derive multi-axis mastery and choose next tasks from valid evidence instead of fixed reviews.
## Current dependency
R1–R4 sessions, skills, exposure, and structured evidence.
## Domain changes
Add MasteryAxis/Level projections and LearningTask with reason, priority, due window, and completion links.
## Database migration
Add projection/task tables and indexes; legacy ReviewSchedule remains untouched/readable.
## Service changes
Implement deterministic validity filters, sample counts, repair/retention generation, and daily prioritization.
## UI changes
Task inbox and explanation of why one next task was selected.
## Legacy compatibility
Show legacy reviews separately; do not duplicate or cancel them automatically.
## Explicit non-scope
No holdout selection, contrast engine, or dashboard replacement.
## Unit tests
Mastery rules, sample thresholds, task priority, no-all-task generation.
## Integration tests
Evidence creates one appropriate task and never overwrites legacy reviews.
## MVC tests
Inbox ordering, reason text, empty-state safety.
## Migration/regression tests
Legacy analytics and reviews remain intact.
## Acceptance criteria
The next task is evidence-driven and mastery displays axis/sample reasons.
## Implementation report format
Files, rules, migrations, test evidence, manual queue checks, deferred axes.

