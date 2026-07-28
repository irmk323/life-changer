# Data model

## Modelling principles

The schema stores the learner's process rather than a binary completion record.
Answers are user-authored text or structured selections; problem statements and
editorial solutions are not stored. Reference material is limited to metadata,
app-authored abstractions, hints, and links.

All entity timestamps are `Instant`; a learner-facing review date is `LocalDate`
calculated in the configured user time zone. UUID identifiers are recommended
for exports/imports and simpler future data portability.

## Main entities

### Catalogue

`problem`

- `id` UUID PK
- `leetcode_number` integer, nullable (supports synthetic exercises)
- `title`, `slug`, `external_url`
- `difficulty` enum: EASY, MEDIUM, HARD, SYNTHETIC
- `neetcode_category`, `active`
- `created_at`, `updated_at`

`pattern`

- `id` UUID PK; `name` unique; `description`
- `trigger_clues`, `default_brute_force`, `repeated_work`
- `unresolved_state`, `resolution_event`, `updated_region`
- `required_operations`, `invariant`, `complexity_notes`
- `common_mistakes`, `contrast_conditions`, `java_template`
- `created_at`, `updated_at`

Long-form fields are app-authored learning material. Multi-valued fields are
initially text/JSON-like content at the service boundary; normalized tag tables
can be introduced only when filtering needs them.

`problem_pattern`

- `problem_id` FK -> problem; `pattern_id` FK -> pattern
- `primary_pattern` boolean; `notes`
- composite PK `(problem_id, pattern_id)`

Each problem has at most one primary pattern (enforced by service validation;
add a filtered unique index if supported by the selected H2 version).

`problem_note`

- `id` UUID PK; `problem_id` FK -> problem
- `note_type` enum: USER_SUMMARY, USER_SOLUTION_NOTE
- `content`, `updated_at`
- unique `(problem_id, note_type)`

### Learning sessions and evidence

`attempt`

- `id` UUID PK; `problem_id` FK -> problem
- `attempt_type` enum: INITIAL, SAME_PROBLEM_REVIEW, ISOMORPHIC_TRANSFER,
  CONTRAST_CLASSIFICATION, MIXED_CLASSIFICATION, COLD_SOLVE,
  IMPLEMENTATION_ONLY
- `source_review_schedule_id` nullable FK -> review_schedule
- `started_at`, `completed_at`, `duration_seconds`
- `final_result` enum: COMPLETED, PARTIAL, ABANDONED, EXTERNAL_ACCEPTED,
  EXTERNAL_REJECTED, NOT_RECORDED
- implementation fields: `language`, `code`, `implementation_started_at`,
  `implementation_completed_at`, `implemented_independently`,
  `compile_error_count`, `wrong_answer_count`, `timed_out`,
  `understood_but_could_not_implement`, `edge_case_failed`,
  `external_submission_result`
- `confidence_before`, `confidence_after` (optional bounded integers),
  `emotion`, `reflection`, `created_at`

`stage_assessment`

- `id` UUID PK; `attempt_id` FK -> attempt
- `stage_type` enum (the 15 measured skills below)
- `answer_text` nullable; `selected_value` nullable for structured stages
- `score` small integer, constraint 0..2
- `duration_seconds`, `max_hint_level` small integer constraint 0..5
- `evaluator_notes`, `saved_at`
- unique `(attempt_id, stage_type)`

`stage_type` uses the assessment granularity required for analytics:

1. RELATION_EXTRACTION
2. BRUTE_FORCE
3. REPEATED_WORK
4. UNRESOLVED_STATE
5. RESOLUTION_EVENT
6. UPDATED_REGION
7. REQUIRED_OPERATIONS
8. DATA_STRUCTURE_SELECTION
9. INVARIANT
10. CORRECTNESS_REASONING
11. COMPLEXITY_ANALYSIS
12. IMPLEMENTATION
13. EDGE_CASES
14. ISOMORPHIC_TRANSFER
15. MIXED_PATTERN_DISCRIMINATION

The display workflow has 13 stages: correctness and complexity share its
"Correctness and Complexity" stage but retain two assessments; transfer and
mixed discrimination can be task-specific later stages. This avoids losing the
separate mandatory measures.

