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

# Phase 6: FailureLabelとボトルネック分析

## 1. このPhaseの目的

「解けなかった」という一つの結果を、具体的な認知工程のボトルネックへ分解してください。

このPhaseでは以下を実現します。

- FailureLabel master
- Attemptへの複数label付与
- stage score、HintUsage、回答状況からの候補label提案
- ユーザーによる確認・修正
- 主要ボトルネックの算出
- Problem別ではなく認知工程別の弱点表示
- review再出題への基礎情報

ユーザーの能力全体を判定するのではなく、「今回、どの工程で停止したか」を特定することが目的です。

## 2. FailureLabel master

以下をseedしてください。

- `PROBLEM_STATEMENT_PARSING`
- `RELATION_ABSTRACTION`
- `INPUT_OUTPUT_MODELLING`
- `EXAMPLE_TRACING`
- `BRUTE_FORCE_CONSTRUCTION`
- `COMPLEXITY_ANALYSIS`
- `REPEATED_WORK_IDENTIFICATION`
- `UNRESOLVED_STATE_IDENTIFICATION`
- `RESOLUTION_EVENT_IDENTIFICATION`
- `UPDATED_REGION_IDENTIFICATION`
- `REQUIRED_OPERATION_DERIVATION`
- `DATA_STRUCTURE_SELECTION`
- `INVARIANT_FORMULATION`
- `CORRECTNESS_REASONING`
- `PATTERN_RECOGNITION`
- `PATTERN_DISCRIMINATION`
- `IMPLEMENTATION_TRANSLATION`
- `LANGUAGE_SYNTAX`
- `EDGE_CASE_IDENTIFICATION`
- `DEBUGGING`
- `RECALL`
- `TRANSFER`
- `TIME_PRESSURE`
- `EXPLANATION`
- `OTHER`

各labelには以下を持たせてください。

- code
- 日本語display name
- 説明
- 関連CognitiveStage nullable
- active
- display order

## 3. Domain model

### AttemptFailureLabel

推奨フィールド:

- `id`
- `attemptId`
- `failureLabelId`
- `severity`
- `source`
- `confirmed`
- `notes`
- `createdAt`
- `updatedAt`

#### FailureSeverity

- `LOW`
- `MEDIUM`
- `HIGH`

#### FailureLabelSource

- `USER_SELECTED`
- `SYSTEM_SUGGESTED`
- `SYSTEM_CONFIRMED`
- `COACH_DERIVED`

Phase 7前は`COACH_DERIVED`を使用しなくてもよい。

制約:

- 同一Attemptとlabelの重複を防ぐ
- system suggestionとuser confirmationの履歴方針を明確にする
- 推奨は1レコードを更新し、source/confirmedで状態を表現する

## 4. Bottleneck detection

`BottleneckAnalysisService`等の明示的なserviceを実装してください。

入力:

- StageAssessment
- score
- HintUsage / maxHintLevel
- stage duration
- stage answer completeness
- Attempt final result
- Attempt type
- previous attempts for same Problem
- transfer attempts for same Pattern

出力:

- candidate FailureLabels
- severity
- evidence
- primary bottleneck
- secondary bottlenecks
- user-facing explanation data

### 4.1 基本判定例

以下は初期ruleです。設計に合わせて調整して構いませんが、ruleはcodeとtestで明示してください。

- `PROBLEM_RELATION` score 0
  - `RELATION_ABSTRACTION`
- `BRUTE_FORCE` score 0
  - `BRUTE_FORCE_CONSTRUCTION`
- `REPEATED_WORK` score 0
  - `REPEATED_WORK_IDENTIFICATION`
- `UNRESOLVED_STATE` score 0
  - `UNRESOLVED_STATE_IDENTIFICATION`
- `RESOLUTION_EVENT` score 0
  - `RESOLUTION_EVENT_IDENTIFICATION`
- `UPDATED_REGION` score 0
  - `UPDATED_REGION_IDENTIFICATION`
- `REQUIRED_OPERATIONS` score 0
  - `REQUIRED_OPERATION_DERIVATION`
- `DATA_STRUCTURE_SELECTION` score 0
  - `DATA_STRUCTURE_SELECTION`
- `INVARIANT` score 0
  - `INVARIANT_FORMULATION`
- `CORRECTNESS_AND_COMPLEXITY` score 0
  - `CORRECTNESS_REASONING`または`COMPLEXITY_ANALYSIS`
- `IMPLEMENTATION`で解法理解済みだが実装不可
  - `IMPLEMENTATION_TRANSLATION`
- compile errorが多い
  - `LANGUAGE_SYNTAX`
- wrong answerとedge case failure
  - `EDGE_CASE_IDENTIFICATION`または`DEBUGGING`
- SAME_PROBLEM_REVIEWで前回できたstageが0
  - `RECALL`
