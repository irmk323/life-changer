package com.example.leetcodetrainer.hint.repository;

import com.example.leetcodetrainer.attempt.domain.StageType;
import com.example.leetcodetrainer.hint.domain.HintUsage;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface HintUsageRepository extends JpaRepository<HintUsage, UUID> {
    List<HintUsage> findByAttemptIdAndStageTypeOrderByHintLevelAscUsedAtAsc(UUID attemptId, StageType stageType);
    List<HintUsage> findByAttemptIdOrderByUsedAtAsc(UUID attemptId);
    List<HintUsage> findByAttemptIdInAndStageType(Collection<UUID> attemptIds, StageType stageType);
    Optional<HintUsage> findByAttemptIdAndHintId(UUID attemptId, UUID hintId);
    @Query("select max(usage.hintLevel) from HintUsage usage where usage.attemptId = :attemptId and usage.stageType = :stageType")
    Integer findMaxHintLevel(@Param("attemptId") UUID attemptId, @Param("stageType") StageType stageType);
    @Query("select usage.hint.id from HintUsage usage where usage.attemptId = :attemptId and usage.hint.id in :hintIds")
    List<UUID> findUsedHintIds(@Param("attemptId") UUID attemptId, @Param("hintIds") Collection<UUID> hintIds);
    @Query("select usage.attemptId, usage.stageType, max(usage.hintLevel) from HintUsage usage where usage.attemptId in :attemptIds group by usage.attemptId, usage.stageType")
    List<Object[]> findMaxHintLevelsByAttemptIds(@Param("attemptIds") Collection<UUID> attemptIds);
}
