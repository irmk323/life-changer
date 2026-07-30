# Phase 9: 8問×13工程の模範回答データと「答えを見る」

## 0. このPhaseの位置づけ

Phase 8までの既存実装を前提に、このPhaseでは外部AI API接続をまだ実装しないでください。

先に、MVP 8問について13工程すべての模範回答をローカル教材データとして完成させます。各Attempt stageで「答えを見る」を押すと、その問題・その工程に対応する回答例を確認できる状態にしてください。

以前計画したOpenAI API連携は後続Phaseへ移し、このPhaseで作る`StageReferenceAnswer`をrubricおよびground truthとして利用してください。

## 1. 実装前に読むもの

- `AGENTS.md`
- `docs/product-spec.md`
- `docs/architecture.md`
- `docs/data-model.md`
- `docs/implementation-plan.md`
- `docs/decisions.md`
- `docs/phases/phase2.md`〜`phase8.md`
- 既存source、migration、test、seed/import処理

## 2. 最重要設計方針

- Problem別・Stage別回答をThymeleaf、Controller、Java switchへ直書きしない
- 教材contentと表示ロジックを分離する
- 問題別YAMLを教材のsource of truthにする
- templateはDTOを表示するだけにする
- YAMLはversion管理可能かつidempotentにimportする
- 8問×13工程=104件を実データとして投入する
- 問題文や公式解説全文を転載しない

推奨配置:

```text
src/main/resources/learning-content/reference-answers/
├── two-sum.yml
├── valid-parentheses.yml
├── best-time-to-buy-and-sell-stock.yml
├── binary-search.yml
├── reverse-linked-list.yml
├── maximum-depth-of-binary-tree.yml
├── number-of-islands.yml
└── daily-temperatures.yml
```

## 3. YAML schemaとvalidation

各YAMLは同梱data fileと同じschemaを使ってください。必須validation:

- problemSlugが既存Problemと一致
- 13stageがすべて存在
- stage重複なし
- order 1〜13が一意
- enum外stageを拒否
- modelAnswerがblankでない
- contentVersionが正の整数
- 8fileすべて存在
- 合計104件

validation errorではfile名とstageを明示してください。

## 4. Domain model

`StageReferenceAnswer`を追加してください。推奨field:

- id
- problemId
- stageType
- modelAnswer
- applicability
- contentVersion
- sourceFile
- active
- createdAt
- updatedAt

制約:

- unique(problem_id, stage_type)
- 長文保存可能
- 同version再importで重複しない
- versionが新しい場合のみupdate
- version downgradeはdefaultで拒否
- data fileがsource of truthのためCRUD UIは不要

`StageApplicability`: REQUIRED / OPTIONAL / NOT_APPLICABLE。今回の104件はREQUIRED。

## 5. Importer

責務を分けてください。

- `ReferenceAnswerResourceLoader`: classpath YAMLをDTOへparse
- `ReferenceAnswerValidator`: completeness/schema検証
- `ReferenceAnswerImportService`: slug解決、upsert、version管理

Flyway SQLへ教材本文を重複コピーしないでください。Flywayはtable作成、YAML importerは教材投入に使います。

## 6. Attempt Workspaceの「答えを見る」

各Stageへ`[答えを見る]`buttonを追加してください。

初期状態:

- 回答例は非表示
- HTML sourceへ全文を埋め込まない
- button押下時にserverから取得
- page loadで104件を送らない

確認dialog:

> この工程の回答例を表示します。表示後は「ヒントなしで自力でできた（2点）」にはできません。自分の回答を先に保存することを推奨します。

選択: `回答例を見る` / `戻る`

表示内容:

- 工程名
- 模範回答
- 「唯一の正解文ではなく、含めたい概念の一例」という注記
- content version
- 閉じるbutton

表示後:

- revealを永続化
- 再表示しても表示済みが分かる
- 自分の回答は編集可能
- 模範回答を自動copyしない
- copy buttonを付けない
- Attempt detailからrevealを確認可能

## 7. Reveal tracking

既存HintUsageを自然に再利用できるならHint Level 5として記録してください。推奨metadata:

- source=REFERENCE_ANSWER
- hintLevel=5
- attemptId
- stageAssessmentId
- revealedAt
- contentVersion

再利用が不自然なら`StageReferenceAnswerReveal`を追加:

- id
- stageReferenceAnswerId
- attemptId
- stageAssessmentId
- revealedAt
- contentVersion

同一Attempt・Stage・versionの重複eventを作らないでください。

## 8. Score整合性

- 未表示: score 0/1/2
- 表示済み: score 2不可
- 見て理解し自分の言葉で説明可能: score 1
- 見ても説明不可: score 0

score 2保存後に表示する場合は確認を出し、score再評価を要求してください。勝手に値を変更しないでください。

## 9. Analytics等との統合

- average hint levelへ5として反映
- independent successではscore 2不可
- assisted successではscore 1を成功扱い可能
- Attempt detailへreveal表示
- review comparisonでreveal有無比較
- RuleBasedCoachがevidenceとして利用可能

