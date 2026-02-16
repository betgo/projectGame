# T-017: preview-debug-overlay

- Status: Done
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
- [x] [S2] Preview debug overlay renders tick/elapsed/seed/key metrics and surfaces validation/runtime error summaries with actionable hints without breaking preview flow.
- [x] [S3] Regression tests cover diagnostics rendering, error visibility, and non-crashing behavior across preview step/fast/full/reset paths.
- [x] [S4] If contract-level files change (`runtime/core`, `game/schemas`, `ai`), sync `README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md` in the same loop with task risk/rollback notes updated.
- [x] [S5] Task closure evidence includes passing `pnpm gate:fast`, `pnpm gate:full`, and `pnpm docs:sync-check` plus memory-finalize artifacts.

## Subtasks

- [x] [S1] Define scope and acceptance criteria
- [x] [S2] Implement scoped code changes
- [x] [S3] Pass fast and full gates
- [x] [S4] Update docs and risk notes
- [x] [S5] Milestone commit and memory finalize

## S1 Implementation Notes (2026-02-16)

- Locked `T-017` to planning-only scope for this subtask; no runtime/editor production behavior changes are included in S1 delivery.
- Converted acceptance criteria into measurable `S1-S5` checklist items so follow-up subtasks can close with deterministic evidence.
- Added explicit architecture boundary and contract-doc sync requirements to prevent cross-layer leakage while implementing overlay diagnostics and error handling.

## S3 Implementation Notes (2026-02-16)

- Ran `pnpm gate:fast` and `pnpm gate:full`; fixed gate instability by aligning `T-017` doc-contract assertions with current S3 checklist state.
- Extended preview debug-overlay regression coverage to include reset/replay determinism so diagnostics remain stable across new-session resets with identical seed inputs.
- Reconfirmed S3 closure did not touch contract-level files (`runtime/core`, `game/schemas`, `ai`), so S4 focused on synchronized doc wording and risk-note hardening for the delivered overlay contract.

## S4 Documentation and Risk Notes (2026-02-16)

- Synchronized preview debug-overlay contract wording across `README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md`, covering diagnostics fields (`tick`, `elapsedMs`, `tickMs`, `seed`, status/lives/entity counts, and runtime metrics) plus `step`/`fast`/`full` action visibility.
- Documented validation/runtime error fallback behavior in all three docs: overlay surfaces `phase`, summary/issues/hints, while preview actions remain non-crashing (`playStep`/`playFast`/`runToEnd` return `null` and diagnostics status becomes `error` on failure).
- Revalidated architecture boundaries in docs and task risk notes: diagnostics sourcing stays in preview/runtime APIs, overlay rendering stays in editor UI integration, and `runtime/core` simulation ownership plus `runtime/render` read-only boundaries remain unchanged.

## S5 Memory Finalization and Task Closure (2026-02-16)

- Re-ran closure gates and confirmed pass evidence remains complete for `pnpm gate:fast`, `pnpm gate:full`, and `pnpm docs:sync-check`.
- Ran memory refresh commands `bash tools/git-memory/append-commit-log.sh --missing HEAD` and `bash tools/git-memory/update-weekly-summary.sh`; backfilled missing memory entry `7d8a49a` into `docs/ai/commit-log/2026-02.md`, regenerated `docs/ai/weekly-summary.md`, then rechecked `--missing` to confirm `No missing commits to append.`.
- Updated `docs/ai/ai-loop-status.md` to `T-017` S5 closure handoff state (`Issue: 17`, no remaining subtasks, next-step command `pnpm task:next`).
- Closed task metadata by setting status to `Done` and marking S5 acceptance/subtask checkboxes complete.
- Honored the explicit no-commit constraint for this run; milestone and memory finalize evidence is captured through docs/tests artifacts only.
- Kept S5 closure scope to docs/tests/memory verification only; no `runtime/core`, `game/schemas`, or `ai` contract-level files were changed in this step.

## Change List

- `docs/ai/tasks/T-017-preview-debug-overlay.md`: refined S1-S4 contract notes, then finalized S5 closure status, memory evidence, and gate records.
- `tests/integration/preview-debug-overlay-scope-doc-contract.test.ts`: advanced assertions from S4 complete + S5 pending to full S5 closure contract coverage.
- `tests/integration/preview-debug-overlay-session.test.ts`: added reset/replay determinism regression coverage for debug-overlay diagnostics.
- `README.md`: synchronized render contract note with preview debug-overlay diagnostics fields, action coverage, and non-crashing error fallback expectations.
- `docs/ai/README.md`: synchronized AI governance render-contract wording for preview debug-overlay diagnostics, failure hints, and architecture boundaries.
- `docs/ai/workflows/continuous-loop.md`: synchronized loop-level render contract note for preview debug-overlay diagnostics/fallback behavior and boundary ownership.
- `docs/ai/ai-loop-status.md`: switched loop board to `T-017` S5 closure handoff state with explicit no-next-subtask status.
- `docs/ai/commit-log/2026-02.md`: backfilled missing `T-017` S4 milestone entry during S5 memory refresh.
- `docs/ai/weekly-summary.md`: regenerated weekly summary after commit-log refresh.

