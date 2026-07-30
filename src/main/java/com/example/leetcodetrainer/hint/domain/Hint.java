package com.example.leetcodetrainer.hint.domain;

import com.example.leetcodetrainer.attempt.domain.StageType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "hints")
public class Hint {
    @Id private UUID id;
    @Column(name = "problem_id") private UUID problemId;
    @Column(name = "pattern_id") private UUID patternId;
    @Enumerated(EnumType.STRING) @Column(name = "stage_type", nullable = false) private StageType stageType;
    @Column(name = "hint_level", nullable = false) private int hintLevel;
    @Lob @Column(nullable = false) private String content;
    @Column(nullable = false) private int displayOrder;
    @Column(nullable = false) private boolean active;
    @Column(nullable = false) private Instant createdAt;
    @Column(nullable = false) private Instant updatedAt;

    protected Hint() { }
    public Hint(UUID id, UUID problemId, UUID patternId, StageType stageType, int hintLevel, String content,
                int displayOrder, boolean active, Instant now) {
        if (hintLevel < 1 || hintLevel > 5) throw new IllegalArgumentException("ヒントレベルは1〜5です。");
        this.id = id; this.problemId = problemId; this.patternId = patternId; this.stageType = stageType; this.hintLevel = hintLevel;
        this.content = content; this.displayOrder = displayOrder; this.active = active; this.createdAt = now; this.updatedAt = now;
    }
    public UUID getId() { return id; } public UUID getProblemId() { return problemId; } public UUID getPatternId() { return patternId; }
    public StageType getStageType() { return stageType; } public int getHintLevel() { return hintLevel; } public String getContent() { return content; }
    public int getDisplayOrder() { return displayOrder; } public boolean isActive() { return active; }
    public void updateContent(String content, Instant now) { this.content = content; this.updatedAt = now; }
}
