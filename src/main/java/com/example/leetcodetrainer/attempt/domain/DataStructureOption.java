package com.example.leetcodetrainer.attempt.domain;

public enum DataStructureOption {
    ARRAY_LIST("Array / List"), HASH_MAP("HashMap"), HASH_SET("HashSet"), STACK("Stack"),
    QUEUE_DEQUE("Queue / Deque"), HEAP_PRIORITY_QUEUE("Heap / Priority Queue"), LINKED_LIST("Linked List"),
    TREE("Tree"), TRIE("Trie"), GRAPH("Graph"), UNION_FIND("Union Find"), PREFIX_SUM("Prefix Sum"),
    DP_TABLE("DP Table"), OTHER("その他");
    private final String displayName;
    DataStructureOption(String displayName) { this.displayName = displayName; }
    public String getDisplayName() { return displayName; }
}
