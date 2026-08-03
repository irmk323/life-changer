package com.example.leetcodetrainer.postattempt.service;

import com.example.leetcodetrainer.attempt.domain.*;
import com.example.leetcodetrainer.attempt.service.AttemptQuality;
import com.example.leetcodetrainer.failure.dto.BottleneckAnalysis;
import com.example.leetcodetrainer.adaptive.domain.NextLearningTask;
import com.example.leetcodetrainer.adaptive.domain.LearningTaskCard;
import java.util.List;

public record PostAttemptSummary(String outcomeTitle, String outcomeDescription, String durationDisplay, boolean durationWarning,
                                 AttemptQuality quality, List<String> demonstrated, List<String> unmeasured,
                                 List<StageItem> stages, String nextAction, BottleneckAnalysis bottleneckAnalysis, NextLearningTask nextTask, LearningTaskCard taskCard) {
    public record StageItem(StageType stage, String outcome, Integer score, String answer, int hintLevel, boolean exampleViewed) { }
}
