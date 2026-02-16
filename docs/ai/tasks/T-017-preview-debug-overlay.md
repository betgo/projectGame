# T-017: preview-debug-overlay

- Status: In Progress
- Owner: maintainer
- Branch: `main`
- Prompt-Plan: `ARCHITECT_v1`, `PLANNER_v1`
- Prompt-Impl: `BUILDER_v2`
- Prompt-Review: `GUARDIAN_v1`, `REVIEWER_v1`

## Goal

Add preview debug overlay for runtime tick/seed/metrics and error diagnostics.

## Scope

- In scope:
  - Define a preview debug-overlay contract for runtime diagnostics (`tick`, elapsed time, `seed`, and key simulation metrics) that can be read in-step with preview actions.
  - Define error-diagnostics contract for validation/runtime failures with actionable hints while preserving non-crashing preview flow.
  - Define architecture boundaries so diagnostics data sourcing stays in existing preview/runtime APIs and overlay rendering stays in editor UI integration (`editor/src/editor/components`).
  - Define regression-test expectations for diagnostics visibility, error fallback behavior, and reset/replay consistency.
  - Keep implementation boundaries aligned with `ARCHITECTURE_RULES.md`: `runtime/core` remains simulation owner and `runtime/render` stays read-only.
- Out of scope:
  - Remote telemetry backend integration, cloud log shipping, or external monitoring dashboards.
  - New gameplay mechanics, schema redesign, or runtime balance changes unrelated to debug visibility.
  - Camera-control redesign, render-baseline optimization work, or inspector-form UX polish (covered by `T-015`, `T-016`, and `T-018`).
  - Multi-template packaging workflow changes, AI generation policy updates, or release automation changes.

## Acceptance Criteria

- [x] [S1] Scope and acceptance contract explicitly defines debug-overlay diagnostics surface, error-handling boundaries, architecture constraints, and out-of-scope limits for `T-017`.
- [ ] [S2] Preview debug overlay renders tick/elapsed/seed/key metrics and surfaces validation/runtime error summaries with actionable hints without breaking preview flow.
- [ ] [S3] Regression tests cover diagnostics rendering, error visibility, and non-crashing behavior across preview step/fast/full/reset paths.
- [ ] [S4] If contract-level files change (`runtime/core`, `game/schemas`, `ai`), sync `README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md` in the same loop with task risk/rollback notes updated.
- [ ] [S5] Task closure evidence includes passing `pnpm gate:fast`, `pnpm gate:full`, and `pnpm docs:sync-check` plus memory-finalize artifacts.

## Subtasks

- [x] [S1] Define scope and acceptance criteria
- [x] [S2] Implement scoped code changes
- [ ] [S3] Pass fast and full gates
- [ ] [S4] Update docs and risk notes
- [ ] [S5] Milestone commit and memory finalize

## S1 Implementation Notes (2026-02-16)

- Locked `T-017` to planning-only scope for this subtask; no runtime/editor production behavior changes are included in S1 delivery.
- Converted acceptance criteria into measurable `S1-S5` checklist items so follow-up subtasks can close with deterministic evidence.
- Added explicit architecture boundary and contract-doc sync requirements to prevent cross-layer leakage while implementing overlay diagnostics and error handling.

## Change List

- `docs/ai/tasks/T-017-preview-debug-overlay.md`: refined scope boundaries, measurable acceptance criteria, and S1 completion notes.
- `tests/integration/preview-debug-overlay-scope-doc-contract.test.ts`: added S1 doc-contract regression checks for `T-017` scope and acceptance alignment.

## Test Evidence

- Commands:
  - `pnpm exec eslint tests/integration/preview-debug-overlay-scope-doc-contract.test.ts`
  - `pnpm exec vitest run tests/integration/preview-debug-overlay-scope-doc-contract.test.ts`
- Result:
  - pass

## Risks and Rollback

- Risk:
  - Scope drift may mix debug-overlay delivery with camera/performance/inspector initiatives assigned to neighboring tasks.
  - Overlay diagnostics can violate architecture boundaries if future implementation tries to mutate `runtime/core` state from UI-layer helpers.
  - Error-summary assertions can become brittle if message taxonomy changes without synchronized test/doc updates.
- Rollback:
  - Revert `docs/ai/tasks/T-017-preview-debug-overlay.md` and `tests/integration/preview-debug-overlay-scope-doc-contract.test.ts` together.


## Subtask Progress
- [x] [S1] Define scope and acceptance criteria