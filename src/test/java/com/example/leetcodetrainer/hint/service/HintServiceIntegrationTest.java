package com.example.leetcodetrainer.hint.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.example.leetcodetrainer.attempt.domain.*;
import com.example.leetcodetrainer.attempt.repository.AttemptRepository;
import com.example.leetcodetrainer.attempt.repository.StageAssessmentRepository;
import com.example.leetcodetrainer.attempt.service.AttemptService;
import com.example.leetcodetrainer.hint.domain.Hint;
import com.example.leetcodetrainer.hint.repository.HintRepository;
import com.example.leetcodetrainer.hint.repository.HintUsageRepository;
import com.example.leetcodetrainer.pattern.repository.PatternRepository;
import com.example.leetcodetrainer.problem.repository.ProblemRepository;
import com.example.leetcodetrainer.referenceanswer.repository.StageReferenceAnswerRevealRepository;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class HintServiceIntegrationTest {
    @Autowired private HintService hintService;
    @Autowired private AttemptService attemptService;
    @Autowired private AttemptRepository attemptRepository;
    @Autowired private StageAssessmentRepository stageAssessmentRepository;
    @Autowired private HintRepository hintRepository;
    @Autowired private HintUsageRepository hintUsageRepository;
    @Autowired private ProblemRepository problemRepository;
    @Autowired private PatternRepository patternRepository;
    @Autowired private StageReferenceAnswerRevealRepository referenceAnswerRevealRepository;

    @BeforeEach
    void cleanAttempts() { referenceAnswerRevealRepository.deleteAll(); stageAssessmentRepository.deleteAll(); attemptRepository.deleteAll(); }

    @Test
    void revealsOnlyTheNextAvailableLevelAndDoesNotCreateDuplicateUsage() {
        Attempt attempt = attemptService.start(dailyTemperaturesId(), AttemptType.INITIAL);
        assertThat(hintService.progress(attempt.getId(), StageType.PROBLEM_RELATION).nextLevel()).hasValue(1);

        hintService.revealNext(attempt.getId(), StageType.PROBLEM_RELATION);
        var afterLevelOne = hintService.progress(attempt.getId(), StageType.PROBLEM_RELATION);
        assertThat(afterLevelOne.revealedUsages()).extracting(usage -> usage.getHintLevel()).containsExactly(1);
        assertThat(afterLevelOne.nextLevel()).hasValue(2);

        hintService.revealNext(attempt.getId(), StageType.PROBLEM_RELATION);
        assertThat(hintService.progress(attempt.getId(), StageType.PROBLEM_RELATION).revealedUsages()).hasSize(2);
        assertThatThrownBy(() -> hintService.revealNext(attempt.getId(), StageType.PROBLEM_RELATION))
                .isInstanceOf(IllegalStateException.class);
        assertThat(hintUsageRepository.findByAttemptIdAndStageTypeOrderByHintLevelAscUsedAtAsc(attempt.getId(), StageType.PROBLEM_RELATION)).hasSize(2);
    }

    @Test
    void problemHintWinsAtTheSameLevelAndPatternHintFillsAMissingLevel() {
        Attempt daily = attemptService.start(dailyTemperaturesId(), AttemptType.INITIAL);
        hintService.revealNext(daily.getId(), StageType.REQUIRED_OPERATIONS);
        hintService.revealNext(daily.getId(), StageType.REQUIRED_OPERATIONS);
        assertThat(hintService.progress(daily.getId(), StageType.REQUIRED_OPERATIONS).revealedUsages().getFirst().getHint().getContent())
                .contains("データ構造名の前に");
        assertThat(hintService.progress(daily.getId(), StageType.REQUIRED_OPERATIONS).revealedUsages().getLast().getHint().getContent())
                .contains("最後を見る");

        var twoSum = problemRepository.findAll().stream().filter(problem -> problem.getSlug().equals("two-sum")).findFirst().orElseThrow();
        var hashLookup = patternRepository.findByCode("HASH_LOOKUP").orElseThrow();
        hintRepository.save(new Hint(UUID.randomUUID(), null, hashLookup.getId(), StageType.INVARIANT, 1,
                "共通 fallback の不変条件ヒント", 1, true, Instant.now()));
        Attempt fallback = attemptService.start(twoSum.getId(), AttemptType.INITIAL);
        hintService.revealNext(fallback.getId(), StageType.INVARIANT);
        assertThat(hintService.progress(fallback.getId(), StageType.INVARIANT).revealedUsages().getFirst().getHint().getContent())
                .isEqualTo("共通 fallback の不変条件ヒント");
    }

    @Test
    void hintedStageCannotBeScoredAsIndependentButLevelFiveMayBeOne() {
        Attempt attempt = attemptService.start(dailyTemperaturesId(), AttemptType.INITIAL);
        hintService.revealNext(attempt.getId(), StageType.PROBLEM_RELATION);
        assertThatThrownBy(() -> attemptService.saveStage(attempt.getId(), StageType.PROBLEM_RELATION,
                new StageSaveCommand("関係", 2, null, null, null, null, null, null, Set.of())))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("2点");

        for (int level = 1; level <= 5; level++) hintService.revealNext(attempt.getId(), StageType.IMPLEMENTATION);
        assertThat(hintService.maxHintLevel(attempt.getId(), StageType.IMPLEMENTATION)).isEqualTo(5);
        attemptService.saveStage(attempt.getId(), StageType.IMPLEMENTATION,
                new StageSaveCommand("擬似コードを説明できる", 1, null, null, null, null, null, null, Set.of()));
    }

    @Test
    void keepsHintUsageAndAllowsOutcomeToBeRecordedAfterCompletion() {
        Attempt attempt = attemptService.start(dailyTemperaturesId(), AttemptType.INITIAL);
        hintService.revealNext(attempt.getId(), StageType.PROBLEM_RELATION);
        UUID usageId = hintService.progress(attempt.getId(), StageType.PROBLEM_RELATION).revealedUsages().getFirst().getId();
        for (StageType stage : StageType.ordered()) {
            attemptService.saveStage(attempt.getId(), stage,
                    new StageSaveCommand("未回答として記録", 0, null, null, null, null, null, null, Set.of()));
        }
        attemptService.complete(attempt.getId(), FinalResult.NOT_SOLVED);
        hintService.recordOutcome(attempt.getId(), usageId, true, "関係を書き直せた");
        var usage = hintUsageRepository.findById(usageId).orElseThrow();
        assertThat(usage.getHelpedUserProceed()).isTrue();
        assertThat(usage.getUserNote()).isEqualTo("関係を書き直せた");
    }

    @Test
    void seedsProgressiveDailyHintsAndAtLeastOneHintForEveryMvpProblem() {
        var dailyRelation = hintRepository.findByProblemIdAndStageTypeAndActiveTrueOrderByHintLevelAscDisplayOrderAsc(
                dailyTemperaturesId(), StageType.PROBLEM_RELATION);
        assertThat(dailyRelation).extracting(Hint::getHintLevel).containsExactly(1, 2);
        assertThat(problemRepository.findByActiveTrueOrderByLeetcodeNumberAsc())
                .allSatisfy(problem -> assertThat(hintRepository.findAll().stream()
                        .anyMatch(hint -> problem.getId().equals(hint.getProblemId()))).isTrue());
    }

    @Test
    void importsOneSourceOfTruthHintForEveryCognitiveStage() {
        for (StageType stage : StageType.ordered()) {
            assertThat(hintRepository.findByProblemIdIsNullAndPatternIdIsNullAndStageTypeAndActiveTrueOrderByHintLevelAscDisplayOrderAsc(stage))
                    .hasSize(1)
                    .allSatisfy(hint -> assertThat(hint.getContent()).isNotBlank());
        }
    }

    @Test
    void seedsTwoSumStateAndKeyOperationHintsWithoutNamingHashMapTooEarly() {
        UUID twoSum = UUID.fromString("20000000-0000-0000-0000-000000000001");
        var stateHints = hintRepository.findByProblemIdAndStageTypeAndActiveTrueOrderByHintLevelAscDisplayOrderAsc(twoSum, StageType.UNRESOLVED_STATE);
        assertThat(stateHints).extracting(Hint::getHintLevel).containsExactly(1, 2, 3);
        assertThat(stateHints.stream().map(Hint::getContent)).noneMatch(content -> content.contains("HashMap") || content.contains("containsKey"));
        Attempt attempt = attemptService.start(twoSum, AttemptType.INITIAL);
        for (int level = 1; level <= 3; level++) hintService.revealNext(attempt.getId(), StageType.REQUIRED_OPERATIONS);
        assertThat(hintService.progress(attempt.getId(), StageType.REQUIRED_OPERATIONS).revealedUsages().getLast().getHint().getContent())
                .contains("index 取得");
    }

    private UUID dailyTemperaturesId() { return UUID.fromString("20000000-0000-0000-0000-000000000008"); }
}
