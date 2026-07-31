# Current-State Audit

## Verified baseline

The application is a local Java 21/Spring Boot/MVC/Thymeleaf application using
H2 and Flyway. It has an eight-problem catalogue, a fixed 13-stage Attempt,
progressive hints, reference-answer reveal history, review schedules, failure
labels, rule-based coaching, post-attempt summaries, and partial
implementation-reliability recording. It has no OpenAI API, external LLM,
scraping, telemetry, or code-execution sandbox.

## Architectural finding

The current flow is a fixed workflow recorder: starting an Attempt creates all
13 StageAssessments and completing an initial Attempt creates a fixed review
sequence. The redesign target is an adaptive curriculum engine: exposure and
diagnosis select the smallest useful task, and evidence updates separate
comprehension, brute-force, derivation, implementation, retention, transfer,
discrimination, and timed-performance axes.

## Preserve

- the local stack, Flyway history, Problem/Pattern IDs, and metadata-only content;
- legacy Attempt, StageAssessment, HintUsage, reveal, ReviewSchedule, coaching,
  and implementation-error records as readable historical evidence;
- nullable stage scores and the distinction between unassessed and score zero;
- the generalized state/updated-region vocabulary.

## Legacy boundary

The fixed linear stage workflow, unconditional 1/4/7/21 review creation,
binary `Problem.solved`, and lowest-stage-rate WeeklyPlan are legacy
orchestration. They remain operational and readable until the curriculum layer
has parity; R0 does not alter them.

## Safety rules

No existing Flyway migration, local H2 data, or learner history is rewritten.
New curriculum tables will be additive and legacy projections must retain
source IDs. Holdout exposure and transfer integrity are future R6 work.

