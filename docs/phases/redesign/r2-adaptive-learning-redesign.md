# R2 Adaptive Learning Redesign

## 0. 目的

R2は、問題数を増やすだけではなく、次を実現する。

1. 問題ごとに必要な思考工程だけを測る
2. 「解けなかった」を具体的な停止地点へ分解する
3. 既知問題の再構築、未知同型問題への転用、類似問題との識別を分ける
4. Attempt結果から次の具体的な課題を1件選ぶ
5. 同じ問題の反復ではなく、保持・転用・識別を育てる
6. OpenAI APIや外部LLMなしで動作する

前提:

- Phase 8
- `phase8-patch.md`
- Post-Attempt redesign
- 既存のAttempt、StageAssessment、HintUsage、FailureLabel、ReviewSchedule、RuleBasedCoach、Analytics

---

# 1. R1から分かったこと

## 1.1 Two Sum

R1結果:

```text
事前接触:
以前解いたことがある

結果:
既知問題の再構築成功

自力:
Brute force
重複処理
保持状態
確定イベント
状態の対象部分
必要操作
データ構造
不変条件
正しさ・計算量

問題の関係:
score 0
Hint Level 1
```

確認できたこと:

```text
既知のTwo Sumについて、主要な解法構造を再構築できた
```

未確認:

```text
未知の見た目からHash Lookupを発見できるか
Two Sum IIやPrefix Sum問題と区別できるか
```

主な停止地点:

```text
問題文を、数式または要素間の関係へ変換する工程
```

R2の次課題は、単に「別のHashMap問題」ではなく、関係抽出を最初の測定点にする。

例:

```text
映画チケット価格の配列と予算が与えられる。
異なる2枚の合計が予算になる場合、その位置を返す。
```

最初のcheckpoint:

```text
データ構造やコードを書く前に、
異なる2要素が満たす関係を一文または式で書く。
```

期待:

```text
prices[i] + prices[j] = budget
i != j
```

---

## 1.2 Maximum Depth of Binary Tree

今回書いたコードでは、左右への再帰は認識できていた。

一方、次を作れなかった。

```text
maxDepth(node)が何を返す関数か
nullの答えは何か
子の戻り値を親でどう合成するか
```

具体的な停止地点:

```text
RECURSIVE_FUNCTION_CONTRACT
RECURSIVE_RETURN_COMPOSITION
ACCUMULATOR_VS_RETURN_VALUE
```

確認できたこと:

```text
Treeでは左右へ再帰する
base caseが必要
子nodeを処理する
```

不足していたこと:

```text
Function contract:
f(node)はnodeを根とする部分木の答えを返す

Base case:
f(null) = 0

Subproblems:
left = f(node.left)
right = f(node.right)

Composition:
1 + max(left, right)
```

---

# 2. 現在の13工程の限界

現在の13工程は、Two Sum、Sliding Window、Monotonic Stackのような、走査中に状態を保持・更新する問題には適用しやすい。

Maximum Depthのような再帰問題では、以下が不自然になる。

- Brute force
- 重複処理
- 状態の参照・更新対象
- 明示的なデータ構造選択

全問題へ同じ質問を強制すると、対象外工程が0点になり、本当の停止地点が埋もれる。

R2では、Canonical StageはAnalytics用に維持しつつ、問題ごとのReasoning Profileで表示内容と必須性を変更する。

---

# 3. Reasoning Profile

```java
public enum ReasoningProfileType {
    LOOKUP_STATE,
    ITERATIVE_FRONTIER,
    SLIDING_WINDOW,
    ORDERED_TWO_POINTER,
    BINARY_SEARCH,
    RECURSIVE_DIVIDE_AND_COMBINE,
    BACKTRACKING_SEARCH,
    GRAPH_TRAVERSAL,
    DYNAMIC_PROGRAMMING,
    GREEDY_DECISION,
    INTERVAL_PROCESSING,
    GENERIC
}
```

R2の最初の必須対象:

