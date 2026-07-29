package com.example.leetcodetrainer.review.domain;

public enum ReviewQueueFilter {
    DUE_TODAY("本日"), OVERDUE("期限超過"), UPCOMING("今後"), COMPLETED("完了済み"), ALL("すべて");

    private final String displayName;

    ReviewQueueFilter(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
