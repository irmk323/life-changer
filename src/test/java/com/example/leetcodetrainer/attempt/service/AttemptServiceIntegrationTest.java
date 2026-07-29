package com.example.leetcodetrainer.attempt.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.leetcodetrainer.attempt.domain.*;
import com.example.leetcodetrainer.attempt.repository.AttemptRepository;
import com.example.leetcodetrainer.attempt.repository.StageAssessmentRepository;
import com.example.leetcodetrainer.problem.repository.ProblemRepository;
import com.example.leetcodetrainer.review.repository.ReviewScheduleRepository;
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

    @BeforeEach
    void cleanAttempts() { reviewScheduleRepository.deleteAll(); stageAssessmentRepository.deleteAll(); attemptRepository.deleteAll(); }

    @Test
    void startsWithThirteenDraftsAndRecordsUnvisitedStagesAsZeroWhenCompleted() {
        var problem = problemRepository.findByActiveTrueOrderByLeetcodeNumberAsc().getFirst();
        Attempt attempt = attemptService.start(problem.getId(), AttemptType.INITIAL);
        assertEquals(13, attemptService.stages(attempt.getId()).size());

        attemptService.saveStage(attempt.getId(), StageType.PROBLEM_RELATION,
                new StageSaveCommand("二要素の関係", null, null, null, null, null, null, null, Set.of()));
        assertEquals("二要素の関係", attemptService.stage(attempt.getId(), StageType.PROBLEM_RELATION).getAnswer());
        attemptService.complete(attempt.getId(), FinalResult.NOT_SOLVED);
        assertEquals(AttemptStatus.COMPLETED, attemptRepository.findById(attempt.getId()).orElseThrow().getStatus());
        assertEquals(0, attemptService.stage(attempt.getId(), StageType.BRUTE_FORCE).getScore());

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
    void workspaceRendersTheCognitiveStageAndHidesPatternNamesInitially() throws Exception {
        var problem = problemRepository.findByActiveTrueOrderByLeetcodeNumberAsc().getFirst();
        Attempt attempt = attemptService.start(problem.getId(), AttemptType.INITIAL);

        mockMvc.perform(get("/attempts/{id}/workspace", attempt.getId()))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("問題の関係")))
                .andExpect(content().string(containsString("考えるためのヒント")))
                .andExpect(content().string(containsString("次に見られるヒント: レベル 1")))
                .andExpect(content().string(containsString("パターン名を確認する")))
                .andExpect(content().string(not(containsString("Hash Lookup"))));
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
