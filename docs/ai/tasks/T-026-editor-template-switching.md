# T-026: editor-template-switching

- Status: Done
- Owner: maintainer
- Branch: `main`
- Prompt-Plan: `ARCHITECT_v1`, `PLANNER_v1`
- Prompt-Impl: `BUILDER_v2`
- Prompt-Review: `GUARDIAN_v1`, `REVIEWER_v1`

## Goal

Enable editor template switching while preserving data safety and UX clarity.

## Scope

- In scope:
  - Define template-switching contract in editor state and operations (`editor/src/editor/store.ts`, `editor/src/editor/operations.ts`) so project `templateId` changes are deterministic and traceable.
  - Define template-aware payload panel routing contract in `editor/src/app/App.tsx` + `editor/src/editor/inspector-form.ts`, including how TD/RPG-specific sections are shown or hidden.
  - Define compatibility-guard contract for template switching in `editor/src/editor/api.ts` and editor runtime-validation flow, including warning surfaces for lossy or incompatible fields before mutation.
  - Define import/export safety boundary so switching templates cannot silently corrupt persisted `GameProject`/`GamePackage` shape across `game/schemas` and runtime validators.
  - Define regression-test contract for switch workflow coverage, including TD -> RPG, RPG -> TD, cancellation path, and save/export integrity checks.
- Out of scope:
  - Live migration wizard or auto-field migration for every template combination.
  - New RPG gameplay/runtime systems, combat balancing, or quest logic changes (owned by `T-025` runtime scope).
  - AI prompt-routing or multi-template package-generation behavior (owned by `T-027` and `T-028`).
  - Asset pipeline, release automation, or sharing workflows planned in `T-029` to `T-033`.

## Acceptance Criteria

- [x] [S1] Scope and acceptance contract explicitly defines editor template-switching boundaries, ownership (`editor` UI/state vs `runtime/core` + `game/schemas` validation), and out-of-scope constraints for `T-026`.
- [x] [S2] Scoped implementation enables deterministic TD/RPG switch flow with payload-panel routing and compatibility guards while preserving current editor/runtime architecture boundaries.
- [x] [S3] Regression tests cover switch warnings, cancellation behavior, TD/RPG round-trip save/export integrity, and no cross-template data corruption; `pnpm gate:fast` and `pnpm gate:full` pass.
- [x] [S4] If contract-level files change (`runtime/core`, `game/schemas`, `ai`), synchronize `README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md` in the same loop with updated risk/rollback notes.

## Subtasks

- [x] [S1] Define scope and acceptance criteria
- [x] [S2] Implement scoped code changes and pass fast/full gates
- [x] [S3] Update docs and risk notes
- [x] [S4] Finalize memory and complete task-level commit

## S1 Implementation Notes (2026-02-17)

- Locked S1 to planning-only output: no production editor/runtime/schema/AI behavior changes are introduced in this subtask.
- Expanded scope into auditable contracts for switch state transitions, payload panel routing, validation ownership, and data-safety boundaries before S2 coding starts.
- Explicitly preserved architecture boundaries: editor handles UX/state orchestration, while structural/semantic validation ownership remains in `game/schemas` and `runtime/core` template validators.
- Captured downstream ownership boundaries (`T-027` to `T-033`) to prevent template-switching scope drift into AI orchestration, asset pipeline, or release tooling tracks.
- Added regression expectations for warning/cancel paths and TD/RPG save-export integrity so S2 can be validated with deterministic evidence.

## S2 Implementation Notes (2026-02-17)

- Added `editor/src/editor/template-switch.ts` as the template-switch domain module, including supported-template resolution, default project factories, warning generation, deterministic map/payload normalization, preview flow, and confirmed-apply flow.
- Extended `editor/src/editor/operations.ts` with `switch-template` operation handling, template-aware tool validation/mapping, and template-specific payload synchronization to keep editor mutations deterministic.
- Updated `editor/src/editor/api.ts` to expose `previewTemplateSwitch()` and `applyTemplateSwitch()`, route semantic diagnostics per template, and export both TD and RPG packages through template-specific normalization paths.
- Updated editor UI routing in `editor/src/app/App.tsx`, `editor/src/editor/components/Inspector.tsx`, `editor/src/editor/components/MapCanvas.tsx`, `editor/src/editor/inspector-form.ts`, `editor/src/editor/components/RpgPayloadPanel.tsx`, and `editor/src/styles.css` so template selection, warning confirmation, paint tools, and payload panels stay template-aware.
- Preserved architecture boundaries: UX orchestration remains in editor state/components, while schema/runtime contract validation remains delegated to `game/schemas` and `runtime/core` validators during import/export/preview flows.

## S3 Documentation and Risk Notes (2026-02-17)

