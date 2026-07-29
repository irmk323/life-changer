-- Keep StageType and UpdatedRegion enum values untouched. This migration updates only learner-facing material.
UPDATE pattern SET
    description = '現在の要素に必要な相手を計算し、過去に保存した値から位置などの情報を取り出す。',
    trigger_clues = '現在の値に必要な相手を計算でき、過去の値を何度も探し直すのは高コストなとき。',
    typical_brute_force = 'すべての異なる二要素の組を確認する。各 i について j = i + 1 以降を調べる。',
    repeated_work = '各 current について、target - current が存在するかを配列から毎回線形探索している。',
    unresolved_state = '過去に見た値とその index、または過去の値が将来必要としている補数と元 index。過去の値 x は target - x を待っている。',
    resolution_event = '現在値 current に必要な補数が、過去に保持した値として存在したとき。',
    updated_region = '状態全体を走査せず、補数に対応する特定 key を参照する。一致なら index を確定し、不一致なら現在値と index（または補数と元 index）を追加する。',
    required_operations = 'key の存在を確認する。key から元 index を取得する。新しい key と index を登録する。',
    invariant_description = 'index i を処理する時点で、状態には i より前の値と index だけがある。現在値を追加する前に補数を検索するため、同じ index を二回使わない。',
    correctness_notes = '解となる i < j では、j を処理するとき i はすでに保持済みであるため、補数検索で必ず i を見つけられる。',
    complexity_notes = 'key の検索と登録は平均 O(1) なので、全体は平均 O(n)、空間は O(n)。',
    common_mistakes = '現在値を検索前に登録して同じ index を使うこと、値の存在だけを保持して index を失うこと。',
    contrast_cases = 'Two Sum II は入力が整列済みなので Two Pointers を使える。3Sum は一要素を固定して Two Sum 型にする。Subarray Sum Equals K は prefix sum の差を key として検索する。',
    java_notes = '保持状態 → seen map、必要な相手 → complement、存在確認 → containsKey、index 取得 → get、新しい状態の追加 → put。lookup before put を保つ。',
    updated_at = CURRENT_TIMESTAMP
WHERE code = 'HASH_LOOKUP';

UPDATE failure_labels SET display_name = '保持状態・未確定候補の識別',
    description = '今後の判断に必要な情報や、何を待つ未確定候補かを表現する工程です。'
WHERE code = 'UNRESOLVED_STATE_IDENTIFICATION';

UPDATE failure_labels SET display_name = '状態の参照・更新対象の識別',
    description = '保存状態のどこを参照し、確定・追加・削除・置換するかを特定する工程です。'
WHERE code = 'UPDATED_REGION_IDENTIFICATION';

UPDATE hints SET active = FALSE WHERE id = '30000000-0000-0000-0000-000000000010';

INSERT INTO hints (id, problem_id, pattern_id, stage_type, hint_level, content, display_order, active, created_at, updated_at) VALUES
('30000000-0000-0000-0000-000000000029', '20000000-0000-0000-0000-000000000001', NULL, 'UNRESOLVED_STATE', 1, 'ここまでに見た値のうち、後からもう一度必要になる情報は何ですか？', 1, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('30000000-0000-0000-0000-000000000030', '20000000-0000-0000-0000-000000000001', NULL, 'UNRESOLVED_STATE', 2, '過去の値 x は、合計を target にするために、どの値が将来現れるのを待っていますか？', 1, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('30000000-0000-0000-0000-000000000031', '20000000-0000-0000-0000-000000000001', NULL, 'UNRESOLVED_STATE', 3, '値だけでなく、答えとして返すためにどの付随情報が必要ですか？', 1, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('30000000-0000-0000-0000-000000000032', '20000000-0000-0000-0000-000000000001', NULL, 'UPDATED_REGION', 1, '新しい値が来たとき、保存した状態全体を順番に見直す必要がありますか？', 1, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('30000000-0000-0000-0000-000000000033', '20000000-0000-0000-0000-000000000001', NULL, 'UPDATED_REGION', 2, '現在値から、確認すべき特定の値を計算できますか？', 1, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('30000000-0000-0000-0000-000000000034', '20000000-0000-0000-0000-000000000001', NULL, 'UPDATED_REGION', 3, '先頭や末尾ではなく、特定の key を直接参照する操作を考えてください。', 1, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('30000000-0000-0000-0000-000000000035', '20000000-0000-0000-0000-000000000001', NULL, 'REQUIRED_OPERATIONS', 1, '特定の値が保存されているか確認する必要がありますか？', 1, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('30000000-0000-0000-0000-000000000036', '20000000-0000-0000-0000-000000000001', NULL, 'REQUIRED_OPERATIONS', 2, '存在確認に加えて、その値に対応する何を取得する必要がありますか？', 1, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('30000000-0000-0000-0000-000000000037', '20000000-0000-0000-0000-000000000001', NULL, 'REQUIRED_OPERATIONS', 3, 'key の存在確認、key から index 取得、新しい key/index 登録が必要です。', 1, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('30000000-0000-0000-0000-000000000038', '20000000-0000-0000-0000-000000000001', NULL, 'DATA_STRUCTURE_SELECTION', 4, 'key から value を平均 O(1) で検索・登録できる構造を考えてください。', 1, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
