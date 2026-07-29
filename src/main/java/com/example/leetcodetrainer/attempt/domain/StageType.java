package com.example.leetcodetrainer.attempt.domain;

import java.util.Arrays;
import java.util.List;

public enum StageType {
    PROBLEM_RELATION(1, "問題の関係", "物語を取り除き、何と何の関係を求める問題かを書きます。", "何と何の関係を求める問題ですか？", List.of()),
    BRUTE_FORCE(2, "Brute force", "遅くても正しい手順と計算量を説明します。", "遅くても正しい方法は何ですか？", List.of()),
    REPEATED_WORK(3, "重複処理", "Brute force のどの仕事が繰り返されるかを特定します。", "同じ処理を何度も行っている部分はどこですか？", List.of()),
    UNRESOLVED_STATE(4, "保持する状態・未確定の候補", "今後の判断に必要な情報や、まだ答えが確定していない候補を保持する工程です。", "ここまでの処理から、今後の判断に必要な何を保持しますか？", List.of("後からもう一度必要になる情報は何ですか？", "まだ答えが確定していない要素はありますか？ 何を待っていますか？", "未来の入力と比べるために、値だけでなく index や位置も必要ですか？", "探索範囲や途中結果そのものが状態になりますか？")),
    RESOLUTION_EVENT(5, "確定イベント", "新しい入力で何が確定するかを書きます。", "新しい入力が来たとき、何が確定しますか？", List.of()),
    UPDATED_REGION(6, "状態の参照・更新対象", "新しい入力に対して、保存した状態のどこを参照し、確定・追加・削除・置換するかを説明する工程です。", "新しい入力が来たとき、保存状態のどの部分を参照・確定・追加・削除しますか？", List.of("先頭または末尾から連続した部分ですか？", "特定の key、一番小さい値、一番大きい値を参照しますか？", "探索範囲や区間を縮めますか？", "参照する部分と、追加・削除する部分は同じですか？")),
    REQUIRED_OPERATIONS(7, "必要操作", "解法に必要な追加・参照・削除・検索操作を列挙します。", "状態に対して、どの操作が必要ですか？", List.of()),
    DATA_STRUCTURE_SELECTION(8, "データ構造選択", "必要操作を根拠にデータ構造を選びます。", "必要な操作を効率よく行える構造は何ですか？", List.of()),
    INVARIANT(9, "不変条件", "途中で維持される条件と、停止できる理由を説明します。", "途中で常に成り立つ条件は何ですか？", List.of()),
    CORRECTNESS_AND_COMPLEXITY(10, "正しさと計算量", "正しさ、時間計算量、空間計算量を説明します。", "なぜ正しく、どれくらいの計算量ですか？", List.of()),
    IMPLEMENTATION(11, "実装", "実装結果と外部提出結果を記録します。", "考えた状態と操作を、コードのどこで表現しますか？", List.of()),
    TRANSFER(12, "転移", "別表現・同型問題へどう転用するかを書きます。", "見た目が変わっても、どの考え方を再利用できますか？", List.of()),
    REFLECTION(13, "振り返り", "できた工程、詰まった工程、次回の手掛かりを記録します。", "次回のために、何を残しますか？", List.of());

    private final int order; private final String displayName; private final String objective; private final String primaryQuestion; private final List<String> helperQuestions;
    StageType(int order, String displayName, String objective, String primaryQuestion, List<String> helperQuestions) { this.order = order; this.displayName = displayName; this.objective = objective; this.primaryQuestion = primaryQuestion; this.helperQuestions = List.copyOf(helperQuestions); }
    public int getOrder() { return order; }
    public String getDisplayName() { return displayName; }
    public String getObjective() { return objective; }
    public String getPrimaryQuestion() { return primaryQuestion; }
    public List<String> getHelperQuestions() { return helperQuestions; }
    public static StageType fromOrder(int order) {
        return Arrays.stream(values()).filter(stage -> stage.order == order).findFirst()
                .orElseThrow(() -> new IllegalArgumentException("存在しない工程です。"));
    }
    public static List<StageType> ordered() { return List.of(values()); }
}
