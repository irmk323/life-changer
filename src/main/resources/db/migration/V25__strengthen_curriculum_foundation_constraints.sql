ALTER TABLE mode_skill_requirement ALTER COLUMN learning_mode_definition_id SET NOT NULL;
ALTER TABLE mode_skill_requirement ADD CONSTRAINT uq_mode_definition_skill_order UNIQUE(learning_mode_definition_id, display_order);
ALTER TABLE mode_skill_requirement ADD CONSTRAINT chk_mode_requirement_order CHECK(display_order > 0);
ALTER TABLE curriculum_item ADD CONSTRAINT chk_curriculum_item_order CHECK(display_order > 0);
ALTER TABLE curriculum_item ADD COLUMN created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE curriculum_item ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;
