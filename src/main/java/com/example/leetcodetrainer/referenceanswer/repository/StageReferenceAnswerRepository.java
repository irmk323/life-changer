package com.example.leetcodetrainer.referenceanswer.repository;

import com.example.leetcodetrainer.attempt.domain.StageType;
import com.example.leetcodetrainer.referenceanswer.domain.StageReferenceAnswer;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StageReferenceAnswerRepository extends JpaRepository<StageReferenceAnswer, UUID> {
    Optional<StageReferenceAnswer> findByProblemIdAndStageTypeAndActiveTrue(UUID problemId, StageType stageType);
    Optional<StageReferenceAnswer> findByProblemIdAndStageType(UUID problemId, StageType stageType);
    List<StageReferenceAnswer> findByProblemIdAndActiveTrue(UUID problemId);
}
