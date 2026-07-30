package com.example.leetcodetrainer.planning.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import com.example.leetcodetrainer.analytics.domain.*;
import com.example.leetcodetrainer.analytics.service.AnalyticsService;
import com.example.leetcodetrainer.attempt.domain.*;
import com.example.leetcodetrainer.attempt.repository.*;
import com.example.leetcodetrainer.failure.domain.*;
import com.example.leetcodetrainer.failure.repository.AttemptFailureLabelRepository;
import com.example.leetcodetrainer.hint.repository.HintUsageRepository;
import com.example.leetcodetrainer.planning.repository.WeeklyPlanRepository;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;

@ExtendWith(org.mockito.junit.jupiter.MockitoExtension.class)
class WeeklyPlanServiceTest {
    private final WeeklyPlanRepository plans = mock(WeeklyPlanRepository.class);
    private final AnalyticsService analytics = mock(AnalyticsService.class);
    private final AttemptRepository attempts = mock(AttemptRepository.class);
    private final StageAssessmentRepository assessments = mock(StageAssessmentRepository.class);
    private final HintUsageRepository hints = mock(HintUsageRepository.class);
    private final AttemptFailureLabelRepository failures = mock(AttemptFailureLabelRepository.class);
    private final Clock clock = Clock.fixed(Instant.parse("2026-07-29T12:00:00Z"), ZoneOffset.UTC);
    private final WeeklyPlanService service = new WeeklyPlanService(plans, analytics, attempts, assessments, hints, failures, clock, ZoneId.of("Europe/London"));

    @Test
    void withholdsRecommendationUntilTheEvidenceThresholdIsMet() {
        when(attempts.findByStatusOrderByCompletedAtDesc(AttemptStatus.COMPLETED)).thenReturn(List.of(completedAttempt(UUID.randomUUID())));
        StageAssessment assessment = scoredAssessment();
        when(assessments.findByAttemptIdIn(any())).thenReturn(List.of(assessment));

        FocusRecommendation recommendation = service.recommendation();

        assertThat(recommendation.available()).isFalse();
        verifyNoInteractions(analytics, hints, failures);
    }

    @Test
    void recommendsOneStageWithEvidenceAfterEnoughCompletedWork() {
        UUID firstProblem = UUID.randomUUID(); UUID secondProblem = UUID.randomUUID();
        Attempt first = completedAttempt(firstProblem); Attempt second = completedAttempt(secondProblem); Attempt third = completedAttempt(firstProblem);
        List<Attempt> completed = List.of(first, second, third);
        List<StageAssessment> allAssessments = new ArrayList<>();
        for (int index = 0; index < 20; index++) allAssessments.add(scoredAssessment());
        List<StageAssessment> invariantAssessments = List.of(scoredAssessment(first.getId()), scoredAssessment(second.getId()));
        StageMetric invariant = new StageMetric(StageType.INVARIANT, new Metric(1, 2, 2), 1.5);
        AnalyticsSnapshot snapshot = new AnalyticsSnapshot(AnalyticsPeriod.DAYS_28, List.of(invariant), new Metric(0, 0, 0),
                new Metric(0, 0, 0), new Metric(0, 0, 0), new Metric(0, 0, 0), null, null, List.of(), List.of());
        FailureLabel label = mock(FailureLabel.class); AttemptFailureLabel entry = mock(AttemptFailureLabel.class);
        when(label.getRelatedStage()).thenReturn(StageType.INVARIANT); when(label.getDisplayName()).thenReturn("不変条件の定式化");
        when(entry.getFailureLabel()).thenReturn(label);
        when(attempts.findByStatusOrderByCompletedAtDesc(AttemptStatus.COMPLETED)).thenReturn(completed);
        when(assessments.findByAttemptIdIn(any())).thenReturn(allAssessments);
        when(analytics.snapshot(AnalyticsPeriod.DAYS_28)).thenReturn(snapshot);
        when(assessments.findByAttemptIdInAndStageType(any(), eq(StageType.INVARIANT))).thenReturn(invariantAssessments);
        when(hints.findByAttemptIdInAndStageType(any(), eq(StageType.INVARIANT))).thenReturn(List.of(mock(com.example.leetcodetrainer.hint.domain.HintUsage.class)));
        when(failures.findConfirmedByAttemptIdIn(any())).thenReturn(List.of(entry));

        FocusRecommendation recommendation = service.recommendation();

        assertThat(recommendation.available()).isTrue();
        assertThat(recommendation.stage()).isEqualTo(StageType.INVARIANT);
        assertThat(recommendation.success().independentDisplay()).isEqualTo("50%");
        assertThat(recommendation.hintUsageCount()).isEqualTo(1);
        assertThat(recommendation.relatedFailureLabels()).containsExactly("不変条件の定式化");
        assertThat(recommendation.problemCount()).isEqualTo(2);
        assertThat(recommendation.sampleSize()).isEqualTo(2);
    }

    private Attempt completedAttempt(UUID problemId) {
        Attempt attempt = new Attempt(UUID.randomUUID(), problemId, AttemptType.INITIAL, clock.instant().minusSeconds(60));
        attempt.complete(FinalResult.PARTIALLY_SOLVED, clock.instant());
        return attempt;
    }

    private StageAssessment scoredAssessment() {
        StageAssessment assessment = mock(StageAssessment.class);
        when(assessment.getScore()).thenReturn(1);
        return assessment;
    }

    private StageAssessment scoredAssessment(UUID attemptId) {
        StageAssessment assessment = scoredAssessment();
        when(assessment.getAttemptId()).thenReturn(attemptId);
        return assessment;
    }
}
