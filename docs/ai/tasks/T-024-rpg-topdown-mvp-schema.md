# T-024: rpg-topdown-mvp-schema

- Status: Done
- Owner: maintainer
- Branch: `main`
- Prompt-Plan: `ARCHITECT_v1`, `PLANNER_v1`
- Prompt-Impl: `BUILDER_v2`
- Prompt-Review: `GUARDIAN_v1`, `REVIEWER_v1`

## Goal

Deliver RPG topdown MVP schema contract compatible with data-driven runtime.

## Scope

- In scope:
  - Define RPG topdown payload contract in `game/schemas/rpg-topdown.schema.json` and wire `game-project.schema.json` + `game-package.schema.json` through template-aware schema branches without breaking existing tower-defense compatibility.
  - Define MVP-required structural fields for RPG map/entities/rules payloads (for example: walkable map metadata, player/enemy stat blocks, spawn/layout definitions, and tick/combat baseline config) with explicit type/required/bounds constraints.
  - Define schema ownership boundaries: JSON shape and version compatibility stay in `game/schemas`, runtime semantic invariants remain in template validators/runtime entrypoints, and editor/import flows continue consuming shared validation APIs.
  - Define sample fixture coverage for RPG schema onboarding (valid package/project fixtures and invalid-state fixtures) with deterministic validation expectations.
  - Define task-level regression expectations for schema validation paths, compatibility guards, and architecture-boundary preservation before implementation subtasks begin.
- Out of scope:
  - Implement RPG runtime systems (movement/combat/quest loops), which belongs to `T-025`.
  - Build editor template-switching UX or RPG-specific inspector workflows, which belongs to `T-026`.
  - Implement AI multi-template generation/routing workflows, which belongs to `T-027` and `T-028`.
  - Add asset pipeline, telemetry dashboard, or release automation work planned in `T-029` to `T-031`.

## Acceptance Criteria

- [x] [S1] Scope and acceptance contract explicitly defines RPG topdown schema boundaries (map/entities/rules), architecture ownership (`game/schemas` vs runtime/editor validators), and out-of-scope constraints for `T-024`.
- [x] [S2] Scoped implementation adds RPG topdown schema contract files + wiring and sample fixtures while preserving tower-defense schema compatibility and architecture boundaries.
- [x] [S3] Regression tests cover required-field validation, invalid-state rejection, compatibility guards, and RPG fixture pass paths; `pnpm gate:fast` and `pnpm gate:full` pass.
- [x] [S4] If contract-level files change (`runtime/core`, `game/schemas`, `ai`), synchronize `README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md` in the same loop with updated risk/rollback notes.

## Subtasks

- [x] [S1] Define scope and acceptance criteria
- [x] [S2] Implement scoped code changes and pass fast/full gates
- [x] [S3] Update docs and risk notes
- [x] [S4] Finalize memory and complete task-level commit

## S1 Implementation Notes (2026-02-17)

- Locked S1 to planning-only output: no production schema/runtime/editor behavior changes are introduced in this subtask.
- Expanded RPG topdown schema scope into explicit map/entities/rules contract boundaries so S2 implementation can be audited deterministically.
- Captured ownership boundaries early (`game/schemas` for structural/version contracts, runtime template validation for semantic rules) to prevent cross-layer leakage.
- Declared downstream task boundaries (`T-025` to `T-031`) to prevent schema-planning scope drift into runtime/editor/asset/release tracks.
- Added explicit contract-doc synchronization trigger for follow-up subtasks when `runtime/core`, `game/schemas`, or `ai` files change.

## S2 Implementation Notes (2026-02-17)

- Added `game/schemas/rpg-topdown.schema.json` to define RPG topdown payload contract sections for `map`, `entities`, and `rules`, including walkable metadata, spawn/layout constraints, stat blocks, and tick/combat baseline bounds.
- Refactored `game/schemas/game-project.schema.json` and `game/schemas/game-package.schema.json` into template-aware schema branches (`tower-defense` + `rpg-topdown`) while preserving existing tower-defense contracts.
- Wired AJV registration for the new schema in `game/schemas/index.ts` and added `validateRpgTopdownPayload()` for payload-level validation coverage.
- Added onboarding fixtures `game/examples/rpg-topdown-mvp.project.json` and `game/examples/rpg-topdown-mvp.package.json` plus regression tests for valid fixtures, required-field failures, bounds rejection, and branch compatibility guards.
- Because `game/schemas` changed, synchronized contract docs in `README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md` in the same loop.

## S3 Documentation and Risk Notes (2026-02-17)

