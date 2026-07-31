# Curriculum Engine Redesign

## 0. Status and purpose

This document is the source of truth for redesigning LeetCode Thinking Trainer from a fixed 13-stage recorder into an adaptive curriculum engine.

It is based on the repository audit in:

```text
docs/redesign/current-state-audit.md
```

Before planning or changing code, read:

- `AGENTS.md`
- `docs/product-spec.md`
- `docs/redesign/current-state-audit.md`
- this document
- current architecture/data-model/decision documents
- all implemented Phase documents
- all Flyway migrations
- current production code and tests

Do not implement this entire redesign in one change. Preserve a runnable application and migratable database after every implementation phase.

This redesign does not require OpenAI API, an external LLM, LeetCode scraping, or automatic code execution.

---

# 1. Product goal

## 1.1 Final learning goal

Use NeetCode 150 as a structured curriculum so that the learner can increasingly solve previously unseen LeetCode Easy and Medium problems by independently performing the necessary reasoning, implementation, and verification steps.

The application must not claim that any finite curriculum guarantees solving every possible LeetCode problem. The measurable target is:

```text
Within patterns and prerequisites covered by the curriculum,
the learner can solve unseen or long-unseen problems with increasing reliability.

When a problem is not fully solved,
the learner can still construct a brute-force approach or identify the exact skill where progress stopped.
```

## 1.2 What mastery means

Mastery is not:

- having opened a problem
- marking it solved
- remembering the problem name and code
- completing all 150 once
- selecting a tag from a list

Mastery requires separate evidence for:

1. problem comprehension
2. brute-force construction
3. optimization derivation
4. implementation reliability
5. retention after delay
6. transfer to a different-looking problem
7. discrimination from similar patterns
8. timed cold performance

## 1.3 Core product loop

```text
Diagnose current state
→ locate the first blocked skill
→ choose the smallest useful learning mode
→ provide progressive assistance
→ collect evidence
→ update multi-axis mastery
→ schedule the next repair, retention, transfer, or evaluation task
```

---

# 2. Design principles

## 2.1 The 150 problems are curriculum material, not a checklist

Every problem must have one or more curriculum roles. Problems are selected because of what they teach or measure, not merely because they remain unsolved.

## 2.2 The fixed reasoning map remains, but it stops controlling every workflow

The existing 13-stage model remains useful as a common diagnostic coordinate system.

It must no longer mean:

```text
Every session creates and displays all 13 stages in order.
```

It must mean:

```text
Every piece of learning evidence can be located within a shared skill map.
Each learning mode selects only the skills needed for that session.
```

## 2.3 Prior exposure changes the meaning of success

A memorized problem solved without hints is evidence of reconstruction or retention, not unseen transfer.

The application must know exposure before the session begins.

## 2.4 Unknown and not measured are first-class states

Do not treat missing evidence as failure.

Do not convert one success into mastery without sufficient samples, distinct problems, delay, and assistance controls.

## 2.5 First blocked skill is more important than final solved status

The primary diagnostic output is:

```text
Where did independent progress first stop?
```

A session may be useful even if no optimal code was produced.

## 2.6 Assistance must be auditable

For every skill evidence item, record whether it was:

- independent
- completed after a low-level question
- completed after a stronger hint
- completed after a structural hint
- completed after a reference answer or solution

## 2.7 Transfer evidence must protect evaluation integrity

A problem cannot count as unseen transfer if its solution, pattern, reference answer, or equivalent implementation has already been revealed.

## 2.8 Implementation mistakes are trainable skills, not global ability judgments

Conceptual reasoning and implementation reliability must remain separate.

## 2.9 Deterministic local behavior first

The core curriculum engine, routing, scoring, and scheduling must work without external AI.

---

# 3. Target bounded contexts

Organize the redesigned application by the following responsibilities.

## 3.1 Catalogue

Owns stable problem and pattern metadata.

```text
problem
pattern
problem_pattern
pattern_prerequisite
```

## 3.2 Curriculum Content

Owns app-authored prompts, hints, concepts, examples, contrasts, tests, and role assignments.

```text
skill_definition
learning_mode_definition
mode_skill_requirement
problem_learning_content
pattern_learning_content
curriculum_item
curriculum_relation
```

## 3.3 Exposure

Owns what the learner has already seen.

```text
problem_exposure
content_exposure_event
```

## 3.4 Learning Session

Owns one bounded learning activity, its mode, and its ordered tasks.

```text
learning_session
session_skill_task
skill_evidence
assistance_event
```

## 3.5 Implementation Reliability

Owns implementation contracts, checks, manual tests, outcomes, and error fingerprints.

