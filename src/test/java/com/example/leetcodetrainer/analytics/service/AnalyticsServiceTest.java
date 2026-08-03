package com.example.leetcodetrainer.analytics.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.example.leetcodetrainer.analytics.domain.AnalyticsPeriod;
import com.example.leetcodetrainer.attempt.domain.Attempt;
import com.example.leetcodetrainer.attempt.domain.AttemptType;
import com.example.leetcodetrainer.attempt.domain.FinalResult;
import com.example.leetcodetrainer.attempt.domain.StageAssessment;
import com.example.leetcodetrainer.attempt.domain.StageAssessmentStatus;
import com.example.leetcodetrainer.attempt.domain.StageType;
import com.example.leetcodetrainer.attempt.repository.AttemptRepository;
import com.example.leetcodetrainer.attempt.repository.StageAssessmentRepository;
import com.example.leetcodetrainer.failure.repository.AttemptFailureLabelRepository;
import com.example.leetcodetrainer.hint.repository.HintUsageRepository;
import com.example.leetcodetrainer.referenceanswer.repository.StageReferenceAnswerRevealRepository;
import com.example.leetcodetrainer.review.repository.ReviewScheduleRepository;
import com.example.leetcodetrainer.review.domain.ReviewSchedule;
import com.example.leetcodetrainer.review.domain.ReviewType;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

class AnalyticsServiceTest {
    @Test
    void excludesNotApplicableCoreStagesInsteadOfTreatingThemAsMissingEvidence() {
        AttemptRepository attempts = Mockito.mock(AttemptRepository.class);
        StageAssessmentRepository assessments = Mockito.mock(StageAssessmentRepository.class);
        HintUsageRepository hints = Mockito.mock(HintUsageRepository.class);
        StageReferenceAnswerRevealRepository reveals = Mockito.mock(StageReferenceAnswerRevealRepository.class);
        AttemptFailureLabelRepository failures = Mockito.mock(AttemptFailureLabelRepository.class);
        ReviewScheduleRepository reviews = Mockito.mock(ReviewScheduleRepository.class);
        Instant now = Instant.parse("2026-08-03T10:00:00Z");
        UUID attemptId = UUID.randomUUID();
        Attempt attempt = new Attempt(attemptId, UUID.randomUUID(), AttemptType.SAME_PROBLEM_REVIEW, now.minusSeconds(20));
        attempt.complete(FinalResult.NOT_SOLVED, now);

        List<StageAssessment> evidence = List.of(
                assessed(attemptId, StageType.PROBLEM_RELATION, now),
                assessed(attemptId, StageType.BRUTE_FORCE, now),
                assessed(attemptId, StageType.UNRESOLVED_STATE, now),
                assessed(attemptId, StageType.UPDATED_REGION, now),
                assessed(attemptId, StageType.REQUIRED_OPERATIONS, now),
                notApplicable(attemptId, StageType.DATA_STRUCTURE_SELECTION, now),
                assessed(attemptId, StageType.INVARIANT, now));
        when(attempts.findByStatusOrderByCompletedAtDesc(com.example.leetcodetrainer.attempt.domain.AttemptStatus.COMPLETED)).thenReturn(List.of(attempt));
        when(assessments.findByAttemptIdIn(org.mockito.ArgumentMatchers.anySet())).thenReturn(evidence);
        when(hints.findMaxHintLevelsByAttemptIds(org.mockito.ArgumentMatchers.anySet())).thenReturn(List.of());
        when(reveals.findByAttemptIdIn(org.mockito.ArgumentMatchers.anySet())).thenReturn(List.of());
        when(failures.findConfirmedByAttemptIdIn(org.mockito.ArgumentMatchers.anySet())).thenReturn(List.of());
        when(reviews.findByCompletionAttemptIdIn(org.mockito.ArgumentMatchers.anySet())).thenReturn(List.of());

        var service = new AnalyticsService(attempts, assessments, hints, reveals, failures, reviews,
                Clock.fixed(now, ZoneId.of("UTC")), ZoneId.of("UTC"));

        assertThat(service.snapshot(AnalyticsPeriod.ALL).retention().sampleSize()).isEqualTo(1);
    }

