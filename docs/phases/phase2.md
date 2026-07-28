# 実装前の共通指示

このPhaseを開始する前に、必ず以下を最初から最後まで読んでください。

- `AGENTS.md`
- `docs/product-spec.md`
- `docs/architecture.md`
- `docs/data-model.md`
- `docs/implementation-plan.md`
- `docs/decisions.md`
- 既存のソースコード、Flyway migration、テスト

既存設計とこのPhase指示に矛盾がある場合は、勝手に一方を無視せず、次の優先順位で扱ってください。

1. `docs/product-spec.md`の学習目的
2. `AGENTS.md`のリポジトリ規約
3. 既存のarchitecture decision
4. このPhase指示
5. 実装上の便宜

小さな技術的判断は妥当な仮定を置いて進め、`docs/decisions.md`へ記録してください。  
学習モデルやユーザー体験を変える重大な判断は、実装せず未決事項として報告してください。

## 全Phase共通の作業原則

- 今回のPhaseだけを実装し、後続Phaseを先回りして作り込みすぎない
- 既存機能を壊さず、アプリを常に起動可能な状態に保つ
- Controllerへビジネスロジックを書かない
- package-by-featureを維持する
- schema変更はFlyway migrationで行う
- `spring.jpa.hibernate.ddl-auto`にschema生成を依存しない
- domain/serviceの主要ロジックにはunit testを追加する
- repositoryから画面までの主要経路にはintegration testまたはMVC testを追加する
- Node.jsや外部サービスを必須にしない
- LeetCode／NeetCodeの問題文や解答全文をスクレイピング・複製しない
- ローカル単一ユーザー、認証なしという前提を維持する
- UI文言は日本語を基本とし、class・method・enum・package名は英語にする
- 既存のREADME、設計書、ER図、実装計画を必要に応じて更新する
- 作業完了前に `./mvnw test` を実行する

# Phase 2: Problem、Pattern、ProblemPatternとseed data

## 1. このPhaseの目的

学習対象となる問題と、問題を横断して再利用するアルゴリズムパターンを管理できる基盤を作ってください。

このPhaseで重要なのは、次の2つを分離することです。

- `Problem`: 個別のLeetCode問題
- `Pattern`: 個別問題から抽象化された、再利用可能な思考スキーマ

このアプリは `Daily Temperatures → Monotonic Stack` という一対一暗記を促すものではありません。  
`Pattern`には、問題から解法へ到達する中間工程を保存できる必要があります。

## 2. 今回実装する範囲

### 2.1 Domain model

最低限、以下を実装してください。

#### Problem

推奨フィールド:

- `id`
- `leetcodeNumber`
- `title`
- `slug`
- `difficulty`
- `neetcodeCategory`
- `externalUrl`
- `active`
- `createdAt`
- `updatedAt`

制約:

- `slug`はunique
- `leetcodeNumber`はnullableを許容してもよいが、値がある場合はunique
- `externalUrl`はLeetCodeへの外部リンクとして扱う
- 問題文全文や解答全文は保存しない

#### Pattern

推奨フィールド:

- `id`
- `code`
- `name`
- `description`
- `triggerClues`
- `typicalBruteForce`
- `repeatedWork`
- `unresolvedState`
- `resolutionEvent`
- `updatedRegion`
- `requiredOperations`
- `invariant`
- `correctnessNotes`
- `complexityNotes`
- `commonMistakes`
- `contrastCases`
- `javaNotes`
- `createdAt`
- `updatedAt`

長文フィールドはH2で安全に保存できる形にしてください。  
初期実装では、過度に正規化せず、説明文をテキストとして保持して構いません。

#### ProblemPattern

ProblemとPatternのmany-to-many関係を表す明示的なjoin entityとして実装してください。

推奨フィールド:

- `id`
- `problemId`
- `patternId`
- `primaryPattern`
- `notes`
- `createdAt`

制約:

- 同じProblemとPatternの組み合わせはunique
- 1つのProblemにprimary patternは原則1つ
- primary patternの一意性は、DB制約が複雑になる場合はserviceで保証してよい
- 将来、1問に複数パターンを関連付けられる設計にする

### 2.2 Enum

最低限、以下を用意してください。

#### Difficulty

- `EASY`
- `MEDIUM`
- `HARD`

#### NeetcodeCategory

NeetCode 150の18カテゴリを表現できること。

- `ARRAYS_AND_HASHING`
- `TWO_POINTERS`
- `SLIDING_WINDOW`
- `STACK`
- `BINARY_SEARCH`
- `LINKED_LIST`
- `TREES`
- `HEAP_PRIORITY_QUEUE`
- `BACKTRACKING`
- `TRIES`
- `GRAPHS`
- `ADVANCED_GRAPHS`
- `ONE_DIMENSIONAL_DP`
- `TWO_DIMENSIONAL_DP`
- `GREEDY`
- `INTERVALS`
- `MATH_AND_GEOMETRY`
- `BIT_MANIPULATION`

