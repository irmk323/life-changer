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

# Phase 5: 1日後、4日後、7日後、21日後の復習

## 1. このPhaseの目的

初回Attempt完了後に、同じコードを繰り返し暗記するのではなく、異なる目的を持つ4種類の復習を自動作成してください。

復習間隔:

- 1日後
- 4日後
- 7日後
- 21日後

それぞれの復習は、異なる能力を測ります。

- 1日後: 同じ問題の思考工程を再構築する
- 4日後: 見た目が異なる同型問題へ転用する
- 7日後: 類似・非類似問題を比較・分類する
- 21日後: タグなしでcold solveする

## 2. Review type

最低限、以下を実装してください。

### `RECONSTRUCTION`

- 初回Attemptの1日後
- 同じProblemを利用
- コードより先に、関係・brute force・状態・更新範囲・操作・データ構造・不変条件を再構築する
- 目的は記憶したコードの再生ではない

### `ISOMORPHIC_TRANSFER`

- 4日後
- 同じprimary patternを持つ別Problemを優先
- 適切な別Problemがない場合は、同じProblemに対する抽象化されたsynthetic promptまたはmanual assignmentを使える設計にする
- problem tagやpattern名は回答前に隠す

### `CONTRAST_CLASSIFICATION`

- 7日後
- 同じPattern候補と、似ているが異なる解法の問題を比較する
- MVPでは完全なquiz engineが難しい場合、review recordに比較対象Problem IDsまたはclassification promptを保存する
- 判断理由を記録する

### `COLD_SOLVE`

- 21日後
- 同じProblemまたは同型Problemを、タグ非表示かつ時間計測付きで解く
- relationからimplementationまでを評価する

## 3. Domain model

### ReviewSchedule

推奨フィールド:

- `id`
- `sourceAttemptId`
- `sourceProblemId`
- `assignedProblemId` nullable
- `patternId` nullable
- `reviewType`
- `scheduledDate`
- `completedAt`
- `status`
- `completionAttemptId` nullable
- `rescheduleReason`
- `createdAt`
- `updatedAt`

#### ReviewStatus

- `PENDING`
- `DUE`
- `COMPLETED`
- `MISSED`
- `RESCHEDULED`
- `CANCELLED`

要件:

- 初回Attempt完了時に4件作成する
- 同じsource Attemptとreview typeの重複を防ぐ
- 日付計算はsystem defaultへ暗黙依存せず、Clockとユーザーtimezoneを注入可能にする
- 初期timezoneは`Europe/London`または既存UserSettings
- `scheduledDate`はLocalDateを推奨
- DUEは保存値ではなく日付から派生してもよい。source of truthを明確にする

## 4. Scheduling service

以下を実装してください。

- INITIAL Attempt完了イベントから4件のReviewScheduleを作成
- INITIAL以外のAttemptで同じ4件を無条件生成しない
- idempotentにする
- source Attemptが削除不可なら整合性を保つ
- 既存ReviewからAttemptを開始する
- Review開始時に適切なAttemptTypeを設定する
- Review完了時にcompletionAttemptIdとcompletedAtを設定する
- missed/dueの判定
- manual reschedule
- cancel

推奨マッピング:

- RECONSTRUCTION → `SAME_PROBLEM_REVIEW`
- ISOMORPHIC_TRANSFER → `ISOMORPHIC_TRANSFER`
- CONTRAST_CLASSIFICATION → `CONTRAST_CLASSIFICATION`
- COLD_SOLVE → `COLD_SOLVE`

## 5. Review assignment

### 5.1 RECONSTRUCTION

`assignedProblemId = sourceProblemId`

Attempt Workspaceでは、実装stageより前の認知工程を重点表示してください。  
全13stageを使いつつ、review typeに応じて推奨stageを強調する方式でも構いません。

### 5.2 ISOMORPHIC_TRANSFER

候補選定ルール:

1. source Problemと同じprimary Pattern
2. source Problemとは別Problem
3. まだtransfer reviewに使われた回数が少ない
4. active
5. 可能なら未着手または低習熟