## 10. Content coverage表示

Problem Detailまたはread-only pageに以下を表示:

- 教材回答の収録状況 13/13
- content version
- 各stageの存在
- Attempt外previewはAttemptのrevealへ記録しない

## 11. Endpoint例

```text
GET  /attempts/{attemptId}/stages/{stageType}/reference-answer/status
POST /attempts/{attemptId}/stages/{stageType}/reference-answer/reveal
```

- association検証
- 他Problemのanswerを返さない
- reveal POSTはidempotent
- CSRFは既存方針に従う

## 12. 非対象

- OpenAI API
- AI採点
- AIによる教材生成
- NeetCode 150全件
- 問題本文の保存
- 高度な教材編集UI
- 自動answer reveal

## 13. Flyway

必要に応じて追加:

- stage_reference_answers
- stage_reference_answer_reveals、またはHintUsage source拡張
- unique constraint / index

## 14. Test要件

Unit:
- YAML validation
- 13stage completeness
- duplicate/blank rejection
- version upsert/downgrade
- reveal score rule
- duplicate reveal prevention

Integration:
- 8file load
- 104件import
- 再起動相当で重複なし
- Two Sum UNRESOLVED_STATE取得
- Daily Temperatures INVARIANT取得
- reveal persistence
- score 2 rejection

MVC:
- 初期非表示
- 確認dialog
- reveal表示
- 表示済み状態
- score validation
- coverage 13/13

Content regression:
- 8問×13=104
- Two Sum UNRESOLVED_STATEにtarget-x概念
- Two Sum DATA_STRUCTURE_SELECTIONにHashMap
- Valid Parentheses INVARIANTに最新未対応括弧
- Stock INVARIANTにprefix minimum
- Binary Search INVARIANTにcandidate interval
- Reverse List INVARIANTにreversed prefix/unprocessed suffix
- Tree Depth INVARIANTにsubtree contract
- Islands INVARIANTにvisited component
- Daily Temperatures INVARIANTにmonotonic orderと停止理由

## 15. 受け入れ条件

- 回答がtemplate/Controller/switchへ直書きされていない
- 問題別YAMLがsource of truth
- 104件すべて実回答
- 全Stageで答えを見るが動く
- button押下までanswerを送らない
- revealを記録
- reveal後score 2不可
- Analytics等と整合
- import idempotent
- content version管理
- `./mvnw test`成功

## 16. 完了報告

- 変更file
- migration
- YAML schema
- importer/validation
- 問題数・stage数=104
- reveal tracking
- score/Hint/Analytics統合
- command/test結果
- 手動確認方法
- 後続AI Phaseでの再利用方法

## Appendix A: 8問×13工程の実データ
以下の内容を省略せず、同梱YAMLと同じfileとして作成してください。