- `LOOKUP_STATE`
- `RECURSIVE_DIVIDE_AND_COMBINE`

Two Sum:

```text
LOOKUP_STATE
```

Maximum Depth:

```text
RECURSIVE_DIVIDE_AND_COMBINE
```

---

## 3.1 Profile Stage Definition

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

```java
public enum StageApplicability {
    REQUIRED,
    OPTIONAL,
    NOT_APPLICABLE
}
```

ルール:

- `NOT_APPLICABLE`は0点ではない
- Analyticsの分母へ含めない
- FailureLabelを生成しない
- 初期UIでは非表示
- Canonical Stageへのmappingは維持する

---

# 4. Recursive Divide-and-Combine Profile

## 4.1 再帰関数の契約

表示名:

```text
再帰関数の契約
```

質問:

```text
この関数は、現在のnodeまたは部分問題に対して何を返しますか？
```

Maximum Depth:

```text
maxDepth(node)は、nodeを根とする部分木の最大深さを返す。
```

Canonical mapping:

```text
PROBLEM_RELATION
```

---

## 4.2 最小入力と答え

表示名:

```text
最小入力と答え
```

質問:

```text
これ以上分解できない最小入力は何で、その答えは何ですか？
```

Maximum Depth:

```text
node == nullなら0
```

Canonical mapping:

```text
RESOLUTION_EVENT
```

---

## 4.3 同じ形の部分問題

質問:

```text
現在の問題を、どの小さい同型問題に分けますか？
```

Maximum Depth:

```text
左部分木の最大深さ
右部分木の最大深さ
```

Canonical mapping:

```text
UPDATED_REGION
```

表示名は「状態の参照・更新対象」ではなく、「同じ形の部分問題」とする。

---

## 4.4 子から受け取る情報

質問:

```text
各部分問題は、親が答えを作るために何を返す必要がありますか？
```

Maximum Depth:

```text
左部分木の最大深さ
右部分木の最大深さ
```

Canonical mapping:

```text
UNRESOLVED_STATE
```

---

## 4.5 子の答えの合成

質問:

```text
子から返った答えを、現在のnodeでどう組み合わせますか？
```

Maximum Depth:

```text
1 + max(leftDepth, rightDepth)
```

Canonical mapping:

```text
REQUIRED_OPERATIONS
```

---

## 4.6 値をどこで持つか

質問:

```text
答えは共有変数へ蓄積しますか、それとも各呼び出しが戻り値として親へ返しますか？
```

Maximum Depth:

```text
各呼び出しが自分の部分木の深さをreturnする
```

選択肢:

```text
RETURN_VALUE
ACCUMULATOR
PATH_STATE
GLOBAL_BEST
MULTIPLE_RETURN_VALUES
NOT_SURE
```

Canonical mapping:

```text
DATA_STRUCTURE_SELECTION
```

Profile上では、データ構造ではなく情報伝達方式の選択として扱う。

---

## 4.7 各呼び出しが保証すること

質問:

```text
任意のnodeに対して、この関数が必ず返すものは何ですか？
```

Maximum Depth:

```text
maxDepth(node)はnodeを根とする部分木の正しい最大深さを返す
```

Canonical mapping:

```text
INVARIANT
```

---

## 4.8 再帰が正しい理由

質問:

```text
base caseが正しく、左右の部分問題が正しい答えを返すと仮定したとき、
現在nodeの答えが正しいのはなぜですか？
```

Maximum Depth:

```text
nullの深さは0。
左右が正しい深さを返すなら、
現在nodeを含む最大深さは長い方に1を加えたものになる。
```

Canonical mapping:

```text
CORRECTNESS_AND_COMPLEXITY
```

---

## 4.9 Maximum Depthで任意・対象外にする工程

### BRUTE_FORCE

`OPTIONAL`

表示する場合:

```text
最も直接的な正しい方法
```

期待:

```text
全nodeをDFSまたはBFSで一度ずつ調べる
```

### REPEATED_WORK

`NOT_APPLICABLE`

