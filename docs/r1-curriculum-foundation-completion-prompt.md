# Codex Prompt: R1 Curriculum Foundation Completion

R1は未完了であることを確認しました。

R2には進まず、現在のworking treeにあるR1の部分実装を引き継いで、R1の不足分だけを完成させてください。

最初から作り直したり、現在動いているfoundationを無条件に削除したりしないでください。

---

## 1. 必ず確認するもの

実装前に、以下をすべて確認してください。

- `AGENTS.md`
- `README.md`
- `docs/product-spec.md`
- `docs/architecture.md`
- `docs/data-model.md`
- `docs/implementation-plan.md`
- `docs/decisions.md`
- `docs/redesign/current-state-audit.md`
- `docs/redesign/curriculum-engine-redesign.md`
- `docs/redesign/phases/r1-curriculum-foundation.md`
- 現在の`git status`
- 現在の`git diff`
- V23 migration
- 今回追加済みのdomain shell
- seed
- repository / service
- controller / template
- 既存test
- 今回追加済みのtest

最初に、現在実装済みのR1要件と不足要件を対応表で簡潔に報告してください。

設計上の重大な矛盾がない限り、そのまま実装を続行してください。

---

## 2. 現在分かっている不足

最低限、以下を完成させてください。

1. LearningModeのデータ駆動化
2. R1指定のunit tests
3. R1指定のintegration tests
4. R1指定のMVC tests
5. migration regression tests
6. seed idempotency tests
7. learner-facing既存フローのregression確認
8. documentationの最終更新

---

# 3. LearningModeをデータ駆動化する

現在のLearningModeがenumだけで実装されているため、DB上のmode definitionを追加してください。

最低限、以下に相当するdefinitionを永続化してください。

- stable code
- display name
- description
- display order
- active
- optional version
- createdAt
- updatedAt

例となる名称:

- `LearningModeDefinition`
- `learning_mode_definition`

実際の命名は既存コードとの整合性を優先してください。

最低限、設計文書で定義したmodeをseedしてください。

- `COLD_DIAGNOSTIC`
- `PROBLEM_COMPREHENSION_REPAIR`
- `BRUTE_FORCE_BUILDER`
- `OPTIMIZATION_DERIVATION`
- `GUIDED_RECONSTRUCTION`
- `IMPLEMENTATION_DIAGNOSTIC`
- `IMPLEMENTATION_REPAIR`
- `CLEAN_REIMPLEMENTATION`
- `RETENTION_REVIEW`
- `ISOMORPHIC_TRANSFER`
- `PATTERN_DISCRIMINATION`
- `TIMED_COLD_SOLVE`

## 3.1 enumの扱い

既存のLearningMode enumを直ちに削除する必要はありません。

enumを残す場合は、stable codeの定義やcompile-timeの識別子としてのみ使用し、以下はDBをsource of truthにしてください。

- display name
- description
- active
- display order
- required skills
- assistance policy
- stop policy
- completion policy

business logicを巨大なswitch文だけで決定しないでください。

## 3.2 ModeSkillRequirementとの関連

ModeSkillRequirementは、可能であればLearningModeDefinitionへのforeign keyで関連付けてください。

ただし、現在のV23 schemaやdomainがmode enum/stringを既に保存している場合は、R1で破壊的に削除しないでください。

安全な移行例:

1. V23の既存columnを維持
2. 新しいmigrationでLearningModeDefinition tableを追加
3. definitionをstable codeでseed
4. requirementからdefinitionへ関連付け
5. 既存code値から決定的にbackfill可能な場合だけbackfill
6. 旧columnはR1では削除しない
7. legacy compatibility方針を`docs/decisions.md`へ記録

---

# 4. Migration方針

V23は既に作成され、テストやローカル起動で適用された可能性があるため、原則として編集しないでください。

不足schemaはV24以降の新しいadditive migrationとして追加してください。

- 既存migrationを編集・rename・削除しない
- tableやcolumnを破壊的に削除しない
- 既存Attemptや学習履歴を変更しない
- ローカルDBを直接編集しない
- foreign key、unique constraint、indexを明示する
- seedは再実行時に重複しない
- migration番号は既存repositoryを確認して決定する

V23が一度も適用されていないと推測して編集するのではなく、適用済みとして安全に扱ってください。

---

# 5. Unit test要件

最低限、以下を追加してください。

- LearningModeDefinitionのcode uniqueness
- display order validation
- active / inactiveの扱い
- ModeSkillRequirementのorder
- required / optional / not applicable
- assistance allowed
- stop on failure
- completion required
- CurriculumRole validation
- ProblemExposure state validation
- LearningSession status transition
- nullable legacy Attempt link
- holdoutに関するfoundation-level exposure rule
- invalid relationやduplicateの拒否

既存class名と設計に合わせてtest名は調整してください。

---

# 6. Integration test要件

最低限、以下を追加してください。

- LearningModeDefinitionの保存・取得
- 全mode seedの取得
- ModeSkillRequirementのmode別・order順取得
- SkillDefinitionの取得
- CurriculumItemの取得
- ProblemExposureの保存・取得
- ContentExposureEventの保存・取得
- LearningSessionの保存・取得
- legacy Attempt linkありのLearningSession
- legacy Attempt linkなしのLearningSession
- HOLDOUT CurriculumItemの通常queryからの除外または保護
- seedのidempotency
- duplicate definition / requirement / curriculum itemの制約

