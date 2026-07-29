package com.example.leetcodetrainer.review.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import org.junit.jupiter.api.Test;

class ReviewSchedulePolicyTest {
    @Test
    void calculatesOneFourSevenAndTwentyOneDaysInTheConfiguredZone() {
        var dates = ReviewSchedulePolicy.initialDates(Instant.parse("2026-03-29T00:30:00Z"), ZoneId.of("Europe/London"));
        assertEquals(LocalDate.of(2026, 3, 30), dates.get(ReviewType.RECONSTRUCTION));
        assertEquals(LocalDate.of(2026, 4, 2), dates.get(ReviewType.ISOMORPHIC_TRANSFER));
        assertEquals(LocalDate.of(2026, 4, 5), dates.get(ReviewType.CONTRAST_CLASSIFICATION));
        assertEquals(LocalDate.of(2026, 4, 19), dates.get(ReviewType.COLD_SOLVE));
    }

    @Test
    void derivesDueAndOverdueWithoutPersistingThem() {
        LocalDate today = LocalDate.of(2026, 7, 28);
        assertEquals(ReviewStatus.DUE, ReviewSchedulePolicy.effectiveStatus(ReviewStatus.PENDING, today, today));
        assertEquals(ReviewStatus.MISSED, ReviewSchedulePolicy.effectiveStatus(ReviewStatus.PENDING, today.minusDays(1), today));
        assertEquals(ReviewStatus.PENDING, ReviewSchedulePolicy.effectiveStatus(ReviewStatus.PENDING, today.plusDays(1), today));
        assertEquals(ReviewStatus.COMPLETED, ReviewSchedulePolicy.effectiveStatus(ReviewStatus.COMPLETED, today.minusDays(1), today));
    }

    @Test
    void mapsEachReviewPurposeToItsDedicatedAttemptType() {
        assertEquals(com.example.leetcodetrainer.attempt.domain.AttemptType.SAME_PROBLEM_REVIEW, ReviewType.RECONSTRUCTION.getAttemptType());
        assertEquals(com.example.leetcodetrainer.attempt.domain.AttemptType.ISOMORPHIC_TRANSFER, ReviewType.ISOMORPHIC_TRANSFER.getAttemptType());
        assertEquals(com.example.leetcodetrainer.attempt.domain.AttemptType.CONTRAST_CLASSIFICATION, ReviewType.CONTRAST_CLASSIFICATION.getAttemptType());
        assertEquals(com.example.leetcodetrainer.attempt.domain.AttemptType.COLD_SOLVE, ReviewType.COLD_SOLVE.getAttemptType());
    }
}
