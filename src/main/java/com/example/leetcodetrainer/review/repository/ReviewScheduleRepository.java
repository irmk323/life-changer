package com.example.leetcodetrainer.review.repository;

import com.example.leetcodetrainer.review.domain.ReviewSchedule;
import com.example.leetcodetrainer.review.domain.ReviewType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewScheduleRepository extends JpaRepository<ReviewSchedule, UUID> {
    boolean existsBySourceAttemptIdAndReviewType(UUID sourceAttemptId, ReviewType reviewType);
    boolean existsBySourceAttemptIdAndReviewTypeAndFailureLabelId(UUID sourceAttemptId, ReviewType reviewType, UUID failureLabelId);
    Optional<ReviewSchedule> findByCompletionAttemptId(UUID completionAttemptId);
    Optional<ReviewSchedule> findByIdAndCompletionAttemptIdIsNull(UUID id);
    List<ReviewSchedule> findAllByOrderByScheduledDateAsc();
    List<ReviewSchedule> findByCompletionAttemptIdIn(java.util.Collection<UUID> completionAttemptIds);
    long countByAssignedProblemId(UUID assignedProblemId);
}
