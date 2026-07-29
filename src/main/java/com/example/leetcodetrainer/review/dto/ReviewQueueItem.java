package com.example.leetcodetrainer.review.dto;

import com.example.leetcodetrainer.problem.domain.Problem;
import com.example.leetcodetrainer.review.domain.ReviewSchedule;
import com.example.leetcodetrainer.review.domain.ReviewStatus;

public record ReviewQueueItem(ReviewSchedule schedule, Problem sourceProblem, Problem assignedProblem,
                              ReviewStatus effectiveStatus, long overdueDays) { }
