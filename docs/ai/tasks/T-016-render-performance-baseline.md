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
  - Define a reproducible render-performance baseline protocol for representative packages (`td-easy`, `td-normal`, `td-hard`) under repetitive preview restart sessions.
  - Define required metrics and evidence format for FPS, frame-time distribution, and memory-trend deltas so baseline output is locally comparable.
  - Constrain optimization work to low-risk render-path changes (object reuse, allocation reduction, lifecycle cleanup) inside `runtime/render` and editor preview integration.
  - Define regression coverage expectations for baseline command/report output and memory-growth guardrails without crossing runtime architecture boundaries.
  - Keep simulation semantics in `runtime/core` unchanged; render-side work must stay read-only with respect to gameplay state.
- Out of scope:
  - Aggressive engine rewrite, custom WebGL pipeline migration, or renderer-stack replacement.
  - Gameplay rebalance, schema redesign, or feature work unrelated to render performance baselines.
  - Remote telemetry pipeline, cloud profiling infrastructure, or production monitoring rollout.
  - Browser/GPU-vendor-specific tuning that cannot be validated deterministically in local CI gates.

## Acceptance Criteria

- [x] [S1] Scope and acceptance contract explicitly defines measurement protocol, optimization boundaries, architecture constraints, and out-of-scope limits for `T-016`.
- [ ] [S2] Baseline implementation captures reproducible FPS/frame-time/memory-trend metrics for representative packages with low-risk render-path optimizations only.
- [ ] [S3] Regression tests cover baseline evidence shape and repeated preview restart memory-growth guardrails.
- [ ] [S4] If contract-level files change (`runtime/core`, `game/schemas`, `ai`), sync `README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md` in the same loop with updated risk/rollback notes.
- [ ] [S5] Task closure evidence includes passing `pnpm gate:fast`, `pnpm gate:full`, and `pnpm docs:sync-check` plus memory-finalize artifacts.

## Subtasks

- [x] [S1] Define scope and acceptance criteria
- [ ] [S2] Implement scoped code changes
- [ ] [S3] Pass fast and full gates
- [ ] [S4] Update docs and risk notes
- [ ] [S5] Milestone commit and memory finalize

## S1 Implementation Notes (2026-02-16)

- Locked `T-016` scope to reproducible local baseline definition, low-risk render-path optimization boundaries, and memory-trend guardrails.
- Converted acceptance criteria into measurable `S1-S5` checklist items so later subtasks can close with deterministic evidence.
- Recorded explicit architecture boundary and contract-doc sync trigger to prevent cross-layer leakage during S2+ implementation.

## Change List

- `docs/ai/tasks/T-016-render-performance-baseline.md`: refined S1 scope boundaries and measurable acceptance contract.
- `tests/integration/render-performance-baseline-scope-doc-contract.test.ts`: added S1 doc-contract regression checks for `T-016`.

## Test Evidence

- Commands:
- `pnpm exec eslint tests/integration/render-performance-baseline-scope-doc-contract.test.ts`
- `pnpm exec vitest run tests/integration/render-performance-baseline-scope-doc-contract.test.ts`
- `pnpm docs:sync-check`
- Result:
- `pnpm exec eslint tests/integration/render-performance-baseline-scope-doc-contract.test.ts` pass.
- `pnpm exec vitest run tests/integration/render-performance-baseline-scope-doc-contract.test.ts` pass (4 tests).
- `pnpm docs:sync-check` pass.

## Risks and Rollback

- Risk:
  - Baseline metrics may fluctuate across machines if sampling protocol is underspecified, leading to false-positive regressions.
  - Optimization work may unintentionally mix with gameplay/runtime behavior changes if architecture boundaries are not enforced.
  - Memory-trend guardrails may drift between docs and tests if evidence shape changes without synchronized updates.
- Rollback:
  - Revert `docs/ai/tasks/T-016-render-performance-baseline.md` and `tests/integration/render-performance-baseline-scope-doc-contract.test.ts` together to restore the previous planning contract.


## Subtask Progress
- [x] [S1] Define scope and acceptance criteria