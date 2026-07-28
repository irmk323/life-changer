package com.example.leetcodetrainer.attempt.domain;

import java.util.Arrays;
import java.util.List;

public enum StageType {
    PROBLEM_RELATION(1, "問題の関係", "物語を取り除き、何と何の関係を求める問題かを書きます。"),
    BRUTE_FORCE(2, "Brute force", "遅くても正しい手順と計算量を説明します。"),
    REPEATED_WORK(3, "重複処理", "Brute force のどの仕事が繰り返されるかを特定します。"),
    UNRESOLVED_STATE(4, "未解決状態", "まだ答えが確定していない仕事を表現します。"),
    RESOLUTION_EVENT(5, "確定イベント", "新しい入力で何が確定するかを書きます。"),
    UPDATED_REGION(6, "更新領域", "未解決状態のどこが更新されるかを選び、理由を書きます。"),
    REQUIRED_OPERATIONS(7, "必要操作", "解法に必要な追加・参照・削除・検索操作を列挙します。"),
    DATA_STRUCTURE_SELECTION(8, "データ構造選択", "必要操作を根拠にデータ構造を選びます。"),
    INVARIANT(9, "不変条件", "途中で維持される条件と、停止できる理由を説明します。"),
    CORRECTNESS_AND_COMPLEXITY(10, "正しさと計算量", "正しさ、時間計算量、空間計算量を説明します。"),
    IMPLEMENTATION(11, "実装", "実装結果と外部提出結果を記録します。"),
    TRANSFER(12, "転移", "別表現・同型問題へどう転用するかを書きます。"),
    REFLECTION(13, "振り返り", "できた工程、詰まった工程、次回の手掛かりを記録します。");

    private final int order; private final String displayName; private final String objective;
    StageType(int order, String displayName, String objective) { this.order = order; this.displayName = displayName; this.objective = objective; }
    public int getOrder() { return order; }
    public String getDisplayName() { return displayName; }
    public String getObjective() { return objective; }
    public static StageType fromOrder(int order) {
        return Arrays.stream(values()).filter(stage -> stage.order == order).findFirst()
                .orElseThrow(() -> new IllegalArgumentException("存在しない工程です。"));
    }
    public static List<StageType> ordered() { return List.of(values()); }
}
