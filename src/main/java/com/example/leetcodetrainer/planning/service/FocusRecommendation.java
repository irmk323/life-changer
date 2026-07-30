package com.example.leetcodetrainer.planning.service;

import com.example.leetcodetrainer.analytics.domain.AnalyticsPeriod;
import com.example.leetcodetrainer.analytics.domain.Metric;
import com.example.leetcodetrainer.attempt.domain.StageType;
import java.util.List;

public record FocusRecommendation(boolean available, StageType stage, AnalyticsPeriod period, Metric success,
                                  long hintUsageCount, List<String> relatedFailureLabels,
                                  long problemCount, long sampleSize) {
    public static FocusRecommendation unavailable() {
        return new FocusRecommendation(false, null, null, null, 0, List.of(), 0, 0);
    }
}
