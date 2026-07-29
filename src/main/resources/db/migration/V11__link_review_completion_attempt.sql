ALTER TABLE review_schedules ADD CONSTRAINT fk_review_completion_attempt
    FOREIGN KEY (completion_attempt_id) REFERENCES attempts(id);
