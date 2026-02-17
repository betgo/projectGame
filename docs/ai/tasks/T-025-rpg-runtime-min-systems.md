# T-025: rpg-runtime-min-systems

- Status: Done
- Owner: maintainer
- Branch: `main`
- Prompt-Plan: `ARCHITECT_v1`, `PLANNER_v1`
- Prompt-Impl: `BUILDER_v2`
- Prompt-Review: `GUARDIAN_v1`, `REVIEWER_v1`

## Goal

Implement minimal RPG runtime systems for movement/combat/quest-lite loop.

## Scope

- In scope:
  - Define minimal RPG runtime system boundaries in `runtime/templates/rpg-topdown` for movement, combat, and quest-lite progression while keeping orchestration in `runtime/core` template entrypoints.
  - Define deterministic movement contract for walkable-grid traversal, spawn positioning, and blocked-cell handling so identical package + seed inputs replay identically.
  - Define deterministic combat contract for attack cadence, damage resolution, and entity life-cycle transitions (`alive` -> `defeated`) under tick-based simulation.
  - Define quest-lite completion contract for MVP objectives (for example, reach-target and defeat-target conditions) with explicit success/failure state transitions for headless execution.
  - Define regression and boundary expectations for runtime-only delivery, including headless scenario completion checks, seed-replay determinism checks, and no cross-layer leakage into schema/editor/AI ownership.
- Out of scope:
  - Inventory/economy/dialog trees, equipment systems, or advanced RPG progression mechanics beyond quest-lite MVP closure.
  - Editor template-switching UX, RPG inspector authoring workflows, or project migration UX (tracked by `T-026`).
  - AI multi-template generation/routing behavior and cross-template batch orchestration (tracked by `T-027` and `T-028`).
  - Asset pipeline, playtest dashboard, and release-automation tracks planned in `T-029` to `T-031`.

## Acceptance Criteria

- [x] [S1] Scope and acceptance contract explicitly defines RPG runtime movement/combat/quest-lite boundaries, deterministic tick expectations, architecture ownership, and out-of-scope limits for `T-025`.
- [x] [S2] Scoped implementation delivers minimal RPG runtime systems for movement/combat/quest-lite headless execution through template SDK runtime entrypoints while preserving existing template compatibility.
- [x] [S3] Regression tests cover RPG headless completion paths, deterministic seed replay, and boundary invariants; `pnpm gate:fast` and `pnpm gate:full` pass.
- [x] [S4] If contract-level files change (`runtime/core`, `game/schemas`, `ai`), synchronize `README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md` in the same loop with updated risk/rollback notes.

## Subtasks

- [x] [S1] Define scope and acceptance criteria
- [x] [S2] Implement scoped code changes and pass fast/full gates
- [x] [S3] Update docs and risk notes
- [x] [S4] Finalize memory and complete task-level commit

## S1 Implementation Notes (2026-02-17)

- Locked S1 to planning-only output: no production runtime/template/schema/editor behavior changes are introduced in this subtask.
- Expanded S1 into measurable movement/combat/quest-lite runtime contracts so S2 implementation can be audited against deterministic expectations.
- Captured architecture ownership boundaries early (`runtime/templates/rpg-topdown` system behavior, `runtime/core` orchestration, `game/schemas` shape compatibility) to prevent cross-layer leakage.
- Declared downstream task boundaries (`T-026` to `T-031`) to prevent runtime-scope drift into editor, AI orchestration, asset, and release tracks.
- Added explicit contract-doc synchronization trigger for follow-up subtasks when `runtime/core`, `game/schemas`, or `ai` files change.

## S2 Implementation Notes (2026-02-17)

- Added runtime template implementation under `runtime/templates/rpg-topdown` with deterministic movement, combat cadence, enemy life-cycle transitions (`alive` -> `defeated`), and quest-lite objective resolution (`reach-exit`, `defeat-all-enemies`, `survive-duration`).
- Added RPG semantic validator in `runtime/templates/rpg-topdown/validator.ts` for walkable-grid constraints, spawn-zone bounds + walkable coverage, enemy profile/reference integrity, and reach-exit path reachability checks.
- Registered RPG template in `runtime/core/engine.ts` and generalized runtime tick resolution so `runScenario()` works for both TD (`spawnRules.tickMs`) and RPG (`rules.tick.tickMs`) template payload contracts.
- Preserved architecture boundaries by keeping orchestration in `runtime/core` and template behavior in `runtime/templates/rpg-topdown`, with no schema/editor/AI ownership leakage.
- Because `runtime/core` changed in this subtask, synchronized contract docs in `README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md` in the same loop.

## S3 Documentation and Risk Notes (2026-02-17)

