package com.example.leetcodetrainer.attempt.domain;

/** A missing self-assessment is deliberately distinct from a score of zero. */
public enum StageAssessmentStatus {
    NOT_STARTED("未評価"),
    IN_PROGRESS("未評価"),
    ASSESSED("評価済み"),
    SKIPPED("スキップ"),
    NOT_APPLICABLE("対象外");

    private final String displayName;
    StageAssessmentStatus(String displayName) { this.displayName = displayName; }
    public String getDisplayName() { return displayName; }
}
