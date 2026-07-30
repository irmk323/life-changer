# Phase 11: Implementation Reliability — 「分かっているのに実装で間違う」を減らす仕組み

## 1. 実装前の指示

このPhaseを開始する前に、必ず以下を最初から最後まで確認してください。

- `AGENTS.md`
- `docs/product-spec.md`
- `docs/architecture.md`
- `docs/data-model.md`
- `docs/implementation-plan.md`
- `docs/decisions.md`
- これまでに実装済みのPhase指示
- 既存のAttempt、StageAssessment、Hint、FailureLabel、ReviewSchedule、RuleBasedCoach、Dashboard、Analytics
- 既存のFlyway migration
- 既存のテスト
- `phase8-patch.md`が存在する場合はその内容

このPhaseはOpenAI APIや外部AIを前提にしません。

以下は今回の対象外です。

- OpenAI API
- 外部LLM
- AIによるコード採点
- LeetCode submission API
- コード実行sandbox
- ブラウザ上での任意Javaコード実行
- 自動修正
- 完成コードの自動生成

このPhaseの目的は、ユーザーがアルゴリズムやデータ構造を概ね理解しているにもかかわらず、コードへ翻訳する段階で同じ種類のミスを繰り返す問題を、観測・分類・復習できるようにすることです。

---

# 2. 背景

現在のアプリでは、次のような失敗がすべて`IMPLEMENTATION`の低得点としてまとめられる可能性があります。

- Stackを使うことは分かっているが、Dequeの異なる端を使う
- 正しくmatchしてpopした後も、`return false`へfall-throughする
- 空Stackで閉じ括弧が来るedge caseを忘れる
- `lookup before insert`の順序を逆にする
- loop boundaryを1つ間違える
- base caseを忘れる
- algorithmは説明できるが、APIの意味を混同する

これらは、次と同じではありません。

```text
そもそもStackを選べない
保持状態を説明できない
不変条件が分からない
```

アプリ上では、少なくとも以下を分けて管理してください。

```text
Conceptual understanding:
何を保持し、なぜそのdata structureなのかを説明できるか

Implementation translation:
説明した操作を、正しいAPIとcontrol flowへ変換できるか

Implementation reliability:
同じ実装を、別の日や少し異なる条件でも再現性高く書けるか
```

---

# 3. 最重要方針

## 3.1 「理解した」と「安定して実装できる」を分ける

同じAttempt内でも、以下を独立して記録してください。

- reasoning mastery
- implementation completion
- implementation correctness
- first-pass correctness
- edge-case correctness
- error category
- self-detection
- correction after test
- correction after hint
- clean reimplementation

## 3.2 失敗を人格評価にしない

表示してよい表現:

```text
Stack選択と不変条件は説明できています。

今回の停止点は、
Dequeの追加・参照・削除で同じ端を使う操作への翻訳でした。
```

```text
前回と同じEMPTY_STATE_CHECK_MISSINGが再発しました。
次回はコード前チェックに「空の状態で閉じ入力」を追加します。
```

避ける表現:

```text
実装力がありません。
初歩的なミスです。
エンジニアに向いていません。
10回やってもできていません。
```

## 3.3 問題を解き直すだけにしない

同じ問題を丸ごと10回繰り返しても、エラーの原因が曖昧なままでは再発します。

復習単位を次へ細分化してください。

```text
問題全体
→ cognitive stage
→ implementation contract
→ error fingerprint
→ minimal regression case
→ clean reimplementation
```

---

# 4. Domain model

## 4.1 ImplementationRecord

既存の`StageAssessment`の`IMPLEMENTATION`を補完するentityとして、以下に相当するmodelを追加してください。

推奨フィールド:

- `id`
- `attemptId`
- `stageAssessmentId`
- `language`
- `implementationStatus`
- `firstPassCompiled`
- `firstPassPassedBasicCases`
- `firstPassPassedEdgeCases`
- `finalImplementationCompleted`
- `selfDetectedError`
- `usedHint`
- `usedExternalSolution`
- `compileErrorCount`
- `wrongAnswerCount`
- `runtimeErrorCount`
- `timeoutCount`
- `startedAt`
- `firstSubmissionAt`
- `correctedAt`
- `durationSeconds`
- `notes`
- `createdAt`
- `updatedAt`