```text
implementation_record
implementation_contract
implementation_check_result
problem_test_case
implementation_test_result
implementation_error
error_mastery
```

## 3.6 Mastery

Owns derived or projected learning state.

```text
problem_mastery_projection
pattern_mastery_projection
skill_mastery_projection
```

Mastery projections must always retain links to supporting evidence.

## 3.7 Curriculum Scheduling

Owns the next learning tasks.

```text
learning_task
learning_task_dependency
```

This replaces fixed review generation as the primary scheduler.

## 3.8 Legacy Compatibility

Existing Attempts, StageAssessments, ReviewSchedules, scores, hints, reveals, and coaching messages remain readable during migration.

---

# 4. Skill framework

## 4.1 Do not expand the existing enum into a larger rigid workflow

Keep `StageType` for legacy compatibility and reporting.

Introduce a data-driven `SkillDefinition` model for the redesigned engine.

Recommended fields:

- `id`
- `code`
- `displayName`
- `skillGroup`
- `description`
- `defaultOrder`
- `active`
- `legacyStageType` nullable
- `createdAt`
- `updatedAt`

## 4.2 Initial skill groups

- `COMPREHENSION`
- `BRUTE_FORCE`
- `OPTIMIZATION`
- `CORRECTNESS`
- `IMPLEMENTATION`
- `VERIFICATION`
- `TRANSFER`
- `REFLECTION`

## 4.3 Initial skill codes

### Comprehension

- `PROBLEM_IO_MODEL`
- `CONSTRAINT_EXTRACTION`
- `RELATION_ABSTRACTION`
- `EXAMPLE_TRACE`

### Brute-force construction

- `CANDIDATE_DEFINITION`
- `CANDIDATE_ENUMERATION`
- `CANDIDATE_VALIDATION`
- `RESULT_AGGREGATION`
- `BRUTE_FORCE_COMPLETENESS`
- `BRUTE_FORCE_COMPLEXITY`

### Optimization derivation

- `REPEATED_WORK_IDENTIFICATION`
- `STATE_REPRESENTATION`
- `RESOLUTION_EVENT`
- `STATE_ACCESS_UPDATE`
- `REQUIRED_OPERATION_DERIVATION`
- `DATA_STRUCTURE_SELECTION`
- `INVARIANT_FORMULATION`

### Correctness

- `CORRECTNESS_ARGUMENT`
- `COMPLEXITY_ARGUMENT`

### Implementation

- `IMPLEMENTATION_CONTRACT`
- `ALGORITHM_TRANSLATION`
- `LANGUAGE_API_TRANSLATION`

### Verification and debugging

- `TEST_CASE_DESIGN`
- `EDGE_CASE_IDENTIFICATION`
- `FAILURE_LOCALIZATION`
- `ERROR_REPAIR`

### Generalization

- `ISOMORPHIC_TRANSFER`
- `PATTERN_DISCRIMINATION`
- `TIMED_EXECUTION`

### Reflection

- `TRIGGER_EXTRACTION`
- `NEXT_EXPERIMENT_SELECTION`

## 4.4 Legacy mapping

Map legacy stages without rewriting historical rows.

Examples:

```text
PROBLEM_RELATION
→ RELATION_ABSTRACTION

BRUTE_FORCE
→ CANDIDATE_DEFINITION
  CANDIDATE_ENUMERATION
  CANDIDATE_VALIDATION
  BRUTE_FORCE_COMPLEXITY

UNRESOLVED_STATE
→ STATE_REPRESENTATION

UPDATED_REGION
→ STATE_ACCESS_UPDATE

IMPLEMENTATION
→ IMPLEMENTATION_CONTRACT
  ALGORITHM_TRANSLATION
  TEST_CASE_DESIGN
  ERROR_REPAIR
```

Historical evidence can be displayed as coarse legacy evidence. Do not infer fine-grained subskill success from one legacy score.

---

# 5. Prior exposure and evaluation integrity

## 5.1 Record exposure before starting

Replace or extend `PriorExposure` with these learner-facing choices:

- `NEVER_SEEN`
- `TITLE_OR_STATEMENT_SEEN`
- `ATTEMPTED_WITHOUT_SOLUTION`
- `SOLUTION_SEEN_BUT_NOT_REMEMBERED`
- `SOLUTION_APPROACH_REMEMBERED`
- `CODE_SUBSTANTIALLY_REMEMBERED`

Store the start-time value on the session. Do not wait until completion.

## 5.2 ProblemExposure

Recommended fields:

