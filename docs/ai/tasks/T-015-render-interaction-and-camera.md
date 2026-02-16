# T-015: render-interaction-and-camera

- Status: Planned
- Owner: maintainer
- Branch: `main`
- Prompt-Plan: `ARCHITECT_v1`, `PLANNER_v1`
- Prompt-Impl: `BUILDER_v2`
- Prompt-Review: `GUARDIAN_v1`, `REVIEWER_v1`

## Goal

Improve render interaction layer with camera controls, resize handling, and entity selection affordances.

## Scope

- In scope:
  - Define camera interaction contract for editor preview, including orbit/pan/zoom defaults, deterministic clamp ranges, and input mapping expectations.
  - Define resize-handling contract for preview container lifecycle (`mount -> resize -> dispose`) so renderer size/aspect updates remain stable.
  - Define selection affordance contract for tower/enemy placeholders, including highlight entry/exit behavior and non-selected fallback state.
  - Define regression and documentation coverage expectations for interaction + camera behavior without crossing runtime architecture boundaries.
  - Keep implementation boundaries inside `runtime/render` and editor preview integration (`editor/src/editor/components`) only; do not mutate `runtime/core` simulation state.
- Out of scope:
  - Cinematic camera rails, keyframe animation tracks, and advanced scene-directing workflows.
  - Render performance baseline/profiling thresholds (covered by `T-016`).
  - Debug overlay or runtime diagnostics UI additions (covered by `T-017`).
  - Inspector form UX redesign or editing workflow polish unrelated to camera/selection behavior (covered by `T-018`).

## Acceptance Criteria

- [x] [S1] Scope and acceptance contract explicitly defines camera interaction boundaries, resize lifecycle expectations, selection affordance behavior, and out-of-scope constraints for `T-015`.
- [x] [S2] Camera defaults (orbit/pan/zoom) are implemented with deterministic clamp behavior and remain isolated to preview render layer + editor integration points.
- [ ] [S3] Regression tests cover camera interaction mapping, resize stability, and selection highlight behavior for tower/enemy placeholders.
- [ ] [S4] Contract-level changes update `README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md` in the same loop, with task risk/rollback notes synchronized.
- [ ] [S5] Task closure evidence includes passing `pnpm gate:fast`, `pnpm gate:full`, and `pnpm docs:sync-check` plus memory-finalize artifacts.

## Subtasks

- [x] [S1] Define scope and acceptance criteria
- [x] [S2] Implement scoped code changes
- [ ] [S3] Pass fast and full gates
- [ ] [S4] Update docs and risk notes
- [ ] [S5] Milestone commit and memory finalize

## S1 Implementation Notes (2026-02-16)

- Locked `T-015` planning scope to camera interaction, resize lifecycle, and selection affordance contracts only.
- Added measurable acceptance checklist aligned with `S1-S5` execution flow so later subtasks can close criteria deterministically.
- Captured explicit architecture boundary: no `runtime/core` gameplay mutation responsibilities move into render/editor layers.

## S2 Implementation Notes (2026-02-16)

- Implemented camera interaction defaults in `runtime/render/three-adapter.ts` with deterministic clamp ranges for orbit/pan/zoom and explicit pointer/wheel input mapping.
- Added preview resize lifecycle handling (`mount -> resize -> dispose`) through renderer size + camera aspect synchronization so container changes remain stable.
- Added tower/enemy hover selection affordances with highlight entry/exit behavior and non-selected fallback color restoration.
- Kept architecture boundaries intact: no simulation mutation moved into `runtime/core`; interaction logic stays in `runtime/render` + editor preview integration.
- Extended editor preview integration to surface interaction hints and hovered selection labels from adapter callbacks.

## Change List

