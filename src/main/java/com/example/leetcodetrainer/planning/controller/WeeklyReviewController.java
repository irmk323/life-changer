package com.example.leetcodetrainer.planning.controller;

import com.example.leetcodetrainer.attempt.domain.StageType;
import com.example.leetcodetrainer.planning.service.WeeklyPlanService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class WeeklyReviewController {
    private final WeeklyPlanService weeklyPlans;

    public WeeklyReviewController(WeeklyPlanService weeklyPlans) {
        this.weeklyPlans = weeklyPlans;
    }

    @GetMapping("/weekly-review")
    public String review(Model model) {
        model.addAttribute("focusRecommendation", weeklyPlans.recommendation());
        model.addAttribute("activeWeeklyPlan", weeklyPlans.activePlan().orElse(null));
        model.addAttribute("stageTypes", StageType.values());
        return "planning/weekly-review";
    }
}
