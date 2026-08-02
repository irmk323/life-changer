# Codex Prompt: R2 Adaptive Learning Redesignの実装

## 指示

このリポジトリで、`docs/redesign/r2-adaptive-learning-redesign.md`を実装してください。

実装前に、以下を最初から最後まで確認してください。

- `AGENTS.md`
- `docs/product-spec.md`
- `docs/architecture.md`
- `docs/data-model.md`
- `docs/implementation-plan.md`
- `docs/decisions.md`
- Phase 2からPhase 8までの指示
- `phase8-patch.md`
- Post-Attempt redesignに関するPhase
- 既存のAttempt、StageAssessment、HintUsage、FailureLabel、ReviewSchedule、RuleBasedCoach、Analytics、Mastery、Task Selection関連コード
- 既存のFlyway migration
- 既存テスト

OpenAI API、外部LLM、StageRubric、AI自動採点は追加しないでください。

---

# 1. 最初に調査して報告すること

いきなり実装せず、まず現在のコードを確認して次を報告してください。

1. 現在のCognitiveStageとStageAssessmentの構造
2. score 0、1、2の保存と表示ロジック
3. HintUsageとscore 1の関係
4. NOT_APPLICABLEの有無
5. ProblemまたはPatternごとの質問定義方法
6. Next Task Selectionの既存実装
7. MasteryとReviewScheduleの既存実装
8. Two SumのR1結果をR2へ引き継げる既存データ
9. Maximum Depthを追加するために必要なseed構造
10. migrationの必要性
11. R2.1〜R2.7へ分けた実装計画

調査結果と計画を作った後、依存順に実装してください。

---

# 2. R2.1 Assessment Semantics

次を実装してください。

```java
public enum StageOutcome {
    INDEPENDENT,
    PARTIAL,
    BLOCKED,
    UNASSESSED,
    SKIPPED,
    NOT_APPLICABLE
}
```

```java
public enum AssistanceSource {
    NONE,
    HINT,
    ANSWER_EXAMPLE,
    EXTERNAL_REFERENCE,
    PREVIOUS_MEMORY,
    COACH_QUESTION,
    USER_MARKED_PARTIAL,
    UNKNOWN_LEGACY
}
```

要件:

- score 1を自動的に「ヒントあり」と表示しない
- `PARTIAL + NONE`は「一部できた」
- `PARTIAL + HINT`は「ヒント後に一部できた」
- `INDEPENDENT + ANSWER_EXAMPLE`は「回答例確認後に再構築」
- `BLOCKED + HINT`は「ヒントを使ったが未解決」
- `NOT_APPLICABLE`をAnalytics分母に含めない
- legacy dataを失わない
- 曖昧なlegacy dataは`UNKNOWN_LEGACY`として扱う

---

# 3. R2.2 Reasoning Profile

最低限次を追加してください。

```java
public enum ReasoningProfileType {
    LOOKUP_STATE,
    RECURSIVE_DIVIDE_AND_COMBINE,
    GENERIC
}
```

必要なら既存設計に合わせて他の値も追加して構いません。

Profileごとに次を定義できるようにしてください。

- Canonical CognitiveStage
- StageApplicability
- 表示名
- Primary question
- Helper questions
- 表示順

```java
public enum StageApplicability {
    REQUIRED,
    OPTIONAL,
    NOT_APPLICABLE
}
```

```java
public record ProfileStageDefinition(
    ReasoningProfileType profile,
    CognitiveStage canonicalStage,
    StageApplicability applicability,
    String displayName,
    String primaryQuestion,
    List<String> helperQuestions,
    int displayOrder
) {}
```

既存のCognitiveStage enumを破壊的にrenameしないでください。

---

# 4. R2.3 Maximum Depth Vertical Slice

`104. Maximum Depth of Binary Tree`を、`RECURSIVE_DIVIDE_AND_COMBINE`のvertical sliceとして追加または更新してください。

Workspaceで最初に次を表示してください。

```text
この関数が返すもの:
最小入力と答え:
小さい同型問題:
子の答えの合成:
```

最低限、次を独立して記録できるようにしてください。

- Function Contract
- Base Case
- Recursive Subproblems
- Returned Information
- Composition Rule
- Accumulator vs Return Value
- Recursive Invariant
- Correctness
- Complexity
- Implementation
- Transfer
- Reflection

