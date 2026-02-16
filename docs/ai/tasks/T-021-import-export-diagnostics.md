# T-021: import-export-diagnostics

- Status: Done
- Owner: maintainer
- Branch: `main`
- Prompt-Plan: `ARCHITECT_v1`, `PLANNER_v1`
- Prompt-Impl: `BUILDER_v2`
- Prompt-Review: `GUARDIAN_v1`, `REVIEWER_v1`

## Goal

Strengthen import/export diagnostics to make data errors easy to locate and fix.

## Scope

- In scope:
  - Define diagnostics coverage boundaries for malformed JSON parse failures, schema-validation failures, and semantic-validation failures so import errors can be triaged deterministically.
  - Define a structured diagnostics contract (`code`, `path`, `hint`, `severity`, `source`) for import/export operations so callers receive actionable field-level feedback.
  - Define architecture ownership boundaries: diagnostics normalization in `editor/src/editor/api.ts`, validation-source ownership in `game/schemas`, and no cross-layer leakage into `runtime/core` behavior.
  - Define export-contract constraints that preserve deterministic, schema-valid `GamePackage` output for identical `GameProject` input.
  - Define regression-test expectations for top import/export failure scenarios, including malformed JSON, missing required fields, invalid enum-like values, and semantic payload mismatches.
- Out of scope:
  - Schema-version migration-window logic or compatibility-policy redesign (already covered by `T-020`).
  - New gameplay mechanics, runtime balance tuning, or renderer behavior changes unrelated to import/export diagnostics.
  - Template conversion workflows (for example, TD -> RPG) and cross-template migration automation.
  - Cloud sync, remote package registry, or account-scoped import/export workflows.

## Acceptance Criteria

- [x] [S1] Scope and acceptance contract explicitly defines import/export diagnostics taxonomy, structured error payload expectations, architecture boundaries, and out-of-scope limits for `T-021`.
- [x] [S2] Scoped implementation introduces actionable diagnostics (`code` + `path` + `hint`) for malformed JSON/schema/semantic import failures while preserving deterministic export behavior.
- [x] [S3] Regression tests cover top import/export failure scenarios and deterministic export invariants; `pnpm gate:fast` and `pnpm gate:full` pass.
- [x] [S4] If contract-level files change (`runtime/core`, `game/schemas`, `ai`), synchronize `README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md` in the same loop with updated risk/rollback notes.

## Subtasks

- [x] [S1] Define scope and acceptance criteria
- [x] [S2] Implement scoped code changes and pass fast/full gates
- [x] [S3] Update docs and risk notes
- [x] [S4] Finalize memory and complete task-level commit

## S1 Implementation Notes (2026-02-16)

- Locked S1 to planning-only output: this subtask defines diagnostics contract boundaries and acceptance checks only, with no runtime/editor/schema behavior changes.
- Expanded scope from generic wording to measurable diagnostics taxonomy across parse/schema/semantic failure classes so S2 can implement without ambiguity.
- Captured architecture ownership early (`editor/src/editor/api.ts` + `game/schemas` + `runtime/core` boundary) to prevent cross-layer leakage during diagnostics integration.
- Added explicit contract-doc synchronization trigger for any future contract-level changes in `runtime/core`, `game/schemas`, or `ai`.

## S2 Implementation Notes (2026-02-16)

- Added structured import/export diagnostics primitives in `editor/src/editor/api.ts`, including operation-scoped `code` generation, path normalization, severity/source tagging, and actionable `hint` mapping for parse/schema/semantic failures.
- Added `exportPackageWithDiagnostics` so export validation can return the same diagnostics contract (`code`, `path`, `hint`, `severity`, `source`) while preserving deterministic `exportPackage` output for identical input.
- Kept architecture ownership intact: diagnostics normalization remains in editor API; schema/semantic issue sources stay in `game/schemas` and template validators without leaking formatting logic into `runtime/core`.
- Added integration regression coverage in `tests/integration/import-export-diagnostics.test.ts` for malformed JSON parse failures, missing required fields, enum-like schema failures, semantic payload mismatches, and deterministic export invariants.

