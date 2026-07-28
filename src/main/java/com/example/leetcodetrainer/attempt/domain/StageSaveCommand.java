package com.example.leetcodetrainer.attempt.domain;

import java.util.Set;

public record StageSaveCommand(String answer, Integer score, String timeComplexity, String spaceComplexity, String trace,
                               UpdatedRegion updatedRegion, DataStructureOption dataStructure, String selectionReason,
                               Set<RequiredOperation> requiredOperations) { }
