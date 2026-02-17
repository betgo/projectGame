# Continuous AI Dev Loop

This workflow enforces the local cycle:

`develop -> test -> fix -> doc sync -> mark subtask done -> memory finalize -> task-level commit`

## Preconditions

1. Current branch must be `main`.
2. Prompt files must exist and be versioned under `docs/ai/prompts/`.
3. A task card should exist under `docs/ai/tasks/`.

## Run Loop

```bash
pnpm dev:loop -- --issue-id 010 --task-file docs/ai/tasks/T-010.md
```

By default, loop uses `codex` as coding CLI for both implement and autofix phases.
If `--issue-id` and `--task-file` are omitted, loop auto-selects the first pending task card in
`docs/ai/tasks/` (filename order). Pass either flag explicitly when you need to pin a task.
When a task is completed, loop continues to the next pending task card by default.

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
- `--continue-next-tasks=true|false` (default `true`)
- `--allow-doc-contract-tests=true|false` (default `false`)
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
4. Memory finalize runs `tools/git-memory/finalize-task.sh` before a single task-level commit (no per-subtask commit).
5. New `*doc-contract*.test.ts` files are blocked by default unless `--allow-doc-contract-tests=true` is set explicitly.

## Render contract note

- Render baseline contract expects `RenderSnapshot` in `runtime/core/types.ts` to carry immutable `map` and `path` fields for deterministic preview placeholder rendering.
- Render adapter responsibilities stay read-only; do not move runtime state mutation logic from `runtime/core` into `runtime/render`.
- Camera interaction contract in `runtime/render/three-adapter.ts` stays deterministic: left drag orbit, shift/right drag pan, and wheel zoom with explicit clamp bounds.
- Preview resize contract remains `mount -> resize -> dispose`; renderer viewport and camera projection matrix updates must stay synchronized with container dimensions.
- Selection affordance contract is hover-only for tower/enemy placeholders; highlight enter/exit must restore fallback state and keep `runtime/core` immutable.
- Preview debug-overlay contract in `editor/src/editor/api.ts` + `editor/src/editor/components/PreviewControls.tsx` exposes `tick`, `elapsedMs`, `tickMs`, `seed`, status/lives/entity counts, and runtime metrics for `step`/`fast`/`full` actions.
- Validation/runtime failures in preview debug sessions must expose `phase`, summary, scoped issues, and actionable hints while actions remain non-crashing (`playStep`/`playFast`/`runToEnd` return `null`, diagnostics status becomes `error`).
- Diagnostics sourcing stays in preview/runtime APIs and overlay rendering remains editor-only; keep `runtime/core` ownership and `runtime/render` read-only responsibilities intact.
- Render baseline collector in `runtime/render/performance-baseline.ts` must stay render-side and replay snapshots without mutating `runtime/core`.
- Baseline command contract: `pnpm simulate:render-baseline [package-json ...]`; when no packages are passed, run `game/examples/td-easy.json`, `game/examples/td-normal.json`, and `game/examples/td-hard.json`.
- Protocol default contract: `restarts=5`, `warmupFrames=8`, `measuredFrames=120`, `seed=1`; supported overrides are `--restarts`, `--warmup-frames`, `--measured-frames`, and `--seed`.
- Memory guardrail contract: `--max-memory-delta-bytes=<threshold>` fails when any package absolute `memoryDeltaBytes` crosses the threshold.
- Output evidence contract: one `protocol` line, per-package metric lines (FPS/frame-time/memory/reuse), and one `aggregate` line for deterministic parsing.

## Schema versioning contract note

- Baseline schema version is `0.2.0` for both `GameProject.meta.version` and `GamePackage.version`.
- Compatibility rules: same-major patch updates are directly compatible; one adjacent minor (`0.1.x -> 0.2.x`) is migratable with deterministic one-way upgrade semantics.
- Unsupported versions fail fast with version-path diagnostics (`/meta/version` or `/version`): major mismatch, future minor, or stale minor outside the one-step migration window.
- Ownership boundaries: parsing/migration helpers stay in `game/schemas`; editor migration entrypoint is `editor/src/editor/api.ts`; runtime migration entrypoint is `runtime/core/engine.ts` before template semantic validation.

## RPG topdown schema contract note

- `game/schemas/rpg-topdown.schema.json` defines RPG MVP payload contract sections for `map`, `entities`, and `rules`, including walkable metadata, stat blocks, spawn/layout, and tick/combat baseline constraints.
- `game/schemas/game-project.schema.json` and `game/schemas/game-package.schema.json` must keep template-aware branches (`tower-defense`, `rpg-topdown`) aligned whenever either branch evolves.
- RPG schema onboarding fixtures are `game/examples/rpg-topdown-mvp.project.json` and `game/examples/rpg-topdown-mvp.package.json`; regression tests must keep both valid fixture pass and invalid-state rejection deterministic.
- Runtime/editor semantic ownership for RPG remains in follow-up template tasks (`T-025`, `T-026`); this contract loop must not move semantic logic out of template validators/runtime entrypoints.

## Template SDK core contract note

- Template registry orchestration stays in `runtime/core/engine.ts`; keep editor/import flows routed through runtime entrypoints.
- `registerTemplate()` fail-fast contract rejects invalid `templateId`, missing/invalid hooks (`validate`, `createWorld`, `step`), and duplicate `templateId`.
- `validateRuntimePackage()` is the shared runtime validation entrypoint for template resolution and template-level semantic checks.
- Unknown-template diagnostics must use `/templateId` + `unknown template: <templateId>`; runtime entrypoints (`loadPackage`, `runScenario`, `runBatch`) fail fast with that contract.
- `editor/src/editor/api.ts` consumes runtime validation orchestration while template validators retain semantic validation responsibility.

## Output Artifacts

- Run reports: `docs/ai/run-logs/YYYY-MM-DD/<timestamp>.json`
- Commit memory: `docs/ai/commit-log/YYYY-MM.md`
- Weekly context: `docs/ai/weekly-summary.md`
