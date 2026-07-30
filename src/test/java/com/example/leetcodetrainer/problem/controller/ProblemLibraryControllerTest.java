package com.example.leetcodetrainer.problem.controller;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrlPattern;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.model;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.view;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ProblemLibraryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void rendersTheSeededLibrary() throws Exception {
        mockMvc.perform(get("/problems"))
                .andExpect(status().isOk())
                .andExpect(view().name("problems/library"))
                .andExpect(model().attributeExists("problems", "categories", "difficulties"))
                .andExpect(content().string(containsString("Daily Temperatures")))
                .andExpect(content().string(containsString("Arrays &amp; Hashing")));
    }

    @Test
    void appliesDifficultyFilter() throws Exception {
        mockMvc.perform(get("/problems").param("difficulty", "EASY"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Two Sum")))
                .andExpect(content().string(org.hamcrest.Matchers.not(containsString("Daily Temperatures"))));
    }

    @Test
    void opensTheProblemWorkspaceFromTheLegacyDetailUrl() throws Exception {
        mockMvc.perform(get("/problems/20000000-0000-0000-0000-000000000008"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrlPattern("/attempts/*/workspace"));
    }

    @Test
    void togglesAProblemSolvedStateFromTheLibrary() throws Exception {
        mockMvc.perform(post("/problems/20000000-0000-0000-0000-000000000001/toggle-solved"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/problems"));
        mockMvc.perform(get("/problems"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("solved")));

        mockMvc.perform(post("/problems/20000000-0000-0000-0000-000000000001/toggle-solved"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/problems"));
        mockMvc.perform(get("/problems"))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.not(containsString("class=\" solved\""))));
    }
}
