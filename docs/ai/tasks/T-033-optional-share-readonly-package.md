# T-033: optional-share-readonly-package

- Status: Planned
- Owner: maintainer
- Branch: `main`
- Prompt-Plan: `ARCHITECT_v1`, `PLANNER_v1`
- Prompt-Impl: `BUILDER_v2`
- Prompt-Review: `GUARDIAN_v1`, `REVIEWER_v1`

## Goal

Add optional readonly package sharing mechanism without introducing account system.

## Scope

- In scope:
  - Define readonly package export format and sharing constraints.
  - Provide local-only or static-host compatible share artifact flow.
- Out of scope:
  - Authenticated collaboration and write-back editing.

## Acceptance Criteria

1. Shared package can be loaded in readonly preview mode.
2. Share artifact does not expose unsafe editable controls.
3. Security and limitation notes are documented.

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
