# Codexへの依頼：LeetCode抽象的思考トレーニングアプリの設計・実装

Spring Bootを使用して、ローカル環境のみで動作するWebアプリケーションを設計・実装してください。

このアプリは単なるLeetCode進捗管理アプリではありません。

最終目的は、数学や抽象的思考に苦手意識があり、個々の問題の解答を暗記してしまいがちなユーザーが、NeetCode 150を題材にして、初見のLeetCode Easy・Medium問題にも既知パターンを応用できるようになることです。

以下のプロダクト目的、学習モデル、機能要件、データモデル、画面、評価指標、技術要件を理解したうえで実装してください。

---

# 1. プロダクトの目的

## 最終ゴール

ユーザーがNeetCode 150の解答コードを暗記するのではなく、初見問題に対して次の思考を自力で進められるようにする。

1. 問題文から求められている関係を抽出する
2. 遅くても正しいbrute forceを構築する
3. brute force内の重複処理を特定する
4. 処理途中で保持すべき未解決状態を特定する
5. 新しい入力によって何が確定するかを特定する
6. 未解決状態のどの部分が更新されるかを特定する
7. 必要な操作を列挙する
8. 操作に適したデータ構造を選択する
9. 不変条件を言語化する
10. 正しさと計算量を説明する
11. コードに実装する
12. 別の見た目をした同型問題に転用する
13. 複数パターンが混ざった状態でも適切な候補を識別する

このアプリが測るべきなのは、「その問題のコードを覚えていたか」ではなく、上記のどの思考工程を自力で実行できたかである。

## 対象ユーザー

以下のようなユーザーを主対象とする。

* 数学やアルゴリズムに苦手意識がある
* 解答を見ると理解できるが、数日後には再現できない
* 同じ問題を繰り返しても、表現が変わると応用できない
* 問題名と解法を一対一で暗記してしまう
* どの段階で詰まったのか分からない
* 「解けた・解けなかった」だけで自己評価し、能力全体を否定しやすい
* 問題数や連続学習日数より、実際の転用能力を改善したい

## 非目標

次のものを主目的にしないこと。

* LeetCodeの解答コード集
* 単純なSolved数の管理
* 学習ストリークによる習慣化だけ
* 正答数だけのランキング
* 解答を覚えるためのフラッシュカード
* 問題タグを見て解法を当てるだけの学習
* 「少し勉強したから偉い」といった根拠のない称賛
* ユーザーの精神状態を診断する医療アプリ

---

# 2. NeetCode 150のカバー範囲

以下のカテゴリと問題数をサポートする。

* Arrays & Hashing: 9
* Two Pointers: 5
* Sliding Window: 6
* Stack: 6
* Binary Search: 7
* Linked List: 11
* Trees: 15
* Heap / Priority Queue: 7
* Backtracking: 10
* Tries: 3
* Graphs: 13
* Advanced Graphs: 6
* 1-D Dynamic Programming: 12
* 2-D Dynamic Programming: 11
* Greedy: 8
* Intervals: 6
* Math & Geometry: 8
* Bit Manipulation: 7

合計150問を登録できること。

難易度は以下を扱う。

* Easy: 28
* Medium: 101
* Hard: 21

ただし、LeetCodeやNeetCodeの問題文・解答全文を無断複製しないこと。

アプリ内には以下のみを保持する。

* 問題名
* LeetCode slug
* 問題番号
* 難易度
* NeetCodeカテゴリ
* 外部URL
* パターンタグ
* ユーザー自身が書いた問題要約
* ユーザー自身が書いた解法メモ
* アプリ独自の抽象化質問、ヒント、評価項目

NeetCode 150の問題一覧は、JSONまたはCSVのseedファイルから投入できるようにする。

正確な150問一覧がリポジトリ内に存在しない場合は、インポート用スキーマ、サンプルデータ、投入手順を先に実装し、問題文や解答をスクレイピングしないこと。

---

# 3. アプリの中心となる学習モデル

## 3.1 問題名から解法を思い出す学習を避ける

次のような関連付けだけを学習させない。

```text
Daily Temperatures → Monotonic Stack
```

代わりに、以下の変換工程を学習させる。

```text
問題文
→ 求めている関係
→ brute force
→ 重複処理
→ 未解決状態
→ 解決イベント
→ 更新される範囲
→ 必要な操作
→ データ構造
→ 不変条件
→ 実装
```

