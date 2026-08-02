# R2C: MVC and Regression Completion

## 目的

R2A / R2Bの機能を、指定されたMVC・Integration・Regression testで固定する。

---

# 1. 必須MVC test

## Profile Workspace

- Two SumでLOOKUP_STATEが表示される
- Maximum DepthでRECURSIVE_DIVIDE_AND_COMBINEが表示される
- Maximum DepthでFour-line Contractが表示される
- NOT_APPLICABLE stageが初期表示されない
- OPTIONAL stageを展開できる

## Post-Attempt

- concrete next-task card
- title
- purpose
- success criteria
- start button
- no-task状態
- evidence不足状態
- invalid template

## Error Repair

- erroneous code表示
- diagnosis input
- primary / secondary signature
- completion

## Mastery / Review

- projected state表示
- next scheduled task
- task type
- due date
- source problem

---

# 2. Integration test

- Flyway migration
- existing local DB upgrade
- legacy Attempt読込
- Two Sum R1 evidence→Relation Task
- Maximum Depth evidence→Error Repair
- Error Repair保存
- Task completion→Mastery projection
- Task completion→ReviewSchedule
- concrete task start
- completed task handling

---

# 3. Regression test

以下を壊さない。

- Two Sum通常Attempt
- Daily Temperatures
- Phase 8 patchの表示名
- Post-Attempt summary
- FailureLabel手動追加
- Analytics
- ReviewSchedule
- HintUsage
- PriorExposure
- active duration
- legacy score 0
- score 1とHint表示
- local Flyway migration

---

# 4. 手動シナリオ

## Scenario A: Two Sum

1. 既知問題として開始
2. Relation blocked
3. 他Lookup工程はindependent
4. 完了
5. Relation First card表示
6. Task開始
7. 成功
8. Movie Ticket Transferが次に出る

## Scenario B: Maximum Depth

1. 以前解いた問題として開始
2. Recursive Profile表示
3. accumulatorを選択
4. composition blocked
5. 完了
6. Error Repair card表示
7. Error Repair実行
8. Four-line Contractへ進む
9. Count Nodesをschedule

## Scenario C: Legacy

1. 既存Attemptを開く
2. migration errorなし
3. UNKNOWN_LEGACY表示
4. failureを過剰生成しない

---

# 5. 完了条件

- `./mvnw test`成功
- MVC test全件成功
- Flyway upgrade成功
- Two SumとMaximum Depthの手動シナリオ成功
- regressionなし
- OpenAI APIなし
- 未完了prompt要件が0件

---

# 6. 最終報告

- test count
- failures
- migration version
- manual verification
- remaining limitations
- 未完了要件が残る場合は明記
