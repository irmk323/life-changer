package com.example.leetcodetrainer.analytics.service;

import com.example.leetcodetrainer.analytics.domain.*;
import com.example.leetcodetrainer.attempt.domain.*;
import com.example.leetcodetrainer.attempt.repository.AttemptRepository;
import com.example.leetcodetrainer.attempt.repository.StageAssessmentRepository;
import com.example.leetcodetrainer.failure.repository.AttemptFailureLabelRepository;
import com.example.leetcodetrainer.hint.repository.HintUsageRepository;
import com.example.leetcodetrainer.review.domain.ReviewSchedule;
import com.example.leetcodetrainer.review.repository.ReviewScheduleRepository;
import com.example.leetcodetrainer.referenceanswer.repository.StageReferenceAnswerRevealRepository;
import java.time.*;
import java.util.*;
import java.util.function.Predicate;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

/** Aggregates completed attempts in bulk; controllers receive presentation-ready DTOs only. */
@Service
public class AnalyticsService {
    private static final List<StageType> RETENTION_CORE = List.of(StageType.PROBLEM_RELATION, StageType.BRUTE_FORCE,
            StageType.UNRESOLVED_STATE, StageType.UPDATED_REGION, StageType.REQUIRED_OPERATIONS,
            StageType.DATA_STRUCTURE_SELECTION, StageType.INVARIANT);
    private static final List<StageType> TRANSFER_CORE = List.of(StageType.PROBLEM_RELATION, StageType.UPDATED_REGION,
            StageType.REQUIRED_OPERATIONS, StageType.DATA_STRUCTURE_SELECTION, StageType.INVARIANT);
    private final AttemptRepository attempts; private final StageAssessmentRepository assessments; private final HintUsageRepository hints; private final StageReferenceAnswerRevealRepository referenceReveals;
    private final AttemptFailureLabelRepository failures; private final ReviewScheduleRepository reviews; private final Clock clock; private final ZoneId zoneId;

    public AnalyticsService(AttemptRepository attempts, StageAssessmentRepository assessments, HintUsageRepository hints, StageReferenceAnswerRevealRepository referenceReveals,
                            AttemptFailureLabelRepository failures, ReviewScheduleRepository reviews, Clock clock, ZoneId reviewZoneId) {
        this.attempts = attempts; this.assessments = assessments; this.hints = hints; this.referenceReveals=referenceReveals; this.failures = failures; this.reviews = reviews; this.clock = clock; this.zoneId = reviewZoneId;
    }

    public AnalyticsSnapshot snapshot(AnalyticsPeriod period) {
        Instant start = period.start(clock, zoneId);
        List<Attempt> completed = attempts.findByStatusOrderByCompletedAtDesc(AttemptStatus.COMPLETED).stream()
                .filter(attempt -> start == null || !attempt.getCompletedAt().isBefore(start)).toList();
        return aggregate(period, completed);
    }

    public AnalyticsSnapshot forProblem(UUID problemId) {
        return aggregate(AnalyticsPeriod.ALL, attempts.findByProblemIdOrderByStartedAtDesc(problemId).stream()
                .filter(attempt -> attempt.getStatus() == AttemptStatus.COMPLETED).toList());
    }

    private AnalyticsSnapshot aggregate(AnalyticsPeriod period, List<Attempt> completed) {
        Set<UUID> ids = completed.stream().map(Attempt::getId).collect(Collectors.toSet());
        Map<UUID, Map<StageType, StageAssessment>> byAttempt = assessments(ids);
        Map<StageKey, Integer> maxHints = maxHints(ids);
        List<StageMetric> stages = Arrays.stream(StageType.values()).map(stage -> stageMetric(stage, completed, byAttempt, maxHints)).toList();
        Metric retention = attemptMetric(completed, attempt -> attempt.getAttemptType() == AttemptType.SAME_PROBLEM_REVIEW,
                RETENTION_CORE, byAttempt, maxHints, false);
        Metric transfer = attemptMetric(completed, attempt -> attempt.getAttemptType() == AttemptType.ISOMORPHIC_TRANSFER,
                TRANSFER_CORE, byAttempt, maxHints, true);
        Metric classification = classificationMetric(completed, byAttempt);
        Metric implementation = simpleMetric(completed, Attempt::isImplementationCompleted);
        List<Long> patternTimes = completedStages(completed, byAttempt, StageType.DATA_STRUCTURE_SELECTION).stream().map(StageAssessment::getDurationSeconds).filter(Objects::nonNull).toList();
        List<Long> implementationTimes = completedStages(completed, byAttempt, StageType.IMPLEMENTATION).stream().map(StageAssessment::getDurationSeconds).filter(Objects::nonNull).toList();
        return new AnalyticsSnapshot(period, stages, retention, transfer, classification, implementation, median(patternTimes), median(implementationTimes),
                failureCounts(ids), reviewImprovements(ids, byAttempt, maxHints));
    }

