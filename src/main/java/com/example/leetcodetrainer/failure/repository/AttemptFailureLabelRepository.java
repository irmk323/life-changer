package com.example.leetcodetrainer.failure.repository;
import com.example.leetcodetrainer.failure.domain.*;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
public interface AttemptFailureLabelRepository extends JpaRepository<AttemptFailureLabel, UUID> {
    @Query("select entry from AttemptFailureLabel entry join fetch entry.failureLabel where entry.attemptId = :attemptId order by entry.createdAt asc")
    List<AttemptFailureLabel> findByAttemptIdOrderByCreatedAtAsc(@Param("attemptId") UUID attemptId);
    Optional<AttemptFailureLabel> findByAttemptIdAndFailureLabelId(UUID attemptId, UUID failureLabelId);
    long countByFailureLabelIdAndConfirmedTrue(UUID failureLabelId);
    @Query("select entry from AttemptFailureLabel entry join fetch entry.failureLabel where entry.attemptId in :attemptIds and entry.confirmed = true")
    List<AttemptFailureLabel> findConfirmedByAttemptIdIn(@Param("attemptIds") Collection<UUID> attemptIds);
}
