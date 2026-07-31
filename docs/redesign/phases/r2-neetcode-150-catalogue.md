# R2 — NeetCode 150 catalogue and curriculum graph

## Purpose
Add reviewed metadata-only NeetCode 150 coverage and authored Pattern prerequisites/roles.
## Current dependency
R1 curriculum tables and the existing eight stable Problem IDs.
## Domain changes
Extend Pattern graph, curriculum roles (anchor/guided/transfer/contrast/benchmark/holdout), and content coverage records.
## Database migration
Add role/prerequisite tables and an idempotent seed migration; preserve existing Problem rows and slugs.
## Service changes
Validate category/difficulty totals, stable IDs, prerequisites, and incomplete-content coverage.
## UI changes
Read-only catalogue coverage and role visibility for authoring only.
## Legacy compatibility
Problem library remains usable; legacy solved marker stays secondary.
## Explicit non-scope
No full authored prompts, automatic routing, or holdout consumption.
## Unit tests
Exact 150 counts, duplicate slug prevention, prerequisite graph validation.
## Integration tests
Existing eight plus new metadata seed and idempotent upgrade.
## MVC tests
Catalogue filters and coverage display.
## Migration/regression tests
No copied problem statements; existing pattern links preserved.
## Acceptance criteria
150 metadata items and a validated curriculum graph are visible without changing sessions.
## Implementation report format
Files, seed counts, source/rights note, migration, tests, coverage gaps.

