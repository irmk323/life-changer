package com.example.leetcodetrainer.adaptive.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.model;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.view;

import com.example.leetcodetrainer.adaptive.repository.LearningTaskTemplateRepository;
import com.example.leetcodetrainer.adaptive.domain.LearningTaskAttempt;
import com.example.leetcodetrainer.adaptive.domain.LearningTaskTemplate;
import com.example.leetcodetrainer.adaptive.domain.ReasoningProfileType;
import com.example.leetcodetrainer.adaptive.domain.StageApplicability;
import com.example.leetcodetrainer.adaptive.domain.LearningTaskAttemptStatus;
import com.example.leetcodetrainer.adaptive.domain.ProfileStageDefinition;
import com.example.leetcodetrainer.attempt.domain.StageType;
import com.example.leetcodetrainer.adaptive.service.AdaptiveLearningService;
import com.example.leetcodetrainer.adaptive.service.ReasoningProfileService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;
import java.util.Optional;
import java.util.UUID;
import static org.mockito.Mockito.mock;

@WebMvcTest(LearningTaskController.class)
class LearningTaskControllerTest {
    @Autowired private MockMvc mvc;
    @MockBean private LearningTaskTemplateRepository tasks;
    @MockBean private ReasoningProfileService profiles;
    @MockBean private AdaptiveLearningService learning;

    @Test
    void rendersTheReadOnlyTaskLibrary() throws Exception {
        when(tasks.findByActiveTrueOrderByCodeAsc()).thenReturn(List.of());

        mvc.perform(get("/learning-tasks"))
                .andExpect(status().isOk())
                .andExpect(view().name("learning-tasks/library"))
                .andExpect(model().attributeExists("tasks"))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Adaptive learning tasks")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("既存の13工程Attemptを置き換えるものではありません。")));
    }

    @Test
    void startsOrResumesTheSameTaskThroughTheWorkspaceRoute() throws Exception {
        UUID id = UUID.randomUUID();
        LearningTaskAttempt attempt = mock(LearningTaskAttempt.class);
        when(attempt.getId()).thenReturn(id);
        when(learning.start("maximum-depth-four-line-contract", null)).thenReturn(attempt);

        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/learning-tasks/{code}/start", "maximum-depth-four-line-contract"))
                .andExpect(status().is3xxRedirection())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl("/learning-task-attempts/" + id + "/workspace"));
    }

    @Test
    void rendersRequiredAndOptionalProfileStepsWithoutNotApplicableSteps() throws Exception {
        UUID id = UUID.randomUUID(); UUID taskId = UUID.randomUUID();
        LearningTaskAttempt taskAttempt = mock(LearningTaskAttempt.class);
        LearningTaskTemplate task = mock(LearningTaskTemplate.class);
        when(taskAttempt.getTaskTemplateId()).thenReturn(taskId);
        when(taskAttempt.getStatus()).thenReturn(LearningTaskAttemptStatus.IN_PROGRESS);
        when(learning.taskAttempt(id)).thenReturn(taskAttempt);
        when(tasks.findById(taskId)).thenReturn(Optional.of(task));
        when(task.getProfile()).thenReturn(ReasoningProfileType.RECURSIVE_DIVIDE_AND_COMBINE);
        when(profiles.stagesFor(ReasoningProfileType.RECURSIVE_DIVIDE_AND_COMBINE)).thenReturn(List.of(
                new ProfileStageDefinition(ReasoningProfileType.RECURSIVE_DIVIDE_AND_COMBINE, StageType.PROBLEM_RELATION, StageApplicability.REQUIRED, "契約", "返り値", List.of(), 1),
                new ProfileStageDefinition(ReasoningProfileType.RECURSIVE_DIVIDE_AND_COMBINE, StageType.BRUTE_FORCE, StageApplicability.OPTIONAL, "直接法", "", List.of(), 2),
                new ProfileStageDefinition(ReasoningProfileType.RECURSIVE_DIVIDE_AND_COMBINE, StageType.REPEATED_WORK, StageApplicability.NOT_APPLICABLE, "重複処理", "", List.of(), 3)));

        mvc.perform(get("/learning-task-attempts/{id}/workspace", id))
                .andExpect(status().isOk()).andExpect(view().name("learning-tasks/workspace"))
                .andExpect(model().attributeExists("requiredSteps", "optionalSteps"))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("必須の進行")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("任意の追加工程")))
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("重複処理"))));
    }

    @Test
    void returnsNotFoundForUnknownTaskAndTaskAttempt() throws Exception {
        when(tasks.findByCodeAndActiveTrue("missing")).thenReturn(Optional.empty());
        when(learning.taskAttempt(org.mockito.ArgumentMatchers.any())).thenThrow(new IllegalArgumentException("missing"));

        mvc.perform(get("/learning-tasks/missing")).andExpect(status().isNotFound());
        mvc.perform(get("/learning-task-attempts/{id}/workspace", UUID.randomUUID())).andExpect(status().isNotFound());
    }

    @Test
    void completedTaskWorkspaceIsReadOnlyAndOffersRetry() throws Exception {
        UUID id = UUID.randomUUID(); UUID taskId = UUID.randomUUID();
        LearningTaskAttempt taskAttempt = mock(LearningTaskAttempt.class); LearningTaskTemplate task = mock(LearningTaskTemplate.class);
        when(taskAttempt.getTaskTemplateId()).thenReturn(taskId); when(taskAttempt.getStatus()).thenReturn(LearningTaskAttemptStatus.COMPLETED);
        when(learning.taskAttempt(id)).thenReturn(taskAttempt); when(tasks.findById(taskId)).thenReturn(Optional.of(task));
        when(task.getProfile()).thenReturn(ReasoningProfileType.LOOKUP_STATE); when(profiles.stagesFor(ReasoningProfileType.LOOKUP_STATE)).thenReturn(List.of());

        mvc.perform(get("/learning-task-attempts/{id}/workspace", id)).andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("完了済み（read-only）")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("もう一度試す")));
    }
}
