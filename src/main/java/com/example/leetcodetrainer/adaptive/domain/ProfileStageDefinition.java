package com.example.leetcodetrainer.adaptive.domain;
import com.example.leetcodetrainer.attempt.domain.StageType; import java.util.List;
public record ProfileStageDefinition(ReasoningProfileType profile, StageType canonicalStage, StageApplicability applicability, String displayName, String primaryQuestion, List<String> helperQuestions, int displayOrder) { }
