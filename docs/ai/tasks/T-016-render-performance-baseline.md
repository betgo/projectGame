# T-016: render-performance-baseline

- Status: Done
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
- [x] [S3] Regression tests cover baseline evidence shape and repeated preview restart memory-growth guardrails.
- [x] [S4] If contract-level files change (`runtime/core`, `game/schemas`, `ai`), sync `README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md` in the same loop with updated risk/rollback notes.
- [x] [S5] Task closure evidence includes passing `pnpm gate:fast`, `pnpm gate:full`, and `pnpm docs:sync-check` plus memory-finalize artifacts.

## Subtasks

- [x] [S1] Define scope and acceptance criteria
- [x] [S2] Implement scoped code changes
- [x] [S3] Pass fast and full gates
- [x] [S4] Update docs and risk notes
- [x] [S5] Milestone commit and memory finalize

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

## S3 Implementation Notes (2026-02-16)

- Re-ran `pnpm gate:fast` and confirmed `typecheck`, `test:determinism`, and `test:schema` pass with render-baseline changes enabled.
- Re-ran `pnpm gate:full` and confirmed lint plus full regression suites pass, including render-baseline metrics/CLI contracts and smoke coverage.
- Verified gate pass results without touching contract-level files (`runtime/core`, `game/schemas`, `ai`), keeping architecture boundaries intact for upcoming S4/S5 work.

## S4 Documentation and Risk Notes (2026-02-16)

- Synchronized render-baseline contract wording across `README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md` for command shape, default package set, deterministic protocol defaults, output evidence format, and memory guardrail behavior.
- Confirmed documentation keeps architecture boundaries explicit: baseline logic in `runtime/render/performance-baseline.ts` remains render-only and must not mutate `runtime/core`.
- Expanded risk and rollback notes to cover docs drift across the synchronized doc set and to include explicit rollback scope for documentation + doc-contract test artifacts.

## S5 Memory Finalization and Task Closure (2026-02-16)

- Re-ran closure gates and confirmed pass evidence for `pnpm gate:fast`, `pnpm gate:full`, and `pnpm docs:sync-check`.
- Executed memory refresh commands `bash tools/git-memory/append-commit-log.sh --missing HEAD` and `bash tools/git-memory/update-weekly-summary.sh`; backfilled missing commit `23b5502` into `docs/ai/commit-log/2026-02.md`, regenerated `docs/ai/weekly-summary.md`, then rechecked `--missing` to confirm `No missing commits to append.`.
- Updated `docs/ai/ai-loop-status.md` to the `T-016` S5 closure handoff state (`Issue: 16`, no remaining subtasks, next-step command `pnpm task:next`).
- Closed task metadata by setting status to `Done` and marking S5 acceptance/subtask checkboxes complete.
- Honored the explicit no-commit constraint for this run; milestone and memory finalize evidence is captured through docs/tests artifacts only.
- Kept S5 closure scope limited to docs/tests and memory verification; no runtime/render contract files were changed.

## Change List

- `docs/ai/tasks/T-016-render-performance-baseline.md`: refined S1-S4 task contract details, then finalized S5 closure notes, status metadata, and gate/memory evidence.
- `tests/integration/render-performance-baseline-scope-doc-contract.test.ts`: advanced assertions from S4 complete + S5 pending to full S5 closure contract coverage.
- `runtime/render/three-adapter.ts`: introduced render-object pooling, shared map/path resources, and adapter performance telemetry for low-risk allocation reduction.
- `runtime/render/performance-baseline.ts`: added deterministic baseline collector for FPS/frame-time/memory-trend reporting across repetitive preview restart sessions.
- `tools/simulate/run-render-baseline.ts`: added baseline CLI with representative package defaults and memory-growth guardrail option.
- `tools/simulate/render-baseline-report.ts`: added standardized, parseable baseline report formatting.
- `package.json`: registered `simulate:render-baseline` command.
- `tests/integration/three-render-adapter-baseline.test.ts`: updated lifecycle assertions for pooled render objects and adapter telemetry.
- `tests/integration/three-render-adapter-interaction.test.ts`: aligned mock object shape with pooled visibility toggling.
- `tests/integration/render-performance-baseline-metrics.test.ts`: added regression coverage for deterministic baseline metrics and memory-trend stability.
- `tests/integration/simulate-render-baseline-cli.test.ts`: added CLI contract coverage for report shape, reproducibility, and option validation.
- `README.md`: synchronized render contract note with render-baseline command defaults, deterministic protocol parameters, output format, and memory guardrail contract.
- `docs/ai/README.md`: synchronized render-baseline governance wording with `README.md` and architecture-boundary expectations.
- `docs/ai/workflows/continuous-loop.md`: synchronized loop-level render-baseline handoff contract wording and evidence expectations.
- `docs/ai/ai-loop-status.md`: switched loop board to `T-016` S5 closure handoff status with explicit no-next-subtask state.
- `docs/ai/commit-log/2026-02.md`: backfilled missing `T-016` S4 milestone entry during S5 memory refresh.
- `docs/ai/weekly-summary.md`: regenerated weekly summary from refreshed commit-log artifacts.

## Test Evidence

