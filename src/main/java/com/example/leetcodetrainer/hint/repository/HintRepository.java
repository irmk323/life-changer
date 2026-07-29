package com.example.leetcodetrainer.hint.repository;

import com.example.leetcodetrainer.attempt.domain.StageType;
import com.example.leetcodetrainer.hint.domain.Hint;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HintRepository extends JpaRepository<Hint, UUID> {
    List<Hint> findByProblemIdAndStageTypeAndActiveTrueOrderByHintLevelAscDisplayOrderAsc(UUID problemId, StageType stageType);
    List<Hint> findByPatternIdInAndStageTypeAndActiveTrueOrderByHintLevelAscDisplayOrderAsc(Collection<UUID> patternIds, StageType stageType);
}
