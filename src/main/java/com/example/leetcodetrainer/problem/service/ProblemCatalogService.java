package com.example.leetcodetrainer.problem.service;

import com.example.leetcodetrainer.problem.domain.Difficulty;
import com.example.leetcodetrainer.problem.domain.Problem;
import com.example.leetcodetrainer.problem.repository.ProblemRepository;
import java.util.List;
import java.util.Objects;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ProblemCatalogService {

    private final ProblemRepository problemRepository;

    public ProblemCatalogService(ProblemRepository problemRepository) {
        this.problemRepository = problemRepository;
    }

    public List<Problem> findActiveProblems(Difficulty difficulty, String category) {
        boolean hasDifficulty = Objects.nonNull(difficulty);
        boolean hasCategory = category != null && !category.isBlank();

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

    public List<String> findActiveCategories() {
        return problemRepository.findByActiveTrueOrderByLeetcodeNumberAsc().stream()
                .map(Problem::getNeetcodeCategory)
                .distinct()
                .sorted()
                .toList();
    }
}
