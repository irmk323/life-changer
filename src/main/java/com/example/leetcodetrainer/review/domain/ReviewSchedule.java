package com.example.leetcodetrainer.review.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "review_schedules", uniqueConstraints = @UniqueConstraint(columnNames = {"source_attempt_id", "review_type"}))
public class ReviewSchedule {
    @Id private UUID id;
    @Column(name = "source_attempt_id", nullable = false) private UUID sourceAttemptId;
    @Column(name = "source_problem_id", nullable = false) private UUID sourceProblemId;
    @Column(name = "assigned_problem_id") private UUID assignedProblemId;
    @Column(name = "pattern_id") private UUID patternId;
    @Column(name = "failure_label_id") private UUID failureLabelId;
    @Enumerated(EnumType.STRING) @Column(name = "review_type", nullable = false) private ReviewType reviewType;
    @Column(name = "scheduled_date", nullable = false) private LocalDate scheduledDate;
    private Instant completedAt;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private ReviewStatus status;
    @Column(name = "completion_attempt_id") private UUID completionAttemptId;
    @Lob private String assignmentNotes;
    @Lob private String rescheduleReason;
    @Column(nullable = false) private Instant createdAt;
    @Column(nullable = false) private Instant updatedAt;

    protected ReviewSchedule() { }
    public ReviewSchedule(UUID id, UUID sourceAttemptId, UUID sourceProblemId, UUID assignedProblemId, UUID patternId,
                          ReviewType reviewType, LocalDate scheduledDate, String assignmentNotes, Instant now) {
        this.id = id; this.sourceAttemptId = sourceAttemptId; this.sourceProblemId = sourceProblemId; this.assignedProblemId = assignedProblemId;
        this.patternId = patternId; this.reviewType = reviewType; this.scheduledDate = scheduledDate; this.assignmentNotes = assignmentNotes;
        this.status = ReviewStatus.PENDING; this.createdAt = now; this.updatedAt = now;
    }
    public ReviewSchedule(UUID id, UUID sourceAttemptId, UUID sourceProblemId, UUID assignedProblemId, UUID patternId,
                          ReviewType reviewType, LocalDate scheduledDate, String assignmentNotes, String rescheduleReason, Instant now) {
        this(id, sourceAttemptId, sourceProblemId, assignedProblemId, patternId, reviewType, scheduledDate, assignmentNotes, now);
        this.rescheduleReason = rescheduleReason;
    }
    public ReviewSchedule(UUID id, UUID sourceAttemptId, UUID sourceProblemId, UUID assignedProblemId, UUID patternId, UUID failureLabelId,
                          ReviewType reviewType, LocalDate scheduledDate, String assignmentNotes, String rescheduleReason, Instant now) {
        this(id, sourceAttemptId, sourceProblemId, assignedProblemId, patternId, reviewType, scheduledDate, assignmentNotes, rescheduleReason, now);
        this.failureLabelId = failureLabelId;
    }
    public ReviewStatus effectiveStatus(LocalDate today) {
        if (status == ReviewStatus.COMPLETED || status == ReviewStatus.CANCELLED) return status;
        if (scheduledDate.isBefore(today)) return ReviewStatus.MISSED;
        if (scheduledDate.isEqual(today)) return ReviewStatus.DUE;
        return status == ReviewStatus.RESCHEDULED ? ReviewStatus.RESCHEDULED : ReviewStatus.PENDING;
    }
    public void complete(UUID completionAttemptId, Instant now) {
        if (status == ReviewStatus.CANCELLED) throw new IllegalStateException("キャンセル済みの復習は完了できません。");
        if (this.completionAttemptId != null) return;
        this.completionAttemptId = completionAttemptId; this.completedAt = now; this.status = ReviewStatus.COMPLETED; this.updatedAt = now;
    }
    public void reschedule(LocalDate scheduledDate, String reason, Instant now) {
        if (status == ReviewStatus.COMPLETED || status == ReviewStatus.CANCELLED) throw new IllegalStateException("完了またはキャンセル済みの復習は日程変更できません。");
        this.scheduledDate = scheduledDate; this.rescheduleReason = reason; this.status = ReviewStatus.RESCHEDULED; this.updatedAt = now;
    }
    public void cancel(Instant now) { if (status == ReviewStatus.COMPLETED) throw new IllegalStateException("完了済みの復習はキャンセルできません。"); status = ReviewStatus.CANCELLED; updatedAt = now; }
    public void assignProblem(UUID problemId, Instant now) { if (status == ReviewStatus.COMPLETED || status == ReviewStatus.CANCELLED) throw new IllegalStateException("完了またはキャンセル済みの復習には課題を割り当てられません。"); assignedProblemId = problemId; updatedAt = now; }
    public UUID getId() { return id; } public UUID getSourceAttemptId() { return sourceAttemptId; } public UUID getSourceProblemId() { return sourceProblemId; }
    public UUID getAssignedProblemId() { return assignedProblemId; } public UUID getPatternId() { return patternId; } public ReviewType getReviewType() { return reviewType; }
    public UUID getFailureLabelId() { return failureLabelId; }
    public LocalDate getScheduledDate() { return scheduledDate; } public Instant getCompletedAt() { return completedAt; } public ReviewStatus getStatus() { return status; }
    public UUID getCompletionAttemptId() { return completionAttemptId; } public String getAssignmentNotes() { return assignmentNotes; } public String getRescheduleReason() { return rescheduleReason; }
    public Instant getCreatedAt() { return createdAt; } public Instant getUpdatedAt() { return updatedAt; }
}
