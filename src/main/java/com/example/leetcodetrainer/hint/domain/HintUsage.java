package com.example.leetcodetrainer.hint.domain;

import com.example.leetcodetrainer.attempt.domain.StageType;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "hint_usages", uniqueConstraints = @UniqueConstraint(columnNames = {"attempt_id", "hint_id"}))
public class HintUsage {
    @Id private UUID id;
    @Column(name = "attempt_id", nullable = false) private UUID attemptId;
    @Column(name = "stage_assessment_id", nullable = false) private UUID stageAssessmentId;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "hint_id", nullable = false) private Hint hint;
    @Enumerated(EnumType.STRING) @Column(name = "stage_type", nullable = false) private StageType stageType;
    @Column(name = "hint_level", nullable = false) private int hintLevel;
    @Column(nullable = false) private Instant usedAt;
    private Boolean helpedUserProceed;
    @Lob private String userNote;

    protected HintUsage() { }
    public HintUsage(UUID id, UUID attemptId, UUID stageAssessmentId, Hint hint, Instant usedAt) {
        this.id = id; this.attemptId = attemptId; this.stageAssessmentId = stageAssessmentId; this.hint = hint;
        this.stageType = hint.getStageType(); this.hintLevel = hint.getHintLevel(); this.usedAt = usedAt;
    }
    public void recordOutcome(boolean helpedUserProceed, String userNote) { this.helpedUserProceed = helpedUserProceed; this.userNote = userNote; }
    public UUID getId() { return id; } public UUID getAttemptId() { return attemptId; } public UUID getStageAssessmentId() { return stageAssessmentId; }
    public Hint getHint() { return hint; } public StageType getStageType() { return stageType; } public int getHintLevel() { return hintLevel; }
    public Instant getUsedAt() { return usedAt; } public Boolean getHelpedUserProceed() { return helpedUserProceed; } public String getUserNote() { return userNote; }
}
