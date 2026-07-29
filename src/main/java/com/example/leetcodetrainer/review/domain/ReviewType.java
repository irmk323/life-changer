package com.example.leetcodetrainer.review.domain;

import com.example.leetcodetrainer.attempt.domain.AttemptType;

public enum ReviewType {
    RECONSTRUCTION("再構築", "コードの再生ではなく、関係から不変条件までを同じ問題で再構築します。", AttemptType.SAME_PROBLEM_REVIEW, 1),
    ISOMORPHIC_TRANSFER("同型転用", "見た目が異なる課題へ、関係・状態・操作の考え方を転用します。", AttemptType.ISOMORPHIC_TRANSFER, 4),
    CONTRAST_CLASSIFICATION("比較・分類", "似ている候補の共通点と決定的な違いを説明します。", AttemptType.CONTRAST_CLASSIFICATION, 7),
    COLD_SOLVE("タグなし cold solve", "タグを見ずに、関係から実装までを時間計測付きで試します。", AttemptType.COLD_SOLVE, 21),
    TARGETED_BOTTLENECK("ボトルネック再確認", "確認した停止工程だけを短期で再確認します。", AttemptType.SAME_PROBLEM_REVIEW, 1);

    private final String displayName; private final String purpose; private final AttemptType attemptType; private final int offsetDays;
    ReviewType(String displayName, String purpose, AttemptType attemptType, int offsetDays) { this.displayName = displayName; this.purpose = purpose; this.attemptType = attemptType; this.offsetDays = offsetDays; }
    public String getDisplayName() { return displayName; } public String getPurpose() { return purpose; }
    public AttemptType getAttemptType() { return attemptType; } public int getOffsetDays() { return offsetDays; }
    public boolean isInitialSequence() { return this != TARGETED_BOTTLENECK; }
}
