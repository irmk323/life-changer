package com.example.leetcodetrainer.adaptive.domain;
import java.util.Optional;
public interface NextTaskSelector { Optional<NextLearningTask> select(AttemptLearningEvidence evidence); }
