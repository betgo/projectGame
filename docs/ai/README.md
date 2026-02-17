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
   - If `--issue-id` and `--task-file` are omitted, loop picks the first pending task card in `docs/ai/tasks/` (filename order).
   - Use `--issue-id` or `--task-file` when you need to pin loop execution to a specific task card.
   - Loop continues to subsequent pending tasks by default; set `--continue-next-tasks=false` to stop after current task.
   - New `*doc-contract*.test.ts` files are blocked by default; enable with `--allow-doc-contract-tests=true` only when explicitly required.
5. Task completion commit and memory finalization are handled in loop when auto-commit is enabled (`finalize-task.sh` artifacts are merged before one task-level commit).
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
- Camera interaction defaults in `runtime/render/three-adapter.ts` are documented as orbit/pan/zoom with deterministic clamp ranges for pitch, distance, and pan focus limits.
- Resize handling follows `mount -> resize -> dispose` lifecycle, and docs must preserve renderer-size + camera-projection synchronization guarantees.
- Hover selection affordance stays render-only: tower/enemy placeholders can highlight/unhighlight through adapter metadata callbacks without mutating `runtime/core`.
- Preview debug-overlay contract in `editor/src/editor/api.ts` + `editor/src/editor/components/PreviewControls.tsx` exposes `tick`, `elapsedMs`, `tickMs`, `seed`, status/lives/entity counts, and runtime metrics for `step`/`fast`/`full` actions.
- Validation/runtime failures in preview debug sessions surface `phase`, summary, scoped issues, and actionable hints while actions remain non-crashing (`playStep`/`playFast`/`runToEnd` return `null` and diagnostics status becomes `error`).
- Diagnostics sourcing stays in preview/runtime APIs and overlay rendering remains editor-only; preserve `runtime/core` simulation ownership and `runtime/render` read-only boundaries.
- Render baseline collector in `runtime/render/performance-baseline.ts` remains render-side and consumes replayed snapshots without mutating `runtime/core`.
- Render performance baseline command: `pnpm simulate:render-baseline [package-json ...]` (default package set: `game/examples/td-easy.json`, `game/examples/td-normal.json`, `game/examples/td-hard.json`).
- Baseline protocol defaults: `restarts=5`, `warmupFrames=8`, `measuredFrames=120`, `seed=1`; override using `--restarts`, `--warmup-frames`, `--measured-frames`, and `--seed`.
- Optional memory guardrail `--max-memory-delta-bytes=<threshold>` enforces absolute `memoryDeltaBytes` ceiling per package and exits non-zero on violation.
- Parseable output shape is fixed: one `protocol` line, one line per package with FPS/frame-time/memory/reuse fields, and one `aggregate` line.

## Schema versioning contract note

- Baseline schema version is `0.2.0` for both `GameProject.meta.version` and `GamePackage.version`.
- Compatibility rules: same-major patch updates are directly compatible; one adjacent minor (`0.1.x -> 0.2.x`) is migratable with deterministic one-way upgrade semantics.
- Unsupported versions fail fast with version-path diagnostics (`/meta/version` or `/version`): major mismatch, future minor, or stale minor outside the one-step migration window.
- Ownership boundaries: parsing/migration helpers stay in `game/schemas`; editor migration entrypoint is `editor/src/editor/api.ts`; runtime migration entrypoint is `runtime/core/engine.ts` before template semantic validation.

## RPG topdown schema contract note

- `game/schemas/rpg-topdown.schema.json` defines RPG MVP payload structure across `map`, `entities`, and `rules` sections with explicit bounds and required fields.
- `game/schemas/game-project.schema.json` + `game/schemas/game-package.schema.json` use template-aware branches to keep both `tower-defense` and `rpg-topdown` contracts valid.
- RPG fixture onboarding coverage uses `game/examples/rpg-topdown-mvp.project.json` and `game/examples/rpg-topdown-mvp.package.json` with deterministic schema regression tests.

## RPG runtime min-systems contract note

- `runtime/templates/rpg-topdown/systems.ts` owns deterministic RPG movement/combat/quest-lite progression and explicit objective state transitions.
- `runtime/templates/rpg-topdown/validator.ts` owns RPG semantic validation for walkable-grid placement, spawn-zone integrity, enemy reference consistency, and reach-exit path reachability.
- Runtime orchestration remains in `runtime/core/engine.ts`, with template-aware fixed tick resolution for both TD (`spawnRules.tickMs`) and RPG (`rules.tick.tickMs`) package branches.
- Template-scoped state is isolated in `RuntimeWorld.internal.templateState`; no RPG semantic logic is pushed into `game/schemas`, `editor`, or `ai` ownership layers.
- Existing tower-defense runtime contracts remain compatible through shared entrypoints (`validateRuntimePackage`, `loadPackage`, `runScenario`, `runBatch`).

## Template SDK core contract note

- Template registry orchestration stays in `runtime/core/engine.ts`; avoid direct template-validator routing from editor or AI layers.
- `registerTemplate()` fail-fast contract: reject invalid `templateId`, missing/invalid hooks (`validate`, `createWorld`, `step`), and duplicate `templateId`.
- `validateRuntimePackage()` is the shared runtime validation entrypoint for template resolution + template-level semantic validation.
- Unknown templates emit `/templateId` diagnostics (`unknown template: <templateId>`), and runtime entrypoints (`loadPackage`, `runScenario`, `runBatch`) fail fast on the same contract.
- `editor/src/editor/api.ts` consumes runtime validation orchestration while template validators keep semantic ownership.

## Session Warm Start

When opening a fresh AI session, read in this order:

1. `constitution.md`
2. `weekly-summary.md`
3. current task document in `tasks/`

## Continuous Loop Docs

- `workflows/continuous-loop.md`
- `tasks/SUBTASK-TEMPLATE.md`
- `tasks/T-ROADMAP-v1-editor-platform.md` (v1 history, completed)
- `tasks/T-ROADMAP-6M-render-first-platform.md` (active 6-month roadmap)
