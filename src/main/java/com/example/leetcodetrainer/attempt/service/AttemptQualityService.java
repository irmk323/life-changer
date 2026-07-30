package com.example.leetcodetrainer.attempt.service;

import com.example.leetcodetrainer.attempt.domain.*;
import com.example.leetcodetrainer.hint.repository.HintUsageRepository;
import com.example.leetcodetrainer.referenceanswer.repository.StageReferenceAnswerRevealRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AttemptQualityService {
    private final HintUsageRepository hints;
    private final StageReferenceAnswerRevealRepository reveals;
    public AttemptQualityService(HintUsageRepository hints, StageReferenceAnswerRevealRepository reveals) { this.hints=hints; this.reveals=reveals; }

    public AttemptQuality assess(Attempt attempt, List<StageAssessment> stages) {
        int applicable=(int) stages.stream().filter(s -> s.getAssessmentStatus()!=StageAssessmentStatus.NOT_APPLICABLE).count();
        int ambiguous=(int) stages.stream().filter(s -> isLegacyAmbiguous(attempt, s)).count();
        int assessed=(int) stages.stream().filter(s -> s.getAssessmentStatus()==StageAssessmentStatus.ASSESSED && !isLegacyAmbiguous(attempt,s)).count();
        int unassessed=applicable-assessed-(int)stages.stream().filter(s -> s.getAssessmentStatus()==StageAssessmentStatus.SKIPPED).count();
        boolean contradictory=attempt.getFinalResult()==FinalResult.SOLVED_INDEPENDENTLY && assessed>0
                && stages.stream().filter(s -> s.getAssessmentStatus()==StageAssessmentStatus.ASSESSED && !isLegacyAmbiguous(attempt,s)).allMatch(s -> s.getScore()!=null && s.getScore()==0);
        if (ambiguous > 0) return new AttemptQuality(AttemptDataQualityStatus.LEGACY_AMBIGUOUS, AttemptAnalysisStatus.USER_REVIEW_REQUIRED, assessed, unassessed, true, contradictory);
        if (contradictory) return new AttemptQuality(AttemptDataQualityStatus.CONTRADICTORY_RESULT, AttemptAnalysisStatus.USER_REVIEW_REQUIRED, assessed, unassessed, false, true);
        if (assessed < 3 || (applicable > 0 && unassessed * 2 >= applicable)) return new AttemptQuality(AttemptDataQualityStatus.MISSING_STAGE_ASSESSMENTS, AttemptAnalysisStatus.INSUFFICIENT_DATA, assessed, unassessed, false, false);
        return new AttemptQuality(AttemptDataQualityStatus.VALID, AttemptAnalysisStatus.READY, assessed, unassessed, false, false);
    }

    /** Pre-Phase-10 completion wrote a synthetic zero with no learner interaction. */
    public boolean isLegacyAmbiguous(Attempt attempt, StageAssessment stage) {
        return stage.getAssessmentStatus() == StageAssessmentStatus.NOT_STARTED && Integer.valueOf(0).equals(stage.getScore())
                && blank(stage.getAnswer()) && stage.getDurationSeconds()!=null && stage.getDurationSeconds() <= 1
                && hints.findMaxHintLevel(attempt.getId(), stage.getStageType()) == null
                && !reveals.existsByAttemptIdAndStageAssessmentId(attempt.getId(), stage.getId());
    }
    private boolean blank(String value) { return value == null || value.isBlank(); }
}
