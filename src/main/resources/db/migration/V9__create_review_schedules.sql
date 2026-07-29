CREATE TABLE review_schedules (
    id UUID PRIMARY KEY,
    source_attempt_id UUID NOT NULL,
    source_problem_id UUID NOT NULL,
    assigned_problem_id UUID,
    pattern_id UUID,
    review_type VARCHAR(40) NOT NULL,
    scheduled_date DATE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL,
    completion_attempt_id UUID,
    assignment_notes CLOB,
    reschedule_reason CLOB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_review_source_attempt FOREIGN KEY (source_attempt_id) REFERENCES attempts(id),
    CONSTRAINT fk_review_source_problem FOREIGN KEY (source_problem_id) REFERENCES problem(id),
    CONSTRAINT fk_review_assigned_problem FOREIGN KEY (assigned_problem_id) REFERENCES problem(id),
    CONSTRAINT fk_review_pattern FOREIGN KEY (pattern_id) REFERENCES pattern(id),
    CONSTRAINT uq_review_source_attempt_type UNIQUE (source_attempt_id, review_type)
);
ALTER TABLE attempts ADD COLUMN source_review_schedule_id UUID;
ALTER TABLE attempts ADD CONSTRAINT fk_attempt_source_review FOREIGN KEY (source_review_schedule_id) REFERENCES review_schedules(id);
CREATE INDEX idx_review_schedules_date_status ON review_schedules(scheduled_date, status);
CREATE INDEX idx_review_schedules_completion_attempt ON review_schedules(completion_attempt_id);
