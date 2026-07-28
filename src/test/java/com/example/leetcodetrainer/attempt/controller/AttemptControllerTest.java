package com.example.leetcodetrainer.attempt.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.model;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.view;

import com.example.leetcodetrainer.attempt.domain.*;
import com.example.leetcodetrainer.attempt.service.AttemptService;
import com.example.leetcodetrainer.pattern.service.PatternCatalogService;
import com.example.leetcodetrainer.problem.domain.Difficulty;
import com.example.leetcodetrainer.problem.domain.NeetcodeCategory;
import com.example.leetcodetrainer.problem.domain.Problem;
import com.example.leetcodetrainer.problem.service.ProblemCatalogService;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AttemptController.class)
class AttemptControllerTest {
    @Autowired private MockMvc mvc;
    @MockBean private AttemptService attemptService;
    @MockBean private ProblemCatalogService problemCatalogService;
    @MockBean private PatternCatalogService patternCatalogService;
    private UUID problemId;
    private UUID attemptId;
    private Attempt attempt;

    @BeforeEach
    void setUp() {
        problemId = UUID.randomUUID(); attemptId = UUID.randomUUID();
        attempt = new Attempt(attemptId, problemId, AttemptType.INITIAL, Instant.now());
        Problem problem = new Problem(problemId, 1, "Two Sum", "two-sum", "https://example.test", Difficulty.EASY, NeetcodeCategory.ARRAYS_AND_HASHING, true, Instant.now(), Instant.now());
        when(problemCatalogService.getProblem(problemId)).thenReturn(problem);
        when(attemptService.get(attemptId)).thenReturn(attempt);
        when(attemptService.currentStage(attemptId)).thenReturn(new StageAssessment(UUID.randomUUID(), attemptId, StageType.PROBLEM_RELATION, Instant.now()));
        when(attemptService.stages(attemptId)).thenReturn(StageType.ordered().stream().map(stage -> new StageAssessment(UUID.randomUUID(), attemptId, stage, Instant.now())).toList());
    }

    @Test
    void startsInitialAttemptFromProblemDetail() throws Exception {
        when(attemptService.start(eq(problemId), eq(AttemptType.INITIAL))).thenReturn(attempt);
        mvc.perform(post("/problems/{id}/attempts", problemId))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/attempts/" + attemptId + "/workspace"));
    }

    @Test
    void showsWorkspaceWithoutPatternAssociationsInitially() throws Exception {
        mvc.perform(get("/attempts/{id}/workspace", attemptId))
                .andExpect(status().isOk())
                .andExpect(view().name("attempts/workspace"))
                .andExpect(model().attributeExists("current", "stages", "problem"))
                .andExpect(model().attributeDoesNotExist("associations"));
    }
}
