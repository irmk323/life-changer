# Phase 8 Patch: 「未解決状態」と「更新領域」の汎用化、およびTwo Sum教材の修正

## 1. 実装前の指示

このPatchを開始する前に、必ず以下を最初から最後まで確認してください。

- `AGENTS.md`
- `docs/product-spec.md`
- `docs/architecture.md`
- `docs/data-model.md`
- `docs/implementation-plan.md`
- `docs/decisions.md`
- `docs/phases/phase2.md` から `docs/phases/phase8.md`
- 既存のソースコード
- 既存のFlyway migration
- 既存のテスト
- Problem、Pattern、Hint、Attempt Workspace、FailureLabel、RuleBasedCoach、Dashboard、Analyticsの実装

このPatchはPhase 9以降のAI連携を前提にしません。

以下は今回の対象外です。

- OpenAI API
- StageFeedbackProvider
- StageRubric
- AI feedback
- Structured Outputs
- API key
- 外部LLM
- Ollama

今回の目的は、Phase 8までに存在する13段階の学習フロー、固定教材、RuleBased Hint、Analyticsを修正することです。

---

# 2. Patchの目的

既存の13段階フレームワークを、Two SumのようなHash Lookup問題にも自然に適用できるようにしてください。

修正対象は主に以下です。

1. `UNRESOLVED_STATE`のUI表示と説明を汎用化する
2. `UPDATED_REGION`のUI表示と説明を汎用化する
3. Two Sumの教材、例、Hintを修正する
4. Daily Temperaturesなど既存問題の動作を壊さない
5. 過去AttemptとAnalyticsの互換性を維持する

---

# 3. 現在の問題

現在の説明はDaily Temperaturesには自然です。

```text
未解決状態:
まだ次の暖かい日が見つかっていない過去の日

更新領域:
未解決候補の末尾から連続した部分
```

しかしTwo Sumでは、「未解決状態」「更新領域」という表現だけでは、次の考え方を表現しづらくなっています。

```text
保持状態:
ここまでに見た値とindex、
または過去要素が将来必要としている補数と元index

新しい入力が来たとき:
特定のkeyを参照する
一致したentryからindexを取得して答えを確定する
一致しなければ新しいentryを追加する
基本的に削除はしない
```

この差を扱えるように修正してください。

---

# 4. 後方互換性

以下の内部enum名とDB保存値は原則変更しないでください。

```text
UNRESOLVED_STATE
UPDATED_REGION
```

破壊的renameや既存Attemptのmigrationは行わず、UI表示名、説明、質問、固定教材を一般化してください。

必要であれば、表示用metadataを追加してください。

例:

```java
public record CognitiveStageDefinition(
    CognitiveStage stage,
    String displayName,
    String shortDescription,
    String primaryQuestion,
    List<String> helperQuestions
) {}
```

既存のenum、DB値、Analytics keyは維持してください。

---

# 5. UNRESOLVED_STATEの修正

## 5.1 UI表示名

推奨:

```text
保持する状態・未確定の候補
```

短い表示が必要な箇所:

```text
保持状態
```

内部enumは`UNRESOLVED_STATE`のままにしてください。

## 5.2 新しい定義

```text
ここまで処理した情報のうち、
今後の判断に必要なため保持するものを説明する。

それがまだ答えの確定していない仕事を表す場合は、
何が起きるのを待っているのかも説明する。
```

## 5.3 Primary question

現在の質問が次のような場合:

```text
ここまで見た要素のうち、まだ何を待っているものがありますか？
```

次へ変更してください。

```text
ここまでの処理から、今後の判断に必要な何を保持しますか？
```

## 5.4 Helper text

```text
それは、まだ答えが確定していない仕事、
今後比較する候補、探索範囲、途中結果などのどれですか？

未確定の仕事を表す場合は、
何が起きるのを待っているかも説明してください。
```

## 5.5 Helper questions

- ここまで処理した情報のうち、後からもう一度必要になるものは何ですか？
- まだ答えが確定していない要素はありますか？
- その要素は何を待っていますか？
- 未来の入力と比較するために何を残しますか？
- 値だけでなくindexや位置も必要ですか？
- 探索範囲や途中結果そのものが状態になる問題ですか？