- Updated this task card for S3 closure so acceptance/subtask checklist state, change inventory, and risk narrative stay aligned with delivered RPG topdown schema behavior.
- Revalidated RPG schema contract wording across `README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md`; template-aware branch ownership and runtime/editor semantic boundaries remain synchronized.
- Confirmed this S3 update introduces no new contract-level source changes in `runtime/core`, `game/schemas`, or `ai`; documentation delta is limited to task/risk evidence and lifecycle assertions.
- Expanded risk notes to explicitly cover documentation-state drift and checklist mismatch risk before S4 memory finalization.

## S4 Memory Finalization and Task Closure (2026-02-17)

- Re-ran closure checks and confirmed pass evidence for `pnpm gate:fast`, `pnpm gate:full`, and `pnpm docs:sync-check`.
- Executed memory refresh commands `bash tools/git-memory/append-commit-log.sh --missing HEAD` and `bash tools/git-memory/update-weekly-summary.sh`; both `--missing` runs reported `No missing commits to append.` and weekly summary render completed.
- Updated `docs/ai/ai-loop-status.md` to `T-024` closure handoff state (`Issue: 24`, no remaining subtasks, next-step command `pnpm task:next`).
- Closed task metadata by setting status to `Done` and marking S4 acceptance/subtask checkboxes complete.
- Honored the explicit no-commit constraint for this run; task-level commit intent is captured through docs/tests/memory evidence only.
- Reconfirmed S4 introduced no new contract-level source changes (`runtime/core`, `game/schemas`, `ai`); S2/S3 contract-doc synchronization remains the active baseline.

## Change List

- `game/schemas/rpg-topdown.schema.json`: added RPG topdown payload schema contract for `map`, `entities`, and `rules`.
- `game/schemas/game-project.schema.json`: switched to template-aware project branches for `tower-defense` and `rpg-topdown`.
- `game/schemas/game-package.schema.json`: switched to template-aware package branches and wired RPG package contracts.
- `game/schemas/index.ts`: registered RPG schema and added `validateRpgTopdownPayload()` validation entrypoint.
- `game/examples/rpg-topdown-mvp.project.json`: added valid RPG project fixture.
- `game/examples/rpg-topdown-mvp.package.json`: added valid RPG package fixture.
- `tests/schema/rpg-topdown-schema.test.ts`: added RPG schema regression coverage for valid fixtures, required fields, bounds checks, and compatibility guard.
- `README.md`: synchronized RPG schema contract note after `game/schemas` changes.
- `docs/ai/README.md`: synchronized RPG schema contract note after `game/schemas` changes.
- `docs/ai/workflows/continuous-loop.md`: synchronized RPG schema contract note after `game/schemas` changes.
- `docs/ai/tasks/T-024-rpg-topdown-mvp-schema.md`: recorded S2/S3 evidence, captured S4 closure checks, and finalized task metadata to `Done`.
- `tests/integration/rpg-topdown-mvp-schema-scope.test.ts`: advanced lifecycle assertions from S3-open state to S4 closure state and memory-finalization evidence.
- `docs/ai/ai-loop-status.md`: switched loop board to `T-024` closure handoff state with no remaining subtasks.
- `docs/ai/weekly-summary.md`: refreshed weekly memory summary via S4 memory finalize workflow.

## Test Evidence

- Commands:
  - `pnpm exec eslint tests/integration/rpg-topdown-mvp-schema-scope.test.ts`
  - `pnpm exec vitest run tests/integration/rpg-topdown-mvp-schema-scope.test.ts`
  - `pnpm exec eslint game/schemas/index.ts tests/schema/rpg-topdown-schema.test.ts`
  - `pnpm exec vitest run tests/schema/rpg-topdown-schema.test.ts tests/integration/rpg-topdown-mvp-schema-scope.test.ts`
  - `pnpm gate:fast`
  - `pnpm gate:full`
- S3 commands:
  - `pnpm exec eslint tests/integration/rpg-topdown-mvp-schema-scope.test.ts`
  - `pnpm exec vitest run tests/integration/rpg-topdown-mvp-schema-scope.test.ts`
  - `pnpm docs:sync-check`
- S4 commands:
  - `pnpm gate:fast`
  - `pnpm gate:full`
  - `pnpm docs:sync-check`
  - `bash tools/git-memory/append-commit-log.sh --missing HEAD`
  - `bash tools/git-memory/update-weekly-summary.sh`
  - `bash tools/git-memory/append-commit-log.sh --missing HEAD`
  - `pnpm exec eslint tests/integration/rpg-topdown-mvp-schema-scope.test.ts`
  - `pnpm exec vitest run tests/integration/rpg-topdown-mvp-schema-scope.test.ts`
