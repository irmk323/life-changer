package com.example.leetcodetrainer.problem.repository;

import com.example.leetcodetrainer.problem.domain.Difficulty;
import com.example.leetcodetrainer.problem.domain.NeetcodeCategory;
import com.example.leetcodetrainer.problem.domain.Problem;
import java.util.List;
import java.util.UUID;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProblemRepository extends JpaRepository<Problem, UUID> {
    Optional<Problem> findBySlug(String slug);
    List<Problem> findByActiveTrueOrderByLeetcodeNumberAsc();

    List<Problem> findByActiveTrueAndDifficultyOrderByLeetcodeNumberAsc(Difficulty difficulty);

    List<Problem> findByActiveTrueAndNeetcodeCategoryOrderByLeetcodeNumberAsc(NeetcodeCategory neetcodeCategory);

    List<Problem> findByActiveTrueAndDifficultyAndNeetcodeCategoryOrderByLeetcodeNumberAsc(
            Difficulty difficulty, NeetcodeCategory neetcodeCategory);
}