標準的な再帰解では、重複部分問題がない。

### 明示的なData Structure

再帰call stackを補足表示するが、HashMapやStackの選択問題として強制しない。

---

# 5. 次回と類似問題へつなげるTransfer Ladder

同じMaximum Depthを10回書くのではなく、次の順序で練習する。

## Level 1: Contract Reconstruction

コードなしで4行だけ回答する。

```text
Function contract:
Base case:
Subproblems:
Composition:
```

Maximum Depthの期待:

```text
Function contract:
f(node)はこの部分木の最大深さを返す

Base case:
f(null) = 0

Subproblems:
f(node.left), f(node.right)

Composition:
1 + max(left, right)
```

---

## Level 2: Same Skeleton, Different Composition

教材用のCount Nodes:

```text
contract:
f(node)は部分木のnode数を返す

base:
null -> 0

subproblems:
leftCount, rightCount

composition:
1 + leftCount + rightCount
```

目的:

Maximum Depthのコード暗記ではなく、戻り値と合成規則を作れるか確認する。

---

## Level 3: Similar but Important Edge Case

問題:

```text
Minimum Depth of Binary Tree
```

目的:

単純な`1 + min(left, right)`では片方がnullのとき誤るため、意味から合成規則を作れるか確認する。

---

## Level 4: Multiple Returned Facts

問題:

```text
Balanced Binary Tree
```

目的:

親が必要とする情報からreturn valueの形を逆算する。

---

## Level 5: Local Answer and Global Best

問題:

```text
Diameter of Binary Tree
```

区別:

```text
親へ返すもの:
下向きの最大height

全体で更新するもの:
leftHeight + rightHeight
```

目的:

return valueとglobal answerを区別する。

---

## 推奨Schedule

```text
当日:
Maximum Depthの4行contract

翌日:
Count Nodes

4日後:
Minimum Depth

7日後:
Balanced Binary Tree

14日後:
Maximum Depthをタグなしcold reconstruction

21日後:
Diameter of Binary Tree
```

---

# 6. Recursive Failure Signatures

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

Maximum Depthの今回の候補:

```text
Primary:
ACCUMULATOR_VS_RETURN_CONFUSION

Secondary:
FUNCTION_CONTRACT_MISSING
COMPOSITION_RULE_INCORRECT
NULL_SAFETY_MISSING
```

Primaryは最大1件、Secondaryは最大2件。

---

# 7. OutcomeとAssistanceを分ける

R1では次の矛盾がある。

```text
実装:
ヒントあり

Hint:
なし
```

score 1を自動的に「ヒントあり」と表示してはいけない。

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

表示:

```text
INDEPENDENT + NONE
→ 自力

PARTIAL + NONE
→ 一部できた

PARTIAL + HINT
→ ヒント後に一部できた

INDEPENDENT + ANSWER_EXAMPLE
→ 回答例確認後に再構築

BLOCKED + HINT
→ ヒントを使ったが未解決

UNASSESSED
→ 未評価
```

---

# 8. Two SumのR1結果をR2へ接続する

## 8.1 Evidence

```text
Known reconstruction:
成功

Primary bottleneck:
PROBLEM_RELATION
score 0
Hint Level 1

Other lookup stages:
mostly independent

Transfer:
未測定
```

## 8.2 次Task

```text
Task Type:
ISOMORPHIC_TRANSFER

Target Profile:
LOOKUP_STATE

Target Micro-skill:
RELATION_ABSTRACTION

Tag Visibility:
HIDDEN

Required Checkpoint:
問題の関係を先に回答
```

Task例:

```text
映画チケット価格の配列と予算が与えられる。
異なる2枚のチケットの合計が予算と等しい場合、
その位置を返してください。
```

最初の質問:

```text
データ構造やコードを書く前に、
2つの要素が満たす関係を式または一文で書いてください。
```

成功条件:

```text
Relation:
independent

Pattern tag:
hidden

Required operations:
lookup by keyまで自力

Data structure:
HashMapを理由付きで選択
```