### Two Sum — `two-sum.yml`
```yaml
schemaVersion: 1
contentVersion: 1
problemSlug: two-sum
title: "Two Sum"
pattern: "Hash Lookup"
stages:
  - stage: PROBLEM_RELATION
    stageLabel: "求める関係"
    order: 1
    applicability: REQUIRED
    modelAnswer: |
      配列の異なる2つの位置 i, j について、nums[i] + nums[j] = target を満たすindexの組を探す。中心となる関係は「現在値に必要な補数が、別の位置に存在するか」。
  - stage: BRUTE_FORCE
    stageLabel: "総当たり"
    order: 2
    applicability: REQUIRED
    modelAnswer: |
      すべての組(i, j)を二重ループで確認し、合計がtargetなら返す。時間O(n²)、追加空間O(1)。
  - stage: REPEATED_WORK
    stageLabel: "重複処理"
    order: 3
    applicability: REQUIRED
    modelAnswer: |
      各要素について補数を探すため、同じ過去要素を何度も比較している。すでに見た値を再利用せず、毎回線形探索をやり直している。
  - stage: UNRESOLVED_STATE
    stageLabel: "未解決状態"
    order: 4
    applicability: REQUIRED
    modelAnswer: |
      ここまでに見たが、まだペアが確定していない値とそのindex。過去の値xは、将来target - xが現れるのを待っている。「見た値→index」でも「必要な補数→元index」でも表現できる。
  - stage: RESOLUTION_EVENT
    stageLabel: "確定イベント"
    order: 5
    applicability: REQUIRED
    modelAnswer: |
      現在値の補数 target - current が過去に登録済みのとき、または現在値が「待っている補数」と一致したとき、過去indexと現在indexのペアが確定する。
  - stage: UPDATED_REGION
    stageLabel: "更新範囲"
    order: 6
    applicability: REQUIRED
    modelAnswer: |
      prefixやsuffixではなく、現在値または補数に一致する特定のkeyだけを確認・解決する。
  - stage: REQUIRED_OPERATIONS
    stageLabel: "必要操作"
    order: 7
    applicability: REQUIRED
    modelAnswer: |
      特定keyの存在確認、keyから元indexの取得、新しい値とindexまたは必要な補数と元indexの登録。
  - stage: DATA_STRUCTURE_SELECTION
    stageLabel: "データ構造選択"
    order: 8
    applicability: REQUIRED
    modelAnswer: |
      HashMap。値または補数をkey、indexをvalueにすると、存在確認・取得・登録を平均O(1)で行える。
  - stage: INVARIANT
    stageLabel: "不変条件"
    order: 9
    applicability: REQUIRED
    modelAnswer: |
      index iを処理する直前、Mapにはiより前の要素だけが登録されている。現在値を登録する前に補数を検索するため、同じindexを2回使わない。
  - stage: CORRECTNESS_AND_COMPLEXITY
    stageLabel: "正しさと計算量"
    order: 10
    applicability: REQUIRED
    modelAnswer: |
      解となるi<jが存在するなら、jを処理するときnums[i]は登録済みなので補数検索で必ず見つかる。各要素を1回処理し、時間O(n)、空間O(n)。
  - stage: IMPLEMENTATION
    stageLabel: "実装"
    order: 11
    applicability: REQUIRED
    modelAnswer: |
      Java例:
      
      ```java
      public int[] twoSum(int[] nums, int target) {
          Map<Integer, Integer> seen = new HashMap<>();
          for (int i = 0; i < nums.length; i++) {
              int complement = target - nums[i];
              if (seen.containsKey(complement)) {
                  return new int[]{seen.get(complement), i};
              }
              seen.put(nums[i], i);
          }
          throw new IllegalArgumentException("No solution");
      }
      ```
  - stage: TRANSFER
    stageLabel: "転用"
    order: 12
    applicability: REQUIRED
    modelAnswer: |
      現在値に対応する正確な相手が過去に存在するかを問う問題へ転用できる。重複検出、補数検索、prefix sumの差をHashMapで探す問題が同型。
  - stage: REFLECTION
    stageLabel: "振り返り"
    order: 13
    applicability: REQUIRED
    modelAnswer: |
      次回のtrigger sentence: 「各要素が待っている正確な相手を、過去のkeyからO(1)で探せないか」。データ構造名より先に、更新対象が特定keyであることを言語化する。
```

### Valid Parentheses — `valid-parentheses.yml`
```yaml
schemaVersion: 1
contentVersion: 1
problemSlug: valid-parentheses
title: "Valid Parentheses"
pattern: "Stack Matching"
stages:
  - stage: PROBLEM_RELATION
    stageLabel: "求める関係"
    order: 1
    applicability: REQUIRED
    modelAnswer: |
      各閉じ括弧が、未対応の開き括弧のうち最も新しいものと種類まで一致するかを判定する。個数だけでなく入れ子順序が重要。
  - stage: BRUTE_FORCE
    stageLabel: "総当たり"
    order: 2
    applicability: REQUIRED
    modelAnswer: |
      文字列中の(), [], {}を見つけて削除し、変化がなくなるまで繰り返す。最後に空ならvalid。最悪O(n²)。
  - stage: REPEATED_WORK
    stageLabel: "重複処理"
    order: 3
    applicability: REQUIRED
    modelAnswer: |
      括弧を削除するたびに文字列全体を再走査し、すでに確認した位置を何度も調べ直している。
  - stage: UNRESOLVED_STATE
    stageLabel: "未解決状態"
    order: 4
    applicability: REQUIRED
    modelAnswer: |
      まだ対応する閉じ括弧が現れていない開き括弧。最も新しく開いた括弧から先に解決される必要がある。
  - stage: RESOLUTION_EVENT
    stageLabel: "確定イベント"
    order: 5
    applicability: REQUIRED
    modelAnswer: |
      閉じ括弧が現れ、最も新しい未対応の開き括弧と種類が一致したとき、その1組が解決する。不一致ならinvalid。
  - stage: UPDATED_REGION
    stageLabel: "更新範囲"
    order: 6
    applicability: REQUIRED
    modelAnswer: |
      未解決開き括弧列の末尾1件だけを確認し、一致すれば末尾を削除する。
  - stage: REQUIRED_OPERATIONS
    stageLabel: "必要操作"
    order: 7
    applicability: REQUIRED
    modelAnswer: |
      開き括弧を末尾へ追加、末尾を見る、一致時に末尾を削除、最後に未解決要素が残っているか確認する。
  - stage: DATA_STRUCTURE_SELECTION
    stageLabel: "データ構造選択"
    order: 8
    applicability: REQUIRED
    modelAnswer: |
      StackまたはDeque。必要操作がpush、peek、popのLIFOだから。JavaではArrayDeque<Character>が適切。
  - stage: INVARIANT
    stageLabel: "不変条件"
    order: 9
    applicability: REQUIRED
    modelAnswer: |
      走査済みprefixについて、Stackには未対応の開き括弧だけが順に保存され、topは最も新しい未対応括弧である。
  - stage: CORRECTNESS_AND_COMPLEXITY
    stageLabel: "正しさと計算量"
    order: 10
    applicability: REQUIRED
    modelAnswer: |
      正しい入れ子では閉じ括弧は必ず最新の未対応開き括弧と対応する。各文字を1回pushまたはpopするので時間O(n)、空間O(n)。
  - stage: IMPLEMENTATION
    stageLabel: "実装"
    order: 11
    applicability: REQUIRED
    modelAnswer: |
      Java例:
      
      ```java
      public boolean isValid(String s) {
          Deque<Character> stack = new ArrayDeque<>();
          for (char c : s.toCharArray()) {
              if (c == '(' || c == '[' || c == '{') {
                  stack.push(c);
              } else {
                  if (stack.isEmpty()) return false;
                  char open = stack.pop();
                  if ((c == ')' && open != '(') ||
                      (c == ']' && open != '[') ||
                      (c == '}' && open != '{')) return false;
              }
          }
          return stack.isEmpty();
      }
      ```
  - stage: TRANSFER
    stageLabel: "転用"
    order: 12
    applicability: REQUIRED
    modelAnswer: |
      HTML/XMLタグ、式の構文解析、入れ子イベント、undo履歴など「最後に始まった未完了作業を最初に終える」問題へ転用できる。
  - stage: REFLECTION
    stageLabel: "振り返り"
    order: 13
    applicability: REQUIRED
    modelAnswer: |
      次回のtrigger sentence: 「現在の終了記号は、未完了集合のどの要素と対応すべきか」。個数ではなく最新要素との順序を見る。
```