`hint`

- `id` UUID PK; `problem_id` nullable FK -> problem; `pattern_id` nullable FK
  -> pattern
- `stage_type`, `hint_level` 1..5, `content`, `display_order`

Exactly one of `problem_id` and `pattern_id` is required for MVP. The service
chooses a problem hint first, then a pattern hint.

`hint_usage`

- `id` UUID PK; `attempt_id` FK -> attempt; `hint_id` FK -> hint
- `stage_type`, `used_at`, `helped_user_proceed`

`failure_label`

- `id` UUID PK; `code` unique; `display_name`, `description`

Seed the full controlled vocabulary from the product spec, including relation,
state, event, updated-region, operations, invariant, transfer, recall, time
pressure, implementation, debugging, and OTHER labels.

`attempt_failure_label`

- `attempt_id` FK -> attempt; `failure_label_id` FK -> failure_label
- `severity` enum: BLOCKING, SIGNIFICANT, MINOR; `notes`
- composite PK `(attempt_id, failure_label_id)`

### Reviews, planning, and feedback

`review_schedule`

- `id` UUID PK; `source_attempt_id` FK -> attempt
- `problem_id` nullable FK -> problem; `pattern_id` nullable FK -> pattern
- `review_type` enum: RECONSTRUCTION, ISOMORPHIC_TRANSFER,
  CONTRAST_CLASSIFICATION, COLD_SOLVE, TARGETED_STAGE
- `scheduled_date`; `completed_at`
- `status` enum: PENDING, DUE, COMPLETED, MISSED, RESCHEDULED, CANCELLED
- `target_stages` text/JSON list; `reschedule_reason`, `created_at`

For a review that needs an unseen target, `problem_id` is the source problem
and the selected target is recorded in its resulting Attempt. A later
`review_target_problem_id` can be added if preassignment becomes necessary.

`weekly_plan`

- `id` UUID PK; `week_start` unique
- `focus_stage_type` nullable; `focus_pattern_id` nullable FK -> pattern
- `reason`, `target_metrics`, `status` enum: DRAFT, ACTIVE, COMPLETED,
  SUPERSEDED; `created_at`

`coaching_message`

- `id` UUID PK; `attempt_id` FK -> attempt
- `provider`, `message`, `generated_at`

`user_settings`

- singleton `id`; `time_zone`, `review_intervals_json`
- `data_directory`, `ui_language`, `notifications_enabled`
- `local_llm_enabled`, `local_llm_endpoint` nullable; `updated_at`

## Relationships and lifecycle

```text
Problem *---* Pattern (ProblemPattern)
Problem 1---* Attempt 1---* StageAssessment
Attempt 1---* HintUsage *---1 Hint
Attempt *---* FailureLabel (AttemptFailureLabel)
Initial completed Attempt 1---* ReviewSchedule
Attempt 1---* CoachingMessage
Pattern 1---* WeeklyPlan (optional focus)
```

Deleting user data should be an explicit settings operation, not normal cascade
behaviour. In normal use, catalogue records are deactivated rather than deleted.
Attempt completion is transactional: final stage evidence and labels persist,
initial schedules are created if applicable, then coaching is generated from the
committed evidence. Repeated completion requests must not duplicate schedules;
enforce a unique source-attempt/review-type pair for the initial sequence.

## Indexes

- `attempt(problem_id, completed_at)` for history and retention.
- `stage_assessment(stage_type, score)` and `stage_assessment(attempt_id)` for
  metric aggregation.
- `review_schedule(status, scheduled_date)` for dashboard/queue queries.
- `problem(difficulty, neetcode_category, active)` for library filters.
- `problem_pattern(pattern_id, primary_pattern)` for transfer selection.

## Import/export shape

JSON export has a schema version and separate arrays for catalogue, user notes,
attempts, assessments, hint usages, labels, schedules, plans, settings, and
coaching messages. Imports validate schema version, controlled enums, score and
hint bounds, references, and UUID collisions before a transaction. The initial
MVP supports a separate CSV/JSON problem seed schema; it does not scrape any
site or import copyrighted statement/editorial text.

