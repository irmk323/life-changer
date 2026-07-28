package com.example.leetcodetrainer.problem.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.leetcodetrainer.problem.domain.Difficulty;
import com.example.leetcodetrainer.problem.repository.ProblemRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class ProblemCatalogServiceIntegrationTest {

    @Autowired
    private ProblemCatalogService problemCatalogService;

    @Autowired
    private ProblemRepository problemRepository;

    @Test
    void flywaySeedsTheEightProblemStarterCatalogue() {
        assertThat(problemRepository.count()).isEqualTo(8);
        assertThat(problemCatalogService.findActiveProblems(null, null)).hasSize(8);
        assertThat(problemCatalogService.findActiveCategories())
                .containsExactly("Arrays & Hashing", "Binary Search", "Graphs", "Linked List", "Sliding Window", "Stack", "Trees");
    }

    @Test
    void filtersByDifficultyAndCategory() {
        assertThat(problemCatalogService.findActiveProblems(Difficulty.EASY, null))
                .extracting(problem -> problem.getTitle())
                .containsExactly("Two Sum", "Valid Parentheses", "Maximum Depth of Binary Tree", "Best Time to Buy and Sell Stock", "Reverse Linked List");

        assertThat(problemCatalogService.findActiveProblems(null, "Stack"))
                .extracting(problem -> problem.getTitle())
                .containsExactly("Valid Parentheses", "Daily Temperatures");
    }
}
