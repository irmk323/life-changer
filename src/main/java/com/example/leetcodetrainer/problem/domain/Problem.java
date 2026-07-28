package com.example.leetcodetrainer.problem.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "problem")
public class Problem {

    @Id
    private UUID id;

    @Column(name = "leetcode_number")
    private Integer leetcodeNumber;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(nullable = false)
    private String externalUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Difficulty difficulty;

    @Column(nullable = false)
    private String neetcodeCategory;

    @Column(nullable = false)
    private boolean active;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected Problem() {
    }

    public Problem(UUID id, Integer leetcodeNumber, String title, String slug, String externalUrl,
                   Difficulty difficulty, String neetcodeCategory, boolean active,
                   Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.leetcodeNumber = leetcodeNumber;
        this.title = title;
        this.slug = slug;
        this.externalUrl = externalUrl;
        this.difficulty = difficulty;
        this.neetcodeCategory = neetcodeCategory;
        this.active = active;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() { return id; }
    public Integer getLeetcodeNumber() { return leetcodeNumber; }
    public String getTitle() { return title; }
    public String getSlug() { return slug; }
    public String getExternalUrl() { return externalUrl; }
    public Difficulty getDifficulty() { return difficulty; }
    public String getNeetcodeCategory() { return neetcodeCategory; }
    public boolean isActive() { return active; }
}
