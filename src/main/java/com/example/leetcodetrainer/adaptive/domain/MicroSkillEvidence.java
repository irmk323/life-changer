package com.example.leetcodetrainer.adaptive.domain;
import com.example.leetcodetrainer.attempt.domain.*;
public record MicroSkillEvidence(MicroSkill skill, StageOutcome outcome, AssistanceSource assistanceSource, Integer maxHintLevel, boolean answerPresent, int previousOccurrences) { }
