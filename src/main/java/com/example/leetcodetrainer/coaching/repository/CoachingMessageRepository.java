package com.example.leetcodetrainer.coaching.repository;
import com.example.leetcodetrainer.coaching.domain.CoachingMessage; import java.util.*; import org.springframework.data.jpa.repository.JpaRepository;
public interface CoachingMessageRepository extends JpaRepository<CoachingMessage,UUID>{ List<CoachingMessage> findByAttemptIdOrderByGeneratedAtDesc(UUID attemptId); }
