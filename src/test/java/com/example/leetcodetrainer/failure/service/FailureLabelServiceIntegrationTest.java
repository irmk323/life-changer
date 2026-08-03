package com.example.leetcodetrainer.failure.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.leetcodetrainer.attempt.domain.*;
import com.example.leetcodetrainer.attempt.repository.*;
import com.example.leetcodetrainer.attempt.service.AttemptService;
import com.example.leetcodetrainer.failure.domain.*;
import com.example.leetcodetrainer.failure.repository.*;
import com.example.leetcodetrainer.problem.repository.ProblemRepository;
import com.example.leetcodetrainer.referenceanswer.repository.StageReferenceAnswerRevealRepository;
import com.example.leetcodetrainer.review.repository.ReviewScheduleRepository;
import java.util.Set;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class FailureLabelServiceIntegrationTest {
    @Autowired private AttemptService attemptService; @Autowired private FailureLabelService failureService;
    @Autowired private AttemptRepository attempts; @Autowired private StageAssessmentRepository stages; @Autowired private AttemptFailureLabelRepository attemptLabels;
    @Autowired private ReviewScheduleRepository reviews; @Autowired private ProblemRepository problems; @Autowired private FailureLabelRepository labels;
    @Autowired private StageReferenceAnswerRevealRepository referenceAnswerReveals;

    @BeforeEach void clean() { reviews.deleteAll(); referenceAnswerReveals.deleteAll(); stages.deleteAll(); attempts.deleteAll(); }

    @Test
    void completedAttemptCreatesEvidenceBasedUpdatedRegionSuggestionThatTheUserCanConfirmAndReview() {
        assertThat(labels.findByActiveTrueOrderByDisplayOrderAsc()).hasSize(25);
        Attempt attempt = attemptService.start(problems.findByActiveTrueOrderByLeetcodeNumberAsc().getFirst().getId(), AttemptType.INITIAL);
        for (StageType stage : StageType.ordered()) attemptService.saveStage(attempt.getId(), stage,
                new StageSaveCommand("記録", stage.getOrder() < StageType.UPDATED_REGION.getOrder() ? 2 : 0, null, null, null, null, null, null, Set.of()));
        attemptService.complete(attempt.getId(), FinalResult.PARTIALLY_SOLVED);

        AttemptFailureLabel suggested = failureService.entries(attempt.getId()).stream().filter(item -> item.getFailureLabel().getCode() == FailureLabelCode.UPDATED_REGION_IDENTIFICATION).findFirst().orElseThrow();
        assertThat(suggested.getSeverity()).isEqualTo(FailureSeverity.HIGH); assertThat(suggested.isConfirmed()).isFalse();
        failureService.confirm(attempt.getId(), suggested.getFailureLabel().getId(), "末尾から更新する根拠を再確認したい");
        assertThat(failureService.entries(attempt.getId()).stream().filter(item -> item.getId().equals(suggested.getId())).findFirst().orElseThrow().isConfirmed()).isTrue();
        failureService.createBottleneckReview(attempt.getId(), suggested.getFailureLabel().getId());
        assertThat(reviews.findAll()).anyMatch(review -> suggested.getFailureLabel().getId().equals(review.getFailureLabelId()));
    }

    @Test
    void doesNotGenerateFailureLabelForNotApplicableRecursiveStages() {
        var maximumDepth = problems.findById(java.util.UUID.fromString("20000000-0000-0000-0000-000000000007")).orElseThrow();
        Attempt attempt = attemptService.start(maximumDepth.getId(), AttemptType.INITIAL);
        attemptService.saveStage(attempt.getId(), StageType.PROBLEM_RELATION, new StageSaveCommand("contract", 0, null, null, null, null, null, null, Set.of()));
        attemptService.saveStage(attempt.getId(), StageType.UNRESOLVED_STATE, new StageSaveCommand("children", 0, null, null, null, null, null, null, Set.of()));
        attemptService.saveStage(attempt.getId(), StageType.INVARIANT, new StageSaveCommand("depth", 0, null, null, null, null, null, null, Set.of()));
        attemptService.complete(attempt.getId(), FinalResult.NOT_SOLVED);

        assertThat(failureService.analysis(attempt.getId()).suggestions())
                .noneMatch(s -> s.label().getCode() == FailureLabelCode.REPEATED_WORK_IDENTIFICATION
                        || s.label().getCode() == FailureLabelCode.DATA_STRUCTURE_SELECTION);
    }
}
