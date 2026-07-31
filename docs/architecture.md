# Architecture

## Product intent

LeetCode Thinking Trainer is a local, single-user learning application. Its unit
of learning is not a remembered solution or a solved problem; it is the
evidence that a learner can perform each reasoning step from a problem statement
to an algorithm and then reuse that reasoning on an unseen isomorphic problem.

The primary flow is:

```text
problem prompt (tags hidden)
  -> relation -> brute force -> repeated work -> unresolved state
  -> resolution event -> updated region -> operations -> data structure
  -> invariant -> correctness/complexity -> implementation
  -> transfer/classification -> reflection
```

A normal progress tracker records completion, perhaps time and a tag. This
application records which of the intermediate transformations were independent,
hint-assisted, or not yet understood. It therefore treats a same-problem recall,
an unseen isomorphic transfer, and mixed-pattern discrimination as separate
outcomes. A solved count is only a secondary descriptive metric.

## Legacy workflow and curriculum-engine boundary

The implemented workflow is a legacy evidence recorder: an Attempt creates all
13 StageAssessments and reviews follow a fixed sequence. The target curriculum
engine records exposure before a session, chooses a learning mode and smallest
diagnostic task, captures the first blocked skill, and schedules the next task
from valid evidence. Existing Attempts, StageAssessments, HintUsage,
ReviewSchedules, coaching, and analytics remain readable during an additive
migration; no legacy migration is rewritten or local data reset.

## MVP boundary

The MVP provides an end-to-end, local vertical slice for these eight problems:

- Daily Temperatures
- Valid Parentheses
- Two Sum
- Best Time to Buy and Sell Stock
- Binary Search
- Reverse Linked List
- Maximum Depth of Binary Tree
- Number of Islands

It includes the problem/pattern catalogue, a 13-stage attempt workspace,
stage-level self-assessment (0–2), progressive hints, multi-label failure
recording, review creation and queue, stage-centric dashboard aggregates,
rule-based coaching, H2 persistence, Flyway migrations, and JSON export/import.

It does not require complete NeetCode 150 content, all pattern cards, an
in-browser code runner, notifications outside an active application, a local
LLM, browser/desktop notifications, iCalendar export, or full analytics charts.
The model and import path must nevertheless permit those additions without
reframing learning as answer recall.

## Application style

Use Java 21, Spring Boot, Spring MVC, Thymeleaf, minimal HTMX or vanilla
JavaScript, Spring Data JPA, Flyway, and a file-backed H2 database. There is no
authentication, telemetry, required Node build, external AI API, or scraping.
The application must work offline except for user-initiated links to external
problem pages.

The server renders the initial pages. Small interactions—saving a stage answer,
revealing a hint, completing an attempt, and refreshing dashboard fragments—may
use HTMX. Controllers translate HTTP requests to application services; they do
not calculate scores, schedules, mastery, analytics, or coaching.

## Package-by-feature layout

```text
com.example.leetcodetrainer
  problem/
    domain/ repository/ service/ controller/ dto/
  pattern/
    domain/ repository/ service/ controller/ dto/
  attempt/
    domain/ repository/ service/ controller/ dto/
  assessment/
    domain/ service/ repository/
  hint/
    domain/ service/ repository/ controller/
  review/
    domain/ service/ repository/ controller/
  dashboard/
    service/ controller/ dto/
  analytics/
    service/ dto/
  coaching/
    domain/ service/
  planning/
    domain/ service/ repository/
  dataexchange/
    service/ controller/ dto/
  settings/
    domain/ service/ repository/ controller/
  shared/
    config/ validation/ time/ web/
```

Feature packages own their domain types and repositories. Cross-feature calls go
through services, not controllers or direct repository access where a business
rule is involved. `shared` contains only genuinely shared infrastructure and
small value types; it must not become a catch-all domain layer.

## Domain responsibilities

| Concept | Responsibility |
| --- | --- |
| Problem | Licensed/minimal catalogue metadata and the learner's own notes; never copied problem text or solutions. |
| Pattern | A reusable reasoning schema: triggers, state, events, operations, invariant, contrasts, and Java notes. |
| ProblemPattern | Relates a problem to one or more families and marks the primary teaching relationship. |
| Attempt | One bounded learning session, including mode, timing, implementation outcome, reflection, and contextual state. |
| StageAssessment | The learner's answer and independent/hint-assisted/not-understood evidence for exactly one cognitive stage in an attempt. |
| Hint / HintUsage | Authorable progressive prompts and the immutable record of what was revealed and whether it enabled progress. |
| FailureLabel | A reusable, granular bottleneck vocabulary; links to attempts rather than reducing failure to one status. |
| ReviewSchedule | A pending or completed learning obligation with review type and targeted stages, not merely a repeat-problem reminder. |
| WeeklyPlan | A learner-facing focus selected from observed weak stages or patterns. |
| CoachingMessage | Evidence-based feedback generated by a provider from an attempt and its history. |
| UserSettings | Local configuration, including date/time zone, review intervals, persistence location, and optional local-LLM flag. |

## Key application services

- `AttemptService`: starts, saves, completes, and validates workflow state.
- `StageAssessmentService`: saves responses and score evidence; preserves a
  stage's duration and maximum hint level.
- `HintService`: reveals only the next permitted hint level and creates
  `HintUsage` records.
- `ReviewSchedulingService`: creates the initial 1/4/7/21-day sequence and
  targeted remedial reviews.
- `ReviewQueueService`: determines due and overdue items from the local clock.
- `MetricsService`: computes stage, retention, transfer, and discrimination
  measures from completed assessments.
- `MasteryService`: produces an explicitly non-guaranteeing pattern status from
  configured evidence thresholds.
- `BottleneckService`: identifies a weak stage using score, hints, failures,
  and recency.
- `RuleBasedCoachProvider`: produces Observation, Bottleneck, Interpretation,
  Next Test, and Evidence without psychological diagnosis or generic praise.
- `ImportExportService`: validates and transports the user-owned data format.

`CoachProvider` is an interface so an opt-in local provider can later coexist
with `RuleBasedCoachProvider`; no networked provider is part of the default.

## Major screens

- Dashboard: due reviews, a concrete next exercise, stage metrics, transfer and
  discrimination metrics, and evidence-based bottlenecks.
- Problem library: filters and status, while the start flow can hide categories
  and patterns.
- Attempt workspace: staged responses, trace space, hint controls, timer, and
  later-visible pattern material.
- Review queue: review reason, target stages, review type, due date, and delay.
- Pattern library: explicit reusable schemas and contrast cases.
- Analytics and weekly review: stage-first history; solved count remains minor.
- Settings/data: local persistence, review policy, import/export, and deletion.

## Boundaries that preserve the learning model

1. Pattern/category metadata is available for authoring and post-attempt
   explanation, but hidden at initial attempt and cold/transfer prompts.
2. A pattern label cannot substitute for the Stage 1–10 evidence. Selecting
   `Stack` without operations and invariant evidence is not mastery.
3. Review type determines the task and metric. Same-problem reconstruction is
   retention; unseen isomorphic work is transfer; contrast/mixed work is
   discrimination.
4. Coaching describes observed stages and an actionable next test. It never
   infers global ability or medical status.
