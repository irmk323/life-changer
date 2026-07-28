CREATE TABLE problem (
    id UUID PRIMARY KEY,
    leetcode_number INTEGER,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    external_url VARCHAR(1000) NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    neetcode_category VARCHAR(100) NOT NULL,
    active BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT problem_difficulty_check CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD', 'SYNTHETIC'))
);

CREATE TABLE pattern (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description VARCHAR(2000) NOT NULL,
    trigger_clues VARCHAR(4000) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE problem_pattern (
    problem_id UUID NOT NULL,
    pattern_id UUID NOT NULL,
    primary_pattern BOOLEAN NOT NULL,
    notes VARCHAR(1000),
    PRIMARY KEY (problem_id, pattern_id),
    CONSTRAINT problem_pattern_problem_fk FOREIGN KEY (problem_id) REFERENCES problem(id),
    CONSTRAINT problem_pattern_pattern_fk FOREIGN KEY (pattern_id) REFERENCES pattern(id)
);

CREATE INDEX problem_active_difficulty_category_idx ON problem(active, difficulty, neetcode_category);
CREATE INDEX problem_pattern_pattern_idx ON problem_pattern(pattern_id, primary_pattern);
