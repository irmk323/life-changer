package com.example.leetcodetrainer.attempt.domain;

public enum UpdatedRegion {
    PREFIX("先頭側"), SUFFIX("末尾側"), MINIMUM("最小値"), MAXIMUM("最大値"), MATCHING_KEY("一致キー"),
    ARBITRARY_POSITION("任意位置"), WHOLE_STATE("状態全体"), INTERVAL("区間"), UNKNOWN("不明");
    private final String displayName;
    UpdatedRegion(String displayName) { this.displayName = displayName; }
    public String getDisplayName() { return displayName; }
}
