# R2A: Next Task Integration

## 目的

既存のR2基盤を、実際のAttempt WorkspaceとPost-Attempt画面へ接続する。

未完了項目:

- concrete next-task card
- Two Sum / Maximum Depth evidenceからのnext-task selection
- Profile固有Workspace統合

---

# 1. 実装前確認

以下を確認する。

- ReasoningProfileType
- ProfileStageDefinition
- StageOutcome
- AssistanceSource
- LearningTaskType
- LearningTaskTemplate
- MicroSkill
- Existing Attempt Workspace
- Post-Attempt summary
- RuleBasedCoach
- FailureLabel
- ReviewSchedule
- Existing routes/controllers/templates

最初に変更予定ファイルと設計を報告してから実装する。

---

# 2. Profile固有Workspace

## LOOKUP_STATE

Two Sumでは次を優先表示する。

```text
問題の関係
保持状態
確定イベント
状態の対象部分
必要操作
データ構造
不変条件
```

## RECURSIVE_DIVIDE_AND_COMBINE

Maximum Depthでは最初に次を表示する。

```text
この関数が返すもの:
最小入力と答え:
小さい同型問題:
子の答えの合成:
```

続いて必要なら次を表示する。

```text
子から受け取る情報
値をどこで持つか
各呼び出しが保証すること
正しさ
実装
転移
振り返り
```

Repeated WorkはNOT_APPLICABLE。

Brute ForceはOPTIONAL。

明示的なData Structure選択は強制しない。

---

# 3. Evidence DTO

Attempt結果からNext Taskを選ぶため、最低限次を作る。

```java
public record AttemptLearningEvidence(
    long attemptId,
    String problemSlug,
    ReasoningProfileType profile,
    PriorExposure priorExposure,
    FinalResult finalResult,
    Map<MicroSkill, MicroSkillEvidence> microSkills,
    List<FailureSignature> failureSignatures,
    boolean transferMeasured,
    boolean discriminationMeasured,
    boolean retentionDue
) {}
```

```java
public record MicroSkillEvidence(
    MicroSkill skill,
    StageOutcome outcome,
    AssistanceSource assistanceSource,
    Integer maxHintLevel,
    boolean answerPresent,
    int previousOccurrences
) {}
```

---

# 4. NextTaskSelector

```java
public interface NextTaskSelector {
    Optional<NextLearningTask> select(AttemptLearningEvidence evidence);
}
```

```java
public record NextLearningTask(
    String templateId,
    LearningTaskType taskType,
    String title,
    String purpose,
    String successCriteria,
    Set<MicroSkill> targetSkills
) {}
```

---

# 5. Two Sum rule

条件:

```text
profile = LOOKUP_STATE
priorExposure in {SOLVED_BEFORE, MEMORISED}
finalResult = SOLVED_INDEPENDENTLY
RELATION_ABSTRACTION = BLOCKED or PARTIAL
other core lookup skills mostly INDEPENDENT
```

Primary:

```text
Two Sum — Relation First
```

目的:

```text
問題文を、要素間の関係または式へ変換する
```

成功条件:

```text
nums[i] + nums[j] = target
i != j
```

このTask成功後:

```text
Movie Ticket Pair — Relation First
```

を選べるようにする。

---

# 6. Maximum Depth rule

条件:

```text
profile = RECURSIVE_DIVIDE_AND_COMBINE
recursive calls are present
ACCUMULATOR_VS_RETURN_CONFUSION detected
COMPOSITION_RULE not demonstrated
```

Primary:

```text
Maximum Depth Error Repair
```

目的:

```text
共有countではなく、
各部分木の答えをreturnで親へ返す理由を説明する
```

成功条件:

```text
Function contract
Base case
Subproblems
Composition
Accumulator vs Return
```

成功後:

```text
Maximum Depth — Four-line Contract
```

さらに成功後:

```text
Count Nodes Transfer
```

---

# 7. Post-Attempt next-task card

表示項目:

- Task title
- Task type
- Target MicroSkill
- なぜこのTaskなのか
- 成功条件
- 開始ボタン

例:

```text
次に行う課題

Two Sum — Relation First
Micro Skill Drill

今回、関係の抽出で止まったため、
データ構造を考える前に式へ変換する練習を行います。

成功条件:
nums[i] + nums[j] = target
i != j

[この課題を始める]
```

抽象的な「同型問題を解いてください」だけの表示は禁止。

---

# 8. Task開始

開始ボタンから、LearningTaskTemplateを読み込んだWorkspaceへ遷移する。

必要なもの:

- route
- controller
- service
- template
- attempt/task link
- CSRF対応
- invalid template handling
- completed task handling

---

# 9. Test

## Unit

- Two Sum rule
- Maximum Depth rule
- Primary最大1件
- evidence不足ならtaskなし
- NOT_APPLICABLE除外

## Integration

- AttemptからEvidence生成
- EvidenceからTask選択
- Task Template読込
- Task開始
- Task Attempt保存

## MVC

- Post-Attempt card
- start button
- profile-specific workspace
- invalid task
- completed task

---

# 10. 完了報告

- 変更ファイル
- Evidence model
- Selector rule
- Workspace統合
- Post-Attempt card
- route
- test結果
- 未実装項目