MVP seedで候補が不足する場合:

- assignedProblemIdをnullableにする
- reviewに`promptText`または`assignmentNotes`を持たせ、手動の同型課題を提示できるようにする
- ただし将来Problemが増えたら自動選定できるserviceにする

### 5.3 CONTRAST_CLASSIFICATION

MVPでは以下のいずれかを実装してください。

- `ReviewItem`子entityで複数Problemを関連付ける
- またはreview recordにstructured classification taskを保存する

最低限、ユーザーが以下を回答できること。

- 各候補に適切なpatternまたはdata structure
- 判断理由
- source Problemとの共通点
- 決定的な違い

### 5.4 COLD_SOLVE

- category、pattern、過去解答を初期表示しない
- timerを有効にする
- 通常の13 stage評価を行う

## 6. 復習失敗時の再スケジュール

工程別の失敗はPhase 6で詳しく扱います。このPhaseでは、最低限以下を実装してください。

- ユーザーがreview完了時に「再確認が必要」を選択できる
- 1日後などの短期再reviewを作成できる
- 元のReviewScheduleはCOMPLETEDにし、新しいReviewScheduleを作る
- 無限重複を避ける
- `rescheduleReason`を保存する

自動的に全stageを再出題する高度なadaptive schedulingはPhase 6以降へ残してください。

## 7. UI

### Review Queue

最低限表示:

- review type
- source Problem
- assigned Problemまたはtask
- scheduled date
- overdue days
- status
- review purpose
- 前回Attemptへのlink
- 開始button
- reschedule/cancel

filter:

- due today
- overdue
- upcoming
- completed
- review type

### Dashboardの暫定領域

Phase 8の本格Dashboard前でも、homeまたはreview pageに以下を表示してください。

- 今日のreview数
- overdue数
- 次のreview
- review開始link

### Review detail

- なぜこのreviewが予定されたか
- 何を測るreviewか
- source Attempt
- source Problem
- assigned task
- schedule history

## 8. 通知

このPhaseの必須範囲はアプリ内Review Queueです。

任意:

- Browser Notification API
- iCalendar export

ただし、アプリ停止中はSpring schedulerだけで通知できないことをREADMEへ明記してください。  
バックグラウンド常駐を前提にしないでください。

## 9. 今回の非対象

- adaptive spaced repetition algorithm
- email/push通知
- OS常駐agent
- FailureLabelによる自動再出題
- Coaching
- 本格Analytics
- 外部calendar integration
- LeetCodeの自動提出確認

## 10. Flyway

- review_schedules
- 必要ならreview_items
- relevant indexes
- unique(source_attempt_id, review_type) for initial generated reviews
- completion_attempt_id foreign key
- assignment fields

## 11. テスト要件

### Unit test

- +1、+4、+7、+21日の計算
- timezone境界
- idempotent generation
- INITIAL以外で自動生成しない
- review type→AttemptType mapping
- due/overdue判定
- isomorphic candidate selection
- reschedule
- cancel

固定Clockを使用してください。

### Integration test

- INITIAL Attempt完了後に4件作成
- 二重完了しても重複しない
- ReviewからAttempt開始
- Review完了連携
- restart後もqueueが残る
- source/assigned Problem association

### MVC test

- Review Queue表示
- due/overdue filter
- review開始
- reschedule
- cancel
- review detail

## 12. 受け入れ条件

- INITIAL Attempt完了時に1、4、7、21日後の4件が作成される
- 各review typeの目的がUIで説明される
- reviewから適切なAttemptTypeで演習開始できる
- tag非表示要件がtransfer/cold solveで保たれる
- dueとoverdueが確認できる
- manual rescheduleとcancelができる
- アプリ再起動後もqueueが残る
- `./mvnw test`が成功する

## 13. 実装後の報告

- 追加・変更ファイル
- migration
- scheduling algorithm
- timezone handling
- assignment selection
- UI確認手順
- commandとtest結果
- seed問題不足時のfallback
- Phase 6でadaptive reviewを追加するextension point
