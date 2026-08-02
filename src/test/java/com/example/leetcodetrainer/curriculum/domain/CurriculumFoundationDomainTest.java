package com.example.leetcodetrainer.curriculum.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;
import static org.assertj.core.api.Assertions.assertThatIllegalStateException;

import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class CurriculumFoundationDomainTest {
    private final Instant now = Instant.parse("2026-01-01T00:00:00Z");

    @Test
    void keepsThePublishedLearningModeAndCurriculumRoleVocabulary() {
        assertThat(LearningMode.values()).contains(LearningMode.COLD_DIAGNOSTIC, LearningMode.TIMED_COLD_SOLVE);
        assertThat(CurriculumRole.values()).contains(CurriculumRole.ANCHOR, CurriculumRole.HOLDOUT);
    }

    @Test
    void validatesRequirementOrderingAndNotApplicableCompletionRule() {
        assertThatIllegalArgumentException().isThrownBy(() -> new ModeSkillRequirement(UUID.randomUUID(), LearningMode.COLD_DIAGNOSTIC,
                UUID.randomUUID(), UUID.randomUUID(), 0, RequirementApplicability.REQUIRED, false, true, true));
        assertThatIllegalArgumentException().isThrownBy(() -> new ModeSkillRequirement(UUID.randomUUID(), LearningMode.COLD_DIAGNOSTIC,
                UUID.randomUUID(), UUID.randomUUID(), 1, RequirementApplicability.NOT_APPLICABLE, false, false, true));
    }

    @Test
    void retainsAllExplicitProblemExposureStatesWithoutInferringLegacyHistory() {
        ProblemExposure exposure = new ProblemExposure(UUID.randomUUID(), UUID.randomUUID(), ProblemExposureState.ATTEMPTED_WITHOUT_SOLUTION, now);
        exposure.updateState(ProblemExposureState.UNDERSTOOD_BUT_FORGOTTEN, now.plusSeconds(60));
        assertThat(exposure.getState()).isEqualTo(ProblemExposureState.UNDERSTOOD_BUT_FORGOTTEN);
        assertThat(ProblemExposureState.values()).contains(ProblemExposureState.NEVER_SEEN, ProblemExposureState.CODE_MEMORISED);
    }

    @Test
    void protectsHoldoutFromPreviouslyExposedContent() {
        CurriculumItem holdout = new CurriculumItem(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), CurriculumRole.HOLDOUT, 1, true, null, now);
        assertThat(holdout.isHoldoutEligible(null)).isTrue();
        assertThat(holdout.isHoldoutEligible(new ProblemExposure(UUID.randomUUID(), UUID.randomUUID(), ProblemExposureState.SOLUTION_SEEN, now))).isFalse();
    }

    @Test
    void learningSessionAllowsNullableLegacyAttemptAndValidTransitions() {
        LearningSession session = new LearningSession(UUID.randomUUID(), UUID.randomUUID(), LearningMode.COLD_DIAGNOSTIC,
                LearningMode.COLD_DIAGNOSTIC, null, null, null, "manual verification", now);
        assertThat(session.getLegacyAttemptId()).isNull();
        session.start(now.plusSeconds(1)); session.complete(now.plusSeconds(2));
        assertThat(session.getStatus()).isEqualTo(LearningSessionStatus.COMPLETED);
        assertThatIllegalStateException().isThrownBy(() -> session.start(now.plusSeconds(3)));
    }
}
