# R2A Completion Patch

## 0. 目的

既存のR2A実装を壊さず、未完了の以下を完成させる。

- Workspace進行ナビゲーションをProfileの`REQUIRED / OPTIONAL / NOT_APPLICABLE`へ完全移行
- Four-line Contract専用入力UI
- Learning Task完了状態の永続化
- completed taskの再開ポリシー
- R2Aで指定したUnit / Integration / MVC test
- R2B / R2Cには進まない

OpenAI API、外部LLM、自動semantic gradingは追加しない。

---

# 1. 実装前確認

最初に以下を確認する。

- `ReasoningProfileType`
- `ProfileStageDefinition`
- `StageApplicability`
- `LearningTaskType`
- `LearningTaskTemplate`
- `LearningTaskAttempt`
- 既存Attempt Workspace
- 既存のstage navigation
- Post-Attempt next-task card
- Task開始route
- Flyway migration
- 既存テスト

実装前に次を報告する。

1. 現在のWorkspace navigation生成箇所
2. 13工程を固定前提としている箇所
3. ProfileStageDefinitionを参照している箇所
4. LearningTaskAttemptの既存保存項目
5. completed task判定の有無
6. Four-line Contractを現在どこへ保存できるか
7. migrationの必要性
8. 変更予定ファイル

---

# 2. Profile Driven Workspace Navigation

## 2.1 必須要件

Workspaceの進行順序を、固定13工程ではなく`ProfileStageDefinition`から生成する。

```java
public record WorkspaceStep(
    CognitiveStage canonicalStage,
    String displayName,
    StageApplicability applicability,
    int displayOrder,
    String primaryQuestion,
    List<String> helperQuestions
) {}
```

Workspace表示対象:

```text
REQUIRED
→ 通常の進行stepとして表示

OPTIONAL
→ 「任意の追加工程」として折りたたみ表示
→ main progressの分母には含めない

NOT_APPLICABLE
→ 通常UIには表示しない
→ scoreを作成しない
→ FailureLabelを生成しない
→ Analytics分母に含めない
```

## 2.2 固定13工程依存の除去

最低限、以下から固定13工程前提を除去する。

- progress indicator
- previous / next navigation
- completion validation
- Quick Assessment
- StageAssessment自動生成
- Post-Attempt stage map
- completion percentage
- bottleneck analysis
- FailureLabel generation
- review summary

Canonical Stage enumは維持する。

Profileに存在しないstageを削除しない。
そのAttemptでは`NOT_APPLICABLE`として扱う。

## 2.3 LOOKUP_STATE

Two Sumのmain flow例:

```text
問題の関係
Brute force
重複処理
保持状態
確定イベント
状態の対象部分
必要操作
データ構造
不変条件
正しさ・計算量
実装
転移
振り返り
```

既存Phase 8 Patchの表示を維持する。

## 2.4 RECURSIVE_DIVIDE_AND_COMBINE

Maximum Depthのmain flow:

```text
再帰関数の契約
最小入力と答え
同じ形の部分問題
子から受け取る情報
子の答えの合成
値をどこで持つか
各呼び出しが保証すること
再帰が正しい理由
実装
転移
振り返り
```

OPTIONAL:

```text
最も直接的な正しい方法
```

NOT_APPLICABLE:

```text
重複処理
走査型の状態更新
明示的データ構造選択
```

---

# 3. Four-line Contract専用入力UI

## 3.1 対象

最低限、以下で使用する。

- Maximum Depth — Four-line Contract
- Recursive Profileの初期checkpoint
- Count Nodes Transfer
- Minimum Depth Near Transfer

## 3.2 UI

4つの独立入力欄を表示する。

```text
1. この関数が返すもの
2. 最小入力と答え
3. 小さい同型問題
4. 子の答えの合成
```

例:

```text
この関数が返すもの:
nodeを根とする部分木の最大深さ

最小入力と答え:
nullなら0

小さい同型問題:
左部分木と右部分木の最大深さ

子の答えの合成:
1 + max(leftDepth, rightDepth)
```

## 3.3 保存モデル

自由記述1欄へ連結するだけでなく、各項目を独立保存する。

推奨:

```java
public record RecursiveContractAnswer(
    String functionContract,
    String baseCase,
    String subproblems,
    String compositionRule
) {}
```

DB entityが必要ならJSON columnまたは個別columnを使う。

既存DBとの互換性を維持する。

## 3.4 Validation

- 全欄空のまま完了させない
- 部分保存は可能
- draft保存可能
- `PARTIAL`として完了可能
- code欄とは分離する
- 正解文字列との完全一致判定はしない
- ユーザーの自己評価を記録する

## 3.5 Progress

Four-line Contractは4個の別stageとしてprogressを水増ししない。

1つのLearning Task内の4 checkpointsとして扱う。

---

# 4. Learning Task Completion Persistence

## 4.1 状態

```java
public enum LearningTaskAttemptStatus {
    NOT_STARTED,
    IN_PROGRESS,
    COMPLETED,
    ABANDONED
}
```

最低限保存する。

```text
taskAttemptId
templateId
sourceAttemptId
status
startedAt
lastUpdatedAt
completedAt
currentCheckpoint
answers
stage outcomes
assistance sources
```

## 4.2 作成ポリシー

Post-Attempt cardから開始したとき:

- 既存の未完了TaskAttemptがあれば再利用
- 存在しなければ新規作成
- 同一sourceAttempt + templateIdで重複するIN_PROGRESSを作らない

## 4.3 完了条件

Task Templateごとに定義する。

例:

### Relation Drill

```text
relation checkpointが保存済み
自己評価が選択済み
```

### Four-line Contract

