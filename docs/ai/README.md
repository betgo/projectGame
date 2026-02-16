# AI Memory System

This folder stores auditable AI memory and prompt governance artifacts.

## Memory Layers

- L0: `constitution.md` - long-lived architecture and collaboration rules.
- L1: `adr/` - durable architecture decision records.
- L2: `tasks/` - per-task context, acceptance criteria, and delivery notes.
- L3: `commit-log/` - month-based commit summaries for fast context recovery.
- L4: `prompts/` - versioned role prompts used in AI-assisted delivery.

## Daily Workflow

1. Create a task document from `tasks/TEMPLATE.md`.
   - Auto-create next task card: `pnpm task:next` (or `pnpm task:next -- "<custom title>"`).
2. Optional: split issue into subtasks using `tasks/SUBTASK-TEMPLATE.md`.
3. Work directly on `main`.
4. Run loop: `pnpm dev:loop -- --issue-id <id> --task-file <task.md>`.
   - If there is exactly one active issue task card, `--issue-id` and `--task-file` can be omitted.
5. Milestone commits and memory finalization are handled in loop when auto-commit is enabled.
6. Open PR and keep `1 Issue = 1 PR`.

## Build/Run/Test/Release contract

- Build command: `pnpm build`
- Run command: `pnpm dev`
- Fast gate command: `pnpm gate:fast`
- Full gate command: `pnpm gate:full`
- Docs sync command: `pnpm docs:sync-check`
- Release loop command: `pnpm dev:loop -- --issue-id <id> --task-file <task.md>`
- Delivery branch: `main`
- Delivery rule: `1 Issue = 1 PR`

## Session Warm Start

When opening a fresh AI session, read in this order:

1. `constitution.md`
2. `weekly-summary.md`
3. current task document in `tasks/`

## Continuous Loop Docs

- `workflows/continuous-loop.md`
- `tasks/SUBTASK-TEMPLATE.md`
