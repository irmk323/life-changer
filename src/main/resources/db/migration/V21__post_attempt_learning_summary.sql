ALTER TABLE stage_assessments ADD COLUMN assessment_status VARCHAR(32) DEFAULT 'NOT_STARTED' NOT NULL;
ALTER TABLE attempts ADD COLUMN prior_exposure VARCHAR(32);
ALTER TABLE attempts ADD COLUMN active_duration_seconds BIGINT;
ALTER TABLE attempts ADD COLUMN data_quality_status VARCHAR(32);
ALTER TABLE attempts ADD COLUMN analysis_status VARCHAR(32);
CREATE INDEX idx_stage_assessment_status ON stage_assessments(assessment_status);
