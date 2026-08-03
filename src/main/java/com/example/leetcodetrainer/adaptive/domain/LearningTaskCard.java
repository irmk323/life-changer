package com.example.leetcodetrainer.adaptive.domain;
import java.util.UUID;
public record LearningTaskCard(NextLearningTask task, LearningTaskAttemptStatus status, UUID taskAttemptId) { }