### Best Time to Buy and Sell Stock — `best-time-to-buy-and-sell-stock.yml`
```yaml
schemaVersion: 1
contentVersion: 1
problemSlug: best-time-to-buy-and-sell-stock
title: "Best Time to Buy and Sell Stock"
pattern: "Single-pass Minimum Tracking"
stages:
  - stage: PROBLEM_RELATION
    stageLabel: "求める関係"
    order: 1
    applicability: REQUIRED
    modelAnswer: |
      買い日i<売り日jについて、prices[j]-prices[i]の最大値を求める。正の利益がなければ0。
  - stage: BRUTE_FORCE
    stageLabel: "総当たり"
    order: 2
    applicability: REQUIRED
    modelAnswer: |
      全ての買い日とそれ以降の売り日の組を調べ、最大差を保存する。時間O(n²)、空間O(1)。
  - stage: REPEATED_WORK
    stageLabel: "重複処理"
    order: 3
    applicability: REQUIRED
    modelAnswer: |
      各売り日について、それ以前の最安値を毎回最初から探している。同じprefix minimumを再計算している。
  - stage: UNRESOLVED_STATE
    stageLabel: "未解決状態"
    order: 4
    applicability: REQUIRED
    modelAnswer: |
      ここまでに見た最安の購入価格。将来の売却に最も有利な候補だけを保持すればよい。
  - stage: RESOLUTION_EVENT
    stageLabel: "確定イベント"
    order: 5
    applicability: REQUIRED
    modelAnswer: |
      現在価格を売却価格として利益を評価し、現在価格がより安ければ以後の購入候補を更新する。
  - stage: UPDATED_REGION
    stageLabel: "更新範囲"
    order: 6
    applicability: REQUIRED
    modelAnswer: |
      prefix minimumとこれまでの最大利益という2つの集約値だけを更新する。
  - stage: REQUIRED_OPERATIONS
    stageLabel: "必要操作"
    order: 7
    applicability: REQUIRED
    modelAnswer: |
      現在値と最小価格の差を計算、最大利益を更新、prefix最小価格を更新する。
  - stage: DATA_STRUCTURE_SELECTION
    stageLabel: "データ構造選択"
    order: 8
    applicability: REQUIRED
    modelAnswer: |
      minPriceとmaxProfitの2つのscalar変数で十分。collectionは不要。
  - stage: INVARIANT
    stageLabel: "不変条件"
    order: 9
    applicability: REQUIRED
    modelAnswer: |
      index i処理後、minPriceはprices[0..i]の最小値、maxProfitは処理済み範囲で可能な最大利益。
  - stage: CORRECTNESS_AND_COMPLEXITY
    stageLabel: "正しさと計算量"
    order: 10
    applicability: REQUIRED
    modelAnswer: |
      各売り日jに対する最良の買値はそれ以前の最小価格。全jを1回評価するため時間O(n)、空間O(1)。
  - stage: IMPLEMENTATION
    stageLabel: "実装"
    order: 11
    applicability: REQUIRED
    modelAnswer: |
      Java例:
      
      ```java
      public int maxProfit(int[] prices) {
          int minPrice = Integer.MAX_VALUE;
          int maxProfit = 0;
          for (int price : prices) {
              minPrice = Math.min(minPrice, price);
              maxProfit = Math.max(maxProfit, price - minPrice);
          }
          return maxProfit;
      }
      ```
  - stage: TRANSFER
    stageLabel: "転用"
    order: 12
    applicability: REQUIRED
    modelAnswer: |
      順序制約付き最大差、各位置より前の最小値・最大値を利用する問題へ転用できる。
  - stage: REFLECTION
    stageLabel: "振り返り"
    order: 13
    applicability: REQUIRED
    modelAnswer: |
      次回のtrigger sentence: 「現在位置を右側要素としたとき、左側で必要なのは全履歴か、最良の集約値1つか」。
```