## 3.2 Daily Temperaturesの例

Daily Temperaturesでは、ユーザーが以下を段階的に発見できるようにする。

### 求める関係

各indexについて、右側にある最初のgreater elementを探す。

### brute force

各indexから右側を順番に調べる。

### 重複処理

複数のindexから、同じ未来の要素を何度も確認する。

### 未解決状態

まだ次の暖かい日が見つかっていない過去のindex。

### 解決イベント

現在の温度が、未解決の過去の温度より高くなったとき。

### 更新される範囲

未解決候補の末尾から連続した0個以上の要素。

例：

```text
未解決: [75, 71, 69]
現在値: 72

69を解決
71を解決
75は解決できない
```

### 必要な操作

* 末尾を見る
* 末尾を削除する
* 末尾に追加する
* 条件を満たす間、末尾の削除を繰り返す

### データ構造

Stack。

### 不変条件

Stack内の温度が、古い方から新しい方へ単調減少している。

### 一般化されたスキーマ

```text
新しい要素が来たとき、
過去の未解決候補の末尾を0個以上まとめて解決する。
条件を満たさなくなった時点で処理を止めるために、
候補を単調な順序に保つ。
```

このような中間工程を、すべての問題について記録・評価できるようにする。

---

# 4. 問題演習ワークフロー

ユーザーが問題を開始したら、いきなりコード入力画面だけを表示しない。

以下のステージを順番に進める。

## Stage 1: Problem Relation

ユーザーに、問題の物語を取り除いて関係だけを記述させる。

入力例：

```text
各要素について、右側にある最初の自分より大きい要素を探す。
```

補助質問：

* 各要素について答えを出すのか
* 全体について1つの答えを出すのか
* 左側と右側のどちらを見るのか
* greater、smaller、equalのどれか
* 最初、最後、最小、最大、個数のどれか
* contiguousである必要があるか
* 順序は重要か

## Stage 2: Brute Force

遅くても正しい方法を、文章または疑似コードで入力させる。

記録する内容：

* 手順
* 時間計算量
* 空間計算量
* 小さい入力での手作業トレース

## Stage 3: Repeated Work

brute forceで何を何度も繰り返しているか入力させる。

入力例：

```text
各indexから、同じ未来の要素を何度も調べている。
```

## Stage 4: Unresolved State

ここまで処理した時点で、まだ答えが確定していない仕事を入力させる。

「状態」という抽象語だけを使わず、次の質問を表示する。

```text
ここまで見た要素のうち、まだ何を待っているものがありますか？
```

## Stage 5: Resolution Event

新しい入力が来たとき、どの未解決要素の答えが確定するか入力させる。

## Stage 6: Updated Region

未解決状態のどの部分が更新されるか選択させる。

選択肢：

* 先頭から連続
* 末尾から連続
* 最小要素
* 最大要素
* 特定のkeyに一致する要素
* 任意の位置
* 全体
* 区間
* 分からない

このステージは重要な評価対象とする。

## Stage 7: Required Operations

データ構造名を答えさせる前に、必要な操作を選択・記述させる。

例：

* 先頭に追加
* 末尾に追加
* 先頭を見る
* 末尾を見る
* 先頭から削除
* 末尾から削除
* 最小値を取り出す
* 最大値を取り出す
* keyから検索する
* 順序を保つ
* 範囲集計を行う
* 連結成分を統合する

## Stage 8: Data Structure Selection

Stage 7で選んだ操作を根拠として、データ構造を選択させる。

候補：

* Array / List
* HashMap
* HashSet
* Stack
* Queue / Deque
* Heap / Priority Queue
* Linked List
* Tree
* Trie
* Graph
* Union Find
* Prefix Sum
* DP Table
* その他

ユーザーは「なぜそのデータ構造が必要な操作に合うのか」も入力する。

## Stage 9: Invariant

以下の説明とともに、不変条件を記述させる。

```text
不変条件とは、処理途中で常に維持され、
それ以上調べなくてよいことや、
現在の判断が正しいことを保証する条件です。
```

補助質問：

* データ構造の中には何が入っているか
* 何が入っていないか
* 順序はどうなっているか
* どの条件で要素を追加するか
* どの条件で削除するか
* どの時点で比較を止めてよいか
* なぜ止めても正しいか

## Stage 10: Correctness and Complexity

