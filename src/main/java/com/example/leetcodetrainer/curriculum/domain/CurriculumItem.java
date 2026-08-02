package com.example.leetcodetrainer.curriculum.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name="curriculum_item")
public class CurriculumItem {
    @Id private UUID id;
    @Column(name="problem_id", nullable = false) private UUID problemId;
    @Column(name="pattern_id", nullable = false) private UUID patternId;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private CurriculumRole role;
    @Column(nullable = false) private int displayOrder;
    @Column(nullable = false) private boolean active;
    @Lob private String notes;
    private Instant createdAt, updatedAt;
    protected CurriculumItem() { }
    public CurriculumItem(UUID id, UUID problemId, UUID patternId, CurriculumRole role, int displayOrder, boolean active, String notes, Instant now) {
        if (id == null || problemId == null || patternId == null || role == null || now == null) throw new IllegalArgumentException("curriculum item identity is required");
        if (displayOrder <= 0) throw new IllegalArgumentException("display order must be positive");
        this.id=id; this.problemId=problemId; this.patternId=patternId; this.role=role; this.displayOrder=displayOrder;
        this.active=active; this.notes=notes; this.createdAt=now; this.updatedAt=now;
    }
    public boolean isHoldoutEligible(ProblemExposure exposure) {
        return role != CurriculumRole.HOLDOUT || exposure == null || exposure.getState() == ProblemExposureState.NEVER_SEEN;
    }
    public UUID getId(){return id;} public UUID getProblemId(){return problemId;} public UUID getPatternId(){return patternId;}
    public CurriculumRole getRole(){return role;} public int getDisplayOrder(){return displayOrder;} public boolean isActive(){return active;} public String getNotes(){return notes;}
}
