package com.example.leetcodetrainer.attempt.controller;

import com.example.leetcodetrainer.attempt.domain.*;
import com.example.leetcodetrainer.attempt.service.AttemptService;
import com.example.leetcodetrainer.pattern.service.PatternCatalogService;
import com.example.leetcodetrainer.problem.service.ProblemCatalogService;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.UUID;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
public class AttemptController {
    private final AttemptService attemptService;
    private final ProblemCatalogService problemCatalogService;
    private final PatternCatalogService patternCatalogService;
    public AttemptController(AttemptService attemptService, ProblemCatalogService problemCatalogService, PatternCatalogService patternCatalogService) {
        this.attemptService = attemptService; this.problemCatalogService = problemCatalogService; this.patternCatalogService = patternCatalogService;
    }
    @PostMapping("/problems/{problemId}/attempts")
    public String start(@PathVariable UUID problemId) {
        problemCatalogService.getProblem(problemId);
        return "redirect:/attempts/" + attemptService.start(problemId, AttemptType.INITIAL).getId() + "/workspace";
    }
    @GetMapping("/attempts/{id}/workspace")
    public String workspace(@PathVariable UUID id, @RequestParam(required = false) StageType stage, Model model) {
        Attempt attempt = attemptService.get(id);
        if (attempt.getStatus() != AttemptStatus.IN_PROGRESS) return "redirect:/attempts/" + id;
        if (stage != null) attemptService.moveTo(id, stage);
        StageAssessment current = attemptService.currentStage(id);
        populateWorkspace(model, attemptService.get(id), current);
        return "attempts/workspace";
    }
    @PostMapping("/attempts/{id}/stages/{stage}/save")
    public String saveStage(@PathVariable UUID id, @PathVariable StageType stage, @RequestParam(required = false) String answer,
                            @RequestParam(required = false) Integer score, @RequestParam(required = false) String timeComplexity,
                            @RequestParam(required = false) String spaceComplexity, @RequestParam(required = false) String trace,
                            @RequestParam(required = false) UpdatedRegion updatedRegion, @RequestParam(required = false) DataStructureOption dataStructure,
                            @RequestParam(required = false) String selectionReason,
                            @RequestParam(required = false) java.util.Set<RequiredOperation> requiredOperations,
                            RedirectAttributes redirectAttributes) {
        try {
            attemptService.saveStage(id, stage, new StageSaveCommand(answer, score, timeComplexity, spaceComplexity, trace,
                    updatedRegion, dataStructure, selectionReason, requiredOperations == null ? new LinkedHashSet<>() : requiredOperations));
            redirectAttributes.addFlashAttribute("message", score == null ? "下書きを保存しました。" : "工程を評価済みにしました。");
        } catch (IllegalArgumentException | IllegalStateException exception) { redirectAttributes.addFlashAttribute("error", exception.getMessage()); }
        return "redirect:/attempts/" + id + "/workspace?stage=" + stage;
    }
    @PostMapping("/attempts/{id}/implementation")
    public String saveImplementation(@PathVariable UUID id, @RequestParam String language, @RequestParam(required = false) String code,
                                     @RequestParam(required = false) Integer compileErrorCount, @RequestParam(required = false) Integer wrongAnswerCount,
                                     @RequestParam(defaultValue = "false") boolean timedOut, @RequestParam(defaultValue = "false") boolean implementationCompleted,
                                     @RequestParam(defaultValue = "false") boolean understoodButCouldNotImplement,
                                     @RequestParam(defaultValue = "false") boolean edgeCaseFailure,
                                     @RequestParam(required = false) String externalSubmissionResult, RedirectAttributes attributes) {
        try { attemptService.saveImplementation(id, language, code, compileErrorCount, wrongAnswerCount, timedOut, implementationCompleted, understoodButCouldNotImplement, edgeCaseFailure, externalSubmissionResult); attributes.addFlashAttribute("message", "実装記録を保存しました。"); }
        catch (IllegalArgumentException | IllegalStateException exception) { attributes.addFlashAttribute("error", exception.getMessage()); }
        return "redirect:/attempts/" + id + "/workspace?stage=IMPLEMENTATION";
    }
    @PostMapping("/attempts/{id}/reflection")
    public String saveReflection(@PathVariable UUID id, @RequestParam(required = false) String independentStages, @RequestParam(required = false) String hintNeededStages,
                                 @RequestParam(required = false) String unknownStages, @RequestParam(required = false) String triggerSentence,
                                 @RequestParam(required = false) String falseHypothesis, @RequestParam(required = false) String newUnderstanding,
                                 @RequestParam(required = false) String nextQuestion, @RequestParam(required = false) String emotion,
                                 @RequestParam(required = false) String learningObstacle, RedirectAttributes attributes) {
        try { attemptService.saveReflection(id, independentStages, hintNeededStages, unknownStages, triggerSentence, falseHypothesis, newUnderstanding, nextQuestion, emotion, learningObstacle); attributes.addFlashAttribute("message", "振り返りを保存しました。"); }
        catch (IllegalStateException exception) { attributes.addFlashAttribute("error", exception.getMessage()); }
        return "redirect:/attempts/" + id + "/workspace?stage=REFLECTION";
    }
    @PostMapping("/attempts/{id}/reveal-pattern")
    public String revealPattern(@PathVariable UUID id) { attemptService.revealPattern(id); return "redirect:/attempts/" + id + "/workspace"; }
    @PostMapping("/attempts/{id}/complete")
    public String complete(@PathVariable UUID id, @RequestParam(required = false) FinalResult finalResult, RedirectAttributes attributes) {
        try { attemptService.complete(id, finalResult); return "redirect:/attempts/" + id; }
        catch (IllegalArgumentException | IllegalStateException exception) { attributes.addFlashAttribute("error", exception.getMessage()); return "redirect:/attempts/" + id + "/workspace"; }
    }
    @PostMapping("/attempts/{id}/abandon")
    public String abandon(@PathVariable UUID id) { Attempt attempt = attemptService.get(id); attemptService.abandon(id); return "redirect:/problems/" + attempt.getProblemId(); }
    @GetMapping("/attempts/{id}")
    public String completed(@PathVariable UUID id, Model model) {
        Attempt attempt = attemptService.get(id);
        if (attempt.getStatus() == AttemptStatus.IN_PROGRESS) return "redirect:/attempts/" + id + "/workspace";
        model.addAttribute("attempt", attempt); model.addAttribute("problem", problemCatalogService.getProblem(attempt.getProblemId()));
        model.addAttribute("stages", attemptService.stages(id)); return "attempts/detail";
    }
    private void populateWorkspace(Model model, Attempt attempt, StageAssessment current) {
        model.addAttribute("attempt", attempt); model.addAttribute("problem", problemCatalogService.getProblem(attempt.getProblemId()));
        model.addAttribute("current", current); model.addAttribute("stages", attemptService.stages(attempt.getId()));
        model.addAttribute("stageTypes", StageType.ordered()); model.addAttribute("scores", AssessmentScore.values());
        model.addAttribute("updatedRegions", UpdatedRegion.values()); model.addAttribute("operations", RequiredOperation.values());
        model.addAttribute("dataStructures", DataStructureOption.values()); model.addAttribute("finalResults", FinalResult.values());
        model.addAttribute("elapsedSeconds", Math.max(0, Duration.between(attempt.getStartedAt(), Instant.now()).getSeconds()));
        if (attempt.getPatternRevealedAt() != null) model.addAttribute("associations", patternCatalogService.findPatternsForProblem(attempt.getProblemId()));
    }
}
