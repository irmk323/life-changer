# Problem catalogue import format

Phase 2 seeds the catalogue through Flyway. A later reviewed NeetCode 150
expansion may use this metadata-only JSON shape:

```json
{"problems":[{"leetcodeNumber":1,"title":"Two Sum","slug":"two-sum","difficulty":"EASY","neetcodeCategory":"ARRAYS_AND_HASHING","externalUrl":"https://leetcode.com/problems/two-sum/","active":true,"patternCodes":["HASH_LOOKUP"],"primaryPatternCode":"HASH_LOOKUP"}]}
```

`slug`, a non-null `leetcodeNumber`, and `pattern.code` are unique. Import data
must not contain problem statements, examples, editorial text, or solutions.
The importer itself is intentionally deferred to the data-exchange phase.