- `docs/ai/tasks/T-015-render-interaction-and-camera.md`: refined S1 scope boundaries and measurable acceptance criteria.
- `tests/integration/render-interaction-camera-scope-doc-contract.test.ts`: added S1 doc-contract regression checks for `T-015`.
- `runtime/render/three-adapter.ts`: implemented camera controls, deterministic clamps, resize lifecycle sync, and tower/enemy selection highlight affordances.
- `runtime/render/three.d.ts`: expanded local Three.js typings for camera projection updates, raycasting, vectors, and material color mutation APIs used by interaction logic.
- `editor/src/editor/components/PreviewControls.tsx`: integrated render selection callback and camera control hints into editor preview panel.
- `tests/integration/three-render-adapter-baseline.test.ts`: updated Three.js mock surface to match interaction-enabled adapter lifecycle.
- `tests/integration/three-render-adapter-interaction.test.ts`: added regression coverage for camera mapping/clamps, resize lifecycle behavior, and selection highlight entry/exit state.
- `tests/integration/render-interaction-camera-scope-doc-contract.test.ts`: advanced doc-contract assertions for S2 completion and implementation evidence.

## Test Evidence

- Commands:
  - `pnpm exec eslint tests/integration/render-interaction-camera-scope-doc-contract.test.ts`
  - `pnpm exec vitest run tests/integration/render-interaction-camera-scope-doc-contract.test.ts`
  - `pnpm docs:sync-check`
- S2 commands:
  - `pnpm exec eslint runtime/render/three-adapter.ts runtime/render/three.d.ts editor/src/editor/components/PreviewControls.tsx tests/integration/three-render-adapter-baseline.test.ts tests/integration/three-render-adapter-interaction.test.ts tests/integration/render-interaction-camera-scope-doc-contract.test.ts`
  - `pnpm exec vitest run tests/integration/three-render-adapter-baseline.test.ts tests/integration/three-render-adapter-interaction.test.ts tests/integration/render-interaction-camera-scope-doc-contract.test.ts`
  - `pnpm typecheck`
  - `pnpm docs:sync-check`
- Result:
  - `pnpm exec eslint tests/integration/render-interaction-camera-scope-doc-contract.test.ts` pass.
  - `pnpm exec vitest run tests/integration/render-interaction-camera-scope-doc-contract.test.ts` pass.
  - `pnpm docs:sync-check` pass.
  - `pnpm exec eslint runtime/render/three-adapter.ts runtime/render/three.d.ts editor/src/editor/components/PreviewControls.tsx tests/integration/three-render-adapter-baseline.test.ts tests/integration/three-render-adapter-interaction.test.ts tests/integration/render-interaction-camera-scope-doc-contract.test.ts` pass.
  - `pnpm exec vitest run tests/integration/three-render-adapter-baseline.test.ts tests/integration/three-render-adapter-interaction.test.ts tests/integration/render-interaction-camera-scope-doc-contract.test.ts` pass.
  - `pnpm typecheck` pass.
  - `pnpm docs:sync-check` pass.

## Risks and Rollback

- Risk:
  - Scope drift may mix interaction/camera delivery with performance/debug-overlay/inspector work planned in later tasks.
  - Camera input handling may leak into `runtime/core` if architecture boundaries are not enforced during S2 implementation.
  - Pointer/raycast interaction code may regress under mock/browser behavior differences if event mapping assumptions diverge.
  - Selection highlight expectations may diverge between docs and tests if contract text changes without synchronized assertions.
- Rollback:
  - Revert `runtime/render/three-adapter.ts`, `runtime/render/three.d.ts`, `editor/src/editor/components/PreviewControls.tsx`, `tests/integration/three-render-adapter-baseline.test.ts`, `tests/integration/three-render-adapter-interaction.test.ts`, `docs/ai/tasks/T-015-render-interaction-and-camera.md`, and `tests/integration/render-interaction-camera-scope-doc-contract.test.ts` together.


## Subtask Progress
- [x] [S1] Define scope and acceptance criteria
- [x] [S2] Implement scoped code changes


## Subtask Progress
- [x] [S2] Implement scoped code changes