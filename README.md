# projectGame

AI-native 3D map editor platform (v1) with tower-defense template, deterministic runtime,
and local-first AI memory governance.

## What is included

- Browser editor: map grid, rules inspector, wave panel, preview controls.
- Runtime core: fixed-tick deterministic simulation.
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

## Batch simulation contract

- Command shape: `pnpm simulate:batch <package> <rounds>`
- Determinism: default seed sequence is `1..rounds`; same package + same rounds yields deterministic aggregate metrics.
- Input validation: package path and rounds are required; rounds must be a positive integer; package JSON must be readable and pass runtime validation.
- Performance baseline command (reproducible): `pnpm simulate:batch game/examples/td-normal.json 100 --max-imbalance=0.6000`
- Performance threshold: `imbalanceIndex <= 0.6000` (CLI exits with code `1` when threshold is exceeded).
- Output fields (single line, parseable): `sampleSize=<int> winRate=<ratio> avgDuration=<ms> leakRate=<ratio> imbalanceIndex=<score>`
- Imbalance index formula: `abs(0.5 - winRate) + leakRate * 0.02`

## Git memory workflow

```bash
bash tools/git-memory/install.sh
bash tools/git-memory/new-task.sh 0002 "tower-defense-wave-editor"
bash tools/git-memory/append-commit-log.sh --missing HEAD
bash tools/git-memory/finalize-task.sh
```

## Key paths

- `editor/` - React + Vite editor UI.
- `runtime/` - runtime core, template systems, render adapter.
- `game/schemas/` - JSON Schema definitions.
- `game/examples/` - sample game packages.
- `ai/` - package generation and optimization pipeline.
- `tools/simulate/` - headless scenario and batch tools.
- `tests/` - schema, determinism, integration, smoke tests.
- `docs/ai/` - governance docs, prompts, and memory logs.
