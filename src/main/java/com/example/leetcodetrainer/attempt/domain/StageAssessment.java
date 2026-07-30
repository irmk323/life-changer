package com.example.leetcodetrainer.attempt.domain;

import jakarta.persistence.*;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "stage_assessments", uniqueConstraints = @UniqueConstraint(columnNames = {"attempt_id", "stage_type"}))
public class StageAssessment {
    @Id private UUID id;
    @Column(name = "attempt_id", nullable = false) private UUID attemptId;
    @Enumerated(EnumType.STRING) @Column(name = "stage_type", nullable = false) private StageType stageType;
    @Lob private String answer;
    private Integer score;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private StageAssessmentStatus assessmentStatus = StageAssessmentStatus.NOT_STARTED;
    private Long durationSeconds;
    private Instant startedAt; private Instant completedAt;
    @Lob private String evaluatorNotes;
    private String timeComplexity; private String spaceComplexity; @Lob private String trace;
    @Enumerated(EnumType.STRING) private UpdatedRegion updatedRegion;
    @Enumerated(EnumType.STRING) private DataStructureOption dataStructure;
    @Lob private String selectionReason;
    @ElementCollection(targetClass = RequiredOperation.class)
    @CollectionTable(name = "stage_assessment_required_operations", joinColumns = @JoinColumn(name = "stage_assessment_id"))
    @Column(name = "operation_code", nullable = false)
    @Enumerated(EnumType.STRING)
    private Set<RequiredOperation> requiredOperations = new LinkedHashSet<>();
    @Column(nullable = false) private Instant createdAt; @Column(nullable = false) private Instant updatedAt;

    protected StageAssessment() { }
    public StageAssessment(UUID id, UUID attemptId, StageType stageType, Instant now) { this.id = id; this.attemptId = attemptId; this.stageType = stageType; this.createdAt = now; this.updatedAt = now; }
    public void markStarted(Instant now) { if (startedAt == null) { startedAt = now; assessmentStatus = StageAssessmentStatus.IN_PROGRESS; updatedAt = now; } }
    /** Completion must never turn an unvisited stage into a failed assessment. */
    public void markSkipped(Instant now) {
        if (score != null) return;
        assessmentStatus = StageAssessmentStatus.NOT_STARTED;
        updatedAt = now;
    }
    public void save(StageSaveCommand command, Instant now) {
        answer = command.answer(); timeComplexity = command.timeComplexity(); spaceComplexity = command.spaceComplexity(); trace = command.trace();
        updatedRegion = command.updatedRegion(); dataStructure = command.dataStructure(); selectionReason = command.selectionReason();
        requiredOperations.clear(); if (command.requiredOperations() != null) requiredOperations.addAll(command.requiredOperations());
        if (command.score() != null) complete(command.score(), now); else { if (assessmentStatus == StageAssessmentStatus.NOT_STARTED) assessmentStatus = StageAssessmentStatus.IN_PROGRESS; updatedAt = now; }
    }
    private void complete(Integer rawScore, Instant now) {
        AssessmentScore assessmentScore = AssessmentScore.fromValue(rawScore);
        validateSpecificInputs(assessmentScore);
        score = assessmentScore.getValue(); assessmentStatus = StageAssessmentStatus.ASSESSED; completedAt = now;
        if (startedAt == null) startedAt = now;
        durationSeconds = Math.max(0, Duration.between(startedAt, now).getSeconds()); updatedAt = now;
    }
    public void setAssessmentStatus(StageAssessmentStatus status, Integer score, Instant now) {
        if (status == StageAssessmentStatus.ASSESSED) { if (score == null) throw new IllegalArgumentException("評価済みには0〜2点が必要です。"); complete(score, now); return; }
        if (score != null) throw new IllegalArgumentException("未評価・スキップ・対象外には点数を設定できません。");
        assessmentStatus = status; this.score = null; completedAt = null; durationSeconds = null; updatedAt = now;
    }
    private void validateSpecificInputs(AssessmentScore assessmentScore) {
        if (assessmentScore == AssessmentScore.NOT_ABLE) return;
        if (stageType == StageType.UPDATED_REGION && (updatedRegion == null || isBlank(selectionReason)))
            throw new IllegalArgumentException("更新領域とその理由を入力してください。");
        if (stageType == StageType.REQUIRED_OPERATIONS && requiredOperations.isEmpty())
            throw new IllegalArgumentException("必要な操作を少なくとも1つ選択してください。");
        if (stageType == StageType.DATA_STRUCTURE_SELECTION && (dataStructure == null || isBlank(selectionReason)))
            throw new IllegalArgumentException("データ構造と選択理由を入力してください。");
    }
    private boolean isBlank(String value) { return value == null || value.isBlank(); }
    public UUID getId() { return id; } public UUID getAttemptId() { return attemptId; } public StageType getStageType() { return stageType; }
    public String getAnswer() { return answer; } public Integer getScore() { return score; } public StageAssessmentStatus getAssessmentStatus() { return assessmentStatus; } public Long getDurationSeconds() { return durationSeconds; }
    public Instant getStartedAt() { return startedAt; } public Instant getCompletedAt() { return completedAt; }
    public String getTimeComplexity() { return timeComplexity; } public String getSpaceComplexity() { return spaceComplexity; } public String getTrace() { return trace; }
    public UpdatedRegion getUpdatedRegion() { return updatedRegion; } public DataStructureOption getDataStructure() { return dataStructure; }
    public String getSelectionReason() { return selectionReason; } public Set<RequiredOperation> getRequiredOperations() { return Set.copyOf(requiredOperations); }
}
