# Decisions, risks, and assumptions

## Recorded decisions

| Decision | Rationale |
| --- | --- |
| Measure stages, not only outcomes | The product's central claim is cognitive diagnosis and training. Completion without stage evidence cannot establish it. |
| Keep retention, transfer, and discrimination distinct | Re-solving a known item tests recall; unseen isomorphism tests reuse; mixed tasks test candidate discrimination. Combining them would inflate apparent ability. |
| Keep missing stage assessments nullable | A score of zero means the learner tried and could not yet explain or execute the stage. Completion leaves untouched stages `NOT_STARTED` with a null score; Quick Assessment may later record 0, 1, 2, skipped, or not applicable. |
| Treat legacy synthetic zeroes as ambiguous | Earlier completion logic could create zeroes without an answer, hint, reference-answer reveal, or meaningful duration. V21 preserves those rows and derives `LEGACY_AMBIGUOUS`, suppressing bottlenecks and analytics until the learner reviews them. |
| Gate bottleneck inference on data quality | Fewer than three assessed stages, half or more unassessed stages, legacy ambiguity, or an independent result with all assessed stages at zero prevents automatic FailureLabel suggestions. This avoids turning absent evidence into a diagnosis. |
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
| Keep `ProblemPattern`'s composite key | The existing architecture and migration use `(problem_id, pattern_id)` as the natural unique identity. The entity remains explicit and stores association metadata, avoiding an unnecessary key migration while supporting many-to-many extension. |
| Evolve the seeded catalogue through a new Flyway migration | Existing local databases may already be at V2. V3 adds the richer pattern fields, typed category values, constraints, and corrected Binary Search seed without rewriting migration history. |
| Generate all 13 `StageAssessment` drafts when an Attempt starts | A fixed set makes missing cognitive evidence visible, supports resumable drafts, and prevents a solved-problem outcome from standing in for unrecorded reasoning. |
| Record unvisited stages as 0 when an Attempt is completed | A learner may end an exercise before visiting every stage. Completion converts only unscored stages to an explicit 0, while preserving all recorded answers and scores. This avoids blocking the learner and keeps missing cognitive evidence visible for review. |
| Keep `UNRESOLVED_STATE` and `UPDATED_REGION` as internal keys while generalising their learner-facing definitions | Existing Attempt rows, hint usage, failure labels, weekly plans, and analytics are keyed by these enum values. The UI calls them 「保持する状態・未確定の候補」 and 「状態の参照・更新対象」, which works for key lookup, stack, search-range, window, and tree problems without a destructive migration. |
| Allow edits while an Attempt is in progress; make completed Attempts immutable | Learners can correct drafts during a session, but completed evidence and duration remain stable for later analytics and review scheduling. |
| Store required operations in a normalized collection table | Operation selections stay queryable for future bottleneck and data-structure analysis, unlike a serialized text field. |
| Persist explicit pattern reveal per Attempt | The workspace hides pattern tags by default. A learner can consciously reveal them; the timestamp remains an extension point for Phase 4 hint-usage validation without implementing hints now. |
| Treat score 1 as self-reported assistance in Phase 3 | Hints are not implemented yet. The score retains its meaning and can later be checked against `HintUsage` rather than being blocked until Phase 4. |
| Reveal hints by the next configured level only | A learner cannot request a later available level directly. All hints at that level are recorded on first reveal, so a staged prompt remains a scaffold rather than a shortcut to an answer. |
| Prefer problem-specific hints over pattern hints at the same stage and level | Problem wording can target the learner's current representation. Pattern hints fill only missing levels and are written without the pattern name, preserving tag-hidden practice. |
| Treat HintUsage as immutable reveal evidence, with one outcome update | `unique(attempt_id, hint_id)` records only the first reveal. `helpedUserProceed` and a learner note can be added later, including after completion, because the outcome may be known only when the learner tries the next step. |
| Derive maximum hint level from HintUsage | No `max_hint_level` column is stored on StageAssessment, avoiding two sources of truth. Score validation queries the recorded usage evidence. |
| Reject score 2 after any hint was revealed for that stage | The application does not silently downgrade self-assessment. It explains the conflict and requires the learner to select score 0 or 1; level 5 may still be scored 1 when the learner can explain the approach. |
| Derive DUE and MISSED from `scheduledDate` and an injected Europe/London clock | The persistent schedule only records stable workflow states (`PENDING`, `RESCHEDULED`, `COMPLETED`, `CANCELLED`). This avoids stale date-state writes while keeping review dates testable at time-zone boundaries. |
| Create the four review types through an Attempt-completed domain event | `AttemptService` remains responsible for completing an attempt; the review feature reacts only to `INITIAL` completions and links review completions without a service dependency cycle. The database unique key makes generation idempotent. |
| Use a nullable assignment with manual fallback for isomorphic transfer | The initial seed does not guarantee a second active problem for every primary pattern. The review preserves its transfer purpose through an explicit task note and requires a user assignment instead of silently turning it into same-problem repetition. |
| Keep remedial review user-triggered in Phase 5 | A completed review can create one next-day follow-up with a stored reason. It is sourced from that completion attempt, so it does not duplicate the original schedule; automatic adaptive re-scheduling remains Phase 6 work. |
| Make the review-attempt link nullable on review deletion | `attempts.source_review_schedule_id` uses `ON DELETE SET NULL`, preventing a foreign-key cycle with a review's source/completion attempt while retaining referential integrity for normal operation. |
| Keep one AttemptFailureLabel record per attempt/label | A system suggestion is stored as unconfirmed; confirmation updates that same record to `SYSTEM_CONFIRMED`, and a rejection removes it. This prevents the application from retaining a rejected label as a claim about the learner. |
| Use explicit, bounded bottleneck heuristics | Score 0/1, hint level, upstream stage order, implementation flags, review type, and confirmed prior frequency determine suggestions. The UI calls this an app heuristic and presents evidence; it never makes ability, medical, or personality claims. |
| Require a confirmed HIGH label before creating a targeted review | Phase 6 supplies a one-day, label-linked `TARGETED_BOTTLENECK` review only by user action. It deduplicates by source Attempt, review type, and failure label; adaptive automatic scheduling remains out of scope. |
| Persist coaching messages as append-only provider versions | Each generation stores provider name, rule version, structured fields, and rendered text. Regeneration does not rewrite past analysis, so a rule change remains auditable. |
| Use a local keyword safety-note extension point | The rule-based coach can show a non-diagnostic safety note for a small set of explicit self-harm phrases. It neither assesses risk nor supplies country-specific contacts; false negatives and positives remain a documented limitation. |
| Withhold Weekly Focus until there is cross-problem evidence | A focus recommendation needs at least three completed Attempts across two Problems and twenty scored StageAssessments. Before that threshold, the dashboard only explains how to collect enough evidence; it does not label a default stage as weak. |
| Keep manual Weekly Focus selection off the dashboard | The home page offers only adoption of an evidence-based recommendation. A deliberate override is available from the dedicated Weekly Review page so manual selection does not replace the evidence-driven learning model. |

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
- Phase 9教材は問題別YAMLを唯一の本文ソースとする。Flywayは表と制約のみを
  作成し、起動時importは同一versionを変更せず、新しいversionのみ更新する。
  模範回答の表示はHintUsageではなく専用reveal eventに保存するが、分析上は
  同工程のHint Level 5として扱う。