ユーザーに以下を説明させる。

* なぜすべての必要な答えが求まるか
* なぜ誤った候補を採用しないか
* 各要素が何回追加・削除されるか
* 時間計算量
* 空間計算量

## Stage 11: Implementation

実際のLeetCodeは外部サイトで解いてもよい。

アプリでは以下を記録できるようにする。

* 使用言語
* 実装開始時刻
* 実装終了時刻
* 自力で実装できたか
* compile errorの回数
* wrong answerの回数
* timeoutの有無
* 解法は分かったが実装できなかったか
* edge caseで失敗したか
* 最終結果
* コードの任意保存

Javaをデフォルト言語とする。

## Stage 12: Transfer

問題を解いた後、同じ問題を繰り返すだけで終わらせない。

以下のいずれかを提示する。

* 見た目が異なる同型問題
* 同じパターンだが方向や比較条件が逆の問題
* 似ているが別のデータ構造を使う問題
* 複数候補からパターンを分類する問題
* 抽象化された小さなsynthetic problem
* 未学習のNeetCode問題で、同じpattern familyを持つ問題

カテゴリやタグは、回答前には表示しない。

## Stage 13: Reflection

演習終了後、ユーザーに以下を記録させる。

* 自力でできた工程
* ヒントが必要だった工程
* 完全に分からなかった工程
* 次回このパターンに気づくためのtrigger sentence
* 誤った仮説
* 正解を見た後に初めて理解した点
* 次に同型問題を見たとき確認する質問
* 感情状態
* 学習を続けるうえでの障害

---

# 5. 失敗ラベル

単に「解けなかった」と記録しない。

複数選択可能な失敗ラベルを用意する。

* PROBLEM_STATEMENT_PARSING
* RELATION_ABSTRACTION
* INPUT_OUTPUT_MODELLING
* EXAMPLE_TRACING
* BRUTE_FORCE_CONSTRUCTION
* COMPLEXITY_ANALYSIS
* REPEATED_WORK_IDENTIFICATION
* UNRESOLVED_STATE_IDENTIFICATION
* RESOLUTION_EVENT_IDENTIFICATION
* UPDATED_REGION_IDENTIFICATION
* REQUIRED_OPERATION_DERIVATION
* DATA_STRUCTURE_SELECTION
* INVARIANT_FORMULATION
* CORRECTNESS_REASONING
* PATTERN_RECOGNITION
* PATTERN_DISCRIMINATION
* IMPLEMENTATION_TRANSLATION
* LANGUAGE_SYNTAX
* EDGE_CASE_IDENTIFICATION
* DEBUGGING
* RECALL
* TRANSFER
* TIME_PRESSURE
* EXPLANATION
* OTHER

各ラベルに対し、以下を記録する。

* 自力で成功した
* ヒント後に成功した
* 回答を見ても理解が不十分
* 所要時間
* 使用したヒントレベル
* ユーザーのメモ

---

# 6. 評価方式

各思考工程を0〜2点で採点する。

```text
0点: できなかった、または答えを見ても説明できない
1点: ヒントがあればできた
2点: ヒントなしで自力でできた
```

最低限、以下を個別に評価する。

1. 関係抽出
2. brute force
3. 重複処理の発見
4. 未解決状態
5. 解決イベント
6. 更新範囲
7. 必要操作
8. データ構造選択
9. 不変条件
10. 正しさの説明
11. 計算量
12. 実装
13. edge case
14. 同型問題への転用
15. 混合問題での識別

「問題の総合点」だけでなく、工程別の推移を可視化する。

---

# 7. ヒントシステム

ヒントは、完成コードをすぐ表示する方式にしない。

以下の段階を設ける。

## Hint Level 0

ヒントなし。

## Hint Level 1: Relation Hint

求めている関係を考えるための質問だけを出す。

例：

```text
各要素について、右側の最初の何を探していますか？
```

## Hint Level 2: State Hint

未解決状態や解決イベントを考える質問を出す。

例：

```text
ここまで見た要素のうち、まだ答えを待っているものは何ですか？
```

## Hint Level 3: Operation Hint

必要な操作を考える質問を出す。

例：

```text
新しい要素が来たとき、未解決候補のどこから確認・削除しますか？
```

## Hint Level 4: Pattern / Invariant Hint

アルゴリズム候補または不変条件を提示する。

