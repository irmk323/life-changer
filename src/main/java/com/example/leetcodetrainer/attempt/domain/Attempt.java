package com.example.leetcodetrainer.attempt.domain;

import jakarta.persistence.*;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "attempts")
public class Attempt {
    @Id private UUID id;
    @Column(name = "problem_id", nullable = false) private UUID problemId;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private AttemptType attemptType;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private AttemptStatus status;
    @Column(nullable = false) private Instant startedAt;
    private Instant completedAt;
    private Long durationSeconds;
    @Column(nullable = false) private int currentStageOrder;
    private String language;
    @Enumerated(EnumType.STRING) private FinalResult finalResult;
    private String externalSubmissionResult;
    @Lob private String code;
    private Integer confidenceBefore; private Integer confidenceAfter;
    private String emotion;
    @Lob private String reflectionSummary;
    @Lob private String independentStages; @Lob private String hintNeededStages; @Lob private String unknownStages;
    @Lob private String triggerSentence; @Lob private String falseHypothesis; @Lob private String newUnderstanding;
    @Lob private String nextQuestion; @Lob private String learningObstacle;
    @Column(nullable = false) private int compileErrorCount;
    @Column(nullable = false) private int wrongAnswerCount;
    @Column(nullable = false) private boolean timedOut;
    @Column(nullable = false) private boolean implementationCompleted;
    @Column(nullable = false) private boolean understoodButCouldNotImplement;
    @Column(nullable = false) private boolean edgeCaseFailure;
    private Instant patternRevealedAt;
    @Column(nullable = false) private Instant createdAt;
    @Column(nullable = false) private Instant updatedAt;

    protected Attempt() { }
    public Attempt(UUID id, UUID problemId, AttemptType attemptType, Instant now) {
        this.id = id; this.problemId = problemId; this.attemptType = attemptType; this.status = AttemptStatus.IN_PROGRESS;
        this.startedAt = now; this.currentStageOrder = 1; this.language = "Java"; this.createdAt = now; this.updatedAt = now;
    }
    public void moveTo(StageType stage, Instant now) { requireEditable(); currentStageOrder = stage.getOrder(); updatedAt = now; }
    public void complete(FinalResult result, Instant now) {
        requireEditable(); if (result == null) throw new IllegalArgumentException("最終結果を選択してください。");
        finalResult = result; completedAt = now; durationSeconds = Math.max(0, Duration.between(startedAt, now).getSeconds()); status = AttemptStatus.COMPLETED; updatedAt = now;
    }
    public void abandon(Instant now) { requireEditable(); status = AttemptStatus.ABANDONED; updatedAt = now; }
    public void revealPattern(Instant now) { requireEditable(); if (patternRevealedAt == null) patternRevealedAt = now; updatedAt = now; }
    public void saveImplementation(String language, String code, Integer compileErrors, Integer wrongAnswers, boolean timedOut,
                                   boolean implementationCompleted, boolean understoodButCouldNotImplement, boolean edgeCaseFailure,
                                   String externalSubmissionResult, Instant now) {
        requireEditable(); this.language = language; this.code = code; this.compileErrorCount = nonNegative(compileErrors, "compile error");
        this.wrongAnswerCount = nonNegative(wrongAnswers, "wrong answer"); this.timedOut = timedOut;
        this.implementationCompleted = implementationCompleted; this.understoodButCouldNotImplement = understoodButCouldNotImplement;
        this.edgeCaseFailure = edgeCaseFailure; this.externalSubmissionResult = externalSubmissionResult; updatedAt = now;
    }
    public void saveReflection(String independentStages, String hintNeededStages, String unknownStages, String triggerSentence,
                               String falseHypothesis, String newUnderstanding, String nextQuestion, String emotion,
                               String learningObstacle, Instant now) {
        requireEditable(); this.independentStages = independentStages; this.hintNeededStages = hintNeededStages; this.unknownStages = unknownStages;
        this.triggerSentence = triggerSentence; this.falseHypothesis = falseHypothesis; this.newUnderstanding = newUnderstanding;
        this.nextQuestion = nextQuestion; this.emotion = emotion; this.learningObstacle = learningObstacle; updatedAt = now;
    }
    private int nonNegative(Integer value, String label) { if (value == null) return 0; if (value < 0) throw new IllegalArgumentException(label + " count cannot be negative."); return value; }
    private void requireEditable() { if (status != AttemptStatus.IN_PROGRESS) throw new IllegalStateException("完了または中断した演習は編集できません。"); }
    public UUID getId() { return id; } public UUID getProblemId() { return problemId; } public AttemptType getAttemptType() { return attemptType; }
    public AttemptStatus getStatus() { return status; } public Instant getStartedAt() { return startedAt; } public Instant getCompletedAt() { return completedAt; }
    public Long getDurationSeconds() { return durationSeconds; } public int getCurrentStageOrder() { return currentStageOrder; } public String getLanguage() { return language; }
    public FinalResult getFinalResult() { return finalResult; } public String getExternalSubmissionResult() { return externalSubmissionResult; } public String getCode() { return code; }
    public int getCompileErrorCount() { return compileErrorCount; } public int getWrongAnswerCount() { return wrongAnswerCount; } public boolean isTimedOut() { return timedOut; }
    public boolean isImplementationCompleted() { return implementationCompleted; } public boolean isUnderstoodButCouldNotImplement() { return understoodButCouldNotImplement; }
    public boolean isEdgeCaseFailure() { return edgeCaseFailure; } public Instant getPatternRevealedAt() { return patternRevealedAt; }
    public String getIndependentStages() { return independentStages; } public String getHintNeededStages() { return hintNeededStages; } public String getUnknownStages() { return unknownStages; }
    public String getTriggerSentence() { return triggerSentence; } public String getFalseHypothesis() { return falseHypothesis; } public String getNewUnderstanding() { return newUnderstanding; }
    public String getNextQuestion() { return nextQuestion; } public String getEmotion() { return emotion; } public String getLearningObstacle() { return learningObstacle; }
}
