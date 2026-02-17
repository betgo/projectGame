# projectGame

AI-native 3D map editor platform (v1) with tower-defense template, deterministic runtime,
and local-first AI memory governance.

## What is included

- Browser editor: map grid, rules inspector, wave panel, preview controls.
- Runtime core: fixed-tick deterministic simulation.
- Three render baseline: deterministic map/path/tower/enemy placeholders from immutable `RenderSnapshot`.
- Template plugin: `tower-defense` systems + semantic validator.
- AI pipeline: provider abstraction + mock provider + OpenAI adapter placeholder.
- Data contracts: JSON Schemas + examples.
- Collaboration governance: trunk-based workflow, hooks, prompts, commit memory logs.

## Quick start

```bash
pnpm install
pnpm dev
```

## Core scripts

```bash
pnpm build
pnpm dev
pnpm typecheck
pnpm lint
pnpm test
pnpm test:schema
pnpm test:determinism
pnpm test:smoke-ai-package
pnpm gate:fast
pnpm gate:full
pnpm docs:sync-check
pnpm simulate:scenario game/examples/td-easy.json 1
pnpm simulate:batch game/examples/td-easy.json 100
pnpm dev:loop -- --issue-id <id> --task-file <task.md>
```

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

- `RenderSnapshot` in `runtime/core/types.ts` includes immutable `map` and `path` fields for deterministic preview placeholder rendering.
- `runtime/render` consumes snapshot data in read-only mode and must not mutate runtime simulation state.
- Camera interaction contract in `runtime/render/three-adapter.ts`: left drag = orbit, shift/right drag = pan, wheel = zoom, with deterministic clamp ranges for distance/pitch/pan bounds.
- Resize lifecycle contract stays `mount -> resize -> dispose`, where renderer size and camera projection updates remain synchronized with preview container dimensions.
- Selection affordance contract applies hover highlight only to tower/enemy placeholders and restores fallback colors when selection exits, without mutating `runtime/core` state.
- Preview debug-overlay contract in `editor/src/editor/api.ts` + `editor/src/editor/components/PreviewControls.tsx` exposes `tick`, `elapsedMs`, `tickMs`, `seed`, status/lives/entity counts, and runtime metrics for `step`/`fast`/`full` actions.
- Validation/runtime failures in preview debug sessions must surface `phase`, summary, scoped issues, and actionable hints while actions remain non-crashing (`playStep`/`playFast`/`runToEnd` return `null` on failure and diagnostics status becomes `error`).
- Diagnostics sourcing stays in preview/runtime APIs and overlay rendering remains in editor UI; keep `runtime/core` simulation ownership and `runtime/render` read-only boundaries intact.
- Render baseline collector in `runtime/render/performance-baseline.ts` stays render-side only and samples replayed snapshots without mutating `runtime/core` gameplay state.
- Render performance baseline command: `pnpm simulate:render-baseline [package-json ...]` (defaults to `game/examples/td-easy.json`, `game/examples/td-normal.json`, and `game/examples/td-hard.json`).
- Baseline protocol defaults: `restarts=5`, `warmupFrames=8`, `measuredFrames=120`, `seed=1`; override via `--restarts`, `--warmup-frames`, `--measured-frames`, and `--seed`.
- Memory-growth guardrail option `--max-memory-delta-bytes=<threshold>` fails the command when any package absolute `memoryDeltaBytes` exceeds the threshold.
- Parseable report contract is `protocol` line + per-package lines (`fps`, frame-time percentiles, memory trend, reuse ratio) + one `aggregate` line.

## Batch simulation contract

- Command shape: `pnpm simulate:batch <package> <rounds>`
- Determinism: default seed sequence is `1..rounds`; same package + same rounds yields deterministic aggregate metrics.
- Input validation: package path and rounds are required; rounds must be a positive integer; package JSON must be readable and pass runtime validation.
- Performance baseline command (reproducible): `pnpm simulate:batch game/examples/td-normal.json 100 --max-imbalance=0.6000`
- Performance threshold: `imbalanceIndex <= 0.6000` (CLI exits with code `1` when threshold is exceeded).
- Output fields (single line, parseable): `sampleSize=<int> winRate=<ratio> avgDuration=<ms> leakRate=<ratio> imbalanceIndex=<score>`
- Imbalance index formula: `abs(0.5 - winRate) + leakRate * 0.02`

## Schema versioning contract

- Baseline schema version is `0.2.0` for both `GameProject.meta.version` and `GamePackage.version`.
- Compatibility rules: same-major patch updates are directly compatible; one adjacent minor (`0.1.x -> 0.2.x`) is migratable with deterministic one-way upgrade semantics.
- Unsupported versions fail fast with version-path diagnostics (`/meta/version` or `/version`): major mismatch, future minor, or stale minor outside the one-step migration window.
- Ownership boundaries: version parsing/migration helpers stay in `game/schemas`; editor load path upgrades in `editor/src/editor/api.ts`; runtime load path upgrades in `runtime/core/engine.ts` before template semantic validation.

## RPG topdown schema contract

- `game/schemas/rpg-topdown.schema.json` defines MVP payload structure for RPG `map`, `entities`, and `rules` domains (walkable metadata, stat blocks, spawn/layout, tick/combat config).
- Template-aware branches in `game/schemas/game-project.schema.json` and `game/schemas/game-package.schema.json` support both `tower-defense` and `rpg-topdown` without changing tower-defense schema behavior.
- RPG onboarding fixtures live in `game/examples/rpg-topdown-mvp.project.json` and `game/examples/rpg-topdown-mvp.package.json` for deterministic schema regression coverage.
- Semantic/runtime behavior for RPG templates remains out of scope for this contract task and stays owned by downstream runtime/editor template subtasks.

## Template SDK core contract

- Template registry orchestration stays in `runtime/core/engine.ts`; editor/runtime callers should not bypass it.
- `registerTemplate()` fails fast when `templateId` is invalid, required hooks (`validate`, `createWorld`, `step`) are missing/invalid, or `templateId` is already registered.
- `validateRuntimePackage()` is the shared runtime entrypoint for template resolution and template-level semantic validation diagnostics.
- Unknown template diagnostics use path `/templateId` and message `unknown template: <templateId>`; `loadPackage`/`runScenario`/`runBatch` fail fast on that contract.
- `editor/src/editor/api.ts` consumes runtime validation orchestration while template validators remain responsible for template-specific semantic checks.

## Git memory workflow

```bash
bash tools/git-memory/install.sh
bash tools/git-memory/new-task.sh 0002 "tower-defense-wave-editor"
pnpm task:next
bash tools/git-memory/append-commit-log.sh --missing HEAD
bash tools/git-memory/finalize-task.sh
```

## Roadmap

- v1 completed roadmap: `docs/ai/tasks/T-ROADMAP-v1-editor-platform.md`
- active 6-month roadmap: `docs/ai/tasks/T-ROADMAP-6M-render-first-platform.md`

## Key paths

- `editor/` - React + Vite editor UI.
- `runtime/` - runtime core, template systems, render adapter.
- `game/schemas/` - JSON Schema definitions.
- `game/examples/` - sample game packages.
- `ai/` - package generation and optimization pipeline.
- `tools/simulate/` - headless scenario and batch tools.
- `tests/` - schema, determinism, integration, smoke tests.
- `docs/ai/` - governance docs, prompts, and memory logs.
