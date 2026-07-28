package com.example.leetcodetrainer.attempt.domain;

public enum FinalResult {
    SOLVED_INDEPENDENTLY("自力で解けた"),
    SOLVED_WITH_HINT("補助があれば解けた"),
    UNDERSTOOD_AFTER_SOLUTION("解答確認後に理解した"),
    PARTIALLY_SOLVED("一部まで解けた"),
    NOT_SOLVED("解けなかった"),
    IMPLEMENTATION_FAILED("実装で失敗した");

    private final String displayName;
    FinalResult(String displayName) { this.displayName = displayName; }
    public String getDisplayName() { return displayName; }
}
