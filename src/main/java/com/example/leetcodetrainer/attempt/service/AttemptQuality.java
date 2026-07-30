package com.example.leetcodetrainer.attempt.service;

import com.example.leetcodetrainer.attempt.domain.AttemptAnalysisStatus;
import com.example.leetcodetrainer.attempt.domain.AttemptDataQualityStatus;

public record AttemptQuality(AttemptDataQualityStatus dataQualityStatus, AttemptAnalysisStatus analysisStatus,
                             int assessedCount, int unassessedCount, boolean legacyAmbiguous, boolean contradictory) {
    public boolean analysisAllowed() { return analysisStatus == AttemptAnalysisStatus.READY; }
}