- Updated this task card to close S3 with synchronized acceptance/subtask state, implementation evidence, and rollback guidance for template-switching delivery.
- Revalidated that S2 changed only editor-side files (`editor/*` + integration tests); no new contract-level source change occurred under `runtime/core`, `game/schemas`, or `ai`, so no additional release-contract doc sync was required in this subtask.
- Re-ran quality gates in this loop: `pnpm gate:fast` passed; `pnpm gate:full` showed one transient Three adapter failure on first run and passed on immediate retry, so evidence and risk notes now track both outcomes.
- Hardened risk notes for template-switch regressions (payload reset expectation, map-cell remap visibility, and checklist drift) to reduce S4 handoff ambiguity.
- Kept architecture-boundary narrative explicit so follow-up subtasks do not move template semantic ownership from runtime/schema layers into editor UI code.

## S4 Memory Finalization and Task Closure (2026-02-17)

- Re-ran closure checks and confirmed pass evidence for `pnpm gate:fast`, `pnpm gate:full`, and `pnpm docs:sync-check`.
- Executed memory refresh commands `bash tools/git-memory/append-commit-log.sh --missing HEAD` and `bash tools/git-memory/update-weekly-summary.sh`; backfilled missing entry `e212dfc` into `docs/ai/commit-log/2026-02.md`, regenerated `docs/ai/weekly-summary.md`, then re-ran `--missing` and got `No missing commits to append.`.
- Updated `docs/ai/ai-loop-status.md` to `T-026` closure handoff state (`Issue: 26`, no remaining subtasks, next-step command `pnpm task:next`).
- Closed task metadata by setting status to `Done` and marking S4 acceptance/subtask checkboxes complete.
- Honored the explicit no-commit constraint for this run; task-level commit intent is captured through docs/tests/memory evidence only.
- Reconfirmed S4 introduced no new contract-level source changes (`runtime/core`, `game/schemas`, `ai`); S2/S3 contract-doc synchronization remains the active baseline.

## Change List

- `editor/src/editor/template-switch.ts`: added template-switch contract, deterministic normalization, warning preview, and apply flow.
- `editor/src/editor/store.ts`: switched default-project factory to template-aware project creation.
- `editor/src/editor/operations.ts`: added template-switch operation and template-aware paint/tool behavior.
- `editor/src/editor/api.ts`: added template-switch API surface and template-specific export/diagnostic handling.
- `editor/src/editor/inspector-form.ts`: added template selector/tool-option/payload-panel helpers.
- `editor/src/app/App.tsx`: added template switch request/confirm/cancel flow and payload panel routing.
- `editor/src/editor/components/Inspector.tsx`: added template switch control, warning UI, and template-specific summary fields.
- `editor/src/editor/components/MapCanvas.tsx`: added template-aware brush labels and cell rendering semantics.
- `editor/src/editor/components/RpgPayloadPanel.tsx`: added RPG payload summary panel.
- `editor/src/styles.css`: added template-specific map-cell and switch-warning styles.
- `tests/integration/editor-template-switching.test.ts`: added regression coverage for warning/cancel flow, TD/RPG switches, round-trip integrity, and panel/tool routing.
- `tests/integration/inspector-form-ux.test.ts`: updated inspector integration assertions for template selector and new props.
- `docs/ai/tasks/T-026-editor-template-switching.md`: recorded S2/S3 evidence, captured S4 closure checks, and finalized task metadata to `Done`.
- `tests/integration/editor-template-switching-scope.test.ts`: advanced lifecycle assertions from S3-done/S4-pending to S4 closure and memory-finalization evidence.
- `docs/ai/ai-loop-status.md`: switched loop board to `T-026` closure handoff state with no remaining subtasks.
- `docs/ai/commit-log/2026-02.md`: backfilled missing entry `e212dfc` during S4 memory refresh.
- `docs/ai/weekly-summary.md`: refreshed weekly memory summary after S4 memory finalize commands.

## Test Evidence

- Commands:
  - `pnpm exec eslint editor/src/app/App.tsx editor/src/editor/api.ts editor/src/editor/components/Inspector.tsx editor/src/editor/components/MapCanvas.tsx editor/src/editor/components/RpgPayloadPanel.tsx editor/src/editor/inspector-form.ts editor/src/editor/operations.ts editor/src/editor/store.ts editor/src/editor/template-switch.ts tests/integration/editor-template-switching.test.ts tests/integration/editor-template-switching-scope.test.ts tests/integration/inspector-form-ux.test.ts`
  - `pnpm exec vitest run tests/integration/editor-template-switching.test.ts tests/integration/editor-template-switching-scope.test.ts tests/integration/inspector-form-ux.test.ts`
  - `pnpm gate:fast`
  - `pnpm gate:full`
- S3 commands:
  - `pnpm docs:sync-check`
- S4 commands:
  - `pnpm gate:fast`
  - `pnpm gate:full`
  - `pnpm docs:sync-check`
  - `bash tools/git-memory/append-commit-log.sh --missing HEAD`
  - `bash tools/git-memory/update-weekly-summary.sh`
  - `bash tools/git-memory/append-commit-log.sh --missing HEAD`
  - `pnpm exec eslint tests/integration/editor-template-switching-scope.test.ts`
  - `pnpm exec vitest run tests/integration/editor-template-switching-scope.test.ts`
