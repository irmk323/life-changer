INSERT INTO pattern (id, name, description, trigger_clues, created_at, updated_at) VALUES
('10000000-0000-0000-0000-000000000001', 'Hash map lookup', 'Store previously seen values for direct complement or key lookup.', 'A value must be matched to an earlier value and repeated searching would be costly.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('10000000-0000-0000-0000-000000000002', 'Monotonic stack', 'Keep unresolved candidates in an order that lets a new value resolve a suffix.', 'Each element seeks a nearest greater or smaller element and a new input can settle older candidates.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('10000000-0000-0000-0000-000000000003', 'Stack matching', 'Match closing events with the latest unmatched opening event.', 'Nested structure and last-opened, first-closed relationships matter.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('10000000-0000-0000-0000-000000000004', 'Single-pass running optimum', 'Track the best state so far while scanning once.', 'An answer at this position depends on an optimal value from an earlier prefix.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('10000000-0000-0000-0000-000000000005', 'Binary search', 'Discard an ordered half of the search space after each comparison.', 'Input is ordered and a comparison determines which half cannot contain the answer.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('10000000-0000-0000-0000-000000000006', 'Pointer rewiring', 'Preserve the next link before changing it and advance a small set of pointers.', 'A linked structure must be transformed in place while avoiding loss of the remaining chain.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('10000000-0000-0000-0000-000000000007', 'Tree traversal', 'Visit nodes recursively or iteratively while accumulating information from a subtree.', 'The input is hierarchical and the result combines child results.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('10000000-0000-0000-0000-000000000008', 'Graph traversal', 'Explore each reachable node once while marking visited state.', 'Connected cells or nodes must be grouped, reached, or counted.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO problem (id, leetcode_number, title, slug, external_url, difficulty, neetcode_category, active, created_at, updated_at) VALUES
('20000000-0000-0000-0000-000000000001', 1, 'Two Sum', 'two-sum', 'https://leetcode.com/problems/two-sum/', 'EASY', 'Arrays & Hashing', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('20000000-0000-0000-0000-000000000002', 20, 'Valid Parentheses', 'valid-parentheses', 'https://leetcode.com/problems/valid-parentheses/', 'EASY', 'Stack', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('20000000-0000-0000-0000-000000000003', 33, 'Search in Rotated Sorted Array', 'search-in-rotated-sorted-array', 'https://leetcode.com/problems/search-in-rotated-sorted-array/', 'MEDIUM', 'Binary Search', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('20000000-0000-0000-0000-000000000004', 121, 'Best Time to Buy and Sell Stock', 'best-time-to-buy-and-sell-stock', 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', 'EASY', 'Sliding Window', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('20000000-0000-0000-0000-000000000005', 200, 'Number of Islands', 'number-of-islands', 'https://leetcode.com/problems/number-of-islands/', 'MEDIUM', 'Graphs', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('20000000-0000-0000-0000-000000000006', 206, 'Reverse Linked List', 'reverse-linked-list', 'https://leetcode.com/problems/reverse-linked-list/', 'EASY', 'Linked List', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('20000000-0000-0000-0000-000000000007', 104, 'Maximum Depth of Binary Tree', 'maximum-depth-of-binary-tree', 'https://leetcode.com/problems/maximum-depth-of-binary-tree/', 'EASY', 'Trees', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('20000000-0000-0000-0000-000000000008', 739, 'Daily Temperatures', 'daily-temperatures', 'https://leetcode.com/problems/daily-temperatures/', 'MEDIUM', 'Stack', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO problem_pattern (problem_id, pattern_id, primary_pattern, notes) VALUES
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', TRUE, 'Use the required lookup operation before naming the structure.'),
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', TRUE, 'The unresolved state is unmatched opening brackets.'),
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000005', TRUE, 'A comparison identifies a half that can be discarded.'),
('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', TRUE, 'Track the lowest prior price while scanning.'),
('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000008', TRUE, 'Visited cells prevent repeated component work.'),
('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000006', TRUE, 'Save the next node before changing a link.'),
('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000007', TRUE, 'Depth is derived from child subtrees.'),
('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000002', TRUE, 'A new temperature resolves a suffix of unresolved indices.');