---

# 7. Migration regression test要件

テスト用の一時H2 DBを使用し、ローカルDBを変更せずに確認してください。

最低限、次の2経路を検証してください。

## 7.1 Fresh migration

空DBから最新migrationまで適用し、次を確認してください。

- foundation tableが存在する
- seedが存在する
- LearningModeDefinitionが存在する
- ModeSkillRequirementがdefinitionと関連している
- 主要foreign keyとunique constraintが存在する

## 7.2 Upgrade migration

次の経路を検証してください。

1. 一時DBを作成
2. Flyway targetでV22またはV23直前まで適用
3. 必要ならlegacy fixtureを追加
4. latestまでmigration
5. legacy recordが残る
6. 新foundation tableが利用可能になる

repository上の実際のmigration順序を確認し、適切なtarget versionを選んでください。

migration testでは以下も確認してください。

- 既存Attemptが消えない
- StageAssessmentが消えない
- ReviewScheduleが消えない
- HintUsageが消えない
- reference answer reveal履歴が消えない
- LearningSessionがなくてもlegacy Attemptが有効
- seedが重複しない

---

# 8. MVC test要件

最低限、以下を追加してください。

- `/curriculum` foundation overview
- SkillDefinition一覧
- LearningModeDefinition一覧
- mode別SkillRequirement表示
- CurriculumItem coverage
- role別coverage
- pattern別coverage
- LearningSession一覧または詳細
- HOLDOUT内容をlearner-facing画面へ露出しないこと
- 通常Problem画面から既存Attemptを開始できること
- 既存Attempt開始がLearningSession作成を必須としないこと

read-only画面であることも確認してください。

---

# 9. Existing behavior regression

既存54テストだけでなく、今回追加したtestを含めて全件実行してください。

特に以下を手動または自動testで確認してください。

- Problem catalogue
- Problem detail
- 通常Attempt開始
- 13工程表示
- StageAssessment保存
- HintUsage
- reference answer reveal
- Attempt完了
- ReviewSchedule生成
- Dashboard
- Analytics
- Phase 10・11の既存非AI機能

R1では既存AttemptをLearningSessionへ強制変換しないでください。

---

# 10. Documentation更新

実装結果に合わせて以下を更新してください。

- `README.md`
- `docs/architecture.md`
- `docs/data-model.md`
- `docs/implementation-plan.md`
- `docs/decisions.md`
- `docs/redesign/phases/r1-curriculum-foundation.md`

特に以下を記録してください。

- enumとDB definitionの責務
- DB definitionをsource of truthにする範囲
- V23を変更せずV24以降を追加したこと
- legacy Attemptをbackfillしないこと
- LearningSession linkのnullable方針
- cascade / delete policy
- HOLDOUTの露出保護
- R1ではadaptive sessionをまだ実装していないこと

---

# 11. 明確な非対象

以下はまだ実装しないでください。

- R2のNeetCode 150 catalogue
- adaptive session generation
- first blocked skill判定
- brute-force worksheet
- mastery projection
- LearningTask scheduler
- transfer target selection
- holdout消費
- discrimination workflow
- Dashboard全面置換
- Phase 11 Implementation Reliabilityの完成
- OpenAI API
- 外部LLM
- code execution

---

# 12. 完了条件

R1を完了と報告してよいのは、最低限以下をすべて満たした場合だけです。

- LearningModeDefinitionがDBに存在する
- ModeSkillRequirementがデータ駆動definitionと関連する
- seedがidempotentである
- unit testを追加した
- integration testを追加した
- MVC testを追加した
- fresh migration testを追加した
- upgrade migration testを追加した
- 既存54テストを含む全テストが成功する
- learner-facing既存フローにregressionがない
- applicationが起動する
- documentationを更新した
- R2へ進んでいない

未達項目がある場合は、R1完了とは報告せず、残件と理由を明示してください。

---

# 13. 実装前の報告

コード変更前に、次を簡潔に報告してください。

1. 現在実装済みのR1要件
2. 不足しているR1要件
3. 追加・変更予定のdomain / table
4. V23を変更しないこと
5. 追加予定のmigration番号
6. enumとDB definitionの関係
7. ModeSkillRequirementの移行方針
8. 変更予定ファイル
9. learner-facing既存挙動を変えないこと
10. R2へ進まないこと

設計文書間に矛盾がある場合は、勝手に大規模実装せず、矛盾と採用案を先に報告してください。

---

# 14. 実装後の報告

以下を具体的に報告してください。

- 最初に見つけたgap一覧
- 追加・変更ファイル
- V23を変更したか
- 新migration番号
- LearningModeDefinition schema
- enumとDB definitionの関係
- ModeSkillRequirementとの関係
- seedされたmode一覧
- DB constraintとindex
- unit test一覧
- integration test一覧
- MVC test一覧
- migration regression testの方式と結果
- 既存test件数
- 新規test件数
- 総test件数
- failure / error / skip
- `./mvnw spring-boot:run`結果
- ローカルDBを直接変更したか
- legacy互換性
- R2へ残した内容
- 未解決事項

R1が完全に終了したらそこで停止し、R2へ進まないでください。
