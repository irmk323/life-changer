CREATE TABLE attempt_recursive_contract (
    attempt_id UUID PRIMARY KEY,
    function_contract CLOB,
    base_case CLOB,
    subproblems CLOB,
    composition_rule CLOB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_attempt_recursive_contract_attempt FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE
);
