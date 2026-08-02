# R2 Completion Plan

## 目的

既に実装済みのR2基盤を壊さず、未完了の以下を完成させる。

- Post-Attemptへのconcrete next-task card接続
- Two Sum / Maximum Depth evidenceからのnext-task selection
- Error Repair診断保存
- MasteryState projection
- ReviewScheduleとtask typeの連携
- Profile固有Workspace統合
- MVC / regression test

OpenAI APIや外部LLMは追加しない。

---

# 実装順序

## R2A: 学習ループの画面接続

1. Profile固有Workspace
2. Attempt evidence収集
3. NextTaskSelector
4. concrete next-task card
5. Task開始導線

この段階が完了すると、Attempt完了後に「次に何をするか」が実際に開始できる。

## R2B: 学習状態の永続化

1. Error Repair診断保存
2. MasteryState projection
3. ReviewScheduleとLearningTaskType連携
4. Task完了結果から次状態へ遷移

## R2C: テストと回帰確認

1. MVC test
2. Integration test
3. Regression test
4. Flyway / legacy data確認
5. 手動シナリオ確認

---

# 完了条件

以下が実際に動くこと。

## Two Sum

R1 evidence:

```text
既知問題の再構築成功
PROBLEM_RELATION = blocked
Hint Level 1
他のlookup工程はmostly independent
```

Post-Attempt:

```text
次Task:
Two Sum — Relation First

目的:
問題文を式へ変換する

成功条件:
nums[i] + nums[j] = target
i != j
```

Task開始ボタンからWorkspaceへ遷移できる。

成功後:

```text
Movie Ticket Pair — Relation First
```

へ進める。

## Maximum Depth

Evidence:

```text
左右への再帰あり
count accumulatorを使用
return compositionなし
```

Post-Attempt:

```text
Primary:
ACCUMULATOR_VS_RETURN_CONFUSION

次Task:
Maximum Depth Error Repair
```

Task完了後:

```text
Four-line Recursive Contract
```

その後:

```text
Count Nodes Transfer
```

へ進める。

---

# 実装上の原則

- Primary next taskは最大1件
- Secondary候補は最大2件
- Task title、目的、成功条件、開始ボタンを必ず表示
- 未評価や対象外をfailureにしない
- score 1とHint使用を混同しない
- 同じ問題を無限に再出題しない
- 既存Attemptとmigrationを壊さない
- RuleBasedで決定する
