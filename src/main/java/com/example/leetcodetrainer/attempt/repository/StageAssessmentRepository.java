package com.example.leetcodetrainer.attempt.repository;

import com.example.leetcodetrainer.attempt.domain.StageAssessment;
import com.example.leetcodetrainer.attempt.domain.StageType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StageAssessmentRepository extends JpaRepository<StageAssessment, UUID> {
    List<StageAssessment> findByAttemptIdOrderByStageTypeAsc(UUID attemptId);
    Optional<StageAssessment> findByAttemptIdAndStageType(UUID attemptId, StageType stageType);
}
