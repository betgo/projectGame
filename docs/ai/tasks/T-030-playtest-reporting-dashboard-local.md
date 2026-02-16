# T-030: playtest-reporting-dashboard-local

- Status: Planned
- Owner: maintainer
- Branch: `main`
- Prompt-Plan: `ARCHITECT_v1`, `PLANNER_v1`
- Prompt-Impl: `BUILDER_v2`
- Prompt-Review: `GUARDIAN_v1`, `REVIEWER_v1`

## Goal

Provide local playtest reporting dashboard to summarize simulation and preview signals.

## Scope

- In scope:
  - Aggregate run metrics and error summaries into local-readable report views.
  - Support quick comparison between baseline and latest runs.
- Out of scope:
  - Hosted analytics service and user tracking.

## Acceptance Criteria

1. Dashboard/report can be generated from local artifacts only.
2. Core metrics trend is visible for recent runs.
3. Report generation is reproducible via one command.

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
