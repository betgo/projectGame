import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const taskPath = path.join(projectRoot, "docs/ai/tasks/T-014-three-render-baseline.md");
const loopStatusPath = path.join(projectRoot, "docs/ai/ai-loop-status.md");
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

describe("T-014 three-render-baseline scope contract", () => {
  it("defines in-scope and out-of-scope boundaries for render baseline", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const scope = readSection("Scope", taskDoc);

    const expectedInScope = [
      "Define a render baseline contract that maps `RenderSnapshot` data to deterministic placeholder visuals for map cells, path, towers, and enemies.",
      "Keep rendering logic inside `runtime/render` and editor preview integration points only, without introducing simulation-side mutations.",
      "Define lifecycle expectations for render session create/update/dispose behavior so repeated preview runs remain stable.",
      "Define minimum regression coverage for render snapshot mapping and lifecycle cleanup behaviors."
    ];
    const expectedOutOfScope = [
      "Camera interaction, orbit controls, and advanced navigation UX (covered by `T-015`).",
      "Render performance optimization baseline and profiling contracts (covered by `T-016`).",
      "Debug overlay, runtime diagnostics HUD, or developer visualization tools (covered by `T-017`).",
      "High-fidelity art asset pipeline, PBR materials, and shader-level visual effects."
    ];

    for (const item of [...expectedInScope, ...expectedOutOfScope]) {
      expect(scope).toContain(`- ${item}`);
    }
  });

  it("keeps acceptance checklist measurable and aligned with subtask lifecycle", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const acceptanceCriteria = readSection("Acceptance Criteria", taskDoc)
      .split("\n")
      .map(normalizeMarkdownLine)
      .filter((line) => line.startsWith("- ["));

    const expectedCriteria = [
      "[S1] Scope and acceptance contract explicitly defines render boundaries, lifecycle expectations, and out-of-scope constraints for `T-014`.",
      "[S2] Three.js baseline renders map/path/tower/enemy placeholders from `RenderSnapshot` without mutating runtime simulation state.",
      "[S3] Render lifecycle regression tests cover create/update/dispose and repeated preview session cleanup behavior.",
      "[S4] Render contract docs are synchronized when contract-level files change, with risk and rollback notes updated in this task.",
      "[S5] Task closure evidence includes passing `pnpm gate:fast`, `pnpm gate:full`, and `pnpm docs:sync-check` plus memory finalize artifacts."
    ];

    expect(acceptanceCriteria).toHaveLength(expectedCriteria.length);

    for (const criterion of expectedCriteria) {
      expect(acceptanceCriteria.some((line) => line.endsWith(criterion))).toBe(true);
    }

    for (const line of acceptanceCriteria.slice(0, 4)) {
      expect(line.startsWith("- [x]")).toBe(true);
    }
    expect(acceptanceCriteria[4].startsWith("- [x]")).toBe(true);
  });

  it("marks all subtasks complete after S5 closure", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const subtasks = readSection("Subtasks", taskDoc)
      .split("\n")
      .map(normalizeMarkdownLine)
      .filter((line) => line.startsWith("- ["));

    expect(subtasks).toContain("- [x] [S1] Define scope and acceptance criteria");
    expect(subtasks).toContain("- [x] [S2] Implement scoped code changes");
    expect(subtasks).toContain("- [x] [S3] Pass fast and full gates");
    expect(subtasks).toContain("- [x] [S4] Update docs and risk notes");
    expect(subtasks).toContain("- [x] [S5] Milestone commit and memory finalize");
  });

  it("synchronizes render contract docs and updates risk rollback notes for S4", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const s4Notes = readSection("S4 Documentation and Risk Notes (2026-02-16)", taskDoc);
    const risksAndRollback = readSection("Risks and Rollback", taskDoc);

    for (const docPath of renderContractDocPaths) {
      const docContent = fs.readFileSync(path.join(projectRoot, docPath), "utf-8");
      const renderContractNote = readSection("Render contract note", docContent);

      expect(renderContractNote).toContain("`runtime/core/types.ts`");
      expect(renderContractNote).toContain("immutable `map` and `path`");
      expect(s4Notes).toContain(`\`${docPath}\``);
    }

    expect(risksAndRollback).toContain("Render contract docs may drift from `runtime/core/types.ts`");
    expect(risksAndRollback).toContain("`README.md`");
    expect(risksAndRollback).toContain("`docs/ai/README.md`");
    expect(risksAndRollback).toContain("`docs/ai/workflows/continuous-loop.md`");
    expect(risksAndRollback).toContain("`docs/ai/tasks/T-014-three-render-baseline.md`");
    expect(risksAndRollback).toContain("`tests/integration/three-render-baseline-scope-doc-contract.test.ts`");
  });

  it("closes S5 with memory artifacts and task status finalization evidence", () => {
    const taskDoc = fs.readFileSync(taskPath, "utf-8");
    const statusMatch = taskDoc.match(/^- Status:\s*(.+)$/m);
    const s5Closure = readSection("S5 Memory Finalization and Task Closure (2026-02-16)", taskDoc);

    expect(statusMatch?.[1].trim()).toBe("Done");
    expect(s5Closure).toContain("`pnpm gate:fast`");
    expect(s5Closure).toContain("`pnpm gate:full`");
    expect(s5Closure).toContain("`pnpm docs:sync-check`");
    expect(s5Closure).toContain("`bash tools/git-memory/append-commit-log.sh --missing HEAD`");
    expect(s5Closure).toContain("`bash tools/git-memory/update-weekly-summary.sh`");
    expect(s5Closure).toContain("`docs/ai/commit-log/2026-02.md`");
    expect(s5Closure).toContain("`docs/ai/weekly-summary.md`");
    expect(s5Closure).toContain("`docs/ai/ai-loop-status.md`");
    expect(s5Closure).toContain("status to `Done`");
    expect(s5Closure).toContain("no runtime/render contract files were changed");
  });

  it("updates loop status board to closed S5 handoff state", () => {
    const loopStatus = fs.readFileSync(loopStatusPath, "utf-8");

    expect(loopStatus).toContain("- 当前阶段: 子任务收口完成");
    expect(loopStatus).toContain("- 当前子任务: [S5] Milestone commit and memory finalize");
    expect(loopStatus).toContain("- 下一个子任务: 无");
    expect(loopStatus).toContain("`pnpm task:next`");
  });
});
