# R2B: Learning State Projection

## 目的

Task実行結果を保存し、MasteryとReviewScheduleへ接続する。

未完了項目:

- Error Repair診断保存
- MasteryState projection
- ReviewScheduleとtask typeの連携

---

# 1. Error Repair診断保存

Error Repair Attemptで次を保存する。

```java
public record ErrorRepairDiagnosis(
    long taskAttemptId,
    String sourceProblemSlug,
    String erroneousCodeId,
    FailureSignature primarySignature,
    List<FailureSignature> secondarySignatures,
    Set<MicroSkill> demonstratedSkills,
    Set<MicroSkill> unresolvedSkills,
    String learnerExplanation
) {}
```

Maximum Depthで最低限扱う。

Primary:

```text
ACCUMULATOR_VS_RETURN_CONFUSION
```

Secondary:

```text
FUNCTION_CONTRACT_MISSING
COMPOSITION_RULE_INCORRECT
NULL_SAFETY_MISSING
```

Primary最大1、Secondary最大2。

---

# 2. MasteryState

```java
public enum MasteryState {
    EXPOSED,
    RECONSTRUCTED,
    MICRO_SKILL_DEMONSTRATED,
    TRANSFERRED,
    DISCRIMINATED,
    RETAINED
}
```

問題単位だけでなく、ProfileまたはMicroSkill単位でもprojectionできるようにする。

## 遷移例

### Two Sum

```text
Known reconstruction success
→ RECONSTRUCTED

Relation drill success
→ MICRO_SKILL_DEMONSTRATED

Movie Ticket transfer success
→ TRANSFERRED

Two Sum / Two Sum II / Subarray Sum discrimination success
→ DISCRIMINATED

Delayed cold solve success
→ RETAINED
```

### Maximum Depth

```text
Error Repair success
→ MICRO_SKILL_DEMONSTRATED for ACCUMULATOR_VS_RETURN

Count Nodes success
→ TRANSFERRED

Minimum Depth distinction success
→ DISCRIMINATED

14-day cold reconstruction
→ RETAINED
```

過去Accepted回数だけでRETAINEDにしない。

---

# 3. Projection Service

```java
public interface MasteryProjectionService {
    MasteryProjection project(LearningEvidence evidence);
}
```

```java
public record MasteryProjection(
    String subjectKey,
    MasteryState previousState,
    MasteryState projectedState,
    String reason,
    Instant projectedAt
) {}
```

状態を後退させる必要がある場合、履歴自体は残す。

例:

```text
過去にRECONSTRUCTED
今回cold reconstruction失敗
→ current retained statusは未達
```

単純に履歴を削除しない。

---

# 4. ReviewScheduleとTask Type

ReviewScheduleに最低限次を持たせる。

- LearningTaskType
- target MicroSkill
- source Problem
- templateId
- dueDate
- status

## Two Sum

```text
Relation drill success
→ +1日: Isomorphic Transfer

Transfer success
→ +4日: Contrast Discrimination

Discrimination success
→ +14日: Delayed Retention
```

## Maximum Depth

```text
Error Repair success
→ 翌日: Four-line Contract

Four-line Contract success
→ +1日: Count Nodes

Count Nodes success
→ +4日: Minimum Depth

Minimum Depth success
→ +7日: Balanced Tree

→ +14日: Maximum Depth Cold Solve
```

同じ問題だけを繰り返さない。

---

# 5. Post-Attempt表示

Task完了後に表示する。

```text
今回更新された学習状態

Accumulator vs Return:
MICRO_SKILL_DEMONSTRATED

次回:
明日 — Count Nodes Transfer
```

Masteryを「完全習得」と誤解させない文言にする。

---

# 6. Test

## Unit

- Error Repair diagnosis
- Primary最大1
- Mastery transitions
- 過去AcceptedだけでRETAINEDにならない
- ReviewSchedule task type
- same-problem過剰反復防止

## Integration

- diagnosis保存
- projection保存
- schedule生成
- task completion連携
- legacy compatibility

## MVC

- mastery update表示
- review task表示
- diagnosis detail
- schedule link

---

# 7. 完了報告

- migration
- diagnosis model
- projection service
- schedule連携
- state transitions
- test結果
- 未実装項目
