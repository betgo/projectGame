# T-027: ai-multi-template-package-generation

- Status: Planned
- Owner: maintainer
- Branch: `main`
- Prompt-Plan: `ARCHITECT_v1`, `PLANNER_v1`
- Prompt-Impl: `BUILDER_v2`
- Prompt-Review: `GUARDIAN_v1`, `REVIEWER_v1`

## Goal

Extend AI pipeline to generate packages across multiple templates using template routing.

## Scope

- In scope:
  - Add template-aware prompt compilation and package generation constraints.
  - Keep provider abstraction unchanged while adding template-specific validation loop.
- Out of scope:
  - Provider-specific optimizations tied to one model vendor.

## Acceptance Criteria

1. AI generation supports TD and RPG template IDs.
2. Generated packages pass template-specific validate/smoke checks.
3. Repair loop handles template diagnostics properly.

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
