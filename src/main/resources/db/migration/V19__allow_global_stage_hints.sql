ALTER TABLE hints DROP CONSTRAINT chk_hint_target;
CREATE INDEX idx_hints_global_stage ON hints(stage_type, hint_level, display_order);
