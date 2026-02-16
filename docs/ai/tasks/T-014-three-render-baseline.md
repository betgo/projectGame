# T-014: three-render-baseline

- Status: In Progress
- Owner: maintainer
- Branch: `main`
- Prompt-Plan: `ARCHITECT_v1`, `PLANNER_v1`
- Prompt-Impl: `BUILDER_v2`
- Prompt-Review: `GUARDIAN_v1`, `REVIEWER_v1`

## Goal

Build first usable Three.js visual baseline for map cells, path, towers, and enemies in preview.

## Scope

- In scope:
  - Define a render baseline contract that maps `RenderSnapshot` data to deterministic placeholder visuals for map cells, path, towers, and enemies.
  - Keep rendering logic inside `runtime/render` and editor preview integration points only, without introducing simulation-side mutations.
  - Define lifecycle expectations for render session create/update/dispose behavior so repeated preview runs remain stable.
  - Define minimum regression coverage for render snapshot mapping and lifecycle cleanup behaviors.
- Out of scope:
  - Camera interaction, orbit controls, and advanced navigation UX (covered by `T-015`).
  - Render performance optimization baseline and profiling contracts (covered by `T-016`).
  - Debug overlay, runtime diagnostics HUD, or developer visualization tools (covered by `T-017`).
  - High-fidelity art asset pipeline, PBR materials, and shader-level visual effects.

## Acceptance Criteria

- [x] [S1] Scope and acceptance contract explicitly defines render boundaries, lifecycle expectations, and out-of-scope constraints for `T-014`.
- [ ] [S2] Three.js baseline renders map/path/tower/enemy placeholders from `RenderSnapshot` without mutating runtime simulation state.
- [ ] [S3] Render lifecycle regression tests cover create/update/dispose and repeated preview session cleanup behavior.
- [ ] [S4] Render contract docs are synchronized when contract-level files change, with risk and rollback notes updated in this task.
- [ ] [S5] Task closure evidence includes passing `pnpm gate:fast`, `pnpm gate:full`, and `pnpm docs:sync-check` plus memory finalize artifacts.

## Subtasks

- [x] [S1] Define scope and acceptance criteria
- [ ] [S2] Implement scoped code changes
- [ ] [S3] Pass fast and full gates
- [ ] [S4] Update docs and risk notes
- [ ] [S5] Milestone commit and memory finalize

## S1 Implementation Notes (2026-02-16)

- Locked `T-014` to render-baseline planning scope only; no runtime simulation logic changes are part of S1.
- Converted acceptance criteria to measurable checklist entries aligned with `S1-S5` execution flow.
- Added explicit architecture boundaries to keep rendering changes isolated from `runtime/core` gameplay state mutation paths.

## Change List

- `docs/ai/tasks/T-014-three-render-baseline.md`: finalized S1 scope boundaries and measurable acceptance criteria.
- `tests/integration/three-render-baseline-scope-doc-contract.test.ts`: added doc-contract regression tests for T-014 S1.

## Test Evidence

- Commands:
  - `pnpm exec eslint tests/integration/three-render-baseline-scope-doc-contract.test.ts`
  - `pnpm exec vitest run tests/integration/three-render-baseline-scope-doc-contract.test.ts`
  - `pnpm docs:sync-check`
- Result:
  - `pnpm exec eslint tests/integration/three-render-baseline-scope-doc-contract.test.ts` pass.
  - `pnpm exec vitest run tests/integration/three-render-baseline-scope-doc-contract.test.ts` pass (3 tests).
  - `pnpm docs:sync-check` pass.

## Risks and Rollback

- Risk:
  - Scope drift may mix render-baseline delivery with camera/performance/debug-overlay work planned for later tasks.
- Rollback:
  - Revert `docs/ai/tasks/T-014-three-render-baseline.md` and `tests/integration/three-render-baseline-scope-doc-contract.test.ts` together.
