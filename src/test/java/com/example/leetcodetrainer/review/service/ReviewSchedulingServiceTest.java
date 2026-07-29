package com.example.leetcodetrainer.review.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.example.leetcodetrainer.attempt.service.AttemptService;
import com.example.leetcodetrainer.pattern.domain.ProblemPattern;
import com.example.leetcodetrainer.pattern.repository.ProblemPatternRepository;
import com.example.leetcodetrainer.problem.domain.Difficulty;
import com.example.leetcodetrainer.problem.domain.NeetcodeCategory;
import com.example.leetcodetrainer.problem.domain.Problem;
import com.example.leetcodetrainer.problem.repository.ProblemRepository;
import com.example.leetcodetrainer.review.repository.ReviewScheduleRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ReviewSchedulingServiceTest {
    @Mock private ReviewScheduleRepository reviewRepository;
    @Mock private ProblemRepository problemRepository;
    @Mock private ProblemPatternRepository problemPatternRepository;
    @Mock private AttemptService attemptService;
    @Mock private ProblemPattern sourceAssociation;
    @Mock private ProblemPattern frequentAssociation;
    @Mock private ProblemPattern leastUsedAssociation;

    @Test
    void selectsTheLeastUsedActiveProblemWithTheSamePatternAndExcludesTheSource() {
        UUID patternId = UUID.randomUUID();
        Problem source = problem(1, true);
        Problem frequent = problem(2, true);
        Problem leastUsed = problem(3, true);
        Problem inactive = problem(4, false);
        ProblemPattern inactiveAssociation = org.mockito.Mockito.mock(ProblemPattern.class);
        when(sourceAssociation.getProblem()).thenReturn(source);
        when(frequentAssociation.getProblem()).thenReturn(frequent);
        when(leastUsedAssociation.getProblem()).thenReturn(leastUsed);
        when(inactiveAssociation.getProblem()).thenReturn(inactive);
        when(problemPatternRepository.findByPatternIdOrderByProblemLeetcodeNumberAsc(patternId))
                .thenReturn(List.of(sourceAssociation, frequentAssociation, leastUsedAssociation, inactiveAssociation));
        when(reviewRepository.countByAssignedProblemId(frequent.getId())).thenReturn(4L);
        when(reviewRepository.countByAssignedProblemId(leastUsed.getId())).thenReturn(1L);

        assertThat(service().selectIsomorphicCandidate(source.getId(), patternId)).isEqualTo(leastUsed.getId());
    }

    @Test
    void returnsNoAutomaticAssignmentWhenThereIsNoOtherActiveSamePatternProblem() {
        UUID patternId = UUID.randomUUID();
        Problem source = problem(1, true);
        when(sourceAssociation.getProblem()).thenReturn(source);
        when(problemPatternRepository.findByPatternIdOrderByProblemLeetcodeNumberAsc(patternId)).thenReturn(List.of(sourceAssociation));

        assertThat(service().selectIsomorphicCandidate(source.getId(), patternId)).isNull();
    }

    private ReviewSchedulingService service() {
        return new ReviewSchedulingService(reviewRepository, problemRepository, problemPatternRepository, attemptService,
                Clock.fixed(Instant.parse("2026-07-28T10:00:00Z"), ZoneId.of("Europe/London")), ZoneId.of("Europe/London"));
    }

    private Problem problem(int number, boolean active) {
        UUID id = UUID.randomUUID();
        Instant now = Instant.parse("2026-07-28T10:00:00Z");
        return new Problem(id, number, "Problem " + number, "problem-" + number, "https://example.test/" + number,
                Difficulty.EASY, NeetcodeCategory.ARRAYS_AND_HASHING, active, now, now);
    }
}