### ImplementationStatus

- `NOT_STARTED`
- `IN_PROGRESS`
- `COMPILES_BUT_UNVERIFIED`
- `FAILED_BASIC_CASE`
- `FAILED_EDGE_CASE`
- `RUNTIME_ERROR`
- `CORRECT_AFTER_SELF_DEBUG`
- `CORRECT_AFTER_HINT`
- `CORRECT_AFTER_SOLUTION`
- `CORRECT_FIRST_PASS`
- `ABANDONED`

## 4.2 ImplementationError

1回のAttemptで複数エラーを記録できるentityとして実装してください。

推奨フィールド:

- `id`
- `implementationRecordId`
- `errorType`
- `errorSource`
- `severity`
- `description`
- `failingInput`
- `expectedOutput`
- `actualOutput`
- `rootCause`
- `correction`
- `preventionRule`
- `detectedAt`
- `correctedAt`
- `recurrenceOfErrorId` nullable
- `createdAt`
- `updatedAt`

### ErrorSource

- `SELF_REVIEW`
- `MANUAL_TEST`
- `COMPILER`
- `LEETCODE_RESULT`
- `HINT`
- `SOLUTION_COMPARISON`
- `OTHER`

### ErrorSeverity

- `LOW`
- `MEDIUM`
- `HIGH`

## 4.3 ImplementationErrorType

最低限、以下をseedまたはenumとして実装してください。

### Data structure operation

- `WRONG_DATA_STRUCTURE_OPERATION`
- `WRONG_END_OR_DIRECTION`
- `PEEK_POP_MISMATCH`
- `INSERT_LOOKUP_ORDER`
- `MUTATION_ORDER`
- `STATE_NOT_UPDATED`
- `STATE_UPDATED_TOO_EARLY`
- `STATE_UPDATED_TOO_LATE`

### Control flow

- `WRONG_RETURN_PLACEMENT`
- `UNINTENDED_FALLTHROUGH`
- `MISSING_ELSE_OR_GUARD`
- `EARLY_RETURN`
- `MISSING_CONTINUE`
- `WRONG_BRANCH_CONDITION`

### Empty / boundary / edge case

- `EMPTY_STATE_CHECK_MISSING`
- `NULL_HANDLING`
- `OFF_BY_ONE`
- `LOOP_BOUNDARY`
- `SINGLE_ELEMENT_CASE`
- `DUPLICATE_VALUE_CASE`
- `UNMATCHED_REMAINDER`
- `BASE_CASE_MISSING`
- `OVERFLOW`
- `INVALID_INPUT_ASSUMPTION`

### API / language translation

- `API_SEMANTICS_CONFUSION`
- `TYPE_OR_UNBOXING_ERROR`
- `SYNTAX_ERROR`
- `WRONG_METHOD`
- `WRONG_VARIABLE`
- `INDEX_VALUE_CONFUSION`
- `REFERENCE_VALUE_CONFUSION`

### Algorithm translation

- `INVARIANT_NOT_PRESERVED`
- `REQUIRED_OPERATION_MISSING`
- `CORRECTNESS_CONDITION_MISTRANSLATED`
- `COMPLEXITY_REGRESSION`
- `PARTIAL_ALGORITHM_ONLY`

### Debugging

- `INSUFFICIENT_TEST_CASES`
- `FAILURE_NOT_LOCALIZED`
- `PATCH_WITHOUT_ROOT_CAUSE`
- `SAME_ERROR_RECURRED`
- `OTHER`

---

# 5. Valid Parenthesesのseed example

今回のようなコードを、このPhaseの代表例として教材へ追加してください。

## 5.1 Conceptual understandingとしてできていること

ユーザーが以下を説明できている場合、reasoning側は成功として扱います。

