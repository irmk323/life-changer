# Implementation plan

## Current and target plans

The numbered Phase 2–11 plan describes the implemented prototype. The active
forward plan is `docs/redesign/`, beginning with R0 documentation/safety and
then R1–R9. R0 changes no learner workflow, schema, migration, or local
database. Later redesign phases use additive migrations and retain current
Attempt/StageAssessment/ReviewSchedule history until parity is proven.

## Guiding delivery rule

Each phase is a small vertical slice, leaves the application runnable, adds
tests for the business logic it introduces, and must preserve the distinction
between cognitive-stage evidence, retention, transfer, and discrimination.
No phase is permitted to replace this with a solved-problem checklist.

## Phase 0 — Design baseline (this change)

Deliver the architecture, schema, decisions, and implementation plan. Confirm
the unresolved product choices in `decisions.md`. No application code.

Acceptance: documents accurately represent the 13-stage workflow, 15 distinct
measured skills, progressive hints, varied review types, and an eight-problem
MVP.

## Phase 1 — Runnable foundation and catalogue slice

Create the Maven-wrapper Spring Boot Java 21 project, package structure,
Thymeleaf shell, file-H2 configuration, Flyway baseline, test profile with
in-memory H2, and README run instructions. Implement Problem, Pattern, and
ProblemPattern catalogue services and a library page. Add metadata-only seeds
for the eight MVP problems and a small initial pattern set.

Tests: Flyway starts on empty DB; seed/service repository integration; library
MVC rendering and filters.

Acceptance: `./mvnw spring-boot:run` and `./mvnw test` work; the library shows
the MVP catalogue without storing scraped statement/editorial content.

## Phase 2 — Attempt and stage-assessment vertical slice

Implement Attempt, the 13-stage workspace, `StageAssessment`, structured
updated-region and operations controls, score 0–2 validation, timing, optional
learner notes, implementation outcome fields, reflection, and failure labels.
Hide patterns/categories at attempt start. Start with one fully authored
exemplar flow, then apply the shared form to all MVP problems.

Tests: stage-score/hint consistency, attempt lifecycle, assessment persistence,
failure-label many-to-many mapping, workspace MVC flows.

Acceptance: a learner can create and complete a recorded initial attempt whose
evidence identifies where reasoning stopped rather than merely whether it was
solved.

## Phase 3 — Progressive hints and evidence-based coaching

Implement problem/pattern hint authoring and the 0–5 reveal policy, immutable
usage history, and `CoachProvider` with `RuleBasedCoachProvider`. Add
completion feedback in the specified Observation/Bottleneck/Interpretation/Next
Test/Evidence structure.

Tests: next-hint selection/order, max hint aggregation, coach rule selection,
and no generic success claim when evidence is absent.

Acceptance: hints advance by stage and feedback cites actual scores, hints, and
failure labels.

## Phase 4 — Reviews and transfer tasks

Implement initial schedule creation, due/overdue review queue, review-to-attempt
linking, targeted stage rescheduling, and authorable transfer/contrast task
selection. Add an initial synthetic or metadata-only isomorphic target where
needed so transfer can be tested without revealing the source pattern.

Tests: 1/4/7/21 local-date calculation, idempotent initial schedules, queue
queries, review completion, remedial deduplication, and transfer target has no
prior completed attempt.

Acceptance: completing an initial attempt produces distinct reconstruction,
transfer, contrast, and cold-solve obligations—not four identical repeats.

## Phase 5 — Stage-first dashboard, metrics, and planning

Implement dashboard summary, analytics services, retention/transfer/mixed
metrics, recent bottleneck calculation, weekly focus suggestion, and minimal
weekly review page. Solved count remains visually and semantically secondary.

Tests: all formulae from `decisions.md`, insufficient-evidence behaviour,
bottleneck tie-breaking, dashboard aggregation integration.

Acceptance: dashboard names a measurable cognitive bottleneck and a concrete
next exercise, with sample sizes and separate transfer/retention values.

## Phase 6 — Data portability and operational polish

Implement versioned JSON export/import, metadata CSV/JSON seed import,
settings, backup guidance, and explicit local-data deletion. Finish README with
storage location, privacy, no-background-notification limitation, content
constraints, and migration/back-up instructions.

Tests: export/import round-trip, malformed schema rejection, reference
validation, settings persistence, migration compatibility.

Acceptance: a user can preserve and restore local data without network access;
invalid imports do not partially mutate the database.

## Phase 7 — Expand carefully after MVP validation

Add reviewed metadata-only NeetCode 150 imports, more authored pattern cards,
isomorphic/contrast/synthetic exercises, richer analytics, optional local LLM
provider behind a disabled-by-default flag, and optional notifications. Expand
only where the content includes the cognitive prompts needed to assess transfer;
do not add title/tag-only catalogue entries merely to reach 150.

## Proposed first implementation phase

Begin Phase 1: the executable Spring Boot foundation plus the metadata-only
Problem/Pattern catalogue for the eight MVP problems. This establishes durable
migrations and the content boundary before attempts introduce learner data.