- Commands:
  - `pnpm exec eslint runtime/render/three-adapter.ts runtime/render/performance-baseline.ts tools/simulate/run-render-baseline.ts tools/simulate/render-baseline-report.ts tests/integration/three-render-adapter-baseline.test.ts tests/integration/three-render-adapter-interaction.test.ts tests/integration/render-performance-baseline-metrics.test.ts tests/integration/simulate-render-baseline-cli.test.ts tests/integration/render-performance-baseline-scope-doc-contract.test.ts`
  - `pnpm exec vitest run tests/integration/three-render-adapter-baseline.test.ts tests/integration/three-render-adapter-interaction.test.ts tests/integration/render-performance-baseline-metrics.test.ts tests/integration/simulate-render-baseline-cli.test.ts tests/integration/render-performance-baseline-scope-doc-contract.test.ts`
  - `pnpm typecheck`
  - `pnpm docs:sync-check`
- S3 commands:
  - `pnpm gate:fast`
  - `pnpm gate:full`
- S4 commands:
  - `pnpm exec eslint tests/integration/render-performance-baseline-scope-doc-contract.test.ts`
  - `pnpm exec vitest run tests/integration/render-performance-baseline-scope-doc-contract.test.ts`
  - `pnpm exec vitest run tests/integration/release-flow-doc-contract.test.ts`
  - `pnpm docs:sync-check`
- S5 commands:
  - `pnpm gate:fast`
  - `pnpm gate:full`
  - `pnpm docs:sync-check`
  - `bash tools/git-memory/append-commit-log.sh --missing HEAD`
  - `bash tools/git-memory/update-weekly-summary.sh`
  - `bash tools/git-memory/append-commit-log.sh --missing HEAD`
  - `pnpm exec eslint tests/integration/render-performance-baseline-scope-doc-contract.test.ts`
  - `pnpm exec vitest run tests/integration/render-performance-baseline-scope-doc-contract.test.ts`
- Result:
  - `pnpm exec eslint runtime/render/three-adapter.ts runtime/render/performance-baseline.ts tools/simulate/run-render-baseline.ts tools/simulate/render-baseline-report.ts tests/integration/three-render-adapter-baseline.test.ts tests/integration/three-render-adapter-interaction.test.ts tests/integration/render-performance-baseline-metrics.test.ts tests/integration/simulate-render-baseline-cli.test.ts tests/integration/render-performance-baseline-scope-doc-contract.test.ts` pass.
  - `pnpm exec vitest run tests/integration/three-render-adapter-baseline.test.ts tests/integration/three-render-adapter-interaction.test.ts tests/integration/render-performance-baseline-metrics.test.ts tests/integration/simulate-render-baseline-cli.test.ts tests/integration/render-performance-baseline-scope-doc-contract.test.ts` pass.
  - `pnpm typecheck` pass.
  - `pnpm docs:sync-check` pass.
  - `pnpm gate:fast` pass (`typecheck`, `test:determinism`, `test:schema`).
  - `pnpm gate:full` pass (`lint`, `test`, `test:determinism`, `test:schema`, `test:smoke-ai-package`).
  - `pnpm exec eslint tests/integration/render-performance-baseline-scope-doc-contract.test.ts` pass.
  - `pnpm exec vitest run tests/integration/render-performance-baseline-scope-doc-contract.test.ts` pass.
  - `pnpm exec vitest run tests/integration/release-flow-doc-contract.test.ts` pass.
  - `pnpm docs:sync-check` pass.
  - `pnpm gate:fast` pass (`typecheck`, `test:determinism`, `test:schema`).
  - `pnpm gate:full` pass (`lint`, `test`, `test:determinism`, `test:schema`, `test:smoke-ai-package`).
  - `pnpm docs:sync-check` pass.
  - `bash tools/git-memory/append-commit-log.sh --missing HEAD` pass (`Appended commit summary to docs/ai/commit-log/2026-02.md: 23b5502`).
  - `bash tools/git-memory/update-weekly-summary.sh` pass.
  - `bash tools/git-memory/append-commit-log.sh --missing HEAD` pass (`No missing commits to append.`).
  - `pnpm exec eslint tests/integration/render-performance-baseline-scope-doc-contract.test.ts` pass.
  - `pnpm exec vitest run tests/integration/render-performance-baseline-scope-doc-contract.test.ts` pass.

## Risks and Rollback

- Risk:
  - Baseline metrics may fluctuate across machines if sampling protocol is underspecified, leading to false-positive regressions.
  - Optimization work may unintentionally mix with gameplay/runtime behavior changes if architecture boundaries are not enforced.
  - Memory-trend guardrails may drift between docs and tests if evidence shape changes without synchronized updates.
  - Render-baseline handoff docs may drift across `README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md`, causing command/guardrail ambiguity.
- Rollback:
  - Revert `runtime/render/three-adapter.ts`, `runtime/render/performance-baseline.ts`, `tools/simulate/run-render-baseline.ts`, `tools/simulate/render-baseline-report.ts`, `package.json`, `tests/integration/three-render-adapter-baseline.test.ts`, `tests/integration/three-render-adapter-interaction.test.ts`, `tests/integration/render-performance-baseline-metrics.test.ts`, `tests/integration/simulate-render-baseline-cli.test.ts`, `README.md`, `docs/ai/README.md`, `docs/ai/workflows/continuous-loop.md`, `docs/ai/tasks/T-016-render-performance-baseline.md`, and `tests/integration/render-performance-baseline-scope-doc-contract.test.ts` together.


## Subtask Progress

- [x] [S1] Define scope and acceptance criteria
- [x] [S2] Implement scoped code changes
- [x] [S3] Pass fast and full gates
- [x] [S4] Update docs and risk notes
- [x] [S5] Milestone commit and memory finalize


## Subtask Progress
- [x] [S5] Milestone commit and memory finalize