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

# Phase 4: 段階的ヒントとHintUsage

## 1. このPhaseの目的

完成コードをすぐ表示するのではなく、ユーザーが停止した認知工程に応じて、必要最小限のヒントを段階的に利用できるようにしてください。

ヒントは「正解の提示」ではなく、ユーザーが次の思考工程へ進むための足場です。

このPhaseでは以下を実現します。

- stageごとのヒント
- Hint Level 1〜5
- 段階的な開示
- 使用履歴
- ヒント後に前進できたかの記録
- StageAssessment scoreとの整合性
- MVP問題へのseed hint

## 2. Hint Level

`0`はヒントなしを意味し、Hint entityとして保存しなくても構いません。

### Level 1: Relation Hint

問題の関係を考えるための質問のみ。

例:

- 「各要素について、右側の最初の何を探していますか？」
- 「問題の物語を取り除くと、入力要素同士のどんな関係ですか？」

### Level 2: State Hint

未解決状態や解決イベントを考える質問。

例:

- 「ここまで見た要素のうち、まだ答えを待っているものは何ですか？」
- 「新しい入力によって、過去の誰の答えが確定しますか？」

### Level 3: Operation Hint

更新範囲と必要操作を考える質問。

例:

- 「未解決候補の先頭と末尾のどちらから確認しますか？」
- 「追加、参照、削除は、それぞれどこに対して行いますか？」

### Level 4: Pattern / Invariant Hint

候補パターンまたは不変条件を提示する。

例:

- 「未解決候補を単調な順序に保つ方法を検討してください。」
- 「末尾で条件を満たさなくなったとき、奥を見なくてよい順序を作れますか？」

### Level 5: Pseudocode / Solution Hint

疑似コード、詳しいsolution outline、ユーザーが保存した解答、または外部解説linkを表示する。

制約:

- LeetCodeやNeetCodeの解答全文をアプリ内へ無断複製しない
- seedには独自の短い疑似コードまたは外部リンクを使用する
- Level 5を表示したことを明確に記録する

## 3. Domain model

### 3.1 Hint

推奨フィールド:

- `id`
- `problemId` nullable
- `patternId` nullable
- `stageType`
- `hintLevel`
- `content`
- `displayOrder`
- `active`
- `createdAt`
- `updatedAt`

要件:

- Problem固有HintとPattern共通Hintの両方を扱える
- Problem固有Hintを優先し、不足分をPattern Hintから補える
- 少なくともproblemIdまたはpatternIdのどちらかが必要
- hintLevelは1〜5
- 同じ対象、stage、levelに複数Hintを持てる
- displayOrderで順序を制御する

### 3.2 HintUsage

推奨フィールド:

- `id`
- `attemptId`
- `stageAssessmentId`
- `hintId`
- `hintLevel`
- `usedAt`
- `helpedUserProceed`
- `userNote`

要件:

- どのAttemptのどのStageで使用したか追跡可能
- 同じHintの重複表示を記録するかは明示的に決める
- 推奨は、初回開示のみ1 usageとして保存し、再表示では増やさない
- `helpedUserProceed`はstage完了時または後から入力できる

## 4. Progressive disclosure

ユーザーが最初からLevel 5を直接開くのではなく、原則として段階的に開示してください。

推奨ルール:

- 最初はLevel 1のみ開ける
- Level 1開示後にLevel 2を開ける
- 同様にLevel 5まで進む
- 既に低いlevelを開いた後でのみ次levelを開ける
- 「次のヒントを見る」前に短い確認を出してもよい
- ユーザーを罰したり、長い待ち時間を強制したりしない
- accessibilityを損なう無意味なtimer lockは不要

Pattern Hintしかない場合も、Problemのprimary patternがユーザーに未公開なら、Hint文面からpattern名を早すぎる段階で漏らさないでください。

## 5. Hint selection service

以下の責務をserviceに分離してください。

- Attemptとcurrent stageから利用可能Hintを取得
- Problem固有HintとPattern Hintをmerge
- 既に開示済みのlevelを判定
- 次に開示可能なlevelを判定
- HintUsageを記録
- max hint levelをStageAssessmentに反映または算出
- stage完了時にhint usageとscoreの整合性を検証

### Scoreとの整合性

