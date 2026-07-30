package com.example.leetcodetrainer.shared.web;

import static org.hamcrest.Matchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.leetcodetrainer.analytics.domain.*;
import com.example.leetcodetrainer.analytics.service.AnalyticsService;
import com.example.leetcodetrainer.attempt.service.AttemptService;
import com.example.leetcodetrainer.pattern.service.PatternCatalogService;
import com.example.leetcodetrainer.planning.service.*;
import com.example.leetcodetrainer.problem.service.ProblemCatalogService;
import com.example.leetcodetrainer.review.service.ReviewSchedulingService;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(HomeController.class)
class HomeControllerMvcTest {
    @Autowired MockMvc mvc;
    @MockBean ProblemCatalogService problems;
    @MockBean PatternCatalogService patterns;
    @MockBean ReviewSchedulingService reviews;
    @MockBean AnalyticsService analytics;
    @MockBean WeeklyPlanService weeklyPlans;
    @MockBean AttemptService attempts;

    @BeforeEach
    void setUp() {
        StageMetric relation = new StageMetric(com.example.leetcodetrainer.attempt.domain.StageType.PROBLEM_RELATION,
                new Metric(0, 0, 0), null);
        when(analytics.snapshot(AnalyticsPeriod.DAYS_28)).thenReturn(new AnalyticsSnapshot(AnalyticsPeriod.DAYS_28, List.of(relation),
                new Metric(0, 0, 0), new Metric(0, 0, 0), new Metric(0, 0, 0), new Metric(0, 0, 0), null, null, List.of(), List.of()));
        when(problems.findActiveProblems(null, null)).thenReturn(List.of());
        when(patterns.findAll()).thenReturn(List.of());
        when(reviews.dueTodayCount()).thenReturn(0L); when(reviews.overdueCount()).thenReturn(0L); when(reviews.nextReview()).thenReturn(null);
        when(weeklyPlans.activePlan()).thenReturn(Optional.empty()); when(attempts.latestInProgress()).thenReturn(Optional.empty());
    }

    @Test
    void showsOnlyTheDataCollectionGuideWhenWeeklyFocusEvidenceIsInsufficient() throws Exception {
        when(weeklyPlans.recommendation()).thenReturn(FocusRecommendation.unavailable());

        mvc.perform(get("/"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("異なる問題で3回以上Attemptを完了すると、工程別の傾向を提案します。")))
                .andExpect(content().string(not(containsString("この提案を今週のテーマにする"))))
                .andExpect(content().string(not(containsString("自分へのメモ・ねらい"))));
    }

    @Test
    void showsEvidenceAndAnAdoptActionWhenWeeklyFocusEvidenceIsSufficient() throws Exception {
        FocusRecommendation recommendation = new FocusRecommendation(true,
                com.example.leetcodetrainer.attempt.domain.StageType.INVARIANT, AnalyticsPeriod.DAYS_28,
                new Metric(1, 2, 2), 3, List.of("不変条件の定式化"), 2, 2);
        when(weeklyPlans.recommendation()).thenReturn(recommendation);

        mvc.perform(get("/"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("アプリからの提案")))
                .andExpect(content().string(containsString("自力成功率: 50%")))
                .andExpect(content().string(containsString("ヒント使用回数: 3回")))
                .andExpect(content().string(containsString("関連FailureLabel: 不変条件の定式化")))
                .andExpect(content().string(containsString("この提案を今週のテーマにする")));
    }
}
