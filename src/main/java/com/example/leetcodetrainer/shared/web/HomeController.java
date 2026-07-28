package com.example.leetcodetrainer.shared.web;

import com.example.leetcodetrainer.pattern.service.PatternCatalogService;
import com.example.leetcodetrainer.problem.service.ProblemCatalogService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    private final ProblemCatalogService problemCatalogService;
    private final PatternCatalogService patternCatalogService;

    public HomeController(ProblemCatalogService problemCatalogService, PatternCatalogService patternCatalogService) {
        this.problemCatalogService = problemCatalogService;
        this.patternCatalogService = patternCatalogService;
    }

    @GetMapping("/")
    public String home(Model model) {
        model.addAttribute("problemCount", problemCatalogService.findActiveProblems(null, null).size());
        model.addAttribute("patternCount", patternCatalogService.findAll().size());
        return "home";
    }
}
