package com.example.leetcodetrainer.attempt.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;

import com.example.leetcodetrainer.attempt.domain.*;
import com.example.leetcodetrainer.attempt.repository.AttemptRepository;
import com.example.leetcodetrainer.attempt.repository.StageAssessmentRepository;
import com.example.leetcodetrainer.problem.repository.ProblemRepository;
import com.example.leetcodetrainer.review.repository.ReviewScheduleRepository;
import com.example.leetcodetrainer.referenceanswer.repository.StageReferenceAnswerRevealRepository;
import com.example.leetcodetrainer.adaptive.repository.AttemptRecursiveContractRepository;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AttemptServiceIntegrationTest {
    @Autowired private AttemptService attemptService;
    @Autowired private AttemptRepository attemptRepository;
    @Autowired private StageAssessmentRepository stageAssessmentRepository;
    @Autowired private ProblemRepository problemRepository;
    @Autowired private MockMvc mockMvc;
    @Autowired private ReviewScheduleRepository reviewScheduleRepository;
    @Autowired private StageReferenceAnswerRevealRepository referenceAnswerRevealRepository;
    @Autowired private AttemptRecursiveContractRepository recursiveContracts;

    @BeforeEach
    void cleanAttempts() { reviewScheduleRepository.deleteAll(); referenceAnswerRevealRepository.deleteAll(); stageAssessmentRepository.deleteAll(); attemptRepository.deleteAll(); }

    @Test
    void startsWithThirteenDraftsAndKeepsUnvisitedStagesUnassessedWhenCompleted() {
        var problem = problemRepository.findByActiveTrueOrderByLeetcodeNumberAsc().getFirst();
        Attempt attempt = attemptService.start(problem.getId(), AttemptType.INITIAL);
        assertEquals(13, attemptService.stages(attempt.getId()).size());

        attemptService.saveStage(attempt.getId(), StageType.PROBLEM_RELATION,
                new StageSaveCommand("二要素の関係", null, null, null, null, null, null, null, Set.of()));
        assertEquals("二要素の関係", attemptService.stage(attempt.getId(), StageType.PROBLEM_RELATION).getAnswer());
        attemptService.complete(attempt.getId(), FinalResult.NOT_SOLVED);
        assertEquals(AttemptStatus.COMPLETED, attemptRepository.findById(attempt.getId()).orElseThrow().getStatus());
        assertEquals(null, attemptService.stage(attempt.getId(), StageType.BRUTE_FORCE).getScore());
        assertEquals(StageAssessmentStatus.NOT_STARTED, attemptService.stage(attempt.getId(), StageType.BRUTE_FORCE).getAssessmentStatus());

        Attempt fullyRecorded = attemptService.start(problem.getId(), AttemptType.INITIAL);

        for (StageType stage : StageType.ordered()) {
            StageSaveCommand command = switch (stage) {
                case UPDATED_REGION -> new StageSaveCommand("先頭を更新", 0, null, null, null, null, null, null, Set.of());
                case REQUIRED_OPERATIONS -> new StageSaveCommand("不明", 0, null, null, null, null, null, null, Set.of());
                case DATA_STRUCTURE_SELECTION -> new StageSaveCommand("不明", 0, null, null, null, null, null, null, Set.of());
                default -> new StageSaveCommand("回答", 2, null, null, null, null, null, null, Set.of());
            };
            attemptService.saveStage(fullyRecorded.getId(), stage, command);
        }
        attemptService.complete(fullyRecorded.getId(), FinalResult.PARTIALLY_SOLVED);
        assertEquals(AttemptStatus.COMPLETED, attemptRepository.findById(fullyRecorded.getId()).orElseThrow().getStatus());
        assertEquals(2, attemptService.historyForProblem(problem.getId()).size());
    }

    @Test
    void recursiveProfileMarksOnlyItsExplicitlyExcludedLegacyStagesNotApplicable() {
        var maximumDepth = problemRepository.findById(java.util.UUID.fromString("20000000-0000-0000-0000-000000000007")).orElseThrow();
        Attempt attempt = attemptService.start(maximumDepth.getId(), AttemptType.INITIAL);

        var stages = attemptService.stages(attempt.getId());
        assertEquals(StageAssessmentStatus.NOT_APPLICABLE, stages.stream().filter(s -> s.getStageType() == StageType.REPEATED_WORK).findFirst().orElseThrow().getAssessmentStatus());
        assertEquals(StageAssessmentStatus.NOT_APPLICABLE, stages.stream().filter(s -> s.getStageType() == StageType.DATA_STRUCTURE_SELECTION).findFirst().orElseThrow().getAssessmentStatus());
        assertEquals(StageAssessmentStatus.NOT_STARTED, stages.stream().filter(s -> s.getStageType() == StageType.PROBLEM_RELATION).findFirst().orElseThrow().getAssessmentStatus());
    }

    @Test
    void recursiveWorkspaceUsesProfileProgressAndRejectsNotApplicableNavigation() throws Exception {
        var maximumDepth = problemRepository.findById(java.util.UUID.fromString("20000000-0000-0000-0000-000000000007")).orElseThrow();
        Attempt attempt = attemptService.start(maximumDepth.getId(), AttemptType.INITIAL);

        mockMvc.perform(get("/attempts/{id}/workspace", attempt.getId()))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("再帰関数の契約")))
                .andExpect(content().string(containsString("1 / 10")))
                .andExpect(content().string(not(containsString("1 / 13"))));
        mockMvc.perform(get("/attempts/{id}/workspace", attempt.getId()).param("stage", StageType.REPEATED_WORK.name()))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/attempts/" + attempt.getId() + "/workspace"));
    }

    @Test
    void maximumDepthNormalAttemptSavesFourLineContractSeparatelyFromStageAnswer() throws Exception {
        var maximumDepth = problemRepository.findById(java.util.UUID.fromString("20000000-0000-0000-0000-000000000007")).orElseThrow();
        Attempt attempt = attemptService.start(maximumDepth.getId(), AttemptType.INITIAL);

        mockMvc.perform(get("/attempts/{id}/workspace", attempt.getId()))
                .andExpect(status().isOk()).andExpect(content().string(containsString("Four-line Contract")));
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/attempts/{id}/recursive-contract", attempt.getId())
                        .param("functionContract", "depth(node)").param("baseCase", "null -> 0")
                        .param("subproblems", "left and right").param("compositionRule", "1 + max"))
                .andExpect(status().is3xxRedirection());
        var contract=recursiveContracts.findById(attempt.getId()).orElseThrow();
        assertEquals("depth(node)",contract.getFunctionContract()); assertEquals("null -> 0",contract.getBaseCase());
        assertEquals("left and right",contract.getSubproblems()); assertEquals("1 + max",contract.getCompositionRule());
        assertEquals(null,attemptService.stage(attempt.getId(),StageType.PROBLEM_RELATION).getAnswer());
        mockMvc.perform(get("/attempts/{id}/workspace", attempt.getId()))
                .andExpect(status().isOk()).andExpect(content().string(containsString("depth(node)")))
                .andExpect(content().string(containsString("1 + max")));
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/attempts/{id}/recursive-contract", attempt.getId()))
                .andExpect(status().is3xxRedirection());
        var emptyDraft=recursiveContracts.findById(attempt.getId()).orElseThrow();
        assertEquals(null,emptyDraft.getFunctionContract()); assertEquals(null,emptyDraft.getCompositionRule());
    }

    @Test
    void quickAssessmentPreservesNotApplicableStagesAndLegacyThirteenStageRows() {
        var maximumDepth = problemRepository.findById(java.util.UUID.fromString("20000000-0000-0000-0000-000000000007")).orElseThrow();
        Attempt attempt = attemptService.start(maximumDepth.getId(), AttemptType.INITIAL);
        attemptService.complete(attempt.getId(), FinalResult.NOT_SOLVED);
        attemptService.quickAssess(attempt.getId(), java.util.Map.of(StageType.PROBLEM_RELATION, 1), java.util.Map.of(StageType.PROBLEM_RELATION, StageAssessmentStatus.ASSESSED));

        assertEquals(13, attemptService.stages(attempt.getId()).size());
        assertEquals(StageAssessmentStatus.NOT_APPLICABLE, attemptService.stages(attempt.getId()).stream().filter(s -> s.getStageType()==StageType.REPEATED_WORK).findFirst().orElseThrow().getAssessmentStatus());
        assertEquals(1, attemptService.stages(attempt.getId()).stream().filter(s -> s.getStageType()==StageType.PROBLEM_RELATION).findFirst().orElseThrow().getScore());
    }

    @Test
    void workspaceRendersTheCognitiveStageWithoutPatternNameAnswerChecking() throws Exception {
        var problem = problemRepository.findByActiveTrueOrderByLeetcodeNumberAsc().getFirst();
        Attempt attempt = attemptService.start(problem.getId(), AttemptType.INITIAL);

        mockMvc.perform(get("/attempts/{id}/workspace", attempt.getId()))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("問題の関係")))
                .andExpect(content().string(containsString("考えるためのヒント")))
                .andExpect(content().string(containsString("次に見られるヒント: レベル 1")))
                .andExpect(content().string(containsString("現在の必須工程")))
                .andExpect(content().string(not(containsString("パターン名を確認する"))))
                .andExpect(content().string(not(containsString("Hash Lookup"))));
    }

    @Test
    void completedAttemptShowsQuickAssessmentInsteadOfTreatingMissingStagesAsFailures() throws Exception {
        var problem = problemRepository.findByActiveTrueOrderByLeetcodeNumberAsc().getFirst();
        Attempt attempt = attemptService.start(problem.getId(), AttemptType.INITIAL);
        attemptService.complete(attempt.getId(), FinalResult.SOLVED_INDEPENDENTLY, PriorExposure.MEMORISED);

        mockMvc.perform(get("/attempts/{id}", attempt.getId()))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("工程別分析はまだ作成しません")))
                .andExpect(content().string(containsString("Quick Assessmentを始める")))
                .andExpect(content().string(not(containsString("まず見直したい候補"))));
        mockMvc.perform(get("/attempts/{id}/quick-assessment", attempt.getId()))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("未入力は失敗として扱いません")));
    }

    @Test
    void workspaceRendersRequiredOperationsStage() throws Exception {
        var problem = problemRepository.findByActiveTrueOrderByLeetcodeNumberAsc().getFirst();
        Attempt attempt = attemptService.start(problem.getId(), AttemptType.INITIAL);

        mockMvc.perform(get("/attempts/{id}/workspace", attempt.getId())
                        .param("stage", StageType.REQUIRED_OPERATIONS.name()))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("必要な操作")))
                .andExpect(content().string(containsString("先頭に追加")));
    }

    @Test
    void workspaceUsesGeneralizedStateQuestionsAndTwoSumTrace() throws Exception {
        var twoSum = problemRepository.findById(java.util.UUID.fromString("20000000-0000-0000-0000-000000000001")).orElseThrow();
        Attempt attempt = attemptService.start(twoSum.getId(), AttemptType.INITIAL);

        mockMvc.perform(get("/attempts/{id}/workspace", attempt.getId()).param("stage", StageType.UNRESOLVED_STATE.name()))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("保持する状態・未確定の候補")))
                .andExpect(content().string(containsString("今後の判断に必要な何を保持しますか？")))
                .andExpect(content().string(containsString("nums = [2, 7, 11, 15]")));
        mockMvc.perform(get("/attempts/{id}/workspace", attempt.getId()).param("stage", StageType.UPDATED_REGION.name()))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("状態の参照・更新対象")))
                .andExpect(content().string(containsString("特定の key に一致する要素")))
                .andExpect(content().string(containsString("参照:")));
    }
}
