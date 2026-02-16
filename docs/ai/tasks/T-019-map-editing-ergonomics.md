# T-019: map-editing-ergonomics

- Status: Done
- Owner: maintainer
- Branch: `main`
- Prompt-Plan: `ARCHITECT_v1`, `PLANNER_v1`
- Prompt-Impl: `BUILDER_v2`
- Prompt-Review: `GUARDIAN_v1`, `REVIEWER_v1`

## Goal

Improve map editing ergonomics for high-frequency authoring workflows.

## Scope

- In scope:
  - Define map-brush ergonomics contract for `editor/src/editor/components/MapCanvas.tsx` and `editor/src/editor/operations.ts`, including predictable paint/erase/path behavior for high-frequency edits.
  - Define placement-precision and selection-feedback expectations so cell targeting remains deterministic under repeated interactions.
  - Define undo-friendly editing constraints by requiring operation-level idempotence and clear, reversible map-cell transitions in editor state.
  - Define import/export compatibility guardrails so map ergonomics changes do not alter `GameProject`/`GamePackage` data contract semantics.
  - Keep implementation boundaries inside `editor/` interaction and state flow; preserve `runtime/core` simulation ownership and avoid cross-layer leakage.
- Out of scope:
  - Runtime simulation rebalance, enemy/tower mechanics redesign, or deterministic-engine behavior changes.
  - Schema-version migration strategy and import/export diagnostics redesign (tracked by `T-020` and `T-021`).
  - Render-camera control redesign and performance baseline work (already covered by `T-015` and `T-016`).
  - Collaborative multi-user map editing, cloud sync, or account-based authoring workflows.

## Acceptance Criteria

- [x] [S1] Scope and acceptance contract explicitly defines map-brush ergonomics boundaries, precision/undo expectations, architecture constraints, and out-of-scope limits for `T-019`.
- [x] [S2] Map editing implementation adds ergonomic paint/erase/path actions with deterministic selection and placement behavior while staying inside `editor/` boundaries.
- [x] [S3] Regression tests cover repeated interaction stability, precision placement paths, and import/export compatibility safeguards; `pnpm gate:fast` and `pnpm gate:full` pass.
- [x] [S4] If contract-level files change (`runtime/core`, `game/schemas`, `ai`), synchronize `README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md` in the same loop with updated risk/rollback notes.

## Subtasks

- [x] [S1] Define scope and acceptance criteria
- [x] [S2] Implement scoped code changes and pass fast/full gates
- [x] [S3] Update docs and risk notes
- [x] [S4] Finalize memory and complete task-level commit

## S1 Implementation Notes (2026-02-16)

- Locked `T-019` to planning-only scope in this subtask; no production map-editing behavior is changed in S1.
- Converted acceptance criteria into measurable `S1-S4` checklist contracts so S2-S4 can close with deterministic evidence.
- Captured architecture boundaries (`editor/` map interaction only, no ownership shift into `runtime/core`/`runtime/render`/`ai`) and explicit contract-doc synchronization trigger for future contract-level file changes.

## S2 Implementation Notes (2026-02-16)

- Updated `MapCanvas` pointer ergonomics with deterministic drag painting (left button) and temporary erase strokes (right button) without moving map-editing ownership outside `editor/`.
- Added target-cell feedback and keyboard-safe paint hooks so repeated interactions maintain stable cell targeting visibility.
- Hardened `applyOperation` paint flows with operation-level idempotence and optional tool override support, including reversible payload synchronization when path/tower cells are cleared.
- Added regression coverage for pointer brush mapping, repeated edit idempotence, full-path erase reversibility, path/tower transitions, and export-package compatibility invariants.

## S3 Documentation and Risk Notes (2026-02-16)

- Updated this task card to capture S3 closure evidence and keep docs/risk narrative aligned with delivered map-editing ergonomics behavior.
- Revalidated architecture boundaries: map-editing changes remain in `editor/` interaction/state flow and do not move simulation ownership from `runtime/core`.
- Confirmed S3 touched no contract-level files (`runtime/core`, `game/schemas`, `ai`), so `README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md` require no sync delta in this loop.
- Extended risk notes to cover documentation-state drift and contract-doc sync misses in follow-up subtasks.

