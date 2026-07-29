package com.example.leetcodetrainer.coaching.domain;
import com.example.leetcodetrainer.attempt.domain.*; import com.example.leetcodetrainer.failure.dto.BottleneckAnalysis; import java.util.*;
public record CoachingContext(Attempt attempt, List<StageAssessment> stages, Map<StageType,Integer> maxHintLevels, BottleneckAnalysis analysis, List<Attempt> previousAttempts) { }
