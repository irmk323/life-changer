ALTER TABLE attempts DROP CONSTRAINT fk_attempt_source_review;

ALTER TABLE attempts ADD CONSTRAINT fk_attempt_source_review
    FOREIGN KEY (source_review_schedule_id) REFERENCES review_schedules(id) ON DELETE SET NULL;