例：

```text
未解決候補を単調な順序に保つ方法を検討してください。
```

## Hint Level 5: Pseudocode / Solution Hint

疑似コード、外部解説へのリンク、またはユーザーが保存した解答を表示する。

ヒント使用時に記録するもの：

* ヒントレベル
* 使用時刻
* どのステージで使用したか
* ヒント後に自力で進めたか
* 最終的に完成コードを見たか

主要KPIとして、平均ヒントレベルの低下を追跡する。

---

# 8. 復習スケジュール

初回記録後、以下の日程で復習を作成する。

* 翌日
* 4日後
* 7日後
* 21日後

単純に同じ問題を4回解かせない。

## 翌日: Reconstruction Review

同じ問題を使うが、コードではなく以下を再構築させる。

* 求める関係
* brute force
* 未解決状態
* 解決イベント
* 更新範囲
* 必要操作
* データ構造
* 不変条件

## 4日後: Isomorphic Transfer Review

同じpattern familyを持つ、見た目の異なる問題を提示する。

目的は、問題名ではなく構造を認識できるか測ること。

## 7日後: Contrast and Classification Review

似ている問題と異なる問題を混ぜて、適切な候補を分類させる。

例：

* 右側の最初のgreater
* 右側の最大値
* 右側にgreaterが存在するか
* 右側のgreaterの個数

分類結果だけでなく、判断理由を入力させる。

## 21日後: Cold Solve Review

タグやカテゴリを隠した状態で、同じ問題または同型の未見問題を時間制限付きで解かせる。

関係抽出から実装までを測る。

## 復習失敗時

工程ごとに失敗を判定する。

例：

* 関係抽出には成功したが不変条件に失敗
* パターンは分かったが実装に失敗
* 同じ問題は解けたが同型問題に転用できなかった

失敗した工程は翌日または設定可能な短期間で再出題する。

すでに成功した工程まで、必ずしも毎回すべてやり直させない。

---

# 9. 応用力を測る3種類の指標

## 9.1 Retention Rate

以前解いた同じ問題を、一定期間後に再構築できた割合。

これは主に保持・想起を測る。

## 9.2 Isomorphic Transfer Rate

見た目が異なる同型の未見問題について、正しい関係・状態・パターンを識別できた割合。

これを応用力の中心指標とする。

## 9.3 Mixed Pattern Discrimination Rate

複数の学習済みパターンが混ざった問題群から、正しい候補を選び、理由を説明できた割合。

これを面接に近い識別能力として扱う。

加えて以下を記録する。

* First Attempt Solve Rate
* Relation Extraction Rate
* Brute Force Construction Rate
* Repeated Work Identification Rate
* State Identification Rate
* Updated Region Identification Rate
* Operation Derivation Rate
* Data Structure Selection Rate
* Invariant Formulation Rate
* Implementation Completion Rate
* Edge Case Success Rate
* Average Hint Level
* Median Time to Pattern Candidate
* Median Time to Working Solution
* Seven-Day Retention
* Twenty-One-Day Retention

---

# 10. PDCA機能

「毎日何問解いたか」をPDCAの中心にしない。

思考工程の成功率をPDCA対象とする。

## Plan

毎週、最も弱い工程またはpattern familyを1つ選択する。

例：

```text
今週の重点:
未解決状態から更新範囲を特定する能力
```

一度にすべてを改善しようとしない。

アプリは過去データから重点候補を提案する。

## Do

その工程を練習できる問題・分類問題・synthetic exerciseを提示する。

## Check

週末に以下を表示する。

* 工程別成功率
* ヒントレベル
* 転用率
* 混合識別率
* 実装率
* 所要時間
* 前週との差
* どの工程で停止することが多いか
* 問題カテゴリではなく認知工程別のボトルネック

## Act

結果に応じて翌週の練習内容を変更する。

例：

```text
関係抽出が弱い
→ 物語を関係表現に変える短時間問題を増やす

brute forceが弱い
→ 小さい例を手作業で処理し、その操作を疑似コード化する

重複処理の特定が弱い
→ brute forceの各操作回数を可視化する

更新範囲が弱い
→ 先頭、末尾、最小、最大、key、区間の分類問題を増やす

データ構造選択が弱い
→ データ構造名ではなく必要操作から選ぶ練習を増やす

不変条件が弱い
→ データ構造の内容を各iterationでトレースする

実装が弱い
→ Javaテンプレート、境界条件、API操作を分離して練習する

転用が弱い
→ 同じ問題の再演習を減らし、同型未見問題を増やす
```