```text
保持状態:
まだ閉じ括弧と対応していない開き括弧

必要操作:
最新の開き括弧を追加する
最新の開き括弧を見る
対応したら最新の開き括弧を削除する

Data structure:
Stack

Invariant:
topは最も最近現れた未対応の開き括弧
```

## 5.2 実装エラー例1: Dequeの端が不一致

コード例:

```java
deque.add(current);
deque.peek();
deque.pop();
```

問題:

```text
addは末尾へ追加する一方、
peek/popは先頭を参照・削除するため、
同じ端をStackとして扱っていない。
```

Error types:

- `WRONG_END_OR_DIRECTION`
- `PEEK_POP_MISMATCH`
- `INVARIANT_NOT_PRESERVED`
- 必要に応じて`API_SEMANTICS_CONFUSION`

Minimal failing case:

```text
input: "([])"
expected: true
```

Prevention rule:

```text
Stackとして使う場合、
追加・参照・削除を同じ端へ統一する。

push / peek / pop
または
addLast / peekLast / pollLast
```

## 5.3 実装エラー例2: match後にもfalseへfall-through

コード例:

```java
if (matches) {
    stack.pop();
}
return false;
```

Error types:

- `WRONG_RETURN_PLACEMENT`
- `UNINTENDED_FALLTHROUGH`
- `CORRECTNESS_CONDITION_MISTRANSLATED`

Minimal failing case:

```text
input: "()"
expected: true
actual: false
```

Prevention rule:

```text
falseを返す条件を先に文章化する。

falseになるのは、
空なのに閉じ括弧が来た場合、
またはtopと閉じ括弧が対応しない場合だけ。
```

## 5.4 実装エラー例3: 空Stack確認なし

コード例:

```java
if (current == ')' && stack.peekLast() == '(') {
    ...
}
```

Error types:

- `EMPTY_STATE_CHECK_MISSING`
- `TYPE_OR_UNBOXING_ERROR`
- `INVALID_INPUT_ASSUMPTION`

Minimal failing case:

```text
input: "]"
expected: false
```

Prevention rule:

```text
Stackからpeek/popする前に、
空でないことをguard clauseで確認する。
```

## 5.5 実装成功後の確認ケース

最低限、以下をImplementation Checklistへseedしてください。

```text
"()"    -> true
"([])"  -> true
"(]"    -> false
"]"     -> false
"("     -> false
"([)]"  -> false
"{[]}"  -> true
```

それぞれの目的:

- `"()"`: 基本matchとreturn placement
- `"([])"`: LIFOと同じ端の使用
- `"(]"`: 種類の不一致
- `"]"`: empty guard
- `"("`: 未対応の開き括弧が残る
- `"([)]"`: nesting order
- `"{[]}"`: 複数種類の正しいnesting

---

# 6. Implementation Contract

コードを書く前に、短い実装契約を埋める仕組みを追加してください。

## 6.1 Contract fields

- `stateMeaning`
- `invariant`
- `inputCase`
- `actionWhenCaseMatches`
- `actionWhenCaseFails`
- `guardConditions`
- `finalCondition`
- `operations`
- `minimalTests`

Valid Parenthesesの例:

```text
State meaning:
まだ対応していない開き括弧

Invariant:
topは最も最近現れた未対応の開き括弧

開き括弧:
topへ追加

閉じ括弧:
空ならfalse
topと対応しなければfalse
対応すればtopを削除

Final condition:
Stackが空ならtrue

Operations:
push / peek / popを同じ端で使う
```

## 6.2 Contractの目的

```text
コード行を書く前に、
各branchでstateがどう変わるかを固定する。

実装後は、
コードがこのcontractをそのまま翻訳しているか確認する。
```

Contractを必須にするかはAttempt modeで切り替え可能にしてください。

推奨:

- initial learning: required
- reconstruction review: required
- cold solve: optional
- implementation repair review: required

---

# 7. Pre-submit Checklist

IMPLEMENTATION stageに、submit前の短いChecklistを追加してください。

## 7.1 Generic checklist

