# Continuous AI Dev Loop

This workflow enforces the local cycle:

`develop -> test -> fix -> doc sync -> milestone commit -> memory finalize -> next subtask`

## Preconditions

1. Current branch must be `main`.
2. Prompt files must exist and be versioned under `docs/ai/prompts/`.
3. A task card should exist under `docs/ai/tasks/`.

## Run Loop

```bash
pnpm dev:loop -- --issue-id 010 --task-file docs/ai/tasks/T-010.md
```

By default, loop uses `codex` as coding CLI for both implement and autofix phases.
If there is exactly one active issue task card (for example `docs/ai/tasks/T-010.md`), you can omit
both `--issue-id` and `--task-file`.

### Useful Flags

- `--coding-cli=codex|custom`
- `--retry-mode=until-pass|max-retry|fail-fast`
- `--max-retry=10`
- `--max-duration-min=180`
- `--implement-timeout-min=20`
- `--autofix-timeout-min=10`
- `--implement-cmd="<command>"`
- `--autofix-cmd="<command>"`
- `--auto-commit=true|false`
- `--auto-finalize-memory=true|false`
- `--subtask-id=<id>`

## Gate Commands

- Fast gate: `pnpm gate:fast`
- Full gate: `pnpm gate:full`
- Doc sync check: `pnpm docs:sync-check`

## Build/Run/Test/Release contract

- Build command: `pnpm build`
- Run command: `pnpm dev`
- Typecheck command: `pnpm typecheck`
- Lint command: `pnpm lint`
- Test command: `pnpm test`
- Schema regression command: `pnpm test:schema`
- Determinism regression command: `pnpm test:determinism`
- AI smoke command: `pnpm test:smoke-ai-package`
- Fast gate command: `pnpm gate:fast`
- Full gate command: `pnpm gate:full`
- Docs sync command: `pnpm docs:sync-check`
- Release loop command: `pnpm dev:loop -- --issue-id <id> --task-file <task.md>`
- Delivery branch: `main`
- Delivery rule: `1 Issue = 1 PR`

## Release handoff checklist

- Run fast gate: `pnpm gate:fast`
- Run full gate: `pnpm gate:full`
- Run docs sync check: `pnpm docs:sync-check`
- If contract-level files change (`runtime/core`, `game/schemas`, `ai`), update `README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md` in the same change.
- Record gate evidence in task card under `docs/ai/tasks/`.
- Refresh memory artifacts before handoff: `bash tools/git-memory/finalize-task.sh`

## Enforcement

1. Runtime boundary violations fail the loop.
2. Contract file changes (`runtime/core`, `game/schemas`, `ai`) require docs updates.
3. Milestone commit must include `Prompt-Refs` and full commit template sections.
4. Memory finalize runs `tools/git-memory/finalize-task.sh` (which backfills missing commit summaries with `--missing`) and creates follow-up memory commit.

## Output Artifacts

- Run reports: `docs/ai/run-logs/YYYY-MM-DD/<timestamp>.json`
- Commit memory: `docs/ai/commit-log/YYYY-MM.md`
- Weekly context: `docs/ai/weekly-summary.md`
- AI 状态看板（中文，提交后刷新）: `docs/ai/ai-loop-status.md`
