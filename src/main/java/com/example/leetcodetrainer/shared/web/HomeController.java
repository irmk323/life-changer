package com.example.leetcodetrainer.shared.web;

import com.example.leetcodetrainer.pattern.service.PatternCatalogService;
import com.example.leetcodetrainer.problem.service.ProblemCatalogService;
import com.example.leetcodetrainer.review.service.ReviewSchedulingService;
import com.example.leetcodetrainer.analytics.domain.AnalyticsPeriod;
import com.example.leetcodetrainer.analytics.service.AnalyticsService;
import com.example.leetcodetrainer.planning.service.WeeklyPlanService;
import com.example.leetcodetrainer.attempt.service.AttemptService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    private final ProblemCatalogService problemCatalogService;
    private final PatternCatalogService patternCatalogService;
    private final ReviewSchedulingService reviewService;
    private final AnalyticsService analyticsService;
    private final WeeklyPlanService weeklyPlanService;
    private final AttemptService attemptService;

    public HomeController(ProblemCatalogService problemCatalogService, PatternCatalogService patternCatalogService, ReviewSchedulingService reviewService,
                          AnalyticsService analyticsService, WeeklyPlanService weeklyPlanService, AttemptService attemptService) {
        this.problemCatalogService = problemCatalogService;
        this.patternCatalogService = patternCatalogService;
        this.reviewService = reviewService;
        this.analyticsService = analyticsService;
        this.weeklyPlanService = weeklyPlanService;
        this.attemptService = attemptService;
    }

    @GetMapping("/")
    public String home(Model model) {
        model.addAttribute("problemCount", problemCatalogService.findActiveProblems(null, null).size());
        model.addAttribute("patternCount", patternCatalogService.findAll().size());
        model.addAttribute("dueReviewCount", reviewService.dueTodayCount());
        model.addAttribute("overdueReviewCount", reviewService.overdueCount());
        model.addAttribute("nextReview", reviewService.nextReview());
        model.addAttribute("analytics", analyticsService.snapshot(AnalyticsPeriod.DAYS_28));
        model.addAttribute("activeWeeklyPlan", weeklyPlanService.activePlan().orElse(null));
        model.addAttribute("focusRecommendation", weeklyPlanService.recommendation());
        var inProgress = attemptService.latestInProgress().orElse(null);
        model.addAttribute("inProgressAttempt", inProgress);
        model.addAttribute("inProgressProblem", inProgress == null ? null : problemCatalogService.getProblem(inProgress.getProblemId()));
        model.addAttribute("nextProblem", problemCatalogService.findActiveProblems(null, null).stream().findFirst().orElse(null));
        return "home";
    }
}