---

# 6. UPDATED_REGIONの修正

## 6.1 UI表示名

推奨:

```text
状態の参照・更新対象
```

短い表示:

```text
状態の対象部分
```

内部enumは`UPDATED_REGION`のままにしてください。

## 6.2 新しい定義

```text
新しい入力が来たとき、
保存状態のどの部分を参照し、
どの部分を確定・追加・削除・置換するかを説明する。
```

## 6.3 Primary question

現在の質問が次のような場合:

```text
未解決状態のどの部分が更新されますか？
```

次へ変更してください。

```text
新しい入力が来たとき、保存状態のどの部分を参照・確定・追加・削除しますか？
```

## 6.4 Helper text

```text
データ構造名を考える前に、
状態のどこへアクセスし、どのような操作を行うかを説明してください。
```

## 6.5 Helper questions

- 先頭から連続した部分ですか？
- 末尾から連続した部分ですか？
- 特定のkeyに一致する要素ですか？
- 最小または最大の要素ですか？
- 探索範囲を縮めますか？
- 区間全体ですか？
- 状態全体ですか？
- 参照する部分と追加・削除する部分は同じですか？

---

# 7. UPDATED_REGIONの選択肢

最低限、次を扱えるようにしてください。

- `PREFIX`
  - 先頭から連続した部分
- `SUFFIX`
  - 末尾から連続した部分
- `MATCHING_KEY`
  - 特定のkeyに一致する要素
- `MINIMUM`
  - 最小要素
- `MAXIMUM`
  - 最大要素
- `INTERVAL`
  - 区間
- `WHOLE_STATE`
  - 状態全体
- `ARBITRARY_POSITION`
  - 任意位置
- `SEARCH_RANGE`
  - 候補となる探索範囲
- `NOT_APPLICABLE`
  - 明示的な分類が不要
- `UNKNOWN`
  - 分からない

`SEARCH_RANGE`または`NOT_APPLICABLE`が存在しない場合は、必要に応じて追加してください。

既存enumを追加した場合は、Flyway、JPA、フォーム、Analytics、テストを更新してください。

自由記述欄では次の形式を案内してください。

```text
参照:
確定:
追加:
削除:
```

---

# 8. Two Sumの教材修正

Two Sumについて、以下の内容をProblem教材、Pattern教材、Hint、Attempt Workspaceへ反映してください。

## 8.1 小さい例のトレース

13 stageの新しいenumは追加しなくて構いません。

Attempt Workspaceの任意補助欄として、コードを書く前に小さい例を手で動かせるようにしてください。

例:

```text
nums = [2, 7, 11, 15]
target = 9
```

期待する観察:

```text
2を見た時点では答えは確定しない。
2は将来7が現れるのを待っている。

7が来ると2 + 7 = 9となり、
index 0と1が答えとして確定する。
```

追加例:

```text
nums = [3, 3]
target = 6
```

確認点:

```text
同じ値でも異なるindexを使う必要がある。
```

この補助トレースはscoreの分母へ追加しないでください。

---

## 8.2 PROBLEM_RELATION

期待回答:

```text
異なる2つのindex i、jについて、
nums[i] + nums[j] = targetとなる組を探し、
そのindexを返す。
```

走査の形へ変換した回答:

```text
現在値currentについて、
target - currentとなる値が以前に存在するか調べる。
```

部分回答:

```text
2つの値の合計がtargetになるものを探す。
```

不足する可能性がある要素:

- 異なるindex
- indexを返す
- complementの関係

---

## 8.3 BRUTE_FORCE

期待回答:

```text
すべての異なる2要素の組み合わせを確認する。

各iについて、
j = i + 1以降を確認する。
```

計算量:

```text
time O(n²)
space O(1)
```

---

## 8.4 REPEATED_WORK

期待回答:

```text
各currentについて、
target - currentが存在するかを配列から毎回線形探索している。
```

次の問い:

```text
過去に見た値を、
後からすぐ検索できる形で保持できないか？
```

---

## 8.5 UNRESOLVED_STATE

UI上では「保持する状態・未確定の候補」と表示してください。

