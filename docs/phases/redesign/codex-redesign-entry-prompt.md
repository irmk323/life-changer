# Codex entry prompt — Curriculum Engine Redesign

Read the following files before doing anything else:

- `AGENTS.md`
- `docs/product-spec.md`
- `docs/architecture.md`
- `docs/data-model.md`
- `docs/implementation-plan.md`
- `docs/decisions.md`
- all implemented files under `docs/phases/`
- `docs/redesign/current-state-audit.md`
- `docs/redesign/curriculum-engine-redesign.md`
- all current Flyway migrations
- all production and test code

The current application has implemented Phase 2–8, `phase8-patch`, and the non-AI Phase 9–11 work. OpenAI/API phases are not implemented and must not be added.

The redesign goal is to turn the application from a fixed 13-stage recorder into an adaptive curriculum engine that:

- distinguishes unseen, forgotten, remembered, and memorized problems before a session
- identifies the first blocked skill
- routes to comprehension repair, brute-force construction, optimization derivation, implementation repair, retention, transfer, discrimination, or timed cold solve
- treats the existing 13 stages as a diagnostic coordinate system rather than a mandatory form
- builds multi-axis Problem and Pattern mastery
- protects unseen/holdout evaluation integrity
- selects the next task from evidence rather than creating every review type automatically
- preserves existing learning history
- runs locally without external AI or paid APIs

## This run's scope

Do not implement the entire redesign.

Complete **R0 — Documentation and safety baseline** only.

Required outputs:

1. Copy or adapt the audit and redesign into the repository under `docs/redesign/`.
2. Update `README.md` so it accurately describes the current implemented scope.
3. Update `docs/architecture.md`, `docs/data-model.md`, `docs/implementation-plan.md`, and `docs/decisions.md` to distinguish:
   - legacy current workflow
   - target curriculum engine
   - migration boundary
4. Create detailed implementation phase documents:
   - `docs/redesign/phases/r1-curriculum-foundation.md`
   - `docs/redesign/phases/r2-neetcode-150-catalogue.md`
   - `docs/redesign/phases/r3-adaptive-session.md`
   - `docs/redesign/phases/r4-brute-force-builder.md`
   - `docs/redesign/phases/r5-mastery-and-task-engine.md`
   - `docs/redesign/phases/r6-transfer-holdout-discrimination.md`
   - `docs/redesign/phases/r7-implementation-reliability.md`
   - `docs/redesign/phases/r8-dashboard-and-planner.md`
   - `docs/redesign/phases/r9-portability-and-legacy-retirement.md`
5. Add characterization tests only where needed to lock down current behavior before later migration.
6. Do not add the new curriculum schema or change learner-facing behavior during R0.
7. Do not delete, rename, or rewrite existing Flyway migrations.
8. Do not modify the local database file.
9. Run all tests.

Each R1–R9 phase document must include:

- purpose
- current dependency
- domain changes
- database migration
- service changes
- UI changes
- legacy compatibility
- explicit non-scope
- unit tests
- integration tests
- MVC tests
- migration/regression tests
- acceptance criteria
- implementation report format

Before making changes, report:

- your understanding of the current architecture
- which current components will be preserved
- which components will become legacy
- the exact files you expect to change in R0

After completion, report:

- changed files
- new documents
- any characterization tests added
- commands run
- exact test results
- unresolved design questions
- whether the application still starts successfully
