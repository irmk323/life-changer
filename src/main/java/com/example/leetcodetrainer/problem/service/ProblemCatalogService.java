package com.example.leetcodetrainer.problem.service;

import com.example.leetcodetrainer.problem.domain.Difficulty;
import com.example.leetcodetrainer.problem.domain.Problem;
import com.example.leetcodetrainer.problem.domain.NeetcodeCategory;
import com.example.leetcodetrainer.problem.repository.ProblemRepository;
import com.example.leetcodetrainer.shared.domain.ResourceNotFoundException;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ProblemCatalogService {

    private final ProblemRepository problemRepository;

    public ProblemCatalogService(ProblemRepository problemRepository) {
        this.problemRepository = problemRepository;
    }

    public List<Problem> findProblems(Difficulty difficulty, NeetcodeCategory category, Boolean active) {
        boolean hasDifficulty = Objects.nonNull(difficulty);
        boolean hasCategory = Objects.nonNull(category);

        if (Boolean.FALSE.equals(active)) {
            return problemRepository.findAll().stream()
                    .filter(problem -> !problem.isActive())
                    .filter(problem -> !hasDifficulty || problem.getDifficulty() == difficulty)
                    .filter(problem -> !hasCategory || problem.getNeetcodeCategory() == category)
                    .sorted(java.util.Comparator.comparing(Problem::getLeetcodeNumber, java.util.Comparator.nullsLast(java.util.Comparator.naturalOrder())))
                    .toList();
        }

        if (hasDifficulty && hasCategory) {
            return problemRepository.findByActiveTrueAndDifficultyAndNeetcodeCategoryOrderByLeetcodeNumberAsc(
                    difficulty, category);
        }
        if (hasDifficulty) {
            return problemRepository.findByActiveTrueAndDifficultyOrderByLeetcodeNumberAsc(difficulty);
        }
        if (hasCategory) {
            return problemRepository.findByActiveTrueAndNeetcodeCategoryOrderByLeetcodeNumberAsc(category);
        }
        return problemRepository.findByActiveTrueOrderByLeetcodeNumberAsc();
    }

    public List<Problem> findActiveProblems(Difficulty difficulty, NeetcodeCategory category) {
        return findProblems(difficulty, category, true);
    }

    public Problem getProblem(UUID id) {
        return problemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Problem not found: " + id));
    }

    public List<NeetcodeCategory> findActiveCategories() {
        return problemRepository.findByActiveTrueOrderByLeetcodeNumberAsc().stream()
                .map(Problem::getNeetcodeCategory)
                .distinct()
                .sorted(java.util.Comparator.comparing(NeetcodeCategory::getDisplayName))
                .toList();
    }

    @Transactional
    public void markSolved(UUID id) {
        getProblem(id).markSolved();
    }

    @Transactional
    public void toggleSolved(UUID id) {
        getProblem(id).toggleSolved();
    }
}
