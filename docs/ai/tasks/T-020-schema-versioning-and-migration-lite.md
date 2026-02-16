# T-020: schema-versioning-and-migration-lite

- Status: Done
- Owner: maintainer
- Branch: `main`
- Prompt-Plan: `ARCHITECT_v1`, `PLANNER_v1`
- Prompt-Impl: `BUILDER_v2`
- Prompt-Review: `GUARDIAN_v1`, `REVIEWER_v1`

## Goal

Introduce lightweight schema versioning and migration support for package evolution.

## Scope

- In scope:
  - Define an explicit schema-version contract for `GameProject.meta.version` and `GamePackage.version`, including major/minor compatibility expectations and fail-fast behavior for unsupported versions.
  - Define bump rules for compatible vs non-compatible schema changes so future tasks can classify patch/minor/major evolution consistently.
  - Define a minimal migration window that only supports one adjacent minor step (for example, `0.1.x -> 0.2.x`) with deterministic one-way upgrade semantics.
  - Define migration entrypoint boundaries across `game/schemas`, `editor/src/editor/api.ts`, and `runtime/core/engine.ts` so load/export paths remain consistent without cross-layer leakage.
  - Define regression expectations for version parsing, compatibility checks, migration success paths, and unsupported-version diagnostics.
- Out of scope:
  - Long-term multi-major migration orchestration or chained migrations across multiple historical versions.
  - Automatic downgrade support (`new -> old`) or bidirectional migration graph management.
  - Cross-template schema conversion (for example, TD -> RPG) or template onboarding redesign.
  - Import/export diagnostics redesign beyond schema-version compatibility checks (tracked separately by `T-021`).

## Acceptance Criteria

- [x] [S1] Scope and acceptance contract explicitly defines schema-version compatibility boundaries, one-minor-window migration limits, architecture ownership, and out-of-scope constraints for `T-020`.
- [x] [S2] Scoped implementation introduces deterministic version parsing and migration helpers for one minor window while preserving existing architecture boundaries (`runtime/core`, `game/schemas`, `editor` integration).
- [x] [S3] Regression tests cover supported legacy load/migrate paths, unsupported-version fail-fast diagnostics, and version edge cases; `pnpm gate:fast` and `pnpm gate:full` pass.
- [x] [S4] If contract-level files change (`runtime/core`, `game/schemas`, `ai`), synchronize `README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md` in the same loop with updated risk/rollback notes.

## Subtasks

- [x] [S1] Define scope and acceptance criteria
- [x] [S2] Implement scoped code changes and pass fast/full gates
- [x] [S3] Update docs and risk notes
- [x] [S4] Finalize memory and complete task-level commit

## S1 Implementation Notes (2026-02-16)

- Locked S1 to planning-only output: this subtask defines contract boundaries and acceptance checks only, with no runtime/editor/schema behavior changes.
- Refined the migration-lite contract to a deterministic one-minor-window upgrade model so S2 implementation can remain low-risk and auditable.
- Captured architecture constraints early (`game/schemas` + `runtime/core` + `editor` integration points) to prevent ownership leakage during migration-hook integration.
- Added explicit contract-doc synchronization trigger for any future contract-level changes in `runtime/core`, `game/schemas`, or `ai`.

## S2 Implementation Notes (2026-02-16)

- Added deterministic schema-version primitives in `game/schemas/index.ts`: strict semver parsing, patch/minor/major bump classification, one-minor compatibility checks, and one-way migration helpers for `GameProject.meta.version` + `GamePackage.version`.
- Enforced one-window migration semantics (`0.1.x -> 0.2.0`) with fail-fast diagnostics for malformed versions, unsupported majors, future minors, and stale minors outside migration window.
- Wired migration entrypoints into `editor/src/editor/api.ts` (`loadProject`) and `runtime/core/engine.ts` (`loadPackage`) so editor load/export and runtime load paths stay contract-aligned without cross-layer leakage.
- Updated default editor project schema version source to `CURRENT_SCHEMA_VERSION` and extended schema JSON contracts with explicit semver patterns.
- Added regression coverage for version parsing/classification, migration success path, source immutability during migration, and unsupported-version diagnostics across schema/runtime/editor integration.
- Because contract-level files changed (`runtime/core`, `game/schemas`), synchronized `README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md` with schema-version contract notes in the same loop.

## S3 Documentation and Risk Notes (2026-02-16)

