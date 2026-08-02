ALTER TABLE stage_assessments ADD COLUMN stage_outcome VARCHAR(32);
ALTER TABLE stage_assessments ADD COLUMN assistance_source VARCHAR(32);
UPDATE stage_assessments SET stage_outcome = CASE WHEN assessment_status='NOT_APPLICABLE' THEN 'NOT_APPLICABLE' WHEN assessment_status='SKIPPED' THEN 'SKIPPED' WHEN assessment_status='ASSESSED' AND score=2 THEN 'INDEPENDENT' WHEN assessment_status='ASSESSED' AND score=1 THEN 'PARTIAL' WHEN assessment_status='ASSESSED' AND score=0 THEN 'BLOCKED' ELSE 'UNASSESSED' END, assistance_source='UNKNOWN_LEGACY';
CREATE INDEX idx_stage_assessment_outcome ON stage_assessments(stage_outcome);
