package com.example.leetcodetrainer.failure.repository;
import com.example.leetcodetrainer.failure.domain.*;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
public interface FailureLabelRepository extends JpaRepository<FailureLabel, UUID> { Optional<FailureLabel> findByCode(FailureLabelCode code); List<FailureLabel> findByActiveTrueOrderByDisplayOrderAsc(); }
