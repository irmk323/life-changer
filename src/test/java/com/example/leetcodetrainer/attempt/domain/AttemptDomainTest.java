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
