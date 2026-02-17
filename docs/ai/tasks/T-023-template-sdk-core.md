# T-023: template-sdk-core

- Status: Done
- Owner: maintainer
- Branch: `main`
- Prompt-Plan: `ARCHITECT_v1`, `PLANNER_v1`
- Prompt-Impl: `BUILDER_v2`
- Prompt-Review: `GUARDIAN_v1`, `REVIEWER_v1`

## Goal

Define template SDK core contract to onboard additional game templates safely.

## Scope

- In scope:
  - Define `registerTemplate()` lifecycle contract in `runtime/core/engine.ts`, including deterministic register/get/load behavior for known, unknown, and duplicate `templateId` cases.
  - Define Template SDK core surface in `runtime/core/types.ts` (`RuntimeTemplate` + hook responsibilities for `validate`, `createWorld`, `step`) with explicit fail-fast expectations when hooks are missing or invalid.
  - Define validation pipeline ownership boundaries so `game/schemas` handles schema compatibility, template validators handle semantic checks, and registry orchestration stays inside `runtime/core` without cross-layer leakage.
  - Define required integration hooks for template onboarding across runtime entrypoints (`loadPackage`, `runScenario`, `runBatch`) and editor/import flow (`editor/src/editor/api.ts`) while preserving TD baseline behavior.
  - Define test contract for SDK onboarding: registry lifecycle guards, unknown-template diagnostics, and TD compatibility regression coverage for existing package fixtures.
- Out of scope:
  - Full gameplay/system implementation for future templates (for example, RPG combat, quests, AI behaviors).
  - Editor template-switching UX, template-specific inspector panels, or project migration UX (tracked by `T-026`).
  - AI multi-template routing/prompt orchestration and cross-template package generation logic (tracked by `T-027`).
  - Cross-template simulation analytics, delivery tooling, or asset pipeline changes outside SDK core registry/contract boundaries.

## Acceptance Criteria

- [x] [S1] Scope and acceptance contract explicitly defines template SDK registry lifecycle, hook responsibilities, architecture ownership, and out-of-scope constraints for `T-023`.
- [x] [S2] Scoped implementation hardens template registration/load validation contracts and keeps TD template execution fully compatible through SDK entrypoints.
- [x] [S3] Regression tests cover registry lifecycle guards, unknown-template diagnostics, and TD compatibility invariants; `pnpm gate:fast` and `pnpm gate:full` pass.
- [x] [S4] If contract-level files change (`runtime/core`, `game/schemas`, `ai`), synchronize `README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md` in the same loop with updated risk/rollback notes.

## Subtasks

- [x] [S1] Define scope and acceptance criteria
- [x] [S2] Implement scoped code changes and pass fast/full gates
- [x] [S3] Update docs and risk notes
- [x] [S4] Finalize memory and complete task-level commit

## S1 Implementation Notes (2026-02-16)

- Locked S1 to planning-only output: no runtime/editor/schema production behavior changes are introduced in this subtask.
- Expanded Template SDK scope into measurable registry lifecycle + hook-responsibility contracts so S2 implementation can be audited deterministically.
- Captured architecture boundaries early (`runtime/core` registry orchestration, `game/schemas` schema compatibility, template validators semantic checks) to avoid cross-layer leakage.
- Added explicit contract-doc synchronization trigger for any follow-up subtask that changes `runtime/core`, `game/schemas`, or `ai`.

## S2 Implementation Notes (2026-02-16)

- Hardened `runtime/core/engine.ts` template registry lifecycle with fail-fast contract checks for `templateId`, required hooks (`validate`, `createWorld`, `step`), deterministic duplicate registration rejection, and explicit unknown-template diagnostics.
- Added runtime-level validation entrypoint `validateRuntimePackage()` so template resolution and semantic validation orchestration remain centralized in `runtime/core`.
- Updated `editor/src/editor/api.ts` semantic validation flow to consume `validateRuntimePackage()` instead of directly calling TD validator, preserving architecture ownership boundaries while keeping existing TD diagnostics contract behavior.
- Added `tests/integration/template-sdk-core-runtime.test.ts` coverage for invalid-template registration guards, duplicate registration behavior, unknown-template diagnostics, and compatibility of `loadPackage`/`runScenario`/`runBatch` for registered SDK templates.
- Re-ran `pnpm gate:fast` and `pnpm gate:full` in the same loop to ensure S2 runtime hardening stays green against deterministic/schema/smoke baselines.

## S3 Documentation and Risk Notes (2026-02-16)

