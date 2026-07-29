package com.example.leetcodetrainer.analytics.controller;

import com.example.leetcodetrainer.analytics.domain.*;
import com.example.leetcodetrainer.analytics.service.AnalyticsService;
import com.example.leetcodetrainer.attempt.domain.StageType;
import com.example.leetcodetrainer.planning.service.WeeklyPlanService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
public class AnalyticsController {
    private final AnalyticsService analytics; private final WeeklyPlanService plans;
    public AnalyticsController(AnalyticsService analytics, WeeklyPlanService plans) { this.analytics=analytics; this.plans=plans; }
    @GetMapping("/analytics") public String analytics(@RequestParam(defaultValue = "DAYS_28") AnalyticsPeriod period, Model model) {
        model.addAttribute("analytics", analytics.snapshot(period)); model.addAttribute("periods", AnalyticsPeriod.values()); return "analytics/dashboard";
    }
    @PostMapping("/weekly-plans") public String adopt(@RequestParam StageType stage, @RequestParam(required = false) String reason) { plans.adopt(stage, reason); return "redirect:/"; }
}
