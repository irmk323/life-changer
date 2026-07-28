package com.example.leetcodetrainer.pattern.domain;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class ProblemPatternId implements Serializable {
    private UUID problem;
    private UUID pattern;

    protected ProblemPatternId() {
    }

    public ProblemPatternId(UUID problem, UUID pattern) {
        this.problem = problem;
        this.pattern = pattern;
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) return true;
        if (!(other instanceof ProblemPatternId that)) return false;
        return Objects.equals(problem, that.problem) && Objects.equals(pattern, that.pattern);
    }

    @Override
    public int hashCode() {
        return Objects.hash(problem, pattern);
    }
}
