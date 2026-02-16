# T-023: template-sdk-core

- Status: Planned
- Owner: maintainer
- Branch: `main`
- Prompt-Plan: `ARCHITECT_v1`, `PLANNER_v1`
- Prompt-Impl: `BUILDER_v2`
- Prompt-Review: `GUARDIAN_v1`, `REVIEWER_v1`

## Goal

Define template SDK core contract to onboard additional game templates safely.

## Scope

- In scope:
  - Specify `registerTemplate()` lifecycle and validation contract.
  - Define required editor/runtime integration hooks per template.
- Out of scope:
  - Full implementation of all future template features.

## Acceptance Criteria

1. Template SDK types and contracts are stable and documented.
2. TD template works through SDK contract path.
3. Contract tests guard required hooks and validators.

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
