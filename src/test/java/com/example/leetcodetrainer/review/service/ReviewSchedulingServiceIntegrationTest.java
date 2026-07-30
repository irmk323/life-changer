package com.example.leetcodetrainer.review.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.leetcodetrainer.attempt.domain.*;
import com.example.leetcodetrainer.attempt.repository.AttemptRepository;
import com.example.leetcodetrainer.attempt.repository.StageAssessmentRepository;
import com.example.leetcodetrainer.attempt.service.AttemptService;
import com.example.leetcodetrainer.problem.repository.ProblemRepository;
import com.example.leetcodetrainer.referenceanswer.repository.StageReferenceAnswerRevealRepository;
import com.example.leetcodetrainer.review.domain.*;
import com.example.leetcodetrainer.review.repository.ReviewScheduleRepository;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class ReviewSchedulingServiceIntegrationTest {
    @Autowired private ReviewSchedulingService reviewService;
    @Autowired private ReviewScheduleRepository reviewRepository;
    @Autowired private AttemptService attemptService;
    @Autowired private AttemptRepository attemptRepository;
    @Autowired private StageAssessmentRepository stageAssessmentRepository;
    @Autowired private ProblemRepository problemRepository;
    @Autowired private StageReferenceAnswerRevealRepository referenceAnswerRevealRepository;

    @BeforeEach
    void clean() { reviewRepository.deleteAll(); referenceAnswerRevealRepository.deleteAll(); stageAssessmentRepository.deleteAll(); attemptRepository.deleteAll(); }

    @Test
    void completedInitialAttemptCreatesExactlyFourDistinctReviewsAndDoesNotDuplicateThem() {
        Attempt initial = completedInitialAttempt();
        var schedules = reviewRepository.findAllByOrderByScheduledDateAsc();
        assertThat(schedules).hasSize(4).extracting(ReviewSchedule::getReviewType)
                .containsExactly(ReviewType.RECONSTRUCTION, ReviewType.ISOMORPHIC_TRANSFER, ReviewType.CONTRAST_CLASSIFICATION, ReviewType.COLD_SOLVE);
        assertThat(schedules).allSatisfy(review -> assertThat(review.getSourceAttemptId()).isEqualTo(initial.getId()));
        Attempt persistedInitial = attemptService.get(initial.getId());
        assertThat(reviewService.generateInitialReviews(initial.getId(), initial.getProblemId(), persistedInitial.getCompletedAt())).isEmpty();
    }

    @Test
    void startsAndCompletesAReconstructionReviewWithTheMappedAttemptType() {
        completedInitialAttempt();
        ReviewSchedule reconstruction = reviewRepository.findAllByOrderByScheduledDateAsc().stream()
                .filter(review -> review.getReviewType() == ReviewType.RECONSTRUCTION).findFirst().orElseThrow();
        Attempt reviewAttempt = reviewService.startReview(reconstruction.getId());
        assertThat(reviewAttempt.getAttemptType()).isEqualTo(AttemptType.SAME_PROBLEM_REVIEW);
        assertThat(reviewAttempt.getSourceReviewScheduleId()).isEqualTo(reconstruction.getId());
        completeAllStages(reviewAttempt);
        attemptService.complete(reviewAttempt.getId(), FinalResult.PARTIALLY_SOLVED);
        ReviewSchedule completed = reviewRepository.findById(reconstruction.getId()).orElseThrow();
        assertThat(completed.getStatus()).isEqualTo(ReviewStatus.COMPLETED);
        assertThat(completed.getCompletionAttemptId()).isEqualTo(reviewAttempt.getId());
        assertThat(reviewRepository.findAllByOrderByScheduledDateAsc()).hasSize(4);
    }

    @Test
    void reschedulesCancelsAndCreatesAOneDayFollowUpAfterCompletion() {
        completedInitialAttempt();
        ReviewSchedule schedule = reviewRepository.findAllByOrderByScheduledDateAsc().getFirst();
        LocalDate changed = LocalDate.now(ZoneId.of("Europe/London")).plusDays(9);
        reviewService.reschedule(schedule.getId(), changed, "予定の都合");
        assertThat(reviewRepository.findById(schedule.getId()).orElseThrow().getStatus()).isEqualTo(ReviewStatus.RESCHEDULED);
        reviewService.cancel(schedule.getId());
        assertThat(reviewRepository.findById(schedule.getId()).orElseThrow().getStatus()).isEqualTo(ReviewStatus.CANCELLED);

        ReviewSchedule another = reviewRepository.findAllByOrderByScheduledDateAsc().stream().filter(item -> item.getReviewType() == ReviewType.COLD_SOLVE).findFirst().orElseThrow();
        Attempt reviewAttempt = reviewService.startReview(another.getId()); completeAllStages(reviewAttempt); attemptService.complete(reviewAttempt.getId(), FinalResult.NOT_SOLVED);
        ReviewSchedule followUp = reviewService.createFollowUp(another.getId(), "もう一度関係を確認する");
        assertThat(followUp.getScheduledDate()).isEqualTo(LocalDate.now(ZoneId.of("Europe/London")).plusDays(1));
        assertThat(followUp.getSourceAttemptId()).isEqualTo(reviewAttempt.getId());
    }

    private Attempt completedInitialAttempt() {
        var problem = problemRepository.findByActiveTrueOrderByLeetcodeNumberAsc().getFirst();
        Attempt attempt = attemptService.start(problem.getId(), AttemptType.INITIAL); completeAllStages(attempt); attemptService.complete(attempt.getId(), FinalResult.PARTIALLY_SOLVED); return attempt;
    }
    private void completeAllStages(Attempt attempt) {
        for (StageType stage : StageType.ordered()) attemptService.saveStage(attempt.getId(), stage,
                new StageSaveCommand("記録", 0, null, null, null, null, null, null, Set.of()));
    }
}
