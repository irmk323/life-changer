# LeetCode Thinking Trainer

A local learning tool for practising the cognitive steps between reading an
algorithm problem and deriving a solution. It is designed to measure and train
relation extraction, brute force, repeated work, unresolved state, update
region, operations, invariants, implementation, and transfer—not just a list
of solved problems.

## Current scope

This is a local evidence-recording prototype, not yet the adaptive curriculum
engine described in `docs/redesign/`. It includes an eight-problem metadata-only
catalogue, 13-stage Attempts, nullable stage assessments, progressive hints,
reference-answer reveal history, reviews, FailureLabels, rule-based coaching,
post-attempt summaries, weekly focus, analytics, and an initial
implementation-error recording scaffold.

The fixed 13-stage workflow and automatic review sequence are legacy behaviour
scheduled for replacement. NeetCode 150 metadata, protected holdouts, adaptive
sessions, mastery projections, task selection, complete implementation repair,
and import/export are not implemented yet.

The application stores problem names, slugs, difficulty, category, external
links, and app-authored pattern metadata. It does not scrape or copy LeetCode
or NeetCode problem statements, editorial content, or solutions.

## Prerequisites

- Java 21
- No Node.js or external service is required.

## Start

```bash
./mvnw spring-boot:run
```

Open <http://localhost:8080>. The local JSON status endpoint is
<http://localhost:8080/status>.

## Test

```bash
./mvnw test
```

Tests use an in-memory H2 database. They do not read or alter the local
application database.

## Local data and privacy

By default, H2 files are stored inside this project but outside the build directory at:

```text
./data/leetcode-thinking-trainer.*
```

Maven dependencies are also cached locally in `./.m2/repository/`, so project
builds do not need to create files elsewhere. To use another project-local data
directory, set `LEETCODE_TRAINER_DATA_DIR` before startup; the database file
remains named `leetcode-thinking-trainer` in that directory. For example:

```bash
LEETCODE_TRAINER_DATA_DIR=./local-data ./mvnw spring-boot:run
```

This is a single-user local application with no authentication, telemetry,
external AI API, or external service dependency. Future export/import and an
explicit data-deletion workflow will be added in later phases.