    @Test
    void reviewImprovementUsesOnlyApplicableStages() {
        AttemptRepository attempts = Mockito.mock(AttemptRepository.class); StageAssessmentRepository assessments = Mockito.mock(StageAssessmentRepository.class);
        HintUsageRepository hints = Mockito.mock(HintUsageRepository.class); StageReferenceAnswerRevealRepository reveals = Mockito.mock(StageReferenceAnswerRevealRepository.class);
        AttemptFailureLabelRepository failures = Mockito.mock(AttemptFailureLabelRepository.class); ReviewScheduleRepository reviews = Mockito.mock(ReviewScheduleRepository.class);
        Instant now = Instant.parse("2026-08-03T10:00:00Z"); UUID sourceId=UUID.randomUUID(), targetId=UUID.randomUUID(), problemId=UUID.randomUUID();
        Attempt source=new Attempt(sourceId,problemId,AttemptType.INITIAL,now.minusSeconds(20)); source.complete(FinalResult.NOT_SOLVED,now.minusSeconds(10));
        Attempt target=new Attempt(targetId,problemId,AttemptType.SAME_PROBLEM_REVIEW,now.minusSeconds(9)); target.complete(FinalResult.NOT_SOLVED,now);
        ReviewSchedule review=new ReviewSchedule(UUID.randomUUID(),sourceId,problemId,problemId,null,ReviewType.RECONSTRUCTION,java.time.LocalDate.of(2026,8,3),"",now); review.complete(targetId,now);
        var sourceRelation=assessment(sourceId,StageType.PROBLEM_RELATION,0,now); var targetRelation=assessment(targetId,StageType.PROBLEM_RELATION,2,now);
        var sourceNa=notApplicable(sourceId,StageType.DATA_STRUCTURE_SELECTION,now); var targetNa=notApplicable(targetId,StageType.DATA_STRUCTURE_SELECTION,now);
        when(attempts.findByStatusOrderByCompletedAtDesc(com.example.leetcodetrainer.attempt.domain.AttemptStatus.COMPLETED)).thenReturn(List.of(source,target));
        when(assessments.findByAttemptIdIn(org.mockito.ArgumentMatchers.anySet())).thenReturn(List.of(sourceRelation,targetRelation,sourceNa,targetNa));
        when(hints.findMaxHintLevelsByAttemptIds(org.mockito.ArgumentMatchers.anySet())).thenReturn(List.of()); when(reveals.findByAttemptIdIn(org.mockito.ArgumentMatchers.anySet())).thenReturn(List.of()); when(failures.findConfirmedByAttemptIdIn(org.mockito.ArgumentMatchers.anySet())).thenReturn(List.of()); when(reviews.findByCompletionAttemptIdIn(org.mockito.ArgumentMatchers.anySet())).thenReturn(List.of(review));
        var service=new AnalyticsService(attempts,assessments,hints,reveals,failures,reviews,Clock.fixed(now,ZoneId.of("UTC")),ZoneId.of("UTC"));
        assertThat(service.snapshot(AnalyticsPeriod.ALL).reviewImprovements()).extracting("scoreDelta").containsExactly(2);
    }

    private static StageAssessment assessed(UUID attemptId, StageType type, Instant now) {
        StageAssessment assessment = new StageAssessment(UUID.randomUUID(), attemptId, type, now);
        assessment.setAssessmentStatus(StageAssessmentStatus.ASSESSED, 0, now);
        return assessment;
    }
    private static StageAssessment assessment(UUID attemptId, StageType type, int score, Instant now) { StageAssessment value=new StageAssessment(UUID.randomUUID(),attemptId,type,now); value.setAssessmentStatus(StageAssessmentStatus.ASSESSED,score,now); return value; }

    private static StageAssessment notApplicable(UUID attemptId, StageType type, Instant now) {
        StageAssessment assessment = new StageAssessment(UUID.randomUUID(), attemptId, type, now);
        assessment.setAssessmentStatus(StageAssessmentStatus.NOT_APPLICABLE, null, now);
        return assessment;
    }
}
