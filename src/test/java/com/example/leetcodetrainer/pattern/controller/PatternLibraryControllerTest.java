package com.example.leetcodetrainer.pattern.controller;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
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
class PatternLibraryControllerTest {
    @Autowired private MockMvc mockMvc;

    @Test
    void rendersPatternLibraryAndDetail() throws Exception {
        mockMvc.perform(get("/patterns")).andExpect(status().isOk()).andExpect(view().name("patterns/library"))
                .andExpect(content().string(containsString("Monotonic stack")));
        mockMvc.perform(get("/patterns/10000000-0000-0000-0000-000000000002")).andExpect(status().isOk())
                .andExpect(view().name("patterns/detail")).andExpect(content().string(containsString("Unresolved state")))
                .andExpect(content().string(containsString("Daily Temperatures")));
    }
}
