# T-021: import-export-diagnostics

- Status: Planned
- Owner: maintainer
- Branch: `main`
- Prompt-Plan: `ARCHITECT_v1`, `PLANNER_v1`
- Prompt-Impl: `BUILDER_v2`
- Prompt-Review: `GUARDIAN_v1`, `REVIEWER_v1`

## Goal

Strengthen import/export diagnostics to make data errors easy to locate and fix.

## Scope

- In scope:
  - Improve error reporting for malformed JSON and semantic violations.
  - Return structured diagnostics with field-level hints.
- Out of scope:
  - Cloud storage sync and external package marketplace.

## Acceptance Criteria

1. Import failures provide actionable error code + path + hint.
2. Export contract remains deterministic and schema-valid.
3. Integration tests cover top failure scenarios.

## Subtasks

- [ ] [S1] Define scope and acceptance criteria
- [ ] [S2] Implement scoped code changes
- [ ] [S3] Pass fast and full gates
- [ ] [S4] Update docs and risk notes
- [ ] [S5] Milestone commit and memory finalize

## Change List

## Test Evidence

- Commands:
- Result:

## Risks and Rollback

- Risk:
- Rollback:
