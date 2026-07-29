CREATE TABLE failure_labels (
    id UUID PRIMARY KEY,
    code VARCHAR(80) NOT NULL UNIQUE,
    display_name VARCHAR(120) NOT NULL,
    description CLOB NOT NULL,
    related_stage VARCHAR(50),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL
);

CREATE TABLE attempt_failure_labels (
    id UUID PRIMARY KEY,
    attempt_id UUID NOT NULL,
    failure_label_id UUID NOT NULL,
    severity VARCHAR(20) NOT NULL,
    source VARCHAR(30) NOT NULL,
    confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    notes CLOB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_attempt_failure_attempt FOREIGN KEY (attempt_id) REFERENCES attempts(id),
    CONSTRAINT fk_attempt_failure_label FOREIGN KEY (failure_label_id) REFERENCES failure_labels(id),
    CONSTRAINT uq_attempt_failure_label UNIQUE (attempt_id, failure_label_id)
);
CREATE INDEX idx_attempt_failure_attempt ON attempt_failure_labels(attempt_id, confirmed);
CREATE INDEX idx_attempt_failure_label ON attempt_failure_labels(failure_label_id, confirmed);

ALTER TABLE review_schedules DROP CONSTRAINT uq_review_source_attempt_type;
ALTER TABLE review_schedules ADD COLUMN failure_label_id UUID;
ALTER TABLE review_schedules ADD CONSTRAINT fk_review_failure_label FOREIGN KEY (failure_label_id) REFERENCES failure_labels(id);
CREATE UNIQUE INDEX uq_review_targeted_label ON review_schedules(source_attempt_id, review_type, failure_label_id);

INSERT INTO failure_labels (id, code, display_name, description, related_stage, active, display_order) VALUES
('00000000-0000-0000-0000-000000000101', 'PROBLEM_STATEMENT_PARSING', '問題文の読み取り', '問題文から必要な条件を取り出す工程で停止しました。', 'PROBLEM_RELATION', TRUE, 1),
('00000000-0000-0000-0000-000000000102', 'RELATION_ABSTRACTION', '関係の抽出', '問題の物語を、要素間の関係へ言い換える工程です。', 'PROBLEM_RELATION', TRUE, 2),
('00000000-0000-0000-0000-000000000103', 'INPUT_OUTPUT_MODELLING', '入出力のモデル化', '入力と出力の対応を整理する工程です。', 'PROBLEM_RELATION', TRUE, 3),
('00000000-0000-0000-0000-000000000104', 'EXAMPLE_TRACING', '例のトレース', '小さな例を手で追う工程です。', 'BRUTE_FORCE', TRUE, 4),
('00000000-0000-0000-0000-000000000105', 'BRUTE_FORCE_CONSTRUCTION', 'Brute force の構築', '遅くても正しい手順を作る工程です。', 'BRUTE_FORCE', TRUE, 5),
('00000000-0000-0000-0000-000000000106', 'COMPLEXITY_ANALYSIS', '計算量の分析', '計算量を説明する工程です。', 'CORRECTNESS_AND_COMPLEXITY', TRUE, 6),
('00000000-0000-0000-0000-000000000107', 'REPEATED_WORK_IDENTIFICATION', '重複処理の特定', '同じ仕事が繰り返される箇所を見つける工程です。', 'REPEATED_WORK', TRUE, 7),
('00000000-0000-0000-0000-000000000108', 'UNRESOLVED_STATE_IDENTIFICATION', '未解決状態の識別', 'まだ答えを待つ要素を表現する工程です。', 'UNRESOLVED_STATE', TRUE, 8),
('00000000-0000-0000-0000-000000000109', 'RESOLUTION_EVENT_IDENTIFICATION', '確定イベントの識別', '新しい入力で何が確定するかを見つける工程です。', 'RESOLUTION_EVENT', TRUE, 9),
('00000000-0000-0000-0000-000000000110', 'UPDATED_REGION_IDENTIFICATION', '更新範囲の識別', '未解決状態のどこが変わるかを特定する工程です。', 'UPDATED_REGION', TRUE, 10),
('00000000-0000-0000-0000-000000000111', 'REQUIRED_OPERATION_DERIVATION', '必要操作の導出', '必要な追加・参照・削除・検索操作を列挙する工程です。', 'REQUIRED_OPERATIONS', TRUE, 11),
('00000000-0000-0000-0000-000000000112', 'DATA_STRUCTURE_SELECTION', 'データ構造の選択', '必要操作に合うデータ構造を選ぶ工程です。', 'DATA_STRUCTURE_SELECTION', TRUE, 12),
('00000000-0000-0000-0000-000000000113', 'INVARIANT_FORMULATION', '不変条件の定式化', '途中で維持する条件を言語化する工程です。', 'INVARIANT', TRUE, 13),
('00000000-0000-0000-0000-000000000114', 'CORRECTNESS_REASONING', '正しさの説明', 'なぜ必要な答えが得られるかを説明する工程です。', 'CORRECTNESS_AND_COMPLEXITY', TRUE, 14),
('00000000-0000-0000-0000-000000000115', 'PATTERN_RECOGNITION', 'パターン認識', '構造から候補を認識する工程です。', 'TRANSFER', TRUE, 15),
('00000000-0000-0000-0000-000000000116', 'PATTERN_DISCRIMINATION', 'パターン識別', '似た候補との決定的な違いを説明する工程です。', 'TRANSFER', TRUE, 16),
('00000000-0000-0000-0000-000000000117', 'IMPLEMENTATION_TRANSLATION', '実装への翻訳', '理解した手順をコードへ落とす工程です。', 'IMPLEMENTATION', TRUE, 17),
('00000000-0000-0000-0000-000000000118', 'LANGUAGE_SYNTAX', '言語構文', '言語や API の構文上の問題です。', 'IMPLEMENTATION', TRUE, 18),
('00000000-0000-0000-0000-000000000119', 'EDGE_CASE_IDENTIFICATION', '境界条件の識別', '境界条件・例外ケースを扱う工程です。', 'IMPLEMENTATION', TRUE, 19),
('00000000-0000-0000-0000-000000000120', 'DEBUGGING', 'デバッグ', '誤った出力の原因を切り分ける工程です。', 'IMPLEMENTATION', TRUE, 20),
('00000000-0000-0000-0000-000000000121', 'RECALL', '想起', '以前できた工程を同じ問題で再構築する工程です。', NULL, TRUE, 21),
('00000000-0000-0000-0000-000000000122', 'TRANSFER', '転用', '見た目の異なる同型問題へ考え方を移す工程です。', 'TRANSFER', TRUE, 22),
('00000000-0000-0000-0000-000000000123', 'TIME_PRESSURE', '時間圧', '時間制約下で工程を進めることに関する記録です。', NULL, TRUE, 23),
('00000000-0000-0000-0000-000000000124', 'EXPLANATION', '説明', '考え方を他者に説明する工程です。', 'CORRECTNESS_AND_COMPLEXITY', TRUE, 24),
('00000000-0000-0000-0000-000000000125', 'OTHER', 'その他', '上の語彙に当てはまらない、ユーザー記述の停止地点です。', NULL, TRUE, 25);
