# T-029: asset-pipeline-lite

- Status: Planned
- Owner: maintainer
- Branch: `main`
- Prompt-Plan: `ARCHITECT_v1`, `PLANNER_v1`
- Prompt-Impl: `BUILDER_v2`
- Prompt-Review: `GUARDIAN_v1`, `REVIEWER_v1`

## Goal

Define lightweight asset pipeline conventions for placeholders and future upgrades.

## Scope

- In scope:
  - Set naming, folder, and metadata conventions for local assets.
  - Add validation checks for missing/invalid asset references.
- Out of scope:
  - Enterprise-grade DCC integration pipeline.

## Acceptance Criteria

1. Asset conventions are documented and enforced in basic checks.
2. Preview can fall back gracefully on missing assets.
3. Onboarding docs include asset workflow examples.

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
