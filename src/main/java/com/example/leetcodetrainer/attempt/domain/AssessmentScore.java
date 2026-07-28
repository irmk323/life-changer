package com.example.leetcodetrainer.attempt.domain;

import java.util.Arrays;

public enum AssessmentScore {
    NOT_ABLE(0, "できなかった"), WITH_SUPPORT(1, "補助があればできた"), INDEPENDENT(2, "自力でできた");

    private final int value;
    private final String displayName;
    AssessmentScore(int value, String displayName) { this.value = value; this.displayName = displayName; }
    public int getValue() { return value; }
    public String getDisplayName() { return displayName; }
    public static AssessmentScore fromValue(Integer value) {
        if (value == null) return null;
        return Arrays.stream(values()).filter(score -> score.value == value).findFirst()
                .orElseThrow(() -> new IllegalArgumentException("評価は0、1、2のいずれかです。"));
    }
}