- `id`
- `problemId`
- `firstSeenAt`
- `firstAttemptedAt`
- `patternRevealedAt`
- `firstHintAt`
- `referenceAnswerRevealedAt`
- `solutionSeenAt`
- `codeSeenAt`
- `firstSolvedAt`
- `lastAttemptAt`
- `consumedAsHoldoutAt`
- `currentExposureLevel`
- `updatedAt`

## 5.3 ContentExposureEvent

Record append-only events:

- `PROBLEM_OPENED`
- `PATTERN_REVEALED`
- `HINT_REVEALED`
- `REFERENCE_STAGE_REVEALED`
- `SOLUTION_REPORTED_SEEN`
- `CODE_REPORTED_SEEN`
- `HOLDOUT_ATTEMPT_STARTED`
- `HOLDOUT_CONSUMED`

## 5.4 Valid evidence rules

### Unseen transfer evidence

Requires:

- target problem is different from source problem
- target was not previously attempted
- target solution/code was not seen
- target pattern was not revealed before the learner committed to a candidate
- session mode is `ISOMORPHIC_TRANSFER` or `COLD_DIAGNOSTIC`

### Retention evidence

Requires:

- same problem or equivalent anchor
- minimum elapsed interval
- prior solution/reference answer hidden during attempt
- no strong hint before the measured skill

### Discrimination evidence

Requires:

- at least two plausible candidate patterns
- pattern labels hidden until commitment
- learner records both chosen pattern and rejection reason for alternatives

---

# 6. Learning modes

Introduce `LearningMode` as the primary session workflow selector.

## 6.1 Modes

- `COLD_DIAGNOSTIC`
- `COMPREHENSION_REPAIR`
- `BRUTE_FORCE_BUILDER`
- `OPTIMIZATION_DERIVATION`
- `GUIDED_RECONSTRUCTION`
- `RETENTION_RECONSTRUCTION`
- `IMPLEMENTATION_DIAGNOSTIC`
- `IMPLEMENTATION_REPAIR`
- `CLEAN_REIMPLEMENTATION`
- `ISOMORPHIC_TRANSFER`
- `PATTERN_DISCRIMINATION`
- `TIMED_COLD_SOLVE`
- `REFLECTION_ONLY`

## 6.2 Mode purpose

### COLD_DIAGNOSTIC

For unseen or long-unseen problems. Starts with no pattern reveal. Locates the first blocked skill.

### COMPREHENSION_REPAIR

For difficulty understanding input/output, relationships, constraints, or examples.

### BRUTE_FORCE_BUILDER

For learners who understand the problem but cannot construct an exhaustive correct solution.

### OPTIMIZATION_DERIVATION

For learners who can build brute force but cannot derive state, operations, invariant, or data structure.

### GUIDED_RECONSTRUCTION

For previously learned problems where the learner should reconstruct the derivation, not replay code.

### RETENTION_RECONSTRUCTION

For delayed same-problem recall with prior answers and code hidden.

### IMPLEMENTATION_DIAGNOSTIC

For checking whether an understood algorithm can be translated into code.

### IMPLEMENTATION_REPAIR

For one or more known implementation error fingerprints. It does not repeat the entire reasoning workflow.

### CLEAN_REIMPLEMENTATION

For delayed, code-hidden implementation reliability measurement.

### ISOMORPHIC_TRANSFER

For a different-looking problem sharing a learned structural pattern.

### PATTERN_DISCRIMINATION

For distinguishing plausible competing patterns and explaining decisive clues.

### TIMED_COLD_SOLVE

For interview-like measurement after sufficient learning evidence.

## 6.3 ModeSkillRequirement

Recommended fields:

- `learningMode`
- `skillDefinitionId`
- `requirement`: `REQUIRED`, `OPTIONAL`, `HIDDEN`, `NOT_APPLICABLE`
- `displayOrder`
- `stopOnFailure`
- `completionRequired`

This replaces the assumption that all modes use all 13 legacy stages.

---

# 7. Adaptive routing

## 7.1 Start questionnaire

Before a session starts, collect:

- prior exposure
- whether the approach is remembered
- whether code is remembered
- whether the current goal is learning, review, transfer, or timed practice
- optional time box

The curriculum engine should propose a mode. The learner may override it, but the suggested and selected mode must both be recorded.

## 7.2 Initial routing rules