Maximum Depthの期待:

```text
Function Contract:
maxDepth(node)はnodeを根とする部分木の最大深さを返す

Base Case:
node == nullなら0

Subproblems:
maxDepth(node.left)
maxDepth(node.right)

Returned Information:
左右の部分木の最大深さ

Composition:
1 + max(leftDepth, rightDepth)

Information Flow:
各呼び出しがreturn valueとして親へ返す
```

この問題では次を強制しないでください。

- Repeated Work
- 明示的なData Structure選択
- 走査型問題向けの「状態の参照・更新対象」という表示

Profile固有表示へ置き換えてください。

---

# 5. Recursive Failure Signatures

最低限次を追加してください。

```java
public enum RecursiveFailureSignature {
    FUNCTION_CONTRACT_MISSING,
    BASE_CASE_MISSING,
    NULL_SAFETY_MISSING,
    SUBPROBLEM_DECOMPOSITION_MISSING,
    RETURNED_INFORMATION_INSUFFICIENT,
    COMPOSITION_RULE_INCORRECT,
    ACCUMULATOR_VS_RETURN_CONFUSION,
    LOCAL_VS_GLOBAL_ANSWER_CONFUSION,
    MULTIPLE_RETURN_VALUES_NOT_IDENTIFIED,
    RECURSIVE_INVARIANT_MISSING,
    COMPLEXITY_ANALYSIS_MISSING
}
```

次の誤コードをError Repair教材としてseedしてください。

```java
class Solution {
    public int maxDepth(TreeNode root) {
        int count = 0;
        countDepth(count, root);
        return count;
    }

    private void countDepth(int count, TreeNode root) {
        if (root.left == null && root.right == null) {
            return;
        }
        countDepth(count, root.left);
        countDepth(count, root.right);
        count++;
    }
}
```

教材で確認すること:

- Javaのprimitive引数は呼び出し元のcountを更新しない
- `root == null`を先に処理する必要がある
- 左右を訪問するだけでは最大深さにならない
- 各部分木の答えをreturnする必要がある
- 親で`1 + max(left, right)`と合成する

このAttemptの推奨診断:

```text
Primary:
ACCUMULATOR_VS_RETURN_CONFUSION

Secondary:
FUNCTION_CONTRACT_MISSING
COMPOSITION_RULE_INCORRECT
```

能力や適性を示す文章は禁止してください。

---

# 6. Learning Task Types

次を実装してください。

```java
public enum LearningTaskType {
    KNOWN_RECONSTRUCTION,
    MICRO_SKILL_DRILL,
    ISOMORPHIC_TRANSFER,
    NEAR_TRANSFER,
    CONTRAST_DISCRIMINATION,
    DELAYED_RETENTION,
    COLD_SOLVE,
    ERROR_REPAIR
}
```

Task TemplateをDB seedまたはresource fileで定義できるようにしてください。

例:

```java
public record LearningTaskTemplate(
    String id,
    LearningTaskType taskType,
    ReasoningProfileType profile,
    String title,
    String prompt,
    Set<MicroSkill> targetSkills,
    List<CheckpointDefinition> checkpoints,
    List<String> hiddenTags,
    String sourceProblemSlug,
    DifficultyLevel difficulty,
    String expectedReasoningSummary
) {}
```

最初は手動seedで構いません。

---

# 7. MicroSkill

最低限次を追加してください。

```java
public enum MicroSkill {
    RELATION_ABSTRACTION,
    FUNCTION_CONTRACT,
    BASE_CASE,
    SUBPROBLEM_DECOMPOSITION,
    RETURNED_INFORMATION,
    COMPOSITION_RULE,
    ACCUMULATOR_VS_RETURN,
    LOCAL_VS_GLOBAL_ANSWER,
    STATE_REPRESENTATION,
    RESOLUTION_EVENT,
    TARGET_REGION,
    REQUIRED_OPERATION,
    DATA_STRUCTURE_SELECTION,
    INVARIANT_FORMULATION,
    CORRECTNESS_ARGUMENT,
    COMPLEXITY_ANALYSIS,
    IMPLEMENTATION_TRANSLATION,
    TRANSFER_RECOGNITION,
    PATTERN_DISCRIMINATION
}
```

FailureLabelまたはBottleneckからMicroSkillへ対応できるようにしてください。

---

# 8. 最低限追加するTask Seed