- Updated this task card for S3 closure so acceptance/subtask checklist state, change inventory, and risk narrative remain aligned with delivered RPG runtime behavior.
- Revalidated RPG runtime min-systems contract wording across `README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md` after S2 `runtime/core` changes; orchestration ownership and template-boundary expectations stay synchronized.
- Confirmed S3 introduced no new contract-level source changes in `runtime/core`, `game/schemas`, or `ai`; documentation delta is limited to lifecycle evidence and risk-note hardening.
- Expanded risk notes to cover documentation-state drift and checklist mismatch risk before S4 memory finalization.

## S4 Memory Finalization and Task Closure (2026-02-17)

- Re-ran closure checks and confirmed pass evidence for `pnpm gate:fast`, `pnpm gate:full`, and `pnpm docs:sync-check`.
- Executed memory refresh commands `bash tools/git-memory/append-commit-log.sh --missing HEAD` and `bash tools/git-memory/update-weekly-summary.sh`; backfilled missing entry `5a36679` into `docs/ai/commit-log/2026-02.md`, regenerated `docs/ai/weekly-summary.md`, then re-ran `--missing` and got `No missing commits to append.`.
- Updated `docs/ai/ai-loop-status.md` to `T-025` closure handoff state (`Issue: 25`, no remaining subtasks, next-step command `pnpm task:next`).
- Closed task metadata by setting status to `Done` and marking S4 acceptance/subtask checkboxes complete.
- Honored the explicit no-commit constraint for this run; task-level commit intent is captured through docs/tests/memory evidence only.
- Reconfirmed S4 introduced no new contract-level source changes (`runtime/core`, `game/schemas`, `ai`); S2/S3 contract-doc synchronization remains the active baseline.

## Change List

- `runtime/core/types.ts`: widened grid cell contract for RPG payload compatibility and added `internal.templateState` for template-scoped runtime state.
- `runtime/core/engine.ts`: registered `rpg-topdown` template and added template-aware fixed-tick resolution for runtime scenarios.
- `runtime/templates/rpg-topdown/index.ts`: added RPG template registration surface (`validate`, `createWorld`, `step`).
- `runtime/templates/rpg-topdown/types.ts`: added RPG payload/runtime state types used by template systems.
- `runtime/templates/rpg-topdown/systems.ts`: implemented deterministic movement/combat/quest-lite runtime systems with seedable PRNG-backed respawn behavior.
- `runtime/templates/rpg-topdown/validator.ts`: added RPG semantic validation rules for map, spawn, and objective consistency.
- `tests/integration/rpg-runtime-min-systems-runtime.test.ts`: added RPG runtime regression coverage for completion paths, deterministic replay, respawn determinism, and failure transitions.
- `README.md`: synchronized runtime/template contract note for RPG minimal systems and template registry behavior.
- `docs/ai/README.md`: synchronized AI governance contract note for RPG runtime minimum systems and runtime-core ownership.
- `docs/ai/workflows/continuous-loop.md`: synchronized loop contract note for RPG runtime implementation and deterministic runtime entrypoint expectations.
- `docs/ai/tasks/T-025-rpg-runtime-min-systems.md`: recorded S2/S3 evidence, captured S4 closure checks, and finalized task metadata to `Done`.
- `tests/integration/rpg-runtime-min-systems-scope.test.ts`: advanced lifecycle assertions from S3-done/S4-pending to S4 closure and memory-finalization evidence.
- `docs/ai/ai-loop-status.md`: switched loop board to `T-025` closure handoff state with no remaining subtasks.
- `docs/ai/commit-log/2026-02.md`: backfilled missing entry `5a36679` during S4 memory refresh.
- `docs/ai/weekly-summary.md`: refreshed weekly memory summary after S4 memory finalize commands.

## Test Evidence

- Commands:
  - `pnpm exec eslint runtime/core/engine.ts runtime/core/types.ts runtime/templates/rpg-topdown/*.ts tests/integration/rpg-runtime-min-systems-runtime.test.ts tests/integration/rpg-runtime-min-systems-scope.test.ts`
  - `pnpm exec vitest run tests/integration/rpg-runtime-min-systems-runtime.test.ts tests/integration/rpg-runtime-min-systems-scope.test.ts`
  - `pnpm gate:fast`
  - `pnpm gate:full`
- S3 commands:
  - `pnpm exec eslint tests/integration/rpg-runtime-min-systems-scope.test.ts`
  - `pnpm exec vitest run tests/integration/rpg-runtime-min-systems-scope.test.ts`
  - `pnpm docs:sync-check`
- S4 commands:
  - `pnpm gate:fast`
  - `pnpm gate:full`
  - `pnpm docs:sync-check`
  - `bash tools/git-memory/append-commit-log.sh --missing HEAD`
  - `bash tools/git-memory/update-weekly-summary.sh`
  - `bash tools/git-memory/append-commit-log.sh --missing HEAD`
  - `pnpm exec eslint tests/integration/rpg-runtime-min-systems-scope.test.ts`
  - `pnpm exec vitest run tests/integration/rpg-runtime-min-systems-scope.test.ts`