- Updated this task card for S3 closure so acceptance/subtask checklist state, change inventory, and risk narrative remain aligned with delivered Template SDK core behavior.
- Revalidated Template SDK contract wording across `README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md`; runtime registry ownership, fail-fast hook validation, and unknown-template diagnostics stay synchronized.
- Confirmed this S3 update introduces no new contract-level source changes in `runtime/core`, `game/schemas`, or `ai`; documentation delta is limited to task/risk evidence and regression assertions.
- Expanded risk notes to explicitly cover documentation-state drift and checklist mismatch risk before S4 memory finalization.

## S4 Memory Finalization and Task Closure (2026-02-16)

- Re-ran closure checks and confirmed pass evidence for `pnpm gate:fast`, `pnpm gate:full`, and `pnpm docs:sync-check`.
- Executed memory refresh commands `bash tools/git-memory/append-commit-log.sh --missing HEAD` and `bash tools/git-memory/update-weekly-summary.sh`; backfilled missing entry `61b1510` into `docs/ai/commit-log/2026-02.md`, regenerated `docs/ai/weekly-summary.md`, then re-ran `--missing` and got `No missing commits to append.`.
- Updated `docs/ai/ai-loop-status.md` to `T-023` closure handoff state (`Issue: 23`, no remaining subtasks, next-step command `pnpm task:next`).
- Closed task metadata by setting status to `Done` and marking S4 acceptance/subtask checkboxes complete.
- Honored the explicit no-commit constraint for this run; task-level commit intent is captured through docs/tests/memory evidence only.
- Reconfirmed S4 introduced no new contract-level source changes (`runtime/core`, `game/schemas`, `ai`); S2/S3 contract-doc synchronization remains the active baseline.

## Change List

- `docs/ai/tasks/T-023-template-sdk-core.md`: expanded S2/S3 evidence, captured S4 closure checks, and finalized task metadata to `Done`.
- `tests/integration/template-sdk-core-scope.test.ts`: upgraded lifecycle assertions to reflect S1-S4 closure state and memory-finalization evidence.
- `runtime/core/engine.ts`: hardened template registry contract checks, duplicate registration guardrails, and added `validateRuntimePackage()` runtime orchestration API.
- `runtime/core/types.ts`: added `RuntimeTemplateHookName` to keep required SDK hook names explicit in core contract typing.
- `editor/src/editor/api.ts`: switched semantic runtime validation orchestration to `validateRuntimePackage()` and added source routing for runtime-core diagnostics without changing TD baseline diagnostics expectations.
- `tests/integration/template-sdk-core-runtime.test.ts`: added S2 runtime integration coverage for registry lifecycle guards, unknown-template diagnostics, and SDK entrypoint compatibility.
- `README.md`: documented Template SDK registry/validation ownership and duplicate/unknown-template fail-fast expectations.
- `docs/ai/README.md`: synchronized Template SDK contract note with runtime-core ownership and fail-fast behavior.
- `docs/ai/workflows/continuous-loop.md`: synchronized loop-level Template SDK contract note for runtime orchestration and fail-fast guarantees.
- `docs/ai/ai-loop-status.md`: switched loop board to `T-023` closure handoff state with no remaining subtasks.
- `docs/ai/commit-log/2026-02.md`: backfilled missing entry `61b1510` during S4 memory refresh.
- `docs/ai/weekly-summary.md`: refreshed weekly memory summary after S4 memory finalize commands.

## Test Evidence

- Commands:
  - `pnpm exec eslint tests/integration/template-sdk-core-scope.test.ts`
  - `pnpm exec vitest run tests/integration/template-sdk-core-scope.test.ts`
  - `pnpm exec eslint runtime/core/engine.ts runtime/core/types.ts editor/src/editor/api.ts tests/integration/template-sdk-core-runtime.test.ts tests/integration/template-sdk-core-scope.test.ts`
  - `pnpm exec vitest run tests/integration/template-sdk-core-runtime.test.ts tests/integration/template-sdk-core-scope.test.ts`
  - `pnpm gate:fast`
  - `pnpm gate:full`
- S3 commands:
  - `pnpm exec eslint tests/integration/template-sdk-core-scope.test.ts`
  - `pnpm exec vitest run tests/integration/template-sdk-core-scope.test.ts`
  - `pnpm docs:sync-check`
- S4 commands:
  - `pnpm gate:fast`
  - `pnpm gate:full`
  - `pnpm docs:sync-check`
  - `bash tools/git-memory/append-commit-log.sh --missing HEAD`
  - `bash tools/git-memory/update-weekly-summary.sh`
  - `bash tools/git-memory/append-commit-log.sh --missing HEAD`
  - `pnpm exec eslint tests/integration/template-sdk-core-scope.test.ts`
  - `pnpm exec vitest run tests/integration/template-sdk-core-scope.test.ts`
