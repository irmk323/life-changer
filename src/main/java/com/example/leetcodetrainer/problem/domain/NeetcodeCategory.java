package com.example.leetcodetrainer.problem.domain;

public enum NeetcodeCategory {
    ARRAYS_AND_HASHING("Arrays & Hashing"),
    TWO_POINTERS("Two Pointers"),
    SLIDING_WINDOW("Sliding Window"),
    STACK("Stack"),
    BINARY_SEARCH("Binary Search"),
    LINKED_LIST("Linked List"),
    TREES("Trees"),
    HEAP_PRIORITY_QUEUE("Heap / Priority Queue"),
    BACKTRACKING("Backtracking"),
    TRIES("Tries"),
    GRAPHS("Graphs"),
    ADVANCED_GRAPHS("Advanced Graphs"),
    ONE_DIMENSIONAL_DP("1-D Dynamic Programming"),
    TWO_DIMENSIONAL_DP("2-D Dynamic Programming"),
    GREEDY("Greedy"),
    INTERVALS("Intervals"),
    MATH_AND_GEOMETRY("Math & Geometry"),
    BIT_MANIPULATION("Bit Manipulation");

    private final String displayName;

    NeetcodeCategory(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