- Result:
  - `pnpm exec eslint editor/src/app/App.tsx editor/src/editor/api.ts editor/src/editor/components/Inspector.tsx editor/src/editor/components/MapCanvas.tsx editor/src/editor/components/RpgPayloadPanel.tsx editor/src/editor/inspector-form.ts editor/src/editor/operations.ts editor/src/editor/store.ts editor/src/editor/template-switch.ts tests/integration/editor-template-switching.test.ts tests/integration/editor-template-switching-scope.test.ts tests/integration/inspector-form-ux.test.ts` pass.
  - `pnpm exec vitest run tests/integration/editor-template-switching.test.ts tests/integration/editor-template-switching-scope.test.ts tests/integration/inspector-form-ux.test.ts` pass.
  - `pnpm gate:fast` pass.
  - `pnpm gate:full` first run fail (`tests/integration/three-render-adapter-baseline.test.ts`, `tests/integration/three-render-adapter-interaction.test.ts`: `Cannot set properties of undefined (setting 'width')` in `runtime/render/three-adapter.ts:196`).
  - `pnpm gate:full` retry pass.
  - `pnpm docs:sync-check` pass.
  - `pnpm gate:fast` pass (`typecheck`, `test:determinism`, `test:schema`).
  - `pnpm gate:full` pass (`lint`, `test`, `test:determinism`, `test:schema`, `test:smoke-ai-package`).
  - `pnpm docs:sync-check` pass.
  - `bash tools/git-memory/append-commit-log.sh --missing HEAD` pass (`Appended commit summary to docs/ai/commit-log/2026-02.md: e212dfc`).
  - `bash tools/git-memory/update-weekly-summary.sh` pass (`Rendered weekly summary: /Users/wxx/Desktop/code/projectA/docs/ai/weekly-summary.md`).
  - `bash tools/git-memory/append-commit-log.sh --missing HEAD` pass (`No missing commits to append.`).
  - `pnpm exec eslint tests/integration/editor-template-switching-scope.test.ts` pass.
  - `pnpm exec vitest run tests/integration/editor-template-switching-scope.test.ts` pass.

## Risks and Rollback

- Risk:
  - Scope drift can blur boundaries between editor template-switch UX/state orchestration and runtime/schema semantic validation ownership.
  - Template switch warnings can regress (missing payload-reset or cell-remap surfaces), increasing risk of destructive or confusing switches.
  - TD/RPG round-trip exports can silently drift if template normalization and runtime/schema validations stop aligning.
  - `pnpm gate:full` can show transient Three adapter instability (`runtime/render/three-adapter.ts` width-style path); keep retry evidence and monitor for deterministic regressions before S4 closure.
  - Task-card acceptance/checklist state can diverge from shipped behavior if S3/S4 documentation updates are skipped before closure.
  - Memory artifacts (`docs/ai/ai-loop-status.md`, `docs/ai/commit-log/2026-02.md`, `docs/ai/weekly-summary.md`) can drift from actual loop state if S4 finalize commands are skipped.
  - Follow-up contract-level file changes (`runtime/core`, `game/schemas`, `ai`) can ship without synchronized release docs if S4 sync checks are bypassed.
- Rollback:
  - Revert `editor/src/editor/template-switch.ts`, `editor/src/editor/operations.ts`, and `editor/src/editor/store.ts` together to roll back template-switch state/operation behavior.
  - Revert `editor/src/editor/api.ts` and `tests/integration/editor-template-switching.test.ts` together to roll back switch API/export diagnostics contracts.
  - Revert `editor/src/app/App.tsx`, `editor/src/editor/components/Inspector.tsx`, `editor/src/editor/components/MapCanvas.tsx`, `editor/src/editor/components/RpgPayloadPanel.tsx`, `editor/src/editor/inspector-form.ts`, and `editor/src/styles.css` together to roll back template-aware editor UX routing.
  - Revert `docs/ai/tasks/T-026-editor-template-switching.md` and `tests/integration/editor-template-switching-scope.test.ts` together to restore pre-S3 task lifecycle and risk-note state.
  - If only S3 documentation-state updates need rollback, revert `docs/ai/tasks/T-026-editor-template-switching.md` and `tests/integration/editor-template-switching-scope.test.ts`.
  - If only S4 memory/docs finalization needs rollback, revert `docs/ai/tasks/T-026-editor-template-switching.md`, `tests/integration/editor-template-switching-scope.test.ts`, `docs/ai/ai-loop-status.md`, `docs/ai/commit-log/2026-02.md`, and `docs/ai/weekly-summary.md` together.

## Subtask Progress

- [x] [S1] Define scope and acceptance criteria
- [x] [S2] Implement scoped code changes and pass fast/full gates
- [x] [S3] Update docs and risk notes
- [x] [S4] Finalize memory and complete task-level commit


## Subtask Progress
- [x] [S4] Finalize memory and complete task-level commit