    private Map<UUID, Map<StageType, StageAssessment>> assessments(Set<UUID> ids) {
        if (ids.isEmpty()) return Map.of();
        return assessments.findByAttemptIdIn(ids).stream().collect(Collectors.groupingBy(StageAssessment::getAttemptId,
                Collectors.toMap(StageAssessment::getStageType, value -> value)));
    }
    private Map<StageKey, Integer> maxHints(Set<UUID> ids) {
        if (ids.isEmpty()) return Map.of();
        Map<StageKey, Integer> result = new HashMap<>();
        hints.findMaxHintLevelsByAttemptIds(ids).forEach(row -> result.put(new StageKey((UUID) row[0], (StageType) row[1]), ((Number) row[2]).intValue()));
        Map<UUID, StageAssessment> assessmentById = assessments.findByAttemptIdIn(ids).stream().collect(Collectors.toMap(StageAssessment::getId, value -> value));
        referenceReveals.findByAttemptIdIn(ids).forEach(reveal -> { StageAssessment assessment=assessmentById.get(reveal.getStageAssessmentId()); if (assessment != null) result.merge(new StageKey(reveal.getAttemptId(), assessment.getStageType()), 5, Math::max); });
        return result;
    }
    private StageMetric stageMetric(StageType stage, List<Attempt> attempts, Map<UUID, Map<StageType, StageAssessment>> data, Map<StageKey, Integer> maxHints) {
        List<StageAssessment> values = completedStages(attempts, data, stage);
        long independent = values.stream().filter(value -> value.getScore() == 2).count();
        long assisted = values.stream().filter(value -> value.getScore() >= 1).count();
        Double averageHint = values.isEmpty() ? null : values.stream().mapToInt(value -> maxHints.getOrDefault(new StageKey(value.getAttemptId(), stage), 0)).average().orElseThrow();
        return new StageMetric(stage, new Metric(independent, assisted, values.size()), averageHint);
    }
    private List<StageAssessment> completedStages(List<Attempt> completed, Map<UUID, Map<StageType, StageAssessment>> data, StageType stage) {
        return completed.stream().map(attempt -> data.getOrDefault(attempt.getId(), Map.of()).get(stage))
                .filter(Objects::nonNull).filter(value -> value.getAssessmentStatus() == StageAssessmentStatus.ASSESSED).filter(value -> value.getScore() != null).toList();
    }
    private Metric attemptMetric(List<Attempt> values, Predicate<Attempt> eligible, List<StageType> core,
                                 Map<UUID, Map<StageType, StageAssessment>> data, Map<StageKey, Integer> maxHints, boolean transfer) {
        List<Attempt> candidates = values.stream().filter(eligible).filter(attempt -> hasAllScoredStages(attempt, core, data)).toList();
        long independent = candidates.stream().filter(attempt -> allAtLeast(attempt, core, data, 2))
                .filter(attempt -> !transfer || successfulTransfer(attempt, maxHints)).count();
        long assisted = candidates.stream().filter(attempt -> allAtLeast(attempt, core, data, 1))
                .filter(attempt -> !transfer || successfulResult(attempt)).count();
        return new Metric(independent, assisted, candidates.size());
    }
    private boolean successfulTransfer(Attempt attempt, Map<StageKey, Integer> maxHints) { return successfulResult(attempt) && maxHints.entrySet().stream().filter(entry -> entry.getKey().attemptId.equals(attempt.getId())).mapToInt(Map.Entry::getValue).max().orElse(0) <= 2; }
    private boolean successfulResult(Attempt attempt) { return attempt.getFinalResult() == FinalResult.SOLVED_INDEPENDENTLY || attempt.getFinalResult() == FinalResult.SOLVED_WITH_HINT || attempt.getFinalResult() == FinalResult.PARTIALLY_SOLVED; }
    /**
     * A profile can explicitly exclude a legacy stage.  That is not missing
     * evidence, so it must neither disqualify an attempt nor be treated as a
     * zero in retention/transfer aggregates.
     */
    private boolean hasAllScoredStages(Attempt attempt, List<StageType> core, Map<UUID, Map<StageType, StageAssessment>> data) {
        List<StageAssessment> applicable = applicableCore(attempt, core, data);
        return !applicable.isEmpty() && applicable.stream()
                .allMatch(value -> value.getAssessmentStatus() == StageAssessmentStatus.ASSESSED && value.getScore() != null);
    }
    private boolean allAtLeast(Attempt attempt, List<StageType> core, Map<UUID, Map<StageType, StageAssessment>> data, int score) {
        return applicableCore(attempt, core, data).stream().allMatch(value -> value.getScore() >= score);
    }
    private List<StageAssessment> applicableCore(Attempt attempt, List<StageType> core, Map<UUID, Map<StageType, StageAssessment>> data) {
        Map<StageType, StageAssessment> byStage = data.getOrDefault(attempt.getId(), Map.of());
        return core.stream().map(byStage::get).filter(Objects::nonNull)
                .filter(value -> value.getAssessmentStatus() != StageAssessmentStatus.NOT_APPLICABLE).toList();
    }
    private Metric classificationMetric(List<Attempt> values, Map<UUID, Map<StageType, StageAssessment>> data) {
        List<StageAssessment> answers = values.stream().filter(a -> a.getAttemptType() == AttemptType.CONTRAST_CLASSIFICATION || a.getAttemptType() == AttemptType.MIXED_CLASSIFICATION)
                .map(a -> data.getOrDefault(a.getId(), Map.of()).get(StageType.TRANSFER)).filter(Objects::nonNull).filter(a -> a.getAssessmentStatus() != StageAssessmentStatus.NOT_APPLICABLE).filter(a -> a.getScore() != null).toList();
        long independent = answers.stream().filter(a -> a.getScore() == 2 && a.getAnswer() != null && !a.getAnswer().isBlank()).count();
        long assisted = answers.stream().filter(a -> a.getScore() >= 1 && a.getAnswer() != null && !a.getAnswer().isBlank()).count();
        return new Metric(independent, assisted, answers.size());
    }
    private Metric simpleMetric(List<Attempt> values, Predicate<Attempt> success) { long count = values.stream().filter(success).count(); return new Metric(count, count, values.size()); }
    private Long median(List<Long> values) { if (values.isEmpty()) return null; List<Long> sorted = values.stream().sorted().toList(); int middle = sorted.size() / 2; return sorted.size() % 2 == 0 ? (sorted.get(middle - 1) + sorted.get(middle)) / 2 : sorted.get(middle); }
    private List<AnalyticsSnapshot.FailureCount> failureCounts(Set<UUID> ids) {
        if (ids.isEmpty()) return List.of();
        return failures.findConfirmedByAttemptIdIn(ids).stream().collect(Collectors.groupingBy(entry -> entry.getFailureLabel().getDisplayName(), Collectors.counting())).entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed()).limit(3).map(entry -> new AnalyticsSnapshot.FailureCount(entry.getKey(), null, entry.getValue())).toList();
    }
    private List<AnalyticsSnapshot.ReviewImprovement> reviewImprovements(Set<UUID> ids, Map<UUID, Map<StageType, StageAssessment>> data, Map<StageKey, Integer> maxHints) {
        if (ids.isEmpty()) return List.of();
        return reviews.findByCompletionAttemptIdIn(ids).stream().map(review -> improvement(review, data, maxHints)).filter(Objects::nonNull).toList();
    }
    private AnalyticsSnapshot.ReviewImprovement improvement(ReviewSchedule review, Map<UUID, Map<StageType, StageAssessment>> data, Map<StageKey, Integer> maxHints) {
        Map<StageType, StageAssessment> source = data.get(review.getSourceAttemptId()); Map<StageType, StageAssessment> target = data.get(review.getCompletionAttemptId());
        if (source == null || target == null) return null;
        List<StageType> common = source.keySet().stream().filter(target::containsKey).filter(stage -> source.get(stage).getAssessmentStatus()!=StageAssessmentStatus.NOT_APPLICABLE && target.get(stage).getAssessmentStatus()!=StageAssessmentStatus.NOT_APPLICABLE).filter(stage -> source.get(stage).getScore() != null && target.get(stage).getScore() != null).toList();
        if (common.isEmpty()) return null;
        int score = (int) Math.round(common.stream().mapToInt(stage -> target.get(stage).getScore() - source.get(stage).getScore()).average().orElse(0));
        int hints = (int) Math.round(common.stream().mapToInt(stage -> maxHints.getOrDefault(new StageKey(target.get(stage).getAttemptId(), stage), 0) - maxHints.getOrDefault(new StageKey(source.get(stage).getAttemptId(), stage), 0)).average().orElse(0));
        return new AnalyticsSnapshot.ReviewImprovement(review.getReviewType().getDisplayName(), score, hints);
    }
    private record StageKey(UUID attemptId, StageType stage) { }
}
