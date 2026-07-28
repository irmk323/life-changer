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

# Phase 7: RuleBasedCoach

## 1. このPhaseの目的

Attempt記録後に、根拠のない励ましではなく、実際のstage score、HintUsage、FailureLabel、過去推移に基づくメンタルサポートと次の学習行動を提示してください。

Coachの役割は以下です。

- できた工程と止まった工程を分離する
- 「問題全体ができない」を具体的なボトルネックへ変換する
- ユーザーの能力や人格を断定しない
- 次回の観察可能なテストを1つ提示する
- 過去の自分との比較を使う
- 感情を否定しない
- 医療・心理診断をしない

デフォルトは完全にローカルなrule-based実装としてください。

## 2. Provider abstraction

以下に相当するinterfaceを実装してください。

```java
public interface CoachProvider {
    CoachingResponse generate(CoachingContext context);
}
```

実際のpackageや型は既存設計に合わせてください。

### Default implementation

- `RuleBasedCoachProvider`

### 将来のextension point

- `OllamaCoachProvider`等を追加可能
- ただしこのPhaseでは外部AI APIもOllamaも実装必須ではない
- feature flagがoffの状態でRuleBasedだけで完全動作する

## 3. CoachingContext

最低限、以下を含めてください。

- Attempt
- Problem
- AttemptType
- StageAssessments
- max hint level per stage
- confirmed FailureLabels
- primary bottleneck
- previous attempts for same Problem
- recent attempts for same Pattern
- transfer results
- duration
- confidenceBefore / confidenceAfter
- emotion
- review source nullable

context組み立てはProvider外のserviceで行い、Providerがrepositoryへ直接アクセスしない設計を推奨します。

## 4. CoachingResponse

構造化されたresponseにしてください。

最低限:

- `observation`
- `bottleneck`
- `interpretation`
- `nextTest`
- `evidence`
- `emotionalAcknowledgement` nullable
- `safetyNote` nullable

表示時に単一文章へ結合してもよいですが、保存とtestのために構造を維持してください。

### Observation

今回、自力でできたことをstage evidenceに基づいて述べる。

例:

> 関係抽出とbrute forceはヒントなしで完了しました。

### Bottleneck

停止した工程を具体的に述べる。

例:

> UPDATED_REGIONでLevel 3のヒントを使用し、score 1でした。

### Interpretation

能力全体ではなく、現在不足している技能を限定する。

例:

> Stackの知識そのものより、未解決候補のどの部分が更新されるかを操作へ変換する工程が現在のボトルネックです。

### Next Test

次回に行う、1つの観察可能な行動を示す。

例:

> 次回はデータ構造名を考える前に、更新される部分を「先頭・末尾・最小・最大・key・全体」から選んでください。

### Evidence

score、hint、過去比較等の短い根拠。

## 5. Rule selection

以下の優先順位を基本にしてください。

1. safety-sensitiveなemotionまたは自由記述
2. Attempt未完了・記録不足
3. primary bottleneck
4. transfer failure
5. recall failure
6. implementation-only failure
7. 改善が確認できたstage
8. 次回test

### 5.1 事実ベースの成功表現

使用可能:

- 「前回score 0だったINVARIANTが今回は1になりました」
- 「今回はLevel 4ではなくLevel 2で進めました」
- 「実装には失敗しましたが、関係抽出からデータ構造選択までは自力でした」

避ける:

- 「天才です」
- 「必ず上達しています」
- 「15分頑張って偉い」
- 根拠なく「大丈夫」
- 結果を無視した称賛

### 5.2 失敗時の表現

使用可能:

- 「今回停止したのはBRUTE_FORCEではなくUPDATED_REGIONです」
- 「問題全体が理解できなかったわけではありません」
- 「次に検証する対象は操作の導出です」

避ける:

- 「考え方が間違っています」
- 「数学が苦手だからです」
- 「才能がありません」
- 「もっと努力しましょう」

### 5.3 Emotion

Attemptのemotionがfrustrated、anxious、ashamed、hopeless、tired等の場合、短いacknowledgementを追加してください。

例:

> 何度解いても思い出せないと、能力そのものの問題に感じやすい状態です。今回の記録では、関係抽出とbrute forceはできており、停止地点はUPDATED_REGIONに限定されています。

感情を否定せず、同時に観測事実へ戻してください。

