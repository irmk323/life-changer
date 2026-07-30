package com.example.leetcodetrainer.problem.controller;

import com.example.leetcodetrainer.problem.domain.Difficulty;
import com.example.leetcodetrainer.problem.domain.NeetcodeCategory;
import com.example.leetcodetrainer.problem.service.ProblemCatalogService;
import com.example.leetcodetrainer.attempt.service.AttemptService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class ProblemLibraryController {

    private final ProblemCatalogService problemCatalogService;
    private final AttemptService attemptService;

    public ProblemLibraryController(ProblemCatalogService problemCatalogService, AttemptService attemptService) {
        this.problemCatalogService = problemCatalogService;
        this.attemptService = attemptService;
    }

    @GetMapping("/problems")
    public String library(@RequestParam(required = false) Difficulty difficulty,
                          @RequestParam(required = false) NeetcodeCategory category,
                          Model model) {
        var problems = problemCatalogService.findProblems(difficulty, category, true);
        model.addAttribute("problems", problems);
        model.addAttribute("categories", problemCatalogService.findActiveCategories());
        model.addAttribute("difficulties", Difficulty.values());
        model.addAttribute("selectedDifficulty", difficulty);
        model.addAttribute("selectedCategory", category);
        return "problems/library";
    }

    @GetMapping("/problems/{id}")
    public String detail(@org.springframework.web.bind.annotation.PathVariable java.util.UUID id) {
        problemCatalogService.getProblem(id);
        return "redirect:/attempts/" + attemptService.startOrResumeInitial(id).getId() + "/workspace";
    }

    @PostMapping("/problems/{id}/toggle-solved")
    public String toggleSolved(@org.springframework.web.bind.annotation.PathVariable java.util.UUID id) {
        problemCatalogService.toggleSolved(id);
        return "redirect:/problems";
    }
}
