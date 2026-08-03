package com.example.leetcodetrainer.attempt.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.model;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.view;

import com.example.leetcodetrainer.attempt.domain.*;
import com.example.leetcodetrainer.attempt.service.AttemptService;
import com.example.leetcodetrainer.pattern.service.PatternCatalogService;
import com.example.leetcodetrainer.hint.service.HintService;
import com.example.leetcodetrainer.hint.domain.HintProgress;
import com.example.leetcodetrainer.review.service.ReviewSchedulingService;
import com.example.leetcodetrainer.failure.service.FailureLabelService;
import com.example.leetcodetrainer.coaching.service.CoachingService;
import com.example.leetcodetrainer.problem.domain.Difficulty;
import com.example.leetcodetrainer.problem.domain.NeetcodeCategory;
import com.example.leetcodetrainer.problem.domain.Problem;
import com.example.leetcodetrainer.problem.service.ProblemCatalogService;
import com.example.leetcodetrainer.referenceanswer.service.ReferenceAnswerService;
import com.example.leetcodetrainer.postattempt.service.PostAttemptSummaryService;
import com.example.leetcodetrainer.implementation.service.ImplementationReliabilityService;
import com.example.leetcodetrainer.adaptive.service.AdaptiveLearningService;
import com.example.leetcodetrainer.adaptive.service.ReasoningProfileService;
import com.example.leetcodetrainer.adaptive.service.AttemptRecursiveContractService;
import com.example.leetcodetrainer.adaptive.domain.LearningTaskCard;
import com.example.leetcodetrainer.adaptive.domain.LearningTaskAttemptStatus;
import com.example.leetcodetrainer.adaptive.domain.LearningTaskType;
import com.example.leetcodetrainer.adaptive.domain.NextLearningTask;
import com.example.leetcodetrainer.attempt.service.AttemptQuality;
import com.example.leetcodetrainer.attempt.domain.AttemptAnalysisStatus;
import com.example.leetcodetrainer.attempt.domain.AttemptDataQualityStatus;
import com.example.leetcodetrainer.failure.dto.BottleneckAnalysis;
import com.example.leetcodetrainer.postattempt.service.PostAttemptSummary;
import java.time.Instant;
import java.util.List;
import java.util.OptionalInt;
import java.util.Optional;
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
    @MockBean private HintService hintService;
    @MockBean private ReviewSchedulingService reviewService;
    @MockBean private FailureLabelService failureLabelService;
    @MockBean private CoachingService coachingService;
    @MockBean private ReferenceAnswerService referenceAnswerService;
    @MockBean private PostAttemptSummaryService postAttemptSummaryService;
    @MockBean private ImplementationReliabilityService implementationReliabilityService;
    @MockBean private AdaptiveLearningService adaptiveLearningService;
    @MockBean private ReasoningProfileService reasoningProfileService;
    @MockBean private AttemptRecursiveContractService recursiveContracts;
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
        when(hintService.progress(eq(attemptId), any(StageType.class))).thenReturn(new HintProgress(List.of(), OptionalInt.of(1)));
        when(referenceAnswerService.status(eq(attemptId), any(StageType.class))).thenReturn(new com.example.leetcodetrainer.referenceanswer.service.ReferenceAnswerStatus(true, false, 1));
        when(referenceAnswerService.revealedAnswer(eq(attemptId), any(StageType.class))).thenReturn(Optional.empty());
        var profileService = new com.example.leetcodetrainer.adaptive.service.ReasoningProfileService();
        when(reasoningProfileService.profileForSlug("two-sum")).thenReturn(com.example.leetcodetrainer.adaptive.domain.ReasoningProfileType.LOOKUP_STATE);
        when(reasoningProfileService.stagesFor(com.example.leetcodetrainer.adaptive.domain.ReasoningProfileType.LOOKUP_STATE)).thenReturn(profileService.stagesFor(com.example.leetcodetrainer.adaptive.domain.ReasoningProfileType.LOOKUP_STATE));
        when(attemptService.historyForProblem(problemId)).thenReturn(List.of());
        when(adaptiveLearningService.taskForAttempt(attemptId)).thenReturn(Optional.empty());
        when(recursiveContracts.find(attemptId)).thenReturn(Optional.empty());
    }

    @Test
    void startsInitialAttemptFromProblemDetail() throws Exception {
        when(attemptService.startOrResumeInitial(problemId)).thenReturn(attempt);
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

    @Test
    void revealsTheNextHintThroughTheWorkspaceFlow() throws Exception {
        mvc.perform(post("/attempts/{id}/stages/{stage}/hints/next", attemptId, StageType.PROBLEM_RELATION))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/attempts/" + attemptId + "/workspace?stage=PROBLEM_RELATION"));
        verify(hintService).revealNext(attemptId, StageType.PROBLEM_RELATION);
    }

    @Test
    void rendersPostAttemptTaskCardAcrossNotStartedInProgressCompletedAndNextTaskStates() throws Exception {
        attempt.complete(FinalResult.NOT_SOLVED, Instant.now());
        NextLearningTask first = new NextLearningTask("two-sum-relation-first", LearningTaskType.MICRO_SKILL_DRILL,
                "Two Sum — Relation First", "関係を式へ変換する練習です。", "i != j", java.util.Set.of());
        NextLearningTask next = new NextLearningTask("movie-ticket-pair", LearningTaskType.ISOMORPHIC_TRANSFER,
                "Movie Ticket Pair", "別表現へ転用します。", "関係を説明する", java.util.Set.of());

        when(postAttemptSummaryService.summary(attempt)).thenReturn(summary(new LearningTaskCard(first, LearningTaskAttemptStatus.NOT_STARTED, null)));
        mvc.perform(get("/attempts/{id}", attemptId)).andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("この課題を始める")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("/learning-tasks/two-sum-relation-first/start")));

        UUID taskAttemptId = UUID.randomUUID();
        when(postAttemptSummaryService.summary(attempt)).thenReturn(summary(new LearningTaskCard(first, LearningTaskAttemptStatus.IN_PROGRESS, taskAttemptId)));
        mvc.perform(get("/attempts/{id}", attemptId)).andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("続きから再開")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("/learning-task-attempts/" + taskAttemptId + "/workspace")));

        when(postAttemptSummaryService.summary(attempt)).thenReturn(summary(new LearningTaskCard(first, LearningTaskAttemptStatus.COMPLETED, taskAttemptId)));
        mvc.perform(get("/attempts/{id}", attemptId)).andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("結果を見る")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("もう一度試す")));

        when(postAttemptSummaryService.summary(attempt)).thenReturn(summary(new LearningTaskCard(next, LearningTaskAttemptStatus.NOT_STARTED, null)));
        mvc.perform(get("/attempts/{id}", attemptId)).andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Movie Ticket Pair")))
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("Two Sum — Relation First"))));
    }

    @Test
    void doesNotRenderLearningTaskCardWhenPostAttemptEvidenceIsInsufficient() throws Exception {
        attempt.complete(FinalResult.NOT_SOLVED, Instant.now());
        when(postAttemptSummaryService.summary(attempt)).thenReturn(summary(null));

        mvc.perform(get("/attempts/{id}", attemptId)).andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("この課題を始める"))))
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("続きから再開"))));
    }

    private PostAttemptSummary summary(LearningTaskCard card) {
        AttemptQuality quality = new AttemptQuality(AttemptDataQualityStatus.VALID, AttemptAnalysisStatus.READY, 1, 0, false, false);
        return new PostAttemptSummary("記録完了", "説明", "0秒", false, quality, List.of(), List.of(), List.of(), "次へ", new BottleneckAnalysis(List.of(), null), card == null ? null : card.task(), card);
    }
}