- Updated this task card for S3 closure so checklist status, implementation notes, and risk narrative stay aligned with delivered schema-versioning behavior.
- Revalidated schema-version contract language across `README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md`; baseline `0.2.0`, one-minor migration window, and fail-fast diagnostics remain synchronized.
- Confirmed architecture boundaries remain intact: migration logic stays in `game/schemas`, editor/runtime entrypoints stay in `editor/src/editor/api.ts` and `runtime/core/engine.ts`, with no new cross-layer ownership leakage.
- Confirmed this S3 update introduces no new contract-level source changes (`runtime/core`, `game/schemas`, `ai`); documentation delta is limited to task/risk evidence and regression assertions.
- Expanded risk and rollback notes to explicitly cover documentation drift and task-contract checklist mismatch risk for follow-up subtasks.

## S4 Memory Finalization and Task Closure (2026-02-16)

- Re-ran closure checks and confirmed pass evidence for `pnpm gate:fast`, `pnpm gate:full`, and `pnpm docs:sync-check`.
- Executed memory refresh commands `bash tools/git-memory/append-commit-log.sh --missing HEAD` and `bash tools/git-memory/update-weekly-summary.sh`; backfilled missing entry `4c86e79` into `docs/ai/commit-log/2026-02.md`, regenerated `docs/ai/weekly-summary.md`, then re-ran `--missing` and got `No missing commits to append.`.
- Updated `docs/ai/ai-loop-status.md` to `T-020` closure handoff state (`Issue: 20`, no remaining subtasks, next-step command `pnpm task:next`).
- Closed task metadata by setting status to `Done` and marking S4 acceptance/subtask checkboxes complete.
- Honored the explicit no-commit constraint for this run; task-level commit intent is captured through docs/tests/memory evidence only.
- Reconfirmed S4 introduced no new contract-level source changes (`runtime/core`, `game/schemas`, `ai`); S2/S3 contract-doc synchronization remains the active baseline.

## Change List

- `docs/ai/tasks/T-020-schema-versioning-and-migration-lite.md`: expanded S1 scope, captured S2/S3 evidence, and finalized S4 closure metadata, memory evidence, and handoff notes.
- `tests/integration/schema-versioning-migration-scope.test.ts`: added S1 contract checks and advanced checklist assertions to full S4 closure state.
- `game/schemas/index.ts`: implemented schema-version parsing/classification helpers, compatibility rules, one-minor migration helpers, and version-aware project/package validation.
- `game/schemas/game-project.schema.json`: tightened `meta.version` contract to strict semver format.
- `game/schemas/game-package.schema.json`: tightened package `version` contract to strict semver format.
- `runtime/core/engine.ts`: added runtime package-version migration/compatibility gate before template validation and world creation.
- `editor/src/editor/api.ts`: added project-load migration path so legacy project versions upgrade deterministically on load.
- `editor/src/editor/store.ts`: switched default project version to `CURRENT_SCHEMA_VERSION`.
- `tests/schema/schema-versioning.test.ts`: added unit regression coverage for parsing, bump classification, compatibility checks, and migration behavior.
- `tests/integration/schema-versioning-migration.test.ts`: added integration regression coverage for runtime/editor migration entrypoints and unsupported-version fail-fast diagnostics.
- `README.md`: documented schema-version baseline, migration window, fail-fast diagnostics, and boundary ownership.
- `docs/ai/README.md`: synchronized schema-version contract note with load-path ownership and fail-fast expectations.
- `docs/ai/workflows/continuous-loop.md`: synchronized schema-version contract note with loop enforcement context.
- `docs/ai/ai-loop-status.md`: switched loop board to `T-020` closure handoff state with no remaining subtasks.
- `docs/ai/commit-log/2026-02.md`: backfilled missing entry `4c86e79` during S4 memory refresh.
- `docs/ai/weekly-summary.md`: refreshed weekly memory summary after S4 memory finalize commands.

## Test Evidence

- Commands:
  - `pnpm exec eslint tests/integration/schema-versioning-migration-scope.test.ts`
  - `pnpm exec vitest run tests/integration/schema-versioning-migration-scope.test.ts`
  - `pnpm typecheck`
  - `pnpm exec vitest run tests/schema/schema-versioning.test.ts tests/integration/schema-versioning-migration.test.ts`
  - `pnpm gate:fast`
  - `pnpm gate:full`
  - `pnpm docs:sync-check`
- S3 commands:
  - `pnpm exec eslint tests/integration/schema-versioning-migration-scope.test.ts`
  - `pnpm exec vitest run tests/integration/schema-versioning-migration-scope.test.ts`
  - `pnpm docs:sync-check`
- S4 commands:
  - `pnpm gate:fast`
  - `pnpm gate:full`
  - `pnpm docs:sync-check`
  - `bash tools/git-memory/append-commit-log.sh --missing HEAD`
  - `bash tools/git-memory/update-weekly-summary.sh`
  - `bash tools/git-memory/append-commit-log.sh --missing HEAD`
  - `pnpm exec eslint tests/integration/schema-versioning-migration-scope.test.ts`
  - `pnpm exec vitest run tests/integration/schema-versioning-migration-scope.test.ts`
