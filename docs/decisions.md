# Decisions, risks, and assumptions

## Recorded decisions

| Decision | Rationale |
| --- | --- |
| Measure stages, not only outcomes | The product's central claim is cognitive diagnosis and training. Completion without stage evidence cannot establish it. |
| Keep retention, transfer, and discrimination distinct | Re-solving a known item tests recall; unseen isomorphism tests reuse; mixed tasks test candidate discrimination. Combining them would inflate apparent ability. |
| Use learner self-assessment in MVP | It permits a useful offline vertical slice without pretending automated marking can evaluate open-ended reasoning. Scores retain hint evidence for later review. |
| Hide pattern/category on attempt start by default | Showing labels before relation extraction would train tag-to-solution recall. Reveal after completion or explicit hint escalation. |
| Store only metadata, learner notes, and original abstractions | This respects the no-scraping/no-unlicensed-copying constraint. External links remain user-initiated. |
| Use a fixed 1/4/7/21 initial sequence plus targeted remediation | This implements the stated learning sequence while allowing stage-specific failures to receive short follow-up practice. |
| Use a rule-based coach first | Feedback is locally explainable, evidence-based, private, and works offline. A local LLM is optional behind an interface/flag. |
| Use file H2 with Flyway | It meets local simplicity and durable schema evolution requirements; tests use in-memory H2. |
| Start with eight varied problems | The slice validates different structures while avoiding a misleading, incomplete 150-problem content project. |
| Keep Phase 1 catalogue metadata-only | The initial database seeds titles, links, categories, difficulty, and app-authored pattern descriptions; it does not store copied prompts or editorials. |
| Keep runtime data and Maven cache project-local | Runtime H2 data defaults to `./data/` (outside `target/`) and Maven uses `./.m2/repository/`. This keeps all newly created files within the project root while preserving durable local data outside the build directory. `LEETCODE_TRAINER_DATA_DIR` can override the data parent. |
| Use Flyway as the only schema creator | JPA validates migrations rather than generating tables, so upgrades are explicit and testable. |
| Expose `/status` instead of adding an actuator dependency | A minimal local JSON status endpoint meets the Phase 1 health requirement without expanding the operational surface. |
| Use H2 `AUTO_SERVER=TRUE` without `DB_CLOSE_ON_EXIT` | H2 2.3 rejects that option combination. The retained setting supports the local file database without relying on a shutdown option. |

## Algorithms and policy

### Stage score and evidence

Every required stage has `score ∈ {0,1,2}`:

- 2: learner reports completing it without a hint.
- 1: learner completes it after one or more hints.
- 0: cannot explain it, abandons it, or marks it not understood even after help.

Validation rule: a score of 2 is invalid if `maxHintLevel > 0` for that stage;
the UI should offer score 1 by default after a hint. `maxHintLevel` and timing
are stored independently, so later analytics do not rely on self-report alone.
For the MVP, answer correctness is learner-assessed with optional notes. A
future authoring/rubric feature may add automated or guided evaluation, but it
must not overwrite the original evidence.

### Initial review schedule

On the first completed INITIAL attempt for a problem, create exactly these
pending review obligations, based on the user's local completion date:

| Offset | Review type | Primary evidence |
| --- | --- | --- |
| +1 day | RECONSTRUCTION | relationship through invariant, without code requirement |
| +4 days | ISOMORPHIC_TRANSFER | unseen, visually different problem in the same family |
| +7 days | CONTRAST_CLASSIFICATION | classify related and near-miss prompts and explain why |
| +21 days | COLD_SOLVE | hidden tags; full relation-to-implementation attempt, time-boxed |

Only create the sequence once per problem unless a user explicitly restarts a
curriculum. Completion is idempotent. A review becomes due when its
`scheduled_date <= today`; it is displayed as overdue rather than punished if
late.

### Remedial scheduling

