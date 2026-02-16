# T-012: hardening-and-docs

- Status: In Progress
- Owner: maintainer
- Branch: `main`
- Prompt-Plan: `ARCHITECT_v1`, `PLANNER_v1`
- Prompt-Impl: `BUILDER_v2`
- Prompt-Review: `GUARDIAN_v1`, `REVIEWER_v1`

## Goal

Close v1 delivery with production-style hardening and documentation so the loop can keep shipping safely on `main`.

## Scope

- In scope:
  - Strengthen regression coverage for schema, determinism, and AI smoke pipeline.
  - Add/confirm performance baseline workflow for batch simulation and preview.
  - Complete release-facing docs: runbook, troubleshooting, and acceptance checklist.
  - Ensure loop/gate/docs policies are consistent and auditable.
- Out of scope:
  - New gameplay features or template expansion.
  - New external deployment platform integration.
  - Non-v1 UI redesign.

## Acceptance Criteria

- [x] Regression suite covers core v1 paths and passes in local gates.
- [x] Performance baseline command and threshold are documented and reproducible.
- [ ] README and `docs/ai` documents describe build/run/test/release flow without contradictions.
- [ ] `pnpm gate:fast`, `pnpm gate:full`, and `pnpm docs:sync-check` all pass.
- [ ] Task closure includes milestone commit + memory finalize evidence.

## Subtasks

- [x] [S1] Regression suite covers core v1 paths and passes in local gates
- [x] [S2] Implement hardening changes and regression safeguards
- [ ] [S3] Run fast/full/docs gates and collect performance baseline evidence
- [ ] [S4] Sync README and AI governance docs for release handoff
- [ ] [S5] Finalize memory and close task

## S1 Implementation Notes (2026-02-16)

- Added `tests/regression/core-v1-paths.test.ts` as a v1 regression suite spanning schema + semantic validation, deterministic scenario/batch baselines for shipped examples, editor preview/headless parity, and AI generate/repair smoke paths.
- Locked deterministic fixture expectations for `td-easy`, `td-normal`, and `td-hard` under fixed seeds to catch accidental runtime behavior drift.
- Added an AI provider override regression case to verify `generateValidateAndRepair` still repairs invalid first-pass packages before returning.

## S1 Test Evidence (2026-02-16)

- Commands:
  - `pnpm gate:fast`
  - `pnpm gate:full`
- Result:
  - `pnpm gate:fast` pass
  - `pnpm gate:full` pass

## S2 Implementation Notes (2026-02-16)

- Extended `pnpm simulate:batch` with optional `--max-imbalance=<non-negative-number>` threshold guard so the baseline command can fail fast when the deterministic `imbalanceIndex` exceeds expected bounds.
- Documented the reproducible baseline command and threshold in `README.md` under the batch simulation contract.
- Expanded integration coverage to lock CLI threshold behavior and prevent documentation drift for command/threshold contract fields.

## S2 Test Evidence (2026-02-16)

- Commands:
  - `pnpm exec vitest run tests/integration/simulate-batch-cli.test.ts tests/integration/batch-doc-contract.test.ts`
  - `pnpm simulate:batch game/examples/td-normal.json 100 --max-imbalance=0.6000`
- Result:
  - Integration tests pass with threshold success/failure and reproducibility assertions.
  - Baseline command pass with deterministic output: `sampleSize=100 winRate=0.0000 avgDuration=5400 leakRate=4.0000 imbalanceIndex=0.5800`

## Change List

- Target areas (expected):
  - `/Users/wxx/Desktop/code/projectA/tests/*`
  - `/Users/wxx/Desktop/code/projectA/tools/*`
  - `/Users/wxx/Desktop/code/projectA/README.md`
  - `/Users/wxx/Desktop/code/projectA/docs/ai/*`

## Test Evidence

- Commands:
  - `pnpm gate:fast`
  - `pnpm gate:full`
  - `pnpm docs:sync-check`
  - `pnpm simulate:batch game/examples/td-normal.json 100`
- Result:
  - Pending

## Risks and Rollback

- Risk:
  - Hardening changes may slow loop iteration if tests are too heavy.
- Rollback:
  - Revert T-012 commits and restore previous gate/test baseline.


## Subtask Progress
- [x] [S1] Regression suite covers core v1 paths and passes in local gates.
- [x] [S2] Implement hardening changes and regression safeguards.


## Subtask Progress
- [x] [S2] Performance baseline command and threshold are documented and reproducible.