ALTER TABLE attempt_failure_labels DROP CONSTRAINT fk_attempt_failure_attempt;
ALTER TABLE attempt_failure_labels ADD CONSTRAINT fk_attempt_failure_attempt
    FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE;
