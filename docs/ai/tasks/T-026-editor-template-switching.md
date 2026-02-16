# T-026: editor-template-switching

- Status: Planned
- Owner: maintainer
- Branch: `main`
- Prompt-Plan: `ARCHITECT_v1`, `PLANNER_v1`
- Prompt-Impl: `BUILDER_v2`
- Prompt-Review: `GUARDIAN_v1`, `REVIEWER_v1`

## Goal

Enable editor template switching while preserving data safety and UX clarity.

## Scope

- In scope:
  - Allow template-aware editor mode switch and payload panel routing.
  - Add safety checks when switching incompatible template data.
- Out of scope:
  - Live migration wizard for all template combinations.

## Acceptance Criteria

1. Editor can create/load projects for at least TD and RPG templates.
2. Switch behavior provides clear warnings on incompatible fields.
3. No cross-template data corruption in save/export.

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
