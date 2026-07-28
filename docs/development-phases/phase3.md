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

# Phase 3: Attempt、13段階のStageAssessment、0〜2点評価

## 1. このPhaseの目的

ユーザーが問題を解いた結果だけでなく、問題から解法へ到達する途中のどの認知工程を自力で実行できたかを記録できるようにしてください。

このPhaseの中心は、以下を分離して保存することです。

- 1回の演習全体: `Attempt`
- 演習中の各認知工程: `StageAssessment`
- ユーザーが書いた回答
- その工程の自己評価
- 所要時間
- 最終結果

「解けた／解けなかった」だけの記録にはしないでください。

## 2. 13段階の認知工程

以下の13段階を、この順序で扱ってください。

1. `PROBLEM_RELATION`
   - 問題の物語を取り除き、求めている関係を表現する
2. `BRUTE_FORCE`
   - 遅くても正しい手順を説明する
3. `REPEATED_WORK`
   - brute force内の重複処理を特定する
4. `UNRESOLVED_STATE`
   - ここまで処理したが、まだ答えが確定していない仕事を特定する
5. `RESOLUTION_EVENT`
   - 新しい入力により、何の答えが確定するかを特定する
6. `UPDATED_REGION`
   - 未解決状態のどの部分が更新されるかを特定する
7. `REQUIRED_OPERATIONS`
   - 必要な追加・参照・削除・検索・集計操作を列挙する
8. `DATA_STRUCTURE_SELECTION`
   - 必要操作を根拠にデータ構造を選択する
9. `INVARIANT`
   - 処理途中で維持される条件と停止可能な理由を説明する
10. `CORRECTNESS_AND_COMPLEXITY`
   - 正しさ、時間計算量、空間計算量を説明する
11. `IMPLEMENTATION`
   - 実装結果、言語、compile error、wrong answer等を記録する
12. `TRANSFER`
   - 同型問題や別表現へどう転用するかを説明する
13. `REFLECTION`
   - 自力でできた工程、詰まった工程、次回のtrigger sentence等を記録する

enum名は既存設計に合わせて調整して構いませんが、意味と順序を失わないでください。

## 3. Domain model

### 3.1 Attempt

推奨フィールド:

- `id`
- `problemId`
- `attemptType`
- `status`
- `startedAt`
- `completedAt`
- `durationSeconds`
- `language`
- `finalResult`
- `externalSubmissionResult`
- `code`
- `confidenceBefore`
- `confidenceAfter`
- `emotion`
- `reflectionSummary`
- `createdAt`
- `updatedAt`

#### AttemptType

最低限:

- `INITIAL`
- `SAME_PROBLEM_REVIEW`
- `ISOMORPHIC_TRANSFER`
- `CONTRAST_CLASSIFICATION`
- `MIXED_CLASSIFICATION`
- `COLD_SOLVE`
- `IMPLEMENTATION_ONLY`

このPhaseでは主に`INITIAL`をUIから開始できればよいですが、後続Phase用のenumは定義してください。

#### AttemptStatus

- `IN_PROGRESS`
- `COMPLETED`
- `ABANDONED`

#### FinalResult

例:

- `SOLVED_INDEPENDENTLY`
- `SOLVED_WITH_HINT`
- `UNDERSTOOD_AFTER_SOLUTION`
- `PARTIALLY_SOLVED`
- `NOT_SOLVED`
- `IMPLEMENTATION_FAILED`

意味が曖昧にならないよう、表示文言を用意してください。

### 3.2 StageAssessment

推奨フィールド:

- `id`
- `attemptId`
- `stageType`
- `answer`
- `score`
- `durationSeconds`
- `startedAt`
- `completedAt`
- `evaluatorNotes`
- `createdAt`
- `updatedAt`

制約:

- 同一Attemptに同一stageTypeは1件
- scoreは0、1、2のみ
- 未完了stageはscore nullableでもよい
- answerは長文を保存可能
- Stage順序はenumまたは明示的なorder serviceで一元管理する

### 3.3 AssessmentScore

保存方法はintegerでもvalue objectでもよいですが、domain上は以下の意味を明確にしてください。

- `0`: できなかった、または答えを見ても説明できない
- `1`: ヒントがあればできた
- `2`: ヒントなしで自力でできた

不正な値を保存できないこと。

## 4. Stage固有の入力

Stageごとに全く同じtextareaだけを出すのではなく、最低限以下をサポートしてください。

### PROBLEM_RELATION

- 自由記述
- 補助観点:
  - 各要素か全体か
  - 左右どちらか
  - greater/smaller/equal
  - first/nearest/max/min/count
  - contiguousか
  - orderが重要か

### BRUTE_FORCE

- 手順
- time complexity
- space complexity
- 任意のtrace

### UPDATED_REGION

選択肢:

- `PREFIX`
- `SUFFIX`
- `MINIMUM`
- `MAXIMUM`
- `MATCHING_KEY`
- `ARBITRARY_POSITION`
- `WHOLE_STATE`
- `INTERVAL`
- `UNKNOWN`

自由記述の理由も保存する。