After any completed review, calculate failed stages as scores of 0 and
hint-assisted stages as scores of 1. If one or more are present, create (or
merge with) one `TARGETED_STAGE` review for the next local day. Its
`target_stages` contains only those stages; score-2 stages are not forced into
the task. A score-0 transfer assessment prioritises an unseen isomorphic or
small synthetic exercise rather than another same-problem replay. A scheduler
must deduplicate pending schedules with the same source/problem, type, date,
and target-stage set.

### Metric calculations

Unless a screen states otherwise, use completed attempts only and show the
sample count and time window.

- Stage success rate: `sum(stage score) / (2 × count assessed)`. This preserves
  partial/hint-assisted progress rather than converting 1 to failure.
- Independent stage rate: `count(score=2) / count assessed`.
- Average hint level: `sum(maxHintLevel) / count assessed`; report no value when
  no assessments exist.
- Retention rate: fraction of completed reconstruction/cold same-problem
  reviews meeting the configured stage threshold (MVP: mean score >= 1.5 and no
  score 0 in relation, unresolved state, updated region, operations, data
  structure, invariant).
- Isomorphic transfer rate: fraction of completed ISOMORPHIC_TRANSFER attempts
  that meet the transfer threshold (MVP: relation, state/event, operations,
  structure, and transfer score each >= 1, with mean >= 1.5). The target must
  not have a prior completed attempt.
- Mixed discrimination rate: fraction of MIXED/CONTRAST classification tasks
  whose `MIXED_PATTERN_DISCRIMINATION` score is 2; score 1 remains visible but
  is not silently counted as independent discrimination.

Mastery status is a configurable, evidence-based indicator, never a promise of
interview success. The starting thresholds are those in the specification:
80% unseen isomorphic relation classification, 70% independent invariant
explanation, 60% implementation success within 25 minutes, average hint level
at most 2, and 70% mixed classification. The MVP should expose insufficient
evidence rather than label a new pattern as failed.

### Bottleneck selection

For each stage in a recent configurable window (initially 8 completed
attempts), calculate a weakness score from low stage score, hint dependence,
blocking failure labels, and repeated occurrences. Choose the highest score
with a minimum sample size; tie-break by most recent failure. The coach reports
the raw evidence and recommends a specific next question/exercise. It does not
diagnose motivation, aptitude, or mental health.

## Risks and unresolved decisions requiring review

1. **Content authoring and isomorphic targets.** The MVP can seed eight
   problems and abstractions, but high-quality unseen isomorphic and contrast
   prompts require authored metadata or synthetic exercises. A source, licence,
   and authoring workflow need approval before a broad catalogue is created.
2. **Assessment validity.** Self-score is practical but can be inconsistent.
   Confirm whether MVP should use self-assessment only, or include simple
   stage-specific rubrics/reference checks from the first release.
3. **“Unseen” definition.** This plan treats a problem as unseen when it has no
   completed Attempt in local data. Imported historical records should count as
   seen; confirm whether exposure outside the app needs a manual flag.
4. **Cold-solve target choice.** The spec permits same or isomorphic unseen
   problem. This plan prefers unseen isomorphic when available; the fallback is
   same-problem cold reconstruction. Confirm this default.
5. **Time-zone and review-date edits.** The default is dates calculated in the
   saved time zone and not retroactively shifted after a setting change. Confirm
   if future schedules should instead be recalculated.
6. **User-created code.** Code is optional and stored locally. It is not
   compiled/executed by the MVP; actual platform results are user-recorded.
7. **Seed source.** No exact NeetCode 150 list is currently in this repository.
   The later import must use a reviewed, lawful metadata-only source rather than
   scraping.

## Assumptions

- Japanese product-spec labels can be presented in a Japanese-capable UI;
  implementation identifiers and seed data may be English. UI-language setting
  is retained for later localization.
- The application has a single local profile, so all learner data is implicitly
  owned by that profile and no `user_id` is needed.
- `Daily Temperatures` may serve as the initial authored monotonic-stack
  exemplar; no external prompt or solution text is copied.
- The configured schedule can be changed for future schedules, but existing
  scheduled reviews remain historical commitments unless explicitly rescheduled.
