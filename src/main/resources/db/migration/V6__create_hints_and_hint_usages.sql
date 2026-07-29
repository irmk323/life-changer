CREATE TABLE hints (
    id UUID PRIMARY KEY,
    problem_id UUID,
    pattern_id UUID,
    stage_type VARCHAR(50) NOT NULL,
    hint_level INTEGER NOT NULL,
    content CLOB NOT NULL,
    display_order INTEGER NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_hint_problem FOREIGN KEY (problem_id) REFERENCES problem(id),
    CONSTRAINT fk_hint_pattern FOREIGN KEY (pattern_id) REFERENCES pattern(id),
    CONSTRAINT chk_hint_target CHECK (problem_id IS NOT NULL OR pattern_id IS NOT NULL),
    CONSTRAINT chk_hint_level CHECK (hint_level BETWEEN 1 AND 5),
    CONSTRAINT chk_hint_display_order CHECK (display_order >= 0)
);
CREATE INDEX idx_hints_problem_stage ON hints(problem_id, stage_type, hint_level, display_order);
CREATE INDEX idx_hints_pattern_stage ON hints(pattern_id, stage_type, hint_level, display_order);

CREATE TABLE hint_usages (
    id UUID PRIMARY KEY,
    attempt_id UUID NOT NULL,
    stage_assessment_id UUID NOT NULL,
    hint_id UUID NOT NULL,
    stage_type VARCHAR(50) NOT NULL,
    hint_level INTEGER NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE NOT NULL,
    helped_user_proceed BOOLEAN,
    user_note CLOB,
    CONSTRAINT fk_hint_usage_attempt FOREIGN KEY (attempt_id) REFERENCES attempts(id),
    CONSTRAINT fk_hint_usage_assessment FOREIGN KEY (stage_assessment_id) REFERENCES stage_assessments(id),
    CONSTRAINT fk_hint_usage_hint FOREIGN KEY (hint_id) REFERENCES hints(id),
    CONSTRAINT uq_hint_usage_attempt_hint UNIQUE (attempt_id, hint_id),
    CONSTRAINT chk_hint_usage_level CHECK (hint_level BETWEEN 1 AND 5)
);
CREATE INDEX idx_hint_usages_attempt_stage ON hint_usages(attempt_id, stage_type, used_at);
