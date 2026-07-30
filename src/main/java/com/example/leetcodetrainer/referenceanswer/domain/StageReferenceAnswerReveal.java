package com.example.leetcodetrainer.referenceanswer.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "stage_reference_answer_reveals", uniqueConstraints = @UniqueConstraint(columnNames = {"attempt_id", "stage_assessment_id", "content_version"}))
public class StageReferenceAnswerReveal {
    @Id private UUID id;
    @Column(name="stage_reference_answer_id", nullable=false) private UUID stageReferenceAnswerId;
    @Column(name="attempt_id", nullable=false) private UUID attemptId;
    @Column(name="stage_assessment_id", nullable=false) private UUID stageAssessmentId;
    @Column(name="content_version", nullable=false) private int contentVersion;
    @Column(name="revealed_at", nullable=false) private Instant revealedAt;
    protected StageReferenceAnswerReveal() { }
    public StageReferenceAnswerReveal(UUID id, UUID answerId, UUID attemptId, UUID assessmentId, int version, Instant now) { this.id=id; this.stageReferenceAnswerId=answerId; this.attemptId=attemptId; this.stageAssessmentId=assessmentId; this.contentVersion=version; this.revealedAt=now; }
    public UUID getId(){return id;} public UUID getStageReferenceAnswerId(){return stageReferenceAnswerId;} public UUID getAttemptId(){return attemptId;} public UUID getStageAssessmentId(){return stageAssessmentId;} public int getContentVersion(){return contentVersion;} public Instant getRevealedAt(){return revealedAt;}
}
