# R8 — Dashboard and planner replacement

## Purpose
Expose curriculum coverage, multi-axis mastery, unseen performance, and reliability without solved-count emphasis.
## Current dependency
R5 task/mastery, R6 integrity, and R7 reliability evidence.
## Domain changes
Add only presentation projections if needed; do not duplicate source evidence.
## Database migration
Optional additive read-model indexes only.
## Service changes
Sample-aware dashboard/query services and replacement of lowest-stage weekly recommendation with task engine reasoning.
## UI changes
Curriculum queue, Pattern mastery matrix, first-blocked skills, reliability, and unseen-performance panels.
## Legacy compatibility
Keep legacy analytics page available during comparison period.
## Explicit non-scope
No leaderboard, gamification, external telemetry, or legacy table deletion.
## Unit tests
Sample/N-A formatting, metric isolation, priority explanations.
## Integration tests
Mixed legacy/new evidence and filtered dashboard projections.
## MVC tests
Matrix, queue, no-data state, legacy/new separation.
## Migration/regression tests
Existing dashboard routes remain valid.
## Acceptance criteria
The dashboard explains evidence and the next task without treating solved count as mastery.
## Implementation report format
Files, metrics, tests, screenshots/manual checks, legacy comparison, limitations.

