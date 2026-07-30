package com.example.leetcodetrainer.attempt.domain;

public enum PriorExposure {
    NEVER_SEEN("初めて見る"),
    SEEN_BUT_NOT_SOLVED("見たことはあるが解法は覚えていない"),
    SOLVED_BEFORE("以前解いたことがある"),
    MEMORISED("解法やコードをかなり覚えている");

    private final String displayName;
    PriorExposure(String displayName) { this.displayName = displayName; }
    public String getDisplayName() { return displayName; }
}
