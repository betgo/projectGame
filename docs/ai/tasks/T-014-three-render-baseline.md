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
- [x] [S2] Three.js baseline renders map/path/tower/enemy placeholders from `RenderSnapshot` without mutating runtime simulation state.
- [x] [S3] Render lifecycle regression tests cover create/update/dispose and repeated preview session cleanup behavior.
- [x] [S4] Render contract docs are synchronized when contract-level files change, with risk and rollback notes updated in this task.
- [ ] [S5] Task closure evidence includes passing `pnpm gate:fast`, `pnpm gate:full`, and `pnpm docs:sync-check` plus memory finalize artifacts.

## Subtasks

- [x] [S1] Define scope and acceptance criteria
- [x] [S2] Implement scoped code changes
- [x] [S3] Pass fast and full gates
- [x] [S4] Update docs and risk notes
- [ ] [S5] Milestone commit and memory finalize

## S1 Implementation Notes (2026-02-16)

- Locked `T-014` to render-baseline planning scope only; no runtime simulation logic changes are part of S1.
- Converted acceptance criteria to measurable checklist entries aligned with `S1-S5` execution flow.
- Added explicit architecture boundaries to keep rendering changes isolated from `runtime/core` gameplay state mutation paths.

## S2 Implementation Notes (2026-02-16)

- Extended `RenderSnapshot` contract to include immutable `map` and `path` data so render baseline can build deterministic placeholders from snapshot-only inputs.
- Implemented `runtime/render` placeholder-frame mapping and Three.js adapter layer updates for map cells, path nodes, towers, and enemies.
- Wired editor preview panel to create/update/dispose a `ThreeRenderAdapter` session without mutating runtime simulation state.

## S3 Implementation Notes (2026-02-16)

- Executed `pnpm gate:fast` and confirmed `typecheck`, `test:determinism`, and `test:schema` pass with current render-baseline changes.
- Executed `pnpm gate:full` and confirmed lint + full suite + deterministic/schema/smoke replay all pass for gate-level regression coverage.

## S4 Documentation and Risk Notes (2026-02-16)

- Re-validated that contract-level change `runtime/core/types.ts` (`RenderSnapshot.map` + `RenderSnapshot.path`) is documented in `README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md` with deterministic/immutable rendering expectations.
- Confirmed docs remain architecture-safe: render behavior is described as read-only consumption of snapshot data, and no `runtime/core` mutation responsibilities were moved into `runtime/render`.
- Expanded task-level risk and rollback notes to explicitly cover render-contract documentation drift and rollback scope across docs + doc-contract tests.

## Change List

- `docs/ai/tasks/T-014-three-render-baseline.md`: finalized S1 scope boundaries and measurable acceptance criteria.
- `tests/integration/three-render-baseline-scope-doc-contract.test.ts`: added doc-contract regression tests for T-014 S1.
- `runtime/core/types.ts`: expanded `RenderSnapshot` contract with `map` and `path`.
- `runtime/render/snapshot.ts`: cloned map/path into snapshot output to keep render reads immutable.
- `runtime/render/placeholder-model.ts`: added deterministic placeholder-frame mapper for map/path/tower/enemy visuals.
- `runtime/render/three-adapter.ts`: implemented baseline Three.js placeholder rendering + lifecycle cleanup.
- `runtime/render/three.d.ts`: expanded local Three.js typings used by baseline renderer.
- `editor/src/editor/components/PreviewControls.tsx`: integrated preview panel render adapter lifecycle.
- `editor/src/styles.css`: added preview stage container styles for Three.js canvas mounting.
- `tests/integration/three-render-snapshot-contract.test.ts`: added snapshot immutability and frame-mapping regression coverage.
- `tests/integration/three-render-adapter-baseline.test.ts`: added adapter baseline rendering and lifecycle cleanup regression coverage.
- `tests/integration/three-render-baseline-scope-doc-contract.test.ts`: synchronized task-progress assertions with S3 gate pass status.
- `README.md`: added render contract note for immutable `RenderSnapshot.map/path` expectations.
- `docs/ai/README.md`: clarified render contract and documentation sync expectation for contract-level changes.
- `docs/ai/workflows/continuous-loop.md`: clarified render contract note with immutable snapshot fields and architecture boundary wording.
- `tests/integration/three-render-baseline-scope-doc-contract.test.ts`: extended assertions for S4 doc-sync and risk/rollback coverage.

## Test Evidence

- Commands:
  - `pnpm exec eslint tests/integration/three-render-baseline-scope-doc-contract.test.ts`
  - `pnpm exec vitest run tests/integration/three-render-baseline-scope-doc-contract.test.ts`
  - `pnpm docs:sync-check`
- S2 commands:
  - `pnpm exec vitest run tests/integration/three-render-snapshot-contract.test.ts tests/integration/three-render-adapter-baseline.test.ts`
  - `pnpm exec eslint runtime/render/three-adapter.ts runtime/render/placeholder-model.ts editor/src/editor/components/PreviewControls.tsx tests/integration/three-render-snapshot-contract.test.ts tests/integration/three-render-adapter-baseline.test.ts`
  - `pnpm typecheck`
  - `pnpm docs:sync-check`
- S3 commands:
  - `pnpm gate:fast`
  - `pnpm gate:full`
- S4 commands:
  - `pnpm exec eslint tests/integration/three-render-baseline-scope-doc-contract.test.ts`
  - `pnpm exec vitest run tests/integration/three-render-baseline-scope-doc-contract.test.ts`
  - `pnpm docs:sync-check`
- Result:
  - `pnpm exec eslint tests/integration/three-render-baseline-scope-doc-contract.test.ts` pass.
  - `pnpm exec vitest run tests/integration/three-render-baseline-scope-doc-contract.test.ts` pass (3 tests).
  - `pnpm docs:sync-check` pass.
  - `pnpm exec vitest run tests/integration/three-render-snapshot-contract.test.ts tests/integration/three-render-adapter-baseline.test.ts` pass (3 tests).
  - `pnpm exec eslint runtime/core/types.ts runtime/render/snapshot.ts runtime/render/three-adapter.ts runtime/render/placeholder-model.ts runtime/render/three.d.ts editor/src/editor/components/PreviewControls.tsx tests/integration/three-render-snapshot-contract.test.ts tests/integration/three-render-adapter-baseline.test.ts` pass.
  - `pnpm typecheck` pass.
  - `pnpm docs:sync-check` pass.
  - `pnpm gate:fast` pass (`typecheck`, `test:determinism`, `test:schema`).
  - `pnpm gate:full` pass (`lint`, `test`, `test:determinism`, `test:schema`, `test:smoke-ai-package`).
  - `pnpm exec eslint tests/integration/three-render-baseline-scope-doc-contract.test.ts` pass.
  - `pnpm exec vitest run tests/integration/three-render-baseline-scope-doc-contract.test.ts` pass.
  - `pnpm docs:sync-check` pass.

## Risks and Rollback

- Risk:
  - Scope drift may mix render-baseline delivery with camera/performance/debug-overlay work planned for later tasks.
  - Render contract docs may drift from `runtime/core/types.ts` if `RenderSnapshot` fields are extended without synchronized updates in handoff docs.
  - Rollback in docs/tests only may hide immutable `map/path` assumptions and cause future preview regressions to bypass doc-contract checks.
- Rollback:
  - Revert `README.md`, `docs/ai/README.md`, `docs/ai/workflows/continuous-loop.md`, `docs/ai/tasks/T-014-three-render-baseline.md`, and `tests/integration/three-render-baseline-scope-doc-contract.test.ts` together.