# Phase 8: 認知工程中心の分析

- 分析の率は `Metric` に分子と分母を保持し、分母が 0 の場合は `N/A` と表示する。未観測を失敗率 0% と解釈しないためである。
- 期間は注入された `Clock` と `app.review.time-zone` を使い、開始日は利用者のローカル日付の午前 0 時を含む。
- retention は再構築 Attempt、transfer は `ISOMORPHIC_TRANSFER` Attempt を別々に集計する。現行データには stage applicability がないため、transfer は定義済み core stage がすべて評価済みの Attempt のみを分母とする。
- 比較／混合分類にはまだ expected answer を構造化した item がない。Phase 8 では `TRANSFER` 工程に判断理由があり score が記録された Attempt を暫定の観測単位とし、expected-answer 型の分類モデルは将来の明示的な Phase で追加する。
- pattern candidate と working solution の時間は、現行の stage `durationSeconds`（工程開始から完了まで）を中央値にする。Attempt 開始からの累積時刻は既存の stage timestamp だけでは復元できないため、表示を工程時間として解釈する。
- WeeklyPlan は単一ローカルユーザーの active plan を一つにし、新しい採用時には前の active plan をキャンセルする。推奨は過去28日の自力成功率が最も低い観測済み工程を使い、データがない場合は問題の関係工程を提案する。

### 学習画面の表示と操作

- `Problem.active` はカタログ上で演習対象として使えるかを示す運用フラグであり、学習者の進捗や習熟度ではない。問題一覧では「演習に使用できます」と表示する。
- 教材の `contentVersion` はYAMLの更新と回答表示履歴を整合させる内部値である。学習判断には使わないため、利用者向け画面には表示しない。
- ヒント後に「次へ進めた／まだ考えが進まない」を保存する。これはヒントの効果と依存度を分析するための事実記録であり、自己評価の代替ではない。選択はラジオボタンではなく、意味を明示した保存ボタンで行う。
