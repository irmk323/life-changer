package com.example.leetcodetrainer.planning.service;

import com.example.leetcodetrainer.analytics.domain.*;
import com.example.leetcodetrainer.analytics.service.AnalyticsService;
import com.example.leetcodetrainer.attempt.domain.StageType;
import com.example.leetcodetrainer.planning.domain.*;
import com.example.leetcodetrainer.planning.repository.WeeklyPlanRepository;
import java.time.*;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import org.springframework.stereotype.Service;

@Service
public class WeeklyPlanService {
    private final WeeklyPlanRepository plans; private final AnalyticsService analytics; private final Clock clock; private final ZoneId zoneId;
    public WeeklyPlanService(WeeklyPlanRepository plans, AnalyticsService analytics, Clock clock, ZoneId reviewZoneId) { this.plans=plans; this.analytics=analytics; this.clock=clock; this.zoneId=reviewZoneId; }
    public Optional<WeeklyPlan> activePlan() { return plans.findFirstByStatusOrderByWeekStartDesc(WeeklyPlanStatus.ACTIVE); }
    public FocusRecommendation recommendation() {
        AnalyticsSnapshot snapshot = analytics.snapshot(AnalyticsPeriod.DAYS_28);
        StageMetric choice = snapshot.stageMetrics().stream().filter(metric -> metric.success().hasData())
                .min(Comparator.comparing(metric -> metric.success().independentPercent())).orElse(null);
        if (choice == null) return new FocusRecommendation(StageType.PROBLEM_RELATION, "直近28日の工程評価がまだありません。最初の関係抽出を記録して基準を作りましょう。");
        return new FocusRecommendation(choice.stage(), choice.stage().getDisplayName() + "の自力成功率は" + choice.success().independentDisplay() + "（n=" + choice.success().sampleSize() + "）です。次の演習でこの工程を根拠付きで記録しましょう。");
    }
    public WeeklyPlan adopt(StageType stage, String reason) {
        activePlan().ifPresent(plan -> plan.cancel(Instant.now(clock)));
        LocalDate weekStart = LocalDate.now(clock.withZone(zoneId)).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        return plans.save(new WeeklyPlan(UUID.randomUUID(), weekStart, stage, blank(reason) ? recommendation().reason() : reason, Instant.now(clock)));
    }
    private boolean blank(String value) { return value == null || value.isBlank(); }
}
