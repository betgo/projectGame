# T-022: golden-pack-regression-suite

- Status: Planned
- Owner: maintainer
- Branch: `main`
- Prompt-Plan: `ARCHITECT_v1`, `PLANNER_v1`
- Prompt-Impl: `BUILDER_v2`
- Prompt-Review: `GUARDIAN_v1`, `REVIEWER_v1`

## Goal

Create golden package regression suite to protect core gameplay/runtime contracts.

## Scope

- In scope:
  - Add representative golden packages for TD and future templates.
  - Automate replay checks for deterministic outcomes and key metrics.
- Out of scope:
  - Massive benchmark dataset curation.

## Acceptance Criteria

1. Golden suite runs in CI/local without flaky outcomes.
2. Contract regressions are detected with clear diff output.
3. Suite maintenance guide is documented.

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
