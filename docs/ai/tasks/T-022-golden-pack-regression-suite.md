# T-022: golden-pack-regression-suite

- Status: Done
- Owner: maintainer
- Branch: `main`
- Prompt-Plan: `ARCHITECT_v1`, `PLANNER_v1`
- Prompt-Impl: `BUILDER_v2`
- Prompt-Review: `GUARDIAN_v1`, `REVIEWER_v1`

## Goal

Create golden package regression suite to protect core gameplay/runtime contracts.

## Scope

- In scope:
  - Define golden package inventory boundaries for current TD fixtures and future-template onboarding, including required fixture metadata (`templateId`, `fixtureId`, `seedSet`, `expectedSignals`).
  - Define deterministic replay contract surfaces for `runScenario`, `runBatch`, and editor preview parity so identical package + seed inputs produce stable outcomes and metrics.
  - Define regression signal set for golden checks, covering schema validity, template-semantic validity, winner/duration outputs, and batch aggregate metrics with explicit tolerance rules.
  - Define failure-diff contract for regression output so failures always include fixture identity, signal name, expected value, actual value, and remediation hint.
  - Define architecture ownership boundaries: fixture data + assertions live in `tests/regression`, simulation semantics remain in `runtime/core` + template validators, and no cross-layer leakage into unrelated editor UI flows.
  - Define maintenance workflow expectations for adding/updating golden fixtures, including review evidence and deterministic baseline refresh rules.
- Out of scope:
  - Gameplay rebalance, wave/tower mechanic redesign, or runtime rule changes outside regression verification scaffolding.
  - Large-scale benchmark corpus curation, performance profiling pipelines, or soak/stress testing infra.
  - Cloud-hosted golden artifact storage, remote snapshot approvals, or CI-service-specific workflow redesign.
  - Full implementation of non-TD template gameplay systems; this task only defines how future templates plug into the golden regression contract.

## Acceptance Criteria

- [x] [S1] Scope and acceptance contract explicitly defines golden fixture inventory boundaries, deterministic replay surfaces, regression signal set, architecture ownership, and out-of-scope limits for `T-022`.
- [x] [S2] Scoped implementation delivers golden regression harness coverage for TD fixtures with deterministic checks across scenario, batch, and preview-parity signals plus actionable failure diffs.
- [x] [S3] Regression tests validate fixture contract parsing, deterministic signal assertions, and failure-diff readability; `pnpm gate:fast` and `pnpm gate:full` pass.
- [x] [S4] If contract-level files change (`runtime/core`, `game/schemas`, `ai`), synchronize `README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md` in the same loop with updated risk/rollback notes.

## Subtasks

- [x] [S1] Define scope and acceptance criteria
- [x] [S2] Implement scoped code changes and pass fast/full gates
- [x] [S3] Update docs and risk notes
- [x] [S4] Finalize memory and complete task-level commit

## S1 Implementation Notes (2026-02-16)

- Locked S1 to planning-only output: this subtask defines golden regression contract boundaries and acceptance checks only, with no runtime/editor/schema behavior changes.
- Expanded scope into measurable fixture + signal taxonomy so S2 can implement deterministic assertions and diff formatting without ambiguity.
- Captured ownership boundaries early (`tests/regression` assertions vs `runtime/core` and template-validator simulation semantics) to prevent cross-layer leakage.
- Added explicit contract-doc synchronization trigger for any follow-up subtask that modifies `runtime/core`, `game/schemas`, or `ai`.

## S2 Implementation Notes (2026-02-16)

- Added typed golden fixture inventory in `tests/regression/golden-pack-fixtures.ts` with required metadata (`templateId`, `fixtureId`, `seedSet`, `expectedSignals`) for TD easy/normal/hard packages.
- Added reusable harness in `tests/regression/golden-pack-harness.ts` to enforce fixture-contract parsing, deterministic replay checks (`runScenario`, `runBatch`, preview parity), tolerance-aware batch metrics, and actionable failure diff formatting.
- Added `tests/regression/golden-pack-regression.test.ts` to cover fixture metadata validity, deterministic signal assertions, contract-drift detection, and failure-diff readability.
- Refactored `tests/regression/core-v1-paths.test.ts` to consume shared golden fixture expectations so baseline values remain centralized and future fixture refreshes stay scoped.
- Kept architecture ownership intact: all fixture metadata, assertions, and diff formatting remain in `tests/regression`; no behavior changes in `runtime/core`, `game/schemas`, or `ai`, so no contract-doc sync delta is required in this subtask.

