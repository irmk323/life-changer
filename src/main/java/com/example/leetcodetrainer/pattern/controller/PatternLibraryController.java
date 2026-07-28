package com.example.leetcodetrainer.pattern.controller;

import com.example.leetcodetrainer.pattern.service.PatternCatalogService;
import java.util.UUID;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@Controller
public class PatternLibraryController {

    private final PatternCatalogService patternCatalogService;

    public PatternLibraryController(PatternCatalogService patternCatalogService) {
        this.patternCatalogService = patternCatalogService;
    }

    @GetMapping("/patterns")
    public String library(Model model) {
        var patterns = patternCatalogService.findAll();
        model.addAttribute("patterns", patterns);
        model.addAttribute("relatedProblemCounts", patternCatalogService.countRelatedProblems(
                patterns.stream().map(pattern -> pattern.getId()).toList()));
        return "patterns/library";
    }

    @GetMapping("/patterns/{id}")
    public String detail(@PathVariable UUID id, Model model) {
        model.addAttribute("pattern", patternCatalogService.getPattern(id));
        model.addAttribute("associations", patternCatalogService.findProblemsForPattern(id));
        return "patterns/detail";
    }
}
