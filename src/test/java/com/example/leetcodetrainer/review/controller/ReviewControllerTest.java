package com.example.leetcodetrainer.review.controller;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.model;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.view;

import com.example.leetcodetrainer.attempt.domain.Attempt;
import com.example.leetcodetrainer.attempt.domain.AttemptType;
import com.example.leetcodetrainer.problem.service.ProblemCatalogService;
import com.example.leetcodetrainer.review.domain.ReviewQueueFilter;
import com.example.leetcodetrainer.review.domain.ReviewType;
import com.example.leetcodetrainer.review.service.ReviewSchedulingService;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(ReviewController.class)
class ReviewControllerTest {
    @Autowired private MockMvc mockMvc;
    @MockBean private ReviewSchedulingService reviewService;
    @MockBean private ProblemCatalogService problemCatalogService;

    @Test
    void rendersTheDueQueue() throws Exception {
        when(reviewService.queue(ReviewQueueFilter.DUE_TODAY, null)).thenReturn(List.of());
        mockMvc.perform(get("/reviews"))
                .andExpect(status().isOk()).andExpect(view().name("reviews/queue"))
                .andExpect(model().attributeExists("reviews", "filters", "types"));
    }

    @Test
    void startsTheReviewAttemptAndSupportsCancellation() throws Exception {
        UUID reviewId = UUID.randomUUID(); UUID problemId = UUID.randomUUID(); UUID attemptId = UUID.randomUUID();
        when(reviewService.startReview(reviewId)).thenReturn(new Attempt(attemptId, problemId, AttemptType.SAME_PROBLEM_REVIEW, Instant.now()));
        mockMvc.perform(post("/reviews/{id}/start", reviewId))
                .andExpect(status().is3xxRedirection()).andExpect(redirectedUrl("/attempts/" + attemptId + "/workspace"));
        mockMvc.perform(post("/reviews/{id}/cancel", reviewId)).andExpect(status().is3xxRedirection()).andExpect(redirectedUrl("/reviews/" + reviewId));
        verify(reviewService).cancel(reviewId);
    }
}
