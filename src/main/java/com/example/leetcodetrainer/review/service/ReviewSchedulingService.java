package com.example.leetcodetrainer.review.service;

import com.example.leetcodetrainer.attempt.domain.Attempt;
import com.example.leetcodetrainer.attempt.domain.AttemptCompletedEvent;
import com.example.leetcodetrainer.attempt.domain.AttemptType;
import com.example.leetcodetrainer.attempt.service.AttemptService;
import com.example.leetcodetrainer.pattern.domain.ProblemPattern;
import com.example.leetcodetrainer.pattern.repository.ProblemPatternRepository;
import com.example.leetcodetrainer.problem.domain.Problem;
import com.example.leetcodetrainer.problem.repository.ProblemRepository;
import com.example.leetcodetrainer.review.domain.*;
import com.example.leetcodetrainer.review.dto.ReviewQueueItem;
import com.example.leetcodetrainer.review.repository.ReviewScheduleRepository;
import com.example.leetcodetrainer.failure.domain.FailureLabel;
import com.example.leetcodetrainer.shared.domain.ResourceNotFoundException;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ReviewSchedulingService {
    private final ReviewScheduleRepository reviewRepository;
    private final ProblemRepository problemRepository;
    private final ProblemPatternRepository problemPatternRepository;
    private final AttemptService attemptService;
    private final Clock clock;
    private final ZoneId reviewZoneId;

    public ReviewSchedulingService(ReviewScheduleRepository reviewRepository, ProblemRepository problemRepository,
                                   ProblemPatternRepository problemPatternRepository, AttemptService attemptService,
                                   Clock clock, ZoneId reviewZoneId) {
        this.reviewRepository = reviewRepository; this.problemRepository = problemRepository; this.problemPatternRepository = problemPatternRepository;
        this.attemptService = attemptService; this.clock = clock; this.reviewZoneId = reviewZoneId;
    }
    @EventListener
    public void onAttemptCompleted(AttemptCompletedEvent event) {
        if (event.attemptType() == AttemptType.INITIAL) generateInitialReviews(event.attemptId(), event.problemId(), event.completedAt());
        if (event.sourceReviewScheduleId() != null) markCompleted(event.sourceReviewScheduleId(), event.attemptId(), event.completedAt());
    }
    public List<ReviewSchedule> generateInitialReviews(UUID sourceAttemptId, UUID sourceProblemId, Instant completedAt) {
        Problem source = problem(sourceProblemId);
        Map<ReviewType, LocalDate> dates = ReviewSchedulePolicy.initialDates(completedAt, reviewZoneId);
        return java.util.Arrays.stream(ReviewType.values()).filter(ReviewType::isInitialSequence).filter(type -> !reviewRepository.existsBySourceAttemptIdAndReviewType(sourceAttemptId, type))
                .map(type -> reviewRepository.save(newSchedule(sourceAttemptId, source, type, dates.get(type), completedAt))).toList();
    }
    @Transactional(readOnly = true)
    public List<ReviewQueueItem> queue(ReviewQueueFilter filter, ReviewType type) {
        LocalDate today = LocalDate.now(clock.withZone(reviewZoneId));
        return reviewRepository.findAllByOrderByScheduledDateAsc().stream()
                .map(schedule -> toQueueItem(schedule, today))
                .filter(item -> type == null || item.schedule().getReviewType() == type)
                .filter(item -> matches(item, filter == null ? ReviewQueueFilter.DUE_TODAY : filter))
                .toList();
    }
    @Transactional(readOnly = true)
    public ReviewQueueItem detail(UUID id) { return toQueueItem(get(id), LocalDate.now(clock.withZone(reviewZoneId))); }
    @Transactional(readOnly = true)
    public long dueTodayCount() { return queue(ReviewQueueFilter.DUE_TODAY, null).size(); }
    @Transactional(readOnly = true)
    public long overdueCount() { return queue(ReviewQueueFilter.OVERDUE, null).size(); }
    @Transactional(readOnly = true)
    public ReviewQueueItem nextReview() { return queue(ReviewQueueFilter.ALL, null).stream()
            .filter(item -> item.effectiveStatus() != ReviewStatus.COMPLETED && item.effectiveStatus() != ReviewStatus.CANCELLED)
            .min(Comparator.comparing(item -> item.schedule().getScheduledDate())).orElse(null); }
    public Attempt startReview(UUID reviewId) {
        ReviewSchedule schedule = get(idOrThrow(reviewId));
        if (schedule.effectiveStatus(LocalDate.now(clock.withZone(reviewZoneId))) == ReviewStatus.CANCELLED) throw new IllegalStateException("キャンセル済みの復習は開始できません。");
        if (schedule.getCompletionAttemptId() != null) throw new IllegalStateException("この復習はすでに完了しています。");
        UUID assigned = schedule.getAssignedProblemId();
        if (assigned == null) throw new IllegalStateException("この同型課題には手動で問題を割り当ててから開始してください。");
        problem(assigned);
        return attemptService.start(assigned, schedule.getReviewType().getAttemptType(), schedule.getId());
    }
    public void assignProblem(UUID reviewId, UUID problemId) { get(idOrThrow(reviewId)).assignProblem(problem(problemId).getId(), Instant.now(clock)); }
    public void reschedule(UUID reviewId, LocalDate date, String reason) {
        if (date == null) throw new IllegalArgumentException("新しい予定日を入力してください。");
        get(idOrThrow(reviewId)).reschedule(date, reason, Instant.now(clock));
    }
    public void cancel(UUID reviewId) { get(idOrThrow(reviewId)).cancel(Instant.now(clock)); }
    public ReviewSchedule createFollowUp(UUID reviewId, String reason) {
        ReviewSchedule completed = get(idOrThrow(reviewId));
        if (completed.getCompletionAttemptId() == null) throw new IllegalStateException("完了後に再確認を作成できます。");
        Instant now = Instant.now(clock);
        return reviewRepository.save(new ReviewSchedule(UUID.randomUUID(), completed.getCompletionAttemptId(), completed.getSourceProblemId(),
                completed.getAssignedProblemId(), completed.getPatternId(), completed.getReviewType(),
                LocalDate.now(clock.withZone(reviewZoneId)).plusDays(1), completed.getAssignmentNotes(), reason, now));
    }
    public ReviewSchedule createBottleneckReview(Attempt sourceAttempt, FailureLabel label) {
        if (reviewRepository.existsBySourceAttemptIdAndReviewTypeAndFailureLabelId(sourceAttempt.getId(), ReviewType.TARGETED_BOTTLENECK, label.getId()))
            throw new IllegalStateException("この工程の翌日再確認はすでに作成されています。");
        Instant now = Instant.now(clock); UUID patternId = primaryPatternId(sourceAttempt.getProblemId());
        return reviewRepository.save(new ReviewSchedule(UUID.randomUUID(), sourceAttempt.getId(), sourceAttempt.getProblemId(), sourceAttempt.getProblemId(), patternId, label.getId(),
                ReviewType.TARGETED_BOTTLENECK, LocalDate.now(clock.withZone(reviewZoneId)).plusDays(1),
                "確認したボトルネック「" + label.getDisplayName() + "」を再確認します。関連工程を特に具体的に記録してください。", label.getCode().name(), now));
    }
    private ReviewSchedule newSchedule(UUID sourceAttemptId, Problem source, ReviewType type, LocalDate date, Instant now) {
        UUID patternId = primaryPatternId(source.getId());
        UUID assigned = switch (type) {
            case RECONSTRUCTION, COLD_SOLVE -> source.getId();
            case ISOMORPHIC_TRANSFER -> selectIsomorphicCandidate(source.getId(), patternId);
            case CONTRAST_CLASSIFICATION, TARGETED_BOTTLENECK -> source.getId();
        };
        String notes = assignmentNotes(type, source, assigned);
        return new ReviewSchedule(UUID.randomUUID(), sourceAttemptId, source.getId(), assigned, patternId, type, date, notes, now);
    }
    UUID selectIsomorphicCandidate(UUID sourceProblemId, UUID patternId) {
        if (patternId == null) return null;
        return problemPatternRepository.findByPatternIdOrderByProblemLeetcodeNumberAsc(patternId).stream()
                .map(ProblemPattern::getProblem).filter(Problem::isActive).filter(problem -> !problem.getId().equals(sourceProblemId))
                .sorted(Comparator.<Problem>comparingLong(problem -> reviewRepository.countByAssignedProblemId(problem.getId()))
                        .thenComparing(Problem::getLeetcodeNumber, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(Problem::getId).findFirst().orElse(null);
    }
    private String assignmentNotes(ReviewType type, Problem source, UUID assignedId) {
        return switch (type) {
            case RECONSTRUCTION -> "コードの前に、関係・brute force・保持状態・状態の参照と更新・必要操作・データ構造・不変条件を自分の言葉で再構築してください。";
            case ISOMORPHIC_TRANSFER -> assignedId == null
                    ? "同じ構造を持つ見た目の異なる問題を手動で割り当ててください。回答前にはタグやパターン名を見ず、関係・状態・操作を説明します。"
                    : "問題名やタグからではなく、関係・保持状態・必要操作を根拠に、別の課題へ考え方を転用してください。";
            case CONTRAST_CLASSIFICATION -> "この問題と、問題一覧から選んだ似ている問題を比較します。各候補に必要なデータ構造、共通点、決定的な違い、判断理由をTRANSFER工程に記録してください。";
            case COLD_SOLVE -> "タグを見ずに、関係抽出から実装までを通して記録してください。タイマーは演習開始時から継続します。";
            case TARGETED_BOTTLENECK -> "確認した停止工程を、データ構造名やコードより前に自分の言葉で再構築してください。";
        };
    }
    private boolean matches(ReviewQueueItem item, ReviewQueueFilter filter) {
        return switch (filter) {
            case DUE_TODAY -> item.effectiveStatus() == ReviewStatus.DUE;
            case OVERDUE -> item.effectiveStatus() == ReviewStatus.MISSED;
            case UPCOMING -> item.effectiveStatus() == ReviewStatus.PENDING || item.effectiveStatus() == ReviewStatus.RESCHEDULED;
            case COMPLETED -> item.effectiveStatus() == ReviewStatus.COMPLETED;
            case ALL -> true;
        };
    }
    private ReviewQueueItem toQueueItem(ReviewSchedule schedule, LocalDate today) {
        ReviewStatus status = schedule.effectiveStatus(today);
        Problem source = problem(schedule.getSourceProblemId());
        Problem assigned = schedule.getAssignedProblemId() == null ? null : problem(schedule.getAssignedProblemId());
        long overdue = status == ReviewStatus.MISSED ? java.time.temporal.ChronoUnit.DAYS.between(schedule.getScheduledDate(), today) : 0;
        return new ReviewQueueItem(schedule, source, assigned, status, overdue);
    }
    private ReviewSchedule get(UUID id) { return reviewRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Review not found: " + id)); }
    private UUID idOrThrow(UUID id) { if (id == null) throw new IllegalArgumentException("Review id is required."); return id; }
    private Problem problem(UUID id) { return problemRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Problem not found: " + id)); }
    private UUID primaryPatternId(UUID problemId) { return problemPatternRepository.findByProblemIdOrderByPrimaryPatternDesc(problemId).stream().filter(ProblemPattern::isPrimaryPattern).map(association -> association.getPattern().getId()).findFirst().orElse(null); }
    private void markCompleted(UUID reviewId, UUID attemptId, Instant completedAt) { get(reviewId).complete(attemptId, completedAt); }
}
