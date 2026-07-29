ALTER TABLE coaching_messages DROP CONSTRAINT fk_coaching_attempt;
ALTER TABLE coaching_messages ADD CONSTRAINT fk_coaching_attempt
    FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE;
