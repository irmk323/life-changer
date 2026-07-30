package com.example.leetcodetrainer.referenceanswer.service;

import static org.assertj.core.api.Assertions.*;

import com.example.leetcodetrainer.attempt.domain.*;
import com.example.leetcodetrainer.attempt.repository.StageAssessmentRepository;
import com.example.leetcodetrainer.attempt.service.AttemptService;
import com.example.leetcodetrainer.problem.repository.ProblemRepository;
import com.example.leetcodetrainer.referenceanswer.repository.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class ReferenceAnswerIntegrationTest {
    @Autowired ReferenceAnswerImportService importer;
    @Autowired StageReferenceAnswerRepository answers;
    @Autowired StageReferenceAnswerRevealRepository reveals;
    @Autowired ReferenceAnswerService referenceAnswers;
    @Autowired AttemptService attempts;
    @Autowired StageAssessmentRepository assessments;
    @Autowired ProblemRepository problems;

    @Test void importsEightFilesAnd104AnswersIdempotentlyWithRequiredContent() {
        assertThat(answers.count()).isEqualTo(104);
        assertThat(answers.findByProblemIdAndStageType(problems.findBySlug("two-sum").orElseThrow().getId(), StageType.UNRESOLVED_STATE).orElseThrow().getModelAnswer()).contains("target - x");
        assertThat(answers.findByProblemIdAndStageType(problems.findBySlug("daily-temperatures").orElseThrow().getId(), StageType.INVARIANT).orElseThrow().getModelAnswer()).contains("単調");
        var result=importer.importClasspathContent();
        assertThat(result.files()).isEqualTo(8); assertThat(result.inserted()).isZero(); assertThat(result.updated()).isZero(); assertThat(result.unchanged()).isEqualTo(104); assertThat(answers.count()).isEqualTo(104);
    }
    @Test void revealIsIdempotentAndPreventsIndependentScore() {
        UUID problemId=problems.findBySlug("two-sum").orElseThrow().getId();
        Attempt attempt=attempts.start(problemId, AttemptType.INITIAL);
        referenceAnswers.reveal(attempt.getId(), StageType.PROBLEM_RELATION);
        referenceAnswers.reveal(attempt.getId(), StageType.PROBLEM_RELATION);
        assertThat(reveals.findByAttemptIdOrderByRevealedAtAsc(attempt.getId())).hasSize(1);
        assertThat(referenceAnswers.status(attempt.getId(), StageType.PROBLEM_RELATION).revealed()).isTrue();
        assertThatThrownBy(() -> referenceAnswers.validateScore(attempt.getId(), StageType.PROBLEM_RELATION, 2)).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("2点");
        assertThat(referenceAnswers.maxReferenceHintLevel(attempt.getId(), StageType.PROBLEM_RELATION)).isEqualTo(5);
    }
}
