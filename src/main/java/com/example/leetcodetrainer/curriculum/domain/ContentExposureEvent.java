package com.example.leetcodetrainer.curriculum.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "content_exposure_event")
public class ContentExposureEvent {
    @Id private UUID id;
    @Column(name="problem_id") private UUID problemId;
    @Column(name="pattern_id") private UUID patternId;
    @Column(name="learning_session_id") private UUID learningSessionId;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private ContentExposureType exposureType;
    private String contentReference;
    @Column(nullable = false) private Instant exposedAt;
    protected ContentExposureEvent() { }
    public ContentExposureEvent(UUID id, UUID problemId, UUID patternId, UUID learningSessionId,
                                ContentExposureType exposureType, String contentReference, Instant exposedAt) {
        if (id == null || exposureType == null || exposedAt == null) throw new IllegalArgumentException("event id, type, and time are required");
        if (problemId == null && patternId == null && learningSessionId == null) throw new IllegalArgumentException("an exposure target is required");
        this.id=id; this.problemId=problemId; this.patternId=patternId; this.learningSessionId=learningSessionId;
        this.exposureType=exposureType; this.contentReference=contentReference; this.exposedAt=exposedAt;
    }
    public UUID getId() { return id; } public UUID getProblemId() { return problemId; } public UUID getPatternId() { return patternId; }
    public UUID getLearningSessionId() { return learningSessionId; } public ContentExposureType getExposureType() { return exposureType; }
}