以下の2つを、どちらも正しい教材例として扱ってください。

### 正解A: seen value形式

```text
ここまでに見たが、
まだペアが確定していない値とそのindex。

過去の値xは、
target - xが将来現れるのを待っている。
```

### 正解B: needed complement形式

```text
過去の値が将来必要としている補数と、
その元のindex。

値xを見たら、
target - xを将来必要な値として保持する。
```

### 部分回答例

```text
過去に見た値とindexを保持する。
```

固定Hintまたは教材feedbackでは、次の観点を案内してください。

```text
過去の値とindexを保持する点は合っています。

次に、
なぜそれがまだ未確定なのか、
過去の値が何を待っているのかを考えてください。

過去の値xは、
どの値が将来現れるのを待っていますか？
```

このstageでは以下をHintで早期に明かさないでください。

- HashMap
- containsKey
- 完成アルゴリズム
- Javaコード

---

## 8.6 RESOLUTION_EVENT

期待回答:

```text
現在値currentについて、
target - currentが過去に保持した値として存在したとき。
```

または:

```text
現在値が、
過去要素が待っていた補数と一致したとき。
```

---

## 8.7 UPDATED_REGION

UI上では「状態の参照・更新対象」と表示してください。

期待回答:

```text
状態全体を順番に調べるのではなく、
現在値またはその補数に対応する特定のkeyを参照する。

一致すれば、そのentryからindexを取得して答えを確定する。

一致しなければ、
現在値とindex、
または必要な補数と元indexを新しく追加する。

基本的に削除はしない。
```

選択肢:

```text
MATCHING_KEY
```

自由記述例:

```text
参照:
補数に一致する特定key

確定:
一致したentry

追加:
現在値とindex
または必要な補数と元index

削除:
なし
```

このstageでは、まだHashMapを必須回答にしないでください。

---

## 8.8 REQUIRED_OPERATIONS

期待回答:

```text
1. 特定keyが存在するか確認する
2. keyから元indexを取得する
3. 新しいkeyとindexを登録する
```

operation:

- lookup by key
- get value by key
- insert by key

既存のRequired Operations選択肢に`get value by key`がない場合は追加してください。

---

## 8.9 DATA_STRUCTURE_SELECTION

期待回答:

```text
HashMap。

値または補数をkey、
indexをvalueとして保存すれば、
存在確認とindex取得を平均O(1)で行えるため。
```

HashSetとの差:

```text
HashSetでは値の存在は分かるが、
元indexを取得できない。
```

---

## 8.10 INVARIANT

seen value形式:

```text
index iを処理する時点で、
Mapにはiより前に処理した値とそのindexだけが入っている。

現在値を追加する前に補数を検索するため、
同じindexを2回使わない。
```

needed complement形式:

```text
Mapには、
それ以前の要素が将来必要としている値と、
その元indexが入っている。
```

重要な概念:

```text
lookup before insert
```

---

## 8.11 CORRECTNESS_AND_COMPLEXITY

期待する正しさの説明:

```text
解となるindexをi < jとする。

jを処理するとき、
target - nums[j] = nums[i]である。

iは既に処理済みなので、
nums[i]は保持状態に存在する。

したがってjを処理した時点で必ずiを発見できる。
```

同じindexを使わない理由:

```text
現在値を状態へ追加する前に補数を検索するため。
```

計算量:

```text
average time O(n)
space O(n)
```

---

## 8.12 IMPLEMENTATION

コードと前stageの対応を教材として表示できるようにしてください。

```text
保持状態
→ seen map

必要な相手
→ complement

特定keyの存在確認
→ containsKey

元index取得
→ get

新しい状態の追加
→ put

同じindexを使わない不変条件
→ lookup before put
```

既存のJava templateまたはPattern Detailへ追加して構いません。

---

## 8.13 TRANSFER

Two Sumのコードではなく、次の抽象スキーマを教材として保存してください。

```text
現在の要素に対して必要な相手を計算できる。

その相手が過去に存在したかを高速に確認したい。

存在だけでなく元の位置や付随情報も必要なので、
keyから情報を取得できる状態を保持する。
```

同型例:

