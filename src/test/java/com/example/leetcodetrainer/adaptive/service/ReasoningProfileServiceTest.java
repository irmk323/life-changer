package com.example.leetcodetrainer.adaptive.service;
import static org.assertj.core.api.Assertions.assertThat;
import com.example.leetcodetrainer.adaptive.domain.*; import com.example.leetcodetrainer.attempt.domain.StageType; import org.junit.jupiter.api.Test;
class ReasoningProfileServiceTest { private final ReasoningProfileService service=new ReasoningProfileService(); @Test void recursiveProfileMakesLookupOnlyStagesNotApplicable(){var stages=service.stagesFor(ReasoningProfileType.RECURSIVE_DIVIDE_AND_COMBINE);assertThat(stages).anyMatch(s->s.canonicalStage()==StageType.DATA_STRUCTURE_SELECTION&&s.applicability()==StageApplicability.NOT_APPLICABLE).anyMatch(s->s.displayName().equals("再帰関数の契約")&&s.applicability()==StageApplicability.REQUIRED);}}
