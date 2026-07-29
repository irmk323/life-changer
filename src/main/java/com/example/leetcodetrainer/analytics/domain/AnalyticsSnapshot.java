package com.example.leetcodetrainer.analytics.domain;

import com.example.leetcodetrainer.attempt.domain.StageType;
import java.util.List;

public record AnalyticsSnapshot(AnalyticsPeriod period, List<StageMetric> stageMetrics, Metric retention, Metric transfer,
                                Metric classification, Metric implementation, Long medianPatternSeconds,
                                Long medianWorkingSolutionSeconds, List<FailureCount> failures,
                                List<ReviewImprovement> reviewImprovements) {
    public StageMetric metric(StageType stage) { return stageMetrics.stream().filter(metric -> metric.stage() == stage).findFirst().orElseThrow(); }
    public record FailureCount(String name, StageType relatedStage, long count) { }
    public record ReviewImprovement(String reviewType, int scoreDelta, int hintDelta) { }
}