- 合計が予算になる2商品のindex
- 2人のscore合計が指定値になるpair

Contrast例:

### Two Sum II

```text
入力がsortedなのでTwo Pointersを利用できる。
```

### 3Sum

```text
1要素を固定し、
残りをTwo Sum型の問題に変換する。
```

### Subarray Sum Equals K

```text
2要素ではなく連続部分配列。
prefix sumの差をkeyとして検索する。
```

---

## 8.14 REFLECTION

表示例:

```text
自力でできた:
問題の関係、brute force、重複処理

止まった:
保持状態を「相手を待っている過去要素」と表現する部分

今回分かった:
状態は単に保存する値ではなく、
まだ答えが確定していない仕事や、
今後の判断に必要な候補を表す

次回のtrigger:
現在値の相手を計算できるなら、
その相手が過去に存在したかを高速に確認できないか考える

次回確認する質問:
存在だけが必要か、
indexなどの付随情報も必要か
```

FailureLabel候補:

- `UNRESOLVED_STATE_IDENTIFICATION`
- `UPDATED_REGION_IDENTIFICATION`
- `REQUIRED_OPERATION_DERIVATION`
- `DATA_STRUCTURE_SELECTION`

---

# 9. Two SumのRuleBased Hint修正

## 9.1 UNRESOLVED_STATE

Level 1:

```text
ここまでに見た値のうち、
後からもう一度必要になる情報は何ですか？
```

Level 2:

```text
過去の値xは、
合計をtargetにするために、
どの値が将来現れるのを待っていますか？
```

Level 3:

```text
値だけでなく、
答えとして返すためにどの付随情報が必要ですか？
```

このstageではHashMapを明かさないでください。

## 9.2 UPDATED_REGION

Level 1:

```text
新しい値が来たとき、
保存した状態全体を順番に見直す必要がありますか？
```

Level 2:

```text
現在値から、
確認すべき特定の値を計算できますか？
```

Level 3:

```text
先頭や末尾ではなく、
特定のkeyを直接参照する操作を考えてください。
```

## 9.3 REQUIRED_OPERATIONS

Level 1:

```text
特定の値が保存されているか確認する必要がありますか？
```

Level 2:

```text
存在確認に加えて、
その値に対応する何を取得する必要がありますか？
```

Level 3:

```text
keyの存在確認、
keyからindex取得、
新しいkey/index登録が必要です。
```

## 9.4 DATA_STRUCTURE_SELECTION

ここで初めて次を許可してください。

```text
keyからvalueを平均O(1)で検索・登録できる構造を考えてください。
```

高いHint LevelではHashMapを明かして構いません。

---

# 10. RuleBasedCoachとの整合性

Phase 7の`RuleBasedCoach`が新しいUI表示名を利用できるようにしてください。

ただし、内部FailureLabelとCognitiveStage keyは維持してください。

良い表示例:

```text
問題全体ではなく、
「保持状態」で何を待っているかを言語化する工程が
今回のボトルネックでした。
```

```text
保持状態までは説明できましたが、
状態の対象部分を「特定key」として分類する工程で止まりました。
```

避ける表示:

```text
未解決状態が苦手です。
```

```text
HashMapの才能がありません。
```

---

# 11. 他Patternでの確認

この変更をTwo Sumだけの特例にしないでください。

以下で新しい定義が自然に機能することを確認してください。

## 11.1 Monotonic Stack

保持状態:

```text
まだ答えが確定していない過去の候補
```

状態の参照・更新対象:

```text
末尾から連続した部分を参照・確定・削除し、
現在要素を末尾へ追加する
```

## 11.2 Binary Search

保持状態:

```text
答えの候補となる探索範囲[left, right]
```

状態の参照・更新対象:

```text
中央を参照し、
比較結果に応じて左半分または右半分を候補から除外する
```

## 11.3 Sliding Window

保持状態:

```text
現在のwindowと、その条件判定に必要な集計情報
```

状態の参照・更新対象:

```text
右端を追加し、
条件違反時に左端を0回以上削除する
```

## 11.4 Tree DFS

保持状態:

```text
現在処理中のnode、再帰呼び出し中の部分問題、
またはこれから処理するnode
```

