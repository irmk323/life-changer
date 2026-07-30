package com.example.leetcodetrainer.referenceanswer.service;

import com.example.leetcodetrainer.attempt.domain.StageType;
import com.example.leetcodetrainer.problem.domain.Problem;
import com.example.leetcodetrainer.problem.repository.ProblemRepository;
import com.example.leetcodetrainer.referenceanswer.domain.StageApplicability;
import com.example.leetcodetrainer.referenceanswer.domain.StageReferenceAnswer;
import com.example.leetcodetrainer.referenceanswer.repository.StageReferenceAnswerRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.*;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReferenceAnswerImportService implements ApplicationRunner {
    private final ReferenceAnswerResourceLoader loader; private final ReferenceAnswerValidator validator; private final ProblemRepository problems; private final StageReferenceAnswerRepository answers; private final Clock clock;
    public ReferenceAnswerImportService(ReferenceAnswerResourceLoader loader, ReferenceAnswerValidator validator, ProblemRepository problems, StageReferenceAnswerRepository answers, Clock clock) { this.loader=loader; this.validator=validator; this.problems=problems; this.answers=answers; this.clock=clock; }
    @Override public void run(ApplicationArguments args) { importClasspathContent(); }
    @Transactional public ImportResult importClasspathContent() { List<ReferenceAnswerDocument> documents=loader.loadAll(); validator.validate(documents); int inserted=0, updated=0, unchanged=0;
        for (ReferenceAnswerDocument document:documents) {
            Problem problem=problems.findBySlug(document.problemSlug()).orElseThrow(() -> new IllegalArgumentException(document.sourceFile()+": problemSlug="+document.problemSlug()+" に一致するProblemがありません。"));
            for (ReferenceAnswerDocument.Stage stage:document.stages()) {
                StageType type=StageType.valueOf(stage.stage()); StageApplicability applicability=StageApplicability.valueOf(stage.applicability());
                Optional<StageReferenceAnswer> existing=answers.findByProblemIdAndStageType(problem.getId(), type);
                if (existing.isEmpty()) { answers.save(new StageReferenceAnswer(UUID.randomUUID(), problem.getId(), type, stage.modelAnswer(), applicability, document.contentVersion(), document.sourceFile(), Instant.now(clock))); inserted++; }
                else if (document.contentVersion()>existing.get().getContentVersion()) { existing.get().update(stage.modelAnswer(), applicability, document.contentVersion(), document.sourceFile(), Instant.now(clock)); updated++; }
                else if (document.contentVersion()==existing.get().getContentVersion()) unchanged++;
                else throw new IllegalArgumentException(document.sourceFile()+": stage="+stage.stage()+" の contentVersion を "+existing.get().getContentVersion()+" から下げることはできません。");
            }
        }
        return new ImportResult(documents.size(), inserted, updated, unchanged);
    }
    public record ImportResult(int files, int inserted, int updated, int unchanged) { }
}
