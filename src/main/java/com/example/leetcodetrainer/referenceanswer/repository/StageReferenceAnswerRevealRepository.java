package com.example.leetcodetrainer.referenceanswer.repository;

import com.example.leetcodetrainer.referenceanswer.domain.StageReferenceAnswerReveal;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StageReferenceAnswerRevealRepository extends JpaRepository<StageReferenceAnswerReveal, UUID> {
    Optional<StageReferenceAnswerReveal> findByAttemptIdAndStageAssessmentIdAndContentVersion(UUID attemptId, UUID assessmentId, int contentVersion);
    List<StageReferenceAnswerReveal> findByAttemptIdOrderByRevealedAtAsc(UUID attemptId);
    boolean existsByAttemptIdAndStageAssessmentId(UUID attemptId, UUID assessmentId);
    List<StageReferenceAnswerReveal> findByAttemptIdIn(Collection<UUID> attemptIds);
}
