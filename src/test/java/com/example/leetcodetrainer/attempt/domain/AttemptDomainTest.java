package com.example.leetcodetrainer.attempt.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class AttemptDomainTest {
    private final Instant startedAt = Instant.parse("2026-07-28T10:00:00Z");

    @Test
    void stageOrderIsExplicitAndScoresRejectInvalidValues() {
        assertEquals(1, StageType.PROBLEM_RELATION.getOrder());
        assertEquals(13, StageType.REFLECTION.getOrder());
        assertEquals(StageType.DATA_STRUCTURE_SELECTION, StageType.fromOrder(8));
        assertThrows(IllegalArgumentException.class, () -> AssessmentScore.fromValue(3));
        assertEquals("保持する状態・未確定の候補", StageType.UNRESOLVED_STATE.getDisplayName());
        assertEquals("状態の参照・更新対象", StageType.UPDATED_REGION.getDisplayName());
        assertEquals("ここまでの処理から、今後の判断に必要な何を保持しますか？", StageType.UNRESOLVED_STATE.getPrimaryQuestion());
        assertEquals("新しい入力が来たとき、保存状態のどの部分を参照・確定・追加・削除しますか？", StageType.UPDATED_REGION.getPrimaryQuestion());
        assertEquals("候補となる探索範囲", UpdatedRegion.SEARCH_RANGE.getDisplayName());
        assertEquals("明示的な分類が不要", UpdatedRegion.NOT_APPLICABLE.getDisplayName());
        assertEquals("キーから値を取得", RequiredOperation.GET_VALUE_BY_KEY.getDisplayName());
    }

    @Test
    void updatedRegionAndRequiredOperationsNeedEvidenceForPositiveScore() {
        StageAssessment updated = new StageAssessment(UUID.randomUUID(), UUID.randomUUID(), StageType.UPDATED_REGION, startedAt);
        assertThrows(IllegalArgumentException.class, () -> updated.save(new StageSaveCommand("", 2, null, null, null, null, null, "", Set.of()), startedAt));

        StageAssessment operations = new StageAssessment(UUID.randomUUID(), UUID.randomUUID(), StageType.REQUIRED_OPERATIONS, startedAt);
        assertThrows(IllegalArgumentException.class, () -> operations.save(new StageSaveCommand("", 1, null, null, null, null, null, null, Set.of()), startedAt));
        operations.save(new StageSaveCommand("分からない", 0, null, null, null, null, null, null, Set.of()), startedAt);
        assertEquals(0, operations.getScore());
    }

    @Test
    void completionCalculatesNonNegativeDurationAndCannotRunTwice() {
        Attempt attempt = new Attempt(UUID.randomUUID(), UUID.randomUUID(), AttemptType.INITIAL, startedAt);
        attempt.complete(FinalResult.NOT_SOLVED, startedAt.minusSeconds(10));
        assertEquals(0, attempt.getDurationSeconds());
        assertThrows(IllegalStateException.class, () -> attempt.complete(FinalResult.NOT_SOLVED, startedAt));
    }
}
