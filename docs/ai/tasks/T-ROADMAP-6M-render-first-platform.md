# T-ROADMAP: 6M Render-First Platform Expansion (2026-02-16 ~ 2026-08-31)

- Status: Planned
- Owner: maintainer
- Priority: 3D rendering experience first
- Branch rule: `main`
- Delivery rule: `1 Issue = 1 PR`

## Brief Summary

- Baseline: `I001-I012` is completed (v1 closed loop delivered).
- Strategy: strengthen 3D rendering and preview experience first, then expand templates and delivery capabilities.
- Cadence: each issue follows `S1-S4` loop closure (spec -> implement+gate -> docs -> finalize+task commit).

## Phase Plan

### Phase A (2026-02-16 ~ 2026-03-31): v1.1 Render-first Stabilization

Goal: upgrade preview + Three.js rendering from runnable to production-usable and diagnosable.

1. I013 `preview-consistency-and-error-handling`
2. I014 `three-render-baseline`
3. I015 `render-interaction-and-camera`
4. I016 `render-performance-baseline`
5. I017 `preview-debug-overlay`

Phase DoD:
- preview/headless key metrics are consistent for same package + seed.
- render loop is stable (no obvious leak, no crash under repeated preview sessions).
- `pnpm gate:fast`, `pnpm gate:full`, `pnpm docs:sync-check` pass.

### Phase B (2026-04-01 ~ 2026-04-30): v1.2 Editor UX & Data Reliability

Goal: improve editing ergonomics and reduce invalid package runtime failures.

1. I018 `inspector-form-ux-polish`
2. I019 `map-editing-ergonomics`
3. I020 `schema-versioning-and-migration-lite`
4. I021 `import-export-diagnostics`
5. I022 `golden-pack-regression-suite`

Phase DoD:
- editor and import/export errors are actionable and documented.
- lightweight migration strategy exists and old package replay checks pass.

### Phase C (2026-05-01 ~ 2026-06-30): v2.0 Multi-template Foundation

Goal: add second template foundation without breaking TD stability.

1. I023 `template-sdk-core`
2. I024 `rpg-topdown-mvp-schema`
3. I025 `rpg-runtime-min-systems`
4. I026 `editor-template-switching`
5. I027 `ai-multi-template-package-generation`
6. I028 `cross-template-batch-simulation`

Phase DoD:
- TD and RPG-topdown packages are both generatable, validatable, and previewable.
- AI pipeline supports template routing with smoke coverage.

### Phase D (2026-07-01 ~ 2026-08-31): v2.5 Delivery & Collaboration Readiness

Goal: move from local-only development to team-ready delivery quality.

1. I029 `asset-pipeline-lite`
2. I030 `playtest-reporting-dashboard-local`
3. I031 `release-candidate-checklist-automation`
4. I032 `docs-and-onboarding-pack`
5. I033 `optional-share-readonly-package`
6. I034 `qa-hardening-and-fault-injection`

Phase DoD:
- new contributor can run local delivery loop in one day using docs only.
- release candidate has fixed gate criteria and reproducible reporting artifacts.

## Planned Public APIs / Interfaces / Types

## Render API (Phase A)

- `createRenderSession(container, options): RenderSession`
- `updateRenderSnapshot(session, snapshot): void`
- `disposeRenderSession(session): void`
- `setRenderDebugOverlay(session, debugState): void`

Planned types:
- `RenderEntityView { id, kind, x, y, z?, state }`
- `RenderFrameStats { fps, frameMs, drawCalls, entities }`
- `PreviewErrorView { code, message, hint, source }`

## Editor / Runtime Contract (Phase A-B)

- `startPreview(project, seed, options): PreviewSession`
- `getPreviewDiagnostics(session): PreviewDiagnostics`
- `validateProject(project, mode): ValidationReport` (`strict | compat`)

## Template SDK (Phase C)

- `registerTemplate(templateDef): void`
- `TemplateDefinition { id, schemas, validators, runtimeSystems, editorPanels }`
- `generatePackageFromPrompt(prompt, templateId, constraints): Promise<GamePackage>`

## Mandatory Test Matrix

- Determinism: same package + same seed must produce identical result.
- Preview consistency: preview and headless key metrics must match.
- Render regression: snapshot update, object lifecycle, camera/resize/dispose.
- Schema/semantic: invalid package must fail with readable diagnostics.
- AI smoke: prompt -> package -> validate -> simulate end-to-end.
- Performance baseline:
  - batch 100-round threshold tracked continuously;
  - render baseline (FPS/CPU/memory) reviewed per phase.
- Docs contract: command contracts in `README.md` and `docs/ai/workflows/continuous-loop.md` stay aligned.

## Governance Rules (Fixed)

- Branch policy: `main` only.
- Delivery granularity: `1 Issue = 1 PR`.
- Subtask lifecycle: `S1 spec`, `S2 implementation+gates`, `S3 docs`, `S4 memory finalize + task-level commit`.
- Milestone commits must include `Prompt-Refs`.

## Immediate Next Actions

1. Complete `T-013`.
2. Start `I014` task card `three-render-baseline`.
3. Execute `I015 -> I016 -> I017` sequentially.
4. Hold phase review on 2026-03-31 and decide entry to Phase B.

## Assumptions and Defaults

- Stack remains: TypeScript + React + Three.js + AJV + Vitest + pnpm.
- AI provider remains provider-agnostic, with replaceable adapter implementation.
- Target platform: desktop Chrome latest.
- Priority lock: improve 3D rendering experience without sacrificing determinism or quality gates.
