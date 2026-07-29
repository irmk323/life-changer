package com.example.leetcodetrainer.review.domain;

public enum ReviewStatus {
    PENDING("予定"), DUE("本日"), COMPLETED("完了"), MISSED("期限超過"), RESCHEDULED("日程変更済み"), CANCELLED("キャンセル");
    private final String displayName;
    ReviewStatus(String displayName) { this.displayName = displayName; }
    public String getDisplayName() { return displayName; }
}
