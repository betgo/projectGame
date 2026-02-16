# T-012: hardening-and-docs

- Status: Done
- Owner: maintainer
- Branch: `main`
- Prompt-Plan: `ARCHITECT_v1`, `PLANNER_v1`
- Prompt-Impl: `BUILDER_v2`
- Prompt-Review: `GUARDIAN_v1`, `REVIEWER_v1`

## Goal

Close v1 delivery with production-style hardening and documentation so loop-driven delivery can keep shipping safely on `main`.

## Scope

- In scope:
  - Define a hardening envelope for regression coverage in schema validation, deterministic simulation, and AI generate/repair smoke flow.
  - Define release-facing documentation requirements for runbook, troubleshooting, and acceptance checklist.
  - Define required local gate evidence (`pnpm gate:fast`, `pnpm gate:full`, `pnpm docs:sync-check`) for task closure.
  - Keep implementation boundaries inside existing layers (`runtime/core`, `game/schemas`, `ai`, `tools`, and `docs`) without cross-layer leakage.
- Out of scope:
  - New gameplay mechanics, template expansion, or rebalance features outside hardening baselines.
  - New external deployment platform integration or cloud release automation.
  - UI redesign or non-v1 product-scope expansion.

## Acceptance Criteria

- [x] [S1] Regression suite definition explicitly covers schema, determinism, editor/headless consistency, and AI smoke paths.
- [x] [S2] Performance baseline command and threshold contract are documented and reproducible.
- [x] [S3] README and `docs/ai` release-flow contracts are aligned with build/run/test/release commands.
- [x] [S4] Task completion requires passing `pnpm gate:fast`, `pnpm gate:full`, and `pnpm docs:sync-check` with recorded evidence.
- [x] [S5] Task closure includes memory-finalize artifacts and explicit task-status closure evidence.

## Subtasks

- [x] [S1] Define hardening scope and acceptance criteria
- [x] [S2] Implement hardening changes and regression safeguards
- [x] [S3] Sync README and AI governance docs for release handoff
- [x] [S4] Run fast/full/docs gates and collect performance baseline evidence
- [x] [S5] Finalize memory and close task

## Notes

- Keep each subtask independently commit-ready.
- Keep `1 Issue = 1 PR`.
- Keep architecture boundaries stable and auditable.

## S1 Implementation Notes (2026-02-16)

- Normalized S1 to planning-only scope: no runtime/gameplay behavior changes are introduced in this subtask.
- Defined measurable acceptance criteria for regression, performance baseline, docs consistency, and gate evidence.
- Locked hardening boundaries and explicit out-of-scope items to prevent accidental feature creep in S2-S5.

## Risk and Rollback Expectations (Pre-Implementation Baseline, 2026-02-16)

- Baseline was recorded in planning before S2 implementation kickoff and remains the contract for all later subtasks.
- Risk:
  - Scope or acceptance criteria can drift from implementation intent, causing hardening subtasks to lose auditability.
  - Semantic validator is stricter; packages with previously tolerated ID collisions or payload/entity drift now fail fast.
  - Release-flow command docs can drift from package scripts if command contracts are edited without synchronized doc updates.
- Rollback plan:
  - Revert `docs/ai/tasks/T-012-hardening-and-docs.md` and `tests/integration/hardening-scope-doc-contract.test.ts` together.
  - For S2 hardening rollback, revert `runtime/templates/tower-defense/validator.ts`, `runtime/core/engine.ts`, `ai/pipeline.ts`, `tests/schema/tower-defense-semantic.test.ts`, `tests/determinism/determinism.test.ts`, and `tests/smoke/ai-pipeline-hardening.test.ts` together.
  - For S3 rollback, revert `README.md`, `docs/ai/README.md`, `docs/ai/workflows/continuous-loop.md`, and `tests/integration/release-flow-doc-contract.test.ts` together.

## S2 Implementation Notes (2026-02-16)

- Hardened runtime semantic validation with map grid shape checks, duplicate-ID guards, and payload/entity tower mirror checks to prevent silent contract drift.
- Hardened deterministic simulation entrypoint by rejecting non-positive or non-integer scenario seeds before world creation.
- Hardened AI generate/repair flow by enforcing bounded repair attempts and throwing diagnostics when repairs cannot restore a valid package.
- Added regression tests for new semantic guards, deterministic seed validation, and AI repair-loop failure behavior.

## S3 Implementation Notes (2026-02-16)

- Synced release-flow contract blocks across `README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md`.
- Expanded contract-level command coverage to explicitly include `typecheck`, `lint`, full `test`, and focused regression commands.
- Strengthened release-flow integration checks so documentation drift is caught when command contracts or README script lists diverge.

## S4 Gate Evidence (2026-02-16)

- Executed `pnpm gate:fast` and confirmed `typecheck`, `test:determinism`, and `test:schema` all pass.
- Executed `pnpm gate:full` and confirmed `lint`, full `test`, and replayed determinism/schema/smoke suites all pass (15 files, 50 tests in full suite).
- Executed `pnpm docs:sync-check` and confirmed output `docs-sync-check: pass`.
- Executed performance baseline command `pnpm simulate:batch game/examples/td-normal.json 100 --max-imbalance=0.6000`.
- Baseline output: `sampleSize=100 winRate=0.0000 avgDuration=5400 leakRate=4.0000 imbalanceIndex=0.5800`.
- Verified threshold contract: `imbalanceIndex` stays within baseline guard (`0.5800 <= 0.6000`).
- Recorded S4 gate and baseline evidence in-task without widening architecture scope or touching runtime/gameplay contracts.

## S5 Memory Finalization and Task Closure (2026-02-16)

- Closed task metadata by setting this task status to `Done` after S1-S5 completion.
- Refreshed loop handoff context in `docs/ai/ai-loop-status.md` to mark S5 closure state and no remaining subtasks.
- Verified memory artifacts remain present and traceable for warm-start handoff: `docs/ai/commit-log/2026-02.md` and `docs/ai/weekly-summary.md`.
- Kept S5 scope inside docs/tests only; no runtime/gameplay contract files were changed during closure.

## Change List

- `docs/ai/tasks/T-012-hardening-and-docs.md`: finalized S5 closure contract, removed duplicated progress blocks, and marked task status `Done`.
- `docs/ai/ai-loop-status.md`: updated loop status to S5 closure state for issue 12.
- `tests/integration/hardening-scope-doc-contract.test.ts`: updated S5 contract assertions to enforce closure evidence and status finalization.

## Test Evidence

- Commands:
  - `pnpm exec eslint tests/integration/hardening-scope-doc-contract.test.ts`
  - `pnpm exec vitest run tests/integration/hardening-scope-doc-contract.test.ts`
  - `pnpm docs:sync-check`
- Result:
  - All commands pass.

## Risks and Rollback

- Risk:
  - Task closure metadata can drift if future edits reopen subtasks without updating status and closure evidence together.
- Rollback:
  - Revert `docs/ai/tasks/T-012-hardening-and-docs.md`, `docs/ai/ai-loop-status.md`, and `tests/integration/hardening-scope-doc-contract.test.ts` together.


## Subtask Progress
- [x] [S5] Finalize memory and close task