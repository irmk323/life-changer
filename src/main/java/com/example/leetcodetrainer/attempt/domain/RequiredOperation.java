package com.example.leetcodetrainer.attempt.domain;

public enum RequiredOperation {
    ADD_FIRST("先頭に追加"), ADD_LAST("末尾に追加"), PEEK_FIRST("先頭を参照"), PEEK_LAST("末尾を参照"),
    REMOVE_FIRST("先頭を削除"), REMOVE_LAST("末尾を削除"), LOOKUP_BY_KEY("キー検索"), INSERT_BY_KEY("キーで追加"),
    REMOVE_BY_KEY("キーで削除"), GET_MINIMUM("最小値取得"), GET_MAXIMUM("最大値取得"),
    MAINTAIN_SORTED_ORDER("順序維持"), RANGE_QUERY("範囲問い合わせ"), UNION_COMPONENTS("連結成分の併合"), OTHER("その他");
    private final String displayName;
    RequiredOperation(String displayName) { this.displayName = displayName; }
    public String getDisplayName() { return displayName; }
}
