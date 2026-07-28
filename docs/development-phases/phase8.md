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

# Phase 8: Dashboard、転用率、ヒントレベルなどのAnalytics

## 1. このPhaseの目的

単純なSolved数ではなく、初見問題へ応用するための認知工程が改善しているかを可視化してください。

DashboardとAnalyticsの中心指標は以下です。

- 認知工程別の自力成功率
- 認知工程別のヒント込み成功率
- 平均ヒントレベル
- 同じ問題の保持率
- 同型未見問題への転用率
- 混合パターン識別率
- 実装成功率
- pattern候補へ到達する時間
- working solutionまでの時間
- FailureLabel分布
- 復習前後の改善
- 直近のボトルネック
- 今週の重点工程

Solved数と連続学習日数は補助情報に留めてください。

## 2. 集計期間

最低限、以下を選択できるようにしてください。

- 過去7日
- 過去28日
- 過去90日
- 全期間

期間境界には注入可能なClockとUser timezoneを使用してください。

## 3. 指標定義

指標の計算式をserviceと文書で明示してください。

### 3.1 Stage Independent Success Rate

対象stage assessmentsのうち、score 2の割合。

```text
score 2件数 / 完了済みassessment件数
```

### 3.2 Stage Assisted Success Rate

対象stage assessmentsのうち、score 1または2の割合。

```text
score >= 1件数 / 完了済みassessment件数
```

0件の場合は0%と断定せず、`N/A`として扱うことを推奨します。

### 3.3 Average Hint Level

完了済みstageごとの最大Hint Levelを使う。

- Hint未使用stageは0
- 各stageのmax levelを平均
- 同じHintの再表示は重複カウントしない

```text
sum(max hint level per completed stage) / completed stage count
```

Attempt単位平均と全体平均を混同しないでください。

### 3.4 Retention Rate

`SAME_PROBLEM_REVIEW`または`RECONSTRUCTION`に対応する完了Attemptを対象とする。

#### Independent retention

以下のcore stageがすべてscore 2:

- PROBLEM_RELATION
- BRUTE_FORCE
- UNRESOLVED_STATE
- UPDATED_REGION
- REQUIRED_OPERATIONS
- DATA_STRUCTURE_SELECTION
- INVARIANT

```text
independent retention成功review数 / eligible review数
```

#### Assisted retention

同じcore stageがすべてscore 1以上。

### 3.5 Isomorphic Transfer Rate

`ISOMORPHIC_TRANSFER` Attemptを対象とする。

#### Independent transfer

以下をすべて満たす:

- final resultが成功または部分成功として設定された基準を満たす
- PROBLEM_RELATION = 2
- UPDATED_REGION = 2、または対象patternにupdated regionが適用されない場合は除外
- REQUIRED_OPERATIONS = 2
- DATA_STRUCTURE_SELECTION = 2
- INVARIANT = 2
- max Hint Level <= 2

PatternによってUPDATED_REGIONやINVARIANTが適用されない場合があるため、将来`StageApplicability`を持てる設計、または未適用stageを分母から除外する明確なruleを用意してください。

#### Assisted transfer

適用core stageがすべてscore 1以上。

```text
transfer成功数 / eligible ISOMORPHIC_TRANSFER Attempt数
```

### 3.6 Mixed Pattern Discrimination Rate

`MIXED_CLASSIFICATION`または`CONTRAST_CLASSIFICATION`を対象とする。

各classification itemについて:

- selected pattern/data structureがexpected answerと一致
- 判断理由が入力済み

```text
correct classification items / completed classification items
```

MVPでexpected answerの構造化が不足している場合は、Phase 8内で必要最小限のmodel拡張を行ってください。

### 3.7 Implementation Completion Rate

IMPLEMENTATION stageが適用されるAttemptのうち、implementation completedの割合。

独立成功とhint込みを分けられるなら分ける。

### 3.8 Median Time to Pattern Candidate

可能なら、Attempt開始からDATA_STRUCTURE_SELECTIONまたはPattern candidate確定までの時間。

Phase 3でstage timestampsがある場合に計算する。  
データ不足の場合はN/Aにする。

### 3.9 Median Time to Working Solution

Attempt開始からIMPLEMENTATION完了まで。

### 3.10 Review Improvement

同じsource chainの前回Attemptと今回review Attemptを比較し、stage score差とhint level差を表示する。

## 4. Weekly focus / PDCA

### WeeklyPlan domain

Phase 2以前に未実装なら追加してください。

推奨フィールド:

- `id`
- `weekStart`
- `focusStage`
- `focusPatternId` nullable
- `reason`
- `targetMetric`
- `targetValue`
- `status`
- `createdAt`
- `updatedAt`

#### WeeklyPlanStatus

- `PLANNED`
- `ACTIVE`
- `COMPLETED`
- `CANCELLED`

### Focus recommendation

過去28日を基本に、以下から候補を出してください。

- independent success rateが低いstage
- recurring HIGH/MEDIUM FailureLabel
- average hint levelが高いstage
- transfer時のみ悪化するstage
- data不足だが重要なstage

推奨ロジックはheuristicでよいですが、根拠を表示してください。

例:

> UPDATED_REGIONの自力成功率が33%で、直近6回中4回で関連labelが記録されています。