---

# 11. パターン認識の訓練

各pattern familyについて、単なる名前ではなく以下を登録する。

* Trigger clues
* 求める関係
* 典型的なbrute force
* よく発生する重複
* 保存する未解決状態
* 解決イベント
* 更新範囲
* 必要操作
* 適したデータ構造
* 不変条件
* 停止条件
* 正しさの理由
* よくある誤分類
* 似ているが別解法になる条件
* 代表問題
* 同型問題
* 反例問題
* Java実装上の注意

例としてMonotonic Stackのpattern cardを作る。

## Monotonic Stack Trigger

* 各要素について答えを求める
* 左側または右側を見る
* greaterまたはsmallerを探す
* 最初、直前、最も近いものを探す
* brute forceでは各要素から片側を繰り返し走査する
* 現在の要素が、過去の未解決候補をまとめて確定できる

## Monotonic Stack Core Questions

```text
現在の要素によって、過去のどの未解決要素が確定しますか？

確定する要素は、未解決候補の末尾から連続していますか？

条件を満たさなくなった時点で、
それより奥を調べなくてよいのはなぜですか？
```

---

# 12. 学習の進行基準

次の値はconfigで変更可能な初期値とする。

pattern familyを「基礎習得」と扱う条件：

* 同型未見問題の関係分類率が80%以上
* 不変条件をヒントなしで説明できる割合が70%以上
* 25分以内の実装成功率が60%以上
* 平均ヒントレベルが2以下
* 混合分類での正答率が70%以上

ただし、これらを「本番合格の保証」と表示してはいけない。

アプリ内では以下のように説明する。

```text
Masteryは、このアプリ内で観測された課題に対して、
学習した考え方を再利用できていることを示します。
未知の面接問題に必ず正解できることを保証するものではありません。
```

状態例：

* NOT_STARTED
* EXPOSED
* RECONSTRUCTING
* TRANSFERRING
* DISCRIMINATING
* IMPLEMENTING
* RETAINED
* NEEDS_REVIEW

---

# 13. 現実的な成功定義

アプリは「すべての初見問題が必ず解ける」と約束しない。

目標を以下の変化として定義する。

Before:

```text
問題を見る
→ 何も浮かばない
→ 自分には能力がないと思う
→ 完成解答を見る
→ その場では納得する
→ 数日後に忘れる
```

After:

```text
問題を見る
→ 求める関係を抽出する
→ brute forceを作る
→ 重複処理を特定する
→ 未解決状態を考える
→ 更新範囲を考える
→ 必要操作を列挙する
→ 候補データ構造を絞る
→ 小さなヒントがあれば前進できる
→ 解法を説明・実装する
→ 別問題で再利用する
```

本番での目標は、必ず瞬時に最適解を出すことだけではない。

以下も改善として記録する。

* brute forceを自力で作れた
* 面接官の小さなヒントを利用できた
* 候補を複数提示できた
* 不変条件を説明できた
* 正しさと計算量を説明できた
* 実装途中で誤りを修正できた
* 完全に停止せず、構造化して考え続けられた

---

# 14. メンタルサポート機能

演習後に、記録された事実に基づくフィードバックを表示する。

一般的な称賛や根拠のない励ましは避ける。

悪い例：

```text
15分も頑張って偉いです。
少しずつ成長しています。
```

良い例：

```text
今回は関係抽出とbrute forceはヒントなしでできました。

停止したのは、
未解決要素のどの部分が更新されるかを判断する段階です。

これは問題全体が理解できなかったのではなく、
UPDATED_REGION_IDENTIFICATIONが現在のボトルネックであることを示しています。

次回はデータ構造名を考える前に、
「先頭、末尾、最小、最大、key、全体のどこが変わるか」
を先に確認します。
```

感情を任意で記録できるようにする。

候補：

* frustrated
* anxious
* ashamed
* hopeless
* tired
* neutral
* curious
* encouraged
* other

フィードバック原則：

* ユーザーの能力全体を評価しない
* 成功・失敗した工程を分離する
* 「解けなかった」を具体的なボトルネックに変換する
* 過去の自分との比較を優先する
* 他人とのランキングを表示しない
* 学習ストリークを失ったことを罰しない
* 未実施日を赤く強調しない
* 診断や治療を行わない
* 医療アプリであるかのように振る舞わない