```text
NEVER_SEEN
→ COLD_DIAGNOSTIC

TITLE_OR_STATEMENT_SEEN or ATTEMPTED_WITHOUT_SOLUTION
→ COLD_DIAGNOSTIC

SOLUTION_SEEN_BUT_NOT_REMEMBERED
→ GUIDED_RECONSTRUCTION

SOLUTION_APPROACH_REMEMBERED and implementation confidence low
→ IMPLEMENTATION_DIAGNOSTIC

SOLUTION_APPROACH_REMEMBERED and implementation stable
→ ISOMORPHIC_TRANSFER or PATTERN_DISCRIMINATION

CODE_SUBSTANTIALLY_REMEMBERED
→ never count same-problem success as transfer;
  prefer ISOMORPHIC_TRANSFER or PATTERN_DISCRIMINATION
```

## 7.3 During-session routing

A learner can explicitly choose:

- “I do not understand what the problem asks”
- “I understand it but cannot form brute force”
- “I have brute force but cannot improve it”
- “I know the approach but cannot implement it”
- “My code fails and I cannot localize why”

The engine then recommends the appropriate focused mode or session task.

## 7.4 FirstBlockedSkill

At session end, derive and store:

- first required skill not completed independently
- assistance level at that skill
- whether later skills were actually measured

Do not call later unmeasured skills failures.

---

# 8. Brute Force Builder

## 8.1 Purpose

Brute force must become a teachable construction process rather than one textarea.

## 8.2 Worksheet

Recommended fields/evidence prompts:

### Candidate definition

```text
What is one possible answer candidate?
```

Examples:

- a pair of indices
- one contiguous interval
- one subset
- one permutation
- one path
- one split point
- one sequence of decisions
- one starting cell/component

### Enumeration decisions

```text
What choices uniquely define one candidate?
How can every possible candidate be generated?
```

### Validation

```text
What condition makes a candidate valid?
How expensive is validation?
```

### Aggregation

```text
Return first valid candidate?
Count all valid candidates?
Minimize/maximize a value?
Build all results?
```

### Completeness

```text
Why does the enumeration include every possible answer?
```

### Complexity

```text
candidate count × validation cost
```

## 8.3 Enumeration shapes

Introduce an app-authored vocabulary:

- `PAIR`
- `K_TUPLE`
- `CONTIGUOUS_RANGE`
- `SUBSET`
- `PERMUTATION`
- `PARTITION_OR_SPLIT`
- `PATH`
- `DECISION_SEQUENCE`
- `GRID_START_OR_COMPONENT`
- `STATE_SPACE`
- `OTHER`

This vocabulary should guide, not force, the answer.

## 8.4 Progressive hints

Hints must move from questions to structure:

1. identify answer candidate
2. identify one choice dimension
3. identify all choice dimensions
4. provide enumeration skeleton
5. show complete brute-force structure

Do not reveal the optimized pattern during Brute Force Builder.

---

# 9. Curriculum roles and problem selection

## 9.1 CurriculumRole

A Problem may have different roles for different Patterns.

- `ANCHOR`
- `GUIDED_PRACTICE`
- `RECONSTRUCTION`
- `ISOMORPHIC_TRANSFER`
- `CONTRAST`
- `IMPLEMENTATION_DRILL`
- `TIMED_BENCHMARK`
- `HOLDOUT`

## 9.2 CurriculumItem

Recommended fields:

- `id`
- `problemId`
- `patternId`
- `role`
- `difficultyOrder`
- `curriculumOrder`
- `prerequisitePatternId` nullable
- `active`
- `notes`
- `createdAt`
- `updatedAt`

A problem may have multiple curriculum-item rows.

## 9.3 Pattern progression

Each Pattern curriculum should include:

1. one or two anchor problems
2. guided problems
3. reconstruction problems
4. at least two transfer candidates
5. at least two contrast relationships
6. implementation drills where relevant
7. protected timed or holdout evaluation items

## 9.4 Pattern prerequisites

Examples:

```text
Array traversal
→ Hash lookup

Stack basics
→ Stack matching
→ Monotonic stack

Tree traversal
→ Tree recursion contracts
→ Tree DP

Graph traversal
→ Topological sort / shortest path / union find

1-D DP basics
→ state transition families
→ 2-D DP
```

The exact graph should be authored and versioned, not inferred solely from NeetCode category order.

---

# 10. Holdout and transfer pools

## 10.1 Holdout rule

A HOLDOUT problem must not appear as a normal recommendation, reference-answer preview, Pattern page example, or contrast example before it is consumed.

## 10.2 Holdout lifecycle

- `AVAILABLE_UNSEEN`
- `RESERVED_FOR_SESSION`
- `CONSUMED`
- `RELEASED_TO_PRACTICE`

After the first evaluation attempt, the problem becomes normal practice content.

## 10.3 Transfer selection policy

Choose a target that:

