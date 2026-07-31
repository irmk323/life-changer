# R7 — Complete implementation reliability

## Purpose
Turn the Phase 11 scaffold into an error-fingerprint repair lifecycle.
## Current dependency
R3 session tasks and R5 task engine.
## Domain changes
Persist ImplementationContract, checklist definitions/results, problem test cases/results, corrected ImplementationError recurrence, and reliability axis evidence.
## Database migration
Add required tables/constraints/cascades; retain legacy Attempt fields read-only and existing V22 data.
## Service changes
Make ImplementationRecord active source, validate status transitions, link recurrence within a window, schedule repair and clean reimplementation tasks.
## UI changes
Contract → code record → checklist → manual test matrix → error/root-cause/prevention → repair task.
## Legacy compatibility
Existing implementation records remain visible; no fabricated contracts/tests/errors.
## Explicit non-scope
No compiler, code runner, AI review, or automatic correction.
## Unit tests
Transitions, recurrence, checklist, reliability rules, self-debug/first-pass metrics.
## Integration tests
Valid Parentheses repair lifecycle and delayed clean reimplementation.
## MVC tests
Contract, checklist, matrix, fingerprint, repair task start.
## Migration/regression tests
Existing Attempt implementation fields and legacy analytics remain readable.
## Acceptance criteria
Reasoning success and implementation repair are independently measurable and actionable.
## Implementation report format
Files, migration, source-of-truth boundary, tests, manual Valid Parentheses flow, limitations.

