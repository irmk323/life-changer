package com.example.leetcodetrainer.attempt.domain;

import java.time.Instant;
import java.util.UUID;

public record AttemptCompletedEvent(UUID attemptId, UUID problemId, AttemptType attemptType,
                                    UUID sourceReviewScheduleId, Instant completedAt) { }
