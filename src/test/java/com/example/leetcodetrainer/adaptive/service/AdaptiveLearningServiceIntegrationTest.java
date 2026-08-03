package com.example.leetcodetrainer.adaptive.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.leetcodetrainer.adaptive.domain.LearningTaskAttemptStatus;
import com.example.leetcodetrainer.adaptive.repository.LearningTaskAttemptRepository;
import com.example.leetcodetrainer.attempt.domain.AttemptType;
import com.example.leetcodetrainer.attempt.domain.FinalResult;
import com.example.leetcodetrainer.attempt.domain.PriorExposure;
import com.example.leetcodetrainer.attempt.domain.RequiredOperation;
import com.example.leetcodetrainer.attempt.domain.StageSaveCommand;
import com.example.leetcodetrainer.attempt.domain.StageType;
import com.example.leetcodetrainer.attempt.service.AttemptService;
import com.example.leetcodetrainer.problem.repository.ProblemRepository;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AdaptiveLearningServiceIntegrationTest {
    @Autowired private AdaptiveLearningService learning;
    @Autowired private LearningTaskAttemptRepository taskAttempts;
    @Autowired private AttemptService attempts;
    @Autowired private ProblemRepository problems;

    @Test
    void resumesAnOpenSourceTaskAndCreatesALinkedRetryAfterCompletion() {
        UUID sourceAttemptId = UUID.randomUUID();
        var open = learning.start("maximum-depth-four-line-contract", sourceAttemptId);

        assertThat(learning.start("maximum-depth-four-line-contract", sourceAttemptId).getId()).isEqualTo(open.getId());
        assertThat(open.getPreviousAttemptId()).isNull();
        open.saveContract("depth(node)", "null -> 0", "left and right", "1 + max", Instant.now());
        open.complete(Instant.now());
        taskAttempts.flush();

        var retry = learning.retry(open.getId());

        assertThat(open.getStatus()).isEqualTo(LearningTaskAttemptStatus.COMPLETED);
        assertThat(retry.getStatus()).isEqualTo(LearningTaskAttemptStatus.IN_PROGRESS);
        assertThat(retry.getSourceAttemptId()).isEqualTo(sourceAttemptId);
        assertThat(retry.getPreviousAttemptId()).isEqualTo(open.getId());
        assertThat(retry.getAttemptId()).isNotEqualTo(open.getAttemptId());
    }

    @Test
    void twoSumAttemptEvidenceSelectsAndCompletesTheRelationTaskThenRetries() {
        var twoSum = problems.findBySlug("two-sum").orElseThrow();
        var source = attempts.start(twoSum.getId(), AttemptType.INITIAL);
        attempts.saveStage(source.getId(), StageType.PROBLEM_RELATION,
                new StageSaveCommand("pair sums to target", 1, null, null, null, null, null, null, java.util.Set.of()));
        attempts.complete(source.getId(), FinalResult.SOLVED_INDEPENDENTLY, PriorExposure.MEMORISED);

        assertThat(learning.cardFor(attempts.get(source.getId())).orElseThrow().task().templateId()).isEqualTo("two-sum-relation-first");
        var task = learning.start("two-sum-relation-first", source.getId());
        assertThat(learning.start("two-sum-relation-first", source.getId()).getId()).isEqualTo(task.getId());
        task.saveContract("i and j", "base", "subproblem", "composition", Instant.now());
        task.complete(Instant.now());
        taskAttempts.flush();

        assertThat(learning.cardFor(attempts.get(source.getId())).orElseThrow().task().templateId()).isEqualTo("movie-ticket-pair");
        assertThat(learning.cardFor(attempts.get(source.getId())).orElseThrow().status()).isEqualTo(LearningTaskAttemptStatus.NOT_STARTED);
        assertThat(learning.retry(task.getId()).getPreviousAttemptId()).isEqualTo(task.getId());
    }

    @Test
    void maximumDepthAttemptEvidenceSelectsAndCompletesTheErrorRepairTask() {
        var maximumDepth = problems.findBySlug("maximum-depth-of-binary-tree").orElseThrow();
        var source = attempts.start(maximumDepth.getId(), AttemptType.INITIAL);
        attempts.saveStage(source.getId(), StageType.REQUIRED_OPERATIONS,
                new StageSaveCommand("return max", 1, null, null, null, null, null, null, java.util.Set.of(RequiredOperation.OTHER)));
        attempts.complete(source.getId(), FinalResult.NOT_SOLVED, PriorExposure.SEEN_BUT_NOT_SOLVED);

        assertThat(learning.cardFor(attempts.get(source.getId())).orElseThrow().task().templateId()).isEqualTo("maximum-depth-error-repair");
        var task = learning.start("maximum-depth-error-repair", source.getId());
        task.saveContract("depth(node)", "null -> 0", "left/right", "1 + max", Instant.now());
        task.complete(Instant.now());
        taskAttempts.flush();

        assertThat(learning.taskAttempt(task.getId()).getStatus()).isEqualTo(LearningTaskAttemptStatus.COMPLETED);
        assertThat(learning.cardFor(attempts.get(source.getId())).orElseThrow().task().templateId()).isEqualTo("count-nodes-transfer");
    }

    @Test
    void doesNotCreateAPostAttemptTaskCardWhenThereIsNoApplicableEvidence() {
        var twoSum = problems.findBySlug("two-sum").orElseThrow();
        var source = attempts.start(twoSum.getId(), AttemptType.INITIAL);
        attempts.complete(source.getId(), FinalResult.NOT_SOLVED, PriorExposure.NEVER_SEEN);

        assertThat(learning.cardFor(attempts.get(source.getId()))).isEmpty();
    }
}
