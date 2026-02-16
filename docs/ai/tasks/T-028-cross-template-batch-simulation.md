# T-028: cross-template-batch-simulation

- Status: Planned
- Owner: maintainer
- Branch: `main`
- Prompt-Plan: `ARCHITECT_v1`, `PLANNER_v1`
- Prompt-Impl: `BUILDER_v2`
- Prompt-Review: `GUARDIAN_v1`, `REVIEWER_v1`

## Goal

Support batch simulation across templates with unified metrics and reporting.

## Scope

- In scope:
  - Generalize batch runner contracts for template-specific runners.
  - Keep a shared report format with template dimension fields.
- Out of scope:
  - Cross-template matchmaking or economy balancing.

## Acceptance Criteria

1. Batch simulation works for TD and RPG packages.
2. Report output remains parseable and deterministic.
3. Performance baseline commands are documented per template.

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
