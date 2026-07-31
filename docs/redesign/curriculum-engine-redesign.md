# Curriculum Engine Redesign

## Target loop

```text
prior exposure → smallest diagnostic → first blocked skill → targeted mode/task
→ independent or assisted evidence → multi-axis mastery → next evidence-driven task
```

The 13 current stages remain a diagnostic coordinate system, not a mandatory
form. The engine must distinguish unseen, forgotten, remembered, and memorized
problems; keep same-problem reconstruction separate from unseen transfer; and
protect holdout problems before their first evaluation.

## Target models

R1 onward introduces additive SkillDefinition, LearningMode, CurriculumItem,
ProblemExposure, LearningSession, SkillEvidence, AssistanceEvent, mastery
projections, and LearningTask models. Implementation reliability becomes an
independent mastery axis and uses ImplementationRecord as the active source of
truth only after migration parity.

## Migration boundary

Existing Attempt, StageAssessment, HintUsage, ReviewSchedule, Problem.solved,
legacy analytics, coaching messages, and implementation records remain
readable. New sessions eventually use the curriculum engine; legacy screens are
retired only after import/export, history, analytics, and migration parity.

## Constraints

The redesign remains local, deterministic, metadata-only, and free of external
AI, paid APIs, scraping, or code execution.