- Result:
  - `pnpm exec eslint tests/integration/schema-versioning-migration-scope.test.ts` pass.
  - `pnpm exec vitest run tests/integration/schema-versioning-migration-scope.test.ts` pass (1 file, 4 tests).
  - `pnpm typecheck` pass.
  - `pnpm exec vitest run tests/schema/schema-versioning.test.ts tests/integration/schema-versioning-migration.test.ts` pass (2 files, 9 tests).
  - `pnpm gate:fast` pass (`typecheck`, `test:determinism`, `test:schema`).
  - `pnpm gate:full` pass (`lint`, `test`, `test:determinism`, `test:schema`, `test:smoke-ai-package`).
  - `pnpm docs:sync-check` pass.
  - `pnpm exec eslint tests/integration/schema-versioning-migration-scope.test.ts` pass.
  - `pnpm exec vitest run tests/integration/schema-versioning-migration-scope.test.ts` pass (1 file, 4 tests).
  - `pnpm docs:sync-check` pass.
  - `pnpm gate:fast` pass (`typecheck`, `test:determinism`, `test:schema`).
  - `pnpm gate:full` pass (`lint`, `test`, `test:determinism`, `test:schema`, `test:smoke-ai-package`).
  - `pnpm docs:sync-check` pass.
  - `bash tools/git-memory/append-commit-log.sh --missing HEAD` pass (`Appended commit summary to docs/ai/commit-log/2026-02.md: 4c86e79`).
  - `bash tools/git-memory/update-weekly-summary.sh` pass.
  - `bash tools/git-memory/append-commit-log.sh --missing HEAD` pass (`No missing commits to append.`).
  - `pnpm exec eslint tests/integration/schema-versioning-migration-scope.test.ts` pass.
  - `pnpm exec vitest run tests/integration/schema-versioning-migration-scope.test.ts` pass (1 file, 4 tests).

## Risks and Rollback

- Risk:
  - Scope drift can blur boundaries between schema-version migration (`T-020`) and diagnostics-focused work (`T-021`), reducing implementation focus.
  - Ambiguous version-bump rules can cause inconsistent migration behavior across load/export paths and create non-deterministic compatibility outcomes.
  - Migration-hook regressions can accidentally mutate source payloads and leak side effects across editor/runtime call sites.
  - Inconsistent version handling between schema validation and runtime load paths can mask unsupported versions or produce non-actionable diagnostics.
  - Schema-version contract docs can drift across `README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md`, weakening release handoff clarity.
  - Task checklist state can diverge from real S3 completion evidence if task/test contract assertions are not updated together.
  - Memory artifacts (`docs/ai/ai-loop-status.md`, `docs/ai/weekly-summary.md`) can drift from actual loop state if S4 finalize commands are skipped.
  - Future contract-level changes in `runtime/core`, `game/schemas`, or `ai` can ship without synchronized docs if S4 sync rules are skipped.
- Rollback:
  - Revert `docs/ai/tasks/T-020-schema-versioning-and-migration-lite.md` and `tests/integration/schema-versioning-migration-scope.test.ts` together to restore the previous task baseline.
  - Revert `game/schemas/index.ts`, `game/schemas/game-project.schema.json`, `game/schemas/game-package.schema.json`, `runtime/core/engine.ts`, `editor/src/editor/api.ts`, and `editor/src/editor/store.ts` together to roll back S2 runtime/editor/schema versioning behavior safely.
  - Revert `tests/schema/schema-versioning.test.ts` and `tests/integration/schema-versioning-migration.test.ts` together if migration regression assertions must be backed out.
  - Revert `README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md` together if schema-version contract doc sync needs to be undone.
  - Revert only S3 documentation-state updates by restoring `docs/ai/tasks/T-020-schema-versioning-and-migration-lite.md` and `tests/integration/schema-versioning-migration-scope.test.ts` if checklist/risk-note wording needs to roll back independently.
  - If only S4 memory/docs finalization needs rollback, revert `docs/ai/tasks/T-020-schema-versioning-and-migration-lite.md`, `tests/integration/schema-versioning-migration-scope.test.ts`, `docs/ai/ai-loop-status.md`, `docs/ai/commit-log/2026-02.md`, and `docs/ai/weekly-summary.md` together.

## Subtask Progress

- [x] [S1] Define scope and acceptance criteria
- [x] [S2] Implement scoped code changes and pass fast/full gates
- [x] [S3] Update docs and risk notes
- [x] [S4] Finalize memory and complete task-level commit


## Subtask Progress
- [x] [S4] Finalize memory and complete task-level commit