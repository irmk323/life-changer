package com.example.leetcodetrainer.planning.service;

import com.example.leetcodetrainer.analytics.domain.*;
import com.example.leetcodetrainer.analytics.service.AnalyticsService;
import com.example.leetcodetrainer.attempt.domain.*;
import com.example.leetcodetrainer.attempt.repository.AttemptRepository;
import com.example.leetcodetrainer.attempt.repository.StageAssessmentRepository;
import com.example.leetcodetrainer.failure.repository.AttemptFailureLabelRepository;
import com.example.leetcodetrainer.hint.repository.HintUsageRepository;
import com.example.leetcodetrainer.planning.domain.*;
import com.example.leetcodetrainer.planning.repository.WeeklyPlanRepository;
import java.time.*;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import org.springframework.stereotype.Service;

@Service
public class WeeklyPlanService {
    private static final AnalyticsPeriod FOCUS_PERIOD = AnalyticsPeriod.DAYS_28;
    private final WeeklyPlanRepository plans; private final AnalyticsService analytics; private final AttemptRepository attempts;
    private final StageAssessmentRepository assessments; private final HintUsageRepository hints;
    private final AttemptFailureLabelRepository failureLabels; private final Clock clock; private final ZoneId zoneId;
    public WeeklyPlanService(WeeklyPlanRepository plans, AnalyticsService analytics, AttemptRepository attempts,
                             StageAssessmentRepository assessments, HintUsageRepository hints,
                             AttemptFailureLabelRepository failureLabels, Clock clock, ZoneId reviewZoneId) {
        this.plans=plans; this.analytics=analytics; this.attempts=attempts; this.assessments=assessments; this.hints=hints;
        this.failureLabels=failureLabels; this.clock=clock; this.zoneId=reviewZoneId;
    }
    public Optional<WeeklyPlan> activePlan() { return plans.findFirstByStatusOrderByWeekStartDesc(WeeklyPlanStatus.ACTIVE); }
    public FocusRecommendation recommendation() {
        List<Attempt> completed = attempts.findByStatusOrderByCompletedAtDesc(AttemptStatus.COMPLETED);
        Set<UUID> completedIds = completed.stream().map(Attempt::getId).collect(java.util.stream.Collectors.toSet());
        long completedStages = completedIds.isEmpty() ? 0 : assessments.findByAttemptIdIn(completedIds).stream()
                .filter(assessment -> assessment.getScore() != null).count();
        long completedProblems = completed.stream().map(Attempt::getProblemId).distinct().count();
        if (completed.size() < 3 || completedProblems < 2 || completedStages < 20) return FocusRecommendation.unavailable();

        AnalyticsSnapshot snapshot = analytics.snapshot(FOCUS_PERIOD);
        StageMetric choice = snapshot.stageMetrics().stream().filter(metric -> metric.success().hasData())
                .min(Comparator.comparing(metric -> metric.success().independentPercent())).orElse(null);
        if (choice == null) return FocusRecommendation.unavailable();

        Instant periodStart = FOCUS_PERIOD.start(clock, zoneId);
        Set<UUID> periodIds = completed.stream().filter(attempt -> !attempt.getCompletedAt().isBefore(periodStart))
                .map(Attempt::getId).collect(java.util.stream.Collectors.toSet());
        List<StageAssessment> stageAssessments = periodIds.isEmpty() ? List.of()
                : assessments.findByAttemptIdInAndStageType(periodIds, choice.stage()).stream()
                .filter(assessment -> assessment.getScore() != null).toList();
        Set<UUID> relevantAttemptIds = stageAssessments.stream().map(StageAssessment::getAttemptId)
                .collect(java.util.stream.Collectors.toSet());
        long problemCount = completed.stream().filter(attempt -> relevantAttemptIds.contains(attempt.getId()))
                .map(Attempt::getProblemId).distinct().count();
        long hintUsageCount = periodIds.isEmpty() ? 0 : hints.findByAttemptIdInAndStageType(periodIds, choice.stage()).size();
        List<String> relatedLabels = periodIds.isEmpty() ? List.of() : failureLabels.findConfirmedByAttemptIdIn(periodIds).stream()
                .map(entry -> entry.getFailureLabel()).filter(label -> label.getRelatedStage() == choice.stage())
                .map(label -> label.getDisplayName()).distinct().toList();
        return new FocusRecommendation(true, choice.stage(), FOCUS_PERIOD, choice.success(), hintUsageCount,
                relatedLabels, problemCount, stageAssessments.size());
    }
    public WeeklyPlan adopt(StageType stage, String reason) {
        activePlan().ifPresent(plan -> plan.cancel(Instant.now(clock)));
        LocalDate weekStart = LocalDate.now(clock.withZone(zoneId)).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        return plans.save(new WeeklyPlan(UUID.randomUUID(), weekStart, stage, blank(reason) ? defaultReason(stage) : reason, Instant.now(clock)));
    }

    private String defaultReason(StageType stage) {
        return "次の演習では「" + stage.getDisplayName()
                + "」を、答えに進む前に自分の言葉で説明して記録します。";
    }
    private boolean blank(String value) { return value == null || value.isBlank(); }
}
