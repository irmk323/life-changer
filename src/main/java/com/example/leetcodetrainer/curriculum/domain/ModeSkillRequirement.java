package com.example.leetcodetrainer.curriculum.domain;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name="mode_skill_requirement")
public class ModeSkillRequirement {
    @Id private UUID id;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private LearningMode learningMode;
    @Column(name="learning_mode_definition_id", nullable = false) private UUID learningModeDefinitionId;
    @Column(name="skill_definition_id", nullable = false) private UUID skillDefinitionId;
    @Column(nullable = false) private int displayOrder;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private RequirementApplicability applicability;
    private boolean assistanceAllowed, stopOnFailure, completionRequired;
    protected ModeSkillRequirement() { }
    public ModeSkillRequirement(UUID id, LearningMode learningMode, UUID learningModeDefinitionId, UUID skillDefinitionId,
                                int displayOrder, RequirementApplicability applicability, boolean assistanceAllowed,
                                boolean stopOnFailure, boolean completionRequired) {
        if (id == null || learningMode == null || learningModeDefinitionId == null || skillDefinitionId == null || applicability == null) throw new IllegalArgumentException("mode requirement identity is required");
        if (displayOrder <= 0) throw new IllegalArgumentException("display order must be positive");
        if (applicability == RequirementApplicability.NOT_APPLICABLE && completionRequired) throw new IllegalArgumentException("not-applicable skills cannot be completion-required");
        this.id=id; this.learningMode=learningMode; this.learningModeDefinitionId=learningModeDefinitionId; this.skillDefinitionId=skillDefinitionId;
        this.displayOrder=displayOrder; this.applicability=applicability; this.assistanceAllowed=assistanceAllowed;
        this.stopOnFailure=stopOnFailure; this.completionRequired=completionRequired;
    }
    public LearningMode getLearningMode(){return learningMode;} public UUID getLearningModeDefinitionId(){return learningModeDefinitionId;}
    public UUID getSkillDefinitionId(){return skillDefinitionId;} public int getDisplayOrder(){return displayOrder;}
    public RequirementApplicability getApplicability(){return applicability;} public boolean isAssistanceAllowed(){return assistanceAllowed;}
    public boolean isStopOnFailure(){return stopOnFailure;} public boolean isCompletionRequired(){return completionRequired;}
}
