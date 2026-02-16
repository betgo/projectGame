# T-020: schema-versioning-and-migration-lite

- Status: Planned
- Owner: maintainer
- Branch: `main`
- Prompt-Plan: `ARCHITECT_v1`, `PLANNER_v1`
- Prompt-Impl: `BUILDER_v2`
- Prompt-Review: `GUARDIAN_v1`, `REVIEWER_v1`

## Goal

Introduce lightweight schema versioning and migration support for package evolution.

## Scope

- In scope:
  - Define schema version bump rules for compatible/non-compatible changes.
  - Provide minimal migration helpers for one minor version window.
- Out of scope:
  - Long-term multi-major migration framework.

## Acceptance Criteria

1. Older supported package versions can be loaded or migrated.
2. Migration behavior is documented with examples.
3. Schema tests cover version edge cases.

## Subtasks

- [ ] [S1] Define scope and acceptance criteria
- [ ] [S2] Implement scoped code changes and pass fast/full gates
- [ ] [S3] Update docs and risk notes
- [ ] [S4] Finalize memory and complete task-level commit

## Change List

## Test Evidence

- Commands:
- Result:

## Risks and Rollback

- Risk:
- Rollback:
