package com.example.leetcodetrainer.curriculum.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "problem_exposure")
public class ProblemExposure {
    @Id private UUID id;
    @Column(name = "problem_id", nullable = false, unique = true) private UUID problemId;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private ProblemExposureState state;
    private Instant firstExposedAt, lastExposedAt, createdAt, updatedAt;
    protected ProblemExposure() { }
    public ProblemExposure(UUID id, UUID problemId, ProblemExposureState state, Instant observedAt) {
        if (id == null || problemId == null || state == null || observedAt == null) throw new IllegalArgumentException("exposure fields are required");
        this.id = id; this.problemId = problemId; this.state = state; this.firstExposedAt = observedAt;
        this.lastExposedAt = observedAt; this.createdAt = observedAt; this.updatedAt = observedAt;
    }
    public void updateState(ProblemExposureState state, Instant observedAt) {
        if (state == null || observedAt == null) throw new IllegalArgumentException("state and time are required");
        this.state = state; this.lastExposedAt = observedAt; this.updatedAt = observedAt;
    }
    public UUID getId() { return id; } public UUID getProblemId(){return problemId;} public ProblemExposureState getState(){return state;}
}
