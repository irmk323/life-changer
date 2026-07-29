package com.example.leetcodetrainer.failure.domain;

import com.example.leetcodetrainer.attempt.domain.StageType;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "failure_labels")
public class FailureLabel {
    @Id private UUID id;
    @Enumerated(EnumType.STRING) @Column(nullable = false, unique = true) private FailureLabelCode code;
    @Column(name = "display_name", nullable = false) private String displayName;
    @Lob @Column(nullable = false) private String description;
    @Enumerated(EnumType.STRING) @Column(name = "related_stage") private StageType relatedStage;
    @Column(nullable = false) private boolean active;
    @Column(name = "display_order", nullable = false) private int displayOrder;
    protected FailureLabel() { }
    public UUID getId() { return id; } public FailureLabelCode getCode() { return code; } public String getDisplayName() { return displayName; }
    public String getDescription() { return description; } public StageType getRelatedStage() { return relatedStage; } public boolean isActive() { return active; }
}