```text
4項目がすべて保存済み
各checkpointの自己評価が選択済み
```

### Error Repair

```text
問題点の説明
Primary failure signature
修正方針
自己評価
```

Taskを完了すると:

- status = COMPLETED
- completedAt保存
- Post-Attemptへ戻る
- 同じカードを「開始」として表示しない
- 次taskがあれば表示する

R2BのMastery projectionやReviewSchedule生成はまだ行わない。
ただしR2Bが利用できる完了event / query interfaceは用意してよい。

---

# 5. Completed Task Reopen Policy

## 5.1 原則

完了Taskに対し、通常の「再開」は行わない。

表示:

```text
完了済み
[結果を見る]
[もう一度試す]
```

## 5.2 結果を見る

既存のcompleted TaskAttemptをread-only表示する。

編集不可。

## 5.3 もう一度試す

新しいTaskAttemptを作成する。

- 前回回答を初期入力しない
- previousAttemptIdを保存
- attempt numberを表示
- 過去結果は折りたたみ参照可能
- 同じcompleted recordを上書きしない

## 5.4 Browser back / duplicate submit

- 完了済みTaskへPOSTしても二重完了させない
- idempotent completion
- refreshでTaskAttemptを複製しない
- CSRFを維持
- invalid ownership / invalid templateを安全に処理

---

# 6. Post-Attempt Cardの状態別表示

## 未開始

```text
[この課題を始める]
```

## 進行中

```text
進行中
[続きから再開]
```

## 完了済み

```text
完了済み
[結果を見る]
[もう一度試す]
```

## 次taskあり

完了済みTaskをPrimary cardに残さず、次のconcrete TaskをPrimaryとして表示する。

---

# 7. R2A Unit Test

最低限以下を追加する。

## Profile navigation

- REQUIREDのみmain navigationへ入る
- OPTIONALはmain progress分母から除外
- NOT_APPLICABLEはStageAssessmentを作らない
- Recursive Profileのdisplay order
- Lookup Profileのdisplay order
- previous / nextがprofile順に動く
- completion validationがrequiredのみを見る

## Four-line Contract

- 4項目保存
- draft保存
- empty completion拒否
- partial保存
- completed validation
- code欄と分離

## Task status

- start creates IN_PROGRESS
- duplicate start reuses IN_PROGRESS
- complete sets completedAt
- duplicate complete is idempotent
- completed task cannot be edited
- retry creates new attempt
- previousAttemptId保存

## Next-task card

- NOT_STARTED表示
- IN_PROGRESS表示
- COMPLETED表示
- 次taskへ切替
- evidence不足なら非表示

---

# 8. R2A Integration Test

最低限以下を追加する。

## Two Sum

1. R1 evidenceを持つAttemptを作る
2. `Two Sum — Relation First`を選択
3. Post-Attempt cardを表示
4. Task開始
5. relation回答保存
6. Task完了
7. 同一Taskを再開始して重複IN_PROGRESSを作らない
8. completed後はread-only結果表示
9. retryで新TaskAttemptを作る

## Maximum Depth

1. Recursive Profile Attemptを作る
2. Profile固有navigationを表示
3. Four-line Contractを保存
4. Error Repair taskを開始
5. IN_PROGRESS保存
6. 完了
7. completed stateを表示

## Legacy

- 既存Attemptが読み込める
- Profile未設定はGENERIC fallback
- 既存13stageデータを失わない
- migration後も起動できる

---

# 9. R2A MVC Test

最低限以下を追加する。

## Workspace

- Two Sum LOOKUP_STATE
- Maximum Depth RECURSIVE_DIVIDE_AND_COMBINE
- Required step navigation
- Optional section
- Not Applicable非表示
- Four-line Contract入力
- validation error
- draft保存

## Task Card

- 未開始カード
- 開始route
- 進行中カード
- 続きから再開
- 完了済みカード
- 結果を見る
- もう一度試す
- invalid task
- nonexistent attempt
- duplicate submit

## Post-Attempt

- profile固有stage map
- next-task title
- purpose
- success criteria
- task status
- start / resume / result / retry action

---

# 10. Regression Test

以下を壊さない。

- Two Sum通常Attempt
- Daily Temperatures
- Phase 8 Patchの表示名
- Post-Attempt summary
- HintUsage
- FailureLabel
- PriorExposure
- Analytics
- active duration
- legacy score
- local Flyway migration
- existing task card selection

---

# 11. Acceptance Criteria

- Workspace navigationが固定13工程ではなくProfileから生成される
- Requiredだけがmain progressへ含まれる
- Optionalは折りたたみ
- Not Applicableは非表示・非採点
- Maximum DepthでFour-line Contract専用UIが表示される
- 4項目が独立保存される
- Task statusがDBへ永続化される
- 未完了Taskを続きから再開できる
- 完了Taskはread-onlyで見られる
- 「もう一度試す」で新Attemptが作られる
- completed recordを上書きしない
- R2A指定Unit / Integration / MVC testが実装される
- `./mvnw test`が成功する
- R2B / R2Cへ進んでいない
- OpenAI APIを追加していない

---

# 12. 実装後の報告

以下を報告する。

1. 変更ファイル
2. migration
3. Profile navigation実装
4. 固定13工程依存を除去した箇所
5. Four-line Contract UIと保存形式
6. LearningTaskAttemptStatus
7. completed task reopen policy
8. Task card状態表示
9. Unit test一覧と結果
10. Integration test一覧と結果
11. MVC test一覧と結果
12. Regression結果
13. 手動確認手順
14. 実行command
15. 残っているR2A未完了項目

R2A未完了項目が1件でも残る場合、「R2A完了」と報告しないこと。
