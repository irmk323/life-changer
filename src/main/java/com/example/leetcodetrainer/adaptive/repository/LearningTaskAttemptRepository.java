package com.example.leetcodetrainer.adaptive.repository;
import com.example.leetcodetrainer.adaptive.domain.LearningTaskAttempt; import java.util.*; import org.springframework.data.jpa.repository.JpaRepository;
public interface LearningTaskAttemptRepository extends JpaRepository<LearningTaskAttempt,UUID>{ Optional<LearningTaskAttempt> findByAttemptId(UUID attemptId); Optional<LearningTaskAttempt> findFirstByTaskTemplateIdAndSourceAttemptIdAndStatus(UUID taskTemplateId, UUID sourceAttemptId, com.example.leetcodetrainer.adaptive.domain.LearningTaskAttemptStatus status); }
