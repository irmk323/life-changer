package com.example.leetcodetrainer.analytics.domain;

import com.example.leetcodetrainer.attempt.domain.StageType;

public record StageMetric(StageType stage, Metric success, Double averageHintLevel) {
    public String averageHintDisplay() { return averageHintLevel == null ? "N/A" : String.format(java.util.Locale.ROOT, "%.1f", averageHintLevel); }
}
