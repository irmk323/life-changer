package com.example.leetcodetrainer.curriculum.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "learning_session")
public class LearningSession {
    @Id private UUID id;
    @Column(name = "problem_id", nullable = false) private UUID problemId;
    @Enumerated(EnumType.STRING) private LearningMode suggestedMode;
    @Enumerated(EnumType.STRING) private LearningMode selectedMode;
    @Enumerated(EnumType.STRING) private ProblemExposureState priorExposureSnapshot;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private LearningSessionStatus status;
    private Long timeBoxSeconds;
    @Column(name = "legacy_attempt_id") private UUID legacyAttemptId;
    private String creationReason;
    private Instant startedAt, completedAt, createdAt, updatedAt;

    protected LearningSession() { }

    public LearningSession(UUID id, UUID problemId, LearningMode suggestedMode, LearningMode selectedMode,
                           ProblemExposureState priorExposureSnapshot, Long timeBoxSeconds, UUID legacyAttemptId,
                           String creationReason, Instant now) {
        if (id == null || problemId == null || now == null) throw new IllegalArgumentException("id, problem, and time are required");
        if (timeBoxSeconds != null && timeBoxSeconds <= 0) throw new IllegalArgumentException("time box must be positive");
        this.id = id; this.problemId = problemId; this.suggestedMode = suggestedMode; this.selectedMode = selectedMode;
        this.priorExposureSnapshot = priorExposureSnapshot; this.timeBoxSeconds = timeBoxSeconds;
        this.legacyAttemptId = legacyAttemptId; this.creationReason = creationReason;
        this.status = LearningSessionStatus.PLANNED; this.createdAt = now; this.updatedAt = now;
    }
    public void start(Instant now) {
        if (status != LearningSessionStatus.PLANNED) throw new IllegalStateException("Only planned sessions can start");
        status = LearningSessionStatus.IN_PROGRESS; startedAt = now; updatedAt = now;
    }
    public void complete(Instant now) {
        if (status != LearningSessionStatus.IN_PROGRESS) throw new IllegalStateException("Only in-progress sessions can complete");
        status = LearningSessionStatus.COMPLETED; completedAt = now; updatedAt = now;
    }
    public void abandon(Instant now) {
        if (status == LearningSessionStatus.COMPLETED || status == LearningSessionStatus.ABANDONED) throw new IllegalStateException("Finished sessions cannot be abandoned");
        status = LearningSessionStatus.ABANDONED; updatedAt = now;
    }
    public UUID getId() { return id; } public UUID getProblemId(){return problemId;} public LearningMode getSuggestedMode(){return suggestedMode;}
    public LearningMode getSelectedMode(){return selectedMode;} public ProblemExposureState getPriorExposureSnapshot(){return priorExposureSnapshot;}
    public LearningSessionStatus getStatus(){return status;} public UUID getLegacyAttemptId(){return legacyAttemptId;}
    public Instant getStartedAt() { return startedAt; } public Instant getCompletedAt() { return completedAt; }
}