RuleBasedCoachをデフォルトで実装する。

将来的にローカルLLMを利用できるよう、以下のinterfaceを用意する。

```java
public interface CoachProvider {
    CoachingResponse generate(CoachingContext context);
}
```

デフォルト実装：

```java
RuleBasedCoachProvider
```

オプション実装候補：

```java
OllamaCoachProvider
```

外部AI APIへの通信はデフォルトで行わない。

ローカルLLM連携はfeature flagで無効化できるようにする。

---

# 15. 主要画面

## 15.1 Dashboard

表示内容：

* 今日の復習
* 期限超過の復習
* 新規問題候補
* 今週の重点工程
* 今週の重点pattern
* 工程別成功率
* 平均ヒントレベル
* 同型転用率
* 混合識別率
* 最近のボトルネック
* 次に行うべき具体的な練習

## 15.2 Problem Library

フィルター：

* NeetCodeカテゴリ
* 難易度
* pattern family
* 未着手
* 復習期限
* mastery status
* failure label
* ヒント依存度
* 同型転用未確認
* 実装未完了

問題タグやカテゴリは、演習開始後の初期画面では隠せるようにする。

## 15.3 Attempt Workspace

左側：

* 問題名
* 外部リンク
* ユーザーの問題要約
* timer

中央：

* 現在の思考ステージ
* 入力フォーム
* 小さい例をトレースする領域
* 必要操作の選択UI
* ヒントボタン

右側：

* 現在までの回答
* 使用ヒント
* 後から表示するpattern card
* 未解決状態を手動で追跡する簡易ビジュアライザー

## 15.4 Review Queue

表示内容：

* 復習理由
* 前回失敗した工程
* 今回のreview type
* 予定日
* 遅延日数
* 対象問題
* 対象pattern
* 同じ問題か同型問題か

## 15.5 Pattern Library

patternごとに以下を表示する。

* trigger
* brute force
* repeated work
* state
* resolution event
* update region
* operations
* data structure
* invariant
* complexity
* typical mistakes
* contrast problems
* Java template

## 15.6 Analytics

チャート：

* 工程別成功率の週次推移
* pattern別mastery
* 平均ヒントレベル
* 同型転用率
* 混合識別率
* 実装率
* 所要時間
* failure label分布
* 復習後の改善
* 同じ問題の保持率と未見問題の転用率の比較

単純なSolved数は補助指標に留める。

## 15.7 Weekly Review

以下を自動生成する。

* 今週できるようになった工程
* 改善していない工程
* 最も頻度の高い停止地点
* 次週の重点候補
* 推奨問題
* 推奨review type
* 根拠となる計測値

## 15.8 Settings and Data

* データ保存場所
* JSON export
* JSON import
* CSV import
* バックアップ
* UI言語
* タイムゾーン
* 復習間隔
* 通知設定
* ローカルLLM設定
* データ全削除

---

# 16. 通知・リマインダー

アプリ起動中は、期限が来た復習を通知できるようにする。

最低限必要な機能：

* Dashboard上のdue review表示
* アプリ内通知
* 期限超過表示
* 次回起動時の通知

オプション：

* Browser Notification API
* ローカルデスクトップ通知
* iCalendar形式でのexport

ローカルアプリが停止している間は、Springのschedulerだけでは通知できないことをREADMEに明記する。

---

# 17. データモデル案

以下を基本entityとする。

## Problem

* id
* leetcodeNumber
* title
* slug
* difficulty
* neetcodeCategory
* externalUrl
* active
* createdAt
* updatedAt

## Pattern

* id
* name
* description
* triggerClues
* defaultBruteForce
* repeatedWork
* unresolvedState
* resolutionEvent
* updatedRegion
* requiredOperations
* invariant
* complexityNotes
* commonMistakes
* javaTemplate

## ProblemPattern

* problemId
* patternId
* primaryPattern
* notes

## Attempt

* id
* problemId
* attemptType
* startedAt
* completedAt
* durationSeconds
* finalResult
* language
* code
* externalSubmissionResult
* confidenceBefore
* confidenceAfter
* emotion
* reflection
* createdAt

AttemptType：

