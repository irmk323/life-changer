package com.example.leetcodetrainer.problem.controller;

import com.example.leetcodetrainer.problem.domain.Difficulty;
import com.example.leetcodetrainer.problem.service.ProblemCatalogService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class ProblemLibraryController {

    private final ProblemCatalogService problemCatalogService;

    public ProblemLibraryController(ProblemCatalogService problemCatalogService) {
        this.problemCatalogService = problemCatalogService;
    }

    @GetMapping("/problems")
    public String library(@RequestParam(required = false) Difficulty difficulty,
                          @RequestParam(required = false) String category,
                          Model model) {
        model.addAttribute("problems", problemCatalogService.findActiveProblems(difficulty, category));
        model.addAttribute("categories", problemCatalogService.findActiveCategories());
        model.addAttribute("difficulties", Difficulty.values());
        model.addAttribute("selectedDifficulty", difficulty);
        model.addAttribute("selectedCategory", category);
        return "problems/library";
    }
}