- shares the intended structural Pattern
- differs in surface story or input representation
- is not previously exposed beyond allowed level
- is not the same problem
- has authored learning content or at least evaluation prompts
- has not been overused

## 10.4 Contrast relations

Introduce authored pair/group relations:

```text
source pattern
candidate pattern
shared clues
separating clue
example problem pair
```

Examples:

- Hash lookup vs Two Pointers
- Sliding Window vs Prefix Sum
- Monotonic Stack vs Heap
- BFS vs DFS
- Greedy vs DP
- Interval merge vs sweep line

---

# 11. Evidence model

## 11.1 SkillEvidence

Recommended fields:

- `id`
- `sessionId`
- `skillDefinitionId`
- `problemId`
- `patternId` nullable
- `status`
- `independenceLevel`
- `answer`
- `structuredPayload` nullable JSON/CLOB
- `startedAt`
- `completedAt`
- `durationSeconds`
- `firstAttemptCorrect` nullable
- `evaluatorNotes`
- `createdAt`
- `updatedAt`

### EvidenceStatus

- `NOT_STARTED`
- `IN_PROGRESS`
- `COMPLETED`
- `BLOCKED`
- `SKIPPED`
- `NOT_APPLICABLE`

### IndependenceLevel

- `INDEPENDENT`
- `QUESTION_PROMPT`
- `LIMITED_HINT`
- `STRUCTURAL_HINT`
- `REFERENCE_ANSWER`
- `SOLUTION_EXPOSURE`
- `NOT_MEASURED`

## 11.2 AssistanceEvent

Record every reveal or assistance step independently.

- mode/session
- skill
- level
- content ID/version
- timestamp
- whether it helped

## 11.3 Evidence validity

Every mastery calculation must filter evidence by:

- exposure level
- assistance level
- session mode
- distinct problem
- elapsed interval
- content reveal status
- timed or untimed condition

---

# 12. Multi-axis mastery

## 12.1 MasteryAxis

- `COMPREHENSION`
- `BRUTE_FORCE`
- `DERIVATION`
- `IMPLEMENTATION`
- `RETENTION`
- `TRANSFER`
- `DISCRIMINATION`
- `TIMED_PERFORMANCE`

## 12.2 MasteryLevel

- `NOT_MEASURED`
- `INTRODUCED`
- `ASSISTED`
- `INDEPENDENT_ONCE`
- `DEVELOPING`
- `RELIABLE`
- `STALE`
- `NEEDS_REPAIR`

## 12.3 Projection fields

For Problem, Pattern, and Skill projections:

- target ID
- axis
- level
- validEvidenceCount
- assistedEvidenceCount
- distinctProblemCount
- lastEvidenceAt
- lastIndependentAt
- nextDueAt
- confidenceReason
- projectionVersion
- updatedAt

## 12.4 Example mastery rules

Rules must be deterministic and separately tested.

### COMPREHENSION reliable

Suggested minimum:

- independent relation/model/trace evidence
- on at least two distinct problems for Pattern mastery
- no solution reveal before evidence

### BRUTE_FORCE reliable

Suggested minimum:

- candidate, enumeration, and validation constructed independently
- on at least two distinct enumeration shapes or problems where applicable

### DERIVATION developing

- independent repeated-work/state/operations chain once
- data structure selected from operations, not revealed tag

### IMPLEMENTATION reliable

- clean implementation on at least two different days
- first-pass basic and edge cases pass
- at least one variant problem
- no repeated high-severity error in the recent window

### RETENTION reliable

- independent reconstruction after at least seven days
- no reference answer or strong hint before measured skills

### TRANSFER reliable

- independent valid transfer on at least two previously unseen target problems
- targets are distinct from anchor problem

### DISCRIMINATION reliable

- correct classification and decisive-reason explanation across multiple contrast sets

### TIMED_PERFORMANCE reliable

- successful cold solve under authored time box on more than one problem
- do not require this before conceptual learning is stable

## 12.5 Avoid false precision

Always display sample counts and evidence reason.

Good:

```text
Transfer: Developing — 1 independent unseen target / 1 observed
```

Bad:

```text
Transfer mastery: 73%
```

unless the denominator and evidence definition are visible.

---

# 13. Curriculum task engine

## 13.1 LearningTask

Replace fixed review generation with a general task model.

Recommended fields:

- `id`
- `taskType`
- `learningMode`
- `targetProblemId` nullable
- `targetPatternId` nullable
- `targetSkillId` nullable
- `targetErrorType` nullable
- `sourceSessionId` nullable
- `scheduledDate`
- `priority`
- `status`
- `reasonCode`
- `reasonText`
- `notBefore`
- `expiresAt` nullable
- `completionSessionId` nullable
- `createdAt`
- `updatedAt`

