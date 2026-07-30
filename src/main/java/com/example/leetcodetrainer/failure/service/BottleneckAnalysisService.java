package com.example.leetcodetrainer.failure.service;

import com.example.leetcodetrainer.attempt.domain.*;
import com.example.leetcodetrainer.attempt.repository.*;
import com.example.leetcodetrainer.failure.domain.*;
import com.example.leetcodetrainer.failure.dto.*;
import com.example.leetcodetrainer.failure.repository.*;
import com.example.leetcodetrainer.hint.repository.HintUsageRepository;
import com.example.leetcodetrainer.attempt.service.AttemptQualityService;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class BottleneckAnalysisService {
    private static final int SCORE_ZERO_PENALTY = 100, SCORE_ONE_PENALTY = 35, HINT_LEVEL_WEIGHT = 8, RECURRENCE_WEIGHT = 12;
    private final AttemptRepository attempts; private final StageAssessmentRepository stages; private final HintUsageRepository hints;
    private final FailureLabelRepository labels; private final AttemptFailureLabelRepository attemptLabels;
    private final AttemptQualityService quality;
    public BottleneckAnalysisService(AttemptRepository attempts, StageAssessmentRepository stages, HintUsageRepository hints, FailureLabelRepository labels, AttemptFailureLabelRepository attemptLabels, AttemptQualityService quality) {
        this.attempts=attempts; this.stages=stages; this.hints=hints; this.labels=labels; this.attemptLabels=attemptLabels; this.quality=quality;
    }
    public BottleneckAnalysis analyze(UUID attemptId) {
        Attempt attempt = attempts.findById(attemptId).orElseThrow();
        List<StageAssessment> assessedStages=stages.findByAttemptIdOrderByStageTypeAsc(attemptId);
        if (!quality.assess(attempt, assessedStages).analysisAllowed()) return new BottleneckAnalysis(List.of(), null);
        Map<FailureLabelCode, BottleneckSuggestion> found = new LinkedHashMap<>();
        for (StageAssessment stage : assessedStages) {
            if (stage.getAssessmentStatus()!=StageAssessmentStatus.ASSESSED || stage.getScore() == null || stage.getScore() == 2) continue;
            FailureLabelCode code = stageCode(stage.getStageType());
            if (code != null) add(found, code, severity(stage.getScore(), hints.findMaxHintLevel(attemptId, stage.getStageType())), stage, attempt, "stage_score");
        }
        if (attempt.isUnderstoodButCouldNotImplement()) add(found, FailureLabelCode.IMPLEMENTATION_TRANSLATION, FailureSeverity.HIGH, stage(attemptId, StageType.IMPLEMENTATION), attempt, "understood_but_could_not_implement");
        if (attempt.getCompileErrorCount() >= 2) add(found, FailureLabelCode.LANGUAGE_SYNTAX, attempt.getCompileErrorCount() >= 4 ? FailureSeverity.HIGH : FailureSeverity.MEDIUM, stage(attemptId, StageType.IMPLEMENTATION), attempt, "compile_errors");
        if (attempt.isEdgeCaseFailure()) add(found, FailureLabelCode.EDGE_CASE_IDENTIFICATION, FailureSeverity.HIGH, stage(attemptId, StageType.IMPLEMENTATION), attempt, "edge_case_failure");
        else if (attempt.getWrongAnswerCount() > 0) add(found, FailureLabelCode.DEBUGGING, FailureSeverity.MEDIUM, stage(attemptId, StageType.IMPLEMENTATION), attempt, "wrong_answers");
        if (attempt.getAttemptType() == AttemptType.SAME_PROBLEM_REVIEW && hasZero(attemptId)) add(found, FailureLabelCode.RECALL, FailureSeverity.MEDIUM, firstZero(attemptId), attempt, "same_problem_review_regression");
        if (attempt.getAttemptType() == AttemptType.ISOMORPHIC_TRANSFER && hasZeroAmong(attemptId, Set.of(StageType.PROBLEM_RELATION, StageType.REQUIRED_OPERATIONS, StageType.DATA_STRUCTURE_SELECTION, StageType.TRANSFER))) add(found, FailureLabelCode.TRANSFER, FailureSeverity.HIGH, firstZero(attemptId), attempt, "isomorphic_transfer");
        if (attempt.getAttemptType() == AttemptType.CONTRAST_CLASSIFICATION && score(attemptId, StageType.TRANSFER) == 0) add(found, FailureLabelCode.PATTERN_DISCRIMINATION, FailureSeverity.HIGH, stage(attemptId, StageType.TRANSFER), attempt, "contrast_classification");
        if (attempt.isTimedOut() && attempt.getFinalResult() == FinalResult.SOLVED_INDEPENDENTLY) add(found, FailureLabelCode.TIME_PRESSURE, FailureSeverity.MEDIUM, stage(attemptId, StageType.IMPLEMENTATION), attempt, "timed_out_after_independent_solution");
        // The post-attempt decision is actionable only with one primary and at most two secondary candidates.
        List<BottleneckSuggestion> suggestions = found.values().stream().sorted(Comparator.comparingInt(BottleneckSuggestion::heuristicScore).reversed()).limit(3).toList();
        return new BottleneckAnalysis(suggestions, suggestions.isEmpty() ? null : suggestions.getFirst());
    }
    private void add(Map<FailureLabelCode,BottleneckSuggestion> found, FailureLabelCode code, FailureSeverity severity, StageAssessment stage, Attempt attempt, String key) {
        FailureLabel label = labels.findByCode(code).orElseThrow(); int hint = stage == null ? 0 : Optional.ofNullable(hints.findMaxHintLevel(attempt.getId(), stage.getStageType())).orElse(0);
        long recurrence = attemptLabels.countByFailureLabelIdAndConfirmedTrue(label.getId()); int score = severity == FailureSeverity.HIGH ? SCORE_ZERO_PENALTY : severity == FailureSeverity.MEDIUM ? SCORE_ONE_PENALTY : 15;
        score += hint * HINT_LEVEL_WEIGHT + recurrence * RECURRENCE_WEIGHT + (stage == null ? 0 : 14 - stage.getStageType().getOrder());
        BottleneckEvidence evidence = new BottleneckEvidence(stage == null ? null : stage.getStageType(), stage == null ? null : stage.getScore(), hint, stage == null ? null : stage.getDurationSeconds(), attempt.getFinalResult(), recurrence, key);
        BottleneckSuggestion candidate = new BottleneckSuggestion(label, severity, evidence, score);
        found.merge(code, candidate, (left,right) -> left.heuristicScore() >= right.heuristicScore() ? left : right);
    }
    private FailureSeverity severity(int score, Integer hint) { return score == 0 ? FailureSeverity.HIGH : (hint != null && hint >= 3 ? FailureSeverity.MEDIUM : FailureSeverity.LOW); }
    private FailureLabelCode stageCode(StageType stage) { return switch(stage) {
        case PROBLEM_RELATION -> FailureLabelCode.RELATION_ABSTRACTION; case BRUTE_FORCE -> FailureLabelCode.BRUTE_FORCE_CONSTRUCTION; case REPEATED_WORK -> FailureLabelCode.REPEATED_WORK_IDENTIFICATION; case UNRESOLVED_STATE -> FailureLabelCode.UNRESOLVED_STATE_IDENTIFICATION; case RESOLUTION_EVENT -> FailureLabelCode.RESOLUTION_EVENT_IDENTIFICATION; case UPDATED_REGION -> FailureLabelCode.UPDATED_REGION_IDENTIFICATION; case REQUIRED_OPERATIONS -> FailureLabelCode.REQUIRED_OPERATION_DERIVATION; case DATA_STRUCTURE_SELECTION -> FailureLabelCode.DATA_STRUCTURE_SELECTION; case INVARIANT -> FailureLabelCode.INVARIANT_FORMULATION; case CORRECTNESS_AND_COMPLEXITY -> FailureLabelCode.CORRECTNESS_REASONING; case IMPLEMENTATION -> FailureLabelCode.IMPLEMENTATION_TRANSLATION; case TRANSFER -> FailureLabelCode.TRANSFER; default -> null; }; }
    private StageAssessment stage(UUID id, StageType type){return stages.findByAttemptIdAndStageType(id,type).orElse(null);} private Integer score(UUID id, StageType type){StageAssessment s=stage(id,type); return s==null?null:s.getScore();}
    private boolean hasZero(UUID id){return stages.findByAttemptIdOrderByStageTypeAsc(id).stream().anyMatch(s->Integer.valueOf(0).equals(s.getScore()));} private boolean hasZeroAmong(UUID id, Set<StageType> types){return stages.findByAttemptIdOrderByStageTypeAsc(id).stream().anyMatch(s->types.contains(s.getStageType())&&Integer.valueOf(0).equals(s.getScore()));} private StageAssessment firstZero(UUID id){return stages.findByAttemptIdOrderByStageTypeAsc(id).stream().filter(s->Integer.valueOf(0).equals(s.getScore())).min(Comparator.comparingInt(s->s.getStageType().getOrder())).orElse(null);}
}
