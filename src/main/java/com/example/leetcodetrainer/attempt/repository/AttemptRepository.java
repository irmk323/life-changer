package com.example.leetcodetrainer.attempt.repository;

import com.example.leetcodetrainer.attempt.domain.Attempt;
import java.util.List;
import java.util.UUID;
import com.example.leetcodetrainer.attempt.domain.AttemptStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttemptRepository extends JpaRepository<Attempt, UUID> {
    List<Attempt> findByProblemIdOrderByStartedAtDesc(UUID problemId);
    java.util.Optional<Attempt> findFirstByProblemIdAndStatusOrderByStartedAtDesc(UUID problemId, AttemptStatus status);
    List<Attempt> findByStatusOrderByCompletedAtDesc(AttemptStatus status);
    java.util.Optional<Attempt> findFirstByStatusOrderByStartedAtDesc(AttemptStatus status);
}