### TaskType

- `LEARN_ANCHOR`
- `REPAIR_SKILL`
- `REPAIR_IMPLEMENTATION`
- `RETENTION_CHECK`
- `TRANSFER_CHECK`
- `DISCRIMINATION_CHECK`
- `TIMED_BENCHMARK`
- `REFLECTION_FOLLOWUP`

## 13.2 Daily queue policy

The default daily queue should contain a balanced set, not a raw problem count.

Conceptual slots:

```text
Learn
Repair
Transfer
Review
```

Do not require every slot every day. Prioritize in this order:

1. overdue high-value repair
2. due retention evidence
3. transfer/discrimination needed for Pattern mastery
4. new anchor learning when prerequisites allow
5. timed benchmark only when readiness criteria are met

## 13.3 Task generation examples

```text
First blocked skill = CANDIDATE_ENUMERATION
→ create BRUTE_FORCE_BUILDER repair task for next day

Known approach + implementation error
→ create IMPLEMENTATION_REPAIR next day
→ CLEAN_REIMPLEMENTATION after four days

Anchor reconstructed successfully
→ create unseen ISOMORPHIC_TRANSFER task

One transfer success but discrimination unmeasured
→ create PATTERN_DISCRIMINATION task
```

## 13.4 Do not automatically create every task type

Task generation must depend on evidence and readiness.

---

# 14. Implementation reliability redesign

## 14.1 Source of truth

`ImplementationRecord` becomes the sole active source for implementation outcomes.

Legacy implementation fields on `Attempt` remain readable during migration but are no longer written by the new workflow.

## 14.2 Required models

### ImplementationContract

- state meaning
- invariant
- branch cases
- state transition per branch
- guard conditions
- final condition
- required API operations

### ImplementationChecklistDefinition / Result

- generic checks
- problem-specific checks
- checked / not applicable / missed

### ProblemTestCase

- input description
- expected output
- purpose
- related error types
- basic/edge/contrast classification

### ImplementationTestResult

- passed / failed / runtime error / not run
- actual output
- notes

### ImplementationError

Retain the taxonomy but fix recurrence logic and complete missing fields.

## 14.3 Repair lifecycle

```text
Initial implementation
→ minimal failing case
→ error fingerprint
→ root cause
→ correction
→ prevention rule
→ next-day repair
→ delayed clean reimplementation
→ variant implementation
```

## 14.4 Reliability evidence

Keep separate:

- first-pass compile
- first-pass basic cases
- first-pass edge cases
- self-debug success
- hint-assisted correction
- solution-assisted correction
- clean delayed reimplementation
- repeated error occurrence

---

# 15. Learning content architecture

## 15.1 Remove MVP-size assumptions

Do not require exactly eight files or 104 answers.

Validate each document and expose coverage status.

## 15.2 Content structure

Recommended resources:

```text
learning-content/catalogue/neetcode-150.yml
learning-content/patterns/<pattern-code>.yml
learning-content/problems/<problem-slug>.yml
learning-content/contrasts/<contrast-code>.yml
learning-content/skills/<skill-code>.yml
```

## 15.3 Problem content schema

A problem document may include:

- problem slug
- content version
- Pattern associations
- curriculum roles
- skill applicability
- prompts
- progressive hints
- reference concepts
- small examples
- brute-force worksheet guidance
- implementation contract template
- minimal tests
- common error fingerprints
- transfer candidates
- contrast relations

Content may be incomplete. Coverage must be visible.

## 15.4 Separate concepts from one canonical sentence

Reference content should define:

- required concepts
- acceptable alternative representations
- common partial answers
- forbidden early reveals

Even without AI scoring, this supports better manual comparison and future rule-based checks.

## 15.5 NeetCode 150 import

Implement a reviewed metadata-only seed for all 150 problems.

Requirements:

- no problem statement scraping
- no editorial or copied solution text
- exact category/difficulty counts validated
- idempotent import
- stable IDs/slugs
- content coverage independent of metadata coverage

---

# 16. User experience redesign

## 16.1 Home page

Primary content:

- today’s recommended task
- due repair
- due retention
- transfer/discrimination task
- current Pattern mastery gaps
- unseen cold-performance evidence

Do not lead with solved count.

## 16.2 Problem library

Replace the binary “solved” emphasis with:

- exposure level
- curriculum role
- latest session mode/result
- Problem mastery axes
- next recommended action
- due task

Keep legacy solved marker only in a secondary compatibility area until removed.

## 16.3 Session start page