- Result:
  - `pnpm exec eslint tests/integration/rpg-topdown-mvp-schema-scope.test.ts` pass.
  - `pnpm exec vitest run tests/integration/rpg-topdown-mvp-schema-scope.test.ts` pass.
  - `pnpm exec eslint game/schemas/index.ts tests/schema/rpg-topdown-schema.test.ts` pass.
  - `pnpm exec vitest run tests/schema/rpg-topdown-schema.test.ts tests/integration/rpg-topdown-mvp-schema-scope.test.ts` pass.
  - `pnpm gate:fast` pass.
  - `pnpm gate:full` pass.
  - `pnpm exec eslint tests/integration/rpg-topdown-mvp-schema-scope.test.ts` pass.
  - `pnpm exec vitest run tests/integration/rpg-topdown-mvp-schema-scope.test.ts` pass.
  - `pnpm docs:sync-check` pass.
  - `pnpm gate:fast` pass (`typecheck`, `test:determinism`, `test:schema`).
  - `pnpm gate:full` pass (`lint`, `test`, `test:determinism`, `test:schema`, `test:smoke-ai-package`).
  - `pnpm docs:sync-check` pass.
  - `bash tools/git-memory/append-commit-log.sh --missing HEAD` pass (`No missing commits to append.`).
  - `bash tools/git-memory/update-weekly-summary.sh` pass (`Rendered weekly summary: /Users/wxx/Desktop/code/projectA/docs/ai/weekly-summary.md`).
  - `bash tools/git-memory/append-commit-log.sh --missing HEAD` pass (`No missing commits to append.`).
  - `pnpm exec eslint tests/integration/rpg-topdown-mvp-schema-scope.test.ts` pass.
  - `pnpm exec vitest run tests/integration/rpg-topdown-mvp-schema-scope.test.ts` pass.

## Risks and Rollback

- Risk:
  - Scope drift can blur boundaries between `T-024` schema-contract planning and downstream runtime/editor/template delivery tasks (`T-025` to `T-031`), reducing implementation focus.
  - Ambiguous RPG payload contract definitions can lead to inconsistent validation behavior between schema shape checks and runtime semantic validation ownership.
  - Template-aware schema wiring may unintentionally regress existing tower-defense validation behavior if compatibility guardrails drift.
  - RPG project/package shape acceptance at schema level can outpace runtime/editor semantic support before `T-025` and `T-026`, so follow-up tasks must keep fail-fast runtime ownership explicit.
  - Contract-doc synchronization can be skipped in follow-up subtasks if `runtime/core`, `game/schemas`, or `ai` changes are not tracked against release-flow requirements.
  - Task checklist and risk documentation can diverge from shipped behavior if scope tests and task-card updates are not kept synchronized.
  - Memory artifacts (`docs/ai/ai-loop-status.md`, `docs/ai/weekly-summary.md`) can drift from actual loop state if S4 finalize commands are skipped.
  - Follow-up contract-level file changes (`runtime/core`, `game/schemas`, `ai`) can ship without synchronized docs if S4 sync checks are skipped.
- Rollback:
  - Revert `game/schemas/rpg-topdown.schema.json`, `game/schemas/game-project.schema.json`, `game/schemas/game-package.schema.json`, and `game/schemas/index.ts` together to roll back RPG schema wiring safely.
  - Revert `game/examples/rpg-topdown-mvp.project.json`, `game/examples/rpg-topdown-mvp.package.json`, and `tests/schema/rpg-topdown-schema.test.ts` together to roll back RPG fixture onboarding coverage.
  - Revert `README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md` together if contract-doc sync needs to be undone.
  - Revert `docs/ai/tasks/T-024-rpg-topdown-mvp-schema.md` and `tests/integration/rpg-topdown-mvp-schema-scope.test.ts` together to restore pre-S3 task contract/checklist state.
  - If only S3 documentation-state updates need rollback, revert `docs/ai/tasks/T-024-rpg-topdown-mvp-schema.md` and `tests/integration/rpg-topdown-mvp-schema-scope.test.ts`.
  - If only S4 memory/docs finalization needs rollback, revert `docs/ai/tasks/T-024-rpg-topdown-mvp-schema.md`, `tests/integration/rpg-topdown-mvp-schema-scope.test.ts`, `docs/ai/ai-loop-status.md`, and `docs/ai/weekly-summary.md` together.

## Subtask Progress

- [x] [S1] Define scope and acceptance criteria
- [x] [S2] Implement scoped code changes and pass fast/full gates
- [x] [S3] Update docs and risk notes
- [x] [S4] Finalize memory and complete task-level commit


## Subtask Progress
- [x] [S4] Finalize memory and complete task-level commit