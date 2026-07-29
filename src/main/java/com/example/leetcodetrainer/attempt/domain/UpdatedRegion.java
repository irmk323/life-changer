package com.example.leetcodetrainer.attempt.domain;

public enum UpdatedRegion {
    PREFIX("先頭から連続した部分"), SUFFIX("末尾から連続した部分"), MINIMUM("最小要素"), MAXIMUM("最大要素"), MATCHING_KEY("特定の key に一致する要素"),
    ARBITRARY_POSITION("任意位置"), WHOLE_STATE("状態全体"), INTERVAL("区間"),
    SEARCH_RANGE("候補となる探索範囲"), NOT_APPLICABLE("明示的な分類が不要"), UNKNOWN("分からない");
    private final String displayName;
    UpdatedRegion(String displayName) { this.displayName = displayName; }
    public String getDisplayName() { return displayName; }
}
