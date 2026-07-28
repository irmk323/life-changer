package com.example.leetcodetrainer.pattern.domain;

import com.example.leetcodetrainer.problem.domain.Problem;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "problem_pattern")
@IdClass(ProblemPatternId.class)
public class ProblemPattern {

    @Id
    @ManyToOne
    @JoinColumn(name = "problem_id", nullable = false)
    private Problem problem;

    @Id
    @ManyToOne
    @JoinColumn(name = "pattern_id", nullable = false)
    private Pattern pattern;

    @Column(nullable = false)
    private boolean primaryPattern;

    @Column(length = 1000)
    private String notes;

    @Column(nullable = false)
    private Instant createdAt;

    protected ProblemPattern() {
    }

    public ProblemPattern(Problem problem, Pattern pattern, boolean primaryPattern, String notes, Instant createdAt) {
        this.problem = problem;
        this.pattern = pattern;
        this.primaryPattern = primaryPattern;
        this.notes = notes;
        this.createdAt = createdAt;
    }

    public Problem getProblem() { return problem; }
    public Pattern getPattern() { return pattern; }
    public boolean isPrimaryPattern() { return primaryPattern; }
    public void setPrimaryPattern(boolean primaryPattern) { this.primaryPattern = primaryPattern; }
    public String getNotes() { return notes; }
}