- Result:
  - `pnpm exec eslint tests/integration/template-sdk-core-scope.test.ts` pass.
  - `pnpm exec vitest run tests/integration/template-sdk-core-scope.test.ts` pass.
  - `pnpm exec eslint runtime/core/engine.ts runtime/core/types.ts editor/src/editor/api.ts tests/integration/template-sdk-core-runtime.test.ts tests/integration/template-sdk-core-scope.test.ts` pass.
  - `pnpm exec vitest run tests/integration/template-sdk-core-runtime.test.ts tests/integration/template-sdk-core-scope.test.ts` pass.
  - `pnpm gate:fast` pass.
  - `pnpm gate:full` pass.
  - `pnpm exec eslint tests/integration/template-sdk-core-scope.test.ts` pass.
  - `pnpm exec vitest run tests/integration/template-sdk-core-scope.test.ts` pass.
  - `pnpm docs:sync-check` pass.
  - `pnpm gate:fast` pass (`typecheck`, `test:determinism`, `test:schema`).
  - `pnpm gate:full` pass (`lint`, `test`, `test:determinism`, `test:schema`, `test:smoke-ai-package`).
  - `pnpm docs:sync-check` pass.
  - `bash tools/git-memory/append-commit-log.sh --missing HEAD` pass (`Appended commit summary to docs/ai/commit-log/2026-02.md: 61b1510`).
  - `bash tools/git-memory/update-weekly-summary.sh` pass.
  - `bash tools/git-memory/append-commit-log.sh --missing HEAD` pass (`No missing commits to append.`).
  - `pnpm exec eslint tests/integration/template-sdk-core-scope.test.ts` pass.
  - `pnpm exec vitest run tests/integration/template-sdk-core-scope.test.ts` pass.

## Risks and Rollback

- Risk:
  - Scope drift can blur boundaries between SDK-core contract work (`T-023`) and downstream template-delivery tracks (`T-024`, `T-025`, `T-026`, `T-027`), reducing S2 implementation focus.
  - Ambiguous registry lifecycle semantics (duplicate IDs, missing hooks, unknown templates) can lead to inconsistent runtime errors and fragile onboarding behavior.
  - Ownership leakage can occur if editor or AI layers start enforcing runtime registry rules instead of keeping orchestration in `runtime/core`.
  - Template SDK contract docs can drift across `README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md`, weakening release handoff clarity.
  - Registry lifecycle hardening can break onboarding if new templates rely on implicit duplicate overwrite or incomplete hook stubs during bootstrap.
  - Moving semantic orchestration to `runtime/core` can regress editor diagnostics routing if source mapping drifts from template ownership.
  - Running template validators without schema-level template-const relaxation still keeps non-TD template onboarding blocked at schema layer until follow-up schema tasks land.
  - Task checklist and risk documentation can diverge from shipped behavior if scope tests and task-card updates are not kept synchronized.
  - Memory artifacts (`docs/ai/ai-loop-status.md`, `docs/ai/weekly-summary.md`) can drift from actual loop state if S4 finalize commands are skipped.
  - Follow-up contract-level file changes (`runtime/core`, `game/schemas`, `ai`) can ship without synchronized docs if S4 sync checks are skipped.
- Rollback:
  - Revert `runtime/core/engine.ts`, `runtime/core/types.ts`, `editor/src/editor/api.ts`, and `tests/integration/template-sdk-core-runtime.test.ts` together to restore pre-S2 template registry/runtime-validation behavior.
  - Revert `README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md` together if template SDK contract note sync needs to roll back.
  - Revert `docs/ai/tasks/T-023-template-sdk-core.md` and `tests/integration/template-sdk-core-scope.test.ts` together to restore pre-S3 task contract/checklist state.
  - If only S3 documentation-state updates need rollback, revert `docs/ai/tasks/T-023-template-sdk-core.md` and `tests/integration/template-sdk-core-scope.test.ts`.
  - If only S4 memory/docs finalization needs rollback, revert `docs/ai/tasks/T-023-template-sdk-core.md`, `tests/integration/template-sdk-core-scope.test.ts`, `docs/ai/ai-loop-status.md`, `docs/ai/commit-log/2026-02.md`, and `docs/ai/weekly-summary.md` together.


## Subtask Progress
- [x] [S1] Define scope and acceptance criteria
- [x] [S2] Implement scoped code changes and pass fast/full gates
- [x] [S3] Update docs and risk notes
- [x] [S4] Finalize memory and complete task-level commit
