# T-011: ci-gates-and-pr-template

- Status: Planned
- Owner: maintainer
- Branch: `main`
- Prompt-Plan: `ARCHITECT_v1`, `PLANNER_v1`
- Prompt-Impl: `BUILDER_v2`
- Prompt-Review: `GUARDIAN_v1`, `REVIEWER_v1`

## Goal

Harden CI gates and PR governance so loop-driven delivery can ship safely on main-only workflow.

## Scope

- In scope:
  - Align loop/git-memory scripts and docs to main-only branch policy.
  - Ensure CI gates remain deterministic and block regressions in architecture, schema, and smoke checks.
  - Enforce actionable PR template fields for contract, risk, and test evidence.
  - Capture run-log and memory updates for each subtask milestone.
- Out of scope:
  - New gameplay systems or template mechanics.
  - Editor feature additions unrelated to CI/governance.
  - Cloud deployment or external release automation.

## Acceptance Criteria

1. Branch policy in loop scripts and governance docs is consistent with main-only operation.
2. `pnpm gate:fast`, `pnpm gate:full`, and `pnpm docs:sync-check` pass after updates.
3. PR template and task governance docs contain clear required evidence fields.
4. Memory logs and weekly summary are updated through normal finalize flow.

## Subtasks

- [x] [S1] Define scope and acceptance criteria
- [x] [S2] Align branch policy implementation and docs to main-only
- [x] [S3] Run and stabilize fast/full/doc gates
- [ ] [S4] Verify PR/governance documentation consistency
- [ ] [S5] Finalize memory and close task

## Notes

- Keep each subtask independently commit-ready.
- Keep loop execution reproducible with explicit command evidence.
- Keep `Prompt-Refs` traceable in every milestone commit body.

## S2 Execution Plan (Main-only policy alignment)

- Update loop branch policy check to enforce `main` only.
- Align task bootstrap script default branch metadata to `main`.
- Sync governance docs to remove stale `codex/*` branch instructions.
- Changed files expected:
  - `tools/dev-loop/git.ts`
  - `tools/git-memory/new-task.sh`
  - `docs/ai/README.md`
  - `docs/ai/workflows/continuous-loop.md`
  - `docs/ai/adr/ADR-0001-ai-memory-governance.md`

## S3 Execution Plan (Gate stabilization)

- Run:
  - `pnpm gate:fast`
  - `pnpm gate:full`
  - `pnpm docs:sync-check`
- If failed, apply minimal fix and rerun until all pass.
- Record final pass evidence under `Test Evidence`.

## S4 Execution Plan (Governance consistency check)

- Verify `.github/pull_request_template.md` includes required contract/risk/test fields.
- Verify task template and loop workflow docs still match current gate commands and branch policy.
- Confirm no conflict between `ARCHITECTURE_RULES.md` and CI/documentation constraints.
- Update risk/rollback notes when any governance rule changes.

## S5 Execution Plan (Memory finalize and closure)

- Run milestone commit through loop auto-commit flow.
- Execute `tools/git-memory/finalize-task.sh` via loop memory finalize stage.
- Ensure `docs/ai/commit-log/YYYY-MM.md` and `docs/ai/weekly-summary.md` are updated.
- Mark task status to `Done` after S5 is complete.

## Change List

- `tools/dev-loop/git.ts`: enforce branch rule in runtime checks.
- `tools/git-memory/new-task.sh`: default generated task branch metadata.
- `docs/ai/*`: synchronize governance and workflow documentation.

## Test Evidence

- Commands:
  - `pnpm gate:fast`
  - `pnpm gate:full`
  - `pnpm docs:sync-check`
- Result:
  - Pending execution in S3.

## Risks and Rollback

- Risk:
  - Docs and script policy may drift again if branch strategy changes without coordinated update.
- Rollback:
  - Revert T-011 commits and regenerate memory summary from previous stable commit-log snapshot.
