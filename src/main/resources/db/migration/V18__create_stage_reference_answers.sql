CREATE TABLE stage_reference_answers (
    id UUID PRIMARY KEY,
    problem_id UUID NOT NULL,
    stage_type VARCHAR(50) NOT NULL,
    model_answer CLOB NOT NULL,
    applicability VARCHAR(30) NOT NULL,
    content_version INTEGER NOT NULL,
    source_file VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_stage_reference_answer_problem FOREIGN KEY (problem_id) REFERENCES problem(id),
    CONSTRAINT uq_stage_reference_answer_problem_stage UNIQUE (problem_id, stage_type),
    CONSTRAINT chk_stage_reference_answer_version CHECK (content_version > 0)
);
CREATE INDEX idx_stage_reference_answers_problem ON stage_reference_answers(problem_id, active);

CREATE TABLE stage_reference_answer_reveals (
    id UUID PRIMARY KEY,
    stage_reference_answer_id UUID NOT NULL,
    attempt_id UUID NOT NULL,
    stage_assessment_id UUID NOT NULL,
    content_version INTEGER NOT NULL,
    revealed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_reference_reveal_answer FOREIGN KEY (stage_reference_answer_id) REFERENCES stage_reference_answers(id),
    CONSTRAINT fk_reference_reveal_attempt FOREIGN KEY (attempt_id) REFERENCES attempts(id),
    CONSTRAINT fk_reference_reveal_assessment FOREIGN KEY (stage_assessment_id) REFERENCES stage_assessments(id),
    CONSTRAINT uq_reference_reveal_attempt_stage_version UNIQUE (attempt_id, stage_assessment_id, content_version)
);
CREATE INDEX idx_reference_reveals_attempt_stage ON stage_reference_answer_reveals(attempt_id, stage_assessment_id);
