package com.example.leetcodetrainer.failure.dto;
import com.example.leetcodetrainer.failure.domain.*;
public record BottleneckSuggestion(FailureLabel label, FailureSeverity severity, BottleneckEvidence evidence, int heuristicScore) { }