### REQUIRED_OPERATIONS

複数選択:

- add first
- add last
- peek first
- peek last
- remove first
- remove last
- lookup by key
- insert by key
- remove by key
- get minimum
- get maximum
- maintain sorted order
- range query
- union components
- other

実装方法はjoin table、JSON、文字列のいずれでもよいですが、将来集計可能な構造を選んでください。

### DATA_STRUCTURE_SELECTION

選択肢:

- Array/List
- HashMap
- HashSet
- Stack
- Queue/Deque
- Heap/Priority Queue
- Linked List
- Tree
- Trie
- Graph
- Union Find
- Prefix Sum
- DP Table
- Other

選択理由を必須にする。

### IMPLEMENTATION

最低限、以下を保存する。

- language
- code（任意）
- compile error count
- wrong answer count
- timeout
- implementation completed
- understood solution but failed implementation
- edge case failure
- external submission result

### REFLECTION

最低限、以下の入力欄を用意する。

- 自力でできた工程
- ヒントが必要だった工程
- 完全に分からなかった工程
- 次回のtrigger sentence
- 誤った仮説
- 解答確認後に初めて理解した点
- 次回確認する質問
- 感情
- 学習上の障害

## 5. Application service

最低限、以下を実装してください。

- ProblemからAttemptを開始する
- Attempt開始時に13個のStageAssessment draftを生成する、または遅延生成する
- 現在stageを取得する
- stage回答を一時保存する
- stageを完了してscoreを保存する
- 前後のstageへ移動する
- Attempt全体を完了する
- Attemptを中断する
- durationを安全に計算する
- 完了済みAttemptを閲覧する
- 同一ProblemのAttempt履歴を取得する

重要:

- ブラウザを閉じても途中回答が残ること
- 完了済みstageの再編集方針を明確にする
- score 1は「後続PhaseのHintを使った」場合に限定しすぎない。このPhaseでは自己申告でも保存可能にする
- Phase 4導入後にHintUsageと整合性を検証できるextension pointを残す

## 6. UI: Attempt Workspace

Problem Detailから「演習を開始」を押してAttemptを作成できるようにしてください。

画面構成は既存UIに合わせつつ、最低限以下を実装してください。

- 問題名
- LeetCode外部リンク
- attempt timerまたは経過時間
- 現在のstage名
- stageの目的説明
- stage固有の入力フォーム
- 回答の保存
- 0〜2点の評価
- 前へ／次へ
- 13段階の進捗表示
- 未完了stageの表示
- Attempt完了ボタン
- 中断ボタン

初期段階でPattern名やProblemPatternを答え前に見せない「タグ非表示モード」を用意してください。  
少なくともAttempt Workspace内では、ユーザーが明示的に表示するまでprimary patternを隠してください。

## 7. Attempt完了条件

以下を明確に実装してください。

- 必須stageが完了していること
- 最終結果が選択されていること
- `completedAt`が一度だけ設定されること
- durationが負にならないこと
- 完了済みAttemptを二重完了しないこと

全13stageを必須にするか、一部をskip可能にするかは、既存設計とproduct-specを踏まえて決めてください。  
推奨は、回答がないstageでも「未回答／できなかった」と明示的に完了できる方式です。

## 8. 今回の非対象

- 段階的Hintの表示とHintUsage
- 復習の自動作成
- FailureLabel
- Bottleneck分析
- Coach message
- Dashboard集計
- 自動採点AI
- LeetCode submission API
- コード実行sandbox
- 他ユーザーとの比較

## 9. Flyway

以下に必要なschemaをmigrationで追加してください。

- attempts
- stage_assessments
- 必要に応じてrequired operation等の補助テーブル
- relevant indexes
- unique(attempt_id, stage_type)

## 10. テスト要件

### Unit test

- score validation
- stage order
- Attempt completion rule
- duration calculation
- completed Attemptの二重完了防止
- UPDATED_REGION validation
- REQUIRED_OPERATIONS validation

### Integration test

- Attempt開始
- StageAssessment生成
- stage回答の途中保存
- score保存
- Attempt完了
- 再起動相当のrepository reload後も途中状態が残る
- 同一ProblemのAttempt履歴

### MVC test

- Problem DetailからAttempt開始
- Workspace表示
- stage保存
- 前後stage移動
- Attempt完了
- 完了済みAttempt詳細表示
- Patternが初期状態で隠れている

## 11. 受け入れ条件

- MVP問題のいずれかでAttemptを開始できる
- 13段階を順に記録できる
- 各stageを0〜2点で評価できる
- 途中保存後、画面を開き直して再開できる
- 完了後に工程別score一覧を確認できる
- Problem単位でAttempt履歴を確認できる
- Pattern名を見ずに演習を開始できる
- `./mvnw test`が成功する

## 12. 実装後の報告

- 追加・変更したファイル
- migration
- 13 stageの実装方法
- Attempt lifecycle
- score validation
- UIの手動確認方法
- 実行したcommandとtest結果
- Phase 4でHintUsageを接続する方法
- 未決事項と制約