## Test Evidence

- Commands:
  - `pnpm exec eslint tests/integration/preview-debug-overlay-scope-doc-contract.test.ts`
  - `pnpm exec vitest run tests/integration/preview-debug-overlay-scope-doc-contract.test.ts`
  - `pnpm exec vitest run tests/integration/preview-debug-overlay-session.test.ts`
- S3 commands:
  - `pnpm gate:fast`
  - `pnpm gate:full`
- S4 commands:
  - `pnpm exec eslint tests/integration/preview-debug-overlay-scope-doc-contract.test.ts`
  - `pnpm exec vitest run tests/integration/preview-debug-overlay-scope-doc-contract.test.ts`
  - `pnpm exec vitest run tests/integration/release-flow-doc-contract.test.ts`
  - `pnpm docs:sync-check`
- S5 commands:
  - `pnpm gate:fast`
  - `pnpm gate:full`
  - `pnpm docs:sync-check`
  - `bash tools/git-memory/append-commit-log.sh --missing HEAD`
  - `bash tools/git-memory/update-weekly-summary.sh`
  - `bash tools/git-memory/append-commit-log.sh --missing HEAD`
  - `pnpm exec eslint tests/integration/preview-debug-overlay-scope-doc-contract.test.ts`
  - `pnpm exec vitest run tests/integration/preview-debug-overlay-scope-doc-contract.test.ts`
- Result:
  - `pnpm exec eslint tests/integration/preview-debug-overlay-scope-doc-contract.test.ts` pass.
  - `pnpm exec vitest run tests/integration/preview-debug-overlay-scope-doc-contract.test.ts` pass.
  - `pnpm exec vitest run tests/integration/release-flow-doc-contract.test.ts` pass.
  - `pnpm docs:sync-check` pass.
  - `pnpm gate:fast` pass (`typecheck`, `test:determinism`, `test:schema`).
  - `pnpm gate:full` pass (`lint`, `test`, `test:determinism`, `test:schema`, `test:smoke-ai-package`).
  - `pnpm docs:sync-check` pass.
  - `bash tools/git-memory/append-commit-log.sh --missing HEAD` pass (`Appended commit summary to docs/ai/commit-log/2026-02.md: 7d8a49a`).
  - `bash tools/git-memory/update-weekly-summary.sh` pass.
  - `bash tools/git-memory/append-commit-log.sh --missing HEAD` pass (`No missing commits to append.`).
  - `pnpm exec eslint tests/integration/preview-debug-overlay-scope-doc-contract.test.ts` pass.
  - `pnpm exec vitest run tests/integration/preview-debug-overlay-scope-doc-contract.test.ts` pass.

## Risks and Rollback

- Risk:
  - Scope drift may mix debug-overlay delivery with camera/performance/inspector initiatives assigned to neighboring tasks.
  - Overlay diagnostics can violate architecture boundaries if future implementation tries to mutate `runtime/core` state from UI-layer helpers.
  - Error-summary assertions can become brittle if message taxonomy changes without synchronized test/doc updates.
  - Preview debug-overlay docs may drift across `README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md`, causing handoff ambiguity around diagnostics fields and failure fallback behavior.
- Rollback:
  - Revert `editor/src/editor/api.ts`, `editor/src/editor/components/PreviewControls.tsx`, `editor/src/styles.css`, `tests/integration/preview-debug-overlay-session.test.ts`, `README.md`, `docs/ai/README.md`, `docs/ai/workflows/continuous-loop.md`, `docs/ai/tasks/T-017-preview-debug-overlay.md`, `docs/ai/ai-loop-status.md`, `docs/ai/commit-log/2026-02.md`, `docs/ai/weekly-summary.md`, and `tests/integration/preview-debug-overlay-scope-doc-contract.test.ts` together.

## Subtask Progress

- [x] [S1] Define scope and acceptance criteria
- [x] [S2] Implement scoped code changes
- [x] [S3] Pass fast and full gates
- [x] [S4] Update docs and risk notes
- [x] [S5] Milestone commit and memory finalize


## Subtask Progress
- [x] [S5] Milestone commit and memory finalize