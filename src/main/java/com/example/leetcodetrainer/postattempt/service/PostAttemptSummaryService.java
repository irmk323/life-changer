package com.example.leetcodetrainer.postattempt.service;

import com.example.leetcodetrainer.attempt.domain.*;
import com.example.leetcodetrainer.attempt.repository.StageAssessmentRepository;
import com.example.leetcodetrainer.attempt.service.*;
import com.example.leetcodetrainer.failure.dto.BottleneckAnalysis;
import com.example.leetcodetrainer.failure.service.FailureLabelService;
import com.example.leetcodetrainer.hint.repository.HintUsageRepository;
import com.example.leetcodetrainer.referenceanswer.repository.StageReferenceAnswerRevealRepository;
import java.util.*;
import com.example.leetcodetrainer.adaptive.service.AdaptiveLearningService;
import org.springframework.stereotype.Service;

@Service
public class PostAttemptSummaryService {
    private static final long DURATION_OUTLIER_SECONDS=12*60*60;
    private final StageAssessmentRepository stages; private final HintUsageRepository hints; private final StageReferenceAnswerRevealRepository reveals;
    private final AttemptQualityService quality; private final FailureLabelService failures; private final AdaptiveLearningService adaptive;
    public PostAttemptSummaryService(StageAssessmentRepository stages, HintUsageRepository hints, StageReferenceAnswerRevealRepository reveals, AttemptQualityService quality, FailureLabelService failures, AdaptiveLearningService adaptive) { this.stages=stages;this.hints=hints;this.reveals=reveals;this.quality=quality;this.failures=failures;this.adaptive=adaptive; }
    public PostAttemptSummary summary(Attempt attempt) {
        List<StageAssessment> values=stages.findByAttemptIdOrderByStageTypeAsc(attempt.getId()).stream().sorted(Comparator.comparingInt(s->s.getStageType().getOrder())).toList();
        AttemptQuality q=quality.assess(attempt,values);
        List<PostAttemptSummary.StageItem> items=values.stream().map(s -> new PostAttemptSummary.StageItem(s.getStageType(), outcome(attempt,s), s.getScore(), s.getAnswer(), Optional.ofNullable(hints.findMaxHintLevel(attempt.getId(),s.getStageType())).orElse(0), reveals.existsByAttemptIdAndStageAssessmentId(attempt.getId(),s.getId()))).toList();
        List<String> demonstrated=items.stream().filter(s->"自力".equals(s.outcome())).map(s->s.stage().getDisplayName()+"を自力で確認できた").toList();
        List<String> unmeasured=new ArrayList<>();
        if (q.unassessedCount()>0) unmeasured.add("工程別の自己評価が"+q.unassessedCount()+"件未入力です。");
        if (attempt.getPriorExposure()==PriorExposure.SOLVED_BEFORE || attempt.getPriorExposure()==PriorExposure.MEMORISED) unmeasured.add("この問題は既知だったため、未知の同型問題への転用はまだ未測定です。");
        if (attempt.getAttemptType()!=AttemptType.ISOMORPHIC_TRANSFER) unmeasured.add("見た目の異なる同型問題への転用はまだ未測定です。");
        BottleneckAnalysis analysis=q.analysisAllowed()?failures.analysis(attempt.getId()):new BottleneckAnalysis(List.of(),null);
        long seconds=Optional.ofNullable(attempt.getActiveDurationSeconds()).orElse(Optional.ofNullable(attempt.getDurationSeconds()).orElse(0L));
        return new PostAttemptSummary(outcomeTitle(attempt), outcomeDescription(attempt,q), format(seconds), seconds>DURATION_OUTLIER_SECONDS, q, demonstrated, unmeasured, items, nextAction(attempt,q,analysis), analysis, adaptive.select(adaptive.evidenceFor(attempt)).orElse(null));
    }
    private String outcome(Attempt a, StageAssessment s) { if (quality.isLegacyAmbiguous(a,s)||s.getAssessmentStatus()==StageAssessmentStatus.NOT_STARTED||s.getAssessmentStatus()==StageAssessmentStatus.IN_PROGRESS) return "未評価"; if(s.getAssessmentStatus()==StageAssessmentStatus.NOT_APPLICABLE)return "対象外";if(s.getAssessmentStatus()==StageAssessmentStatus.SKIPPED)return "スキップ";return switch(s.getScore()){case 2->"自力";case 1->"ヒントあり";default->"できなかった";}; }
    private String outcomeTitle(Attempt a) { if(a.getAttemptType()==AttemptType.ISOMORPHIC_TRANSFER&&a.getFinalResult()==FinalResult.SOLVED_INDEPENDENTLY)return "同型問題への転用成功"; if(a.getFinalResult()==FinalResult.SOLVED_INDEPENDENTLY&&(a.getPriorExposure()==PriorExposure.SOLVED_BEFORE||a.getPriorExposure()==PriorExposure.MEMORISED))return "既知問題の再構築成功"; if(a.getFinalResult()==FinalResult.SOLVED_INDEPENDENTLY&&a.getPriorExposure()==PriorExposure.NEVER_SEEN)return "初見問題での自力成功"; return a.getFinalResult()==null?"記録完了":a.getFinalResult().getDisplayName(); }
    private String outcomeDescription(Attempt a,AttemptQuality q) { if(q.legacyAmbiguous())return "回答・ヒント・操作記録のない既存の0点は、できなかったとは判断しません。工程別分析を作るにはQuick Assessmentを完了してください。"; if(q.contradictory())return "「自力で解けた」と工程評価が矛盾しています。記録を確認してください。"; if(!q.analysisAllowed())return "工程別評価が未入力のため、現在は工程別の分析を作れません。"; return "今回の記録から、確認できた工程と次に測ることを分けて表示しています。"; }
    private String nextAction(Attempt a,AttemptQuality q,BottleneckAnalysis b) { if(!q.analysisAllowed())return "まずQuick Assessmentを完了し、今回どの工程を自力でできたか記録してください。"; if(a.getPriorExposure()==PriorExposure.SOLVED_BEFORE||a.getPriorExposure()==PriorExposure.MEMORISED)return "同じ問題を解き直さず、見た目の異なる同型問題をタグなしで解き、必要な操作を自力で導けるか確認してください。"; if(b.primary()!=null&&b.primary().evidence().stage()==StageType.UPDATED_REGION)return "次の問題では、データ構造名を書く前に「参照・確定・追加・削除」の4行を記録してください。"; return "次の問題では、問題の関係を一文で書いてから必要な操作を列挙してください。"; }
    private String format(long s){return s>=3600?s/3600+"時間"+(s%3600)/60+"分":s>=60?s/60+"分"+s%60+"秒":s+"秒";}
}
