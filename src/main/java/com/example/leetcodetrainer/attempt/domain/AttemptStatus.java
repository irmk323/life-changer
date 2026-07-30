package com.example.leetcodetrainer.attempt.domain;

public enum AttemptStatus {
    IN_PROGRESS("記録中"),
    COMPLETED("記録完了"),
    ABANDONED("中断");

    private final String displayName;

    AttemptStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
