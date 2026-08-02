package com.example.leetcodetrainer.adaptive.domain;
import java.util.Set;
public record NextLearningTask(String templateId, LearningTaskType taskType, String title, String purpose, String successCriteria, Set<MicroSkill> targetSkills) { }
