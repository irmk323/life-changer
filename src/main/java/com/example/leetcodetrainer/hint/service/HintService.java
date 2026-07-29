package com.example.leetcodetrainer.hint.service;

import com.example.leetcodetrainer.attempt.domain.Attempt;
import com.example.leetcodetrainer.attempt.domain.AttemptStatus;
import com.example.leetcodetrainer.attempt.domain.StageAssessment;
import com.example.leetcodetrainer.attempt.domain.StageType;
import com.example.leetcodetrainer.attempt.repository.AttemptRepository;
import com.example.leetcodetrainer.attempt.repository.StageAssessmentRepository;
import com.example.leetcodetrainer.hint.domain.Hint;
import com.example.leetcodetrainer.hint.domain.HintProgress;
import com.example.leetcodetrainer.hint.domain.HintUsage;
import com.example.leetcodetrainer.hint.repository.HintRepository;
import com.example.leetcodetrainer.hint.repository.HintUsageRepository;
import com.example.leetcodetrainer.pattern.repository.ProblemPatternRepository;
import com.example.leetcodetrainer.shared.domain.ResourceNotFoundException;
import java.time.Clock;
import java.time.Instant;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class HintService {
    private final HintRepository hintRepository;
    private final HintUsageRepository hintUsageRepository;
    private final AttemptRepository attemptRepository;
    private final StageAssessmentRepository stageAssessmentRepository;
    private final ProblemPatternRepository problemPatternRepository;
    private final Clock clock;

    public HintService(HintRepository hintRepository, HintUsageRepository hintUsageRepository, AttemptRepository attemptRepository,
                       StageAssessmentRepository stageAssessmentRepository, ProblemPatternRepository problemPatternRepository, Clock clock) {
        this.hintRepository = hintRepository; this.hintUsageRepository = hintUsageRepository; this.attemptRepository = attemptRepository;
        this.stageAssessmentRepository = stageAssessmentRepository; this.problemPatternRepository = problemPatternRepository; this.clock = clock;
    }
    @Transactional(readOnly = true)
    public HintProgress progress(UUID attemptId, StageType stageType) {
        Attempt attempt = attempt(attemptId);
        List<Hint> candidates = candidates(attempt.getProblemId(), stageType);
        List<HintUsage> usages = hintUsageRepository.findByAttemptIdAndStageTypeOrderByHintLevelAscUsedAtAsc(attemptId, stageType);
        Set<UUID> usedIds = usages.stream().map(usage -> usage.getHint().getId()).collect(java.util.stream.Collectors.toSet());
        OptionalInt next = candidates.stream().mapToInt(Hint::getHintLevel).distinct().filter(level -> candidates.stream()
                .anyMatch(hint -> hint.getHintLevel() == level && !usedIds.contains(hint.getId()))).findFirst();
        return new HintProgress(usages, next);
    }
    public HintProgress revealNext(UUID attemptId, StageType stageType) {
        Attempt attempt = attempt(attemptId); requireInProgress(attempt);
        StageAssessment assessment = stageAssessmentRepository.findByAttemptIdAndStageType(attemptId, stageType)
                .orElseThrow(() -> new ResourceNotFoundException("Stage assessment not found"));
        List<Hint> candidates = candidates(attempt.getProblemId(), stageType);
        Set<UUID> usedIds = hintUsageRepository.findUsedHintIds(attemptId, candidates.stream().map(Hint::getId).toList()).stream().collect(java.util.stream.Collectors.toSet());
        OptionalInt next = candidates.stream().mapToInt(Hint::getHintLevel).distinct().filter(level -> candidates.stream()
                .anyMatch(hint -> hint.getHintLevel() == level && !usedIds.contains(hint.getId()))).findFirst();
        if (next.isEmpty()) throw new IllegalStateException("この工程で次に開示できるヒントはありません。");
        Instant now = Instant.now(clock);
        candidates.stream().filter(hint -> hint.getHintLevel() == next.getAsInt()).filter(hint -> !usedIds.contains(hint.getId()))
                .forEach(hint -> hintUsageRepository.save(new HintUsage(UUID.randomUUID(), attemptId, assessment.getId(), hint, now)));
        return progress(attemptId, stageType);
    }
    public void recordOutcome(UUID attemptId, UUID usageId, boolean helpedUserProceed, String userNote) {
        Attempt attempt = attempt(attemptId);
        if (attempt.getStatus() == AttemptStatus.ABANDONED) throw new IllegalStateException("中断した演習のヒント結果は更新できません。");
        HintUsage usage = hintUsageRepository.findById(usageId).filter(item -> item.getAttemptId().equals(attemptId))
                .orElseThrow(() -> new ResourceNotFoundException("Hint usage not found"));
        usage.recordOutcome(helpedUserProceed, userNote);
    }
    @Transactional(readOnly = true)
    public List<HintUsage> usagesForAttempt(UUID attemptId) { return hintUsageRepository.findByAttemptIdOrderByUsedAtAsc(attemptId); }
    @Transactional(readOnly = true)
    public int maxHintLevel(UUID attemptId, StageType stageType) { return Optional.ofNullable(hintUsageRepository.findMaxHintLevel(attemptId, stageType)).orElse(0); }
    public void validateScore(UUID attemptId, StageType stageType, Integer score) {
        if (score != null && score == 2 && maxHintLevel(attemptId, stageType) > 0)
            throw new IllegalArgumentException("ヒントを使った工程は2点（ヒントなしで自力）にはできません。1点または0点を選択してください。");
    }
    private List<Hint> candidates(UUID problemId, StageType stageType) {
        List<Hint> problemHints = hintRepository.findByProblemIdAndStageTypeAndActiveTrueOrderByHintLevelAscDisplayOrderAsc(problemId, stageType);
        List<UUID> patternIds = problemPatternRepository.findByProblemIdOrderByPrimaryPatternDesc(problemId).stream()
                .filter(association -> association.isPrimaryPattern()).map(association -> association.getPattern().getId()).toList();
        List<Hint> patternHints = patternIds.isEmpty() ? List.of() : hintRepository.findByPatternIdInAndStageTypeAndActiveTrueOrderByHintLevelAscDisplayOrderAsc(patternIds, stageType);
        Map<Integer, List<Hint>> byLevel = new TreeMap<>();
        problemHints.forEach(hint -> byLevel.computeIfAbsent(hint.getHintLevel(), ignored -> new ArrayList<>()).add(hint));
        patternHints.forEach(hint -> { if (!byLevel.containsKey(hint.getHintLevel())) byLevel.computeIfAbsent(hint.getHintLevel(), ignored -> new ArrayList<>()).add(hint); });
        return byLevel.values().stream().flatMap(List::stream).sorted(Comparator.comparingInt(Hint::getHintLevel).thenComparingInt(Hint::getDisplayOrder)).toList();
    }
    private Attempt attempt(UUID id) { return attemptRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Attempt not found: " + id)); }
    private void requireInProgress(Attempt attempt) { if (attempt.getStatus() != AttemptStatus.IN_PROGRESS) throw new IllegalStateException("進行中の演習だけでヒントを開示できます。"); }
}
