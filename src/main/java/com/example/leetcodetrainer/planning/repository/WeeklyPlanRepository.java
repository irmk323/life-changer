package com.example.leetcodetrainer.planning.repository;
import com.example.leetcodetrainer.planning.domain.*;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
public interface WeeklyPlanRepository extends JpaRepository<WeeklyPlan, UUID> {
    Optional<WeeklyPlan> findFirstByStatusOrderByWeekStartDesc(WeeklyPlanStatus status);
}
