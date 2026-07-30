package com.example.leetcodetrainer.attempt.service;

import com.example.leetcodetrainer.attempt.domain.*;
import com.example.leetcodetrainer.attempt.repository.AttemptRepository;
import com.example.leetcodetrainer.attempt.repository.StageAssessmentRepository;
import com.example.leetcodetrainer.hint.service.HintService;
import com.example.leetcodetrainer.referenceanswer.service.ReferenceAnswerService;
import com.example.leetcodetrainer.shared.domain.ResourceNotFoundException;
import java.time.Clock;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AttemptService {
    private final AttemptRepository attemptRepository;
    private final StageAssessmentRepository stageAssessmentRepository;
    private final Clock clock;
    private final HintService hintService;
    private final ReferenceAnswerService referenceAnswerService;
    private final AttemptQualityService qualityService;
    private final ApplicationEventPublisher eventPublisher;

    public AttemptService(AttemptRepository attemptRepository, StageAssessmentRepository stageAssessmentRepository, Clock clock,
                          HintService hintService, ReferenceAnswerService referenceAnswerService, AttemptQualityService qualityService, ApplicationEventPublisher eventPublisher) {
        this.attemptRepository = attemptRepository; this.stageAssessmentRepository = stageAssessmentRepository; this.clock = clock; this.hintService = hintService; this.referenceAnswerService = referenceAnswerService; this.qualityService = qualityService; this.eventPublisher = eventPublisher;
    }
    public Attempt start(UUID problemId, AttemptType type) {
        return start(problemId, type, null);
    }
    public Attempt startOrResumeInitial(UUID problemId) {
        return attemptRepository.findFirstByProblemIdAndStatusOrderByStartedAtDesc(problemId, AttemptStatus.IN_PROGRESS)
                .orElseGet(() -> start(problemId, AttemptType.INITIAL));
    }
    public Attempt start(UUID problemId, AttemptType type, UUID sourceReviewScheduleId) {
        Instant now = Instant.now(clock);
        Attempt attempt = attemptRepository.save(new Attempt(UUID.randomUUID(), problemId, type, sourceReviewScheduleId, now));
        stageAssessmentRepository.saveAll(StageType.ordered().stream()
                .map(stage -> new StageAssessment(UUID.randomUUID(), attempt.getId(), stage, now)).toList());
        return attempt;
    }
    @Transactional(readOnly = true)
    public Attempt get(UUID attemptId) { return attemptRepository.findById(attemptId).orElseThrow(() -> new ResourceNotFoundException("Attempt not found: " + attemptId)); }
    @Transactional(readOnly = true)
    public List<Attempt> historyForProblem(UUID problemId) { return attemptRepository.findByProblemIdOrderByStartedAtDesc(problemId); }
    @Transactional(readOnly = true)
    public Optional<Attempt> latestInProgress() { return attemptRepository.findFirstByStatusOrderByStartedAtDesc(AttemptStatus.IN_PROGRESS); }
    public StageAssessment currentStage(UUID attemptId) { return stage(attemptId, StageType.fromOrder(get(attemptId).getCurrentStageOrder()), true); }
    public StageAssessment stage(UUID attemptId, StageType stageType) { return stage(attemptId, stageType, true); }
    private StageAssessment stage(UUID attemptId, StageType stageType, boolean markStarted) {
        Attempt attempt = get(attemptId);
        if (attempt.getStatus() == AttemptStatus.ABANDONED) throw new IllegalStateException("中断した演習は再開できません。");
        StageAssessment assessment = stageAssessmentRepository.findByAttemptIdAndStageType(attemptId, stageType)
                .orElseThrow(() -> new ResourceNotFoundException("Stage assessment not found"));
        if (markStarted && attempt.getStatus() == AttemptStatus.IN_PROGRESS) assessment.markStarted(Instant.now(clock));
        return assessment;
    }
    @Transactional(readOnly = true)
    public List<StageAssessment> stages(UUID attemptId) {
        return stageAssessmentRepository.findByAttemptIdOrderByStageTypeAsc(attemptId).stream()
                .sorted(Comparator.comparingInt(value -> value.getStageType().getOrder())).toList();
    }
    public void saveStage(UUID attemptId, StageType stageType, StageSaveCommand command) {
        Attempt attempt = get(attemptId); requireInProgress(attempt);
        hintService.validateScore(attemptId, stageType, command.score());
        referenceAnswerService.validateScore(attemptId, stageType, command.score());
        StageAssessment assessment = stage(attemptId, stageType, true);
        assessment.save(command, Instant.now(clock));
    }
    public void moveTo(UUID attemptId, StageType stageType) { Attempt attempt = get(attemptId); requireInProgress(attempt); attempt.moveTo(stageType, Instant.now(clock)); }
    public void revealPattern(UUID attemptId) { get(attemptId).revealPattern(Instant.now(clock)); }
    public void saveImplementation(UUID attemptId, String language, String code, Integer compileErrors, Integer wrongAnswers,
                                   boolean timedOut, boolean implementationCompleted, boolean understoodButCouldNotImplement,
                                   boolean edgeCaseFailure, String externalSubmissionResult) {
        get(attemptId).saveImplementation(language, code, compileErrors, wrongAnswers, timedOut, implementationCompleted,
                understoodButCouldNotImplement, edgeCaseFailure, externalSubmissionResult, Instant.now(clock));
    }
    public void saveReflection(UUID attemptId, String independentStages, String hintNeededStages, String unknownStages,
                               String triggerSentence, String falseHypothesis, String newUnderstanding, String nextQuestion,
                               String emotion, String learningObstacle) {
        get(attemptId).saveReflection(independentStages, hintNeededStages, unknownStages, triggerSentence, falseHypothesis,
                newUnderstanding, nextQuestion, emotion, learningObstacle, Instant.now(clock));
    }
    public void complete(UUID attemptId, FinalResult result) {
        complete(attemptId, result, null);
    }
    public void complete(UUID attemptId, FinalResult result, PriorExposure priorExposure) {
        Attempt attempt = get(attemptId); requireInProgress(attempt);
        Instant now = Instant.now(clock);
        stages(attemptId).forEach(stage -> stage.markSkipped(now));
        if (priorExposure != null) attempt.setPriorExposure(priorExposure, now);
        attempt.complete(result, now);
        AttemptQuality quality=qualityService.assess(attempt, stages(attemptId));
        attempt.setQuality(quality.dataQualityStatus(), quality.analysisStatus(), now);
        if (eventPublisher != null) eventPublisher.publishEvent(new AttemptCompletedEvent(attempt.getId(), attempt.getProblemId(),
                attempt.getAttemptType(), attempt.getSourceReviewScheduleId(), attempt.getCompletedAt()));
    }
    public void quickAssess(UUID attemptId, java.util.Map<StageType, Integer> scores, java.util.Map<StageType, StageAssessmentStatus> statuses) {
        Attempt attempt=get(attemptId); if(attempt.getStatus()!=AttemptStatus.COMPLETED) throw new IllegalStateException("完了済みの演習だけをQuick Assessmentできます。");
        Instant now=Instant.now(clock);
        stages(attemptId).forEach(stage -> {
            StageAssessmentStatus status=statuses.getOrDefault(stage.getStageType(), StageAssessmentStatus.NOT_STARTED);
            Integer score=scores.get(stage.getStageType());
            if (status==StageAssessmentStatus.ASSESSED || score!=null) stage.setAssessmentStatus(StageAssessmentStatus.ASSESSED, score, now);
            else if(status==StageAssessmentStatus.SKIPPED||status==StageAssessmentStatus.NOT_APPLICABLE) stage.setAssessmentStatus(status,null,now);
        });
        AttemptQuality quality=qualityService.assess(attempt, stages(attemptId)); attempt.setQuality(quality.dataQualityStatus(),quality.analysisStatus(),now);
    }
    public void abandon(UUID attemptId) { get(attemptId).abandon(Instant.now(clock)); }
    private void requireInProgress(Attempt attempt) {
        if (attempt.getStatus() != AttemptStatus.IN_PROGRESS) throw new IllegalStateException("進行中の演習だけを操作できます。");
    }
}
