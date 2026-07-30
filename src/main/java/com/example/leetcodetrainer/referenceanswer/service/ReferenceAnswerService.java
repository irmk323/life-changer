package com.example.leetcodetrainer.referenceanswer.service;

import com.example.leetcodetrainer.attempt.domain.*;
import com.example.leetcodetrainer.attempt.repository.AttemptRepository;
import com.example.leetcodetrainer.attempt.repository.StageAssessmentRepository;
import com.example.leetcodetrainer.referenceanswer.domain.*;
import com.example.leetcodetrainer.referenceanswer.repository.*;
import com.example.leetcodetrainer.shared.domain.ResourceNotFoundException;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ReferenceAnswerService {
    private final StageReferenceAnswerRepository answers; private final StageReferenceAnswerRevealRepository reveals; private final AttemptRepository attempts; private final StageAssessmentRepository assessments; private final Clock clock;
    public ReferenceAnswerService(StageReferenceAnswerRepository answers, StageReferenceAnswerRevealRepository reveals, AttemptRepository attempts, StageAssessmentRepository assessments, Clock clock) { this.answers=answers; this.reveals=reveals; this.attempts=attempts; this.assessments=assessments; this.clock=clock; }
    @Transactional(readOnly=true) public ReferenceAnswerStatus status(UUID attemptId, StageType stage) { Attempt attempt=attempt(attemptId); StageReferenceAnswer answer=answer(attempt.getProblemId(), stage); StageAssessment assessment=assessment(attemptId, stage); return new ReferenceAnswerStatus(true, reveals.existsByAttemptIdAndStageAssessmentId(attemptId, assessment.getId()), answer.getContentVersion()); }
    public StageReferenceAnswer reveal(UUID attemptId, StageType stage) { Attempt attempt=attempt(attemptId); if (attempt.getStatus()!=AttemptStatus.IN_PROGRESS) throw new IllegalStateException("進行中の演習だけで模範回答を表示できます。"); StageReferenceAnswer answer=answer(attempt.getProblemId(), stage); StageAssessment assessment=assessment(attemptId, stage); if (reveals.findByAttemptIdAndStageAssessmentIdAndContentVersion(attemptId, assessment.getId(), answer.getContentVersion()).isEmpty()) reveals.save(new StageReferenceAnswerReveal(UUID.randomUUID(), answer.getId(), attemptId, assessment.getId(), answer.getContentVersion(), Instant.now(clock))); return answer; }
    @Transactional(readOnly=true) public Optional<StageReferenceAnswer> revealedAnswer(UUID attemptId, StageType stage) { Attempt attempt=attempt(attemptId); StageReferenceAnswer answer=answer(attempt.getProblemId(),stage); return reveals.findByAttemptIdAndStageAssessmentIdAndContentVersion(attemptId, assessment(attemptId,stage).getId(),answer.getContentVersion()).isPresent()?Optional.of(answer):Optional.empty(); }
    @Transactional(readOnly=true) public List<StageReferenceAnswerReveal> revealsForAttempt(UUID attemptId) { return reveals.findByAttemptIdOrderByRevealedAtAsc(attemptId); }
    @Transactional(readOnly=true) public void validateScore(UUID attemptId, StageType stage, Integer score) { if (score!=null && score==2 && status(attemptId,stage).revealed()) throw new IllegalArgumentException("模範回答を表示した工程は2点（ヒントなしで自力）にはできません。1点または0点を選択してください。"); }
    @Transactional(readOnly=true) public ReferenceAnswerCoverage coverage(UUID problemId) { List<StageReferenceAnswer> values=answers.findByProblemIdAndActiveTrue(problemId); return new ReferenceAnswerCoverage(values.size(), values.stream().mapToInt(StageReferenceAnswer::getContentVersion).max().orElse(0), values.stream().sorted(Comparator.comparingInt(value->value.getStageType().getOrder())).map(value->value.getStageType().getDisplayName()).toList()); }
    @Transactional(readOnly=true) public int maxReferenceHintLevel(UUID attemptId, StageType stage) { return status(attemptId,stage).revealed()?5:0; }
    private Attempt attempt(UUID id){return attempts.findById(id).orElseThrow(()->new ResourceNotFoundException("Attempt not found: "+id));}
    private StageAssessment assessment(UUID id, StageType stage){return assessments.findByAttemptIdAndStageType(id,stage).orElseThrow(()->new ResourceNotFoundException("Stage assessment not found"));}
    private StageReferenceAnswer answer(UUID problemId,StageType stage){return answers.findByProblemIdAndStageTypeAndActiveTrue(problemId,stage).orElseThrow(()->new ResourceNotFoundException("この問題・工程の模範回答はありません。"));}
}