Before creating a session:

1. ask prior exposure
2. ask what is remembered
3. show recommended mode and reason
4. allow mode override
5. state what this session will and will not measure

## 16.4 Adaptive workspace

Show one current skill task prominently.

Provide:

- purpose
- prompt
- optional structured fields
- “blocked here” action
- progressive hint
- save evidence
- move to next applicable task
- full skill map in a secondary expandable view

Do not present all 13 stages as equal mandatory tabs.

## 16.5 Post-session page

Answer five questions:

1. What was demonstrated?
2. What was assisted?
3. Where did independent progress first stop?
4. What remains unmeasured?
5. What specific task comes next and why?

## 16.6 Pattern page

Show:

- structural schema
- trigger clues
- anti-clues
- brute-force archetype
- state and operations
- contrasts
- curriculum items by role
- mastery by axis
- transfer and discrimination evidence

Do not reveal HOLDOUT problems before use.

## 16.7 Dashboard

Primary sections:

### Curriculum coverage

- metadata loaded
- anchor introduced
- independent reconstruction
- transfer measured
- discrimination measured
- timed measured

### Skill bottlenecks

- first-blocked skill frequencies
- assistance dependence
- distinct-problem evidence

### Pattern mastery matrix

Rows: Pattern. Columns: mastery axes.

### Implementation reliability

- first-pass rates
- self-debug rate
- recurring Error Types
- clean reimplementation evidence

### Unseen performance

- Easy/Medium unseen attempts
- independent success
- median first blocked skill
- time to brute force
- time to working implementation

Every metric must display sample size.

---

# 17. Migration strategy

## 17.1 Do not wipe the user database by default

Although the product can be extensively redesigned, preserve existing learning history unless the user explicitly chooses a reset.

## 17.2 Additive migration first

Create new curriculum, exposure, session-task, evidence, mastery, and learning-task tables alongside legacy tables.

## 17.3 Legacy evidence import

Create a one-time idempotent projection process:

- legacy Attempt → legacy-linked LearningSession
- StageAssessment → coarse SkillEvidence using legacy mapping
- HintUsage and reference reveals → AssistanceEvent
- ReviewSchedule → legacy LearningTask where possible
- Attempt implementation fields → legacy ImplementationRecord only when unambiguous

Do not infer fine-grained skills not present in historical data.

## 17.4 Preserve IDs and links

Keep links from new projections to legacy Attempt/StageAssessment IDs for traceability.

## 17.5 Read-only legacy UI period

During transition:

- new sessions use the new engine
- old Attempt detail remains accessible
- dashboard can initially show separate “legacy evidence” and “new evidence” counts

## 17.6 Remove only after parity

Do not delete legacy tables or controllers until:

- new session flow is stable
- history is readable
- analytics use new evidence
- export/import covers new and legacy data
- migration tests pass

---

# 18. Required code-quality corrections during redesign

- update `README.md` to current reality
- split compressed one-line Java classes into maintainable formatting
- add command/DTO objects instead of very long controller parameter lists
- validate domain-state transitions
- add cascade/delete policies explicitly
- fix ImplementationError recurrence logic
- eliminate duplicate active implementation state
- filter normal-start resume by session/mode, not only problem/status
- replace hardcoded 8/13 content validation
- add tests for post-attempt summary and implementation reliability
- keep business logic out of controllers

---

# 19. Implementation phase plan

Use redesign phase names rather than conflicting numeric Phase 9–11 names.

## R0 — Documentation and safety baseline

Deliverables:

- copy this redesign and audit into `docs/redesign/`
- update README/current architecture documentation
- create a database backup/export instruction
- document legacy/new boundaries
- add characterization tests for current behavior
- no major behavior change

## R1 — Curriculum foundation

Deliverables:

- SkillDefinition
- LearningMode
- ModeSkillRequirement
- CurriculumRole / CurriculumItem
- ProblemExposure and ContentExposureEvent
- LearningSession shell linked to legacy Attempt where needed
- Flyway migrations
- admin/read-only coverage pages

No adaptive workspace replacement yet.

## R2 — NeetCode 150 metadata and curriculum graph

Deliverables:

- metadata-only 150 seed
- exact-count validation
- richer Pattern catalogue and prerequisites
- initial role assignments
- coverage reporting
- no requirement for all 150 full learning-content documents

## R3 — Adaptive session and diagnostic workflow

Deliverables:

- start questionnaire
- mode recommendation
- session skill-task generation
- first-blocked-skill capture
- adaptive workspace vertical slice
- modes: COLD_DIAGNOSTIC, GUIDED_RECONSTRUCTION, IMPLEMENTATION_DIAGNOSTIC
- migrate one or two anchor problems first