## 6. Safety boundary

これは医療アプリではありません。

- 診断しない
- 治療を提案しない
- 危険度を独自判定しない
- ユーザー自由記述に自傷・自殺を示唆する内容がある場合、通常の学習coachingだけを返さず、安全案内が必要であることをUIに示すextension pointを設ける
- ローカルアプリ内に固定の緊急連絡先を国不明のまま断定表示しない
- このPhaseでは高度なcrisis detectionを実装せず、keyword検知を使う場合は誤判定と限界を明記する

最低限、`CoachingResponse.safetyNote`を設定できる設計にしてください。

## 7. CoachingMessage persistence

推奨フィールド:

- `id`
- `attemptId`
- `provider`
- structured response fieldsまたはserialized payload
- renderedMessage
- generatedAt
- version

要件:

- 同じAttemptに複数versionを保存できるか、再生成で上書きするか方針を明確にする
- 推奨はversioned append-only
- rule変更後も過去messageを再現できるようprovider/versionを保存する

## 8. RuleBasedCoachの最低限のrule

以下をカバーしてください。

- 上流stageは成功し、特定stageで初めて0になった
- score 0から1、1から2へ改善
- hint levelが低下
- 同じProblemは解けるがISOMORPHIC_TRANSFERに失敗
- patternは分かったがIMPLEMENTATIONに失敗
- LANGUAGE_SYNTAXがprimary
- TIME_PRESSUREがprimary
- 複数stageが未回答
- すべてscore 2
- emotionがnegative
- confirmed labelがない場合のfallback

### Daily Temperaturesの例

入力:

- PROBLEM_RELATION = 2
- BRUTE_FORCE = 2
- REPEATED_WORK = 2
- UNRESOLVED_STATE = 1
- UPDATED_REGION = 0
- REQUIRED_OPERATIONS = 1
- DATA_STRUCTURE_SELECTION = 1
- primary label = UPDATED_REGION_IDENTIFICATION

期待する趣旨:

- 問題全体が理解できなかったとは言わない
- relationとbrute forceの成功を示す
- updated regionを具体的ボトルネックとする
- 次回はdata structure名より前に更新部分を分類するよう提案
- evidenceを示す

## 9. UI

Attempt完了画面とAttempt詳細に以下を表示してください。

- Coaching message
- Observation
- Bottleneck
- Next Test
- Evidence
- emotion acknowledgement
- 再生成buttonは必要なら提供
- Provider名やrule versionは詳細欄で確認可能

「メンタルサポート」という大きな見出しより、「今回の分析」「次回の検証」等の中立的表現を推奨します。

## 10. 今回の非対象

- 外部AI API
- 実際のOllama連携
- 心理診断
- 治療助言
- chat UI
- 複数ターン会話
- 自動で励ます通知
- gamification
- 他ユーザー比較

## 11. Flyway

- coaching_messages
- indexes
- attempt foreign key
- provider/version fields

## 12. テスト要件

### Unit test

各ruleをtable-drivenまたはparameterized testで検証してください。

- observation generation
- primary bottleneck message
- next test selection
- score improvement
- hint reduction
- transfer failure
- implementation failure
- syntax failure
- all score 2
- incomplete data fallback
- negative emotion acknowledgement
- forbidden人格断定表現が出ないこと
- provider version

可能なら、禁止語または危険な断定表現のregression testを追加してください。

### Integration test

- CoachingContext構築
- Attempt完了後のmessage生成
- message persistence
- regeneration/version
- confirmed FailureLabel利用

### MVC test

- completion page表示
- Attempt detail表示
- evidence表示
- fallback表示
- safetyNote表示領域

## 13. 受け入れ条件

- Attempt完了後に事実ベースのcoachingが生成される
- できた工程と詰まった工程が分離される
- 次回の具体的testが1つ提示される
- score・hint・labelをevidenceとして使う
- 根拠のない称賛をしない
- ユーザーの能力・人格を断定しない
- negative emotionを否定しない
- 外部通信なしで動作する
- `./mvnw test`が成功する

## 14. 実装後の報告

- 追加・変更ファイル
- migration
- CoachProvider interface
- rule一覧
- provider versioning
- safety boundary
- UI確認手順
- commandとtest結果
- Phase 8 Analyticsで利用できるdata