* INITIAL
* SAME_PROBLEM_REVIEW
* ISOMORPHIC_TRANSFER
* CONTRAST_CLASSIFICATION
* MIXED_CLASSIFICATION
* COLD_SOLVE
* IMPLEMENTATION_ONLY

## StageAssessment

* id
* attemptId
* stageType
* answer
* score
* durationSeconds
* usedHint
* maxHintLevel
* evaluatorNotes

## Hint

* id
* problemId
* patternId
* stageType
* hintLevel
* content
* displayOrder

## HintUsage

* id
* attemptId
* hintId
* usedAt
* helpedUserProceed

## FailureLabel

* id
* code
* displayName
* description

## AttemptFailureLabel

* attemptId
* failureLabelId
* severity
* notes

## ReviewSchedule

* id
* sourceAttemptId
* problemId
* patternId
* reviewType
* scheduledDate
* completedAt
* status
* rescheduleReason

Status：

* PENDING
* DUE
* COMPLETED
* MISSED
* RESCHEDULED
* CANCELLED

## WeeklyPlan

* id
* weekStart
* focusStage
* focusPattern
* reason
* targetMetrics
* status

## CoachingMessage

* id
* attemptId
* provider
* message
* generatedAt

## UserSettings

ローカル単一ユーザー前提とし、認証は不要。

---

# 18. 技術要件

## Backend

* Java 21
* Spring Boot
* Spring MVC
* Spring Data JPA
* Bean Validation
* Flyway
* H2 file database
* Maven Wrapper
* JUnit 5
* Spring Boot Test

利用するSpring Bootの具体的なバージョンは、実装時点の安定版かつJava 21と互換性のあるものを選び、READMEに明記する。

## Frontend

ローカル環境で簡単に起動できることを優先する。

推奨：

* Thymeleaf
* HTMX
* Vanilla JavaScript
* CSS

Node.jsを必須にしない。

大規模なSPAは初期実装では避ける。

## Database

* file-based H2
* Flyway migration
* テストではin-memory H2
* ユーザーデータをプロジェクト削除で失わない保存先を設定可能にする

例：

```text
~/.leetcode-thinking-trainer/data/
```

## Architecture

package-by-featureを採用する。

例：

```text
com.example.trainer
  dashboard
  problem
  pattern
  attempt
  assessment
  hint
  review
  analytics
  planning
  coaching
  settings
  shared
```

各feature内を必要に応じて以下に分ける。

```text
controller
service
repository
domain
dto
```

Controllerにビジネスロジックを書かない。

復習スケジュール、採点、mastery判定、coaching生成はserviceとして分離する。

---

# 19. ローカル限定・プライバシー要件

* 認証不要
* 単一ユーザー
* データはローカル保存
* telemetryなし
* analytics外部送信なし
* 外部AI APIなし
* ユーザーコードや感情記録を外部送信しない
* 外部アクセスはLeetCode／NeetCodeリンクをブラウザで開く場合だけ
* 自動スクレイピングなし
* export/import可能
* READMEに保存場所と削除方法を明記

---

# 20. MVP範囲

最初から150問分の詳細教材を手作業で完全実装しようとしない。

まず、拡張可能な基盤と以下のvertical sliceを完成させる。

## MVP対象問題

最低限、以下を含む。

* Daily Temperatures
* Valid Parentheses
* Two Sum
* Best Time to Buy and Sell Stock
* Binary Search
* Reverse Linked List
* Maximum Depth of Binary Tree
* Number of Islands

これにより、複数のカテゴリと異なる思考構造を検証する。

## MVP対象機能

1. 問題登録・一覧
2. pattern登録
3. Attempt開始
4. 13段階の思考フォーム
5. 0〜2点の自己評価
6. Hint Level 0〜5
7. failure label
8. 翌日・4日後・7日後・21日後のreview作成
9. Review Queue
10. 工程別dashboard
11. RuleBasedCoach
12. JSON export/import
13. H2永続化
14. Flyway migration
15. Unit・integration test
16. README

MVP完了後、NeetCode 150 seed importと全pattern familyへの拡張を行う。

---

# 21. RuleBasedCoachの生成ルール

入力：

* stage scores
* hint usage
* failure labels
* previous attempts
* duration
* transfer result
* emotion

出力は以下の構造にする。