### Binary Search — `binary-search.yml`
```yaml
schemaVersion: 1
contentVersion: 1
problemSlug: binary-search
title: "Binary Search"
pattern: "Binary Search"
stages:
  - stage: PROBLEM_RELATION
    stageLabel: "求める関係"
    order: 1
    applicability: REQUIRED
    modelAnswer: |
      昇順配列からtargetと等しいindexを探す。比較結果により、targetが存在し得ない連続領域を半分ずつ除外できる。
  - stage: BRUTE_FORCE
    stageLabel: "総当たり"
    order: 2
    applicability: REQUIRED
    modelAnswer: |
      先頭から順に比較する。時間O(n)、空間O(1)。
  - stage: REPEATED_WORK
    stageLabel: "重複処理"
    order: 3
    applicability: REQUIRED
    modelAnswer: |
      sorted性を使わず、明らかに小さい・大きい要素を1つずつ確認している。
  - stage: UNRESOLVED_STATE
    stageLabel: "未解決状態"
    order: 4
    applicability: REQUIRED
    modelAnswer: |
      targetがまだ存在する可能性のある候補区間[left, right]。区間外は不可能と証明済み。
  - stage: RESOLUTION_EVENT
    stageLabel: "確定イベント"
    order: 5
    applicability: REQUIRED
    modelAnswer: |
      nums[mid]とtargetを比較し、等しければ確定。小さければ左半分、大きければ右半分を除外する。
  - stage: UPDATED_REGION
    stageLabel: "更新範囲"
    order: 6
    applicability: REQUIRED
    modelAnswer: |
      候補区間のprefixまたはsuffixを丸ごと除外し、残る連続区間へ境界を移す。
  - stage: REQUIRED_OPERATIONS
    stageLabel: "必要操作"
    order: 7
    applicability: REQUIRED
    modelAnswer: |
      mid計算、nums[mid]との比較、比較結果に応じたleft/right更新。
  - stage: DATA_STRUCTURE_SELECTION
    stageLabel: "データ構造選択"
    order: 8
    applicability: REQUIRED
    modelAnswer: |
      sorted arrayへのindex accessとleft/right境界変数。追加collectionは不要。
  - stage: INVARIANT
    stageLabel: "不変条件"
    order: 9
    applicability: REQUIRED
    modelAnswer: |
      各反復開始時、targetが存在するなら必ず[left, right]内にある。区間外はtargetではない。
  - stage: CORRECTNESS_AND_COMPLEXITY
    stageLabel: "正しさと計算量"
    order: 10
    applicability: REQUIRED
    modelAnswer: |
      sorted性により片側を安全に捨てられ、各回で区間がほぼ半分になる。時間O(log n)、空間O(1)。
  - stage: IMPLEMENTATION
    stageLabel: "実装"
    order: 11
    applicability: REQUIRED
    modelAnswer: |
      Java例:
      
      ```java
      public int search(int[] nums, int target) {
          int left = 0, right = nums.length - 1;
          while (left <= right) {
              int mid = left + (right - left) / 2;
              if (nums[mid] == target) return mid;
              if (nums[mid] < target) left = mid + 1;
              else right = mid - 1;
          }
          return -1;
      }
      ```
  - stage: TRANSFER
    stageLabel: "転用"
    order: 12
    applicability: REQUIRED
    modelAnswer: |
      first/last occurrence、lower bound、answer binary search、rotated arrayへ転用できる。必要なのは単調性と候補区間invariant。
  - stage: REFLECTION
    stageLabel: "振り返り"
    order: 13
    applicability: REQUIRED
    modelAnswer: |
      次回のtrigger sentence: 「比較結果から、答えが絶対に存在しない連続領域を捨てられるか」。
```

