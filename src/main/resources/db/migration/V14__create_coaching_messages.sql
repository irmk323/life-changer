CREATE TABLE coaching_messages (
    id UUID PRIMARY KEY,
    attempt_id UUID NOT NULL,
    provider VARCHAR(80) NOT NULL,
    provider_version VARCHAR(40) NOT NULL,
    observation CLOB NOT NULL,
    bottleneck CLOB NOT NULL,
    interpretation CLOB NOT NULL,
    next_test CLOB NOT NULL,
    evidence CLOB NOT NULL,
    emotional_acknowledgement CLOB,
    safety_note CLOB,
    rendered_message CLOB NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_coaching_attempt FOREIGN KEY (attempt_id) REFERENCES attempts(id)
);
CREATE INDEX idx_coaching_attempt_generated ON coaching_messages(attempt_id, generated_at DESC);
