# LeetCode Thinking Trainer — Current-State Audit

## 1. Audit scope

This audit is based on the uploaded repository and local H2 database.

Reviewed material:

- `AGENTS.md`
- `README.md`
- `pom.xml`
- `docs/product-spec.md`
- `docs/architecture.md`
- `docs/data-model.md`
- `docs/implementation-plan.md`
- `docs/decisions.md`
- `docs/phases/phase2.md` through `phase11.md`
- all production Java source
- all Thymeleaf templates
- all Flyway migrations through `V22`
- all test source and existing Surefire reports
- metadata and aggregate counts from the uploaded H2 database

No OpenAI API or external LLM implementation was found in the application source.

## 2. Verification status

The packaged application JAR starts successfully against a copy of the uploaded H2 database, and `/status` returned HTTP 200.

The existing `target/surefire-reports` show:

```text
Tests: 54
Failures: 0
Errors: 0
Skipped: 0
```

I could not rerun `./mvnw test` in the review environment because the Maven Wrapper attempted to download Maven 3.9.8 and outbound network access was unavailable. This is an environment limitation, not evidence of a project test failure.

Important limitation: the existing test suite does not contain dedicated tests for the Phase 10 post-attempt summary or the Phase 11 implementation-reliability feature.

## 3. Current implementation inventory

### 3.1 Catalogue

Current seeded catalogue:

```text
Problems: 8
Patterns: 8
Reference-answer documents: 8
Reference answers: 8 × 13 = 104
```

The eight problems are useful vertical slices, but NeetCode 150 expansion has not been implemented.

### 3.2 Uploaded local data

Aggregate counts in the uploaded H2 database:

```text
Attempts: 24
Completed initial attempts: 6
Completed same-problem reviews: 1
In-progress attempts: 15
Abandoned attempts: 2
Review schedules: 24
Implementation records: 0
Implementation errors: 0
```

The large number of in-progress attempts relative to eight problems suggests that session lifecycle and resume behavior should be made more explicit during the redesign.

### 3.3 Current feature set

Implemented:

- local Spring Boot / MVC / Thymeleaf application
- H2 file database and Flyway
- Problem and Pattern catalogue
- fixed 13-stage Attempt workflow
- stage self-assessment with 0–2 scores
- progressive hints and hint-use history
- stage reference answers and reveal history
- prior-exposure field
- Attempt types for reconstruction, transfer, classification, cold solve, and implementation-only work
- 1/4/7/21-style review scheduling
- failure labels and rule-based bottleneck analysis
- rule-based coaching
- weekly focus recommendation
- post-attempt learning summary
- initial implementation-error taxonomy and recording form
- analytics based on stage scores, hints, review type, and final result

Not implemented or not complete:

- NeetCode 150 catalogue
- curriculum roles such as anchor, guided, transfer, contrast, benchmark, and holdout
- adaptive learning-mode selection
- a dedicated brute-force-construction curriculum
- protected unseen/holdout evaluation
- multi-axis mastery at Problem and Pattern level
- a curriculum task queue driven by evidence
- complete implementation-contract, checklist, minimal-test, repair, and reliability workflow
- import/export despite being described in architecture documents
- Phase 11 analytics, repair scheduling, and tests

## 4. What is strong and should be preserved

### 4.1 Product intent is unusually clear

`AGENTS.md` and `docs/product-spec.md` correctly state that the application is not a solved-problem tracker. The core goal—measuring the reasoning path from problem relation to transfer—is sound and should remain the source of truth.

### 4.2 The local architecture is appropriate

The current technical stack is well matched to the product:

- Java 21
- Spring Boot
- Spring MVC
- Thymeleaf
- Spring Data JPA
- H2
- Flyway
- no required Node.js
- no telemetry
- no external API requirement

There is no reason to replace this stack for the redesign.

### 4.3 Flyway and package-by-feature provide a good migration base

The application is already divided into catalogue, attempt, hint, review, failure, coaching, analytics, planning, reference-answer, and implementation features. New curriculum components can be introduced additively without discarding all existing code or data.

### 4.4 The 13-stage map is useful as a diagnostic coordinate system

The generalized stage wording from `phase8-patch.md` is a real improvement. In particular:

- `UNRESOLVED_STATE` is displayed as “保持する状態・未確定の候補”
- `UPDATED_REGION` is displayed as “状態の参照・更新対象”
- Two Sum supports `MATCHING_KEY`
- Required Operations include key lookup, value retrieval, and insertion

These stages should remain available as evidence categories, even though they should no longer be a mandatory linear form for every session.

### 4.5 Unassessed is separated from score zero

Phase 10 introduced `StageAssessmentStatus`, nullable scores, data-quality checks, and a post-attempt summary that does not automatically interpret missing data as failure. This is important and should be preserved.

### 4.6 Hint and answer-reveal history is valuable evidence

The application records:

- progressive hint level
- whether a hint helped
- reference-answer reveal
- score restrictions after an answer reveal

This is useful for determining whether evidence is independent, assisted, or answer-supported.

