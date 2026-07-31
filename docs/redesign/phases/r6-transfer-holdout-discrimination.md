# R6 — Transfer, holdout, and discrimination

## Purpose
Protect unseen evaluation integrity and measure transfer/discrimination separately from recall.
## Current dependency
R2 roles/contrasts and R5 task selection/mastery.
## Domain changes
Add holdout lifecycle, exposure thresholds, contrast relations, and transfer/discrimination evidence.
## Database migration
Add additive holdout reservation/consumption and contrast tables with audit timestamps.
## Service changes
Select only eligible unseen targets, reserve atomically, consume after use, and exclude contaminated evidence.
## UI changes
Hidden holdout content, transfer task briefing, contrast comparison interface.
## Legacy compatibility
Legacy ISOMORPHIC_TRANSFER remains labelled legacy/uncertain when exposure integrity is unavailable.
## Explicit non-scope
No automatic semantic grading or all-150 full content.
## Unit tests
Eligibility, reservation lifecycle, contamination exclusion, contrast selection.
## Integration tests
Concurrent-safe reservation and post-use release-to-practice.
## MVC tests
No early holdout reveal; transfer and contrast pages show reasons.
## Migration/regression tests
Existing transfer history remains readable and is not upgraded to valid unseen evidence.
## Acceptance criteria
Same-problem recall cannot count as protected unseen transfer.
## Implementation report format
Files, integrity rules, migration, tests, manual holdout lifecycle, coverage limits.