基本ルール:

- Hintを一切使わず自力で完了: score 2が可能
- Hint Level 1〜4を使用して完了: 原則score 1
- Level 5を使用: 原則score 0または1。ユーザーが「理解して説明できた」と評価する場合は1を許容してよい
- Hint使用済みにもかかわらずscore 2を選択した場合、保存を拒否するか、確認して1へ修正する
- 自己評価を勝手に変更せず、矛盾をUIで説明する

既存のStageAssessmentに`maxHintLevel`または`usedHint`がある場合は、HintUsageから派生可能かを検討し、二重source of truthを避けてください。

## 6. MVP seed hints

最低限、以下について段階的Hintを用意してください。

- Daily Temperatures
- Valid Parentheses
- Two Sum
- Best Time to Buy and Sell Stock
- Binary Search
- Reverse Linked List
- Maximum Depth of Binary Tree
- Number of Islands

各問題について全13stage×5levelを作る必要はありません。  
特に詰まりやすいstageへ、意味のあるlevel差を持つHintを用意してください。

Daily Temperaturesには最低限以下を含めてください。

### PROBLEM_RELATION

- L1: 各日について、右側の最初の何を探しているか
- L2: `j > i`かつ`temperature[j] > temperature[i]`という関係への誘導

### UNRESOLVED_STATE

- L2: まだ暖かい日が見つかっていない過去の日

### UPDATED_REGION

- L3: 現在値が解決する候補は、未解決集合のどの端から連続するか

### REQUIRED_OPERATIONS

- L3: 最後を見る、最後を削除する、最後へ追加する

### DATA_STRUCTURE_SELECTION

- L4: 上記操作に合うLIFO構造

### INVARIANT

- L4: stack内温度を単調減少に保つ理由

### IMPLEMENTATION

- L5: 完全コードではなく、push/pop/answer index差の疑似コード

## 7. UI

Attempt Workspaceに以下を追加してください。

- 「ヒントを見る」領域
- 現在利用可能な次level
- 既に開示したHint一覧
- levelと目的の表示
- Hint開示の記録
- 「このヒントで進めた／まだ進めない」の記録
- Level 5であることの明確な表示
- Hint使用後のscore選択時の整合性メッセージ

重要:

- Pattern名や答えをLevel 1で漏らさない
- Hintを使ったことを失敗として強く赤表示しない
- 「必要な足場を使った」という中立的な表現にする
- 使用HintはAttempt詳細でも確認できる

## 8. 今回の非対象

- review schedule
- FailureLabel
- bottleneck自動判定
- Coach message
- analytics dashboard
- 外部LLMによるHint生成
- ユーザーごとのAI personalization
- 問題文の自動解析

## 9. Flyway

以下をmigrationで追加してください。

- hints
- hint_usages
- necessary indexes
- constraints
- 必要ならStageAssessmentの列追加

seed migrationまたはidempotent importerでMVP Hintを投入してください。

## 10. テスト要件

### Unit test

- 次に開示可能なlevel
- level順序を飛ばせないこと
- Problem Hint優先とPattern Hint fallback
- max hint level計算
- score 2とHintUsageの矛盾検出
- Level 5使用時の評価ルール
- duplicate usage防止

### Integration test

- Hint取得
- Hint開示とHintUsage保存
- stageとのassociation
- Attempt再表示時に開示済みHintが残る
- seed hint存在
- completion後のhelpedUserProceed更新

### MVC test

- WorkspaceでHintを表示
- 次levelを開示
- 使用履歴表示
- score矛盾時のvalidation message
- Level 5表示

## 11. 受け入れ条件

- Attempt中、current stageに対応するHintを段階的に開示できる
- Levelを飛ばして答えだけ見る設計になっていない
- HintUsageがAttemptとStageに紐づく
- scoreとHint使用の矛盾が検出される
- Daily Temperaturesでrelation→state→operation→stack→invariantの足場が提供される
- Hint利用後も途中保存・再開できる
- `./mvnw test`が成功する

## 12. 実装後の報告

- 追加・変更ファイル
- migration
- Hint選択ルール
- score整合性ルール
- seedしたHint概要
- UI確認手順
- commandとtest結果
- Phase 5への接続点
- 制約と未決事項
