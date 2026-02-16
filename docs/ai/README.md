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
   - Default roadmap source: `tasks/T-ROADMAP-6M-render-first-platform.md`.
2. Optional: split issue into subtasks using `tasks/SUBTASK-TEMPLATE.md`.
3. Work directly on `main`.
4. Run loop: `pnpm dev:loop -- --issue-id <id> --task-file <task.md>`.
   - If there is exactly one active issue task card, `--issue-id` and `--task-file` can be omitted.
5. Milestone commits and memory finalization are handled in loop when auto-commit is enabled (`finalize-task.sh` backfills missing commit summaries before refreshing weekly summary).
6. Open PR and keep `1 Issue = 1 PR`.

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

## Render contract note

- `RenderSnapshot` in `runtime/core/types.ts` includes immutable `map` and `path` fields to support deterministic Three.js placeholder rendering in preview.
- Keep render documentation synchronized with `README.md` and `docs/ai/workflows/continuous-loop.md` whenever contract-level files change.

## Session Warm Start

When opening a fresh AI session, read in this order:

1. `constitution.md`
2. `weekly-summary.md`
3. current task document in `tasks/`

## Continuous Loop Docs

- `workflows/continuous-loop.md`
- `tasks/SUBTASK-TEMPLATE.md`
- `ai-loop-status.md` (commit 后更新，中文说明当前 AI 在做什么和下一步计划)
- `tasks/T-ROADMAP-v1-editor-platform.md` (v1 history, completed)
- `tasks/T-ROADMAP-6M-render-first-platform.md` (active 6-month roadmap)