- Result:
  - `pnpm exec eslint runtime/core/engine.ts runtime/core/types.ts runtime/templates/rpg-topdown/*.ts tests/integration/rpg-runtime-min-systems-runtime.test.ts tests/integration/rpg-runtime-min-systems-scope.test.ts` pass.
  - `pnpm exec vitest run tests/integration/rpg-runtime-min-systems-runtime.test.ts tests/integration/rpg-runtime-min-systems-scope.test.ts` pass.
  - `pnpm gate:fast` pass.
  - `pnpm gate:full` pass.
  - `pnpm exec eslint tests/integration/rpg-runtime-min-systems-scope.test.ts` pass.
  - `pnpm exec vitest run tests/integration/rpg-runtime-min-systems-scope.test.ts` pass.
  - `pnpm docs:sync-check` pass.
  - `pnpm gate:fast` pass (`typecheck`, `test:determinism`, `test:schema`).
  - `pnpm gate:full` pass (`lint`, `test`, `test:determinism`, `test:schema`, `test:smoke-ai-package`).
  - `pnpm docs:sync-check` pass.
  - `bash tools/git-memory/append-commit-log.sh --missing HEAD` pass (`Appended commit summary to docs/ai/commit-log/2026-02.md: 5a36679`).
  - `bash tools/git-memory/update-weekly-summary.sh` pass (`Rendered weekly summary: /Users/wxx/Desktop/code/projectA/docs/ai/weekly-summary.md`).
  - `bash tools/git-memory/append-commit-log.sh --missing HEAD` pass (`No missing commits to append.`).
  - `pnpm exec eslint tests/integration/rpg-runtime-min-systems-scope.test.ts` pass.
  - `pnpm exec vitest run tests/integration/rpg-runtime-min-systems-scope.test.ts` pass.

## Risks and Rollback

- Risk:
  - Scope drift can blur boundaries between runtime-minimum delivery (`T-025`) and downstream editor/AI/asset/release tracks (`T-026` to `T-031`), reducing implementation focus.
  - Ambiguous movement/combat/quest-lite contracts can cause inconsistent deterministic behavior across headless replay paths.
  - Ownership leakage can occur if runtime semantics are moved into schema/editor/AI layers instead of template runtime systems.
  - Template tick-resolution drift between TD and RPG payload branches can break deterministic replay if runtime entrypoints stop resolving per-template fixed tick contracts.
  - RPG respawn/combat state-machine regressions can silently alter objective transitions unless deterministic regression coverage remains in fast/full gates.
  - Contract-doc synchronization can be skipped in follow-up subtasks if `runtime/core`, `game/schemas`, or `ai` changes are not tracked against release-flow requirements.
  - Task checklist and risk documentation can diverge from delivered behavior if task-card updates and lifecycle scope tests are not kept synchronized.
  - Memory artifacts (`docs/ai/ai-loop-status.md`, `docs/ai/commit-log/2026-02.md`, `docs/ai/weekly-summary.md`) can drift from actual loop state if S4 finalize commands are skipped.
  - Follow-up contract-level file changes (`runtime/core`, `game/schemas`, `ai`) can ship without synchronized docs if S4 sync checks are skipped.
- Rollback:
  - Revert `runtime/core/types.ts` and `runtime/core/engine.ts` together to restore pre-RPG runtime-core template orchestration behavior.
  - Revert `runtime/templates/rpg-topdown/index.ts`, `runtime/templates/rpg-topdown/types.ts`, `runtime/templates/rpg-topdown/systems.ts`, and `runtime/templates/rpg-topdown/validator.ts` together to roll back RPG runtime template systems.
  - Revert `tests/integration/rpg-runtime-min-systems-runtime.test.ts` and `tests/integration/rpg-runtime-min-systems-scope.test.ts` together to restore pre-S2 regression baseline.
  - Revert `README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md` together if contract-doc synchronization changes need to be rolled back.
  - Revert `docs/ai/tasks/T-025-rpg-runtime-min-systems.md` and `tests/integration/rpg-runtime-min-systems-scope.test.ts` together to restore pre-S3 task contract/checklist state.
  - If only S3 documentation-state updates need rollback, revert `docs/ai/tasks/T-025-rpg-runtime-min-systems.md` and `tests/integration/rpg-runtime-min-systems-scope.test.ts`.
  - If only S4 memory/docs finalization needs rollback, revert `docs/ai/tasks/T-025-rpg-runtime-min-systems.md`, `tests/integration/rpg-runtime-min-systems-scope.test.ts`, `docs/ai/ai-loop-status.md`, `docs/ai/commit-log/2026-02.md`, and `docs/ai/weekly-summary.md` together.

## Subtask Progress

- [x] [S1] Define scope and acceptance criteria
- [x] [S2] Implement scoped code changes and pass fast/full gates
- [x] [S3] Update docs and risk notes
- [x] [S4] Finalize memory and complete task-level commit


## Subtask Progress
- [x] [S4] Finalize memory and complete task-level commit