## S3 Documentation and Risk Notes (2026-02-16)

- Updated this task card for S3 closure so acceptance/subtask checklist state, change inventory, and risk narrative remain aligned with delivered golden-regression behavior.
- Revalidated architecture ownership boundaries: fixture inventory + assertions stay in `tests/regression`; simulation semantics stay in `runtime/core` and template validators; no cross-layer leakage into editor UI flows.
- Confirmed this S3 update introduces no new contract-level source changes in `runtime/core`, `game/schemas`, or `ai`, so `README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md` require no sync delta in this loop.
- Expanded risk notes to explicitly cover documentation-state drift and checklist mismatch risk before S4 memory finalization.

## S4 Memory Finalization and Task Closure (2026-02-16)

- Re-ran closure checks and confirmed pass evidence for `pnpm gate:fast`, `pnpm gate:full`, and `pnpm docs:sync-check`.
- Executed memory refresh commands `bash tools/git-memory/append-commit-log.sh --missing HEAD` and `bash tools/git-memory/update-weekly-summary.sh`; backfilled missing entry `f9cc712` into `docs/ai/commit-log/2026-02.md`, regenerated `docs/ai/weekly-summary.md`, then re-ran `--missing` and got `No missing commits to append.`.
- Updated `docs/ai/ai-loop-status.md` to `T-022` closure handoff state (`Issue: 22`, no remaining subtasks, next-step command `pnpm task:next`).
- Closed task metadata by setting status to `Done` and marking S4 acceptance/subtask checkboxes complete.
- Honored the explicit no-commit constraint for this run; task-level commit intent is captured through docs/tests/memory evidence only.
- Reconfirmed S4 introduced no new contract-level source changes (`runtime/core`, `game/schemas`, `ai`); S2/S3 contract-doc synchronization remains the active baseline.

## Change List

- `tests/regression/golden-pack-fixtures.ts`: added TD golden fixture inventory metadata and expected deterministic signals with explicit batch tolerances.
- `tests/regression/golden-pack-harness.ts`: added fixture-contract parsing, deterministic replay verification, and actionable failure-diff formatting helpers.
- `tests/regression/golden-pack-regression.test.ts`: added regression tests for fixture contract validity, deterministic scenario/batch/preview assertions, and failure-diff readability.
- `tests/regression/core-v1-paths.test.ts`: refactored scenario/batch baseline assertions to consume shared golden fixture expectations.
- `docs/ai/tasks/T-022-golden-pack-regression-suite.md`: recorded S2/S3 evidence, captured S4 closure checks, and finalized task metadata to `Done`.
- `tests/integration/golden-pack-regression-scope.test.ts`: advanced task-lifecycle contract assertions from S3 to S4 closure state and memory-finalization evidence.
- `docs/ai/ai-loop-status.md`: switched loop board to `T-022` closure handoff state with no remaining subtasks.
- `docs/ai/commit-log/2026-02.md`: backfilled missing entry `f9cc712` during S4 memory refresh.
- `docs/ai/weekly-summary.md`: refreshed weekly memory summary after S4 memory finalize commands.

## Test Evidence

- Commands:
  - `pnpm exec eslint tests/regression/golden-pack-fixtures.ts tests/regression/golden-pack-harness.ts tests/regression/golden-pack-regression.test.ts tests/regression/core-v1-paths.test.ts tests/integration/golden-pack-regression-scope.test.ts`
  - `pnpm exec vitest run tests/regression/golden-pack-regression.test.ts tests/regression/core-v1-paths.test.ts tests/integration/golden-pack-regression-scope.test.ts`
  - `pnpm gate:fast`
  - `pnpm gate:full`
- S3 commands:
  - `pnpm exec eslint tests/integration/golden-pack-regression-scope.test.ts`
  - `pnpm exec vitest run tests/integration/golden-pack-regression-scope.test.ts`
  - `pnpm docs:sync-check`
- S4 commands:
  - `pnpm gate:fast`
  - `pnpm gate:full`
  - `pnpm docs:sync-check`
  - `bash tools/git-memory/append-commit-log.sh --missing HEAD`
  - `bash tools/git-memory/update-weekly-summary.sh`
  - `bash tools/git-memory/append-commit-log.sh --missing HEAD`
  - `pnpm exec eslint tests/integration/golden-pack-regression-scope.test.ts`
  - `pnpm exec vitest run tests/integration/golden-pack-regression-scope.test.ts`