## S4 Memory Finalization and Task Closure (2026-02-16)

- Re-ran closure checks and confirmed pass evidence for `pnpm gate:fast`, `pnpm gate:full`, and `pnpm docs:sync-check`.
- Executed memory refresh commands `bash tools/git-memory/append-commit-log.sh --missing HEAD` and `bash tools/git-memory/update-weekly-summary.sh`; backfilled missing entry `4dd0b07` into `docs/ai/commit-log/2026-02.md`, regenerated `docs/ai/weekly-summary.md`, then re-ran `--missing` and got `No missing commits to append.`.
- Updated `docs/ai/ai-loop-status.md` to `T-019` closure handoff state (`Issue: 19`, no remaining subtasks, next-step command `pnpm task:next`).
- Closed task metadata by setting status to `Done` and marking S4 acceptance/subtask checkboxes complete.
- Honored the explicit no-commit constraint for this run; task-level commit intent is captured through docs/tests/memory evidence only.
- Reconfirmed S4 touched no contract-level files (`runtime/core`, `game/schemas`, `ai`), so contract-doc synchronization remained a no-op in this loop.

## Change List

- `docs/ai/tasks/T-019-map-editing-ergonomics.md`: expanded S1 scope contract, captured S2/S3 delivery notes, and finalized S4 closure metadata + memory evidence.
- `tests/integration/map-editing-ergonomics-scope.test.ts`: added regression checks for S1 scope and updated checklist assertions for full S4 closure state.
- `editor/src/editor/components/MapCanvas.tsx`: implemented drag-paint/drag-erase brush ergonomics, deterministic target feedback, and keyboard paint support.
- `editor/src/editor/operations.ts`: added idempotent paint operation guards, optional tool override handling, and fully reversible map-to-payload synchronization.
- `editor/src/styles.css`: added map-grid interaction affordances and active-cell feedback styling.
- `tests/integration/map-editing-ergonomics.test.ts`: added map-editing ergonomics regression coverage for brush behavior, idempotence, reversible transitions, and export compatibility.
- `docs/ai/ai-loop-status.md`: switched loop board to `T-019` closure handoff state with no remaining subtasks.
- `docs/ai/commit-log/2026-02.md`: backfilled missing entry `4dd0b07` during S4 memory refresh.
- `docs/ai/weekly-summary.md`: refreshed weekly memory summary after S4 memory finalize commands.

## Test Evidence

- Commands:
  - `pnpm exec eslint tests/integration/map-editing-ergonomics-scope.test.ts`
  - `pnpm exec vitest run tests/integration/map-editing-ergonomics-scope.test.ts`
  - `pnpm exec eslint editor/src/editor/components/MapCanvas.tsx editor/src/editor/operations.ts tests/integration/map-editing-ergonomics.test.ts`
  - `pnpm exec vitest run tests/integration/map-editing-ergonomics.test.ts`
  - `pnpm gate:fast`
  - `pnpm gate:full`
- S3 commands:
  - `pnpm exec eslint tests/integration/map-editing-ergonomics-scope.test.ts`
  - `pnpm exec vitest run tests/integration/map-editing-ergonomics-scope.test.ts`
  - `pnpm docs:sync-check`
- S4 commands:
  - `pnpm gate:fast`
  - `pnpm gate:full`
  - `pnpm docs:sync-check`
  - `bash tools/git-memory/append-commit-log.sh --missing HEAD`
  - `bash tools/git-memory/update-weekly-summary.sh`
  - `bash tools/git-memory/append-commit-log.sh --missing HEAD`
  - `pnpm exec eslint tests/integration/map-editing-ergonomics-scope.test.ts`
  - `pnpm exec vitest run tests/integration/map-editing-ergonomics-scope.test.ts`
