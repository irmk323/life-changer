ALTER TABLE pattern ADD COLUMN code VARCHAR(100);
ALTER TABLE pattern ADD COLUMN typical_brute_force CLOB;
ALTER TABLE pattern ADD COLUMN repeated_work CLOB;
ALTER TABLE pattern ADD COLUMN unresolved_state CLOB;
ALTER TABLE pattern ADD COLUMN resolution_event CLOB;
ALTER TABLE pattern ADD COLUMN updated_region CLOB;
ALTER TABLE pattern ADD COLUMN required_operations CLOB;
ALTER TABLE pattern ADD COLUMN invariant_description CLOB;
ALTER TABLE pattern ADD COLUMN correctness_notes CLOB;
ALTER TABLE pattern ADD COLUMN complexity_notes CLOB;
ALTER TABLE pattern ADD COLUMN common_mistakes CLOB;
ALTER TABLE pattern ADD COLUMN contrast_cases CLOB;
ALTER TABLE pattern ADD COLUMN java_notes CLOB;

ALTER TABLE problem_pattern ADD COLUMN created_at TIMESTAMP WITH TIME ZONE;
UPDATE problem_pattern SET created_at = CURRENT_TIMESTAMP;
ALTER TABLE problem_pattern ALTER COLUMN created_at SET NOT NULL;

UPDATE problem SET neetcode_category = 'ARRAYS_AND_HASHING' WHERE neetcode_category = 'Arrays & Hashing';
UPDATE problem SET neetcode_category = 'SLIDING_WINDOW' WHERE neetcode_category = 'Sliding Window';
UPDATE problem SET neetcode_category = 'STACK' WHERE neetcode_category = 'Stack';
UPDATE problem SET neetcode_category = 'BINARY_SEARCH' WHERE neetcode_category = 'Binary Search';
UPDATE problem SET neetcode_category = 'LINKED_LIST' WHERE neetcode_category = 'Linked List';
UPDATE problem SET neetcode_category = 'TREES' WHERE neetcode_category = 'Trees';
UPDATE problem SET neetcode_category = 'GRAPHS' WHERE neetcode_category = 'Graphs';

UPDATE problem SET leetcode_number = 704, title = 'Binary Search', slug = 'binary-search',
    external_url = 'https://leetcode.com/problems/binary-search/'
WHERE id = '20000000-0000-0000-0000-000000000003';

UPDATE pattern SET code = 'HASH_LOOKUP',
    typical_brute_force = 'Compare every pair of values until a matching relationship is found.',
    repeated_work = 'The same values are repeatedly searched for compatible partners.',
    unresolved_state = 'Previously seen values that may satisfy a later complement lookup.',
    resolution_event = 'The required complement already exists in the lookup.',
    updated_region = 'A key addressed directly by value.',
    required_operations = 'Store by key; look up a key; add a new key.',
    invariant_description = 'The map contains each processed value and the information needed to use it later.',
    complexity_notes = 'Each lookup and insertion is expected O(1), so the scan is O(n).',
    common_mistakes = 'Using the same element twice or storing before checking an invalid self-match.',
    contrast_cases = 'Ordered input may permit two pointers instead of a hash lookup.',
    java_notes = 'Use HashMap and check containsKey before inserting the current value.'
WHERE id = '10000000-0000-0000-0000-000000000001';

UPDATE pattern SET code = 'MONOTONIC_STACK',
    typical_brute_force = 'For each index, scan right until the first greater temperature is found.',
    repeated_work = 'Several starting indices inspect the same future temperatures.',
    unresolved_state = 'Past indices still waiting for their next warmer day.',
    resolution_event = 'The current temperature is greater than an unresolved past temperature.',
    updated_region = 'A contiguous suffix of unresolved candidates.',
    required_operations = 'Inspect the end; remove from the end; add to the end; repeat while the condition holds.',
    invariant_description = 'Temperatures in the stack decrease from older to newer indices.',
    correctness_notes = 'Once a candidate is not resolved by the current value, deeper candidates cannot be resolved either.',
    complexity_notes = 'Each index is pushed once and popped at most once, giving O(n) time.',
    common_mistakes = 'Searching for the maximum rather than the first greater value, or losing indices needed for distances.',
    contrast_cases = 'Right-side maximum and greater-element count use different retained information.',
    java_notes = 'Use ArrayDeque<Integer> as an index stack; do not use the legacy Stack class.'
WHERE id = '10000000-0000-0000-0000-000000000002';

UPDATE pattern SET code = 'STACK_MATCHING', typical_brute_force = 'Match each closer by searching backwards for an unmatched opener.', repeated_work = 'Earlier unmatched openers are revisited.', unresolved_state = 'Opening symbols without a matching closer.', resolution_event = 'A closer matches the latest opener.', updated_region = 'The newest unresolved opener.', required_operations = 'Add, inspect, and remove at one end.', invariant_description = 'The stack contains unmatched opening symbols in encounter order.', complexity_notes = 'Each symbol is pushed and popped at most once: O(n).', common_mistakes = 'Matching the wrong bracket type or accepting remaining openers.', contrast_cases = 'Counting symbols cannot validate nesting.', java_notes = 'Use ArrayDeque<Character>.' WHERE id = '10000000-0000-0000-0000-000000000003';
UPDATE pattern SET code = 'SINGLE_PASS_MINIMUM_TRACKING', typical_brute_force = 'Compare every sell day with all earlier buy days.', repeated_work = 'The same earlier prices are reconsidered for later days.', unresolved_state = 'The lowest buy price seen so far.', resolution_event = 'A new price can improve the current sale profit.', updated_region = 'One running minimum and one best result.', required_operations = 'Compare and replace a minimum; compare and replace a maximum profit.', invariant_description = 'The minimum is the lowest price before the current day.', complexity_notes = 'One scan gives O(n) time and O(1) space.', common_mistakes = 'Selling before buying or resetting the minimum after calculating profit.', contrast_cases = 'Multiple transactions require a different state model.', java_notes = 'Track minPrice and maxProfit as integers.' WHERE id = '10000000-0000-0000-0000-000000000004';
UPDATE pattern SET code = 'BINARY_SEARCH', typical_brute_force = 'Scan the ordered sequence from left to right.', repeated_work = 'Values in a discarded half would otherwise be inspected individually.', unresolved_state = 'The current inclusive search interval.', resolution_event = 'Comparison proves one half cannot contain the target.', updated_region = 'The left or right half of the interval.', required_operations = 'Inspect midpoint; move lower or upper bound.', invariant_description = 'If the target exists, it lies within the current bounds.', complexity_notes = 'The interval halves each iteration: O(log n).', common_mistakes = 'Off-by-one bounds and loops that do not progress.', contrast_cases = 'Unordered input needs a different search strategy.', java_notes = 'Use mid = left + (right - left) / 2.' WHERE id = '10000000-0000-0000-0000-000000000005';
UPDATE pattern SET code = 'ITERATIVE_POINTER_REVERSAL', typical_brute_force = 'Copy values to another structure and rebuild links.', repeated_work = 'A copy stores information that can be preserved with a next pointer.', unresolved_state = 'The unprocessed suffix and already reversed prefix.', resolution_event = 'The current node link is redirected to the reversed prefix.', updated_region = 'The current node and the boundary pointers.', required_operations = 'Read next; replace a link; advance pointers.', invariant_description = 'prev is the reversed prefix and current begins the remaining suffix.', complexity_notes = 'Each node is visited once: O(n) time and O(1) extra space.', common_mistakes = 'Changing next before saving it.', contrast_cases = 'Reversing a sublist requires boundary reconnection.', java_notes = 'Keep prev, current, and next variables.' WHERE id = '10000000-0000-0000-0000-000000000006';
UPDATE pattern SET code = 'TREE_DFS', typical_brute_force = 'Traverse every node and record its depth.', repeated_work = 'Parent depth information is carried repeatedly into descendants.', unresolved_state = 'Subtrees whose contribution is still being computed.', resolution_event = 'Child depths return to their parent.', updated_region = 'The current subtree result.', required_operations = 'Visit children; combine their results.', invariant_description = 'A call returns the correct result for its subtree.', complexity_notes = 'Every node is visited once: O(n) time and O(h) call stack.', common_mistakes = 'Incorrect null base case.', contrast_cases = 'Breadth-first traversal is useful when level order matters.', java_notes = 'Return 0 for null and 1 + max(left, right) otherwise.' WHERE id = '10000000-0000-0000-0000-000000000007';
UPDATE pattern SET code = 'GRAPH_GRID_TRAVERSAL', typical_brute_force = 'For each land cell, repeatedly search nearby cells without marking work done.', repeated_work = 'Cells in the same component are revisited.', unresolved_state = 'Reachable but not yet explored cells.', resolution_event = 'A valid unvisited neighbour is discovered.', updated_region = 'A connected component reached through adjacency.', required_operations = 'Mark visited; add a neighbour; remove the next node to explore.', invariant_description = 'Every marked cell belongs to a component already discovered.', complexity_notes = 'Each cell is visited at most once: O(rows * columns).', common_mistakes = 'Forgetting bounds, water checks, or visited marking.', contrast_cases = 'Shortest paths may require BFS distance tracking.', java_notes = 'Use recursive DFS or an explicit ArrayDeque.' WHERE id = '10000000-0000-0000-0000-000000000008';

ALTER TABLE pattern ALTER COLUMN code SET NOT NULL;
CREATE UNIQUE INDEX pattern_code_unique_idx ON pattern(code);
CREATE UNIQUE INDEX problem_leetcode_number_unique_idx ON problem(leetcode_number);
