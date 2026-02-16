import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const taskPath = path.join(projectRoot, "docs/ai/tasks/T-015-render-interaction-and-camera.md");
const renderContractDocPaths = [
  "README.md",
  "docs/ai/README.md",
  "docs/ai/workflows/continuous-loop.md"
] as const;

function readSection(title: string, content: string): string {
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`## ${escaped}\\n\\n([\\s\\S]*?)(?=\\n## |$)`);
  const match = content.match(pattern);
  if (!match) {
    throw new Error(`missing section: ${title}`);
  }
  return match[1].trim();
}

function normalizeMarkdownLine(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

describe("T-015 render-interaction-and-camera S4 doc contract", () => {
  it("defines scope boundaries for camera interaction, resize lifecycle, and selection affordance", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const scope = readSection("Scope", taskDoc);

    const expectedInScope = [
      "Define camera interaction contract for editor preview, including orbit/pan/zoom defaults, deterministic clamp ranges, and input mapping expectations.",
      "Define resize-handling contract for preview container lifecycle (`mount -> resize -> dispose`) so renderer size/aspect updates remain stable.",
      "Define selection affordance contract for tower/enemy placeholders, including highlight entry/exit behavior and non-selected fallback state.",
      "Define regression and documentation coverage expectations for interaction + camera behavior without crossing runtime architecture boundaries.",
      "Keep implementation boundaries inside `runtime/render` and editor preview integration (`editor/src/editor/components`) only; do not mutate `runtime/core` simulation state."
    ];
    const expectedOutOfScope = [
      "Cinematic camera rails, keyframe animation tracks, and advanced scene-directing workflows.",
      "Render performance baseline/profiling thresholds (covered by `T-016`).",
      "Debug overlay or runtime diagnostics UI additions (covered by `T-017`).",
      "Inspector form UX redesign or editing workflow polish unrelated to camera/selection behavior (covered by `T-018`)."
    ];

    for (const item of [...expectedInScope, ...expectedOutOfScope]) {
      expect(scope).toContain(`- ${item}`);
    }
  });

  it("keeps acceptance criteria measurable and aligned to S1-S5 lifecycle", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const acceptanceCriteria = readSection("Acceptance Criteria", taskDoc)
      .split("\n")
      .map(normalizeMarkdownLine)
      .filter((line) => line.startsWith("- ["));

    const expectedCriteria = [
      "[S1] Scope and acceptance contract explicitly defines camera interaction boundaries, resize lifecycle expectations, selection affordance behavior, and out-of-scope constraints for `T-015`.",
      "[S2] Camera defaults (orbit/pan/zoom) are implemented with deterministic clamp behavior and remain isolated to preview render layer + editor integration points.",
      "[S3] Regression tests cover camera interaction mapping, resize stability, and selection highlight behavior for tower/enemy placeholders.",
      "[S4] Contract-level changes update `README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md` in the same loop, with task risk/rollback notes synchronized.",
      "[S5] Task closure evidence includes passing `pnpm gate:fast`, `pnpm gate:full`, and `pnpm docs:sync-check` plus memory-finalize artifacts."
    ];

    expect(acceptanceCriteria).toHaveLength(expectedCriteria.length);

    for (const criterion of expectedCriteria) {
      expect(acceptanceCriteria.some((line) => line.endsWith(criterion))).toBe(true);
    }

    for (const line of acceptanceCriteria.slice(0, 4)) {
      expect(line.startsWith("- [x]")).toBe(true);
    }
    expect(acceptanceCriteria[4].startsWith("- [ ]")).toBe(true);
  });

  it("marks S1-S4 complete while keeping S5 pending with gate evidence retained", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const subtasks = readSection("Subtasks", taskDoc)
      .split("\n")
      .map(normalizeMarkdownLine)
      .filter((line) => line.startsWith("- ["));
    const s3Notes = readSection("S3 Implementation Notes (2026-02-16)", taskDoc);

    expect(subtasks).toContain("- [x] [S1] Define scope and acceptance criteria");
    expect(subtasks).toContain("- [x] [S2] Implement scoped code changes");
    expect(subtasks).toContain("- [x] [S3] Pass fast and full gates");
    expect(subtasks).toContain("- [x] [S4] Update docs and risk notes");
    expect(subtasks).toContain("- [ ] [S5] Milestone commit and memory finalize");
    expect(s3Notes).toContain("`pnpm gate:fast`");
    expect(s3Notes).toContain("`pnpm gate:full`");
  });

  it("synchronizes docs and risk notes for S4 without breaking architecture boundaries", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const s4Notes = readSection("S4 Documentation and Risk Notes (2026-02-16)", taskDoc);
    const risksAndRollback = readSection("Risks and Rollback", taskDoc);

    for (const docPath of renderContractDocPaths) {
      const docContent = fs.readFileSync(path.join(projectRoot, docPath), "utf-8");
      const renderContractNote = readSection("Render contract note", docContent);

      expect(renderContractNote).toContain("`runtime/core/types.ts`");
      expect(renderContractNote).toContain("`runtime/render/three-adapter.ts`");
      expect(renderContractNote).toContain("orbit");
      expect(renderContractNote).toContain("resize");
      expect(renderContractNote.toLowerCase()).toContain("selection");
      expect(renderContractNote).toContain("`runtime/core`");
      expect(s4Notes).toContain(`\`${docPath}\``);
    }

    expect(risksAndRollback).toContain("Scope drift may mix interaction/camera delivery");
    expect(risksAndRollback).toContain("Render interaction docs may drift across `README.md`");
    expect(risksAndRollback).toContain("`README.md`");
    expect(risksAndRollback).toContain("`docs/ai/README.md`");
    expect(risksAndRollback).toContain("`docs/ai/workflows/continuous-loop.md`");
    expect(risksAndRollback).toContain("`docs/ai/tasks/T-015-render-interaction-and-camera.md`");
    expect(risksAndRollback).toContain("`tests/integration/render-interaction-camera-scope-doc-contract.test.ts`");
  });

  it("documents S2 implementation boundaries and interaction coverage artifacts", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const s2Notes = readSection("S2 Implementation Notes (2026-02-16)", taskDoc);
    const changeList = readSection("Change List", taskDoc);

    expect(s2Notes).toContain("deterministic clamp");
    expect(s2Notes).toContain("resize");
    expect(s2Notes).toContain("selection");
    expect(s2Notes).toContain("`runtime/core`");
    expect(changeList).toContain("`runtime/render/three-adapter.ts`");
    expect(changeList).toContain("`editor/src/editor/components/PreviewControls.tsx`");
    expect(changeList).toContain("`tests/integration/three-render-adapter-interaction.test.ts`");
  });
});
