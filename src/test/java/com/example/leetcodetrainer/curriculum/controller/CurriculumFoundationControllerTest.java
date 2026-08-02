package com.example.leetcodetrainer.curriculum.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.model;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.view;

import com.example.leetcodetrainer.curriculum.service.CurriculumFoundationService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(CurriculumFoundationController.class)
class CurriculumFoundationControllerTest {
    @Autowired private MockMvc mvc;
    @MockBean private CurriculumFoundationService service;

    @Test
    void rendersReadOnlyFoundationCoverageWithoutReplacingTheAttemptFlow() throws Exception {
        when(service.skills()).thenReturn(List.of()); when(service.modes()).thenReturn(List.of());
        when(service.requirements()).thenReturn(List.of()); when(service.items()).thenReturn(List.of());
        when(service.exposures()).thenReturn(List.of()); when(service.sessions()).thenReturn(List.of());
        when(service.coverageByRole()).thenReturn(java.util.Map.of()); when(service.coverageByPattern()).thenReturn(java.util.Map.of());

        mvc.perform(get("/curriculum"))
                .andExpect(status().isOk()).andExpect(view().name("curriculum/coverage"))
                .andExpect(model().attributeExists("skills", "modes", "requirements", "items", "exposures", "sessions", "coverageByRole", "coverageByPattern"))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("現在の13工程Attemptフローは置き換えていません。")));
    }
}
