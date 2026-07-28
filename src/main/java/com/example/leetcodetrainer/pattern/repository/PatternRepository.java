package com.example.leetcodetrainer.pattern.repository;

import com.example.leetcodetrainer.pattern.domain.Pattern;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatternRepository extends JpaRepository<Pattern, UUID> {
}