- Result:
  - `pnpm exec eslint tests/regression/golden-pack-fixtures.ts tests/regression/golden-pack-harness.ts tests/regression/golden-pack-regression.test.ts tests/regression/core-v1-paths.test.ts tests/integration/golden-pack-regression-scope.test.ts` pass.
  - `pnpm exec vitest run tests/regression/golden-pack-regression.test.ts tests/regression/core-v1-paths.test.ts tests/integration/golden-pack-regression-scope.test.ts` pass.
  - `pnpm gate:fast` pass (`typecheck`, `test:determinism`, `test:schema`).
  - `pnpm gate:full` pass (`lint`, `test`, `test:determinism`, `test:schema`, `test:smoke-ai-package`).
  - `pnpm exec eslint tests/integration/golden-pack-regression-scope.test.ts` pass.
  - `pnpm exec vitest run tests/integration/golden-pack-regression-scope.test.ts` pass (1 file, 4 tests).
  - `pnpm docs:sync-check` pass.
  - `pnpm gate:fast` pass (`typecheck`, `test:determinism`, `test:schema`).
  - `pnpm gate:full` pass (`lint`, `test`, `test:determinism`, `test:schema`, `test:smoke-ai-package`).
  - `pnpm docs:sync-check` pass.
  - `bash tools/git-memory/append-commit-log.sh --missing HEAD` pass (`Appended commit summary to docs/ai/commit-log/2026-02.md: f9cc712`).
  - `bash tools/git-memory/update-weekly-summary.sh` pass.
  - `bash tools/git-memory/append-commit-log.sh --missing HEAD` pass (`No missing commits to append.`).
  - `pnpm exec eslint tests/integration/golden-pack-regression-scope.test.ts` pass.
  - `pnpm exec vitest run tests/integration/golden-pack-regression-scope.test.ts` pass (1 file, 4 tests).

## Risks and Rollback

- Risk:
  - Scope drift can blur boundaries between golden-regression contract work (`T-022`) and gameplay/schema evolution tasks, causing unstable fixture expectations.
  - Ambiguous deterministic-signal definitions can produce flaky assertions or inconsistent diff output across local and CI runs.
  - Ownership leakage can occur if regression formatting logic is pushed into `runtime/core` or template validators instead of test harness surfaces.
  - Fixture expectations can drift if preview parity assertions do not pin exported-package replay behavior and documented tolerance rules together.
  - Task checklist and risk documentation can diverge from shipped behavior if scope tests and task-card updates are not kept synchronized.
  - Memory artifacts (`docs/ai/ai-loop-status.md`, `docs/ai/weekly-summary.md`) can drift from actual loop state if S4 finalize commands are skipped.
  - Future contract-level file changes (`runtime/core`, `game/schemas`, `ai`) can ship without synchronized docs if S4 sync rules are skipped.
- Rollback:
  - Revert `tests/regression/golden-pack-fixtures.ts`, `tests/regression/golden-pack-harness.ts`, `tests/regression/golden-pack-regression.test.ts`, and `tests/regression/core-v1-paths.test.ts` together to roll back S2 harness behavior and restore the previous regression baseline.
  - Revert `docs/ai/tasks/T-022-golden-pack-regression-suite.md` and `tests/integration/golden-pack-regression-scope.test.ts` together to restore pre-S3 task contract/checklist state.
  - If only S3 documentation-state updates need rollback, revert `docs/ai/tasks/T-022-golden-pack-regression-suite.md` and `tests/integration/golden-pack-regression-scope.test.ts`.
  - If only S4 memory/docs finalization needs rollback, revert `docs/ai/tasks/T-022-golden-pack-regression-suite.md`, `tests/integration/golden-pack-regression-scope.test.ts`, `docs/ai/ai-loop-status.md`, `docs/ai/commit-log/2026-02.md`, and `docs/ai/weekly-summary.md` together.

## Subtask Progress

- [x] [S1] Define scope and acceptance criteria
- [x] [S2] Implement scoped code changes and pass fast/full gates
- [x] [S3] Update docs and risk notes
- [x] [S4] Finalize memory and complete task-level commit


## Subtask Progress
- [x] [S4] Finalize memory and complete task-level commit