## S3 Documentation and Risk Notes (2026-02-16)

- Updated this task card for S3 closure so acceptance/subtask checklist state, change inventory, and risk narrative remain aligned with delivered import/export diagnostics behavior.
- Revalidated diagnostics ownership boundaries: normalization stays in `editor/src/editor/api.ts`; validation issue sources stay in `game/schemas` and template validators; `runtime/core` simulation ownership remains unchanged.
- Confirmed this S3 update introduced no new contract-level source changes in `runtime/core`, `game/schemas`, or `ai`, so `README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md` require no sync delta in this loop.
- Expanded risk notes to cover documentation-state drift and checklist mismatch risk before S4 memory finalization.

## S4 Memory Finalization and Task Closure (2026-02-16)

- Re-ran closure checks and confirmed pass evidence for `pnpm gate:fast`, `pnpm gate:full`, and `pnpm docs:sync-check`.
- Executed memory refresh commands `bash tools/git-memory/append-commit-log.sh --missing HEAD` and `bash tools/git-memory/update-weekly-summary.sh`; backfilled missing entry `c643763` into `docs/ai/commit-log/2026-02.md`, regenerated `docs/ai/weekly-summary.md`, then re-ran `--missing` and got `No missing commits to append.`.
- Updated `docs/ai/ai-loop-status.md` to `T-021` closure handoff state (`Issue: 21`, no remaining subtasks, next-step command `pnpm task:next`).
- Closed task metadata by setting status to `Done` and marking S4 acceptance/subtask checkboxes complete.
- Honored the explicit no-commit constraint for this run; task-level commit intent is captured through docs/tests/memory evidence only.
- Reconfirmed S4 introduced no new contract-level source changes (`runtime/core`, `game/schemas`, `ai`); S2/S3 contract-doc synchronization remains the active baseline.

## Change List

- `editor/src/editor/api.ts`: implemented import/export diagnostics normalization, failure classification, and deterministic export diagnostics entrypoint.
- `tests/integration/import-export-diagnostics.test.ts`: added regression coverage for parse/schema/semantic diagnostics and deterministic export invariants.
- `docs/ai/tasks/T-021-import-export-diagnostics.md`: expanded S2/S3 evidence, captured S4 closure checks, and finalized task metadata to `Done`.
- `tests/integration/import-export-diagnostics-scope.test.ts`: upgraded scope-contract assertions to reflect S1-S4 lifecycle state and memory-finalization evidence.
- `docs/ai/ai-loop-status.md`: switched loop board to `T-021` closure handoff state with no remaining subtasks.
- `docs/ai/commit-log/2026-02.md`: backfilled missing entry `c643763` during S4 memory refresh.
- `docs/ai/weekly-summary.md`: refreshed weekly memory summary after S4 memory finalize commands.

## Test Evidence

- Commands:
  - `pnpm exec eslint editor/src/editor/api.ts tests/integration/import-export-diagnostics.test.ts tests/integration/import-export-diagnostics-scope.test.ts`
  - `pnpm exec vitest run tests/integration/import-export-diagnostics.test.ts tests/integration/import-export-diagnostics-scope.test.ts`
  - `pnpm gate:fast`
  - `pnpm gate:full`
- S3 commands:
  - `pnpm exec eslint tests/integration/import-export-diagnostics-scope.test.ts`
  - `pnpm exec vitest run tests/integration/import-export-diagnostics-scope.test.ts`
  - `pnpm docs:sync-check`
- S4 commands:
  - `pnpm gate:fast`
  - `pnpm gate:full`
  - `pnpm docs:sync-check`
  - `bash tools/git-memory/append-commit-log.sh --missing HEAD`
  - `bash tools/git-memory/update-weekly-summary.sh`
  - `bash tools/git-memory/append-commit-log.sh --missing HEAD`
  - `pnpm exec eslint tests/integration/import-export-diagnostics-scope.test.ts`
  - `pnpm exec vitest run tests/integration/import-export-diagnostics-scope.test.ts`
