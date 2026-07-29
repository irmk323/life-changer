package com.example.leetcodetrainer.analytics.domain;

/** A rate deliberately keeps its denominator so zero observations remain N/A, not 0%. */
public record Metric(long successes, long assistedSuccesses, long sampleSize) {
    public boolean hasData() { return sampleSize > 0; }
    public Integer independentPercent() { return percent(successes); }
    public Integer assistedPercent() { return percent(assistedSuccesses); }
    private Integer percent(long numerator) { return hasData() ? (int) Math.round(numerator * 100.0 / sampleSize) : null; }
    public String independentDisplay() { return display(independentPercent()); }
    public String assistedDisplay() { return display(assistedPercent()); }
    private String display(Integer value) { return value == null ? "N/A" : value + "%"; }
}
