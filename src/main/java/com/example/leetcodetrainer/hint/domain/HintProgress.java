package com.example.leetcodetrainer.hint.domain;

import java.util.List;
import java.util.OptionalInt;

public record HintProgress(List<HintUsage> revealedUsages, OptionalInt nextLevel) { }
