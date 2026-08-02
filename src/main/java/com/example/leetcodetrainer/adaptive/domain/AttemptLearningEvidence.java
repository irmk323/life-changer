package com.example.leetcodetrainer.adaptive.domain;
import com.example.leetcodetrainer.attempt.domain.*; import java.util.*;
public record AttemptLearningEvidence(UUID attemptId, String problemSlug, ReasoningProfileType profile, PriorExposure priorExposure, FinalResult finalResult, Map<MicroSkill,MicroSkillEvidence> microSkills, boolean transferMeasured, boolean discriminationMeasured, boolean retentionDue) { }
