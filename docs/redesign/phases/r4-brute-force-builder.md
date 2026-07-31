# R4 — Brute-force builder

## Purpose
Make candidate, enumeration, validity, aggregation, completeness, and cost teachable subskills.
## Current dependency
R3 adaptive task framework and authored problem content.
## Domain changes
Add brute-force worksheet definitions, enumeration shape, structured worksheet evidence, and repair routing codes.
## Database migration
Add additive worksheet/evidence payload tables or versioned JSON payloads with constraints.
## Service changes
Route first blocks in candidate/enumeration/validation to a targeted builder; provide deterministic progressive hints.
## UI changes
Structured worksheet before free-text pseudocode; show only applicable fields.
## Legacy compatibility
Legacy BRUTE_FORCE answers remain historical evidence, not rewritten worksheets.
## Explicit non-scope
No automatic answer grading or full problem authoring.
## Unit tests
Worksheet validation, enumeration shapes, routing priority.
## Integration tests
Two Sum plus two structurally different problems retain evidence links.
## MVC tests
Builder progression, blocked action, hint history.
## Migration/regression tests
Existing BRUTE_FORCE stage and analytics stay readable.
## Acceptance criteria
A learner can record the first brute-force construction block independently of optimization.
## Implementation report format
Files, content coverage, migration, test matrix, manual examples, limitations.