表示名は日本語または一般的な英語名をUI層で提供してください。

### 2.3 Repository / Service

以下のユースケースをserviceとして実装してください。

- Problem一覧取得
- category、difficulty、activeによる絞り込み
- Problem詳細取得
- Pattern一覧取得
- Pattern詳細取得
- ProblemへPatternを関連付ける
- primary patternを設定・変更する
- slug、codeの重複を防ぐ
- 存在しないIDを明確な例外として扱う

### 2.4 Seed data

Flywayまたはapplication startup時のidempotent importerのどちらか、既存設計に合う方法を選んでください。

MVP seedとして最低限、以下の8問を登録してください。

- Two Sum
- Valid Parentheses
- Best Time to Buy and Sell Stock
- Binary Search
- Reverse Linked List
- Maximum Depth of Binary Tree
- Number of Islands
- Daily Temperatures

最低限、対応するPatternも登録してください。

推奨pattern例:

- Hash Lookup
- Stack Matching
- Single Pass Minimum Tracking
- Binary Search
- Iterative Pointer Reversal
- Tree DFS
- Graph/Grid Traversal
- Monotonic Stack

`Daily Temperatures`のMonotonic Stack patternには、最低限以下を含めてください。

- 求める関係: 右側の最初のgreater element
- brute force: 各indexから右側を走査
- repeated work: 同じ未来要素を複数回確認
- unresolved state: 次の暖かい日を待つ過去のindex
- resolution event: 現在温度が未解決温度を上回る
- updated region: 未解決候補の末尾から連続
- required operations: 末尾を見る、末尾を削除、末尾へ追加
- invariant: stack内温度が単調減少
- complexity: 各indexが最大1回push、1回popされるためO(n)

問題本文・公式解答・NeetCode解説全文はseedに含めないでください。

将来150問を投入できるよう、以下のどちらかを用意してください。

- `src/main/resources/seed/problems.json`
- または `docs/import-format.md` とサンプルJSON

seed処理は再起動時に重複登録しないこと。

### 2.5 UI

最低限、以下の画面を追加してください。

#### Problem Library

- 問題一覧
- title
- difficulty
- category
- primary pattern
- external link
- active status
- category/difficultyによるfilter
- 問題詳細へのlink

#### Problem Detail

- 問題metadata
- 関連Pattern
- primary pattern
- 外部LeetCodeリンク
- Pattern詳細へのlink

#### Pattern Library

- Pattern一覧
- pattern name
- descriptionの短い要約
- 関連問題数
- Pattern詳細へのlink

#### Pattern Detail

- Patternの中間思考要素
- trigger clues
- unresolved state
- resolution event
- updated region
- required operations
- invariant
- common mistakes
- 関連問題

このPhaseでは管理者向けの高度なCRUD UIは不要です。seedされた内容を閲覧できれば十分です。

## 3. 今回の非対象

以下はこのPhaseでは実装しないでください。

- Attempt
- StageAssessment
- 得点
- ヒント
- 復習スケジュール
- FailureLabel
- Coaching
- Dashboard analytics
- NeetCode 150全件の教材作成
- LeetCode API連携
- 問題本文の自動取得
- コード実行環境

後続Phaseが利用できるinterfaceや拡張余地は残してよいですが、未使用の複雑な抽象化は作らないでください。

## 4. Flyway

- 新しいテーブルとindexをmigrationで作成する
- join entityのunique constraintを追加する
- seedをSQLで行う場合はidempotencyとID衝突を考慮する
- application再起動後もデータが保持されることを確認する

## 5. テスト要件

最低限、以下をテストしてください。

### Unit test

- primary pattern設定ロジック
- 重複association防止
- filter条件の組み合わせ
- 存在しないProblem/Patternの例外

### Repository / Integration test

- Problem保存・取得
- Pattern保存・取得
- ProblemPatternのassociation
- unique constraint
- seed dataが存在する
- seedが再実行されても重複しない

### MVC test

- Problem Libraryが表示できる
- filterが機能する
- Problem Detailが表示できる
- Pattern LibraryとPattern Detailが表示できる

## 6. 受け入れ条件

- アプリ起動後、MVP 8問がProblem Libraryに表示される
- Pattern LibraryからPatternの思考要素を確認できる
- Daily TemperaturesとMonotonic Stackが関連付いている
- ProblemとPatternの関係がmany-to-manyとして拡張可能
- 150問用のimport形式またはseed拡張方法が文書化されている
- 問題本文や公式解答を複製していない
- 再起動後もデータが残る
- `./mvnw test`が成功する

## 7. 実装後の報告

完了時に以下を報告してください。

- 追加・変更したファイル
- database migration
- domain modelと主要な設計判断
- seedしたProblemとPattern
- 実行したcommand
- test結果
- 手動確認手順
- 残っている制約
- Phase 3が利用できるextension point
