package com.example.leetcodetrainer.pattern.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "pattern")
public class Pattern {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false, unique = true)
    private String name;

    @Lob
    @Column(nullable = false)
    private String description;

    @Lob
    @Column(nullable = false)
    private String triggerClues;

    @Lob private String typicalBruteForce;
    @Lob private String repeatedWork;
    @Lob private String unresolvedState;
    @Lob private String resolutionEvent;
    @Lob private String updatedRegion;
    @Lob private String requiredOperations;
    @Lob private String invariantDescription;
    @Lob private String correctnessNotes;
    @Lob private String complexityNotes;
    @Lob private String commonMistakes;
    @Lob private String contrastCases;
    @Lob private String javaNotes;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected Pattern() {
    }

    public Pattern(UUID id, String code, String name, String description, String triggerClues, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.description = description;
        this.triggerClues = triggerClues;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() { return id; }
    public String getCode() { return code; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public String getTriggerClues() { return triggerClues; }
    public String getTypicalBruteForce() { return typicalBruteForce; }
    public String getRepeatedWork() { return repeatedWork; }
    public String getUnresolvedState() { return unresolvedState; }
    public String getResolutionEvent() { return resolutionEvent; }
    public String getUpdatedRegion() { return updatedRegion; }
    public String getRequiredOperations() { return requiredOperations; }
    public String getInvariantDescription() { return invariantDescription; }
    public String getCorrectnessNotes() { return correctnessNotes; }
    public String getComplexityNotes() { return complexityNotes; }
    public String getCommonMistakes() { return commonMistakes; }
    public String getContrastCases() { return contrastCases; }
    public String getJavaNotes() { return javaNotes; }
}
