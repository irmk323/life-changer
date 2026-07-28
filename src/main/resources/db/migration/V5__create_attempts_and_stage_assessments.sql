CREATE TABLE attempts (
    id UUID PRIMARY KEY,
    problem_id UUID NOT NULL,
    attempt_type VARCHAR(40) NOT NULL,
    status VARCHAR(20) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds BIGINT,
    current_stage_order INTEGER NOT NULL,
    language VARCHAR(80),
    final_result VARCHAR(40),
    external_submission_result VARCHAR(255),
    code CLOB,
    confidence_before INTEGER,
    confidence_after INTEGER,
    emotion VARCHAR(255),
    reflection_summary CLOB,
    independent_stages CLOB,
    hint_needed_stages CLOB,
    unknown_stages CLOB,
    trigger_sentence CLOB,
    false_hypothesis CLOB,
    new_understanding CLOB,
    next_question CLOB,
    learning_obstacle CLOB,
    compile_error_count INTEGER NOT NULL DEFAULT 0,
    wrong_answer_count INTEGER NOT NULL DEFAULT 0,
    timed_out BOOLEAN NOT NULL DEFAULT FALSE,
    implementation_completed BOOLEAN NOT NULL DEFAULT FALSE,
    understood_but_could_not_implement BOOLEAN NOT NULL DEFAULT FALSE,
    edge_case_failure BOOLEAN NOT NULL DEFAULT FALSE,
    pattern_revealed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_attempt_problem FOREIGN KEY (problem_id) REFERENCES problem(id),
    CONSTRAINT chk_attempt_stage_order CHECK (current_stage_order BETWEEN 1 AND 13),
    CONSTRAINT chk_attempt_duration CHECK (duration_seconds IS NULL OR duration_seconds >= 0)
);
CREATE INDEX idx_attempts_problem_started ON attempts(problem_id, started_at DESC);
CREATE INDEX idx_attempts_status ON attempts(status);

CREATE TABLE stage_assessments (
    id UUID PRIMARY KEY,
    attempt_id UUID NOT NULL,
    stage_type VARCHAR(50) NOT NULL,
    answer CLOB,
    score INTEGER,
    duration_seconds BIGINT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    evaluator_notes CLOB,
    time_complexity VARCHAR(255),
    space_complexity VARCHAR(255),
    trace CLOB,
    updated_region VARCHAR(40),
    data_structure VARCHAR(40),
    selection_reason CLOB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_stage_attempt FOREIGN KEY (attempt_id) REFERENCES attempts(id),
    CONSTRAINT uq_stage_assessment_attempt_stage UNIQUE (attempt_id, stage_type),
    CONSTRAINT chk_stage_score CHECK (score IS NULL OR score BETWEEN 0 AND 2),
    CONSTRAINT chk_stage_duration CHECK (duration_seconds IS NULL OR duration_seconds >= 0)
);
CREATE INDEX idx_stage_assessments_attempt ON stage_assessments(attempt_id);

CREATE TABLE stage_assessment_required_operations (
    stage_assessment_id UUID NOT NULL,
    operation_code VARCHAR(40) NOT NULL,
    PRIMARY KEY (stage_assessment_id, operation_code),
    CONSTRAINT fk_required_operation_stage FOREIGN KEY (stage_assessment_id) REFERENCES stage_assessments(id)
);
