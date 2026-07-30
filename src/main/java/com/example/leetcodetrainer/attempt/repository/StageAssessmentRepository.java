package com.example.leetcodetrainer.attempt.repository;

import com.example.leetcodetrainer.attempt.domain.StageAssessment;
import com.example.leetcodetrainer.attempt.domain.StageType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.Collection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

public interface StageAssessmentRepository extends JpaRepository<StageAssessment, UUID> {
    List<StageAssessment> findByAttemptIdOrderByStageTypeAsc(UUID attemptId);
    @EntityGraph(attributePaths = "requiredOperations")
    Optional<StageAssessment> findByAttemptIdAndStageType(UUID attemptId, StageType stageType);
    List<StageAssessment> findByAttemptIdIn(Collection<UUID> attemptIds);
    List<StageAssessment> findByAttemptIdInAndStageType(Collection<UUID> attemptIds, StageType stageType);
}
