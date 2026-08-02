# Codex Final Instruction: Complete R2A, then R2B, then R2C

## Current state

The previous report ended with these incomplete items:

- Task Workspace is not fully profile-driven
- REQUIRED / OPTIONAL / NOT_APPLICABLE are not fully enforced in display, scoring, and analytics
- Four-line Contract UI and save route are incomplete
- Resume, completed read-only view, retry, and previousAttemptId are incomplete
- Post-Attempt card state display and next-task switching are incomplete
- R2A Unit / Integration / MVC tests are incomplete
- Full tests have not been run

Do not treat R2A as complete until every item above is implemented and tested.

---

## Overall order

Complete the work in this exact order:

1. Finish R2A completely
2. Run all R2A tests and the full existing test suite
3. Only after R2A passes, implement R2B
4. Run R2B tests and the full existing test suite
5. Only after R2B passes, implement R2C
6. Run the entire test suite and verify the main browser flows
7. Report any remaining requirements honestly

Do not stop after analysis or planning. Implement the code, migrations, routes, templates, services, and tests.

Do not add OpenAI API, external LLM calls, semantic grading, unrelated catalogue expansion, or unrelated redesign.

---

# Phase 1: Finish R2A

## A. Fully profile-driven Workspace

Replace fixed 13-stage navigation with navigation generated from the active Reasoning Profile and ProfileStageDefinition.

Rules:

- REQUIRED
  - show in the main workflow
  - include in progress and completion validation
  - eligible for scoring, bottleneck analysis, and analytics

- OPTIONAL
  - show in an expandable optional section
  - exclude from the main progress denominator
  - do not require for completion

- NOT_APPLICABLE
  - hide from the normal workflow
  - do not create an assessment automatically
  - exclude from scoring, bottleneck analysis, FailureLabel generation, and analytics

Remove fixed-13-stage assumptions from:

- progress indicator
- previous / next navigation
- completion validation
- Quick Assessment
- StageAssessment creation
- Post-Attempt stage map
- completion percentage
- bottleneck analysis
- FailureLabel generation
- analytics denominator

Keep canonical CognitiveStage values for compatibility.

Do not hard-code by problem slug. Use ReasoningProfileType, ProfileStageDefinition, CheckpointType, or LearningTaskTemplate.

---

## B. Four-line Contract UI

Implement a reusable RECURSIVE_CONTRACT checkpoint UI.

It must not be Maximum-Depth-specific.

Show four separate fields:

1. What this function returns
2. Smallest input and answer
3. Smaller problems of the same shape
4. How child results are combined

Persist all four separately.

Required:

- draft save
- partial save
- empty completion rejected
- self-assessment stored
- assistance source stored
- read-only display after completion
- reusable by Maximum Depth, Count Nodes, Minimum Depth, and future recursive tasks
- no exact-string automatic grading

---

## C. Learning Task lifecycle

Implement and persist:

- NOT_STARTED
- IN_PROGRESS
- COMPLETED
- ABANDONED

Persist at minimum:

- taskAttemptId
- templateId
- sourceAttemptId
- status
- startedAt
- lastUpdatedAt
- completedAt
- currentCheckpoint
- answers
- outcomes
- assistance sources
- previousAttemptId

Rules:

- starting creates one IN_PROGRESS attempt
- starting again reuses the same matching IN_PROGRESS attempt
- do not create duplicate IN_PROGRESS attempts
- resume from the saved checkpoint
- completed tasks are read-only
- duplicate completion is idempotent
- retry creates a new attempt
- retry stores previousAttemptId
- retry does not overwrite or prefill the completed record

---

## D. Post-Attempt task card states

Not started:

```text
[Start this task]
```

In progress:

```text
In progress
[Resume]
```

Completed:

```text
Completed
[View result]
[Try again]
```

The card must show:

- task title
- task type
- target micro-skill
- why it was selected
- success criteria
- appropriate action button

After completion, switch the primary card to the next concrete task when available. Do not keep presenting the completed task as unstarted.

---

## E. R2A tests

Add and run:

### Unit

