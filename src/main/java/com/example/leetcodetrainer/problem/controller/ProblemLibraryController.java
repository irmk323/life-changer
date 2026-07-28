package com.example.leetcodetrainer.problem.controller;

import com.example.leetcodetrainer.problem.domain.Difficulty;
import com.example.leetcodetrainer.problem.domain.NeetcodeCategory;
import com.example.leetcodetrainer.pattern.service.PatternCatalogService;
import com.example.leetcodetrainer.problem.service.ProblemCatalogService;
import com.example.leetcodetrainer.attempt.service.AttemptService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class ProblemLibraryController {

    private final ProblemCatalogService problemCatalogService;
    private final PatternCatalogService patternCatalogService;
    private final AttemptService attemptService;

    public ProblemLibraryController(ProblemCatalogService problemCatalogService, PatternCatalogService patternCatalogService,
                                    AttemptService attemptService) {
        this.problemCatalogService = problemCatalogService;
        this.patternCatalogService = patternCatalogService;
        this.attemptService = attemptService;
    }

    @GetMapping("/problems")
    public String library(@RequestParam(required = false) Difficulty difficulty,
                          @RequestParam(required = false) NeetcodeCategory category,
                          Model model) {
        var problems = problemCatalogService.findProblems(difficulty, category, true);
        model.addAttribute("problems", problems);
        model.addAttribute("primaryPatternNames", patternCatalogService.findPrimaryPatternNames(
                problems.stream().map(problem -> problem.getId()).toList()));
        model.addAttribute("categories", problemCatalogService.findActiveCategories());
        model.addAttribute("difficulties", Difficulty.values());
        model.addAttribute("selectedDifficulty", difficulty);
        model.addAttribute("selectedCategory", category);
        return "problems/library";
    }

    @GetMapping("/problems/{id}")
    public String detail(@org.springframework.web.bind.annotation.PathVariable java.util.UUID id, Model model) {
        model.addAttribute("problem", problemCatalogService.getProblem(id));
        model.addAttribute("associations", patternCatalogService.findPatternsForProblem(id));
        model.addAttribute("attempts", attemptService.historyForProblem(id));
        return "problems/detail";
    }
}