- 同じdata structureの追加・参照・削除は意図した場所に統一されているか
- peek/get/remove前に空・存在確認が必要ではないか
- false/trueを返す条件を文章で説明できるか
- success branchの後にfailure branchへfall-throughしないか
- state更新の順序は不変条件を壊さないか
- loop boundaryは全要素をちょうど必要回数処理するか
- 同じindexや要素を誤って再利用しないか
- 最後に未処理状態が残る場合を確認したか
- 最小入力を確認したか
- duplicateを確認したか
- nestedまたは順序依存caseを確認したか

## 7.2 Checklistの記録

各項目について以下を保存できること。

- checked
- not applicable
- missed but found later
- note

---

# 8. Minimal Test Matrix

問題ごとに、エラー原因を切り分ける最小テスト集合を持てるようにしてください。

## 8.1 TestCase model

- `id`
- `problemId`
- `name`
- `inputDescription`
- `expectedOutput`
- `purpose`
- `relatedErrorTypes`
- `displayOrder`
- `active`
- `createdAt`
- `updatedAt`

## 8.2 AttemptTestResult

- `id`
- `implementationRecordId`
- `testCaseId`
- `result`
- `actualOutput`
- `notes`
- `testedAt`

### TestResult

- `NOT_RUN`
- `PASSED`
- `FAILED`
- `RUNTIME_ERROR`
- `UNKNOWN`

このPhaseではアプリ内コード実行は不要です。

ユーザーがLeetCode、IDE、手動トレースで確認し、結果を記録する方式で構いません。

## 8.3 Testの目的を表示する

```text
"()"がfalse:
return placementまたは基本match branchを確認

"([])"がfalse:
LIFO、同じ端、nestingを確認

"]"で例外:
empty guardとnull/unboxingを確認
```

---

# 9. Error Fingerprint

同じ種類の実装ミスを、問題をまたいで追跡してください。

## 9.1 Error fingerprint page

最低限表示:

- error type
- 日本語表示名
- 説明
- 発生したProblem
- 発生日
- 初回発生
- 再発回数
- self-detected rate
- hintなし修正率
- 関連するminimal tests
- prevention rule
- 最後にclean implementationできた日
- 次のreview

## 9.2 Recurrence判定

同じErrorTypeが一定期間内に再度発生した場合:

- `SAME_ERROR_RECURRED`を追加
- `recurrenceOfErrorId`を関連付ける
- 前回との違いを表示する

---

# 10. Implementation Reliability Metrics

## 10.1 First-pass compile rate

```text
firstPassCompiled = trueのImplementation数
/
実装を開始したImplementation数
```

## 10.2 First-pass basic-case pass rate

```text
basic testを初回で全てpassしたImplementation数
/
basic testを実施したImplementation数
```

## 10.3 First-pass edge-case pass rate

```text
edge testを初回で全てpassしたImplementation数
/
edge testを実施したImplementation数
```

## 10.4 Self-debug rate

```text
外部Hintやsolution前に自力修正したImplementation数
/
初回で失敗したImplementation数
```

## 10.5 Clean reimplementation rate

```text
後日のreimplementationで、
Hintなし・errorなしで完了した回数
/
eligible reimplementation回数
```

## 10.6 Error recurrence rate

```text
過去に記録済みのErrorTypeが再発した件数
/
全ImplementationError件数
```

## 10.7 Explanation-to-code gap

reasoning core stageが基準達成しているのに、Implementationが失敗した割合。

推奨core stages:

- `UNRESOLVED_STATE`
- `UPDATED_REGION`
- `REQUIRED_OPERATIONS`
- `DATA_STRUCTURE_SELECTION`
- `INVARIANT`
- `CORRECTNESS_AND_COMPLEXITY`

0件の場合は0%ではなく`N/A`と表示してください。

## 10.8 Reliability status

- `NOT_MEASURED`
- `FRAGILE`
- `IMPROVING`
- `RELIABLE`
- `NEEDS_REPAIR`

Pattern masteryとは別表示にしてください。

例:

```text
Stack Matching reasoning:
RECONSTRUCTED

Stack Matching implementation reliability:
UNSTABLE
```

`RELIABLE`の推奨条件:

- 異なる日に2回以上
- Hintなし
- first-pass basic/edge case成功
- recurring errorなし
- 少なくとも1回は少し異なるvariant

---

# 11. Review scheduling

実装ミスには、問題全体の通常reviewとは別に`IMPLEMENTATION_REPAIR` reviewを追加してください。

## 11.1 AttemptType

- `IMPLEMENTATION_REPAIR`
- `CLEAN_REIMPLEMENTATION`
- `ERROR_DISCRIMINATION`

## 11.2 Review内容

### IMPLEMENTATION_REPAIR

- Implementation Contract
- 失敗したErrorType
- minimal failing case
- prevention rule
- 該当部分の再実装

13 stage全部をやり直す必要はありません。

### CLEAN_REIMPLEMENTATION

1〜4日後に、過去コードを見ずに最初から実装する。

### ERROR_DISCRIMINATION

同じErrorTypeが起こり得る小さなcode snippetを比較する。

## 11.3 Scheduling rule

- 当日: root cause記録、minimal test
- 翌日: `IMPLEMENTATION_REPAIR`
- 4日後: `CLEAN_REIMPLEMENTATION`
- 7日後: 同ErrorTypeの別snippetまたは別問題
- 21日後: cold implementation

既存reviewと同日に重複する場合は統合できるようにしてください。

---

# 12. UI改善

## 12.1 IMPLEMENTATION Workspace

表示順:

1. Implementation Contract
2. コード記録欄
3. Pre-submit Checklist
4. Minimal Test Matrix
5. 初回結果
6. Error identification
7. Root cause
8. Correction
9. Prevention rule
10. Final result

## 12.2 Error記録フォーム

- 何が起きたか
- 最小の失敗input
- expected
- actual
- ErrorType
- 原因
- どう直したか
- 次回の事前確認
- 自力で見つけたか
- Hintを使ったか

## 12.3 Attempt完了画面

```text
Reasoning

保持状態: 2
必要操作: 2
Data structure: 2
Invariant: 2

Implementation

First pass: failed
Self-debug: succeeded
Errors:
- WRONG_RETURN_PLACEMENT
- EMPTY_STATE_CHECK_MISSING

Final result:
Correct after self-debug

Next repair:
Tomorrow — Valid Parentheses minimal cases
```

## 12.4 Dashboard

追加:

- Explanation-to-code gap
- recurring ErrorType top 3
- first-pass edge-case pass rate
- self-debug rate
- clean reimplementation rate
- reliability status
- 今日のImplementation Repair

---

# 13. RuleBasedCoachの改善

Valid Parenthesesの今回のようなケースでは、以下の趣旨を返してください。

```text
Stack選択と「topは最新の未対応開き括弧」という考え方は説明できています。

今回の失敗はPattern認識ではなく、
その不変条件をDeque操作とcontrol flowへ翻訳する部分でした。

最初のコードでは追加・参照・削除の端が一致せず、
match後にもfalseへ進む構造になっていました。

修正後は同じ端へ統一し、
falseを不一致branchへ限定できています。

次回はコード前に、
「空ならfalse・不一致ならfalse・一致ならpop」
の3分岐を書いてから実装してください。
```

同じErrorType再発時:

```text
この問題を知らないことが原因ではありません。

WRONG_RETURN_PLACEMENTが直近3回中2回で発生しています。
次回の検証対象はアルゴリズム全体ではなく、
return条件をコード前に文章化した場合に再発が減るかです。
```

避ける表現:

- 根拠のない称賛
- 「簡単なミス」
- 「注意すればよい」
- 「もっと問題を解く」
- 「才能」
- 「向いている／向いていない」

---

# 14. Analytics

最低限:

- ErrorType frequency
- ErrorType recurrence
- first-pass vs final correctness
- reasoning score vs implementation result
- self-detected vs externally detected
- basic vs edge-case failure
- clean reimplementation over time
- Problem別implementation reliability
- Pattern別implementation reliability