### Reverse Linked List — `reverse-linked-list.yml`
```yaml
schemaVersion: 1
contentVersion: 1
problemSlug: reverse-linked-list
title: "Reverse Linked List"
pattern: "Iterative Pointer Reversal"
stages:
  - stage: PROBLEM_RELATION
    stageLabel: "求める関係"
    order: 1
    applicability: REQUIRED
    modelAnswer: |
      各nodeのnext方向を逆向きに変更し、元の末尾nodeを新しいheadとして返す。値ではなくlinkを反転する。
  - stage: BRUTE_FORCE
    stageLabel: "総当たり"
    order: 2
    applicability: REQUIRED
    modelAnswer: |
      値を配列へコピーし、逆順に新しいlistを作る。時間O(n)、追加空間O(n)。
  - stage: REPEATED_WORK
    stageLabel: "重複処理"
    order: 3
    applicability: REQUIRED
    modelAnswer: |
      値のコピーとnode再生成は、既存nodeのnextを書き換えれば不要。
  - stage: UNRESOLVED_STATE
    stageLabel: "未解決状態"
    order: 4
    applicability: REQUIRED
    modelAnswer: |
      反転済みprefixのheadであるprevと、未処理suffixの先頭current。current以降を失わず1nodeずつ移す。
  - stage: RESOLUTION_EVENT
    stageLabel: "確定イベント"
    order: 5
    applicability: REQUIRED
    modelAnswer: |
      current.nextを保存後、current.next=prevへ変えると、そのnodeの向きが確定する。
  - stage: UPDATED_REGION
    stageLabel: "更新範囲"
    order: 6
    applicability: REQUIRED
    modelAnswer: |
      反転済みprefixと未処理suffixの境界にあるcurrent nodeだけを更新する。
  - stage: REQUIRED_OPERATIONS
    stageLabel: "必要操作"
    order: 7
    applicability: REQUIRED
    modelAnswer: |
      current.next保存、nextの付け替え、prev更新、currentを保存済みnextへ進める。
  - stage: DATA_STRUCTURE_SELECTION
    stageLabel: "データ構造選択"
    order: 8
    applicability: REQUIRED
    modelAnswer: |
      prev/current/nextの3 pointerで十分。追加collectionは不要。
  - stage: INVARIANT
    stageLabel: "不変条件"
    order: 9
    applicability: REQUIRED
    modelAnswer: |
      prevは処理済みprefixを正しく反転したhead、currentは未処理suffixのhead。保存済みnextによりnodeを失わない。
  - stage: CORRECTNESS_AND_COMPLEXITY
    stageLabel: "正しさと計算量"
    order: 10
    applicability: REQUIRED
    modelAnswer: |
      各反復で1nodeを反転済みprefixへ移す。全node処理後prevが新head。時間O(n)、空間O(1)。
  - stage: IMPLEMENTATION
    stageLabel: "実装"
    order: 11
    applicability: REQUIRED
    modelAnswer: |
      Java例:
      
      ```java
      public ListNode reverseList(ListNode head) {
          ListNode prev = null;
          ListNode current = head;
          while (current != null) {
              ListNode next = current.next;
              current.next = prev;
              prev = current;
              current = next;
          }
          return prev;
      }
      ```
  - stage: TRANSFER
    stageLabel: "転用"
    order: 12
    applicability: REQUIRED
    modelAnswer: |
      区間反転、k-group reversal、pointer rewiringへ転用できる。書き換え前に失われる参照を保存する。
  - stage: REFLECTION
    stageLabel: "振り返り"
    order: 13
    applicability: REQUIRED
    modelAnswer: |
      次回のtrigger sentence: 「pointerを書き換える前に、どの参照を失うか」。prefixとsuffixの境界を図にする。
```

### Maximum Depth of Binary Tree — `maximum-depth-of-binary-tree.yml`
```yaml
schemaVersion: 1
contentVersion: 1
problemSlug: maximum-depth-of-binary-tree
title: "Maximum Depth of Binary Tree"
pattern: "Tree DFS"
stages:
  - stage: PROBLEM_RELATION
    stageLabel: "求める関係"
    order: 1
    applicability: REQUIRED
    modelAnswer: |
      rootからleafまでのnode数の最大値。各nodeの答えは1+max(leftDepth,rightDepth)。
  - stage: BRUTE_FORCE
    stageLabel: "総当たり"
    order: 2
    applicability: REQUIRED
    modelAnswer: |
      全root-to-leaf pathを明示的に列挙し、長さを保存して最大を取る。path copyが余分。
  - stage: REPEATED_WORK
    stageLabel: "重複処理"
    order: 3
    applicability: REQUIRED
    modelAnswer: |
      共通prefix pathを何度も複製する。必要なのは各subtreeの最大depthだけ。
  - stage: UNRESOLVED_STATE
    stageLabel: "未解決状態"
    order: 4
    applicability: REQUIRED
    modelAnswer: |
      現在nodeのdepthは左右subtreeのdepthが返るまで未確定。call frameが子の結果を待つ。
  - stage: RESOLUTION_EVENT
    stageLabel: "確定イベント"
    order: 5
    applicability: REQUIRED
    modelAnswer: |
      nullなら0。左右の結果が返ったら1+max(left,right)で現在nodeのdepthが確定する。
  - stage: UPDATED_REGION
    stageLabel: "更新範囲"
    order: 6
    applicability: REQUIRED
    modelAnswer: |
      現在call frameに対応するsubtree結果1つを更新し、親へ返す。
  - stage: REQUIRED_OPERATIONS
    stageLabel: "必要操作"
    order: 7
    applicability: REQUIRED
    modelAnswer: |
      左右childを評価、2結果のmax、1を加えて返す。
  - stage: DATA_STRUCTURE_SELECTION
    stageLabel: "データ構造選択"
    order: 8
    applicability: REQUIRED
    modelAnswer: |
      再帰DFSとcall stack。iterativeならnodeとdepthのpairをStack/Queueに保持する。
  - stage: INVARIANT
    stageLabel: "不変条件"
    order: 9
    applicability: REQUIRED
    modelAnswer: |
      maxDepth(node)は、そのnodeをrootとするsubtreeの正確な最大depthを返す。nullは0。
  - stage: CORRECTNESS_AND_COMPLEXITY
    stageLabel: "正しさと計算量"
    order: 10
    applicability: REQUIRED
    modelAnswer: |
      構造帰納法で正しい。各nodeを1回訪問し時間O(n)、再帰stackはO(h)。
  - stage: IMPLEMENTATION
    stageLabel: "実装"
    order: 11
    applicability: REQUIRED
    modelAnswer: |
      Java例:
      
      ```java
      public int maxDepth(TreeNode root) {
          if (root == null) return 0;
          return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
      }
      ```
  - stage: TRANSFER
    stageLabel: "転用"
    order: 12
    applicability: REQUIRED
    modelAnswer: |
      height、minimum depth、balanced tree、diameter、subtree aggregateへ転用できる。子のsummaryを親でcombineするpostorder DFS。
  - stage: REFLECTION
    stageLabel: "振り返り"
    order: 13
    applicability: REQUIRED
    modelAnswer: |
      次回のtrigger sentence: 「親の答えを作るために、左右の子から何を返してもらえばよいか」。
```