### 4.7 Prior exposure and review intent have started to be separated

`PriorExposure`, `AttemptType`, and `ReviewType` already acknowledge that these are different activities:

- solving an unseen problem
- reconstructing a known problem
- transferring to another problem
- classifying similar patterns
- cold solving

The redesign should build on this distinction rather than remove it.

### 4.8 The implementation-error vocabulary is useful raw material

The Phase 11 `ImplementationErrorType` enum distinguishes API mistakes, control-flow mistakes, boundary mistakes, mutation order, invariant violations, and debugging failures. That taxonomy can become a reusable error-fingerprint system after the incomplete implementation is replaced.

## 5. Core architectural mismatch

The current application is a **fixed workflow recorder**. The desired application is an **adaptive curriculum engine**.

Current dominant model:

```text
Select a problem
→ create all 13 stages
→ fill as many as possible
→ complete Attempt
→ automatically schedule four review types
→ aggregate self-reported scores
```

Required model:

```text
Identify prior exposure and current capability
→ run the smallest useful diagnostic
→ locate the first blocked skill
→ choose a learning mode
→ assign a targeted task
→ collect independent/assisted evidence
→ update Problem, Pattern, and Skill mastery separately
→ schedule retention, transfer, discrimination, or implementation repair
```

This is why adding more fields to the existing 13-stage page will not be sufficient.

## 6. Critical findings

### 6.1 Prior exposure is collected too late

`PriorExposure` is submitted when the Attempt is completed. The application therefore cannot adapt the session before the user starts.

The distinction between:

- unseen
- seen only
- previously understood but forgotten
- solution remembered
- code memorized

must be recorded before the session and must influence the session mode.

### 6.2 Every Attempt creates all 13 stage records

`AttemptService.start(...)` creates one `StageAssessment` for every `StageType`.

This makes all sessions structurally identical even when the user needs only:

- problem-comprehension repair
- brute-force construction
- implementation repair
- transfer validation
- pattern discrimination

The current design encourages unnecessary form completion and hides the first true stopping point.

### 6.3 `StageType` is both taxonomy and workflow

`StageType` currently defines:

- identity
- order
- display text
- objective
- primary question
- helper questions
- navigation order
- database enum value

This makes the learning sequence rigid. A stage taxonomy can remain stable, but session workflow must become data-driven and mode-specific.

### 6.4 Brute force is too coarse

The current `BRUTE_FORCE` stage is a free-text answer with complexity and trace fields. It does not teach how to construct brute force when the user has no starting point.

The missing subskills are:

1. identify the candidate answer object
2. identify the choices that define one candidate
3. enumerate all candidates
4. define candidate validity
5. aggregate or return a valid candidate
6. prove enumeration completeness
7. derive candidate count and validation cost

Without this, “write a brute-force solution” remains an instruction rather than a teachable process.

### 6.5 Review scheduling is fixed rather than evidence-driven

`ReviewSchedulingService` creates reconstruction, isomorphic transfer, contrast classification, and cold solve reviews after every initial Attempt.

It does this regardless of:

- prior exposure
- whether the problem was solved
- the first blocked stage
- whether implementation failed
- whether there is another suitable problem
- whether transfer should be tested yet

The scheduler should generate tasks from mastery gaps and evidence, not from one universal sequence.

### 6.6 Transfer cannot currently be measured reliably

There is only one seeded problem for each of the eight patterns. Consequently, `selectIsomorphicCandidate(...)` generally cannot assign another problem for transfer.

More importantly, the application does not protect unseen evaluation integrity. A problem can be counted as transfer even if the learner has already seen its solution or pattern association.

### 6.7 There is no holdout model

The application does not track whether a problem is:

- never exposed
- problem title seen
- attempted
- pattern revealed
- hint used
- reference answer revealed
- solution/code seen
- consumed as an unseen evaluation item

Without this history, “initially unseen transfer” cannot be distinguished from recall.

### 6.8 Mastery is not implemented as a real model

`MasteryStatus` exists but is unused.

Current analytics calculate rates from Attempt types and stage scores, but there is no persistent or derived mastery state for:

- a Problem
- a Pattern
- a reasoning Skill
- an implementation Error Type

There is also no multi-axis state. A learner can understand a pattern but have unstable implementation; the current model cannot represent that cleanly.

### 6.9 The `solved` boolean conflicts with the product goal

`Problem.solved` and the “解いた” button reduce a multi-dimensional learning state to a binary marker. This can remain temporarily for legacy display but should not be part of the redesigned learning model.

### 6.10 Pattern content is useful but too coarse

The application currently has eight Pattern records and one primary pattern per seeded problem. NeetCode 150 requires a richer pattern graph, including subpatterns and discriminating conditions.

For example, “Stack” is not one skill:

- stack matching
- monotonic increasing stack
- monotonic decreasing stack
- expression/evaluation stack
- simulation stack

Likewise, “Trees” and “Graphs” require multiple reusable schemas.

### 6.11 Reference-answer import is hardcoded to the MVP

`ReferenceAnswerValidator` requires exactly:

