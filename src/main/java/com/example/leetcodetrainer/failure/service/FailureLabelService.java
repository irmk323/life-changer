package com.example.leetcodetrainer.failure.service;

import com.example.leetcodetrainer.attempt.domain.*;
import com.example.leetcodetrainer.attempt.repository.AttemptRepository;
import com.example.leetcodetrainer.failure.domain.*;
import com.example.leetcodetrainer.failure.dto.*;
import com.example.leetcodetrainer.failure.repository.*;
import com.example.leetcodetrainer.review.service.ReviewSchedulingService;
import com.example.leetcodetrainer.shared.domain.ResourceNotFoundException;
import java.time.*;
import java.util.*;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class FailureLabelService {
    private final AttemptRepository attempts; private final FailureLabelRepository labels; private final AttemptFailureLabelRepository attemptLabels;
    private final BottleneckAnalysisService analysis; private final ReviewSchedulingService reviews; private final Clock clock;
    public FailureLabelService(AttemptRepository attempts, FailureLabelRepository labels, AttemptFailureLabelRepository attemptLabels, BottleneckAnalysisService analysis, ReviewSchedulingService reviews, Clock clock) { this.attempts=attempts; this.labels=labels; this.attemptLabels=attemptLabels; this.analysis=analysis; this.reviews=reviews; this.clock=clock; }
    @EventListener public void onAttemptCompleted(AttemptCompletedEvent event) { suggest(event.attemptId()); }
    public List<AttemptFailureLabel> suggest(UUID attemptId) {
        Instant now=Instant.now(clock); BottleneckAnalysis result=analysis.analyze(attemptId);
        for (BottleneckSuggestion suggestion: result.suggestions()) if (attemptLabels.findByAttemptIdAndFailureLabelId(attemptId,suggestion.label().getId()).isEmpty())
            attemptLabels.save(new AttemptFailureLabel(UUID.randomUUID(),attemptId,suggestion.label(),suggestion.severity(),FailureLabelSource.SYSTEM_SUGGESTED,false,null,now));
        return entries(attemptId);
    }
    @Transactional(readOnly=true) public List<AttemptFailureLabel> entries(UUID attemptId){return attemptLabels.findByAttemptIdOrderByCreatedAtAsc(attemptId);}
    @Transactional(readOnly=true) public List<FailureLabel> activeLabels(){return labels.findByActiveTrueOrderByDisplayOrderAsc();}
    @Transactional(readOnly=true) public BottleneckAnalysis analysis(UUID attemptId){return analysis.analyze(attemptId);}
    public void confirm(UUID attemptId, UUID labelId, String notes){entry(attemptId,labelId).confirm(notes,Instant.now(clock));}
    public void reject(UUID attemptId, UUID labelId){attemptLabels.delete(entry(attemptId,labelId));}
    public void add(UUID attemptId, UUID labelId, FailureSeverity severity, String notes){
        attempts.findById(attemptId).orElseThrow(()->new ResourceNotFoundException("Attempt not found")); FailureLabel label=labels.findById(labelId).orElseThrow(()->new ResourceNotFoundException("Failure label not found")); Instant now=Instant.now(clock);
        attemptLabels.findByAttemptIdAndFailureLabelId(attemptId,labelId).ifPresentOrElse(item->item.updateUserSelection(severity,notes,now),()->attemptLabels.save(new AttemptFailureLabel(UUID.randomUUID(),attemptId,label,severity,FailureLabelSource.USER_SELECTED,true,notes,now)));
    }
    public void remove(UUID attemptId, UUID labelId){attemptLabels.delete(entry(attemptId,labelId));}
    public UUID createBottleneckReview(UUID attemptId, UUID labelId){
        AttemptFailureLabel entry=entry(attemptId,labelId); if(!entry.isConfirmed()||entry.getSeverity()!=FailureSeverity.HIGH) throw new IllegalStateException("確認済みの HIGH ボトルネックだけを再確認できます。");
        return reviews.createBottleneckReview(attempts.findById(attemptId).orElseThrow(),entry.getFailureLabel()).getId();
    }
    private AttemptFailureLabel entry(UUID attemptId,UUID labelId){return attemptLabels.findByAttemptIdAndFailureLabelId(attemptId,labelId).orElseThrow(()->new ResourceNotFoundException("Attempt failure label not found"));}
}
