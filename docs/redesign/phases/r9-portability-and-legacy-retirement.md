# R9 — Portability and legacy retirement

## Purpose
Provide versioned portability and optional, safe retirement of legacy write paths after parity.
## Current dependency
All R1–R8 evidence, task, mastery, and UI parity.
## Domain changes
Add versioned export/import envelopes and explicit migration/audit metadata.
## Database migration
Only additive version/audit fields; no automatic destructive cleanup.
## Service changes
Round-trip validation, dry-run import, legacy projection reconciliation, and user-confirmed cleanup only.
## UI changes
Export/import, compatibility report, and explicit legacy cleanup controls.
## Legacy compatibility
Legacy records remain readable unless the user explicitly chooses cleanup after a backup/export.
## Explicit non-scope
No cloud sync, multi-user sharing, or automatic data deletion.
## Unit tests
Schema versions, validation, conflict policy, cleanup eligibility.
## Integration tests
Round-trip legacy/new database import and rollback-safe failure paths.
## MVC tests
Dry-run report, export, import error presentation, cleanup confirmation.
## Migration/regression tests
Upgrade from every supported legacy migration and no loss of learner history.
## Acceptance criteria
Users can export/import safely and legacy writes retire only after demonstrated parity.
## Implementation report format
Files, data format version, migrations, round-trip results, recovery instructions, limitations.