- REQUIRED in main navigation
- OPTIONAL excluded from main progress
- NOT_APPLICABLE excluded from assessment and analytics
- profile display order
- previous / next navigation
- completion validation
- Four-line Contract draft/partial/complete behavior
- task start/reuse/complete/idempotency/read-only/retry/previousAttemptId
- Post-Attempt card state rendering

### Integration

- profile-driven Workspace
- Four-line Contract persistence
- task lifecycle
- resume
- complete
- read-only
- retry
- next-task switching
- legacy Attempt loading
- migration
- generic fallback when profile is missing

### MVC

- profile-specific Workspace
- optional section
- NOT_APPLICABLE hidden
- Four-line Contract form
- validation errors
- draft save
- task start/resume/complete/result/retry
- Post-Attempt card for every state
- invalid task and missing attempt handling
- duplicate submit handling

### Regression

Confirm no regression in:

- Two Sum
- Daily Temperatures
- Phase 8 labels
- Post-Attempt summary
- HintUsage
- FailureLabel
- PriorExposure
- Analytics
- active duration
- legacy scores
- Flyway migration

Run:

```bash
./mvnw test
```

Do not continue to R2B until R2A is complete and all tests pass.

---

# Phase 2: R2B

After R2A passes, implement:

## A. Error Repair diagnosis persistence

Persist:

- source task attempt
- source problem
- erroneous code reference
- primary failure signature
- up to two secondary signatures
- demonstrated micro-skills
- unresolved micro-skills
- learner explanation
- completion timestamp

Rules:

- primary maximum one
- secondary maximum two
- unassessed and NOT_APPLICABLE stages must not generate diagnoses
- reusable across problems, not Maximum-Depth-specific

## B. MasteryState projection

Implement:

- EXPOSED
- RECONSTRUCTED
- MICRO_SKILL_DEMONSTRATED
- TRANSFERRED
- DISCRIMINATED
- RETAINED

Rules:

- Accepted history alone never means RETAINED
- known reconstruction may produce RECONSTRUCTED
- micro-skill success may produce MICRO_SKILL_DEMONSTRATED
- transfer task success may produce TRANSFERRED
- contrast task success may produce DISCRIMINATED
- delayed cold success may produce RETAINED
- preserve historical evidence
- support projection by problem, profile, and micro-skill

## C. ReviewSchedule and LearningTaskType

Persist:

- learningTaskType
- targetMicroSkill
- sourceProblem
- templateId
- dueDate
- status

Rules:

- avoid repeatedly scheduling the same problem
- prefer transfer, discrimination, and delayed retention
- prevent duplicate active schedules
- task completion creates or updates the next schedule

Add Unit, Integration, and MVC tests. Run the full test suite before R2C.

---

# Phase 3: R2C

Complete all remaining MVC, integration, regression, migration, lifecycle, profile-navigation, mastery, ReviewSchedule, and legacy-compatibility tests.

Verify these end-to-end flows:

## Two Sum

```text
Known reconstruction
→ relation bottleneck
→ concrete Relation Drill card
→ start
→ save
→ resume
→ complete
→ next isomorphic task
→ mastery and schedule updated
```

## Recursive task

```text
Recursive profile
→ Four-line Contract
→ Error Repair
→ diagnosis saved
→ completed result read-only
→ retry creates a new attempt
→ next transfer task selected
→ mastery and schedule updated
```

## Legacy

```text
existing Attempt loads
→ migration succeeds
→ missing profile uses safe fallback
→ ambiguous legacy values do not create false failures
```

Run:

```bash
./mvnw test
```

Also run the application when practical:

```bash
./mvnw spring-boot:run
```

Manually verify the key browser flows.

---

# Final report

Report:

1. changed files
2. migrations
3. profile-driven navigation
4. Four-line Contract implementation
5. task lifecycle and retry policy
6. Post-Attempt state handling
7. Error Repair persistence
8. Mastery projection
9. ReviewSchedule integration
10. Unit tests and results
11. Integration tests and results
12. MVC tests and results
13. regression results
14. commands executed
15. manual verification
16. remaining incomplete requirements

Do not report completion when:

- any listed requirement is still incomplete
- tests were not run
- the full test suite is failing
- R2A, R2B, or R2C still has unfinished items

When blocked, report the concrete blocker, affected files, and the smallest next implementation step.