既に自力で確認済みの全工程を毎回再入力させない。

---

## 8.3 その次のDiscrimination

タグなしで次を比較する。

```text
A:
未ソート配列から合計targetの異なる2要素
Expected:
Lookup State

B:
ソート済み配列から合計targetの2要素
Expected:
Ordered Two Pointer

C:
合計Kとなる連続部分配列の個数
Expected:
Prefix Sum + Lookup
```

判断軸:

```text
現在位置から必要な相手を直接計算できるか
入力の順序を利用できるか
対象が2要素か連続区間か
```

---

# 9. Learning Task Types

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

説明:

- `KNOWN_RECONSTRUCTION`: 既知問題の再構築
- `MICRO_SKILL_DRILL`: 停止工程だけ練習
- `ISOMORPHIC_TRANSFER`: 見た目が違い本質が同じ
- `NEAR_TRANSFER`: 条件や合成規則が一部違う
- `CONTRAST_DISCRIMINATION`: 似た問題を識別
- `DELAYED_RETENTION`: 時間を空けて再構築
- `COLD_SOLVE`: タグなし・補助なし
- `ERROR_REPAIR`: 誤コードを説明して修正

Maximum Depthの今回の誤コードはError Repair教材として保存する。

---

# 10. MicroSkill

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

Stageより細かい停止地点を記録する。

---

# 11. Next Task Selection

優先順位:

1. データ品質不足
   - Quick Assessment
2. 上流MicroSkill failure
   - Micro Skill Drill
3. 既知問題の再構築成功、transfer未測定
   - Isomorphic Transfer
4. Transfer成功、識別未測定
   - Contrast Discrimination
5. Retention期限到来
   - Delayed Retention
6. 同じfailureが反復
   - Error Repair
7. 全て成功
   - Near Transfer

## Two Sum rule

```text
PriorExposure in {SOLVED_BEFORE, MEMORISED}
FinalResult = SOLVED_INDEPENDENTLY
PROBLEM_RELATION = BLOCKED
other lookup stages mostly INDEPENDENT
```

次:

```text
Relation Micro Skill Drill
→ Movie Ticket Isomorphic Transfer
```

## Maximum Depth rule

```text
PriorExposure = SOLVED_BEFORE
FinalResult = NOT_SOLVED
Recursive calls present
Return composition absent
Accumulator attempted
```

次:

```text
Error Repair
→ Four-line Contract
→ Count Nodes Transfer
```

---

# 12. Task Template

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

最初は手動seedでよい。

最低限追加するTask:

## Lookup State

1. Two Sum relation drill
2. Movie tickets isomorphic transfer
3. Product prices isomorphic transfer
4. Two Sum / Two Sum II / Subarray Sum discrimination

## Recursive Divide-and-Combine

1. Maximum Depth four-line contract
2. Maximum Depth error repair
3. Count Nodes transfer
4. Minimum Depth near transfer
5. Balanced Tree transfer
6. Maximum Depth / Count Nodes / Diameter composition discrimination

---

# 13. Post-Attempt Summary

Maximum Depth失敗例:

```text
今回確認できたこと
✓ Treeを左右へ再帰する方針は出せた
✓ base caseが必要だと認識できた

まだ作れなかったこと
・再帰関数が返す値の契約
・左右の戻り値の合成
・共有countではなくreturn valueを使う判断

Primary Failure Signature
共有countへ蓄積しようとし、
各部分木の答えをreturnで親へ返せなかった

次Task
Maximum Depth Error Repair

その次
Count Nodes Transfer
```

Two Sum:

```text
Primary:
関係の抽出

次Task:
Movie Ticket Pair — Relation First

成功条件:
データ構造名を書く前に、
prices[i] + prices[j] = budget、i != jを自力で表現
```

「同型問題を解いてください」だけで終わらせず、開始できる具体Taskを表示する。

---

# 14. Mastery

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

過去Accepted回数だけでRETAINEDにしない。

Maximum Depth:

```text
過去Accepted:
EXPOSEDまたはRECONSTRUCTEDの証拠

今回Cold reconstruction失敗:
RETAINEDではない
```

Tree Recursion:

```text
Maximum Depth再現:
RECONSTRUCTED

Count Nodes:
TRANSFERRED

Minimum Depthとの差:
DISCRIMINATED

14日後にも再構築:
RETAINED
```

---

# 15. Holdout

Holdout問題は事前に学習画面へ表示しない。

R2では次を併用する。

1. ストーリーを変えた教材用isomorphic task
2. タグを隠したNeetCode問題
3. Pattern混合queue
4. 接触済み問題をholdout候補から除外

---

# 16. UI

## Workspace開始時

```text
この問題への接触:
初見
見たことがある
以前解いた
かなり覚えている
```

Maximum Depthでは最初に次を表示する。

```text
この関数が返すもの:
最小入力と答え:
小さい同型問題:
子の答えの合成:
```

## Stage表示

- REQUIREDだけ初期表示
- OPTIONALは展開
- NOT_APPLICABLEは非表示
- 詳細でCanonical mappingを確認可能

## Outcome表示

- 自力
- 一部できた
- ヒント後にできた
- 未解決
- 未評価
- 対象外

---

# 17. 実装順序

## R2.1 Assessment Semantics

- StageOutcome
- AssistanceSource
- score 1表示修正
- NOT_APPLICABLE
- legacy compatibility

## R2.2 Reasoning Profiles

- Profile model
- ProfileStageDefinition
- LOOKUP_STATE
- RECURSIVE_DIVIDE_AND_COMBINE

## R2.3 Recursive Vertical Slice

- Maximum Depth
- Function Contract
- Base Case
- Subproblems
- Composition
- Accumulator vs Return
- Failure Signatures

## R2.4 Task Templates

- Micro Skill Drill
- Isomorphic Transfer
- Discrimination
- Error Repair
- seed

## R2.5 Next Task Selection

- rule-based selector
- concrete next task
- ReviewSchedule integration

## R2.6 Mastery and Holdout

- mastery states
- transfer/discrimination metrics
- holdout consumption

## R2.7 NeetCode 150 Expansion

ProfileとTask Selectionが安定してからCatalogueを拡張する。

問題数の拡張を先にしない。

---

# 18. Acceptance Criteria

## Maximum Depth

- Recursive Profileが選択される
- Brute ForceとRepeated Workが強制されない
- Function Contractを最初に回答する
- Base Caseを独立して記録する
- Composition Ruleを独立して記録する
- Accumulator vs Returnを記録する
- 誤コードをError Repairに使える
- 次TaskにCount Nodesを選べる
- Minimum DepthをNear Transferにできる

## Two Sum

- R1のRelation failureをR2へ引き継ぐ
- 次Taskが具体的に表示される
- Relation checkpointを最初に測る
- 自力確認済み工程を全部再入力させない
- Two Sum II / Subarray Sumとの識別Taskを出せる

## Assessment

- score 1を自動で「ヒントあり」にしない
- PARTIAL + NONEを「一部できた」と表示する
- NOT_APPLICABLEを0点扱いしない
- FailureLabelは具体的MicroSkillを示す

## Next Task

- Primary next taskは最大1件
- title、目的、成功条件を表示する
- same-problem repetitionを過剰に選ばない
- transfer、discrimination、retentionを区別する

---

# 19. 非対象

- OpenAI API
- 自動semantic grading
- 問題文の自動取得
- LeetCode submission API
- code execution sandbox
- 全NeetCode 150問題のProfile定義
- 他ユーザー比較
- leaderboard

---

# 20. 実装後の報告

- 変更ファイル
- migration
- StageOutcomeとAssistanceSource
- Reasoning Profile
- Maximum Depth vertical slice
- Two Sum R1 evidenceの引継ぎ
- Task Template seed
- Next Task Selection
- Post-Attempt変更
- Mastery
- legacy data互換性
- 手動確認手順
- test commandと結果
- 未実装項目