```text
8 files
13 stages per file
104 total answers
```

This blocks incremental expansion to 150 problems and prevents mode-specific or partially authored content.

The content loader should validate each document independently and report coverage, not require the entire repository to equal the original MVP size.

### 6.12 Stage applicability is not applied to the Attempt workflow

`StageApplicability` exists only on reference answers. It does not determine which assessments are created or shown for a particular learning mode.

A transfer session, implementation-repair session, and comprehension-repair session should have different required evidence.

### 6.13 Implementation data has two competing sources

Implementation information is stored both on `Attempt` and in `ImplementationRecord`:

- compile errors
- wrong answers
- completion flags
- edge-case failure
- status and reliability fields

This can diverge. The redesign should make `ImplementationRecord` the source of truth and retain legacy Attempt fields only for migration/read-only compatibility.

### 6.14 Phase 11 is only a partial vertical slice

The current Phase 11 code adds:

- `implementation_records`
- `implementation_errors`
- a recording form
- error enums

But it does not implement most of the Phase 11 specification:

- no persisted Implementation Contract
- no checklist model
- no minimal test-case model
- no test-result model
- no implementation-repair review types
- no reliability dashboard metrics
- no error-fingerprint page
- no clean-reimplementation tracking
- no RuleBasedCoach integration with implementation errors
- no dedicated Phase 11 tests

It should be treated as an experimental scaffold, not a completed subsystem.

### 6.15 Phase 11 contains correctness issues

`ImplementationReliabilityService.addError(...)` tries to detect recurrence by comparing an `ImplementationError` ID with an `ImplementationRecord` ID. Those IDs are different entity types, so the filter does not exclude errors from the current record.

Other gaps:

- recurrence has no time window or same-record exclusion
- `usedExternalSolution` is never updated by the save method
- error description is present on the entity but not populated by the constructor/controller
- no validation prevents contradictory status/boolean combinations
- migration V22 does not define cascade behavior for Attempt deletion
- many fields required by the Phase 11 document are absent

### 6.16 Current analytics mainly measure self-report

Current metrics are useful summaries, but they do not establish mastery because they lack:

- distinct-problem requirements
- exposure integrity
- holdout status
- minimum elapsed review interval
- variant requirements
- first-pass implementation evidence
- recency/confidence
- sample thresholds per Pattern

### 6.17 The weekly planner chooses a low stage rate, not a curriculum task

`WeeklyPlanService` recommends the stage with the lowest independent percentage once enough data exists. It does not consider:

- whether the stage is relevant to the current Pattern
- whether the problem is known or unseen
- whether the learner needs repair, retention, transfer, or discrimination
- whether the sample consists of distinct problems

This should be replaced by a task-selection policy.

### 6.18 The current database indicates session lifecycle friction

The uploaded DB contains 15 in-progress Attempts for only eight problems. The redesign should provide:

- an explicit session inbox
- resume/archive/discard controls
- one active session rule or clear parallel-session handling
- no accidental creation of redundant sessions

`startOrResumeInitial(...)` also searches for any in-progress Attempt for the problem without filtering by Attempt type, which can resume a review session from the normal problem start action.

### 6.19 Documentation is out of sync

`README.md` still describes Phase 1 as current scope, while the repository contains Phase 11 work. Architecture and implementation-plan documents describe import/export and later functionality that is not present.

The redesign must update documentation before or alongside code changes.

## 7. Recommended preservation and replacement boundaries

### Preserve and evolve

- Java/Spring/Thymeleaf/H2/Flyway stack
- `Problem`, `Pattern`, and `ProblemPattern` catalogue data
- existing eight problem IDs and slugs
- hint/reveal audit history
- stage answers and scores as legacy evidence
- prior Attempt history
- generalized state-stage wording
- rule-based, deterministic behavior
- implementation-error vocabulary after cleanup

### Keep as legacy/read-only during migration

- existing `Attempt`
- existing `StageAssessment`
- existing `ReviewSchedule`
- existing analytics pages
- existing coaching messages
- `Problem.solved`

### Replace as the active orchestration model

- fixed “all 13 stages for every Attempt” workflow
- fixed four-review sequence
- single solved flag
- single-stage weekly plan
- `MasteryStatus` enum
- hardcoded eight-file content validator
- duplicate implementation fields on Attempt

## 8. Redesign conclusion

The current application is not a failed implementation. It is a useful evidence-recording prototype that proved several important concepts:

- stage-based reasoning records
- progressive assistance
- answer-reveal integrity
- unassessed versus failed
- reconstruction versus transfer intent
- implementation-error classification

However, it should not be expanded to 150 problems by simply adding 142 more records and 1,846 more stage answers. That would produce a larger fixed form, not a system that teaches unseen problem solving.

The next architecture must introduce a curriculum layer above the existing evidence layer:

```text
Catalogue
+ authored learning content
+ learner exposure history
+ adaptive learning sessions
+ skill evidence
+ multi-axis mastery
+ evidence-driven task scheduling
+ holdout evaluation
```

The accompanying `curriculum-engine-redesign.md` defines that target.
