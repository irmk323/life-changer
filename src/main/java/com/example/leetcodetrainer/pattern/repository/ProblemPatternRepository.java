package com.example.leetcodetrainer.pattern.repository;

import com.example.leetcodetrainer.pattern.domain.ProblemPattern;
import com.example.leetcodetrainer.pattern.domain.ProblemPatternId;
import java.util.List;
import java.util.Collection;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProblemPatternRepository extends JpaRepository<ProblemPattern, ProblemPatternId> {
    List<ProblemPattern> findByProblemIdOrderByPrimaryPatternDesc(UUID problemId);
    List<ProblemPattern> findByPatternIdOrderByProblemLeetcodeNumberAsc(UUID patternId);
    boolean existsByProblemIdAndPatternId(UUID problemId, UUID patternId);

    @Query("select association.problem.id, association.pattern.name from ProblemPattern association "
            + "where association.primaryPattern = true and association.problem.id in :problemIds")
    List<Object[]> findPrimaryPatternNames(@Param("problemIds") Collection<UUID> problemIds);

    @Query("select association.pattern.id, count(association) from ProblemPattern association "
            + "where association.pattern.id in :patternIds group by association.pattern.id")
    List<Object[]> countByPatternIds(@Param("patternIds") Collection<UUID> patternIds);
}