ユーザーが提案を採用・変更できること。

## 5. Dashboard

トップ画面に最低限、以下を表示してください。

### Today

- 今日dueのreview
- overdue review
- 次に開始するreview
- active weekly focus
- 推奨する次の具体的行動

### Current capability

- stage independent success rateの要約
- average hint level
- retention rate
- isomorphic transfer rate
- mixed discrimination rate
- implementation completion rate

### Bottlenecks

- top 3 FailureLabels
- primary bottleneck stage
- evidence
- 前期間との比較

### Recent progress

- score 0→1、1→2になったstage
- hint levelが下がったstage
- same-problem retentionとtransferの差

### Caution

- データ件数が少ない場合は強い結論を出さない
- sample sizeを必ず表示する
- `N/A`を0%として表示しない

## 6. Analytics page

最低限、以下のsectionまたはchartを実装してください。

- stage別の自力成功率
- stage別のヒント込み成功率
- stage別average hint level
- pattern別Attempt数と成功率
- retention vs transfer
- classification rate
- FailureLabel分布
- score推移
- review前後のscore差
- median duration
- period filter

チャートlibraryを追加する場合:

- Node.js buildを必須にしない
- CDN依存はローカル限定要件と衝突するため避ける
- simple SVG、CSS bars、server-rendered tableを優先
- 必要ならローカルにvendorした軽量libraryを使用するが、licenseを記録する

アクセシビリティのため、chartだけでなく数値tableも提供してください。

## 7. Problem / Pattern detail analytics

### Problem detail

- Attempt履歴
- stage score推移
- hint level推移
- retention result
- review schedule
- recurring FailureLabels

### Pattern detail

- 関連Problem
- initial attempt success
- transfer success
- pattern discrimination
- core stage別score
- common bottleneck
- mastery status

## 8. Mastery status

product-specの状態例を利用してください。

- `NOT_STARTED`
- `EXPOSED`
- `RECONSTRUCTING`
- `TRANSFERRING`
- `DISCRIMINATING`
- `IMPLEMENTING`
- `RETAINED`
- `NEEDS_REVIEW`

初期判定ruleを明示し、test可能にしてください。

推奨例:

- NOT_STARTED: Attemptなし
- EXPOSED: INITIAL完了
- RECONSTRUCTING: reconstruction reviewはあるが基準未達
- TRANSFERRING: assisted transfer成功
- DISCRIMINATING: classification基準達成
- IMPLEMENTING: reasoningは達成、implementation未達
- RETAINED: 21日reviewとtransfer基準達成
- NEEDS_REVIEW: 期限超過reviewまたは直近で大幅低下

複数状態が当てはまる場合の優先順位を定義してください。

UIには以下の注意を表示してください。

> Masteryは、このアプリ内で観測された課題に対して、学習した考え方を再利用できていることを示します。未知の面接問題に必ず正解できることを保証するものではありません。

## 9. Query / performance

- 集計をControllerで行わない
- AnalyticsServiceまたはquery serviceへ分離
- N+1を避ける
- 150問、数千Attempt程度で十分な性能を持たせる
- 必要なindexを追加
- 早すぎるcacheは不要
- metric DTOを明確にする

## 10. Data export

既存JSON exportがある場合、以下を含めるよう更新してください。

- attempts
- stage assessments
- hint usages
- reviews
- failure labels
- coaching messages
- weekly plans

Analytics結果自体は再計算可能ならexport不要です。

## 11. 今回の非対象

- 他ユーザー比較
- leaderboard
- cloud sync
- predictive ML
- 面接合格確率
- 「確実に解ける」保証
- 外部analytics送信
- telemetry
- elaborate gamification

## 12. Flyway

必要に応じて以下を追加してください。

- weekly_plans
- classification item/result model
- performance indexes
- stage applicability metadata
- mastery status persistenceは派生値なら不要

schema変更は必要最小限にしてください。

## 13. テスト要件

### Unit test

- independent/assisted stage success
- average hint level
- retention rate
- transfer rate
- mixed discrimination rate
- implementation rate
- median duration
- N/A handling
- sample size
- weekly focus recommendation
- mastery status
- period boundary/timezone

### Integration test

- analytics query
- Problem detail metrics
- Pattern detail metrics
- review improvement chain
- WeeklyPlan persistence
- realistic fixture datasetでの集計

### MVC test

- Dashboard表示
- review summary
- period filter
- Analytics page
- N/A表示
- sample size表示
- Weekly focus採用・変更
- Problem/Pattern detail analytics

## 14. 受け入れ条件

- DashboardがSolved数だけを中心にしない
- stage別の自力成功率を確認できる
- average hint levelを確認できる
- retentionとisomorphic transferを別々に確認できる
- mixed classification rateを確認できる
- sample sizeとN/Aが正しく表示される
- top bottleneckと根拠が表示される
- weekly focusを設定できる
- Pattern別masteryを確認できる
- 未知問題を必ず解けると保証しない
- `./mvnw test`が成功する

## 15. 実装後の報告

- 追加・変更ファイル
- migration
- metric定義と計算式
- N/Aとsample sizeの扱い
- mastery rule
- weekly focus recommendation
- performance consideration
- UI手動確認手順
- commandとtest結果
- Phase 2〜8全体で残る課題
