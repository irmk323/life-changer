package com.example.leetcodetrainer.pattern.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.example.leetcodetrainer.pattern.repository.PatternRepository;
import com.example.leetcodetrainer.problem.repository.ProblemRepository;
import com.example.leetcodetrainer.shared.domain.ResourceNotFoundException;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class PatternCatalogServiceIntegrationTest {
    @Autowired private PatternCatalogService patternCatalogService;
    @Autowired private ProblemRepository problemRepository;
    @Autowired private PatternRepository patternRepository;

    @Test
    void dailyTemperaturesHasTheFullMonotonicStackSchema() {
        var pattern = patternRepository.findByCode("MONOTONIC_STACK").orElseThrow();
        assertThat(pattern.getUnresolvedState()).contains("waiting");
        assertThat(pattern.getUpdatedRegion()).contains("suffix");
        assertThat(pattern.getInvariantDescription()).contains("decrease");
        assertThat(pattern.getComplexityNotes()).contains("O(n)");
        assertThat(patternCatalogService.findProblemsForPattern(pattern.getId()))
                .extracting(association -> association.getProblem().getTitle())
                .contains("Daily Temperatures");
    }

    @Test
    void primaryPatternCanBeChangedAndDuplicateAssociationIsRejected() {
        var problem = problemRepository.findAll().stream().filter(item -> item.getSlug().equals("two-sum")).findFirst().orElseThrow();
        var binarySearch = patternRepository.findByCode("BINARY_SEARCH").orElseThrow();
        patternCatalogService.associate(problem.getId(), binarySearch.getId(), false, "Contrast-only association");
        patternCatalogService.setPrimaryPattern(problem.getId(), binarySearch.getId());
        assertThat(patternCatalogService.findPatternsForProblem(problem.getId()))
                .filteredOn(association -> association.isPrimaryPattern())
                .extracting(association -> association.getPattern().getCode()).containsExactly("BINARY_SEARCH");
        assertThatThrownBy(() -> patternCatalogService.associate(problem.getId(), binarySearch.getId(), false, null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void missingCatalogueRecordsAreExplicit() {
        UUID missingId = UUID.fromString("ffffffff-ffff-ffff-ffff-ffffffffffff");
        assertThatThrownBy(() -> patternCatalogService.getPattern(missingId)).isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> patternCatalogService.associate(missingId, patternRepository.findByCode("BINARY_SEARCH").orElseThrow().getId(), false, null))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
