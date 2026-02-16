# T-016: render-performance-baseline

- Status: Planned
- Owner: maintainer
- Branch: `main`
- Prompt-Plan: `ARCHITECT_v1`, `PLANNER_v1`
- Prompt-Impl: `BUILDER_v2`
- Prompt-Review: `GUARDIAN_v1`, `REVIEWER_v1`

## Goal

Establish render performance baseline and optimization guardrails for repetitive preview sessions.

## Scope

- In scope:
  - Measure baseline FPS/frame time/memory trend for representative packages.
  - Apply low-risk optimizations such as object reuse and minimal allocations.
- Out of scope:
  - Aggressive engine rewrite or custom WebGL pipeline.

## Acceptance Criteria

1. Performance baseline report is reproducible locally.
2. No obvious memory growth across repeated preview restarts.
3. Baseline thresholds are documented in task evidence.

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