## 8.1 Two Sum

### A. Relation Micro Drill

Title:

```text
Two Sum — Relation First
```

Prompt:

```text
コードやデータ構造名を書く前に、
異なる2要素が満たす関係を式または一文で書いてください。
```

Target:

```text
RELATION_ABSTRACTION
```

### B. Movie Ticket Isomorphic Transfer

```text
映画チケット価格の配列と予算が与えられる。
異なる2枚のチケットの合計が予算と等しい場合、
その位置を返してください。
```

最初のcheckpoint:

```text
prices[i] + prices[j] = budget
i != j
```

Tagは隠す。

### C. Product Price Isomorphic Transfer

Two Sumと同じ構造だが、別ストーリーにする。

### D. Contrast Discrimination

比較:

```text
Two Sum
Two Sum II
Subarray Sum Equals K
```

判断軸:

- 未ソートか
- ソート済みか
- 2要素か
- 連続区間か
- 必要な相手を計算できるか

---

## 8.2 Maximum Depth

### A. Four-line Contract

```text
この関数が返すもの:
最小入力と答え:
小さい同型問題:
子の答えの合成:
```

### B. Error Repair

今回の誤コードを提示し、完成コードを書く前に問題点を説明させる。

### C. Count Nodes Transfer

期待:

```text
contract:
部分木のnode数

base:
null -> 0

composition:
1 + left + right
```

### D. Minimum Depth Near Transfer

Maximum Depthのコードをそのまま使えない理由を測る。

### E. Balanced Tree Transfer

親がheightとbalanced判定を必要とすることを測る。

### F. Composition Discrimination

比較:

```text
Maximum Depth:
1 + max(left, right)

Count Nodes:
1 + left + right

Diameter:
親へ返すheightと、全体bestを分ける
```

---

# 9. Two Sum R1からR2への接続

次の既存結果を想定してください。

```text
Prior exposure:
以前解いたことがある

Outcome:
既知問題の再構築成功

Problem Relation:
score 0
Hint Level 1

Other Lookup stages:
mostly independent

Transfer:
未測定またはpartial
```

この結果から次を選んでください。

```text
Primary next task:
Two Sum — Relation First
```

成功後:

```text
Movie Ticket Isomorphic Transfer
```

要件:

- 抽象的な「同型問題を解いてください」だけで終わらせない
- Task titleを表示する
- 目的を表示する
- 成功条件を表示する
- 開始ボタンを表示する
- Pattern tagを隠す
- 既に自力だった全工程を再入力させない
- Relation checkpointを先に測る

---

# 10. Maximum DepthからR2への接続

次のEvidenceを想定してください。

```text
以前Acceptedしたことがある
今回未完了
左右への再帰は書けた
count引数へ蓄積しようとした
子の戻り値を合成できなかった
```

Task Selection順:

1. `ERROR_REPAIR`
2. `MICRO_SKILL_DRILL`のFour-line Contract
3. Count Nodes `ISOMORPHIC_TRANSFER`
4. Minimum Depth `NEAR_TRANSFER`
5. `DELAYED_RETENTION`

同じMaximum Depthの完成コードを何度もコピーさせないでください。

---

# 11. Next Task Selection Rule

優先順位:

1. Data quality不足
   - Quick Assessment
2. 明確な上流MicroSkill failure
   - Micro Skill Drill
3. 既知問題を再構築、transfer未測定
   - Isomorphic Transfer
4. Transfer成功、識別未測定
   - Contrast Discrimination
5. Retention期限到来
   - Delayed Retention
6. 同じfailureが反復
   - Error Repair
7. 全て成功
   - Near Transfer

Primary next taskは最大1件にしてください。

Secondary候補は最大2件、折りたたみ表示にしてください。

---

# 12. Post-Attempt Summary

結果画面は次を表示してください。

1. 今回確認できたこと
2. まだ作れなかったこと
3. Primary Failure Signature
4. 次に行う具体的Task 1件
5. Taskの目的
6. 成功条件
7. 次回予定

Maximum Depth例:

```text
今回確認できたこと
✓ Treeを左右へ再帰する方針は出せた
✓ base caseが必要だと認識できた

まだ作れなかったこと
・再帰関数が返す値の契約
・左右の戻り値の合成
・共有countではなくreturn valueを使う判断

Primary
共有countへ蓄積しようとし、
各部分木の答えをreturnで親へ返せなかった

次Task
Maximum Depth Error Repair

その次
Count Nodes Transfer
```

