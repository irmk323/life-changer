# R3 — Adaptive session and diagnostic workflow

## Purpose
Route a learner from pre-session exposure to the smallest useful diagnostic task.
## Current dependency
R1 modes/exposure plus R2 role/content coverage.
## Domain changes
Add session questionnaire answers, SessionSkillTask, first-blocked-skill evidence, and routing reason codes.
## Database migration
Add session-task/evidence tables; no deletion or reinterpretation of StageAssessment.
## Service changes
Recommend COLD_DIAGNOSTIC, GUIDED_RECONSTRUCTION, or IMPLEMENTATION_DIAGNOSTIC deterministically; allow an auditable override.
## UI changes
New start questionnaire and one-task-at-a-time workspace for one anchor problem.
## Legacy compatibility
Legacy 13-stage Attempt is reachable for historic records and unchanged problems.
## Explicit non-scope
No broad mastery projection, brute-force worksheet, or daily task engine.
## Unit tests
Exposure-to-mode routing, first-blocked selection, override audit.
## Integration tests
New session linked to legacy Attempt where required; hints/reveals retained.
## MVC tests
Questionnaire, recommendation reason, blocked action, legacy redirect.
## Migration/regression tests
Existing resume/review paths and StageAssessment history remain readable.
## Acceptance criteria
Different exposure states produce different session task sets, not 13 mandatory fields.
## Implementation report format
Files, routing table, migrations, tests, manual paths, known content limits.