## R4 — Brute Force Builder

Deliverables:

- structured brute-force worksheet
- enumeration shapes
- progressive hints
- routing from diagnostic to brute-force repair
- Two Sum plus at least two structurally different vertical slices

## R5 — Mastery projection and curriculum task engine

Deliverables:

- multi-axis Problem/Pattern/Skill mastery
- evidence validity rules
- general LearningTask model
- evidence-driven daily queue
- retention and repair scheduling
- sample-size-aware projections

## R6 — Transfer, holdout, and discrimination

Deliverables:

- holdout lifecycle
- unseen integrity checks
- transfer target selector
- contrast relations
- Pattern discrimination mode
- transfer/discrimination analytics

## R7 — Complete implementation reliability

Deliverables:

- remove duplicate active Attempt implementation state
- persisted Implementation Contract
- checklist and manual test matrix
- fixed Error Fingerprint recurrence
- repair and clean-reimplementation tasks
- RuleBasedCoach integration
- reliability mastery axis

## R8 — Dashboard and planner replacement

Deliverables:

- curriculum coverage dashboard
- Pattern mastery matrix
- unseen-performance dashboard
- implementation reliability dashboard
- replace WeeklyPlan lowest-stage recommendation with task engine
- retire binary solved emphasis

## R9 — Data portability and legacy retirement

Deliverables:

- versioned export/import
- round-trip tests
- optional user-controlled legacy cleanup
- remove legacy write paths only after parity

---

# 20. Vertical-slice order

Do not start by authoring all 150 problem documents.

Recommended vertical slices:

## Slice A: Two Sum

Validate:

- prior exposure
- memorized vs unseen interpretation
- brute-force builder
- state/key operations
- reconstruction versus transfer

## Slice B: Valid Parentheses

Validate:

- conceptual reasoning versus implementation reliability
- implementation contract
- test matrix
- error repair

## Slice C: Binary Search

Validate:

- search-range state
- loop boundary implementation errors
- contrast with linear scan / rotated variants

## Slice D: Daily Temperatures

Validate:

- suffix resolution
- monotonic invariant
- transfer and contrast against heap/next-greater variants

## Slice E: Number of Islands

Validate:

- brute-force candidate and traversal
- graph state
- visited timing
- transfer to connected-component variants

Only after the engine works across these different structures should content expansion accelerate.

---

# 21. Acceptance criteria for the redesign

The redesign is successful when all of the following are possible.

## 21.1 Different starting states produce different workflows

- completely unseen and no brute force
- seen but forgotten
- approach remembered but implementation unstable
- memorized problem needing transfer validation

must not all receive the same 13-stage session.

## 21.2 Brute force is teachable

A learner who cannot construct brute force can work through candidate, enumeration, validation, and complexity separately.

## 21.3 Same-problem recall is not counted as transfer

Prior exposure and reveal history prevent inflated transfer metrics.

## 21.4 Mastery is multi-axis

The application can represent:

```text
Valid Parentheses
Reasoning: reliable
Implementation: needs repair
Retention: developing
Transfer: not measured
```

## 21.5 Holdout evidence is protected

Previously unseen evaluation problems are hidden until assigned and consumed after use.

## 21.6 The next task follows from evidence

The application can explain:

```text
Your first blocked skill was candidate enumeration.
Tomorrow's task is a short Brute Force Builder exercise,
not another full solution replay.
```

## 21.7 Existing data remains accessible

Historical Attempts and scores are visible and are not silently reinterpreted as fine-grained new mastery.

## 21.8 The application remains local and free to run

No external AI/API is required.

---

# 22. Codex execution rules

When this document is given to Codex:

1. Read the repository and audit before proposing code.
2. Do not implement R0–R9 in one change.
3. First update design documentation and create detailed phase files for R0–R9.
4. Each phase file must include scope, non-scope, migration, tests, compatibility, and acceptance criteria.
5. Keep the application runnable after each phase.
6. Preserve existing H2 data by additive Flyway migration.
7. Do not silently delete current Attempts, StageAssessments, hints, reveals, or reviews.
8. Do not add OpenAI API or external LLM dependencies.
9. Do not scrape LeetCode or NeetCode.
10. Do not hardcode all learning logic in controllers or Thymeleaf templates.
11. Use deterministic services with unit tests for routing, mastery, and task scheduling.
12. Before coding a phase, report the files and schema expected to change.
13. After coding, run all tests and report exact results.

The first Codex run should complete R0 documentation/planning only unless explicitly instructed to implement R1.
