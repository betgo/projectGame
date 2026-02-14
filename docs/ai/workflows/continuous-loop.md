# Continuous AI Dev Loop

This workflow enforces the local cycle:

`develop -> test -> fix -> doc sync -> milestone commit -> memory finalize -> next subtask`

## Preconditions

1. Current branch must match `codex/<issue>-<topic>`.
2. Prompt files must exist and be versioned under `docs/ai/prompts/`.
3. A task card should exist under `docs/ai/tasks/`.

## Run Loop

```bash
pnpm dev:loop -- --issue-id 010 --task-file docs/ai/tasks/T-010.md
```

By default, loop uses `codex` as coding CLI for both implement and autofix phases.

### Useful Flags

- `--coding-cli=codex|custom`
- `--retry-mode=until-pass|max-retry|fail-fast`
- `--max-retry=10`
- `--max-duration-min=180`
- `--implement-cmd="<command>"`
- `--autofix-cmd="<command>"`
- `--auto-commit=true|false`
- `--auto-finalize-memory=true|false`
- `--subtask-id=<id>`

## Gate Commands

- Fast gate: `pnpm gate:fast`
- Full gate: `pnpm gate:full`
- Doc sync check: `pnpm docs:sync-check`

## Enforcement

1. Runtime boundary violations fail the loop.
2. Contract file changes (`runtime/core`, `game/schemas`, `ai`) require docs updates.
3. Milestone commit must include `Prompt-Refs` and full commit template sections.
4. Memory finalize runs `tools/git-memory/finalize-task.sh` and creates follow-up memory commit.

## Output Artifacts

- Run reports: `docs/ai/run-logs/YYYY-MM-DD/<timestamp>.json`
- Commit memory: `docs/ai/commit-log/YYYY-MM.md`
- Weekly context: `docs/ai/weekly-summary.md`
