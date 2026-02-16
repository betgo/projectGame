# T-017: preview-debug-overlay

- Status: Planned
- Owner: maintainer
- Branch: `main`
- Prompt-Plan: `ARCHITECT_v1`, `PLANNER_v1`
- Prompt-Impl: `BUILDER_v2`
- Prompt-Review: `GUARDIAN_v1`, `REVIEWER_v1`

## Goal

Add preview debug overlay for runtime tick/seed/metrics and error diagnostics.

## Scope

- In scope:
  - Expose essential runtime diagnostics in preview UI.
  - Surface validation/runtime error summaries with actionable hints.
- Out of scope:
  - Remote telemetry backend integration.

## Acceptance Criteria

1. Overlay shows tick, elapsed time, seed, and key metrics.
2. Errors are visible without crashing preview flow.
3. Docs include quick troubleshooting notes.

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
