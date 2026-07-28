# Repository instructions

## Product source of truth

Before planning or changing code, read:

- `docs/product-spec.md`

The purpose of this application is not simply to track solved LeetCode
problems. It must train and measure the cognitive steps used to derive an
algorithm and transfer it to unseen problems.

When implementation convenience conflicts with the learning model in
`docs/product-spec.md`, preserve the learning model.

## Technical constraints

- Java 21
- Spring Boot
- Maven Wrapper
- Spring MVC
- Thymeleaf
- HTMX or minimal vanilla JavaScript
- Spring Data JPA
- H2 file database
- Flyway
- JUnit 5
- Local single-user application
- No authentication
- No required Node.js build
- No telemetry
- No external AI API by default
- No LeetCode or NeetCode scraping
- Package by feature
- Keep business logic out of controllers

## Working rules

- Do not attempt to implement the entire product in one change.
- Work in small vertical slices.
- Keep the application runnable after each phase.
- Add or update tests for business logic.
- Run the relevant tests before completing a task.
- Document important assumptions.
- Do not silently remove requirements from `docs/product-spec.md`.
- Prefer simple, maintainable implementations over speculative abstractions.

## Commands

Run the application:

```bash
./mvnw spring-boot:run
```
Run tests:

```bash
./mvnw test
```

## Initial delivery order
1.Architecture and implementation plan
2.Spring Boot project scaffold
3.Problem and Pattern model
4.Attempt and StageAssessment workflow
5.Progressive hints
6.Review scheduling
7.Rule-based coaching
8.Dashboard and analytics
9.Import and export
10.NeetCode 150 expansion