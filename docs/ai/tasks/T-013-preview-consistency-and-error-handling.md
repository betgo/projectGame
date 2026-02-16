# T-013: preview-consistency-and-error-handling

- Status: Planned
- Owner: maintainer
- Branch: `main`
- Prompt-Plan: `ARCHITECT_v1`, `PLANNER_v1`
- Prompt-Impl: `BUILDER_v2`
- Prompt-Review: `GUARDIAN_v1`, `REVIEWER_v1`

## Goal

Improve reliability and UX of preview runtime flow so editor users get deterministic and actionable feedback on invalid data and runtime failures.

## Scope

- In scope:
  - Align preview/headless result contract for identical package + seed.
  - Improve editor-side error surfacing for schema/semantic validation failures.
  - Add regression tests for preview error handling and consistency paths.
  - Document troubleshooting steps for common preview failures.
- Out of scope:
  - New gameplay mechanics or balance changes.
  - New template type (RPG/topdown) implementation.
  - Cloud sync/publish features.

## Acceptance Criteria

1. Preview and headless runs produce consistent key outcomes for identical input package and seed.
2. Invalid project/package data shows clear and non-crashing error messages in preview workflow.
3. `pnpm gate:fast`, `pnpm gate:full`, and `pnpm docs:sync-check` all pass with evidence recorded.
4. README or `docs/ai/workflows/continuous-loop.md` includes troubleshooting notes for preview failures.

## Subtasks

- [ ] [S1] Define consistency and error-handling contract
- [ ] [S2] Implement preview/runtime hardening, regression tests, and pass fast/full gates
- [ ] [S3] Sync docs and troubleshooting guidance
- [ ] [S4] Finalize memory and complete task-level commit

## Change List

- Target files (expected):
  - `/Users/wxx/Desktop/code/projectA/editor/src/app/App.tsx`
  - `/Users/wxx/Desktop/code/projectA/editor/src/editor/api.ts`
  - `/Users/wxx/Desktop/code/projectA/runtime/core/engine.ts`
  - `/Users/wxx/Desktop/code/projectA/tests/integration/preview-consistency.test.ts`
  - `/Users/wxx/Desktop/code/projectA/docs/ai/workflows/continuous-loop.md`

## Test Evidence

- Commands:
  - `pnpm gate:fast`
  - `pnpm gate:full`
  - `pnpm docs:sync-check`
  - `pnpm test -- tests/integration/preview-consistency.test.ts`
- Result:
  - Pending

## Risks and Rollback

- Risk:
  - Stricter preview guards may reject legacy test packages that previously ran with implicit defaults.
  - Error-message assertions may become brittle if UI text changes without test updates.
- Rollback:
  - Revert T-013 commits and restore previous preview behavior/tests/docs as one batch.
