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
- [x] [S2] Baseline implementation captures reproducible FPS/frame-time/memory-trend metrics for representative packages with low-risk render-path optimizations only.
- [ ] [S3] Regression tests cover baseline evidence shape and repeated preview restart memory-growth guardrails.
- [ ] [S4] If contract-level files change (`runtime/core`, `game/schemas`, `ai`), sync `README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md` in the same loop with updated risk/rollback notes.
- [ ] [S5] Task closure evidence includes passing `pnpm gate:fast`, `pnpm gate:full`, and `pnpm docs:sync-check` plus memory-finalize artifacts.

## Subtasks

- [x] [S1] Define scope and acceptance criteria
- [x] [S2] Implement scoped code changes
- [ ] [S3] Pass fast and full gates
- [ ] [S4] Update docs and risk notes
- [ ] [S5] Milestone commit and memory finalize

## S1 Implementation Notes (2026-02-16)

- Locked `T-016` scope to reproducible local baseline definition, low-risk render-path optimization boundaries, and memory-trend guardrails.
- Converted acceptance criteria into measurable `S1-S5` checklist items so later subtasks can close with deterministic evidence.
- Recorded explicit architecture boundary and contract-doc sync trigger to prevent cross-layer leakage during S2+ implementation.

## S2 Implementation Notes (2026-02-16)

- Optimized `runtime/render/three-adapter.ts` with pooled mesh lifecycle and shared geometry/material resources for map/path layers, reducing per-frame allocations while preserving render-only boundaries.
- Added adapter-level performance telemetry (`allocations`, `poolCapacity`, `activeObjects`) to make object reuse behavior observable without mutating `runtime/core`.
- Implemented deterministic render baseline collector in `runtime/render/performance-baseline.ts`, measuring FPS, frame-time distribution, and restart memory-trend deltas for `td-easy`, `td-normal`, `td-hard`.
- Added `pnpm simulate:render-baseline` CLI (`tools/simulate/run-render-baseline.ts`) with parseable report output and optional memory-growth guardrail threshold (`--max-memory-delta-bytes`).
- Kept implementation scope inside `runtime/render`, `tools/simulate`, and integration tests; no simulation semantics changed in `runtime/core`.

## Change List

- `docs/ai/tasks/T-016-render-performance-baseline.md`: refined S1 scope boundaries and measurable acceptance contract.
- `tests/integration/render-performance-baseline-scope-doc-contract.test.ts`: added S1 doc-contract regression checks for `T-016`.
- `runtime/render/three-adapter.ts`: introduced render-object pooling, shared map/path resources, and adapter performance telemetry for low-risk allocation reduction.
- `runtime/render/performance-baseline.ts`: added deterministic baseline collector for FPS/frame-time/memory-trend reporting across repetitive preview restart sessions.
- `tools/simulate/run-render-baseline.ts`: added baseline CLI with representative package defaults and memory-growth guardrail option.
- `tools/simulate/render-baseline-report.ts`: added standardized, parseable baseline report formatting.
- `package.json`: registered `simulate:render-baseline` command.
- `tests/integration/three-render-adapter-baseline.test.ts`: updated lifecycle assertions for pooled render objects and adapter telemetry.
- `tests/integration/three-render-adapter-interaction.test.ts`: aligned mock object shape with pooled visibility toggling.
- `tests/integration/render-performance-baseline-metrics.test.ts`: added regression coverage for deterministic baseline metrics and memory-trend stability.
- `tests/integration/simulate-render-baseline-cli.test.ts`: added CLI contract coverage for report shape, reproducibility, and option validation.

## Test Evidence

- Commands:
  - `pnpm exec eslint runtime/render/three-adapter.ts runtime/render/performance-baseline.ts tools/simulate/run-render-baseline.ts tools/simulate/render-baseline-report.ts tests/integration/three-render-adapter-baseline.test.ts tests/integration/three-render-adapter-interaction.test.ts tests/integration/render-performance-baseline-metrics.test.ts tests/integration/simulate-render-baseline-cli.test.ts tests/integration/render-performance-baseline-scope-doc-contract.test.ts`
  - `pnpm exec vitest run tests/integration/three-render-adapter-baseline.test.ts tests/integration/three-render-adapter-interaction.test.ts tests/integration/render-performance-baseline-metrics.test.ts tests/integration/simulate-render-baseline-cli.test.ts tests/integration/render-performance-baseline-scope-doc-contract.test.ts`
  - `pnpm typecheck`
  - `pnpm docs:sync-check`
- Result:
  - `pnpm exec eslint runtime/render/three-adapter.ts runtime/render/performance-baseline.ts tools/simulate/run-render-baseline.ts tools/simulate/render-baseline-report.ts tests/integration/three-render-adapter-baseline.test.ts tests/integration/three-render-adapter-interaction.test.ts tests/integration/render-performance-baseline-metrics.test.ts tests/integration/simulate-render-baseline-cli.test.ts tests/integration/render-performance-baseline-scope-doc-contract.test.ts` pass.
  - `pnpm exec vitest run tests/integration/three-render-adapter-baseline.test.ts tests/integration/three-render-adapter-interaction.test.ts tests/integration/render-performance-baseline-metrics.test.ts tests/integration/simulate-render-baseline-cli.test.ts tests/integration/render-performance-baseline-scope-doc-contract.test.ts` pass.
  - `pnpm typecheck` pass.
  - `pnpm docs:sync-check` pass.

## Risks and Rollback

- Risk:
  - Baseline metrics may fluctuate across machines if sampling protocol is underspecified, leading to false-positive regressions.
  - Optimization work may unintentionally mix with gameplay/runtime behavior changes if architecture boundaries are not enforced.
  - Memory-trend guardrails may drift between docs and tests if evidence shape changes without synchronized updates.
- Rollback:
  - Revert `runtime/render/three-adapter.ts`, `runtime/render/performance-baseline.ts`, `tools/simulate/run-render-baseline.ts`, `tools/simulate/render-baseline-report.ts`, `package.json`, `tests/integration/three-render-adapter-baseline.test.ts`, `tests/integration/three-render-adapter-interaction.test.ts`, `tests/integration/render-performance-baseline-metrics.test.ts`, `tests/integration/simulate-render-baseline-cli.test.ts`, `docs/ai/tasks/T-016-render-performance-baseline.md`, and `tests/integration/render-performance-baseline-scope-doc-contract.test.ts` together.


## Subtask Progress
- [x] [S1] Define scope and acceptance criteria
- [x] [S2] Implement scoped code changes


## Subtask Progress
- [x] [S2] Implement scoped code changes