状態の参照・更新対象:

```text
current nodeを参照し、
childへ進み、
結果を親へ返す
```

---

# 12. Analyticsの互換性

表示名を変えても、過去の以下のデータを失わないでください。

- `UNRESOLVED_STATE` score
- `UPDATED_REGION` score
- FailureLabel
- WeeklyPlan
- mastery
- transfer rate
- Attempt履歴
- stage success rate
- average hint level

Analyticsでは次のように表示して構いません。

```text
保持状態（UNRESOLVED_STATE）
状態の参照・更新対象（UPDATED_REGION）
```

内部keyは維持してください。

過去Attemptと新Attemptを同じmetricで集計できることを確認してください。

---

# 13. Documentation

以下を更新してください。

- `docs/product-spec.md`
- `docs/learning-model.md`が存在する場合
- `docs/data-model.md`
- `docs/decisions.md`
- user-facing help
- Two Sum教材
- CognitiveStage説明一覧
- Analyticsのmetric表示名

`docs/decisions.md`には最低限、次を記録してください。

```text
UNRESOLVED_STATEとUPDATED_REGIONの内部enumは、
後方互換性のため維持する。

UIと教材上では、
UNRESOLVED_STATEを
「保持する状態・未確定の候補」、

UPDATED_REGIONを
「状態の参照・更新対象」
として一般化する。
```

---

# 14. 今回の非対象

- Phase 9以降のAI機能
- OpenAI API
- StageFeedbackProvider
- StageRubric
- 外部LLM
- 13 stage全体の全面再設計
- enumの破壊的rename
- 過去Attemptのscore再計算
- NeetCode 150全問の教材修正
- LeetCode API
- code execution
- 問題文の自動取得
- AIによる完成解答生成

---

# 15. テスト要件

## 15.1 Unit test

- CognitiveStageの新しい表示定義
- UpdatedRegion選択肢validation
- Two Sumのseen value形式の教材定義
- needed complement形式の教材定義
- MATCHING_KEY
- Required Operationsのkey操作
- 既存enumとの互換性
- RuleBased Hintのlevel順序
- RuleBasedCoachの新表示名

## 15.2 Integration test

- seed教材更新
- 既存Attemptの読み込み
- Two Sum Attemptの各stage保存
- RuleBased Hint取得
- Analyticsが過去データを集計
- migration後も既存データが残る
- Problem DetailとPattern Detailの教材表示

## 15.3 MVC test

- 新しい表示名
- 新しいPrimary question
- helper text
- MATCHING_KEY選択
- 参照・確定・追加・削除の自由記述
- Two Sumの小さい例
- 既存Attempt detail表示
- Analyticsの新表示名

## 15.4 Regression test

Daily Temperaturesについて、以下が壊れていないこと。

- 未解決候補
- `SUFFIX`
- stack operations
- monotonic invariant
- Hint
- RuleBasedCoach
- Analytics

---

# 16. 受け入れ条件

- Two SumのUNRESOLVED_STATEで自然な回答ができる
- UI上では「保持する状態・未確定の候補」と表示される
- `過去に見た値とindex`を部分的な理解として教材で説明できる
- `target-xを待つ`まで説明した完全回答例が表示できる
- seen value形式とneeded complement形式を両方教材として扱う
- UPDATED_REGIONの問いが参照・確定・追加・削除を含む
- Two Sumでは`MATCHING_KEY`を選択できる
- Daily Temperaturesでは`SUFFIX`を引き続き使用できる
- Binary SearchやSliding Windowにも新しい文言を適用できる
- 内部enumと過去データの互換性を維持する
- Analyticsの過去データを失わない
- Phase 9以降のクラスや機能を追加しない
- `./mvnw test`が成功する

---

# 17. 実装後の報告

完了時に以下を報告してください。

- 追加・変更したファイル
- migrationの有無と内容
- enumを維持したか
- UI表示名と質問の変更
- Two Sum教材とHintの変更
- RuleBasedCoachの変更
- Analytics互換性
- Daily Temperaturesのregression結果
- 実行したcommand
- test結果
- 手動確認手順
- 残っている制約