```text
Observation:
今回、何が自力でできたか。

Bottleneck:
どの工程で停止したか。

Interpretation:
問題全体ができないのではなく、
現在どの技能が不足しているか。

Next Test:
次回、具体的に何を試すか。

Evidence:
その判断の根拠となるscore、hint level、過去比較。
```

例：

```text
Observation:
求める関係とbrute forceはヒントなしで説明できました。

Bottleneck:
未解決候補のどの部分が更新されるかを特定する段階で、
Hint Level 3を使用しました。

Interpretation:
Stackの知識自体よりも、
更新範囲を必要操作に変換する工程が現在のボトルネックです。

Next Test:
次回はデータ構造を答える前に、
更新部分が先頭、末尾、最小、最大、key、全体のどれかを選びます。

Evidence:
UPDATED_REGION_IDENTIFICATION=0
REQUIRED_OPERATION_DERIVATION=1
DATA_STRUCTURE_SELECTION=1
```

---

# 22. 受け入れ条件

## 学習フロー

* ユーザーが問題を選択してAttemptを開始できる
* タグを隠して演習できる
* 各思考ステージを記録できる
* ステージごとに0〜2点を保存できる
* ステージごとにヒントを段階的に表示できる
* ヒント使用履歴を保存できる
* failure labelを複数登録できる
* 演習終了時に工程別フィードバックが生成される

## 復習

* 初回Attempt完了時に1、4、7、21日後のReviewScheduleが作成される
* Reviewごとに異なるreview typeを割り当てられる
* 今日の復習がDashboardに表示される
* 復習結果から特定工程だけを再スケジュールできる

## 分析

* 問題単位ではなく工程単位の成功率を確認できる
* 平均ヒントレベルを確認できる
* retentionとtransferを別指標で確認できる
* weekly focusを設定できる
* ボトルネック工程を自動提案できる

## ローカル動作

以下で起動できる。

```bash
./mvnw spring-boot:run
```

ブラウザでローカルURLを開いて利用できる。

再起動後もデータが残る。

外部サービスへの接続なしでも主要機能が動く。

---

# 23. テスト要件

最低限以下をテストする。

## Unit Test

* Stage score calculation
* Average hint level
* Review date calculation
* Mastery status calculation
* Bottleneck detection
* RuleBasedCoach message selection
* Transfer rate calculation
* Retention rate calculation
* Mixed classification rate calculation

## Integration Test

* Attempt保存
* StageAssessment保存
* HintUsage保存
* 初回Attempt後のReviewSchedule生成
* Review完了後の再スケジュール
* Dashboard集計
* JSON export/import
* Flyway migration

## UIテストまたはMVCテスト

* Problem一覧表示
* Attempt作成
* Stage回答送信
* Hint表示
* Attempt完了
* Review Queue表示
* Analytics表示

---

# 24. 実装の進め方

最初にリポジトリを確認し、既存コードがあれば尊重する。

その後、以下を作成する。

```text
docs/product-spec.md
docs/learning-model.md
docs/architecture.md
docs/data-model.md
docs/implementation-plan.md
```

次に、MVPをvertical sliceとして実装する。

優先順：

1. Spring Bootプロジェクト基盤
2. Problem・Pattern seed
3. AttemptとStageAssessment
4. ヒントシステム
5. ReviewSchedule
6. Dashboard
7. RuleBasedCoach
8. Analytics
9. import/export
10. テストとREADME

巨大な一括実装ではなく、各段階で動作確認可能な状態を保つ。

既存テストを壊さない。

不明点があっても、プロダクトの本質に影響しない小さな事項は妥当な仮定を置き、READMEまたは設計書に記録する。

---

# 25. Codexに最初に期待する出力

実装を始める前に、以下を簡潔に提示すること。

1. このアプリの目的をどう理解したか
2. 単なる問題管理アプリとの違い
3. MVPの境界
4. 主要domain model
5. 主要画面
6. 復習ロジック
7. 工程別評価ロジック
8. 技術構成
9. 実装順序
10. リスクと仮定

その後、設計書とMVP実装を進めること。

最重要要件は以下である。

```text
ユーザーが解答コードを覚えたかではなく、
問題から解法へ到達する途中のどの認知工程を
自力で実行できたかを記録・訓練すること。

同じ問題の再現率だけでなく、
見た目の異なる同型問題への転用率を測ること。

「解けなかった」を能力全体の否定にせず、
具体的なボトルネック工程として可視化すること。
```