全metricでsample数を表示してください。

---

# 15. Data migration and compatibility

- 既存Attemptを壊さない
- 既存IMPLEMENTATION stageはそのまま表示できる
- 過去AttemptにはImplementationRecordがないため`NOT_MEASURED`
- 不確実な過去情報を推測してErrorTypeへ変換しない
- 新しいtableとindexはFlywayで追加
- Phase 8 Analyticsと互換性を保つ

---

# 16. Seed data

最低限、Valid Parenthesesに次をseedしてください。

- Implementation Contract template
- Pre-submit Checklist
- Minimal Test Matrix
- 3つの代表Error example
- prevention rules
- clean reimplementation review template

可能なら以下にも最低限追加してください。

- Two Sum
  - duplicate
  - lookup before insert
  - index/value
- Binary Search
  - boundary
  - middle calculation
  - termination
- Reverse Linked List
  - next pointer保存
  - mutation order
  - final head
- Maximum Depth of Binary Tree
  - null base case
  - max(left, right) + 1
- Number of Islands
  - visited marking timing
  - boundary
  - duplicate traversal
- Daily Temperatures
  - same-end stack operations
  - while condition
  - index difference

Valid Parenthesesをvertical sliceとして完成させてください。

---

# 17. 今回の非対象

- OpenAI API
- AI code review
- automatic code execution
- compiler integration
- LeetCode API
- IDE plugin
- static analysis engine
- full Java parser
- mutation testing
- 他ユーザー比較
- leaderboard
- streak punishment
- error件数による人格評価
- 「今後二度と間違えない」という保証

---

# 18. テスト要件

## Unit test

- ImplementationStatus transition
- ErrorType validation
- Error recurrence linking
- reliability status
- first-pass metrics
- self-debug rate
- clean reimplementation rate
- explanation-to-code gap
- N/A handling
- review scheduling
- checklist completion
- existing Attempt compatibility

## Integration test

- ImplementationRecord保存
- 複数ImplementationError保存
- TestCase seed
- AttemptTestResult保存
- error recurrence
- repair review作成
- clean reimplementation
- Analytics query
- Valid Parentheses vertical slice

## MVC test

- Implementation Contract
- Checklist
- Test Matrix
- Error form
- Attempt completion summary
- Problem detail history
- Error fingerprint page
- Dashboard metrics
- Repair review start

## Regression test

以下が壊れていないこと。

- 13 stage Attempt
- Hint
- FailureLabel
- ReviewSchedule
- RuleBasedCoach
- Dashboard
- Analytics
- export/import
- existing seed problems

---

# 19. 受け入れ条件

- Reasoning成功とImplementation失敗を別々に記録できる
- Valid ParenthesesでStack理解と実装エラーを分離できる
- WRONG_END_OR_DIRECTIONを記録できる
- WRONG_RETURN_PLACEMENTを記録できる
- EMPTY_STATE_CHECK_MISSINGを記録できる
- minimal failing inputとroot causeを保存できる
- prevention ruleを保存できる
- コード前にImplementation Contractを作れる
- submit前Checklistを使える
- manual Test Matrixを記録できる
- 同じErrorTypeの再発を追跡できる
- 問題全体ではなくErrorType単位でreviewできる
- first-passとfinal correctnessを分けられる
- clean reimplementationを測れる
- RuleBasedCoachが「才能」ではなく停止地点を説明する
- 過去Attemptを壊さない
- 外部AIや課金なしで動作する
- `./mvnw test`が成功する

---

# 20. 実装後の報告

完了時に以下を報告してください。

- 追加・変更したファイル
- Flyway migration
- domain model
- ErrorType一覧
- Valid Parentheses vertical slice
- Implementation Contract
- Checklist
- Test Matrix
- reliability calculation
- review scheduling
- RuleBasedCoach変更
- Dashboard / Analytics変更
- 既存データ互換性
- 実行したcommand
- test結果
- 手動確認手順
- 残っている制約
