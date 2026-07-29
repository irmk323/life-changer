package com.example.leetcodetrainer.failure.dto;
import com.example.leetcodetrainer.attempt.domain.*;
public record BottleneckEvidence(StageType stage, Integer score, int maxHintLevel, Long durationSeconds,
                                 FinalResult finalResult, long previousOccurrenceCount, String explanationKey) { }
