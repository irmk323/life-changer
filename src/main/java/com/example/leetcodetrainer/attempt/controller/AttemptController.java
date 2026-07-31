package com.example.leetcodetrainer.attempt.controller;

import com.example.leetcodetrainer.attempt.domain.*;
import com.example.leetcodetrainer.attempt.service.AttemptService;
import com.example.leetcodetrainer.pattern.service.PatternCatalogService;
import com.example.leetcodetrainer.hint.service.HintService;
import com.example.leetcodetrainer.problem.service.ProblemCatalogService;
import com.example.leetcodetrainer.review.service.ReviewSchedulingService;
import com.example.leetcodetrainer.failure.service.FailureLabelService;
import com.example.leetcodetrainer.failure.domain.FailureSeverity;
import com.example.leetcodetrainer.coaching.service.CoachingService;
import com.example.leetcodetrainer.referenceanswer.service.ReferenceAnswerService;
import com.example.leetcodetrainer.postattempt.service.PostAttemptSummaryService;
import com.example.leetcodetrainer.implementation.service.ImplementationReliabilityService;
import com.example.leetcodetrainer.implementation.domain.*;
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
    private final HintService hintService;
    private final ReviewSchedulingService reviewService;
    private final FailureLabelService failureLabelService;
    private final CoachingService coachingService;
    private final ReferenceAnswerService referenceAnswerService;
    private final PostAttemptSummaryService postAttemptSummaryService;
    private final ImplementationReliabilityService implementationReliabilityService;
    public AttemptController(AttemptService attemptService, ProblemCatalogService problemCatalogService, PatternCatalogService patternCatalogService,
                             HintService hintService, ReviewSchedulingService reviewService, FailureLabelService failureLabelService, CoachingService coachingService, ReferenceAnswerService referenceAnswerService, PostAttemptSummaryService postAttemptSummaryService, ImplementationReliabilityService implementationReliabilityService) {
        this.attemptService = attemptService; this.problemCatalogService = problemCatalogService; this.patternCatalogService = patternCatalogService; this.hintService = hintService; this.reviewService = reviewService; this.failureLabelService = failureLabelService; this.coachingService = coachingService; this.referenceAnswerService=referenceAnswerService; this.postAttemptSummaryService=postAttemptSummaryService; this.implementationReliabilityService=implementationReliabilityService;
    }
    @PostMapping("/problems/{problemId}/attempts")
    public String start(@PathVariable UUID problemId) {
        problemCatalogService.getProblem(problemId);
        return "redirect:/attempts/" + attemptService.startOrResumeInitial(problemId).getId() + "/workspace";
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
    @PostMapping("/attempts/{id}/stages/{stage}/hints/next")
    public String revealNextHint(@PathVariable UUID id, @PathVariable StageType stage, RedirectAttributes attributes) {
        try { hintService.revealNext(id, stage); attributes.addFlashAttribute("message", "次の足場となるヒントを表示しました。"); }
        catch (IllegalArgumentException | IllegalStateException exception) { attributes.addFlashAttribute("error", exception.getMessage()); }
        return "redirect:/attempts/" + id + "/workspace?stage=" + stage;
    }
    @GetMapping("/attempts/{id}/stages/{stage}/reference-answer/status")
    @ResponseBody
    public com.example.leetcodetrainer.referenceanswer.service.ReferenceAnswerStatus referenceAnswerStatus(@PathVariable UUID id, @PathVariable StageType stage) { return referenceAnswerService.status(id, stage); }
    @PostMapping("/attempts/{id}/stages/{stage}/reference-answer/reveal")
    public String revealReferenceAnswer(@PathVariable UUID id, @PathVariable StageType stage, RedirectAttributes attributes) {
        try { referenceAnswerService.reveal(id, stage); attributes.addFlashAttribute("message", "この工程の模範回答を表示しました。自分の言葉で再評価してください。"); }
        catch (RuntimeException exception) { attributes.addFlashAttribute("error", exception.getMessage()); }
        return "redirect:/attempts/"+id+"/workspace?stage="+stage;
    }
    @PostMapping("/attempts/{id}/hint-usages/{usageId}/outcome")
    public String recordHintOutcome(@PathVariable UUID id, @PathVariable UUID usageId, @RequestParam(required = false) Boolean helpedUserProceed,
                                    @RequestParam(required = false) String userNote, @RequestParam StageType stage,
                                    RedirectAttributes attributes) {
        try {
            if (helpedUserProceed == null) throw new IllegalArgumentException("ヒントで進めたかどうかを選択してください。");
            hintService.recordOutcome(id, usageId, helpedUserProceed, userNote); attributes.addFlashAttribute("message", "ヒント利用の結果を保存しました。");
        } catch (IllegalArgumentException | IllegalStateException exception) { attributes.addFlashAttribute("error", exception.getMessage()); }
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
    @PostMapping("/attempts/{id}/implementation/reliability") public String saveReliability(@PathVariable UUID id,@RequestParam ImplementationStatus status,@RequestParam(defaultValue="false") boolean firstPassCompiled,@RequestParam(defaultValue="false") boolean firstPassPassedBasicCases,@RequestParam(defaultValue="false") boolean firstPassPassedEdgeCases,@RequestParam(defaultValue="false") boolean finalImplementationCompleted,@RequestParam(defaultValue="false") boolean selfDetectedError,@RequestParam(defaultValue="false") boolean usedHint,@RequestParam(defaultValue="0") int compileErrorCount,@RequestParam(defaultValue="0") int wrongAnswerCount,@RequestParam(defaultValue="0") int runtimeErrorCount,@RequestParam(defaultValue="0") int timeoutCount,@RequestParam(required=false) String notes,RedirectAttributes a){implementationReliabilityService.save(id,status,firstPassCompiled,firstPassPassedBasicCases,firstPassPassedEdgeCases,finalImplementationCompleted,selfDetectedError,usedHint,compileErrorCount,wrongAnswerCount,runtimeErrorCount,timeoutCount,notes);a.addFlashAttribute("message","実装の再現性を保存しました。");return "redirect:/attempts/"+id+"/workspace?stage=IMPLEMENTATION";}
    @PostMapping("/attempts/{id}/implementation/errors") public String addImplementationError(@PathVariable UUID id,@RequestParam ImplementationErrorType errorType,@RequestParam ErrorSource errorSource,@RequestParam ErrorSeverity severity,@RequestParam(required=false) String failingInput,@RequestParam(required=false) String expectedOutput,@RequestParam(required=false) String actualOutput,@RequestParam(required=false) String rootCause,@RequestParam(required=false) String correction,@RequestParam(required=false) String preventionRule,RedirectAttributes a){try{implementationReliabilityService.addError(id,errorType,errorSource,severity,failingInput,expectedOutput,actualOutput,rootCause,correction,preventionRule);a.addFlashAttribute("message","実装エラーを記録しました。");}catch(RuntimeException e){a.addFlashAttribute("error",e.getMessage());}return "redirect:/attempts/"+id+"/workspace?stage=IMPLEMENTATION";}
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
    public String complete(@PathVariable UUID id, @RequestParam(required = false) FinalResult finalResult, @RequestParam(required = false) com.example.leetcodetrainer.attempt.domain.PriorExposure priorExposure, RedirectAttributes attributes) {
        try { attemptService.complete(id, finalResult, priorExposure); return "redirect:/attempts/" + id; }
        catch (IllegalArgumentException | IllegalStateException exception) { attributes.addFlashAttribute("error", exception.getMessage()); return "redirect:/attempts/" + id + "/workspace"; }
    }
    @GetMapping("/attempts/{id}/quick-assessment")
    public String quickAssessment(@PathVariable UUID id, Model model) { Attempt attempt=attemptService.get(id); model.addAttribute("attempt",attempt); model.addAttribute("problem",problemCatalogService.getProblem(attempt.getProblemId())); model.addAttribute("stages",attemptService.stages(id)); model.addAttribute("statuses",com.example.leetcodetrainer.attempt.domain.StageAssessmentStatus.values()); return "attempts/quick-assessment"; }
    @PostMapping("/attempts/{id}/quick-assessment")
    public String saveQuickAssessment(@PathVariable UUID id, @RequestParam org.springframework.util.MultiValueMap<String,String> assessment, RedirectAttributes attributes) { try { java.util.Map<StageType,Integer> scores=new java.util.EnumMap<>(StageType.class); java.util.Map<StageType,com.example.leetcodetrainer.attempt.domain.StageAssessmentStatus> statuses=new java.util.EnumMap<>(StageType.class); assessment.forEach((key,value)->{String[] p=key.split(":"); if(p.length!=2)return; StageType stage=StageType.valueOf(p[1]); if("score".equals(p[0]))scores.put(stage,Integer.valueOf(value.getFirst())); else statuses.put(stage,com.example.leetcodetrainer.attempt.domain.StageAssessmentStatus.valueOf(value.getFirst()));}); attemptService.quickAssess(id,scores,statuses); attributes.addFlashAttribute("message","Quick Assessmentを保存しました。"); } catch(RuntimeException e){attributes.addFlashAttribute("error",e.getMessage());} return "redirect:/attempts/"+id; }
    @PostMapping("/attempts/{id}/abandon")
    public String abandon(@PathVariable UUID id) { Attempt attempt = attemptService.get(id); attemptService.abandon(id); return "redirect:/problems/" + attempt.getProblemId(); }
    @GetMapping("/attempts/{id}")
    public String completed(@PathVariable UUID id, Model model) {
        Attempt attempt = attemptService.get(id);
        if (attempt.getStatus() == AttemptStatus.IN_PROGRESS) return "redirect:/attempts/" + id + "/workspace";
        model.addAttribute("attempt", attempt); model.addAttribute("problem", problemCatalogService.getProblem(attempt.getProblemId()));
        model.addAttribute("attemptHistory", attemptService.historyForProblem(attempt.getProblemId()).stream()
                .filter(previous -> !previous.getId().equals(attempt.getId())).toList());
        model.addAttribute("stages", attemptService.stages(id)); model.addAttribute("hintUsages", hintService.usagesForAttempt(id)); model.addAttribute("referenceReveals", referenceAnswerService.revealsForAttempt(id)); model.addAttribute("summary", postAttemptSummaryService.summary(attempt));
        if (attempt.getStatus() == AttemptStatus.COMPLETED) { model.addAttribute("bottleneckAnalysis", failureLabelService.analysis(id)); model.addAttribute("failureLabels", failureLabelService.entries(id)); model.addAttribute("activeFailureLabels", failureLabelService.activeLabels()); model.addAttribute("coaching", coachingService.latest(id)); }
        return "attempts/detail";
    }
    @PostMapping("/attempts/{id}/failure-labels/{labelId}/confirm")
    public String confirmFailureLabel(@PathVariable UUID id, @PathVariable UUID labelId, @RequestParam(required=false) String notes, RedirectAttributes attributes) { try { failureLabelService.confirm(id,labelId,notes); attributes.addFlashAttribute("message","ボトルネック候補を確認しました。"); } catch (RuntimeException exception) { attributes.addFlashAttribute("error",exception.getMessage()); } return "redirect:/attempts/"+id; }
    @PostMapping("/attempts/{id}/failure-labels/{labelId}/reject")
    public String rejectFailureLabel(@PathVariable UUID id, @PathVariable UUID labelId, RedirectAttributes attributes) { try { failureLabelService.reject(id,labelId); attributes.addFlashAttribute("message","候補を除外しました。"); } catch (RuntimeException exception) { attributes.addFlashAttribute("error",exception.getMessage()); } return "redirect:/attempts/"+id; }
    @PostMapping("/attempts/{id}/failure-labels")
    public String addFailureLabel(@PathVariable UUID id, @RequestParam UUID labelId, @RequestParam FailureSeverity severity, @RequestParam(required=false) String notes, RedirectAttributes attributes) { try { failureLabelService.add(id,labelId,severity,notes); attributes.addFlashAttribute("message","ボトルネックを追加しました。"); } catch (RuntimeException exception) { attributes.addFlashAttribute("error",exception.getMessage()); } return "redirect:/attempts/"+id; }
    @PostMapping("/attempts/{id}/failure-labels/{labelId}/remove")
    public String removeFailureLabel(@PathVariable UUID id, @PathVariable UUID labelId, RedirectAttributes attributes) { try { failureLabelService.remove(id,labelId); attributes.addFlashAttribute("message","ボトルネックを削除しました。"); } catch (RuntimeException exception) { attributes.addFlashAttribute("error",exception.getMessage()); } return "redirect:/attempts/"+id; }
    @PostMapping("/attempts/{id}/bottleneck-review")
    public String bottleneckReview(@PathVariable UUID id, @RequestParam UUID labelId, RedirectAttributes attributes) { try { return "redirect:/reviews/"+failureLabelService.createBottleneckReview(id,labelId); } catch (RuntimeException exception) { attributes.addFlashAttribute("error",exception.getMessage()); return "redirect:/attempts/"+id; } }
    @PostMapping("/attempts/{id}/coaching/regenerate") public String regenerateCoaching(@PathVariable UUID id) { coachingService.generate(id); return "redirect:/attempts/"+id; }
    private void populateWorkspace(Model model, Attempt attempt, StageAssessment current) {
        model.addAttribute("attempt", attempt); model.addAttribute("problem", problemCatalogService.getProblem(attempt.getProblemId()));
        model.addAttribute("current", current); model.addAttribute("stages", attemptService.stages(attempt.getId()));
        model.addAttribute("stageTypes", StageType.ordered()); model.addAttribute("scores", AssessmentScore.values());
        model.addAttribute("updatedRegions", UpdatedRegion.values()); model.addAttribute("operations", RequiredOperation.values());
        model.addAttribute("dataStructures", DataStructureOption.values()); model.addAttribute("finalResults", FinalResult.values());
        model.addAttribute("implementationStatuses", ImplementationStatus.values()); model.addAttribute("implementationErrorTypes", ImplementationErrorType.values()); model.addAttribute("errorSources", ErrorSource.values()); model.addAttribute("errorSeverities", ErrorSeverity.values()); model.addAttribute("implementationRecord", implementationReliabilityService.record(attempt.getId())); model.addAttribute("implementationErrors", implementationReliabilityService.errors(attempt.getId()));
        model.addAttribute("hintProgress", hintService.progress(attempt.getId(), current.getStageType()));
        var referenceStatus = referenceAnswerService.status(attempt.getId(), current.getStageType());
        model.addAttribute("referenceAnswerStatus", referenceStatus);
        referenceAnswerService.revealedAnswer(attempt.getId(), current.getStageType()).ifPresent(answer -> model.addAttribute("referenceAnswer", answer));
        if (attempt.getSourceReviewScheduleId() != null) model.addAttribute("reviewContext", reviewService.detail(attempt.getSourceReviewScheduleId()));
        model.addAttribute("elapsedSeconds", Math.max(0, Duration.between(attempt.getStartedAt(), Instant.now()).getSeconds()));
        if (attempt.getPatternRevealedAt() != null) model.addAttribute("associations", patternCatalogService.findPatternsForProblem(attempt.getProblemId()));
    }
}
