package com.example.leetcodetrainer.planning.domain;

import com.example.leetcodetrainer.attempt.domain.StageType;
import jakarta.persistence.*;
import java.time.*;
import java.util.UUID;

@Entity @Table(name = "weekly_plans")
public class WeeklyPlan {
    @Id private UUID id; @Column(name = "week_start", nullable = false) private LocalDate weekStart;
    @Enumerated(EnumType.STRING) @Column(name = "focus_stage", nullable = false) private StageType focusStage;
    @Column(name = "focus_pattern_id") private UUID focusPatternId; @Lob @Column(nullable = false) private String reason;
    @Column(name = "target_metric") private String targetMetric; @Column(name = "target_value") private Integer targetValue;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private WeeklyPlanStatus status;
    @Column(name = "created_at", nullable = false) private Instant createdAt; @Column(name = "updated_at", nullable = false) private Instant updatedAt;
    protected WeeklyPlan() { }
    public WeeklyPlan(UUID id, LocalDate weekStart, StageType focusStage, String reason, Instant now) { this.id=id; this.weekStart=weekStart; this.focusStage=focusStage; this.reason=reason; this.status=WeeklyPlanStatus.ACTIVE; this.createdAt=now; this.updatedAt=now; }
    public void cancel(Instant now) { status = WeeklyPlanStatus.CANCELLED; updatedAt = now; }
    public UUID getId(){return id;} public LocalDate getWeekStart(){return weekStart;} public StageType getFocusStage(){return focusStage;} public UUID getFocusPatternId(){return focusPatternId;} public String getReason(){return reason;} public String getTargetMetric(){return targetMetric;} public Integer getTargetValue(){return targetValue;} public WeeklyPlanStatus getStatus(){return status;}
}