Two Sum例:

```text
Primary
関係の抽出

次Task
Movie Ticket Pair — Relation First

成功条件
データ構造名を書く前に、
prices[i] + prices[j] = budget、i != jを自力で表現
```

---

# 13. Mastery

次を実装または既存modelへ統合してください。

```java
public enum MasteryState {
    EXPOSED,
    RECONSTRUCTED,
    MICRO_SKILL_DEMONSTRATED,
    TRANSFERRED,
    DISCRIMINATED,
    RETAINED
}
```

ルール:

- 過去Accepted回数だけでRETAINEDにしない
- 既知問題の再構築はRECONSTRUCTED
- Count Nodesへの転用でTRANSFERRED
- Minimum Depthとの差を説明できればDISCRIMINATED
- 時間を空けたcold reconstructionでRETAINED

---

# 14. ReviewSchedule

Maximum Depthの推奨:

```text
当日:
Four-line Contract

翌日:
Count Nodes

4日後:
Minimum Depth

7日後:
Balanced Tree

14日後:
Maximum Depth cold reconstruction

21日後:
Diameter
```

既知問題へ同じ問題だけを過剰に再出題しないでください。

Two Sumでは、same-problem reviewよりRelation DrillとIsomorphic Transferを優先してください。

---

# 15. UI要件

## Workspace

ProfileのREQUIRED stageだけを初期表示する。

- OPTIONALは展開
- NOT_APPLICABLEは非表示
- 詳細画面でCanonical mappingを表示可能

## Outcome Badge

- 自力
- 一部できた
- ヒント後にできた
- 未解決
- 未評価
- 対象外

数字scoreを主表示にしない。

## Next Task Card

表示:

- Task title
- Task type
- Target MicroSkill
- なぜこれが次なのか
- 成功条件
- 開始ボタン

---

# 16. Migrationと互換性

- 既存データを削除しない
- CognitiveStage enumを破壊的にrenameしない
- Flywayを使う
- legacy scoreとHintUsageを安全に変換する
- 曖昧なscore 1は`PARTIAL + UNKNOWN_LEGACY`
- NOT_APPLICABLEをfailure扱いしない
- H2/local DBでmigrationを検証する

---

# 17. Test

## Unit

- StageOutcomeとAssistanceSource表示
- `PARTIAL + NONE`が「一部できた」
- NOT_APPLICABLEがAnalytics分母から除外
- Recursive Profile stage mapping
- Maximum Depthのrequired/optional/not applicable
- Accumulator vs Return failure detection
- Two Sum Relation next-task rule
- Maximum Depth next-task rule
- Mastery transition

## Integration

- migration
- legacy Attempt読込
- Two Sum R1 evidenceからR2 Task生成
- Maximum Depth Attempt保存
- Task Template seed
- ReviewSchedule連携
- Post-Attempt Summary

## MVC

- Profile固有Workspace
- Four-line Contract
- Error Repair
- concrete next task card
- OutcomeとAssistanceの表示
- Task success criteria
- compact stage map

## Regression

- Two Sum
- Daily Temperatures
- existing Analytics
- ReviewSchedule
- FailureLabel
- Post-Attempt画面
- local DB migration

---

# 18. 完了条件

- `./mvnw test`が成功する
- Maximum DepthでRecursive Profileが表示される
- Two SumのRelation failureから具体Taskを出せる
- score 1とHint使用を混同しない
- Maximum Depthの誤コードをError Repairに使える
- Count NodesへTransferできる
- Minimum DepthをNear Transferとして予定できる
- 未評価と対象外をfailure扱いしない
- 既存データを保持する
- OpenAI APIを追加していない

---

# 19. 実装後の報告

以下を報告してください。

1. 変更ファイル
2. migration
3. Data model変更
4. StageOutcomeとAssistanceSource
5. Reasoning Profile
6. Maximum Depth vertical slice
7. Recursive Failure Signatures
8. Task Template seed
9. Two Sumからのnext-task生成
10. Maximum Depthからのnext-task生成
11. Post-Attempt変更
12. AnalyticsとMastery
13. legacy互換性
14. 手動確認手順
15. 実行したcommand
16. test結果
17. R2に残った未実装項目