- Result:
  - `pnpm exec eslint tests/integration/map-editing-ergonomics-scope.test.ts` pass.
  - `pnpm exec vitest run tests/integration/map-editing-ergonomics-scope.test.ts` pass (1 file, 4 tests).
  - `pnpm exec eslint editor/src/editor/components/MapCanvas.tsx editor/src/editor/operations.ts tests/integration/map-editing-ergonomics.test.ts` pass.
  - `pnpm exec vitest run tests/integration/map-editing-ergonomics.test.ts` pass (1 file, 6 tests).
  - `pnpm gate:fast` pass (`typecheck`, `test:determinism`, `test:schema`).
  - `pnpm gate:full` pass (`lint`, `test`, `test:determinism`, `test:schema`, `test:smoke-ai-package`).
  - `pnpm exec eslint tests/integration/map-editing-ergonomics-scope.test.ts` pass.
  - `pnpm exec vitest run tests/integration/map-editing-ergonomics-scope.test.ts` pass (1 file, 4 tests).
  - `pnpm docs:sync-check` pass.
  - `pnpm gate:fast` pass (`typecheck`, `test:determinism`, `test:schema`).
  - `pnpm gate:full` pass (`lint`, `test`, `test:determinism`, `test:schema`, `test:smoke-ai-package`).
  - `pnpm docs:sync-check` pass.
  - `bash tools/git-memory/append-commit-log.sh --missing HEAD` pass (`Appended commit summary to docs/ai/commit-log/2026-02.md: 4dd0b07`).
  - `bash tools/git-memory/update-weekly-summary.sh` pass.
  - `bash tools/git-memory/append-commit-log.sh --missing HEAD` pass (`No missing commits to append.`).
  - `pnpm exec eslint tests/integration/map-editing-ergonomics-scope.test.ts` pass.
  - `pnpm exec vitest run tests/integration/map-editing-ergonomics-scope.test.ts` pass (1 file, 4 tests).

## Risks and Rollback

- Risk:
  - Scope drift may mix map-editing ergonomics delivery with schema/versioning/import-export tracks owned by `T-020` and `T-021`.
  - Brush QoL implementation can accidentally break deterministic map-to-payload synchronization if operation boundaries in `editor/src/editor/operations.ts` are not preserved.
  - Precision-focused interaction changes can regress accessibility or keyboard flow if not validated with targeted interaction tests.
  - Task/risk documentation can drift from real closure state, reducing handoff quality and making S4 memory finalize evidence harder to trust.
  - Memory artifacts (`docs/ai/ai-loop-status.md`, `docs/ai/weekly-summary.md`) can drift from actual loop state if S4 finalize commands are skipped.
  - Follow-up work that touches `runtime/core`, `game/schemas`, or `ai` may skip required contract-doc synchronization unless explicitly checked in loop review.
- Rollback:
  - Revert `docs/ai/tasks/T-019-map-editing-ergonomics.md` and `tests/integration/map-editing-ergonomics-scope.test.ts` together to restore pre-S1 planning baseline.
  - Revert `editor/src/editor/components/MapCanvas.tsx`, `editor/src/editor/operations.ts`, `editor/src/styles.css`, and `tests/integration/map-editing-ergonomics.test.ts` together to roll back S2 brush ergonomics behavior safely.
  - If only S3/S4 documentation updates need rollback, revert `docs/ai/tasks/T-019-map-editing-ergonomics.md`, `tests/integration/map-editing-ergonomics-scope.test.ts`, `docs/ai/ai-loop-status.md`, `docs/ai/commit-log/2026-02.md`, and `docs/ai/weekly-summary.md` to restore prior checklist/risk expectations.


## Subtask Progress

- [x] [S1] Define scope and acceptance criteria
- [x] [S2] Implement scoped code changes and pass fast/full gates
- [x] [S3] Update docs and risk notes
- [x] [S4] Finalize memory and complete task-level commit


## Subtask Progress
- [x] [S4] Finalize memory and complete task-level commit