### Number of Islands — `number-of-islands.yml`
```yaml
schemaVersion: 1
contentVersion: 1
problemSlug: number-of-islands
title: "Number of Islands"
pattern: "Grid Graph Traversal"
stages:
  - stage: PROBLEM_RELATION
    stageLabel: "求める関係"
    order: 1
    applicability: REQUIRED
    modelAnswer: |
      land cellをnode、上下左右のland隣接をedgeとみなし、connected component数を数える。
  - stage: BRUTE_FORCE
    stageLabel: "総当たり"
    order: 2
    applicability: REQUIRED
    modelAnswer: |
      各land cellから毎回grid全体を探索して所属島を判定する。同じcellや経路を何度も探索し最悪O((mn)²)。
  - stage: REPEATED_WORK
    stageLabel: "重複処理"
    order: 3
    applicability: REQUIRED
    modelAnswer: |
      同じland componentを異なる開始cellから何度も探索している。
  - stage: UNRESOLVED_STATE
    stageLabel: "未解決状態"
    order: 4
    applicability: REQUIRED
    modelAnswer: |
      未訪問land cellと、探索中に発見済みだが近傍処理がまだのfrontier。
  - stage: RESOLUTION_EVENT
    stageLabel: "確定イベント"
    order: 5
    applicability: REQUIRED
    modelAnswer: |
      未訪問landを見つけたら島を1つ数え、到達可能な全landをDFS/BFSで訪問済みにする。
  - stage: UPDATED_REGION
    stageLabel: "更新範囲"
    order: 6
    applicability: REQUIRED
    modelAnswer: |
      開始cellから上下左右で到達可能な不規則なconnected region全体。
  - stage: REQUIRED_OPERATIONS
    stageLabel: "必要操作"
    order: 7
    applicability: REQUIRED
    modelAnswer: |
      未訪問land検出、frontier追加・取得、4方向確認、範囲/land/未訪問確認、mark。
  - stage: DATA_STRUCTURE_SELECTION
    stageLabel: "データ構造選択"
    order: 8
    applicability: REQUIRED
    modelAnswer: |
      DFSならcall stack/Stack、BFSならQueue。visited gridまたは入力grid書換えで訪問済みを表す。
  - stage: INVARIANT
    stageLabel: "不変条件"
    order: 9
    applicability: REQUIRED
    modelAnswer: |
      訪問済みlandは数え済みまたは探索中の島に属し、frontierには発見済み未処理cellだけがある。
  - stage: CORRECTNESS_AND_COMPLEXITY
    stageLabel: "正しさと計算量"
    order: 10
    applicability: REQUIRED
    modelAnswer: |
      各探索は同じ島のlandを全て1回訪問する。各cellを定数回確認し時間O(mn)、空間O(mn) worst case。
  - stage: IMPLEMENTATION
    stageLabel: "実装"
    order: 11
    applicability: REQUIRED
    modelAnswer: |
      Java例:
      
      ```java
      public int numIslands(char[][] grid) {
          int count = 0;
          for (int r = 0; r < grid.length; r++) {
              for (int c = 0; c < grid[0].length; c++) {
                  if (grid[r][c] == '1') {
                      count++;
                      dfs(grid, r, c);
                  }
              }
          }
          return count;
      }
      private void dfs(char[][] g, int r, int c) {
          if (r < 0 || r >= g.length || c < 0 || c >= g[0].length || g[r][c] != '1') return;
          g[r][c] = '0';
          dfs(g, r+1, c); dfs(g, r-1, c); dfs(g, r, c+1); dfs(g, r, c-1);
      }
      ```
  - stage: TRANSFER
    stageLabel: "転用"
    order: 12
    applicability: REQUIRED
    modelAnswer: |
      Flood Fill、Max Area of Island、connected components、maze reachabilityへ転用できる。gridを暗黙graphとして見る。
  - stage: REFLECTION
    stageLabel: "振り返り"
    order: 13
    applicability: REQUIRED
    modelAnswer: |
      次回のtrigger sentence: 「同じcomponentを二度数えないため、発見した瞬間に何をmarkするか」。
```

