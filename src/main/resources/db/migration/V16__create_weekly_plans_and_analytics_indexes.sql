CREATE TABLE weekly_plans (
    id UUID PRIMARY KEY,
    week_start DATE NOT NULL,
    focus_stage VARCHAR(64) NOT NULL,
    focus_pattern_id UUID,
    reason CLOB NOT NULL,
    target_metric VARCHAR(100),
    target_value INTEGER,
    status VARCHAR(32) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_attempts_completed_at ON attempts(completed_at);
