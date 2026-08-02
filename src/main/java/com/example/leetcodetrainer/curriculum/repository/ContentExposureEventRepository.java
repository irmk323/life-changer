package com.example.leetcodetrainer.curriculum.repository;

import com.example.leetcodetrainer.curriculum.domain.ContentExposureEvent;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContentExposureEventRepository extends JpaRepository<ContentExposureEvent, UUID> {
    List<ContentExposureEvent> findByProblemIdOrderByExposedAtAsc(UUID problemId);
}