- ISOMORPHIC_TRANSFERで関係・操作・data structureを識別できない
  - `TRANSFER`または`PATTERN_RECOGNITION`
- CONTRAST_CLASSIFICATIONで誤分類
  - `PATTERN_DISCRIMINATION`
- 時間超過だが後から自力で解けた
  - `TIME_PRESSURE`

score 1は「弱点なし」ではありません。  
Hint level、繰り返し回数、過去推移に応じてLOWまたはMEDIUM候補にしてください。

### 4.2 Primary bottleneck

単純に最初のscore 0を選ぶだけではなく、以下を考慮してください。

- 問題解決工程でより上流か
- score
- max hint level
- duration
- 過去の頻度
- 後続stageへの影響
- review type

推奨初期アルゴリズム:

1. 各stageにbase weight
2. score 0、1、2でpenalty
3. hint levelでpenalty
4. duration threshold超過で小さなpenalty
5. 過去4週間の同label頻度でrecurrence weight
6. 最大scoreをprimary bottleneckとする

weight値はconfigまたは明示的constantとして管理し、test可能にしてください。  
「科学的診断」ではなくアプリ内heuristicであることをUIに表示してください。

### 4.3 Evidence

各suggestionには、最低限以下のevidenceを持たせるDTOを返してください。

- stage
- score
- maxHintLevel
- duration
- relevant final result
- previous occurrence count
- explanation key

ユーザー向け説明は、人格評価ではなく事実を表示します。

良い例:

> 関係抽出とbrute forceは自力でできました。  
> UPDATED_REGIONでLevel 3のヒントを使用し、score 1でした。  
> 現在の主なボトルネック候補は「更新範囲の識別」です。

悪い例:

> 抽象的思考が苦手です。
> Stackの才能がありません。

## 5. User confirmation UI

Attempt完了後またはAttempt詳細で以下を表示してください。

- system suggested labels
- 根拠
- severity
- checkboxで確認
- label追加
- label削除
- notes
- primary bottleneckの確認

ユーザーがsystem suggestionを拒否できること。  
systemがユーザーの自己認識を上書きしないこと。

## 6. Bottleneck summary

最低限、以下を表示するpageまたはsectionを作ってください。

- 直近Attemptのprimary bottleneck
- 過去4週間で多いFailureLabel
- stage別の0/1/2分布
- 同一Problemで改善したlabel
- transferでのみ発生するlabel
- 「次に測るべきこと」の短い提案

Phase 8の本格Analytics前なので、簡潔な集計で構いません。

## 7. Reviewとの接続

Phase 5のReviewScheduleへ、ボトルネックに基づく再reviewを作成できるservice methodまたはactionを追加してください。

最低限:

- Attempt完了後、primary bottleneckがHIGHかつユーザーが再確認を選んだ場合、1日後の追加reviewを作れる
- review reasonにFailureLabelを保存または参照できる
- 同一Attempt・同一label・同一日付の重複を避ける

完全自動のadaptive schedulingはまだ不要です。

## 8. 今回の非対象

- LLMによる診断
- 医療・心理診断
- 他ユーザー比較
- Coach文章生成
- full dashboard
- machine learning
- 自動的な難易度調整
- LeetCode実行結果の自動解析

## 9. Flyway

- failure_labels
- attempt_failure_labels
- Reviewとの関連列が必要なら追加
- indexes
- unique constraints
- seed labels

## 10. テスト要件

### Unit test

- stage scoreからlabel候補生成
- score 1とhint levelの扱い
- primary bottleneck scoring
- recurrence weight
- transfer/review type固有rule
- implementation failure分類
- evidence生成
- user rejection/confirmation
- duplicate prevention

### Integration test

- Attempt完了後のsuggestion生成
- AttemptFailureLabel保存
- seed master
- user confirmation
- bottleneck summary query
- optional review作成

### MVC test

- suggested labels表示
- evidence表示
- confirm/reject
- label追加
- bottleneck summary表示
- adaptive review action

## 11. 受け入れ条件

- Attemptの「解けなかった」が複数の具体的labelへ分解される
- system suggestionに根拠がある
- ユーザーが確認・修正できる
- primary bottleneckが工程別に表示される
- 「能力がない」等の人格評価を生成しない
- Daily TemperaturesでUPDATED_REGIONに失敗した場合、適切なlabel候補が出る
- review typeに応じてRECALL、TRANSFER、PATTERN_DISCRIMINATIONを区別できる
- `./mvnw test`が成功する

## 12. 実装後の報告

- 追加・変更ファイル
- migration
- label master
- bottleneck scoring rule
- evidence DTO
- UI確認手順
- commandとtest結果
- heuristicの制約
- Phase 7 CoachProviderが利用できるinterface
