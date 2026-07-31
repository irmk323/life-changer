# R1 — Curriculum foundation

## Purpose
Create additive curriculum vocabulary and exposure/session shells without replacing the workspace.
## Current dependency
R0 documentation baseline; existing Problem, Pattern, Attempt, HintUsage, and reveal history.
## Domain changes
Add SkillDefinition, LearningMode, ModeSkillRequirement, CurriculumItem, ProblemExposure, ContentExposureEvent, and LearningSession linked to optional legacy Attempt IDs.
## Database migration
Add only new tables, foreign keys, indexes, and idempotent seed data; never mutate legacy scores.
## Service changes
Add deterministic exposure and curriculum coverage services; no adaptive routing yet.
## UI changes
Read-only coverage/admin pages only.
## Legacy compatibility
Legacy start, Attempt detail, reviews, and analytics remain unchanged; projections retain legacy IDs.
## Explicit non-scope
No adaptive workspace, task queue, mastery calculation, holdout routing, or 150 catalogue.
## Unit tests
Exposure transition, mode requirement, and idempotent content-coverage tests.
## Integration tests
Flyway upgrade with existing Attempt/history; legacy-linked LearningSession creation.
## MVC tests
Coverage page and absence of learner-facing workflow changes.
## Migration/regression tests
V1–current upgrade, existing Attempt/Hint/Review reads, and no local-data reset.
## Acceptance criteria
Curriculum vocabulary exists beside legacy evidence and old flows still run.
## Implementation report format
Files, migration, compatibility proof, tests/counts, manual checks, non-scope.

