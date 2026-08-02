package com.example.leetcodetrainer.curriculum.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.leetcodetrainer.attempt.domain.AttemptType;
import com.example.leetcodetrainer.attempt.service.AttemptService;
import com.example.leetcodetrainer.curriculum.domain.*;
import com.example.leetcodetrainer.curriculum.repository.*;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class CurriculumFoundationIntegrationTest {
    private static final UUID TWO_SUM = UUID.fromString("20000000-0000-0000-0000-000000000001");

    @Autowired private CurriculumFoundationService service;
    @Autowired private SkillDefinitionRepository skillDefinitions;
    @Autowired private LearningModeDefinitionRepository learningModes;
    @Autowired private ModeSkillRequirementRepository requirements;
    @Autowired private CurriculumItemRepository curriculumItems;
    @Autowired private ProblemExposureRepository exposures;
    @Autowired private ContentExposureEventRepository contentEvents;
    @Autowired private LearningSessionRepository sessions;
    @Autowired private AttemptService attempts;

    @Test
    void flywayFoundationSeedIsPresentAndReadOnlyQueriesAreDeterministic() {
        assertThat(skillDefinitions.findByActiveTrueOrderByDisplayOrderAsc()).hasSize(9);
        assertThat(learningModes.findByActiveTrueOrderByDisplayOrderAsc()).extracting(LearningModeDefinition::getCode)
                .containsExactlyElementsOf(java.util.Arrays.stream(LearningMode.values()).map(Enum::name).toList());
        assertThat(requirements.findAllByOrderByLearningModeAscDisplayOrderAsc()).allSatisfy(requirement -> {
            assertThat(requirement.getLearningModeDefinitionId()).isNotNull();
            assertThat(requirement.getDisplayOrder()).isPositive();
        });
        assertThat(curriculumItems.findByActiveTrueOrderByDisplayOrderAsc()).hasSize(3);
        assertThat(service.skills()).hasSize(9);
        assertThat(service.modes()).hasSize(12);
    }

    @Test
    void savesAndReadsExposureEventAndSessionWithoutLegacyAttempt() {
        Instant now = Instant.parse("2026-02-01T00:00:00Z");
        ProblemExposure exposure = exposures.save(new ProblemExposure(UUID.randomUUID(), TWO_SUM, ProblemExposureState.TITLE_OR_PROMPT_SEEN, now));
        LearningSession session = sessions.save(new LearningSession(UUID.randomUUID(), TWO_SUM, LearningMode.COLD_DIAGNOSTIC,
                null, exposure.getState(), 900L, null, "foundation test", now));
        contentEvents.save(new ContentExposureEvent(UUID.randomUUID(), TWO_SUM, null, session.getId(), ContentExposureType.PROBLEM_PROMPT, "problem-page", now));

        assertThat(exposures.findById(exposure.getId())).isPresent();
        assertThat(contentEvents.findByProblemIdOrderByExposedAtAsc(TWO_SUM)).hasSize(1);
        assertThat(sessions.findById(session.getId())).get().extracting(LearningSession::getLegacyAttemptId).isNull();
    }

    @Test
    void allowsSessionToLinkToAnExistingLegacyAttemptWithoutBackfillingOtherAttempts() {
        var attempt = attempts.start(TWO_SUM, AttemptType.INITIAL);
        LearningSession session = sessions.save(new LearningSession(UUID.randomUUID(), TWO_SUM, LearningMode.GUIDED_RECONSTRUCTION,
                LearningMode.GUIDED_RECONSTRUCTION, null, null, attempt.getId(), "explicit legacy link", Instant.now()));

        assertThat(sessions.findById(session.getId())).get().extracting(LearningSession::getLegacyAttemptId).isEqualTo(attempt.getId());
        assertThat(sessions.findAll()).hasSize(1);
    }
}
