package com.example.leetcodetrainer.referenceanswer.domain;

import com.example.leetcodetrainer.attempt.domain.StageType;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "stage_reference_answers", uniqueConstraints = @UniqueConstraint(columnNames = {"problem_id", "stage_type"}))
public class StageReferenceAnswer {
    @Id private UUID id;
    @Column(name = "problem_id", nullable = false) private UUID problemId;
    @Enumerated(EnumType.STRING) @Column(name = "stage_type", nullable = false) private StageType stageType;
    @Lob @Column(name = "model_answer", nullable = false) private String modelAnswer;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private StageApplicability applicability;
    @Column(name = "content_version", nullable = false) private int contentVersion;
    @Column(name = "source_file", nullable = false) private String sourceFile;
    @Column(nullable = false) private boolean active;
    @Column(nullable = false) private Instant createdAt;
    @Column(nullable = false) private Instant updatedAt;
    protected StageReferenceAnswer() { }
    public StageReferenceAnswer(UUID id, UUID problemId, StageType stageType, String modelAnswer, StageApplicability applicability, int contentVersion, String sourceFile, Instant now) {
        this.id=id; this.problemId=problemId; this.stageType=stageType; this.modelAnswer=modelAnswer; this.applicability=applicability; this.contentVersion=contentVersion; this.sourceFile=sourceFile; this.active=true; this.createdAt=now; this.updatedAt=now;
    }
    public void update(String answer, StageApplicability newApplicability, int version, String file, Instant now) { modelAnswer=answer; applicability=newApplicability; contentVersion=version; sourceFile=file; active=true; updatedAt=now; }
    public UUID getId(){return id;} public UUID getProblemId(){return problemId;} public StageType getStageType(){return stageType;} public String getModelAnswer(){return modelAnswer;} public StageApplicability getApplicability(){return applicability;} public int getContentVersion(){return contentVersion;} public String getSourceFile(){return sourceFile;} public boolean isActive(){return active;}
}
