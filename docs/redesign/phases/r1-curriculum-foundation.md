# R1 — Curriculum foundation

## Purpose
Create additive curriculum vocabulary and exposure/session shells without replacing the workspace.
## Current dependency
R0 documentation baseline; existing Problem, Pattern, Attempt, HintUsage, and reveal history.
## Domain changes
Add SkillDefinition, LearningMode, ModeSkillRequirement, CurriculumItem, ProblemExposure, ContentExposureEvent, and LearningSession linked to optional legacy Attempt IDs.
## Database migration
Implemented additively in `V23__add_curriculum_foundation.sql`,
`V24__add_learning_mode_definitions.sql`, and
`V25__strengthen_curriculum_foundation_constraints.sql`. These migrations add
only foundation tables/columns and constraints; they do not update legacy
Attempt, StageAssessment, HintUsage, reveal, review, failure-label, dashboard,
or analytics data.

`LearningModeDefinition` is the database source for mode display name,
description, display order, active state, content version, and requirement
linkage. `LearningMode` remains a stable Java identifier and the retained V23
string column is deterministically linked to the definition in V24. The
versioned Flyway seed is repeat-safe for an already-migrated local database:
Flyway records the version and does not re-run its inserts.
## Service changes
`CurriculumFoundationService` exposes deterministic read-only skills, modes,
requirements, items, exposure snapshots, sessions, and role/pattern coverage.
It also provides the foundation rule that a HOLDOUT cannot be eligible after a
non-`NEVER_SEEN` exposure. No adaptive routing or learner write endpoint is
present.
## UI changes
Read-only coverage/admin pages only.
## Legacy compatibility
Legacy start, Attempt detail, reviews, and analytics remain unchanged.
`learning_session.legacy_attempt_id` is nullable and uses `ON DELETE SET NULL`:
there is no Attempt backfill, no cascade delete of legacy history, and a
session without an Attempt (or an Attempt without a session) is valid.
`content_exposure_event.learning_session_id` also uses `ON DELETE SET NULL`;
Problem and Pattern remain restrictive foreign keys. One current
`problem_exposure` snapshot is enforced per Problem, while exposure events are
append-only. `mode_skill_requirement` is unique by both legacy code/order and
definition/order, and `curriculum_item` is unique by Problem/Pattern/Role.
## Explicit non-scope
No adaptive workspace, task queue, mastery calculation, holdout routing, or 150 catalogue.
## Unit tests
`CurriculumFoundationDomainTest` fixes the published mode/role vocabulary,
requirement order/applicability validation, explicit exposure states, holdout
protection, nullable legacy links, and session status transitions.
## Integration tests
`CurriculumFoundationIntegrationTest` validates the V1–V25 Flyway schema and
seed on the test database, definition-linked requirements, curriculum items,
exposure/event persistence, and LearningSessions both with and without a
legacy Attempt link.
## MVC tests
`CurriculumFoundationControllerTest` fixes the read-only `/curriculum` model
and its explicit legacy-workflow notice. The existing `AttemptControllerTest`
continues to verify `POST /problems/{problemId}/attempts` redirects to the
legacy workspace.
## Migration/regression tests
V1–current upgrade, existing Attempt/Hint/Review reads, and no local-data reset.
## Acceptance criteria
Curriculum vocabulary exists beside legacy evidence and old flows still run.
R1 intentionally seeds nine skills, all twelve documented modes, five mode
requirements, and three items drawn from the existing eight-problem catalogue;
it does not add a HOLDOUT seed or expose holdout content in learner pages.
## Implementation report format
Files, migration, compatibility proof, tests/counts, manual checks, non-scope.
