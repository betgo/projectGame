# T-031: release-candidate-checklist-automation

- Status: Planned
- Owner: maintainer
- Branch: `main`
- Prompt-Plan: `ARCHITECT_v1`, `PLANNER_v1`
- Prompt-Impl: `BUILDER_v2`
- Prompt-Review: `GUARDIAN_v1`, `REVIEWER_v1`

## Goal

Automate release candidate checklist generation and gate evidence bundling.

## Scope

- In scope:
  - Compile gate/test/docs evidence into release checklist artifacts.
  - Add scriptable validation for must-pass release checks.
- Out of scope:
  - Automated production deployment pipeline.

## Acceptance Criteria

1. RC checklist artifact is generated deterministically.
2. Missing evidence fails checklist generation.
3. Release docs reference the automation command.

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
