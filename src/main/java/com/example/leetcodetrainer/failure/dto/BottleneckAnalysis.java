package com.example.leetcodetrainer.failure.dto;
import java.util.List;
public record BottleneckAnalysis(List<BottleneckSuggestion> suggestions, BottleneckSuggestion primary) { }
