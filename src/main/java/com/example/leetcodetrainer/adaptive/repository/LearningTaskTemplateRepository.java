package com.example.leetcodetrainer.adaptive.repository;
import com.example.leetcodetrainer.adaptive.domain.LearningTaskTemplate; import java.util.*; import org.springframework.data.jpa.repository.JpaRepository;
public interface LearningTaskTemplateRepository extends JpaRepository<LearningTaskTemplate, UUID> { Optional<LearningTaskTemplate> findByCodeAndActiveTrue(String code); List<LearningTaskTemplate> findByActiveTrueOrderByCodeAsc(); }