- Result:
  - `pnpm exec eslint editor/src/editor/api.ts tests/integration/import-export-diagnostics.test.ts tests/integration/import-export-diagnostics-scope.test.ts` pass.
  - `pnpm exec vitest run tests/integration/import-export-diagnostics.test.ts tests/integration/import-export-diagnostics-scope.test.ts` pass (2 files, 10 tests).
  - `pnpm gate:fast` pass (`typecheck`, `test:determinism`, `test:schema`).
  - `pnpm gate:full` pass (`lint`, `test`, `test:determinism`, `test:schema`, `test:smoke-ai-package`).
  - `pnpm exec eslint tests/integration/import-export-diagnostics-scope.test.ts` pass.
  - `pnpm exec vitest run tests/integration/import-export-diagnostics-scope.test.ts` pass (1 file, 4 tests).
  - `pnpm docs:sync-check` pass.
  - `pnpm gate:fast` pass (`typecheck`, `test:determinism`, `test:schema`).
  - `pnpm gate:full` pass (`lint`, `test`, `test:determinism`, `test:schema`, `test:smoke-ai-package`).
  - `pnpm docs:sync-check` pass.
  - `bash tools/git-memory/append-commit-log.sh --missing HEAD` pass (`Appended commit summary to docs/ai/commit-log/2026-02.md: c643763`).
  - `bash tools/git-memory/update-weekly-summary.sh` pass.
  - `bash tools/git-memory/append-commit-log.sh --missing HEAD` pass (`No missing commits to append.`).
  - `pnpm exec eslint tests/integration/import-export-diagnostics-scope.test.ts` pass.
  - `pnpm exec vitest run tests/integration/import-export-diagnostics-scope.test.ts` pass (1 file, 4 tests).

## Risks and Rollback

- Risk:
  - Scope drift can blur boundaries between diagnostics delivery (`T-021`) and schema-version migration (`T-020`), reducing implementation focus.
  - Diagnostics classification or path-normalization drift can produce inconsistent `code`/`path`/`hint` payloads across parse/schema/semantic failure classes and weaken caller UX.
  - Import/export diagnostics contracts can diverge if one path evolves without mirrored regression coverage.
  - Diagnostics ownership can leak across layers if runtime simulation paths begin formatting editor-facing hints.
  - Export diagnostics changes can accidentally mutate package-shape behavior and break deterministic export expectations.
  - Task checklist and risk documentation can diverge from shipped behavior if scope tests and task-card updates are not kept synchronized.
  - Memory artifacts (`docs/ai/ai-loop-status.md`, `docs/ai/weekly-summary.md`) can drift from actual loop state if S4 finalize commands are skipped.
  - Follow-up work that touches contract-level files (`runtime/core`, `game/schemas`, `ai`) can miss required doc synchronization if S4 checks are skipped.
- Rollback:
  - Revert `docs/ai/tasks/T-021-import-export-diagnostics.md` and `tests/integration/import-export-diagnostics-scope.test.ts` together to restore the previous task-contract baseline.
  - Revert `editor/src/editor/api.ts` and `tests/integration/import-export-diagnostics.test.ts` together to roll back S2 diagnostics behavior while preserving architecture boundaries.
  - If only S3 documentation-state changes need rollback, revert `docs/ai/tasks/T-021-import-export-diagnostics.md` and `tests/integration/import-export-diagnostics-scope.test.ts`.
  - If only S4 memory/docs finalization needs rollback, revert `docs/ai/tasks/T-021-import-export-diagnostics.md`, `tests/integration/import-export-diagnostics-scope.test.ts`, `docs/ai/ai-loop-status.md`, `docs/ai/commit-log/2026-02.md`, and `docs/ai/weekly-summary.md` together.

## Subtask Progress

- [x] [S1] Define scope and acceptance criteria
- [x] [S2] Implement scoped code changes and pass fast/full gates
- [x] [S3] Update docs and risk notes
- [x] [S4] Finalize memory and complete task-level commit


## Subtask Progress
- [x] [S4] Finalize memory and complete task-level commit