### Daily Temperatures — `daily-temperatures.yml`
```yaml
schemaVersion: 1
contentVersion: 1
problemSlug: daily-temperatures
title: "Daily Temperatures"
pattern: "Monotonic Stack"
stages:
  - stage: PROBLEM_RELATION
    stageLabel: "求める関係"
    order: 1
    applicability: REQUIRED
    modelAnswer: |
      各index iについて、右側の最初のjでtemperatures[j] > temperatures[i]となるものを探し、j-iを返す。
  - stage: BRUTE_FORCE
    stageLabel: "総当たり"
    order: 2
    applicability: REQUIRED
    modelAnswer: |
      各日から右へ走査し、最初のより高い温度を探す。最悪O(n²)。
  - stage: REPEATED_WORK
    stageLabel: "重複処理"
    order: 3
    applicability: REQUIRED
    modelAnswer: |
      同じ未来温度を複数の過去日が何度も比較している。未解決日をまとめて管理していない。
  - stage: UNRESOLVED_STATE
    stageLabel: "未解決状態"
    order: 4
    applicability: REQUIRED
    modelAnswer: |
      まだ右側により高い温度が見つかっていない過去日のindex。各日が、自分より高い未来温度を待っている。
  - stage: RESOLUTION_EVENT
    stageLabel: "確定イベント"
    order: 5
    applicability: REQUIRED
    modelAnswer: |
      現在温度が未解決候補の末尾温度より高いとき、その日の答えが現在indexとの差で確定する。
  - stage: UPDATED_REGION
    stageLabel: "更新範囲"
    order: 6
    applicability: REQUIRED
    modelAnswer: |
      未解決候補の末尾から、現在温度より低い要素が連続するsuffix。現在温度以上に到達したら停止する。
  - stage: REQUIRED_OPERATIONS
    stageLabel: "必要操作"
    order: 7
    applicability: REQUIRED
    modelAnswer: |
      末尾を見る、条件を満たす間末尾を削除、answerへ距離を書く、現在indexを末尾へ追加する。
  - stage: DATA_STRUCTURE_SELECTION
    stageLabel: "データ構造選択"
    order: 8
    applicability: REQUIRED
    modelAnswer: |
      indexを保持するStack/Deque。必要操作が末尾peek/pop/pushでLIFOだから。
  - stage: INVARIANT
    stageLabel: "不変条件"
    order: 9
    applicability: REQUIRED
    modelAnswer: |
      Stack内indexは増加順、対応温度はbottomからtopへ単調非増加。全要素は未解決。top温度が現在以上なら奥も現在以上なので停止できる。
  - stage: CORRECTNESS_AND_COMPLEXITY
    stageLabel: "正しさと計算量"
    order: 10
    applicability: REQUIRED
    modelAnswer: |
      各indexは最初により高い温度が現れたときだけpopされる。最大1回push、1回popなので時間O(n)、空間O(n)。
  - stage: IMPLEMENTATION
    stageLabel: "実装"
    order: 11
    applicability: REQUIRED
    modelAnswer: |
      Java例:
      
      ```java
      public int[] dailyTemperatures(int[] temperatures) {
          int[] answer = new int[temperatures.length];
          Deque<Integer> stack = new ArrayDeque<>();
          for (int i = 0; i < temperatures.length; i++) {
              while (!stack.isEmpty() && temperatures[i] > temperatures[stack.peek()]) {
                  int previous = stack.pop();
                  answer[previous] = i - previous;
              }
              stack.push(i);
          }
          return answer;
      }
      ```
  - stage: TRANSFER
    stageLabel: "転用"
    order: 12
    applicability: REQUIRED
    modelAnswer: |
      Next Greater/Smaller Element、Stock Span、Largest Rectangleなどへ転用できる。比較記号、保持対象、pop時の計算を変える。
  - stage: REFLECTION
    stageLabel: "振り返り"
    order: 13
    applicability: REQUIRED
    modelAnswer: |
      次回のtrigger sentence: 「新しい値が、未解決候補のどの端から何件連続で解決するか」。Stack名より先に末尾操作と停止理由を言語化する。
```
