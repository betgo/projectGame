import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const taskPath = path.join(projectRoot, "docs/ai/tasks/T-017-preview-debug-overlay.md");
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

describe("T-017 preview-debug-overlay S4 docs contract", () => {
  it("defines debug diagnostics scope and out-of-scope boundaries", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const scope = readSection("Scope", taskDoc);

    const expectedInScope = [
      "Define a preview debug-overlay contract for runtime diagnostics (`tick`, elapsed time, `seed`, and key simulation metrics) that can be read in-step with preview actions.",
      "Define error-diagnostics contract for validation/runtime failures with actionable hints while preserving non-crashing preview flow.",
      "Define architecture boundaries so diagnostics data sourcing stays in existing preview/runtime APIs and overlay rendering stays in editor UI integration (`editor/src/editor/components`).",
      "Define regression-test expectations for diagnostics visibility, error fallback behavior, and reset/replay consistency.",
      "Keep implementation boundaries aligned with `ARCHITECTURE_RULES.md`: `runtime/core` remains simulation owner and `runtime/render` stays read-only."
    ];
    const expectedOutOfScope = [
      "Remote telemetry backend integration, cloud log shipping, or external monitoring dashboards.",
      "New gameplay mechanics, schema redesign, or runtime balance changes unrelated to debug visibility.",
      "Camera-control redesign, render-baseline optimization work, or inspector-form UX polish (covered by `T-015`, `T-016`, and `T-018`).",
      "Multi-template packaging workflow changes, AI generation policy updates, or release automation changes."
    ];

    for (const item of [...expectedInScope, ...expectedOutOfScope]) {
      expect(scope).toContain(`- ${item}`);
    }
  });

  it("keeps acceptance criteria measurable and marks S1-S4 as complete", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const acceptanceCriteria = readSection("Acceptance Criteria", taskDoc)
      .split("\n")
      .map(normalizeMarkdownLine)
      .filter((line) => line.startsWith("- ["));

    const expectedCriteria = [
      "[S1] Scope and acceptance contract explicitly defines debug-overlay diagnostics surface, error-handling boundaries, architecture constraints, and out-of-scope limits for `T-017`.",
      "[S2] Preview debug overlay renders tick/elapsed/seed/key metrics and surfaces validation/runtime error summaries with actionable hints without breaking preview flow.",
      "[S3] Regression tests cover diagnostics rendering, error visibility, and non-crashing behavior across preview step/fast/full/reset paths.",
      "[S4] If contract-level files change (`runtime/core`, `game/schemas`, `ai`), sync `README.md`, `docs/ai/README.md`, and `docs/ai/workflows/continuous-loop.md` in the same loop with task risk/rollback notes updated.",
      "[S5] Task closure evidence includes passing `pnpm gate:fast`, `pnpm gate:full`, and `pnpm docs:sync-check` plus memory-finalize artifacts."
    ];

    expect(acceptanceCriteria).toHaveLength(expectedCriteria.length);

    for (const criterion of expectedCriteria) {
      expect(acceptanceCriteria.some((line) => line.endsWith(criterion))).toBe(true);
    }

    for (const line of acceptanceCriteria.slice(0, 4)) {
      expect(line.startsWith("- [x]")).toBe(true);
    }
    for (const line of acceptanceCriteria.slice(4)) {
      expect(line.startsWith("- [ ]")).toBe(true);
    }
  });

  it("tracks subtask checklist state for S4 completion", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const subtasks = readSection("Subtasks", taskDoc)
      .split("\n")
      .map(normalizeMarkdownLine)
      .filter((line) => line.startsWith("- ["));

    expect(subtasks).toContain("- [x] [S1] Define scope and acceptance criteria");
    expect(subtasks).toContain("- [x] [S2] Implement scoped code changes");
    expect(subtasks).toContain("- [x] [S3] Pass fast and full gates");
    expect(subtasks).toContain("- [x] [S4] Update docs and risk notes");
    expect(subtasks).toContain("- [ ] [S5] Milestone commit and memory finalize");
  });

  it("synchronizes preview debug-overlay docs and S4 risk notes", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const s4Notes = readSection("S4 Documentation and Risk Notes (2026-02-16)", taskDoc);

    for (const docPath of renderContractDocPaths) {
      const docContent = fs.readFileSync(path.join(projectRoot, docPath), "utf-8");
      const renderContractNote = readSection("Render contract note", docContent);

      expect(renderContractNote).toContain("`editor/src/editor/api.ts`");
      expect(renderContractNote).toContain("`editor/src/editor/components/PreviewControls.tsx`");
      expect(renderContractNote).toContain("playStep");
      expect(renderContractNote).toContain("playFast");
      expect(renderContractNote).toContain("runToEnd");
      expect(renderContractNote).toContain("`runtime/core`");
      expect(renderContractNote).toContain("`runtime/render`");
      expect(s4Notes).toContain(`\`${docPath}\``);
    }

    expect(s4Notes).toContain("non-crashing");
    expect(s4Notes).toContain("`runtime/core`");
    expect(s4Notes).toContain("`runtime/render`");
  });

  it("documents S1-S4 notes, gate evidence, and rollback scope", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const statusMatch = taskDoc.match(/^- Status:\s*(.+)$/m);
    const s1Notes = readSection("S1 Implementation Notes (2026-02-16)", taskDoc);
    const s3Notes = readSection("S3 Implementation Notes (2026-02-16)", taskDoc);
    const s4Notes = readSection("S4 Documentation and Risk Notes (2026-02-16)", taskDoc);
    const changeList = readSection("Change List", taskDoc);
    const risksAndRollback = readSection("Risks and Rollback", taskDoc);

    expect(statusMatch?.[1].trim()).toBe("In Progress");
    expect(s1Notes).toContain("planning-only scope");
    expect(s1Notes).toContain("`S1-S5`");
    expect(s1Notes).toContain("architecture boundary");
    expect(s3Notes).toContain("`pnpm gate:fast`");
    expect(s3Notes).toContain("`pnpm gate:full`");
    expect(s3Notes).toContain("contract-level files");
    expect(s4Notes).toContain("`README.md`");
    expect(s4Notes).toContain("`docs/ai/README.md`");
    expect(s4Notes).toContain("`docs/ai/workflows/continuous-loop.md`");
    expect(s4Notes).toContain("non-crashing");
    expect(changeList).toContain("`README.md`");
    expect(changeList).toContain("`docs/ai/README.md`");
    expect(changeList).toContain("`docs/ai/workflows/continuous-loop.md`");
    expect(changeList).toContain("`tests/integration/preview-debug-overlay-scope-doc-contract.test.ts`");
    expect(risksAndRollback).toContain("Scope drift may mix debug-overlay delivery");
    expect(risksAndRollback).toContain("`runtime/core`");
    expect(risksAndRollback).toContain("Preview debug-overlay docs may drift");
    expect(risksAndRollback).toContain("`README.md`");
    expect(risksAndRollback).toContain("`docs/ai/README.md`");
    expect(risksAndRollback).toContain("`docs/ai/workflows/continuous-loop.md`");
    expect(risksAndRollback).toContain("`editor/src/editor/api.ts`");
    expect(risksAndRollback).toContain("`editor/src/editor/components/PreviewControls.tsx`");
    expect(risksAndRollback).toContain("`docs/ai/tasks/T-017-preview-debug-overlay.md`");
    expect(risksAndRollback).toContain("`tests/integration/preview-debug-overlay-scope-doc-contract.test.ts`");
  });
});
